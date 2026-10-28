---
id: metrics-pipeline
title: Collect fleet metrics and logs without drowning in labels
slug: metrics-pipeline
kind: case-study
track: system-design
difficulty: deep
estimated_minutes: 22
summary: Size a checkout fleet's metrics and logs from series counts, buffer at the edge, commit to a durable ingest log, roll up into retention tiers, and cap cardinality before one label melts the store.
tags:
  - system-design
  - system-design/product-cases
  - system-design/messaging
  - system-design/storage
  - interviews
  - interviews/system-design
prerequisites:
  - queues-delivery
  - sharding
related:
  - queues-delivery
  - message-queue
  - sharding
  - rate-limiter
  - leaderboard
company_signal: []
sources_consulted:
  - https://prometheus.io/docs/practices/naming/
  - https://prometheus.io/docs/practices/instrumentation/
  - https://opentelemetry.io/docs/specs/otel/metrics/data-model/
updated: 2026-10-28
status: canonical
---

# Collect fleet metrics and logs without drowning in labels

## Snapshot

- Size metrics by **active series** (metric name × label combinations), not by host count. Size logs by bytes.
- An agent on each host buffers to local disk; the pipeline acknowledges once a batch reaches a replicated ingest log.
- Retention tiers keep raw samples briefly and rollups for months. Rollups keep count, sum, min, and max, because averages of averages and averages of percentiles are wrong.
- A per-tenant series limit at ingest is the cardinality defense. Without it, one `cart_id` label can create millions of series in minutes.

## What this round is actually scoring

Whether your numbers come from series and bytes, whether you can say where a sample becomes durable, and whether the monitoring system can still raise an alert while its own pipeline is backed up.

## Company signal

This is an original practice scenario. No traceable company-specific frequency evidence is supplied.

## Requirements

| Area | Requirement |
| --- | --- |
| Metrics | Counters, gauges, and histograms from every checkout service instance |
| Logs | Structured application logs, searchable by service, time, and request ID |
| Query | Dashboards over the last hour (fast) and the last year (slower is fine) |
| Alerts | Rules such as "checkout error rate above 2% for 5 minutes" fire within a minute |
| Retention | Raw metrics 15 days; rollups 13 months; logs searchable 7 days, archived 90 |
| Isolation | One team's bad label cannot degrade every other team's dashboards |

## Back-of-envelope

These are illustrative workload assumptions, not production measurements. Compression ratios depend on the data and the engine.

**Metrics**

- 6,000 service instances × 1,500 active series each = **9 million active series**.
- Scraped every 15 s: 9,000,000 / 15 = **600,000 samples/s**.
- Assume about 1.5 bytes per sample after time-series compression (delta-of-delta timestamps, XOR-encoded floats). 600,000 × 86,400 × 1.5 B ≈ **78 GB/day**, so 15 days of raw samples is about **1.2 TB**.
- 5-minute rollups storing count, sum, min, max: 9 M series × 288 windows/day × 4 values × 1.5 B ≈ **15.6 GB/day**, about **6.1 TB** for 13 months.

**Logs**

- 6,000 instances × 50 lines/s × 400 bytes = **120 MB/s**, or about **10.4 TB/day** raw.
- At an assumed 8× compression, 1.3 TB/day: 7 days hot is about 9.1 TB plus index; 90 days in object storage is about 117 TB.
- Per host, 50 lines/s × 400 B = 20 KB/s. An hour of local disk buffer is about 72 MB. Cheap insurance.

**Cardinality**

- Someone adds `cart_id` to `checkout_latency_seconds`, a histogram with 12 buckets. Two million carts a day × 12 buckets = **24 million new series** — almost three times the whole fleet's baseline, from one line of code.

## Design

### ELI5

Every server keeps a little notebook of measurements. A courier picks up pages and drops them in a big, copied mailbox; once they are in the mailbox, the server can tear them out of its notebook. Sorters read the mailbox, write detailed pages to a short-term shelf and summaries to a long-term shelf. A bouncer at the mailbox refuses pages that would invent millions of new labels.

### Operation and authoritative state

