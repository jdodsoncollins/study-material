---
id: chunk-retry
title: One dead chunk is not a dead file
slug: chunk-retry
kind: concept
track: cs
difficulty: core
estimated_minutes: 16
summary: When parallel ranges fail, retry the missing ranges, keep the good bytes, and only fail the download after a part is out of tries.
tags:
  - cs
  - cs/networking
  - interviews/system-design
prerequisites:
  - ranged-download
related:
  - ranged-download
  - file-download
  - request-budget
  - queues-delivery
  - blob-store
company_signal:
  - name: Google
    evidence: Client and storage interviews ask what you do when 2 of 8 parts fail: retry, checksum, and whether the object is readable.
    year: 2026
    confidence: medium
sources_consulted:
  - Multipart download retry and checksum practice
  - At-least-once delivery applied to idempotent GETs
updated: 2026-09-25
status: canonical
---

# One dead chunk is not a dead file

## Snapshot

- A ranged download fails **per part**. Parts that returned `206` and the right number of bytes are done.
- Retry the part, not the file. A GET of `bytes=2097152-3145727` is idempotent.
- Cap tries. Three failures on the same part is a failed download that still has the other parts on disk.
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

Slice 2 fails twice (`503`, then timeout). Third try succeeds. Slice 5 fails once and succeeds. Still one download, two scars.

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

## Common mistakes

- `Promise.all` on eight fetches. The first rejection throws away seven good bodies that already arrived.
- Retrying forever on `404`. The part will not appear. Stop.
- Accepting a body whose length is not `end - start + 1`. You will glue a short slice to the next one and the decoder will choke.
- Deleting the partial file on any error. You just paid for the bytes you are about to download again.

## How to talk about it

"Each range is its own state: empty, in flight, good, or exhausted. I use `allSettled`, not `all`. I retry `503` and timeouts with a try cap. I do not retry `404` or `416`. Good parts stay on disk. The file is complete only when every index is good."

## Cross-links

- [A large file is a list of ranges](./ranged-download.md) (id: ranged-download)
- [A download is bytes plus a name](./file-download.md) (id: file-download)
- [A budget for in-flight requests](./request-budget.md) (id: request-budget)
- [At-least-once, idempotency, and the dead-letter lane](../system-design/foundations/queues-delivery/lesson.md) (id: queues-delivery)
- [Camera rolls that never fit on one disk](../system-design/cases/blob-store/lesson.md) (id: blob-store)
