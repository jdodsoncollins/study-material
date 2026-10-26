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
  - interviews
  - interviews/system-design
prerequisites:
  - file-download
related:
  - file-download
  - chunk-retry
  - request-budget
  - blob-store
  - http-and-tcp
company_signal: []
sources_consulted:
  - https://www.rfc-editor.org/rfc/rfc9110.html
updated: 2026-10-26
status: canonical
---

# A large file is a list of ranges

## Snapshot

- One streamed GET may be sufficient even for a large file. Fixed ranges help isolate application retries and can improve throughput when measured conditions justify parallelism.
- Cut the object into **fixed ranges**. Each range is its own GET with `Range: bytes=start-end`.
- Part size is a product choice. Too small and you pay a request per 64 KB. Too big and one failure throws away a lot of bytes.
- You assemble by **byte offset**, not by the order the responses arrived.
- Parallel requests need an explicit concurrency cap. That cap is [A budget for in-flight requests](./request-budget.md) (id: request-budget).

| Plan | Time to first byte | Cost of one failure | Interview line |
| --- | --- | --- | --- |
| One GET | After the handshake | Restart or resume one offset | Choose from latency, throughput, and recovery requirements |
| Fixed ranges | After the first slice | Redo that slice | Useful when independent range recovery or concurrency helps |
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

Eight envelopes. They may arrive 7, 0, 3, 1. You slot each envelope into its offset. The download is complete when every required range is verified. Playback can sometimes begin earlier if the format and player have the needed metadata and initial media bytes.

```ts
function planRanges(total: number, part: number): { index: number; start: number; end: number }[] {
  if (!Number.isSafeInteger(total) || total < 0 || !Number.isSafeInteger(part) || part < 1)
    throw new Error("Invalid range sizes");
  const out: { index: number; start: number; end: number }[] = [];
  for (let start = 0, index = 0; start < total; start += part, index += 1) {
    out.push({ index, start, end: Math.min(start + part, total) - 1 });
  }
  return out;
}

const parts = planRanges(8_388_608, 1_048_576);
console.log(parts.length, parts[0], parts[7]); // 8 parts
console.log(planRanges(8_388_700, 1_048_576).at(-1)); // {index:8,start:8388608,end:8388699}
console.log(planRanges(0, 1024)); // []
```

## Worked example

### Easy

8,388,608 / 1,048,576 = 8 parts. Part 0 is `bytes=0-1048575`. Inclusive end, so the last byte of the part is `start + size - 1`.

### Medium

The file is 8,388,700 bytes: eight full parts (0–7), plus part 8 at `bytes=8388608-8388699`, exactly 92 bytes. The loop above already does that with `Math.min`.

### Hard

They ask for a 200 MB video. Compare request count and retry cost: 8 KiB parts need about 25,000 requests, while 8 MiB parts need about 24. Treat those as candidates to measure, not universal defaults.

**Try it:** for total 10 bytes and part size 4, write the ranges before running the planner. They are 0–3, 4–7, and 8–9. Verify that every byte appears exactly once.

All parts must belong to the same immutable object version. Validate Content-Range, body length, and the expected validator; do not combine parts from different versions.

## Common mistakes

- Numbering parts by arrival order. Part 3's bytes do not belong at the front of the file.
- An off-by-one on the end byte. `bytes=0-1048576` is one byte into the next part.
- Assuming every part is the same length. The tail is shorter.
- Opening all parts at once. That is the next lesson's bug, and the one after it.

## How to talk about it

"I plan inclusive byte ranges up front, store each part by index, and concatenate by index. I choose part size and concurrency from measured overhead, bandwidth, and retry costs. The last part is short. I do not start the player until the ranges I need for the first seconds are present, but I do not pretend a missing tail is a complete file."

## Cross-links

- [A download is bytes plus a name](./file-download.md) (id: file-download)
- [One dead chunk is not a dead file](./chunk-retry.md) (id: chunk-retry)
- [A budget for in-flight requests](./request-budget.md) (id: request-budget)
- [Upload large objects with resumable parts](../system-design/cases/blob-store/lesson.md) (id: blob-store)
- [HTTP is a conversation, TCP is the pipe](./http-and-tcp.md) (id: http-and-tcp)
