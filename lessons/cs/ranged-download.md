---
id: ranged-download
title: A large file is a list of ranges
slug: ranged-download
kind: concept
track: cs
difficulty: core
estimated_minutes: 16
summary: Split a large download into fixed byte ranges so you can fetch several slices at once and put them back in order.
tags:
  - cs
  - cs/networking
  - interviews/system-design
prerequisites:
  - file-download
related:
  - file-download
  - chunk-retry
  - request-budget
  - blob-store
  - http-and-tcp
company_signal:
  - name: Amazon
    evidence: Object-store interviews ask for multipart download and upload: part size, part numbers, and how you assemble an object the client can open.
    year: 2026
    confidence: high
sources_consulted:
  - HTTP Range requests and multipart object download practice
  - Public object-store multipart part-size discussions
updated: 2026-09-25
status: canonical
---

# A large file is a list of ranges

## Snapshot

- One TCP stream for an 8 MiB clip is correct and slow to recover. A dropped packet stalls the whole file.
- Cut the object into **fixed ranges**. Each range is its own GET with `Range: bytes=start-end`.
- Part size is a product choice. Too small and you pay a request per 64 KB. Too big and one failure throws away a lot of bytes.
- You assemble by **byte offset**, not by the order the responses arrived.
- Parallelism is useless until you also cap it. That cap is [request-budget](./request-budget.md) (id: request-budget).

| Plan | Time to first byte | Cost of one failure | Interview line |
| --- | --- | --- | --- |
| One GET | After the handshake | Restart or resume one offset | Fine under ~1 MB |
| Fixed ranges | After the first slice | Redo that slice | The default for multi-megabyte media |
| Tiny ranges | Request overhead wins | Almost free | You melted the socket pool |

## Why it shows up in interviews

"Design a drive" and "the video will not start" both land here. The interviewer wants part size, how you name a part, and what you do when part 3 returns before part 1.

## Core idea

### ELI5

`clip-19.mp4` is 8,388,608 bytes. Cut it into 1,048,576-byte slices.

```
0  [0        .. 1048575]
1  [1048576  .. 2097151]
2  [2097152  .. 3145727]
...
7  [7340032  .. 8388607]
```

Eight envelopes. They may arrive 7, 0, 3, 1. You slot each envelope into its offset. The file is playable when every slot is filled, not when the first one lands.

```ts
function planRanges(total: number, part: number): { index: number; start: number; end: number }[] {
  const out: { index: number; start: number; end: number }[] = [];
  for (let start = 0, index = 0; start < total; start += part, index += 1) {
    out.push({ index, start, end: Math.min(start + part, total) - 1 });
  }
  return out;
}

const parts = planRanges(8_388_608, 1_048_576);
console.log(parts.length, parts[0], parts[7]);
```

## Worked example

### Easy

8,388,608 / 1,048,576 = 8 parts. Part 0 is `bytes=0-1048575`. Inclusive end, so the last byte of the part is `start + size - 1`.

### Medium

The file is 8,388,700 bytes. Parts 0–6 are full. Part 7 is `bytes=7340032-8388699`, 92 bytes short of a full slice. The loop above already does that with `Math.min`.

### Hard

They ask for a 200 MB video. Do not pick 8 KB parts (about 25,000 requests). Say 8 MiB parts, then name the cap on how many of those are in flight.

## Common mistakes

- Numbering parts by arrival order. Part 3's bytes do not belong at the front of the file.
- An off-by-one on the end byte. `bytes=0-1048576` is one byte into the next part.
- Assuming every part is the same length. The tail is shorter.
- Opening all parts at once. That is the next lesson's bug, and the one after it.

## How to talk about it

"I plan inclusive byte ranges up front, store each part by index, and concatenate by index. Part size is 1–8 MiB unless they give me a reason. The last part is short. I do not start the player until the ranges I need for the first seconds are present, but I do not pretend a missing tail is a complete file."

## Cross-links

- [A download is bytes plus a name](./file-download.md) (id: file-download)
- [One dead chunk is not a dead file](./chunk-retry.md) (id: chunk-retry)
- [A budget for in-flight requests](./request-budget.md) (id: request-budget)
- [Camera rolls that never fit on one disk](../system-design/cases/blob-store/lesson.md) (id: blob-store)
- [HTTP is a conversation, TCP is the pipe](./http-and-tcp.md) (id: http-and-tcp)
