---
id: url-shortener
title: Minting short keys for a read-heavy lookup
slug: url-shortener
kind: case-study
track: system-design
difficulty: intro
estimated_minutes: 18
summary: ClipForge is a 100:1 read lookup; the design fight is how you mint unique short keys without turning hash collisions into a product.
tags:
  - system-design
  - system-design/product-cases
  - system-design/caching
  - system-design/storage
  - interviews
  - interviews/system-design
prerequisites:
  - interview-framework
  - caching
related:
  - interview-framework
  - caching
  - sharding
  - load-balancing
  - rate-limiter
  - unique-ids
company_signal:
  - name: Amazon
    evidence: Candidate-reported L5 staple; prep-site frequency lists treat URL shorteners as the default junior/mid prompt across Amazon, Google, and Meta.
    year: 2026
    confidence: high
  - name: Google
    evidence: Candidate-reported loops use the same prompt as a scale/depth probe (key space, cache hit math, uniqueness under retry).
    year: 2026
    confidence: medium
sources_consulted:
  - Hello Interview question DB frequency notes (2026)
  - Design Gurus 2026 FAANG guides
  - r/leetcode and r/cscareerquestions Amazon L5 writeups
updated: 2026-09-02
status: canonical
---

# Minting short keys for a read-heavy lookup

## Snapshot

- Product: **ClipForge**. Users mint a short key that 302s to a long URL. v1 is public links, no custom aliases, no analytics warehouse.
- Traffic shape is **100 reads per write**. Caching and a tiny mapping table beat a clever graph.
- Two mint stories: a **MintPool** of pre-generated keys, or a **hash of the long URL**. Hash sounds simple and then collides, cannot support two users minting the same destination as two keys, and fights retries.
- The round is won on uniqueness, cache-aside, and what happens when a key is revoked.

## What this round is actually scoring

Can you freeze v1, put 100:1 on the page, and pick a mint strategy you can defend when the interviewer duplicates a request? Amazon-style loops then kill a box. Google-style loops then ask you to size the key space. Do not spend the middle of the round on a UI.

## Company signal

Candidate-reported Amazon L5 loops treat this as a staple. Prep-site frequency lists put it at the top of junior/mid prompts at Amazon, Google, and Meta. Confidence: **high**. Nobody is leaking an official bank; the signal is how often the same shape shows up in writeups.

## Requirements

| Functional | v1 decision |
| --- | --- |
| Mint a short key from a long URL | 7-char key, alphabet `[a-zA-Z0-9]` |
| Resolve key → 302 | Hot path, cache-aside |
| Revoke / expire a clip | Tombstone in ClipStore, delete cache key |
| Optional custom alias | Non-goal for v1 |

| Non-functional | Budget |
| --- | --- |
| Read:write | 100:1 |
| Resolve p99 | 20 ms inside the DC |
| Mint p99 | 100 ms |
| Durability of a minted mapping | Fail closed; no silent drop |
| Uniqueness | No two live clips share a key |

## Back-of-envelope

5 million mints/day, 500 million resolves/day (the 100:1).

- Mint: 5e6 / 86400 ≈ 58/s average, ×10 peak ≈ **580/s**
- Resolve: 5e8 / 86400 ≈ 5.8k/s average, ×10 peak ≈ **58k/s**
- Year-5 records: 5e6 × 365 × 5 ≈ 9.1e9 rows. 500 bytes/row ≈ **4.6 TB** plus indexes
- Key space: 62^7 ≈ 3.5e12. At 9.1e9 keys we have used ~0.3%. 6 chars (56 billion) is tight by year 5; 7 is the honest default

A 95% cache hit rate on resolve leaves ~2.9k/s for ClipStore. That is the database you actually buy.

## Design

[path](viz/path.md)

**EdgeSplit** (two L7 balancers) → **Resolve API** and **Mint API** as separate pools.

- **MintPool**: a small service that pre-generates unused 7-char keys into a key table (`free` / `leased` / `assigned`). Mint leases a key, writes `clip_id → long_url` in **ClipStore**, marks assigned. On client retry with the same `request_id`, return the already-assigned key.
- **ClipStore**: sharded by `clip_id` (see [sharding](../../foundations/sharding/lesson.md) (id: sharding)). Point lookup only.
- **HotPath**: cache-aside, key `clip:{id}`, TTL 45s + jitter, delete on revoke.

Hash-of-URL alternative: `key = base62(sha256(url)[:n])`. Collisions need a probe. Two users cannot mint distinct keys for one destination. Changing the long URL later is a mess. Mention it, then reject it for v1 unless the interviewer wants "same URL always same key" as a product rule.

Redirect stays a 302, not a 301, so revoke can actually stop traffic.

## Tradeoffs

| Choice | Gain | Cost |
| --- | --- | --- |
| MintPool of pre-generated keys | No collision on the write path; easy to reserve ranges per DC | You operate a key factory and must not leak unused keys |
| Hash of the long URL | No factory | Collisions, no two keys per URL, ugly retries |
| 7-char vs 6-char | Year-5 headroom | Slightly longer copy-paste |
| 302 vs 301 | Revoke works; cache stays yours | Browsers re-hit you (which you wanted at 100:1 anyway) |
| Cache-aside vs putting Mint through cache | Miss path stays simple | Must delete on revoke |

## Failure modes

- Mint API retries without `request_id` → two keys for one user click. Require the id.
- ClipStore primary dies mid-write → lease expires, key returns to `free` only if the row is absent.
- HotPath stampede on a viral clip → local LRU on the Resolve API plus single-flight fill. See [caching](../../foundations/caching/lesson.md) (id: caching).
- Key exhaustion in one DC's range → steal from MintPool global, do not wrap into used space.

## Follow-ups an interviewer may ask

- Custom aliases: extra unique index, abuse, and a different rate limit. See [rate-limiter](../rate-limiter/lesson.md) (id: rate-limiter).
- Analytics: append-only click log, not ClipStore. Do not add a write on the 302 path without a queue.
- Multi-region mint: uniqueness needs one authority per key range, not two live writers.

## Cross-links

- [Forty-five minutes is a navigation problem](../../foundations/interview-framework.md) (id: interview-framework)
- [Remembering the expensive answer nearby](../../foundations/caching/lesson.md) (id: caching)
- [Splitting a keyspace so one box is not the product](../../foundations/sharding/lesson.md) (id: sharding)
- [Spreading work without creating a new bottleneck](../../foundations/load-balancing.md) (id: load-balancing)
- [Token buckets and sliding windows at the edge](../rate-limiter/lesson.md) (id: rate-limiter)
- [HTTP and TCP as interview tools](../../../cs/http-and-tcp.md) (id: http-and-tcp)
- [IDs that sort without a coordinator](../../foundations/unique-ids/lesson.md) (id: unique-ids)
