---
id: api-design-pagination
title: Resources, retries, and pages that hold still
slug: api-design-pagination
kind: concept
track: system-design
difficulty: core
estimated_minutes: 16
summary: Design HTTP APIs around resources and their invariants, make writes safe to retry with idempotency keys, page with cursors instead of offsets, and evolve versions without breaking callers.
tags:
  - system-design
  - system-design/foundations
  - cs
  - cs/networking
  - interviews
  - interviews/system-design
prerequisites:
  - http-and-tcp
related:
  - http-and-tcp
  - payment-idempotency
  - news-feed
  - url-shortener
  - queues-delivery
company_signal: []
sources_consulted:
  - https://www.rfc-editor.org/rfc/rfc9110.html
  - https://www.rfc-editor.org/rfc/rfc9457.html
  - https://www.rfc-editor.org/rfc/rfc8288.html
  - https://docs.stripe.com/api/idempotent_requests
  - https://docs.stripe.com/api/pagination
updated: 2026-10-28
status: canonical
---

# Resources, retries, and pages that hold still

## Snapshot

- Model the nouns the client cares about (`/inboxes/{id}/messages`) and use HTTP methods for their defined meanings.
- POST is not idempotent by default. A server-supported idempotency key lets a client retry a create without creating twice.
- Offset pagination (`?offset=40&limit=20`) skips or repeats items when rows are inserted or deleted between pages, and gets slower as the offset grows.
- Cursor (keyset) pagination remembers the last item's sort key plus a unique tiebreaker and asks for "items after this one."
- Version by adding fields compatibly first; introduce a new version only for a breaking change, and announce deprecation with a date.

## Why it shows up in interviews

The API is the contract every other part of the design must honor. Interviewers use it to check whether you think about clients that retry, lists that change while someone scrolls, and old mobile apps that cannot be updated. A ten-line API sketch with clear identifiers, error shapes, and a pagination rule answers many later questions before they are asked.

## Core idea

### ELI5

Each thing has an address. Reading never changes it. Creating a thing returns its address, and asking to create it again with the same ticket returns the same address. A long list is read in pages, and each page hands you a bookmark that says exactly where you stopped, so new items arriving at the top do not shift your place.

### Resources and methods

| Need | Request | Notes |
| --- | --- | --- |
| List messages | `GET /inboxes/42/messages?limit=20` | Safe; cacheable if headers allow |
| Read one | `GET /messages/9001` | 404 if absent or not visible to caller |
| Create | `POST /inboxes/42/messages` + `Idempotency-Key` | 201 with `Location`; retry returns same result |
| Replace | `PUT /messages/9001/labels` | Idempotent: same body, same end state |
| Partial update | `PATCH /messages/9001` | Not idempotent in general; depends on the patch format |
| Remove | `DELETE /messages/9001` | Idempotent effect; a repeat may return 404 |

Return errors in one machine-readable shape. RFC 9457 "problem details" (`type`, `title`, `status`, `detail`) is a standard option. Keep authorization failures from leaking whether a resource exists when that matters.

### Idempotency keys

The client generates a unique key per logical operation and sends it on every retry. The server stores `(caller, key) → request fingerprint, status, response` atomically with the effect. A retry with the same key and same body returns the stored response; the same key with a different body is a conflict. Keys expire after a retention window the API documents. This is a server feature: sending a header to a server that ignores it changes nothing.

### Offset versus cursor pagination

**Offset** asks the database to skip N rows and return the next M. If a new message arrives at the top while the user is on page 1, every row shifts down one, and page 2 repeats the last message of page 1. Deleting a row does the opposite and silently skips one. Large offsets also make the database walk and discard rows.

**Cursor** pagination sorts by a stable key, for example `(sent_at DESC, id DESC)`. The cursor encodes the last item's `(sent_at, id)`. The next page is "rows strictly after that pair in sort order," which an index on `(inbox_id, sent_at, id)` serves directly. New rows at the top do not move the bookmark. Encode the cursor opaquely (for example base64 of the fields) so clients do not build their own, and validate it on the server.

Cursors cost something: no "jump to page 37," and changing the sort order invalidates old cursors. A `Link` header (RFC 8288) or a `next_cursor` field tells the client where to go.

### Versioning

