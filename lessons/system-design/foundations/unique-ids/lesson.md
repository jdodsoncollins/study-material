---
id: unique-ids
title: Time-ordered IDs with per-worker sequences
slug: unique-ids
kind: concept
track: system-design
difficulty: core
estimated_minutes: 14
summary: Understand time-based ID packing and the allocation, restart, and clock rules needed to keep IDs unique.
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
company_signal: []
sources_consulted:
  - https://www.rfc-editor.org/rfc/rfc9562.html
updated: 2026-10-26
status: canonical
---

# Time-ordered IDs with per-worker sequences

## Snapshot

- IDs need a stated scope of uniqueness, representation, and ordering requirement.
- A database sequence can be a good simple choice when its capacity and availability fit.
- Time-based distributed IDs move coordination into worker allocation and generator state.
- An ID's approximate time order is not proof of causal or commit order.

## Why it shows up in interviews

Once records need identifiers, compare central allocation, random identifiers, and time-ordered identifiers. The useful follow-up is what happens after a restart or clock rollback.

## Core idea

### ELI5

Reserve a part of the ID for time, a part for a worker, and a part for that worker's sequence within the same millisecond. Two generators must never reuse the same combination.

[Read the bit layout](viz/bits.md)

An illustrative 63-bit layout uses 41 bits of elapsed milliseconds, 10 bits of worker ID, and 12 bits of sequence, leaving a sign bit clear in a signed 64-bit column. It allows 1,024 worker IDs and 4,096 sequences per millisecond per worker for about 69.7 years after the chosen epoch.

This still needs coordination: worker IDs must have exclusive owners, including during replacement and network partitions. Restarts must not reuse a previously issued time/sequence pair. Sequence resets are safe only when advancing to a new timestamp that the worker has not already used.

UUIDv4 uses randomness and has probabilistic collision resistance. UUIDv7 includes a leading timestamp and can improve time locality. Neither choice removes the need for database uniqueness constraints when a collision must be detected. See [RFC 9562](https://www.rfc-editor.org/rfc/rfc9562.html).

## Worked example

### Easy

Worker 7 packs elapsed millisecond 50,000 and sequences 0 and 1. This function demonstrates **packing only**; it is not a complete allocator.

```ts
function mint(ms: number, worker: number, seq: number): string {
  if (!Number.isInteger(ms) || ms < 0 || ms >= 2 ** 41 ||
      !Number.isInteger(worker) || worker < 0 || worker >= 1024 ||
      !Number.isInteger(seq) || seq < 0 || seq >= 4096) {
    throw new RangeError("ID field out of range");
  }
  return ((BigInt(ms) << 22n) | (BigInt(worker) << 12n) | BigInt(seq)).toString();
}
console.log(mint(50_000, 7, 0), mint(50_000, 7, 1));
console.log(mint(50_000, 8, 0) === mint(50_000, 7, 0)); // false
```

### Medium

The worker has issued sequence 4,095 at this timestamp. It must wait for a safely new timestamp or use another explicitly designed overflow policy. Silently wrapping to zero duplicates an ID.

### Hard

The clock moves backward five milliseconds, then the process restarts. A guard against the current process's last timestamp is insufficient if that state is lost. Preserve allocation state or use an allocation/lease scheme that prevents reuse across restarts. A paused old owner also must not continue minting after its worker ID is reassigned.

**Try it:** sort IDs from workers 7 and 8 generated in the same millisecond. Their numeric order follows worker bits before sequence bits; it does not prove which event happened first.

## Common mistakes

| Mistake | Consequence | Better decision |
| --- | --- | --- |
| Convert a 63-bit ID to JavaScript `number` | Distinct IDs can lose precision | Use `bigint` internally and strings at JSON boundaries |
| Hash hostnames into worker IDs | Collisions can duplicate IDs | Allocate and fence ownership |
| Assume a central sequence is always inadequate | Unnecessary distributed complexity | Measure the actual requirement |
| Use an unsigned 32-bit counter at one million IDs/s | Exhaust the space in about 72 minutes | Calculate capacity and rollover behavior |

## How to talk about it

“I will first check whether the database can allocate IDs. If distributed generation is required, I will define worker ownership, restart state, clock rollback, and overflow. The bit layout is only one part of that protocol.”

## Cross-links

- [Splitting a keyspace so one box is not the product](../sharding/lesson.md) (id: sharding)
- [HTTP is a conversation, TCP is the pipe](../../../cs/http-and-tcp.md) (id: http-and-tcp)
- [Indexes are precomputed answers](../../../cs/indexes.md) (id: indexes)
- [Upload large objects with resumable parts](../../cases/blob-store/lesson.md) (id: blob-store)
- [Schedule occurrences and recover leased work](../../cases/job-scheduler/lesson.md) (id: job-scheduler)
