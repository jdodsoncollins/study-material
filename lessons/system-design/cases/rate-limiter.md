---
id: rate-limiter
title: Token buckets and sliding windows at the edge
slug: rate-limiter
kind: case-study
track: system-design
difficulty: core
estimated_minutes: 16
summary: QuotaDesk meters ClipForge with local token buckets for cheap shed and a shared sliding window when fairness across boxes matters.
tags:
  - system-design
  - system-design/product-cases
  - system-design/caching
  - interviews
  - interviews/system-design
prerequisites:
  - interview-framework
  - caching
  - load-balancing
related:
  - caching
  - load-balancing
  - interview-framework
  - http-and-tcp
  - payment-idempotency
company_signal:
  - name: Amazon
    evidence: Candidate-reported mid-level loops and prep-site frequency (Hello Interview community reports) treat rate limiting as a high-frequency prompt at Amazon, Meta, and Google.
    year: 2026
    confidence: high
  - name: Meta
    evidence: Prep-site frequency and candidate reports pair rate limiting with feed/chat abuse and API gateway talks.
    year: 2026
    confidence: medium
sources_consulted:
  - Hello Interview Rate Limiter community reports (consulted, not copied)
  - Design Gurus 2026 FAANG guides
  - r/leetcode system-design threads on token buckets
updated: 2026-09-02
status: canonical
---

# Token buckets and sliding windows at the edge

## Snapshot

- Product: **QuotaDesk**, the meter in front of ClipForge mint/resolve (and later Till). It is a policy engine, not a generic "Redis sidecar" slogan.
- **Token bucket** answers "smooth bursts." **Sliding window** answers "no more than N in the last T seconds" with fairer boundaries than a fixed clock minute.
- A purely local limiter is fast and wrong across 12 API boxes. A purely central limiter is correct and becomes the outage.
- v1: per `api_key` and per IP, two policies, fail-open vs fail-closed chosen *per endpoint*.

## What this round is actually scoring

Can you pick an algorithm for a named policy, place it so it does not add 40 ms, and describe what happens when the meter store is down? They will ask you to compare bucket vs window. They will then ask about distribution.

## Company signal

Candidate-reported mid-level loops and prep-site frequency (Hello Interview community reports) put rate limiting near the top at Amazon, Meta, and Google. Confidence: **high**. This is not an official bank; it is how often the prompt appears in writeups.

## Requirements

| Functional | v1 decision |
| --- | --- |
| Cap mint per api_key | 30/min sustained, burst 10 |
| Cap resolve per IP | 600/min |
| Return standard 429 + `Retry-After` | Yes |
| Admin changes a quota | Visible within 10s |
| Per-user vs per-IP vs per-key | Key for partners, IP for anonymous |

| Non-functional | Budget |
| --- | --- |
| Extra latency p99 | ≤ 3 ms in-region |
| Accuracy | ±5% is acceptable for resolve; mint is stricter |
| Peak decisions | 58k resolve/s + 580 mint/s |
| Dependency failure | Resolve fail-open, mint fail-closed |

## Back-of-envelope

58k decisions/s. If each central increment is a 1 RTT Redis write (~0.4 ms p50), a 3-node **MeterStore** at 80k simple ops/s/node is enough *if keys are spread*. One viral IP hashes to one hot slot — same hot-key talk as [caching](../foundations/caching.md) (id: caching).

Local buckets on 12 Resolve boxes: 58k / 12 ≈ 4.8k/s/box, all in process. Accuracy across boxes for a 600/min IP cap is poor (worst case 12×). That is fine for resolve. It is not fine for mint-by-key at 30/min.

## Design

Two layers:

1. **Edge bucket** in each API process: token bucket, refill rate = policy / number of boxes as a *hint*, plus a small local burst. Used to shed obvious abuse without a network hop.
2. **MeterStore** (Redis-style, sharded by key): sliding window for mint, and for any policy marked `strict`.

Sliding window without a lecture: keep a sorted set of timestamps per key, drop samples older than T, `ZCARD`, reject if ≥ N, else add now. For 30/min this is tiny. For 600/min per IP at 58k QPS you cannot store every sample for every IP — switch to a **window counter** (current window + previous window, weighted by overlap). Mention both; pick window counters for resolve, sorted samples for mint.

Config lives in a 10s snapshot (same idea as [feature flags](./feature-flags.md) (id: feature-flags)). QuotaDesk does not call a database on the 58k/s path.

Placement: in-process library first, MeterStore second. Not a separate hop after the balancer unless you already have an L7 filter fleet.

## Tradeoffs

| Algorithm | Burst behavior | Memory | Distributed story |
| --- | --- | --- | --- |
| Fixed window | 2N at the boundary | One counter | Trivial INCR |
| Sliding window log | Smooth, accurate | One timestamp per event | Too fat at resolve QPS |
| Sliding window counter | Near-smooth | Two counters | Good default |
| Token bucket | Burst up to bucket, then steady | Two numbers (tokens, time) | Local is natural; central needs Lua/CAS |

Fail-open on resolve: a MeterStore outage should not take ClipForge down. Fail-closed on mint and on Till capture.

## Failure modes

- Clock skew across boxes: prefer store time, not app time, for strict keys.
- Hot api_key: replicate that one MeterStore slot or pin it with a local cache of "already 429."
- Config push of `0` to everyone: two-person rule, versioned snapshots, instant rollback.
- Retry storms after 429: jittered `Retry-After`. Coordinate with [queues-delivery](../foundations/queues-delivery.md) (id: queues-delivery) consumers.

## Follow-ups an interviewer may ask

- Rate limit by URL path vs by user: different keys, same engine.
- Distributed consistency of the count: we want *good enough* shed, not a linearizable counter, except on money endpoints.
- Sliding window vs leaky bucket naming: leaky bucket is constant drain; token bucket is the one you want for APIs.

## Cross-links

- [Remembering the expensive answer nearby](../foundations/caching.md) (id: caching)
- [Spreading work without creating a new bottleneck](../foundations/load-balancing.md) (id: load-balancing)
- [Minting short keys for a read-heavy lookup](./url-shortener.md) (id: url-shortener)
- [Making a double-click charge once](./payment-idempotency.md) (id: payment-idempotency)
- [Shipping dark, flipping in production](./feature-flags.md) (id: feature-flags)
- [HTTP and TCP as interview tools](../../cs/http-and-tcp.md) (id: http-and-tcp)
- [Forty-five minutes is a navigation problem](../foundations/interview-framework.md) (id: interview-framework)
