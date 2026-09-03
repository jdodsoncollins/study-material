---
id: caching
title: Remembering the expensive answer nearby
slug: caching
kind: concept
track: system-design
difficulty: intro
estimated_minutes: 14
summary: A cache is a correctness and stampede problem first, and a latency trick second.
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
company_signal:
  - name: Meta
    evidence: Candidate-reported feed and messenger loops and prep-site frequency lists treat cache placement (timeline, session, presence) as a default mid-round probe.
    year: 2026
    confidence: high
  - name: Amazon
    evidence: Candidate-reported L5 URL-shortener and rate-limiter prompts almost always ask what is cached, the TTL, and what happens on a miss storm.
    year: 2026
    confidence: high
sources_consulted:
  - Hello Interview News Feed and Rate Limiter breakdowns (consulted, not copied)
  - Design Gurus 2026 FAANG guides
  - r/leetcode system-design threads on cache stampede
updated: 2026-09-02
status: canonical
---

# Remembering the expensive answer nearby

## Snapshot

- Cache the result of an expensive read that is reused. Do not cache a write you cannot rebuild.
- The default pattern is **cache-aside**: app reads cache, on miss reads store, then fills. The app owns invalidation.
- Hits only help if the key is stable, the TTL matches staleness, and a miss storm cannot crush the store.
- A 95% hit rate on a 58k QPS read path leaves ~2.9k QPS for the database. That is the math interviewers want, not "we add Redis."

## Why it shows up in interviews

Almost every product case in this track is read-heavy: short-link resolve, feed home, autocomplete, flag evaluation. Caching is how you turn a storage problem into a memory problem. Interviewers listen for three words: **invalidation**, **stampede**, **hot key**. Missing those is a junior tell.

## Core idea

A cache is a second copy with a lie budget. You must say how stale is acceptable.

- ClipForge resolve: a mapping can be 30s stale. TTL plus random 0–5s jitter is enough.
- Till capture of a payment: do not cache "success" as the source of truth. The ledger is.
- Fieldnote home: a precomputed inbox can be seconds stale; a "loud voice" post may need a pull path instead of a bigger cache.

Key design is the real API: `clip:{id}`, `feed:{user}:{page}`, `flag:{env}:snapshot`. Bad keys (caching a whole HTML page for a logged-in user) create a unique entry per person and the cache never warms.

Placement matters. An in-process cache is fastest and shards by box (inconsistent). A remote cache is shared and a network hop. Many designs use both: local for the hottest keys, remote for the rest.

## Comparison

| Pattern | Write behavior | Failure if you pick it wrong | Use |
| --- | --- | --- | --- |
| Cache-aside | Write store, delete or overwrite cache | Stale reads if delete is lost | Default read-heavy path |
| Write-through | Write cache, cache writes store | Write latency includes cache | Simple objects, low write QPS |
| Write-behind | Write cache, flush store later | Cache crash loses data | Counters, not money |
| Refresh-ahead | Near-TTL miss fills in background | Synchronized TTLs stampede | Predictable hot keys with jitter |

Stampede control: on miss, only one worker fills a key (lock or single-flight). Everyone else waits a few tens of milliseconds or serves the stale copy. Jitter the TTL so 10 million keys do not expire on the same second.

Hot key: one celebrity `clip_id` or one flag snapshot. Replicate that key to many cache boxes, or add a tiny local cache in the app, or split the key (`clip:{id}:{replica}`).

## Common mistakes

- Caching writes you cannot rebuild (the only copy of a payment intent).
- Infinite TTL "because the mapping never changes" — then you cannot tombstone an abuse clip.
- Measuring hit rate and ignoring miss *cost*. A 99% hit rate still kills you if misses are table scans.
- One global cache cluster for every product. Failure domains should match blast radius.
- Forgetting the cache is sharded. A bad hash turns one hot key into one hot shard. See [sharding](./sharding.md) (id: sharding).

## How to talk about it

"Reads are 100:1 so cache-aside sits in front of ClipStore. Key is `clip:{id}`, TTL 45s plus 5s jitter, fill lock on miss. Writes mint then *delete* the key so the next read is authoritative. If a clip is a celebrity destination, we replicate that one key onto every cache box and keep a 64 MB in-process LRU on the API. I will not put the mint path through the cache."

If they ask "what is the consistency," answer with the lie budget, not with CAP slogans.

## Cross-links

- [Forty-five minutes is a navigation problem](./interview-framework.md) (id: interview-framework)
- [Spreading work without creating a new bottleneck](./load-balancing.md) (id: load-balancing)
- [Splitting a keyspace so one box is not the product](./sharding.md) (id: sharding)
- [Minting short keys for a read-heavy lookup](../cases/url-shortener.md) (id: url-shortener)
- [Hybrid fanout when some authors are stadiums](../cases/news-feed.md) (id: news-feed)
- [Prefix ranking under a tight latency budget](../cases/search-autocomplete.md) (id: search-autocomplete)
- [Indexes as the real storage API](../../cs/indexes.md) (id: indexes)
