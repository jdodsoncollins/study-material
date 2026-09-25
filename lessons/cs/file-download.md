---
id: file-download
title: A download is bytes plus a name
slug: file-download
kind: concept
track: cs
difficulty: core
estimated_minutes: 14
summary: A file download is one GET that must know the length, report progress, and resume from the last byte instead of starting over.
tags:
  - cs
  - cs/networking
  - interviews/system-design
prerequisites:
  - http-and-tcp
related:
  - http-and-tcp
  - ranged-download
  - chunk-retry
  - request-budget
  - blob-store
company_signal:
  - name: Dropbox
    evidence: Storage and mobile-sync writeups treat "the download died at 40%" as a resume problem, not a full restart.
    year: 2026
    confidence: medium
sources_consulted:
  - HTTP Range and Content-Length as specified for partial content
  - Browser download and mobile sync writeups on resume
updated: 2026-09-25
status: canonical
---

# A download is bytes plus a name

## Snapshot

- A download is not "the file." It is a **byte range you have**, a **byte range you still owe**, and a filename.
- `Content-Length` tells you the whole size. Without it you can still stream, but you cannot draw an honest progress bar or resume.
- `Range: bytes=18000-` plus `206 Partial Content` means "continue." `200` on that request means the server ignored the range and sent the file again.
- Abort is a first-class outcome. Closing the tab must cancel the body, not leave a socket reading into a dead buffer.
- GET is safe to retry. The bytes are the same. The *offset* you ask for is what changes.

## Why it shows up in interviews

Photo apps, invoice PDFs, and mobile sync all die mid-transfer. Interviewers want to hear that you persist the offset, that you do not treat a timeout as "the file is corrupt," and that you will not POST a download.

## Core idea

### ELI5

RollKeep is handing you `sheet-19.pdf`, 48,000 bytes. The radio dies after byte 18,000.

1. Remember `got = 18000` next to the filename.
2. Next open, ask only for bytes `18000` through `47999`.
3. Append those bytes. Do not overwrite the first 18,000.
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

Server has no `Accept-Ranges`. The second GET is `200` and 48,000 bytes. You cannot append. Replace the file, or tell the user resume is unavailable.

```ts
type Pull = { total: number; got: number; status: number };

function nextRange(pull: Pull): string | "done" | "restart" {
  if (pull.status === 200 && pull.got > 0 && pull.got < pull.total) return "restart";
  if (pull.got >= pull.total) return "done";
  return `bytes=${pull.got}-`;
}

const dropped: Pull = { total: 48000, got: 18000, status: 206 };
const ignored: Pull = { total: 48000, got: 18000, status: 200 };
console.log(nextRange(dropped), nextRange(ignored), nextRange({ total: 48000, got: 48000, status: 206 }));
```

## Common mistakes

- Using the filename as proof the bytes arrived. The name can exist beside a half-written file.
- Appending a `200` body onto a partial file. You just doubled the PDF.
- Retrying from byte 0 after every blip. That is how a 48 KB sheet becomes a 2 MB cellular bill.
- Drawing progress off "chunks received" when you never learned `Content-Length`.

## How to talk about it

"I store offset and total next to the file. On resume I send `Range` and I only append if I get `206`. A `200` means the server ignored me, so I replace or I tell the user. GET is retryable; the offset is the state."

## Cross-links

- [HTTP is a conversation, TCP is the pipe](./http-and-tcp.md) (id: http-and-tcp)
- [A large file is a list of ranges](./ranged-download.md) (id: ranged-download)
- [One dead chunk is not a dead file](./chunk-retry.md) (id: chunk-retry)
- [A budget for in-flight requests](./request-budget.md) (id: request-budget)
- [Camera rolls that never fit on one disk](../system-design/cases/blob-store/lesson.md) (id: blob-store)
