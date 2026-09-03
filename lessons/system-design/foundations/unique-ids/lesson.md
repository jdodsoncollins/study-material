---
id: unique-ids
title: IDs that sort without a coordinator
slug: unique-ids
kind: concept
track: system-design
difficulty: core
estimated_minutes: 14
summary: A 64-bit ticket can be unique, roughly time-ordered, and minted on many boxes if you partition time, worker, and sequence.
tags:
  - system-design
  - system-design/foundations
  - system-design/ids
  - interviews
  - interviews/system-design
prerequisites:
  - interview-framework
related:
  - sharding
  - http-and-tcp
  - indexes
  - blob-store
  - job-scheduler
company_signal:
  - name: Twitter
    evidence: Public Snowflake writeup plus candidate-reported ID-generation prompts at Meta/Amazon still treat time-sortable 64-bit IDs as a staple follow-up.
    year: 2026
    confidence: high
  - name: Uber
    evidence: Candidate-reported geo/dispatch loops ask how event IDs stay unique across regions without a global sequence.
    year: 2026
    confidence: medium
sources_consulted:
  - Twitter Snowflake public design notes
  - UUID vs ULID vs sequence talk in backend interview threads
  - Clock-drift / leap-second anecdotes in distributed-systems postmortems
updated: 2026-09-02
status: canonical
---

# IDs that sort without a coordinator

## Snapshot

- Product need: **YardTicket** IDs for every pallet event. They must be unique across docks, roughly sortable by time, and fit in a 64-bit column.
- A central `SELECT nextval` is a [shard](../sharding/lesson.md) (id: sharding) you did not mean to build.
- UUID v4 is unique and useless for range scans. ULID/KSUID are the string cousins of the same idea.
- The usual 64-bit layout: **timestamp | worker | sequence**. Uniqueness is "this worker never reuses a sequence in this millisecond."

## Why it shows up in interviews

After you draw a log or a message table they ask "who assigns the id." They are checking whether you will put a global counter in the drawing. The follow-up is clock drift.

## Core idea

Split the 64 bits so two boxes cannot mint the same ticket without sharing a worker id.

[bits](viz/bits.md)

One working split (not a standard you must memorize): 1 unused bit, 41 bit milliseconds, 10 bit worker (1024 boxes), 12 bit sequence (4096/ms/box). 41 bits of ms is ~69 years from a custom epoch.

Worker ids come from the orchestrator at boot (or from the machine's rack+slot). Sequence resets every millisecond. If a worker mints more than 4096 events in one ms, it waits.

## Worked example

Dock 7, epoch `2024-01-01`. At `ms = 1_700_000_000_000` relative to epoch it mints sequence 0, 1, 2.

```ts
function mint(ms: number, worker: number, seq: number): string {
  const id = (BigInt(ms) << 22n) | (BigInt(worker) << 12n) | BigInt(seq);
  return id.toString();
}
console.log(mint(50_000, 7, 0));
console.log(mint(50_000, 7, 1));
console.log(mint(50_000, 8, 0) === mint(50_000, 7, 0));
```

Same millisecond, different workers → different ids. Same worker, sequence bump → different ids. Sort order tracks `ms` then worker then seq, which is good enough for "roughly when."

Clock goes backward 5ms: refuse to mint until `now >= last_ms`, or bump a logical ms and accept a small lie. Do not reuse sequences from the future you already handed out.

## Common mistakes

| Trap | What happens | Fix |
| --- | --- | --- |
| UUID in a B-tree primary key | Random inserts, page splits | Time-ordered id, or a sequential surrogate plus a UUID column |
| One global SQL sequence | That primary is the product | Per-worker sequence |
| Worker id from hostname hash | Two boxes can collide | Allocate worker ids |
| Ignore NTP step-back | Duplicate tickets after a clock jump | Monotonic guard |
| 32-bit id at 1M/s | Wrap in an afternoon | 64-bit, and say the wrap date |

## How to talk about it

"I will not put a global counter in the drawing. 64 bits: time, worker, sequence. Worker ids are allocated. If the clock jumps back, we stall. If they need ids before the event is durable, we mint at accept and treat the ticket as the idempotency key."

## Cross-links

- [Splitting a keyspace so one box is not the product](../sharding/lesson.md) (id: sharding)
- [HTTP is a conversation, TCP is the pipe](../../../cs/http-and-tcp.md) (id: http-and-tcp)
- [Indexes are precomputed answers](../../../cs/indexes.md) (id: indexes)
- [Camera rolls that never fit on one disk](../../cases/blob-store/lesson.md) (id: blob-store)
- [Cron, ad-hoc, leases, and retries](../../cases/job-scheduler/lesson.md) (id: job-scheduler)
