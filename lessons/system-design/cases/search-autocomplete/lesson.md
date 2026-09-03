---
id: search-autocomplete
title: Prefix ranking under a tight latency budget
slug: search-autocomplete
kind: case-study
track: system-design
difficulty: intro
estimated_minutes: 14
summary: Lexicon ranks the next few characters as the user types; the serving path is an in-memory prefix index plus a cache, not a full search engine.
tags:
  - system-design
  - system-design/product-cases
  - system-design/caching
  - interviews
  - interviews/system-design
prerequisites:
  - interview-framework
  - caching
related:
  - caching
  - load-balancing
  - rate-limiter
  - indexes
  - interview-framework
company_signal:
  - name: Google
    evidence: Candidate-reported loops and prep-site frequency lists treat typeahead / autocomplete as a Google search-product analog with a hard latency budget.
    year: 2026
    confidence: high
sources_consulted:
  - Design Gurus 2026 FAANG guides
  - Hello Interview question DB (autocomplete)
  - r/leetcode system-design threads on tries vs inverted indexes
updated: 2026-09-02
status: canonical
---

# Prefix ranking under a tight latency budget

## Snapshot

- Product: **Lexicon**, the typeahead bar in front of a search corpus (Stagecast titles, Fieldnote posts, or a web index). v1 suggests queries, not full result pages.
- Budget is **p99 ≤ 50 ms** from keystroke to 8 suggestions. That number forbids a disk hop on the happy path.
- The index is a **prefix tree or prefix-partitioned map** of query strings with a precomputed top-K. Rebuild offline; serve read-only snapshots.
- Personalization is a rerank of those K, not a per-user index on the keystroke path.

## What this round is actually scoring

Latency discipline and index shape. Google-flavor interviewers will ask what happens at 100k QPS, how you update a trending query, and why you did not call the main searcher. They are not scoring a frontend debounce essay, though you should mention it.

## Company signal

Candidate-reported loops and prep-site frequency lists treat autocomplete as a Google search-product analog. Confidence: **high**. Expect prefix indexes, cache, and "how does a new trending query appear."

## Requirements

| Functional | v1 decision |
| --- | --- |
| Suggest as the user types | After 2 characters, 8 rows |
| Rank | Frequency × recency, then a light personal rerank |
| Empty / typo | Return popular fallback, do not 500 |
| Adult / abuse filter | Applied in the snapshot, not at query time |
| Click logs → better rank | Offline, hourly |

| Non-functional | Budget |
| --- | --- |
| p99 | 50 ms in-region |
| Peak QPS | 100k (every keystroke, even with debounce) |
| Staleness of trends | ≤ 1 hour, except a manual inject |
| Availability | Fail-open to a static popular list |

## Back-of-envelope

100k QPS × 200 bytes request/response ≈ 20 MB/s. Trivial bandwidth. The constraint is **fan-in to memory**.

Corpus: 20 million distinct queries worth suggesting. A compact trie with top-8 pointers per node, or a hash of prefixes of length 2–12, fits in tens of GB — one box can hold it, but you still run many boxes for QPS and failure.

If each keystroke hit a disk-backed searcher at 5 ms p50, p99 would blow 50 ms under load. So **SuggestCache** (prefix → 8 strings) plus in-process snapshot.

Debounce 30 ms on the client still leaves several QPS per typer. Design for 100k, not for "users."

## Design

[prefix](viz/prefix.md)

Offline: **LogMill** aggregates yesterday's queries + clicks. **Builder** produces an immutable snapshot: for each prefix, the top 8 queries after filtering. Snapshot is a file, versioned, ~12 GB.

Online: API boxes mmap the latest snapshot. Lookup is `prefix → [queries]`. A tiny **SuggestCache** in front (cache-aside, TTL 30s) catches the hottest prefixes (`"yo"`, `"how t"`).

Shard only if the snapshot no longer fits in one box: shard by **first two characters** (`ha*`, `hb*`, …). The API knows the map. See [sharding](../../foundations/sharding/lesson.md) (id: sharding) and [indexes](../../../cs/indexes.md) (id: indexes).

Personalization: take the 8, maybe fetch a 32-entry user affinity list from cache, rerank. If affinity is late, return the 8 anyway.

Trending inject: a side map merged at read for prefixes that match a "hot this hour" list, capped so it cannot drown the organic 8.

[QuotaDesk](../rate-limiter/lesson.md) (id: rate-limiter) per IP so a scraper cannot walk the trie.

## Tradeoffs

| Choice | Gain | Cost |
| --- | --- | --- |
| In-memory snapshot vs live DB | 50 ms is possible | Updates are a publish, not a write |
| Trie vs prefix hash table | Trie shares space, range of prefixes | Harder to shard; hash is dull and fast |
| Top-K precomputed vs search-on-read | Keystroke path is a lookup | Stale; cannot phrase-match arbitrary documents |
| Client debounce vs server load-shed | Fewer QPS | Feels laggy if you over-debounce |

## Failure modes

- Snapshot publish mid-request: keep two generations, switch with a version flag (same idea as [feature flags](../feature-flags.md) (id: feature-flags)).
- Hot prefix `"a"`: cache locally on every box; do not pin one shard.
- Builder poison (bad filter dump): canary a box, compare suggestion lists, roll back the file.
- Personalization store down: skip rerank. Empty typeahead is the outage; generic 8 is not.

## Follow-ups an interviewer may ask

- Full document search: different system, different SLA, do not reuse the trie as a search engine.
- Multi-language: snapshot per locale, detect from the query, do not mix alphabets in one top-8.
- Privacy: queries in LogMill are aggregated; no raw per-user string in the snapshot.

## Cross-links

- [Remembering the expensive answer nearby](../../foundations/caching/lesson.md) (id: caching)
- [Spreading work without creating a new bottleneck](../../foundations/load-balancing.md) (id: load-balancing)
- [Token buckets and sliding windows at the edge](../rate-limiter/lesson.md) (id: rate-limiter)
- [Indexes as the real storage API](../../../cs/indexes.md) (id: indexes)
- [Shipping dark, flipping in production](../feature-flags.md) (id: feature-flags)
- [Forty-five minutes is a navigation problem](../../foundations/interview-framework.md) (id: interview-framework)
