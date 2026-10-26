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
  - interviews
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
company_signal: []
sources_consulted:
  - https://www.rfc-editor.org/rfc/rfc9110.html
updated: 2026-10-26
status: canonical
---

# A budget for in-flight requests

## Snapshot

- Transport concurrency limits vary with browser and protocol. Bound application work deliberately instead of relying on an unspecified browser limit.
- A **budget** is an integer: how many requests may be in flight. Everyone else waits on a line.
- Use per-origin limits for downstream pressure and, when needed, a global cap for memory, CPU, or radio usage. Prioritize visible content over background work.
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

This is the same shape as a semaphore. The number is the product decision. A cap of 3 is the example here, not a universal mobile recommendation. Measure latency, memory, and error rates to tune it. "Unlimited" is not a number.

```ts
function runBudget(jobs: number, budget: number): number[][] {
  if (!Number.isSafeInteger(jobs) || jobs < 0 || !Number.isSafeInteger(budget) || budget < 1)
    throw new Error("Invalid budget");
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

Part 2 returns `429` with `Retry-After: 2`. Pause new starts for the affected rate-limit scope until its cooldown expires. Holding only this request’s slot would still let other slots send traffic. Release the network slot while waiting, then requeue the retry under the same cap and cooldown. Retry-After may be a number of seconds or an HTTP date.

### Hard

The user backgrounds the app with five parts queued. Apply the product’s lifecycle policy: cancel queued work and request cancellation of active transfers, or hand approved work to a supported background-transfer mechanism. Aborting a queue alone does not stop active requests. Preserve only verified durable ranges and resume the missing ones later.

**Try it:** if each of three requests takes 10 ms, does a concurrency cap of three enforce three requests per second? No: it can start far more over a second. Use a separate rate policy when the contract is about rate.

## Common mistakes

- Starting every thumbnail on a 400-photo grid at once can waste resources and delay visible content. Use priorities and bounded concurrency.
- Treating the budget as a retry policy. The budget says how many. [One dead chunk is not a dead file](./chunk-retry.md) (id: chunk-retry) says whether a given part may try again.
- Using only an undifferentiated global queue. Separate priorities and per-origin limits can keep analytics from blocking visible downloads; a global resource ceiling may still be useful.
- Ignoring `429` and launching the rest of the queue anyway. That is a retry storm.

## How to talk about it

"I keep an in-flight cap per origin, queue the rest, and start the next job when a slot frees. On `429` I apply Retry-After to the affected queue scope, then requeue eligible retries. Leaving the screen aborts waiters. The server still enforces its own rate limits. My pool controls local concurrency, not requests per second."

## Cross-links

- [A large file is a list of ranges](./ranged-download.md) (id: ranged-download)
- [One dead chunk is not a dead file](./chunk-retry.md) (id: chunk-retry)
- [A download is bytes plus a name](./file-download.md) (id: file-download)
- [Enforce request budgets across servers](../system-design/cases/rate-limiter/lesson.md) (id: rate-limiter)
- [HTTP is a conversation, TCP is the pipe](./http-and-tcp.md) (id: http-and-tcp)
