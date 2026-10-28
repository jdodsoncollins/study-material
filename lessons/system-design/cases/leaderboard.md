---
id: leaderboard
title: Rank a weekly puzzle leaderboard
slug: leaderboard
kind: case-study
track: system-design
difficulty: core
estimated_minutes: 18
summary: Keep durable best scores as the source of truth, serve ranks from a rebuildable sorted index, and pick user-hash or score-range sharding by which query must stay cheap.
tags:
  - system-design
  - system-design/product-cases
  - system-design/caching
  - system-design/storage
  - interviews
  - interviews/system-design
prerequisites:
  - heaps-top-k
  - sharding
related:
  - heaps-top-k
  - sharding
  - caching
  - search-autocomplete
  - metrics-pipeline
company_signal: []
sources_consulted:
  - https://redis.io/docs/latest/develop/data-types/sorted-sets/
  - https://doi.org/10.1016/j.jalgor.2003.12.001
updated: 2026-10-28
status: canonical
---

# Rank a weekly puzzle leaderboard

## Snapshot

- Three queries: the top 100, "my rank", and the five players just above and below me.
- A sorted set (skip list plus hash) answers all three in O(log n). Forty million entries fit in one machine's memory, so do the arithmetic before sharding.
- The sorted set is a derived index. The authoritative record is a durable table of each player's best verified score this week.
- Exact rank for everyone is expensive when sharded. Exact top 100 plus an approximate percentile for everyone else is usually the right product.

## What this round is actually scoring

Whether you can name what is authoritative, tie-break deterministically, and explain what each sharding scheme makes cheap and what it makes expensive.

## Company signal

This is an original practice scenario. No traceable company-specific frequency evidence is supplied.

## Requirements

| Area | Requirement |
| --- | --- |
| Submit | After a puzzle round, the server records the score; a player's weekly entry is their best |
| Top | Show the top 100 for the week, globally and per country |
| Me | Show my rank and five neighbors above and below |
| Ties | Equal scores rank by who reached the score first |
| Reset | A new board starts each Monday 00:00 UTC; last week stays readable |
| Integrity | Scores come from server-verified rounds, not from the client's say-so |

| Non-functional | Target (illustrative) |
| --- | --- |
| Rank freshness | under 2 s after a round ends |
| p99 rank query | under 50 ms |

## Back-of-envelope

These are illustrative workload assumptions, not production measurements.

- 40 million weekly players; 8 million daily. Each daily player finishes 6 rounds: **48 million submissions/day**, about **556/s** average and roughly **2,800/s** at a 5× evening peak.
- Each daily player opens the board 4 times: 32 million views/day, about 370/s average, **1,850/s** peak. Each view is one top-100 read plus one rank-and-neighbors read.
- A sorted-set entry with an 8-byte score, a 16-byte player ID, and skip-list and hash overhead is on the order of 100 bytes (an assumption; measure your store). 40 million × 100 B ≈ **4 GB** per weekly board.
- Per-country boards hold the same 40 million players again, split up: about another 4 GB. Keeping last week readable doubles both.
- A few thousand sorted-set writes per second and a few thousand reads fit one in-memory node with a replica. The reasons to shard are many boards, failover blast radius, or growth, not this week's numbers.

## Design

### ELI5

Keep a notebook with each player's best score. That notebook is the truth. Next to it, keep a list that is always sorted from highest to lowest so you can read off the top 100 or count how many people beat you. If the sorted list is lost, rebuild it from the notebook.

### Operation and authoritative state

1. The game server verifies a finished round and writes `round(round_id, player_id, points, finished_at)`. `round_id` makes resubmission idempotent.
2. In the same transaction, update `weekly_best(week, player_id, points, reached_at)` if the new score is higher. This table is authoritative.
3. Publish the change (outbox or change stream). An indexer updates the sorted set `board:{week}` and `board:{week}:{country}` with "only if greater" semantics, so a delayed older event cannot lower a score.

**Tie-break.** Pack the score and time into one number so the sorted set orders both. Points fit below 2^20 and seconds into the week (at most 604,800) fit below 2^20, so the packed value stays below 2^40, well inside a double's exact-integer range of 2^53.

