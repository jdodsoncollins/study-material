---
id: locks-and-concurrency
title: Locks buy correctness, not speed
slug: locks-and-concurrency
kind: concept
track: cs
difficulty: core
estimated_minutes: 15
summary: A lock serializes a critical section so invariants survive concurrent writers; incorrect lock ordering can deadlock, while unprotected shared state can race.
tags:
  - cs
  - cs/concurrency
  - cs/os
  - interviews
  - interviews/system-design
prerequisites:
  - processes-threads
related:
  - processes-threads
  - transactions-isolation
  - os-memory
  - cap-and-consistency
company_signal: []
sources_consulted:
  - https://nodejs.org/api/worker_threads.html
  - https://pages.cs.wisc.edu/~remzi/OSTEP/
updated: 2026-10-26
status: canonical
---

# Locks buy correctness, not speed

## Snapshot

- A **race condition** makes correctness depend on timing. A data race is the narrower language-memory-model concept of conflicting unsynchronized memory access.
- A **mutex** lets one thread into a critical section. An **RW-lock** lets many readers or one writer.
- **Atomics** provide indivisible operations, such as compare-and-swap, on supported memory locations. They are not themselves locks. They are not a free pass for multi-field invariants.
- Deadlock: A waits for B's lock, B waits for A's. Livelock: everyone is polite and nobody progresses.

## Why it shows up in interviews

Shared-memory services, thread pools, and "increment this counter" follow-ups all land here. They want you to *name the shared state*, *shrink the critical section*, and have a deadlock story. "I'll just add a lock" without saying around *what* is the wrong 90 seconds.

Threads share a heap; see [Address spaces versus shared work](./processes-threads.md) (id: processes-threads). Databases wrap this in transactions; see [Isolation defines what concurrent transactions can observe](./transactions-isolation.md) (id: transactions-isolation).

## Core idea

### ELI5

One bathroom key on a hook. The key is the mutex. The bathroom is the invariant (only one writer). Holding the key while you walk to the store is a critical section that is too big: everyone queues for no reason.

```
lock(counter)
  n = counter
  counter = n + 1     // without the lock, two threads both read 7 and both write 8
unlock(counter)
```

A consistent global lock order (always `A` then `B`) prevents circular lock waits. Inconsistent ordering creates a deadlock risk. Or take one lock. Or do not share: give each thread its own counter and sum at the end. **Message passing** (a queue with one consumer) deletes a family of races.

Happens-before describes ordering and visibility guarantees. Releasing a mutex and a subsequent successful acquisition of that same mutex establish synchronization under its language contract. This is more precise than saying a lock “flushes the cache.”

## Comparison

| Tool | Allows | Fails when |
| --- | --- | --- |
| Mutex | One holder per mutex | Long critical sections can serialize unrelated work |
| RW-lock | Many readers XOR one writer | Writers starve, or you mutate under a read lock |
| Atomic increment | Counters, flags | Multi-field "check then act" |
| CAS loop | Conditional atomic update | ABA and contention; progress depends on the whole algorithm |
| Queue / actor | Serialized access to owned state | Cross-actor invariants need additional coordination |

```ts
let stock = 1;
async function reserve(): Promise<boolean> {
  const observed = stock;
  await Promise.resolve(); // another reservation can run here
  if (observed < 1) return false;
  stock = observed - 1;
  return true;
}
Promise.all([reserve(), reserve()]).then(results => console.log(results, stock));
// [true, true] 0: two successful reservations for one item
```

**Predict first:** both calls read 1 before either resumes. The stale check lets both succeed. This demonstrates an async logical race on one event loop, not a shared-memory data race. In this single-process example, checking and decrementing together without an intervening await would prevent this interleaving. A real multi-process inventory needs a database constraint or other shared coordination.

An ordinary object is not shared automatically between JavaScript workers. SharedArrayBuffer plus Atomics is a separate mechanism; browsers also impose security requirements for shared memory.

## Common mistakes

- Locking the whole map for a single-key update. Shard the locks (striping) or use per-entry locks.
- Nested locks in different orders across functions. A circular wait may occur under an unlucky interleaving; test contention and verify the lock-order rule.
- "Lock-free means faster." Under contention, a well-scoped mutex often wins.
- Thinking single-threaded JS cannot race. An await can split a read-modify-write sequence. Worker data races require an actual shared-memory mechanism.

## How to talk about it

"I name the invariant and the shared bytes. I put a mutex around the smallest section that keeps that invariant, or I remove sharing with a queue. I lock in a fixed order to avoid deadlock. If they want numbers, I prefer atomics; if they want a structure, I lock or I don't share."

If they ask lock-free: "CAS on one word, retry on failure. I still have to explain ABA and why two fields need a version or a lock."

## Cross-links

- [Address spaces versus shared work](./processes-threads.md) (id: processes-threads)
- [Isolation defines what concurrent transactions can observe](./transactions-isolation.md) (id: transactions-isolation)
- [Virtual addresses, physical pages, and locality](./os-memory.md) (id: os-memory)
- [Consistency promises during failures](../system-design/foundations/cap-and-consistency.md) (id: cap-and-consistency)
- [HTTP is a conversation, TCP is the pipe](./http-and-tcp.md) (id: http-and-tcp)
