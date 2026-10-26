---
id: load-balancing
title: Spreading work without creating a new bottleneck
slug: load-balancing
kind: concept
track: system-design
difficulty: intro
estimated_minutes: 12
summary: Route work using useful load signals and account for capacity loss, health checks, and reconnect bursts.
tags:
  - system-design
  - system-design/foundations
  - interviews
  - interviews/system-design
prerequisites:
  - interview-framework
related:
  - caching
  - sharding
  - interview-framework
  - http-and-tcp
  - rate-limiter
company_signal: []
sources_consulted:
  - https://builder.aws.com/content/3EumjoZascWd1oZiEgL8ORlv3qE/timeouts-retries-and-backoff-with-jitter
updated: 2026-10-26
status: canonical
---

# Spreading work without creating a new bottleneck

## Snapshot

- A load balancer chooses a backend for traffic; the selection unit may be a connection or an individual request.
- Backend count is not capacity until the workload has been measured.
- Health checks, draining, timeouts, and retry limits affect correctness during failure.
- Long-lived connections and multiplexed protocols need more care than simple request counts.

## Why it shows up in interviews

Adding replicas raises a new question: how does traffic reach a healthy replica without exceeding its capacity? Explain what the balancer knows, how quickly it reacts, and what happens to in-flight work.

## Core idea

### ELI5

Imagine several servers handling the same kind of request. A dispatcher chooses one, but must also notice unavailable servers and avoid sending every retry to the remaining overloaded servers.

Round-robin spreads selections. Least-connections considers open connections, which can be a poor proxy for work when connections have different request rates or multiplex many streams. Queue depth, latency, and outstanding-request measurements may better match the workload, but each signal is delayed and imperfect.

Keep liveness and readiness distinct. A process may be alive but unable to accept more work. Conversely, a shared database failure should not automatically cause every frontend to disappear from service if it can still return useful degraded responses. Design health checks around the behavior the backend can safely provide.

## Worked example

### Easy

Suppose a load test finds one instance can sustain 6,000 requests/s for a defined request mix and latency target. Twelve such instances have an ideal aggregate capacity of 72,000/s. At a 58,000/s peak, the arithmetic headroom is 14,000/s, not 72,000/s.

### Medium

Losing one instance leaves 66,000/s of ideal capacity; losing two leaves 60,000/s. That second failure leaves only 2,000/s before the measured limit. Uneven traffic, startup time, and shared bottlenecks can reduce it further. Plan spare capacity and load shedding rather than treating the sum as a guarantee.

### Hard

A deploy stops a server with thousands of chat connections. Stop admitting new connections, allow a bounded drain period, then close remaining connections with a reconnect policy that spreads attempts over time. Clients must resume from durable cursors; routing alone does not preserve missed messages.

| Decision | Useful when | Limitation |
| --- | --- | --- |
| Round-robin | Backends and requests are similar | Does not observe work already running |
| Least-connections | Connection count approximates load | A few busy connections can dominate |
| Affinity by key | Local state or cache reuse matters | Hot keys and failover need handling |
| Request-aware routing | Per-request signals are available | More state and control-loop complexity |

**Try it:** traffic stays at 58,000/s but each retrying client immediately sends two copies after a timeout. Explain why adding one server may not stop the overload. Check for bounded retries, backoff, admission control, and whether replay is safe.

## Common mistakes

- Retrying a side effect merely because another backend is available.
- Removing all servers because one shared dependency is unhealthy.
- Equating connection count with request cost.
- Ignoring the time needed to start and warm new capacity.

## How to talk about it

“I will choose a routing signal that matches the work, measure capacity under the expected mix, and reserve capacity for a failure. During overload I will bound retries and shed work before queues grow without limit.”

## Cross-links

- [Forty-five minutes is a navigation problem](./interview-framework.md) (id: interview-framework)
- [Remembering the expensive answer nearby](./caching/lesson.md) (id: caching)
- [Splitting a keyspace so one box is not the product](./sharding/lesson.md) (id: sharding)
- [Enforce request budgets across servers](../cases/rate-limiter/lesson.md) (id: rate-limiter)
- [Create and resolve short links safely](../cases/url-shortener/lesson.md) (id: url-shortener)
- [HTTP is a conversation, TCP is the pipe](../../cs/http-and-tcp.md) (id: http-and-tcp)