```ts
const SHIFT = 2 ** 20; // room for any second within a 604,800-second week

// Higher points first; for equal points, the earlier second wins.
function packScore(points: number, secondsIntoWeek: number): number {
  return points * SHIFT + (SHIFT - 1 - secondsIntoWeek);
}
function unpackScore(packed: number): [number, number] {
  return [Math.floor(packed / SHIFT), SHIFT - 1 - (packed % SHIFT)];
}

const early = packScore(48_210, 3_600); // reached 48,210 one hour into the week
const late = packScore(48_210, 7_200);
console.log(early > late, unpackScore(early)); // true [ 48210, 3600 ]
console.log(packScore(48_211, 600_000) > early); // true: one more point beats any time
```

**Queries.** Top 100 is a reverse range read of the first 100 members. "My rank" is a reverse-rank lookup. Neighbors are a range read from rank − 5 to rank + 5. Cache the top 100 for one second; thousands of viewers share it.

### Sharding, if you need it

| Scheme | Top 100 | My exact rank | Write path |
| --- | --- | --- | --- |
| Hash of player ID over S shards | Read each shard's top 100 and merge S × 100 candidates | Sum, over all S shards, the count of entries above my score | One shard, never moves |
| Score ranges (shard 0 holds the highest band) | Read the top shard only | Entries in higher shards (kept as counters) plus my rank within my shard | A player moves shards when the score crosses a boundary; bands go hot and need rebalancing |

Hash sharding keeps writes simple and makes rank a scatter-gather. Score-range sharding makes rank cheap and writes awkward, because scores are skewed: most players crowd into a few bands, and the boundaries must move every week.

**Approximate rank.** Past the top 10,000, show "top 12%" from a histogram of scores in, say, 1,000 buckets. Updating a bucket count per submission is cheap, and it does not need cross-shard coordination. This is a product decision; say it plainly. A sketch such as Count-Min answers a different question ("how often has this key appeared"). It fits "most-played puzzles this week", not ranking scores.

### Commit boundary

A score counts when the `round` and `weekly_best` rows commit. The leaderboard may lag by the indexer's delay (target under 2 s). The response to the player can show the new score immediately from the committed row while the rank shows "updating" for a moment.

### Recovery behavior

- **Index node lost.** Promote the replica. If both are gone, rebuild from `weekly_best`: 40 million rows at 200,000 inserts/s is about 200 s. During the rebuild, serve the cached top 100 and show ranks as unavailable.
- **Duplicate or reordered events.** "Only if greater" plus idempotent `round_id` make replay safe.
- **Weekly reset.** Do not delete at midnight. Writes go to the key for the new week ID; the old key becomes read-only and expires after a retention window.

## Tradeoffs

| Choice | Benefit | Cost |
| --- | --- | --- |
| One in-memory sorted set per board | O(log n) for all three queries; simple | Single-node memory and write ceiling; needs a rebuild story |
| SQL `ORDER BY ... LIMIT 100` on an index | No extra system | "My rank" is a count over many rows; slow at 40 million |
| Hash-sharded sets | Even writes, unlimited boards | Rank is S lookups; top 100 is a merge |
| Score-range shards | Rank and top are cheap | Hot bands, moving players, weekly rebalancing |
| Approximate percentile beyond 10,000 | Cheap, shard-free | Not an exact rank; must be labeled |

## Failure modes

- **Client-reported scores.** A modified app posts 9,999,999. Score only server-verified rounds; flag outliers for review.
- **Lowering on replay.** An old event overwrites a newer higher score. Use "only if greater" in the index and the table.
- **Floating-point packing.** Packing a millisecond timestamp with a large score overflows 2^53 and ties silently break wrong. Check the bit budget.
- **Thundering read at reset.** Everyone opens the new empty board at 00:00 UTC. Cache it; it is nearly empty.
- **Ban removal.** A cheater is banned mid-week. Remove from the table and the index, and invalidate the cached top 100.

## Follow-ups an interviewer may ask

**Easy:** two players both reach 48,210 points. Who ranks higher, and where does that rule live?

**Medium:** add friend leaderboards, average 150 friends. Do you precompute a board per player or rank friends at read time?

**Hard:** product wants exact rank for all 40 million players across 16 hash shards at 1,850 rank reads/s. Estimate the cost, then propose what you would ship instead.

## Cross-links

- [Keep only the interesting k](../../algorithms/patterns/heaps-top-k.md) (id: heaps-top-k)
- [Splitting a keyspace so one box is not the product](../foundations/sharding/lesson.md) (id: sharding)
- [Remembering the expensive answer nearby](../foundations/caching/lesson.md) (id: caching)
- [Serve useful suggestions within a latency budget](./search-autocomplete/lesson.md) (id: search-autocomplete)
- [Collect fleet metrics and logs without drowning in labels](./metrics-pipeline.md) (id: metrics-pipeline)
