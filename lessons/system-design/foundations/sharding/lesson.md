---
id: sharding
title: Splitting a keyspace so one box is not the product
slug: sharding
kind: concept
track: system-design
difficulty: core
estimated_minutes: 16
summary: Sharding is how you split a keyspace so growth hits more boxes, and how you avoid turning one celebrity key into one celebrity box.
tags:
  - system-design
  - system-design/foundations
  - system-design/storage
  - interviews
  - interviews/system-design
prerequisites:
  - interview-framework
related:
  - caching
  - cap-and-consistency
  - url-shortener
  - ride-hailing
  - indexes
company_signal:
  - name: Google
    evidence: Candidate-reported loops and prep-site frequency notes treat shard maps, rebalancing, and hot-key handling as the depth probe after a candidate draws "sharded DB."
    year: 2026
    confidence: high
  - name: Meta
    evidence: Candidate-reported feed and messenger designs get pushed on user-sharded inboxes versus global stores, and on celebrity keys that pin a shard.
    year: 2026
    confidence: high
sources_consulted:
  - Design Gurus 2026 FAANG guides
  - Hello Interview community reports on feed/chat storage
  - r/OfferEngineering threads on hot partitions
updated: 2026-09-02
status: canonical
---

# Splitting a keyspace so one box is not the product

## Snapshot

- A shard is a slice of a keyspace with its own storage and failure domain. You shard when one box cannot hold the data or the QPS.
- You must pick a **shard key** that matches the query. User-id for "all of Alice's messages." Geo-hex for "cars near this pin." Time-only keys make one shard take today.
- Rebalancing is the hard part. Hash rings with virtual nodes move a little data at a time. Directory tables are flexible and become a hotspot.
- Hot keys do not care about your hash. A stadium author or a viral clip needs a special path, not a bigger box.

## Why it shows up in interviews

"We'll shard the database" is the new "we'll add a cache." Interviewers wait to hear the key, the query that *cannot* cross shards, and what you do when shard 7 is at 90% CPU. Google-style depth lives here. Meta-style product loops live here when fan-out writes pin an inbox.

## Core idea

[keyspace](viz/keyspace.md)

Write the access pattern first:

1. Resolve a clip by `clip_id` — shard on `clip_id`.
2. List Alice's last 50 kettle messages — shard on `conversation_id` or `alice_id`, not on message id.
3. Find idle Driftway drivers in a hex — shard on geo-hex, and accept that a city-center hex is hotter than a prairie.

Cross-shard queries are a product bug you are agreeing to. Either you forbid them, you run a scatter-gather with a budget, or you maintain a second index (and then you have two write paths).

Directory vs hash vs range:

- **Hash** — even spread, terrible range scans. Default for IDs.
- **Range** — great for time series, until "today" is one range.
- **Directory** — "this tenant lives on cluster B." Flexible, operationally heavy.

Resharding: add virtual nodes so each physical box owns many small slices. Moving one slice is a bounded copy plus a catch-up log. Moving "half the table" in a maintenance window is how outages are born.

## Worked example

ClipForge year-5: 9.1 billion mappings, 500 bytes each ≈ 4.6 TB plus indexes. One primary cannot take 58k peak reads even with a cache in front; the miss path and the writes still concentrate.

Shard by `clip_id` into 32 stores. Hash the id, take modulo 32, keep a tiny map of `shard → host` in every API box. Average ~140 GB/shard plus headroom. Rebalance by splitting to 64 when any shard crosses 70% disk.

The celebrity clip that gets 40% of all resolves still hashes to one shard. Caching that one key in every API box (see [caching](../caching/lesson.md) (id: caching)) is cheaper than splitting on a second dimension you do not query.

| Strategy | Query it loves | Query it hates | Hot-spot story |
| --- | --- | --- | --- |
| Hash(`clip_id`) | Point lookup | "all clips this week" | One viral id |
| Range(created_at) | Time scan | Point lookup by id | "today" |
| Directory(tenant) | Per-tenant isolation | Global search | One huge tenant |
| Geo-hex | Nearby | Cross-city stats | Downtown hex at 17:00 |

## Common mistakes

- Sharding on an auto-increment integer, then sending all new writes to the newest shard.
- Picking `user_id` when the query is by `conversation_id` (or the reverse).
- Promising a global unique secondary index without saying which shard owns the uniqueness check.
- Ignoring secondary indexes: an index is a second keyspace and may need its own sharding story. See [indexes](../../../cs/indexes.md) (id: indexes).
- Treating reshard as "we will dump and restore on Saturday."

## How to talk about it

"v1 is hash(`clip_id`) into 32 shards, virtual nodes, map cached in the API. Queries are point lookups so we never scatter. Uniqueness of the short key is owned by the mint pool, not by the store. If a key goes viral we cache it locally rather than resharding around a celebrity. If they want range reports, that is an offline warehouse, not the serving shards."

## Cross-links

- [Remembering the expensive answer nearby](../caching/lesson.md) (id: caching)
- [CAP as a conversation, not a religion](../cap-and-consistency.md) (id: cap-and-consistency)
- [Minting short keys for a read-heavy lookup](../../cases/url-shortener/lesson.md) (id: url-shortener)
- [Matching and surge, not a map with cars on it](../../cases/ride-hailing/lesson.md) (id: ride-hailing)
- [Ordered delivery for a 1:1 and small-group messenger](../../cases/chat-system/lesson.md) (id: chat-system)
- [Indexes as the real storage API](../../../cs/indexes.md) (id: indexes)
- [Forty-five minutes is a navigation problem](../interview-framework.md) (id: interview-framework)
