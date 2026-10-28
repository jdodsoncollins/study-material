---
id: upload-slots
title: Finish times when only k uploads run at once
slug: upload-slots
kind: problem
track: cs
difficulty: core
estimated_minutes: 16
summary: Compute when each queued upload finishes under a fixed concurrency limit by always handing the next job to the slot that frees first, then turn the same idea into a real async pool.
tags:
  - cs
  - cs/concurrency
  - algorithms
  - algorithms/heaps
  - interviews
  - interviews/leetcode
prerequisites:
  - request-budget
  - heaps-top-k
related:
  - request-budget
  - heaps-top-k
  - room-count
  - locks-and-concurrency
company_signal: []
sources_consulted:
  - https://tc39.es/ecma262/multipage/control-abstraction-objects.html#sec-promise.all
updated: 2026-10-28
status: canonical
---

# Finish times when only k uploads run at once

## Snapshot

- Jobs start in queue order. At most `limit` run at once. A job starts the moment any slot frees.
- Track when each slot becomes free. The next job always goes to the slot with the smallest free time.
- Small `limit`: scan the slot array, O(n · k). Large `limit`: a min-heap of free times, O(n log k).
- `limit >= n` means every job starts at zero and finishes at its own duration.
- The same picture is the interview follow-up "now write the async pool": `limit` workers pulling from one shared index.

## Prompt

A photo app uploads a queue of photos. Each upload takes a known number of milliseconds. The client allows at most `limit` uploads in flight and starts queued photos in order as slots free up. Return the finish time of each photo, in queue order.

Example: durations `[400, 250, 300, 100, 500, 200]`, `limit = 2`.

| Photo | Starts | Finishes |
| --- | --- | --- |
| 0 | 0 | 400 |
| 1 | 0 | 250 |
| 2 | 250 | 550 |
| 3 | 400 | 500 |
| 4 | 500 | 1000 |
| 5 | 550 | 750 |

Result: `[400, 250, 550, 500, 1000, 750]`. The whole batch is done at 1000.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "At most k at once", "pool", "workers" | Track k slot free times |
| "Start in order as slots free" | Greedy: next job to earliest free slot |
| "When does everything finish?" | Max of the finish times |
| Follow-up "write it with promises" | Same idea: k workers share a next-index counter |
| Rooms or meetings overlapping | Same heap of end times as [room count](../algorithms/problems/room-count.md) (id: room-count) |

## Worked approach

### ELI5

Two upload lanes, each with a stopwatch showing when it is next free. Both read zero. Take the next photo, give it to whichever lane frees first, and push that lane's stopwatch forward by the photo's duration. The new stopwatch value is that photo's finish time. Repeat until the queue is empty.

1. `free = [0, 0, …]` with `limit` entries.
2. For each duration: find the smallest `free[i]`. Start there.
3. `finish = free[i] + duration`; record it; set `free[i] = finish`.

### Syntax

```ts
const free = [0, 0];
const i = free.indexOf(Math.min(...free));
free[i] += 400;
console.log(free, "photo 0 finishes at", free[i]); // [ 400, 0 ] photo 0 finishes at 400
```

### Then the details

The footgun is starting a job at its predecessor's finish time instead of at the earliest free slot. Another is a `limit` of zero, which never finishes; reject it.

```ts
function finishTimes(durations: number[], limit: number): number[] {
  if (!Number.isInteger(limit) || limit < 1) throw new Error("limit must be a positive integer");
  const free = new Array(Math.min(limit, durations.length)).fill(0);
  return durations.map((ms) => {
    let best = 0;
    for (let s = 1; s < free.length; s++) if (free[s] < free[best]) best = s;
    free[best] += ms;
    return free[best];
  });
}

console.log(finishTimes([400, 250, 300, 100, 500, 200], 2)); // [ 400, 250, 550, 500, 1000, 750 ]
console.log(finishTimes([300, 300], 5), finishTimes([], 3)); // [ 300, 300 ] []
```

For large `limit`, replace the scan with a min-heap of free times: pop the smallest, add the duration, push it back. The answer is identical.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Simulate millisecond by millisecond | O(total time · k) | O(k) | Reject |
| Slot array, scan for min | O(n · k) | O(k) | Default for small k (browsers, clients) |
| Min-heap of free times | O(n log k) | O(k) | Large k, say a server worker pool |

## Walkthrough

### Easy

`limit = 2`, durations `[400, 250]`. Both slots are free at 0. Photo 0 finishes at 400, photo 1 at 250. `[400, 250]`.

### Medium

Continue with `300, 100, 500, 200`. Slots `[400, 250]`. Photo 2 takes the slot free at 250 → 550. Slots `[400, 550]`. Photo 3 takes 400 → 500. Slots `[500, 550]`. Photo 4 takes 500 → 1000. Slots `[1000, 550]`. Photo 5 takes 550 → 750. The finish order (1, 0, 3, 2, 5, 4) differs from the start order; that is why results are returned by queue position, not by completion.

### Hard

"Now write the real thing." The same idea becomes `limit` async workers that share one `next` counter. JavaScript runs one callback at a time, so `next++` between awaits is safe without a lock. In a multi-threaded language that counter would need an atomic or a lock.

```ts
async function pool<T>(jobs: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results: T[] = new Array(jobs.length);
  let next = 0;
  async function worker() {
    while (next < jobs.length) {
      const i = next++;
      results[i] = await jobs[i]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, jobs.length) }, worker));
  return results;
}

let inFlight = 0, peak = 0;
const jobs = [400, 250, 300, 100, 500, 200].map((ms) => async () => {
  inFlight++;
  peak = Math.max(peak, inFlight);
  await null;
  inFlight--;
  return ms;
});
pool(jobs, 2).then((r) => console.log(r, "peak in flight:", peak)); // results in queue order, peak 2
```

Follow-ups to expect: one job rejects (does the pool stop or collect errors?), cancellation when the user leaves the screen, and retry with backoff. Those belong to [request budgets](./request-budget.md) (id: request-budget).

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Start each job at the previous job's finish | Serial schedule, wrong times | Start at the earliest free slot |
| Return times in finish order | Caller cannot map results to photos | Keep queue order |
| `limit = 0` | Infinite wait | Validate and throw |
| `Promise.all(jobs.map(run))` | No limit at all | k workers sharing an index |
| Results pushed as jobs finish | Order scrambled | Write to `results[i]` |
| Shared counter in a threaded language | Two workers take the same job | Atomic increment or a lock |

## Interview moves

- Draw the slots as two horizontal bars on a timeline. Point at the gap where photo 3 starts at 400.
- State the greedy rule in one sentence before code: "next job to the earliest free slot."
- Offer the scan for small k and the heap for large k, and say which one you are writing.
- When they say "make it real", reuse the same words: slots become workers, the queue becomes a shared index.
- Mention failure handling unprompted: reject fast or collect, plus cancellation.

## Cross-links

- [Bound in-flight requests with a budget](./request-budget.md) (id: request-budget)
- [Heaps for the k hottest](../algorithms/patterns/heaps-top-k.md) (id: heaps-top-k)
- [Rooms needed for overlapping bookings](../algorithms/problems/room-count.md) (id: room-count)
- [Locks keep invariants under concurrent writers](./locks-and-concurrency.md) (id: locks-and-concurrency)
