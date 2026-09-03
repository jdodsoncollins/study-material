---
id: job-scheduler
title: Cron, ad-hoc, leases, and retries
slug: job-scheduler
kind: case-study
track: system-design
difficulty: core
estimated_minutes: 18
summary: Clockyard runs cron and one-off work at 10k jobs/s by leasing, heartbeating, and putting poison on a dead-letter lane.
tags:
  - system-design
  - system-design/product-cases
  - system-design/messaging
  - interviews
  - interviews/system-design
prerequisites:
  - interview-framework
  - queues-delivery
related:
  - queues-delivery
  - notification-system
  - llm-serving
  - interview-framework
  - video-streaming
company_signal:
  - name: Meta
    evidence: Candidate-reported Hello Interview Meta loops describe a job scheduler (about 10k jobs/s, cron plus ad-hoc, retries, leases) as a recurring prompt.
    year: 2026
    confidence: medium
sources_consulted:
  - Hello Interview Meta job-scheduler reports (consulted, not copied)
  - Design Gurus 2026 FAANG guides
  - meta/RESEARCH.md frequency table
updated: 2026-09-02
status: canonical
---

# Cron, ad-hoc, leases, and retries

## Snapshot

- Product: **Clockyard**. It runs two kinds of work: **cron** ("every weekday at 08:00 in `America/Denver`") and **ad-hoc** ("encode this Stagecast title in 30s").
- Throughput target from candidate reports: **~10k jobs/s** dispatched, mixed sizes. v1 is not a Kubernetes replacement.
- A job is not done when you *start* it. A **lease** plus heartbeat owns a run. Crash → lease expires → someone else runs it, so the handler must be idempotent.
- Retries are bounded. Then **DLQ**. There is no infinite cron of a poison payload.

## What this round is actually scoring

Meta-flavor: can you schedule, dispatch, fence a run, and retry without double-applying a side effect? They will ask about overlapping cron ("the 08:00 run is still going at 08:05") and about a worker that dies holding a lease.

## Company signal

Candidate-reported Hello Interview Meta loops describe a job scheduler at ~10k jobs/s with cron + ad-hoc, retries, and leases. Confidence: **medium** (repeated in that community, not independently everywhere). Label it candidate-reported / prep-site frequency.

## Requirements

| Functional | v1 decision |
| --- | --- |
| Cron with timezone | IANA TZ, not "server local" |
| One-off / delayed | `run_at` timestamp |
| Manual run / cancel | By `job_id` |
| Retries | 5, exponential backoff, then DLQ |
| Overlap policy | `forbid` (default) or `allow` per job |

| Non-functional | Budget |
| --- | --- |
| Dispatch | 10k jobs/s peak |
| Scheduling jitter | ±1 s for cron is fine |
| Lease | 30s, heartbeat every 10s |
| Durability of "this run happened" | On disk before ack to the worker |
| Exactly-once *start* | No; exactly-once *effect* via idempotent handlers |

## Back-of-envelope

10k/s dispatch. If each due-scan is a SQL `WHERE run_at <= now()` on one table, you lose. Partition **RunLog** by time (1-minute buckets) and by shard.

Cron expansion: 2 million cron definitions, many idle. Do not wake 2 million rows every second. Keep a **next_fire_at** index and only tick the due set. 2e6 crons, even if 10% fire hourly, is ~56/s of cron *starts* — ad-hoc is what makes 10k/s.

Payloads stay in object storage if > 10 KB. RunLog holds ids, state, lease owner, attempt.

## Design

[lease](viz/lease.md)

**Definitions** table: cron expression, TZ, handler name, overlap policy, retry policy.

**Ticker** (a small fleet, sharded by `definition_id`): every second, claim due rows with `UPDATE ... WHERE next_fire_at <= now() AND shard = me`. Compute the next fire, insert a **Run** row `state=ready`.

**LeasePicker** workers: `SELECT ... FOR UPDATE SKIP LOCKED` (or a queue) on `ready` runs, set `state=leased`, `lease_until=now()+30s`, `owner=worker_id`. The worker runs the handler. Heartbeat extends `lease_until`. Success → `done` plus a `work_id` the handler used for idempotency. Failure → `ready` with backoff, or `dead` after 5.

Handlers for Herald, LadderEncoder, Till reconcile, Lexicon builder, Kiln GPU jobs: they receive `run_id` and treat it as the idempotency key. See [queues-delivery](../../foundations/queues-delivery/lesson.md) (id: queues-delivery).

Overlap `forbid`: if the previous run is still `leased`, skip this fire and record `skipped_overlap` rather than stacking.

## Tradeoffs

| Choice | Gain | Cost |
| --- | --- | --- |
| DB as the queue vs a broker | Transactions with state | Due-scan must be sharded |
| Lease + heartbeat vs "start and hope" | Crash recovery | Clock skew; workers must heartbeat |
| Expand cron ahead of time vs on tick | Smoother load | Extra rows, cancel is messier |
| `forbid` overlap vs concurrent | Safe for "daily billing" | A stuck lease delays the next fire |

## Failure modes

- Worker dies without releasing: wait out `lease_until`, then another worker takes it. Too-short leases double-run healthy jobs; 30s is the interview default.
- Ticker split-brain: shard ownership via a small lock table; two tickers must not insert two runs for the same `(definition_id, fire_at)`. Unique index on that pair.
- Poison handler: 5 fails → DLQ, page, do not block the shard.
- TZ / DST: store TZ name, compute next fire with a library, never "cron in UTC plus a comment."

## Follow-ups an interviewer may ask

- 10k/s *executions* that each take 2s: that is a worker-fleet problem (Kiln, encoders), not a ticker problem. Separate dispatch from execute.
- DAG of jobs: v2. v1 is a single handler.
- Fairness: per-tenant tokens so one merchant cannot consume the 10k/s.

## Cross-links

- [At-least-once, idempotency, and the dead-letter lane](../../foundations/queues-delivery/lesson.md) (id: queues-delivery)
- [Fan-out that survives flaky devices](../notification-system/lesson.md) (id: notification-system)
- [Batching tokens onto scarce GPUs](../llm-serving/lesson.md) (id: llm-serving)
- [Chunked playback from ingest to CDN](../video-streaming/lesson.md) (id: video-streaming)
- [Making a double-click charge once](../payment-idempotency/lesson.md) (id: payment-idempotency)
- [Forty-five minutes is a navigation problem](../../foundations/interview-framework.md) (id: interview-framework)
