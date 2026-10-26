---
id: processes-threads
title: Address spaces versus shared work
slug: processes-threads
kind: concept
track: cs
difficulty: core
estimated_minutes: 13
summary: A process is an isolated virtual memory map plus handles; a thread is a stack and a register set that shares that map with its siblings.
tags:
  - cs
  - cs/os
  - cs/concurrency
  - interviews
  - interviews/system-design
prerequisites:
  - os-memory
related:
  - os-memory
  - locks-and-concurrency
  - http-and-tcp
  - recursion-call-stack
company_signal: []
sources_consulted:
  - https://nodejs.org/api/worker_threads.html
  - https://pages.cs.wisc.edu/~remzi/OSTEP/
updated: 2026-10-26
status: canonical
---

# Address spaces versus shared work

## Snapshot

- A **process** is a program in execution: virtual memory, file descriptors, credentials. A process boundary usually contains ordinary memory faults, though resource exhaustion and shared dependencies can still affect others.
- A **thread** is a schedulable stack inside a process. Threads share heap, globals, and sockets. Crash one, usually the process dies.
- Switching processes is heavier (page tables, TLB) than switching threads, but isolation is the feature.
- CPU parallelism needs execution resources and a plan for shared state. More threads ≠ more speed.

## Why it shows up in interviews

Design a worker pool, a browser sandbox, or a Node service and someone will ask "process or thread?" They want isolation vs communication cost, not a textbook definition. Wrong answer: "threads are faster so always threads." Right answer: "threads share memory so I need locks; processes isolate faults and force me onto pipes or RPC."

## Core idea

### ELI5

A food truck is a process. Cooks are threads. They share the fridge (heap) and the one gas line (sockets). Two trucks are two processes: separate fridges, talk by handing tickets through the window (IPC).

```
process A                     process B
  thread A1  ─┐                 thread B1
  thread A2  ─┼─ shared heap
  thread A3  ─┘   shared fds
```

Context switch: save registers and stack pointer, pick the next runnable, restore. If the next thread is another process, also switch the address space. That is why thread pools on one service are cheap compared to "one OS process per request" — until a wild write corrupts the shared heap.

JavaScript callbacks on one event loop run one at a time. Workers or processes can run JavaScript on other cores, while runtime and OS services may also do work concurrently. Node workers have separate JavaScript heaps; sharing ordinary object references is not the same as using shared memory.

## Comparison

| Need | Prefer | Cost you accept |
| --- | --- | --- |
| Fault isolation, different users | Processes | IPC, duplication, heavier switch |
| Shared in-memory cache, tight loop | Threads | Locks, races, one crash kills all |
| CPU-bound work in Node | Child process or worker | Serialization at the boundary |
| Huge burst of sockets | Thread pool *or* event loop | Pool size vs latency |
| Untrusted code isolation | Restricted process, container, or VM | Separate address spaces alone do not remove filesystem or network permissions |

```ts
// Main thread owns the socket; workers own CPU. Sticky by request id.
function pickWorker(requestId: string, n: number): number {
  if (!Number.isInteger(n) || n < 1) throw new Error("Invalid worker count");
  let h = 0;
  for (let i = 0; i < requestId.length; i++) h = (h * 31 + requestId.charCodeAt(i)) | 0;
  return Math.abs(h) % n;
}

console.log(pickWorker("N-4", 4), pickWorker("N-4", 4), pickWorker("request-8", 4));

```

Sticky routing can keep ownership local if all access follows that rule. Hashing a request ID alone does not protect shared user state; route by the state key, handle worker failures, and define what happens when the pool size changes.

**Try it:** two requests modify the same account but have different request IDs. Can the hash above protect the account? No: they may reach different workers. Choose a shared ownership or synchronization rule.

## Common mistakes

- "Threads don't share memory." Native threads share an address space but have their own registers, stacks, and thread-local state. Stack memory is not inherently inaccessible to another thread.
- Equating goroutines/green threads with OS threads. User-space tasks multiplex onto fewer OS threads.
- Spawning a thread per request with no bound. You thrash the scheduler.
- Using a process pool and then sharing a mutable file without advisory locks.

## How to talk about it

"I use processes when I want a crash or a leak to stay in its box — browsers, plugin hosts, CI jobs. I use threads when workers need the same in-memory structure and I am willing to lock it. In a single-threaded runtime I will not claim async uses extra cores; I will add workers and serialize at the edge."

If they ask fork vs thread: "Fork copy-on-write-clones the map. Great for read-mostly children. The moment both sides mutate heavily, you paid for copies anyway — a thread might have been cheaper."

## Cross-links

- [Virtual addresses, physical pages, and locality](./os-memory.md) (id: os-memory)
- [Locks buy correctness, not speed](./locks-and-concurrency.md) (id: locks-and-concurrency)
- [HTTP is a conversation, TCP is the pipe](./http-and-tcp.md) (id: http-and-tcp)
- [Recursion is a stack you didn't allocate](./recursion-call-stack.md) (id: recursion-call-stack)
- [Splitting a keyspace so one box is not the product](../system-design/foundations/sharding/lesson.md) (id: sharding)
