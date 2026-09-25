---
id: request-budget
title: A budget for in-flight requests
slug: request-budget
kind: concept
track: cs
difficulty: core
estimated_minutes: 16
summary: Cap how many HTTP calls run at once, queue the rest, and back off when the server says you are too fast.
tags:
  - cs
  - cs/networking
  - cs/concurrency
  - interviews/system-design
prerequisites:
  - http-and-tcp
  - ranged-download
related:
  - ranged-download
  - chunk-retry
  - file-download
  - rate-limiter
  - http-and-tcp
company_signal:
  - name: Meta
    evidence: Client and backend screens ask why a page that fires 200 requests on load fails, and what a pool or a gate does about it.
    year: 2026
    confidence: medium
sources_consulted:
  - Browser per-host connection limits and HTTP/2 stream behavior
  - 429 Retry-After and client pool writeups
updated: 2026-09-25
status: canonical
---

# A budget for in-flight requests

## Snapshot

- Browsers will not actually run 200 GETs at once. They queue, stall, or fail. You should queue on purpose.
- A **budget** is an integer: how many requests may be in flight. Everyone else waits on a line.
- The budget is per host, not global. Eight calls to RollKeep plus eight to an analytics host are two budgets.
- `429` and `503` mean "slow down," not "try all of them again immediately." Honor `Retry-After` when it is there.
- Cancel the waiters when the user leaves. A queue that outlives the screen is how you saturate the radio after the page is gone.

| Control | What it limits | What it does not |
| --- | --- | --- |
| In-flight budget | Concurrent requests from this client | The server's global rate |
| Server limiter | Requests the server will accept | How polite this one client is |
| Retry cap | Tries of one part | How many parts run together |

## Why it shows up in interviews

Any screen that fans out — gallery thumbs, eight file parts, a crawler — gets "what if there are 10,000?" The answer is a gate, not a bigger `Promise.all`.

## Core idea

### ELI5

You have 8 parts of `clip-19.mp4` and a budget of 3.

1. Start parts 0, 1, 2.
2. When one finishes, start the next waiter.
3. Never more than 3 on the wire.
4. If a call comes back `429`, do not start the next one yet. Wait, then let that same part try again.

```
budget 3
in flight: 0 1 2
waiting:   3 4 5 6 7
```

This is the same shape as a semaphore. The number is the product decision. 3 is a fine mobile default. 32 can be fine on HTTP/2 to one origin if you measured it. "Unlimited" is not a number.

```ts
function runBudget(jobs: number, budget: number): number[][] {
  const waves: number[][] = [];
  for (let i = 0; i < jobs; i += budget) {
    const wave: number[] = [];
    for (let j = i; j < Math.min(i + budget, jobs); j += 1) wave.push(j);
    waves.push(wave);
  }
  return waves;
}

console.log(runBudget(8, 3));
```

The waves above are the picture, not the implementation. A real pool starts the next job the moment one slot frees, so you do not wait for the slowest of a wave. The invariant is the same: `inFlight <= budget`.

## Worked example

### Easy

8 parts, budget 3. Peak in flight is 3. Total requests is still 8 if none fail.

### Medium

Part 2 returns `429` with `Retry-After: 2`. That slot stays occupied by the retry timer. You do not immediately launch part 3 into a host that just told you to stop. After the pause, part 2 retries in that same slot.

### Hard

The user backgrounds the app with 5 parts still queued. Abort the queue. In-flight bodies stop. Finished parts stay on disk. Coming back resumes the missing indexes under the same budget.

## Common mistakes

- `Promise.all` of every thumb on a 400-photo grid. You will hit the per-host cap and time out the ones that mattered.
- Treating the budget as a retry policy. The budget says how many. [chunk-retry](./chunk-retry.md) (id: chunk-retry) says whether a given part may try again.
- One global pool for every host. A slow analytics call then blocks the file you actually need.
- Ignoring `429` and launching the rest of the queue anyway. That is a retry storm.

## How to talk about it

"I keep an in-flight cap per origin, queue the rest, and start the next job when a slot frees. On `429` I hold the slot for `Retry-After` instead of refilling it. Leaving the screen aborts waiters. The server still has its own limiter; mine is so I do not become the incident."

## Cross-links

- [A large file is a list of ranges](./ranged-download.md) (id: ranged-download)
- [One dead chunk is not a dead file](./chunk-retry.md) (id: chunk-retry)
- [A download is bytes plus a name](./file-download.md) (id: file-download)
- [Token buckets and sliding windows at the edge](../system-design/cases/rate-limiter/lesson.md) (id: rate-limiter)
- [HTTP is a conversation, TCP is the pipe](./http-and-tcp.md) (id: http-and-tcp)
