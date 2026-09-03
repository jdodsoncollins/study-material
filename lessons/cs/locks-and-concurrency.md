---
id: locks-and-concurrency
title: Locks buy correctness, not speed
slug: locks-and-concurrency
kind: concept
track: cs
difficulty: core
estimated_minutes: 15
summary: A lock serializes a critical section so invariants survive concurrent writers; too much locking is a deadlock, too little is a race.
tags:
  - cs
  - cs/concurrency
  - cs/os
  - interviews/system-design
prerequisites:
  - processes-threads
related:
  - processes-threads
  - transactions-isolation
  - os-memory
  - cap-and-consistency
company_signal:
  - name: Meta
    evidence: Backend and infra screens still use "this counter is wrong under load" as a concurrency warmup, then follow into deadlock and lock granularity.
    year: 2026
    confidence: high
sources_consulted:
  - Mutex / RW-lock / atomic notes from OS and Java/Go concurrency courses
  - Deadlock Coffman conditions as commonly taught
  - Interview threads on race vs deadlock vs "just use a queue"
updated: 2026-09-02
status: canonical
---

# Locks buy correctness, not speed

## Snapshot

- A **race** is an outcome that depends on lucky timing. If the invariant can break, it will break in production.
- A **mutex** lets one thread into a critical section. An **RW-lock** lets many readers or one writer.
- **Atomics** (compare-and-swap) are single-word locks the CPU provides. They are not a free pass for multi-field invariants.
- Deadlock: A waits for B's lock, B waits for A's. Livelock: everyone is polite and nobody progresses.

## Why it shows up in interviews

Shared-memory services, thread pools, and "increment this counter" follow-ups all land here. They want you to *name the shared state*, *shrink the critical section*, and have a deadlock story. "I'll just add a lock" without saying around *what* is the wrong 90 seconds.

Threads share a heap; see [processes-threads](./processes-threads.md) (id: processes-threads). Databases wrap this in transactions; see [transactions-isolation](./transactions-isolation.md) (id: transactions-isolation).

## Core idea

One bathroom key on a hook. The key is the mutex. The bathroom is the invariant (only one writer). Holding the key while you walk to the store is a critical section that is too big: everyone queues for no reason.

```
lock(counter)
  n = counter
  counter = n + 1     // without the lock, two threads both read 7 and both write 8
unlock(counter)
```

Order locks globally (always `A` then `B`) or you deadlock. Or take one lock. Or do not share: give each thread its own counter and sum at the end. **Message passing** (a queue with one consumer) deletes a family of races.

Happens-before: a unlock in thread 1, then lock in thread 2, *also* flushes memory. Atomics without the right ordering can stay in a core-local cache and look like time travel.

## Comparison

| Tool | Allows | Fails when |
| --- | --- | --- |
| Mutex | One guest | You hold it during I/O |
| RW-lock | Many readers XOR one writer | Writers starve, or you mutate under a read lock |
| Atomic increment | Counters, flags | Multi-field "check then act" |
| CAS loop | Lock-free updates of one word | ABA, contention, not wait-free |
| Queue / actor | No shared mutable | You still needed a snapshot across actors |

```ts
class SeatLock {
  private held = false;
  tryAcquire(): boolean {
    if (this.held) return false;
    this.held = true; // still a race in JS workers; atomics/mutex belong here
    return true;
  }
}
```

That snippet is a *teaching* bug: check-then-set is the race. The fix is an atomic CAS or a real mutex. Saying that out loud scores points.

## Common mistakes

- Locking the whole map for a single-key update. Shard the locks (striping) or use per-entry locks.
- Nested locks in different orders across functions. Deadlock in a week, not in the unit test.
- "Lock-free means faster." Under contention, a well-scoped mutex often wins.
- Thinking single-threaded JS cannot race. It can, across workers, or between an await and the next line that mutates shared state.

## How to talk about it

"I name the invariant and the shared bytes. I put a mutex around the smallest section that keeps that invariant, or I remove sharing with a queue. I lock in a fixed order to avoid deadlock. If they want numbers, I prefer atomics; if they want a structure, I lock or I don't share."

If they ask lock-free: "CAS on one word, retry on failure. I still have to explain ABA and why two fields need a version or a lock."

## Cross-links

- [Address spaces versus shared work](./processes-threads.md) (id: processes-threads)
- [Isolation is which lie you agreed to](./transactions-isolation.md) (id: transactions-isolation)
- [Virtual memory is a lie the CPU believes](./os-memory.md) (id: os-memory)
- [CAP as a conversation tool](../system-design/foundations/cap-and-consistency.md) (id: cap-and-consistency)
- [HTTP is a conversation, TCP is the pipe](./http-and-tcp.md) (id: http-and-tcp)
