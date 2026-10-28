---
id: file-sync
title: Sync files across devices with chunks and a change journal
slug: file-sync
kind: case-study
track: system-design
difficulty: deep
estimated_minutes: 22
summary: Split files into content-hashed chunks, upload only the missing ones, commit a new version against its parent in a per-account journal, and turn a stale parent into a conflict copy instead of a silent overwrite.
tags:
  - system-design
  - system-design/product-cases
  - system-design/storage
  - system-design/consistency
  - interviews
  - interviews/system-design
prerequisites:
  - blob-store
  - chunk-retry
related:
  - blob-store
  - chunk-retry
  - doc-collab
  - notification-system
  - kv-store
company_signal: []
sources_consulted:
  - https://doi.org/10.6028/NIST.FIPS.180-4
  - https://doi.org/10.1145/502034.502052
  - Tridgell and Mackerras, The rsync algorithm (ANU technical report TR-CS-96-05, 1996)
updated: 2026-10-28
status: canonical
---

# Sync files across devices with chunks and a change journal

## Snapshot

- A file version is a **manifest**: an ordered list of chunk hashes. Chunks are immutable and stored by hash.
- Upload is three steps: hash locally, ask which chunks the server lacks, upload those, then commit the manifest.
- The **journal** is the authoritative, ordered list of changes per account. Devices sync by asking "what changed since cursor N".
- A commit names its parent version. A stale parent means another device got there first: keep both files as a conflict copy, never overwrite.

## What this round is actually scoring

Whether an interrupted upload, two devices editing offline, or a phone that was off for a month can ever lose a user's file or show a half-written one.

## Company signal

This is an original practice scenario. No traceable company-specific frequency evidence is supplied.

## Requirements

| Area | Requirement |
| --- | --- |
| Sync | A file saved on the laptop appears on the phone and tablet |
| Efficiency | A small edit to a large file uploads roughly the changed part, not the whole file |
| Offline | Devices edit offline and reconcile when they reconnect |
| Conflicts | Two offline edits to the same file both survive |
| Moves | Renaming a 2 GB folder does not re-upload it |
| History | Restore deleted files and old versions for 30 days |

| Non-functional | Target (illustrative) |
| --- | --- |
| Change visible on other online devices | under 10 s |
| Data loss of committed versions | none |

## Back-of-envelope

These are illustrative workload assumptions, not production measurements.

- **10 million users**, about 3 devices each, average **6 GB** stored: **60 PB** logical.
- Assume per-account deduplication saves 15%: about 51 PB of unique chunks. Erasure coding at 1.5× overhead: about **76.5 PB** of raw disk.
- 40 file changes per user per day: **400 million commits/day**, about **4,630/s** average, roughly 14,000/s at a 3× peak.
- 25 MB of new chunk data per user per day: **250 TB/day**, about **2.9 GB/s** average upload.
- Journal entries of about 300 bytes: 120 GB/day; 90 days of journal is about 10.8 TB. Metadata is small next to the bytes but is on every request path.
- About 30 million devices hold an idle connection or push registration to be told "something changed".

## Design

### ELI5

Cut each file into pieces and give each piece a fingerprint. The server keeps pieces by fingerprint, so a piece it already has never needs sending again. A file is just a list of fingerprints. When you save, you say "this file used to be version 3, now it's this list". If the server already has a version 4 from your phone, it keeps yours next to it as a copy instead of choosing one.

[Follow a save from laptop to phone](viz/sync.md)

### Operation and authoritative state

- **Chunk store.** `chunk(account, sha256) → bytes`, immutable, replicated or erasure-coded across failure domains. Scoping dedupe to the account avoids leaking "someone else already has this exact file" across users.
- **File table.** `file(account, file_id, path, version, manifest, deleted)`. A stable `file_id` makes rename a metadata change.
- **Journal.** `journal(account, seq, file_id, version, op)`, with `seq` strictly increasing per account. This is the order every device replays.

**Chunking.** Fixed 4 MB chunks are simple, but inserting 1 KB at the start of a 40 MB file shifts every boundary and all 10 chunks change. **Content-defined chunking** places boundaries where a rolling hash over a small window matches a pattern (tuned for about 4 MB on average), so an insert changes only the chunk or two around it.

**Upload.**

1. The client chunks and hashes the file locally.
2. It asks the server which of those hashes the account lacks.
3. It uploads only the missing chunks; the server verifies each hash on receipt.
4. It commits `(file_id, parent_version, manifest)`.