- **Edge.** An agent per host scrapes local endpoints and tails log files. It batches (for example, 1 s or 1 MB), compresses, and sends. If sending fails, it spills to a bounded disk buffer and drops lowest-priority data (debug logs first) when the buffer fills.
- **Ingest gateway.** Authenticates the tenant, validates, applies limits, and appends to a partitioned, replicated **ingest log** keyed by series hash (metrics) or by service and time (logs). The ingest log is the authoritative record of what was accepted.
- **Metrics writers.** Consume the log and append to a time-series database sharded by series hash. Each shard keeps the most recent two hours in memory with a write-ahead log, then flushes immutable compressed blocks.
- **Rollup jobs.** Turn closed blocks into 5-minute rollups with `count, sum, min, max`, and histogram bucket counts (or mergeable sketches) for percentiles. Raw blocks older than 15 days are deleted; rollups live for 13 months in cheaper storage.
- **Log indexers.** Consume the log, build a small index on service, level, time, and request ID, and store compressed chunks. After 7 days the index is dropped and chunks move to object storage, searchable by slower scan.
- **Alert evaluator.** Reads the recent in-memory data on the writers directly, or a dedicated fast path, so it does not wait behind long-term storage.

### Cardinality limits

At the gateway, track active series per tenant and per metric (an approximate distinct counter such as HyperLogLog is enough). Over the limit, reject **new** series for that metric while still accepting existing ones, and emit a clear error metric the owning team can see. Publish naming guidance: labels are for bounded sets (service, region, status code), never for user, cart, or request IDs. Those belong in logs or traces.

### Commit boundary

A batch is **accepted** when the ingest log has replicated it (for example, two of three replicas). Only then does the gateway acknowledge the agent, and only then does the agent free its buffer. If the ack is lost, the agent resends; batches carry `(agent_id, batch_seq)` so writers can drop duplicates, and time-series appends of an identical `(series, timestamp, value)` are idempotent.

### Recovery behavior

- **Ingest log slow.** Agents buffer locally for up to an hour. Past that, they drop the oldest debug data first and count what they dropped.
- **TSDB shard down.** Its partition of the ingest log keeps growing. When the replacement shard starts, it replays from its last committed offset. Dashboards show a gap that fills in.
- **Late samples.** Accept samples up to a bounded age (say 1 hour) into the head block; older ones are rejected and counted, because rewriting compressed blocks is expensive.
- **Watching the watcher.** Run a small, independent monitor that alerts when ingest lag, rejected-series counts, or agent buffer usage climb. If it lives inside the pipeline it monitors, it goes quiet exactly when you need it.

## Tradeoffs

| Choice | Benefit | Cost |
| --- | --- | --- |
| Pull (scrape) metrics | Server knows who should report; a missing target is visible | Needs service discovery; short-lived jobs need a push gateway |
| Push from agents | Works through NAT and for batch jobs | Harder to tell "dead" from "quiet" |
| Durable ingest log in front | Absorbs bursts; replay after writer failures | One more system; adds seconds of lag |
| Raw 15 days, rollups 13 months | Cheap long-range dashboards | No per-sample detail for old incidents |
| Full-text log index | Search anything | Index can cost as much as the data; label-only index plus scan is cheaper |
| Hard series limit | Protects every tenant | A team loses new metrics until they fix labels |

## Failure modes

- **Label explosion.** The `cart_id` example above. The gateway limit stops it; the error metric tells the team why their chart is empty.
- **Averaged percentiles.** A long-range dashboard averages per-host p99s and shows a calm number during a real spike. Store bucket counts and compute percentiles from merged buckets.
- **Log storm.** A retry loop logs 5,000 lines/s per host. Rate-limit per source at the agent and sample repeated messages.
- **Clock skew.** A host's clock runs 10 minutes fast; its samples are rejected as "too far in the future". Alert on skew per host.
- **Alerting through the backlog.** If alerts read from long-term storage, a 20-minute ingest lag delays every page by 20 minutes.

## Follow-ups an interviewer may ask

**Easy:** a new service adds 300 instances with 2,000 series each. How many samples per second and how much raw storage per day does that add?

**Medium:** the ingest log is down for 30 minutes. Walk through the agent's buffer, what is dropped, and what the dashboards show afterward.

**Hard:** a team needs per-customer latency for their 50 largest customers. Design it without letting every customer ID become a label.

## Cross-links

- [At-least-once, idempotency, and the dead-letter lane](../foundations/queues-delivery/lesson.md) (id: queues-delivery)
- [Keep an order-event log with offsets and redelivery](./message-queue/lesson.md) (id: message-queue)
- [Splitting a keyspace so one box is not the product](../foundations/sharding/lesson.md) (id: sharding)
- [Enforce request budgets across servers](./rate-limiter/lesson.md) (id: rate-limiter)
- [Rank a weekly puzzle leaderboard](./leaderboard.md) (id: leaderboard)
