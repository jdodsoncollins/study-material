---
id: caching
title: Remembering the expensive answer nearby
slug: caching
kind: concept
track: system-design
difficulty: intro
estimated_minutes: 14
summary: Choose cache keys, freshness rules, and recovery behavior from the workload rather than adding a cache by default.
tags:
  - system-design
  - system-design/foundations
  - system-design/caching
  - interviews
  - interviews/system-design
prerequisites:
  - interview-framework
related:
  - load-balancing
  - sharding
  - url-shortener
  - news-feed
  - search-autocomplete
company_signal: []
sources_consulted:
  - https://www.rfc-editor.org/rfc/rfc9111.html
updated: 2026-10-26
status: canonical
---

# Remembering the expensive answer nearby

## Snapshot

- A cache stores a reusable result nearer to its consumer or in a cheaper representation.
- A useful key identifies every input that changes the answer, including tenant and authorization scope when relevant.
- Hit rate, miss cost, memory usage, and acceptable staleness determine whether caching helps.
- Invalidation, concurrent fills, and failure recovery are part of the design.

## Why it shows up in interviews

A cache can reduce repeated work, but it also adds another copy of data. Explain which workload reuses entries and what happens when copies disagree. Per-user entries can be useful if that user reads them repeatedly; their value depends on reuse, not whether the key is shared publicly.

## Core idea

### ELI5

Keep a copy of an answer you are likely to need again. Label it precisely. Decide when it stops being acceptable and where to obtain a fresh answer.

In cache-aside, the application checks the cache, loads the source on a miss, and stores the result for later readers.

[Read and fill a cache](viz/aside.md)

A TTL limits how long a particular cache entry lives. It does not guarantee the source was fresh when the entry was created. Invalidation removes a known stale entry, but a concurrent reader may put an older value back after the removal. Versioned entries, conditional fills, or a protocol that orders writes and fills can address that race. Choose the simplest mechanism that satisfies the stated freshness requirement.

## Worked example

### Easy

Assume a product page receives 1,000 reads/s. At a 90% hit rate, about 100 reads/s reach the source. At 50%, it receives 500. These are illustrative steady-state estimates; a cold start may send nearly all reads through.

### Medium

A popular entry expires. A hundred readers miss together and each starts the same expensive query. Coalesce concurrent fills for that key, add expiry jitter across different keys, and bound source concurrency. Jitter alone does not stop simultaneous misses on one hot key.

### Hard

Predict this order: reader loads version 4; writer commits version 5 and invalidates; reader caches version 4. The final cache is stale. A five-second TTL limits that newly filled entry's remaining life, but does not eliminate the race. If an authorization revocation must take effect sooner, enforce a current authorization check or an invalidation/version protocol that meets that requirement.

| Policy | Main benefit | Question to settle |
| --- | --- | --- |
| Cache-aside | Load only requested data | How are concurrent fills and invalidations ordered? |
| Write-through | Update cache as part of the write path | Which store is authoritative after a partial failure? |
| Write-behind | Buffer writes before persistence | What acknowledged data may be lost, and how is it recovered? |
| Stale-while-refresh | Keep reads responsive during refresh | Is this operation allowed to receive stale data? |

## Common mistakes

- Caching private results under a key shared across tenants.
- Treating a cache outage as permission to overload the database.
- Using stale balances, permissions, or inventory without an explicit product contract.
- Assuming a TTL is a complete consistency protocol.

## How to talk about it

“I expect reuse by product and locale, so those inputs belong in the key. I will measure the hit rate and test a cold cache. For ordinary descriptions, stale reads are acceptable for a stated interval; authorization is checked separately.”

## Cross-links

- [Forty-five minutes is a navigation problem](../interview-framework.md) (id: interview-framework)
- [Spreading work without creating a new bottleneck](../load-balancing.md) (id: load-balancing)
- [Splitting a keyspace so one box is not the product](../sharding/lesson.md) (id: sharding)
- [Create and resolve short links safely](../../cases/url-shortener/lesson.md) (id: url-shortener)
- [Build a feed with bounded fanout](../../cases/news-feed/lesson.md) (id: news-feed)
- [Serve useful suggestions within a latency budget](../../cases/search-autocomplete/lesson.md) (id: search-autocomplete)
- [Indexes are precomputed answers](../../../cs/indexes.md) (id: indexes)
