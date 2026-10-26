---
id: file-download
title: A download is bytes plus a name
slug: file-download
kind: concept
track: cs
difficulty: core
estimated_minutes: 14
summary: Track durable bytes, object identity, and response ranges so an interrupted download can resume safely.
tags:
  - cs
  - cs/networking
  - interviews
  - interviews/system-design
prerequisites:
  - http-and-tcp
related:
  - http-and-tcp
  - ranged-download
  - chunk-retry
  - request-budget
  - blob-store
company_signal: []
sources_consulted:
  - https://www.rfc-editor.org/rfc/rfc9110.html
updated: 2026-10-26
status: canonical
---

# A download is bytes plus a name

## Snapshot

- A download is not "the file." It is a **byte range you have**, a **byte range you still owe**, and a filename.
- `Content-Length` describes this response body, not always the whole object. A partial response can provide the total in `Content-Range`. Without a known total, show indeterminate progress; resume support is a separate capability.
- `Range: bytes=18000-` plus `206 Partial Content` means "continue." `200` on that request means the server ignored the range and sent the file again.
- Abort is a first-class outcome. Closing the tab must cancel the body, not leave a socket reading into a dead buffer.
- GET is idempotent, but a URL’s representation can change. Resume only against the same object version, using a strong validator or immutable versioned URL.

## Why it shows up in interviews

Photo apps, invoice PDFs, and mobile sync all die mid-transfer. Interviewers want to hear that you persist the offset, that you do not treat a timeout as "the file is corrupt," and that you will not POST a download.

## Core idea

### ELI5

A browser is downloading `sheet-19.pdf`, 48,000 bytes. The connection fails after 18,000 bytes have been durably stored.

1. Remember `got = 18000` for the bytes durably stored, plus the object URL/version and a strong ETag when available.
2. Next open, request `Range: bytes=18000-` with `If-Range` using the saved strong ETag.
3. Append only after validating status, `Content-Range`, version, and body length. A 206 status alone is not sufficient.
4. Done when `got === 48000`.

```
have:  [################........] 18000 / 48000
ask:   Range: bytes=18000-
```

If the server answers `200` and a full body, throw the body away or replace from scratch. A `200` is not a resume.

## Worked example

### Easy

48,000-byte PDF, connection holds. One GET, no `Range`. Progress is `received / 48000`.

### Medium

Drop at 18,000. Resume header is `bytes=18000-`. Expect `206` and `Content-Range: bytes 18000-47999/48000`.

### Hard

The server returns `200` to the resume request, either because it ignored Range or the If-Range validator no longer matched. Absence of `Accept-Ranges` alone does not prove range requests are unsupported. You cannot append. Replace the file, or tell the user resume is unavailable.

```ts
type Pull = { total: number; got: number };

function nextRange(pull: Pull): string | "done" | "restart" {
  if (!Number.isSafeInteger(pull.total) || !Number.isSafeInteger(pull.got) ||
      pull.got < 0 || pull.total < 0 || pull.got > pull.total) return "restart";
  if (pull.got === pull.total) return "done";
  return `bytes=${pull.got}-`;
}

console.log(nextRange({ total: 48000, got: 18000 })); // bytes=18000-
console.log(nextRange({ total: 48000, got: 48000 })); // done
console.log(nextRange({ total: 48000, got: 49000 })); // restart: inconsistent state
```

The helper plans a request from saved state; response validation is a separate step. The initial download may return 200 and later be interrupted—that does not make the saved prefix invalid.

| Resume response | Action |
| --- | --- |
| 206, matching range and object version | Validate and append the requested bytes |
| 200 | Restart with the full representation; never append it |
| 416 | Reconcile current object length/version and local state |

**Try it:** a new version has the same filename and length. Is length enough to resume? No: use the validator or immutable version identity.

## Common mistakes

- Using the filename as proof the bytes arrived. The name can exist beside a half-written file.
- Appending a `200` body onto a partial file. You just doubled the PDF.
- Retrying from byte 0 after every blip. That is how a 48 KB sheet becomes a 2 MB cellular bill.
- Drawing progress off "chunks received" when you never learned `Content-Length`.

## How to talk about it

"I store durable offset, total when known, and object identity next to the partial file. I validate the returned range and version before appending. A `200` means the server ignored me, so I replace or I tell the user. GET is idempotent; the offset and object version are both part of resume state."

## Cross-links

- [HTTP is a conversation, TCP is the pipe](./http-and-tcp.md) (id: http-and-tcp)
- [A large file is a list of ranges](./ranged-download.md) (id: ranged-download)
- [One dead chunk is not a dead file](./chunk-retry.md) (id: chunk-retry)
- [A budget for in-flight requests](./request-budget.md) (id: request-budget)
- [Upload large objects with resumable parts](../system-design/cases/blob-store/lesson.md) (id: blob-store)