```ts
type Entry = { version: number; chunks: string[]; device: string };

function missing(have: Set<string>, chunks: string[]): string[] {
  return chunks.filter(h => !have.has(h));
}
// Commit only if the device edited the version the server still has.
function commit(files: Map<string, Entry>, path: string, parent: number, chunks: string[], device: string): string {
  const current = files.get(path)?.version ?? 0;
  if (current !== parent) {
    const copy = `${path} (conflicted copy from ${device})`;
    files.set(copy, { version: 1, chunks, device });
    return copy;
  }
  files.set(path, { version: current + 1, chunks, device });
  return path;
}

const have = new Set(["a1", "b2", "c3"]);
const files = new Map<string, Entry>([["budget.xlsx", { version: 3, chunks: ["a1", "b2", "c3"], device: "laptop" }]]);
console.log(missing(have, ["a1", "b9", "c3"])); // [ 'b9' ]: one chunk to upload
console.log(commit(files, "budget.xlsx", 3, ["a1", "b9", "c3"], "laptop")); // budget.xlsx (now version 4)
console.log(commit(files, "budget.xlsx", 3, ["a1", "b2", "d4"], "phone")); // budget.xlsx (conflicted copy from phone)
```

### Commit boundary

A new version exists when the file row and its journal entry commit **in one transaction**, and only after every chunk in the manifest is durable. The commit checks `version == parent_version` (compare-and-set). Until then, uploaded chunks are unreferenced and invisible. Readers never see a manifest pointing at a chunk that is not there.

### Recovery behavior

- **Interrupted upload.** On retry, step 2 reports which chunks already arrived; the client sends only the rest. No partial file is ever visible because nothing was committed.
- **Lost commit response.** The client retries the commit with the same request ID; the server returns the version it already created instead of a conflict with itself.
- **Device catch-up.** A device stores its last applied `seq`. On wake, it asks for entries after that cursor, applies them in order, and fetches only chunks it lacks. A push or long-poll says "new entries exist"; it never carries the data.
- **Device off for months.** If its cursor is older than the 90-day journal, the server answers "cursor expired". The device does a full listing and compares hashes of what it has, then resumes from the current cursor.
- **Deletes and garbage.** Deletes are journal entries (tombstones). Chunks are reclaimed by mark-and-sweep over live manifests plus 30 days of history, with a grace period so a chunk uploaded for a commit still in flight is not swept.

## Tradeoffs

| Choice | Benefit | Cost |
| --- | --- | --- |
| Fixed-size chunks | Simple, fast | Inserts shift every later boundary |
| Content-defined chunks | Small edits upload little | Rolling hash cost on every save; variable sizes |
| Per-account dedupe | No cross-user existence leak | Less savings than global dedupe |
| Conflict copies | Never loses an edit | Users must resolve copies by hand |
| Three-way merge for some file types | Fewer copies for text | Only works where a merge is well defined |
| Per-account journal sequence | Simple, total order per account | One sequence per account is a hot spot for huge shared folders |

## Failure modes

- **Overwrite by stale device.** A phone offline for a week uploads its old copy as "latest". The parent-version check turns it into a conflict copy.
- **Half-written file synced.** The client chunks a file while an app is still writing it. Wait until the file has been stable for a short interval, or hash again after upload and retry if it changed.
- **Rename storm.** Moving a folder of 50,000 files writes 50,000 path updates. Store the folder as a node with a parent pointer so one row changes.
- **Case and Unicode.** `Report.txt` and `report.txt` are one file on some file systems and two on others. Normalize names (case and Unicode form) per platform rules and create conflict copies where they collide.
- **Hash trust.** The server must recompute each chunk's hash on upload; trusting the client's hash lets a buggy client poison a chunk others reference.

## Follow-ups an interviewer may ask

**Easy:** a user edits one cell in a 40 MB spreadsheet. Trace what is hashed, what is uploaded, and what is committed.

**Medium:** laptop and phone both edit `budget.xlsx` offline from version 3. Show the journal and both devices' final view.

**Hard:** add shared folders with 500 members. Where does the per-account journal break, and how do members' cursors work now?

## Cross-links

- [Upload large objects with resumable parts](../blob-store/lesson.md) (id: blob-store)
- [One dead chunk is not a dead file](../../../cs/chunk-retry.md) (id: chunk-retry)
- [Merge concurrent edits in a shared notes doc](../doc-collab.md) (id: doc-collab)
- [Route notifications without confusing acceptance and delivery](../notification-system/lesson.md) (id: notification-system)
- [Replicate a cart store with quorums](../kv-store/lesson.md) (id: kv-store)