Prefer additive changes: new optional fields, new endpoints, new enum values clients are told to tolerate. For a breaking change (removing a field, changing a meaning), choose one versioning scheme and stick to it: a path prefix (`/v2/`), a header, or a dated version pinned per account. Run old and new side by side, measure who still calls the old one, and announce a sunset date.

## Worked example

An inbox lists messages newest first, 3 per page in this example. Messages: `m9 (10:09)`, `m8 (10:08)`, `m7 (10:07)`, `m6 (10:06)`, `m5 (10:05)`.

### Easy

Page 1 returns `m9, m8, m7`, cursor = `(10:07, m7)`. Page 2 asks for items after `(10:07, m7)` and gets `m6, m5`. Nothing new arrived, so offset pagination would give the same result.

### Medium

Between the two requests, `m10 (10:10)` arrives. With offset 3, page 2 is now `m7, m6, m5`: `m7` appears twice. With the cursor, page 2 is still `m6, m5`. The new message appears when the user refreshes the top of the list.

### Hard

Two messages share the timestamp `10:07`: `m7` and `m7b`. A cursor of only `sent_at` cannot say whether `m7b` was already shown. Adding `id` as a tiebreaker makes the order total, so "after `(10:07, m7)`" is precise. The sketch below runs both strategies against the insert.

```ts
type Msg = { id: string; at: number };
const newestFirst = (a: Msg, b: Msg) => b.at - a.at || (b.id < a.id ? -1 : b.id > a.id ? 1 : 0);

function pageAfter(rows: Msg[], limit: number, cursor?: Msg) {
  const sorted = [...rows].sort(newestFirst);
  const start = cursor ? sorted.filter((m) => newestFirst(m, cursor) > 0) : sorted;
  const page = start.slice(0, limit);
  return { ids: page.map((m) => m.id), next: page.length === limit ? page[page.length - 1] : undefined };
}
function pageOffset(rows: Msg[], limit: number, offset: number) {
  return [...rows].sort(newestFirst).slice(offset, offset + limit).map((m) => m.id);
}

const inbox: Msg[] = [9, 8, 7, 6, 5].map((n) => ({ id: "m" + n, at: 1000 + n }));
const first = pageAfter(inbox, 3);
inbox.push({ id: "m10", at: 1010 }); // arrives between page requests
console.log(first.ids, pageAfter(inbox, 3, first.next).ids); // [ 'm9', 'm8', 'm7' ] [ 'm6', 'm5' ]
console.log(pageOffset(inbox, 3, 3)); // [ 'm7', 'm6', 'm5' ]: m7 repeats
```

## Common mistakes

| Trap | What happens | Fix |
| --- | --- | --- |
| Verbs in paths (`/createMessage`) | Methods lose meaning; caches and retries guess | Nouns plus HTTP methods |
| Retrying POST without a key | Duplicate orders or messages | Server-stored idempotency key with fingerprint |
| Offset pagination on a live feed | Repeats and gaps; slow deep pages | Keyset cursor with a unique tiebreaker |
| Cursor on a non-unique column | Items with equal values are skipped or repeated | Add the primary key to the sort and cursor |
| Clients parse the cursor | You can never change its format | Make it opaque and validate it |
| Breaking change without a version | Old apps crash | Additive first; versioned change with a sunset date |

## How to talk about it

"Messages are a sub-resource of an inbox. Create is a POST with an `Idempotency-Key` the server stores with the result, so a mobile retry returns the same message. Listing uses a cursor on `(sent_at, id)` descending, backed by an index on `(inbox_id, sent_at, id)`, so new mail doesn't shift pages. Errors use problem details. New fields are additive; anything breaking goes to a dated version with a published sunset."

## Cross-links

- [HTTP is a conversation, TCP is the pipe](../../cs/http-and-tcp.md) (id: http-and-tcp)
- [Make a payment retry refer to one operation](../cases/payment-idempotency/lesson.md) (id: payment-idempotency)
- [Build a feed with bounded fanout](../cases/news-feed/lesson.md) (id: news-feed)
- [Create and resolve short links safely](../cases/url-shortener/lesson.md) (id: url-shortener)
- [At-least-once, idempotency, and the dead-letter lane](./queues-delivery/lesson.md) (id: queues-delivery)
- [Indexes are precomputed answers](../../cs/indexes.md) (id: indexes)
