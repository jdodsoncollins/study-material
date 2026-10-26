---
id: chunk-retry
title: One dead chunk is not a dead file
slug: chunk-retry
kind: concept
track: cs
difficulty: core
estimated_minutes: 16
summary: Preserve verified ranges and retry eligible missing parts under bounded attempts, backoff, and cancellation.
tags:
  - cs
  - cs/networking
  - interviews
  - interviews/system-design
prerequisites:
  - ranged-download
related:
  - ranged-download
  - file-download
  - request-budget
  - queues-delivery
  - blob-store
company_signal: []
sources_consulted:
  - https://www.rfc-editor.org/rfc/rfc9110.html
updated: 2026-10-26
status: canonical
---

# One dead chunk is not a dead file

## Snapshot

- A ranged download fails **per part**. Mark a part done only after validating its range, length, object version, and any required checksum, then persisting it.
- Retry the part, not the file. A GET of `bytes=2097152-3145727` is idempotent.
- Cap tries. For this example, three failed attempts exhaust the current retry budget that still has the other parts on disk.
- Check the length (and a checksum if you have one) before you mark a part good. A short `206` is a failure.
- Do not assemble a file with a hole and hand it to the video player.

## Why it shows up in interviews

Concurrent work is where candidates say "retry the request" and then restart eight parts because one timed out. The score is: name the failed indexes, keep the rest, bound the retries.

## Core idea

### ELI5

Eight slices of `clip-19.mp4`. Slice 2 got `503`. Slice 5 timed out. The other six are on disk.

1. Leave 0, 1, 3, 4, 6, 7 alone.
2. Put 2 and 5 back on the queue.
3. Each retry increments that slice's attempt count.
4. If slice 2 hits 3 attempts, stop. The download failed. The six good slices stay, so the next open does not refetch them.

```
ok:     0 1 . 3 4 . 6 7
retry:      2     5
```

## Worked example

### Easy

Slice 2 fails once, then returns 1,048,576 bytes. Mark it good. Assemble.

### Medium

Slice 2 fails twice (`503`, then timeout). Third try succeeds. Slice 5 fails once and succeeds. Record each part’s outcome independently.

### Hard

Slice 2 fails three times. You do not delete slices 0, 1, 3, 4, 6, 7. You record `missing: [2]` and surface "1 part left." The next session only queues index 2.

```ts
type Part = { index: number; ok: boolean; tries: number };

function settle(parts: Part[], maxTries: number): { missing: number[]; failed: boolean } {
  const missing = parts.filter((p) => !p.ok).map((p) => p.index);
  const failed = parts.some((p) => !p.ok && p.tries >= maxTries);
  return { missing, failed };
}

const after: Part[] = [
  { index: 0, ok: true, tries: 1 },
  { index: 2, ok: false, tries: 2 },
  { index: 5, ok: false, tries: 1 },
];
console.log(settle(after, 3));
console.log(settle([{ index: 2, ok: false, tries: 3 }], 3));
```

| State | Next step |
| --- | --- |
| Verified and persisted | Reuse only for the same object version |
| Transient failure, budget remains | Queue a delayed retry with backoff and jitter |
| Exhausted or permanent failure | Stop automatic retries and preserve valid progress |

**Try it:** after a restart, the URL points to a new version. Can the six saved parts be reused merely because their lengths match? No; reconcile the version before resuming.

## Common mistakes

- `Promise.all` rejects when one input rejects, but does not cancel other promises or erase their results. Persist each successful part independently; use allSettled when you need every outcome.
- Retrying forever on `404`. The part will not appear. Stop.
- Accepting a body whose length is not `end - start + 1`. You will glue a short slice to the next one and the decoder will choke.
- Deleting the partial file on any error. You just paid for the bytes you are about to download again.

## How to talk about it

"Each range is its own state: empty, in flight, good, or exhausted. I persist each verified part and collect every outcome, for example with `allSettled`. I retry `503` and timeouts with a try cap. I investigate permanent errors; a 416 requires reconciling the range with the current object version and size. Good parts stay on disk. The file is complete only when every index is good."

## Cross-links

- [A large file is a list of ranges](./ranged-download.md) (id: ranged-download)
- [A download is bytes plus a name](./file-download.md) (id: file-download)
- [A budget for in-flight requests](./request-budget.md) (id: request-budget)
- [At-least-once, idempotency, and the dead-letter lane](../system-design/foundations/queues-delivery/lesson.md) (id: queues-delivery)
- [Upload large objects with resumable parts](../system-design/cases/blob-store/lesson.md) (id: blob-store)
