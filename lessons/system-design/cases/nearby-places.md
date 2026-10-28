---
id: nearby-places
title: Find open places near a shopper
slug: nearby-places
kind: case-study
track: system-design
difficulty: core
estimated_minutes: 20
summary: Index places by geohash cell, answer a radius query by reading a small covering of cells and filtering by true distance, and split or cache hot downtown cells instead of the whole index.
tags:
  - system-design
  - system-design/product-cases
  - system-design/caching
  - system-design/storage
  - interviews
  - interviews/system-design
prerequisites:
  - indexes
  - sharding
related:
  - ride-hailing
  - sharding
  - caching
  - indexes
  - search-autocomplete
company_signal: []
sources_consulted:
  - https://s2geometry.io/devguide/s2cell_hierarchy
  - https://redis.io/docs/latest/develop/data-types/geospatial/
updated: 2026-10-28
status: canonical
---

# Find open places near a shopper

## Snapshot

- The operation: "pharmacies open now within 1 km of me, best 20". Places barely move; the expensive part is reads.
- A geohash (or a similar cell scheme) turns two coordinates into one sortable string. Nearby points usually share a prefix, but not always, so a query reads neighbor cells too.
- Cell count per query depends on cell size, radius, and latitude: cells get narrower toward the poles.
- The authoritative place record lives in a database. The geo index is derived from it and rebuilt from it.

## What this round is actually scoring

Whether you can explain why a single prefix lookup misses results at a cell edge, size the covering, and handle a downtown cell with 30,000 places without making every query slow.

## Company signal

This is an original practice scenario. No traceable company-specific frequency evidence is supplied.

## Requirements

| Area | Requirement |
| --- | --- |
| Search | Places within a radius (0.5–10 km) of a point, filtered by category and open-now |
| Rank | Return the best 20 by a mix of distance and rating |
| Update | Owners edit hours and addresses; a closed place stops appearing |
| Detail | Tap a result to see its full record |

| Non-functional | Target (illustrative) |
| --- | --- |
| p99 search | under 150 ms |
| Edit visible in search | within a few minutes |
| Closure visible | within one minute |

## Back-of-envelope

These are illustrative workload assumptions, not production measurements.

- **200 million places** worldwide. **80 million searches/day**: about 926/s average, roughly **4,600/s** at a 5× peak.
- 2 million edits/day: about 23/s. Writes are tiny next to reads.
- An index entry with place ID, latitude, longitude, cell, and a category bitmask is about 48 bytes: 200 M × 48 B = **9.6 GB**. With per-category postings, call it 20 GB. That fits in memory on one machine, so replicate for throughput and latency (say 6 replicas over 3 regions, under 800 searches/s each at peak) rather than shard for size.
- A precision-6 geohash cell is about 0.61 km tall and 1.22 km wide at the equator. A 1 km radius query has a 2 km × 2 km bounding box, which overlaps at most 5 rows × 3 columns = **15 cells** at the equator. At 60° north the cells are half as wide, so up to **25 cells**.
- A dense downtown precision-6 cell can hold 30,000 places. Splitting it to precision 7 (32 sub-cells) averages about 940 each.

## Design

### ELI5

Draw a grid over the map and give every square a name, where squares with similar names are near each other. To find coffee near you, look up your square and the squares around it, collect what is there, then measure the real distance to each and keep the close ones. If one square is packed, cut it into smaller squares.

### Operation and authoritative state

- **Place store.** `place(place_id, name, lat, lon, categories, hours, status, version)` in a database. This is the truth.
- **Geo index.** Built from a change stream of the place store. For each place, compute its geohash at a base precision (6) and store `(cell, category) → [place_id, lat, lon, rating]`. Dense cells are stored at precision 7.
- **Search.** Compute the bounding box of the radius circle, list every cell that overlaps it, read those postings for the requested category, compute the true (haversine) distance, drop anything outside the radius or closed now (hours evaluated in the place's own time zone), rank, and return 20 IDs. Fetch display details from a cache in front of the place store.

```ts
const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

// Alternate longitude and latitude bits, halving the range each time; 5 bits per character.
function geohash(lat: number, lon: number, precision: number): string {
  let latLo = -90, latHi = 90, lonLo = -180, lonHi = 180;
  let hash = "", bits = 0, ch = 0, useLon = true;
  while (hash.length < precision) {
    if (useLon) {
      const mid = (lonLo + lonHi) / 2;
      if (lon >= mid) { ch = ch * 2 + 1; lonLo = mid; } else { ch *= 2; lonHi = mid; }
    } else {
      const mid = (latLo + latHi) / 2;
      if (lat >= mid) { ch = ch * 2 + 1; latLo = mid; } else { ch *= 2; latHi = mid; }
    }
    useLon = !useLon;
    if (++bits === 5) { hash += BASE32[ch]; bits = 0; ch = 0; }
  }
  return hash;
}
// Upper bound on cells a radius query reads at this precision and latitude.
function coverCells(radiusKm: number, latDeg: number, precision: number): number {
  const lonBits = Math.ceil((5 * precision) / 2), latBits = Math.floor((5 * precision) / 2);
  const heightKm = (180 / 2 ** latBits) * 111.32;
  const widthKm = (360 / 2 ** lonBits) * 111.32 * Math.cos((latDeg * Math.PI) / 180);
  return (Math.ceil((2 * radiusKm) / heightKm) + 1) * (Math.ceil((2 * radiusKm) / widthKm) + 1);
}

console.log(geohash(57.64911, 10.40744, 11)); // u4pruydqqvj, the published reference value
console.log(geohash(40.7411, -73.9822, 6), geohash(40.7411, -73.9818, 6)); // dr5ru2 dr5ru8: 34 m apart, different cells
console.log(coverCells(1, 0, 6), coverCells(1, 60, 6)); // 15 25
```

The middle line is the whole reason for neighbor cells: a shopper and a pharmacy 34 m apart sit in different precision-6 cells. Worse, points across a high-level boundary (for example, either side of the prime meridian at the equator) can share no prefix at all.

### Hot cells

- **Dense places.** Split any cell above a threshold (say 5,000 places per category) into precision-7 sub-cells, and record the split in a small cell directory the query planner reads. This is a quadtree-like adaptive grid on top of geohash strings. Hierarchical schemes such as S2 cells do the same thing with better-shaped cells.
- **Dense queries.** A stadium lets out and 40,000 phones search "food near me" from three cells. Cache results per `(cell, category, radius bucket, open-now hour)` for 30–60 s. Everyone in that cell shares an answer that is at most one cell-width "off center"; re-filter by exact distance before returning.
- **Large radius.** A 10 km query at precision 6 would read hundreds of cells. Pick the precision from the radius: coarser cells for bigger circles, so the covering stays around 9–25 cells.

### Commit boundary

An edit is **committed** when the place row commits with a new `version`. The index applies changes from the change stream idempotently by `(place_id, version)`, ignoring older versions. A move removes the place from its old cell and adds it to the new one in the same index update. Closures are flagged in the change stream as high priority so they reach the index within a minute; the result filter also checks `status` from the detail cache as a backstop.

### Recovery behavior

- **Index replica lost.** Route around it. Build a new one from the latest index snapshot plus the change stream from that snapshot's position.
- **Change stream lag.** Searches still work with slightly stale data. Alert on lag; closures matter most.
- **Index corruption or a bad split.** Rebuild from a full scan of the place store: 200 million rows, parallelized by cell prefix.

## Tradeoffs

| Choice | Benefit | Cost |
| --- | --- | --- |
| Geohash strings in a sorted index | Works in any ordered key-value store; prefix scans | Rectangular cells distort with latitude; edge cases need neighbors |
| Adaptive split of dense cells | Bounded work per cell | A cell directory to maintain and cache |
| Hierarchical sphere cells (S2-style) | Better-shaped cells; built-in region covering | More complex library dependency |
| R-tree or database spatial index | Exact radius queries in one system | Harder to replicate widely and to tune for read-heavy global load |
| Replicate whole index | No scatter-gather | Every replica holds every place; fine at 20 GB, not at 2 TB |
| Shard by cell prefix | Scales the index | Dense cities make uneven shards; queries at shard edges fan out |

## Failure modes

- **Edge miss.** Searching only the shopper's own cell misses the pharmacy 34 m away. Always read the covering.
- **Antimeridian and poles.** A query near ±180° longitude must wrap; near the poles cells are slivers. Test both.
- **Wrong time zone.** "Open now" evaluated in the server's time zone hides places that are open. Store each place's zone.
- **Stale closure.** A permanently closed place keeps appearing because the index missed one event. Version-checked updates plus a periodic reconciliation scan.
- **Ranking by distance alone.** The nearest result is a closed-at-night kiosk. Rank by a blend of distance, rating, and open status.

## Follow-ups an interviewer may ask

**Easy:** the shopper is at a cell corner. Which cells does a 500 m query read, and why more than one?

**Medium:** one downtown cell has 30,000 restaurants and a p99 of 900 ms. Fix it without changing the precision everywhere.

**Hard:** add delivery drivers whose positions update every 4 s. What changes in the index, and why might this become a different system from place search?

## Cross-links

- [Reserve drivers before confirming a match](./ride-hailing/lesson.md) (id: ride-hailing)
- [Splitting a keyspace so one box is not the product](../foundations/sharding/lesson.md) (id: sharding)
- [Remembering the expensive answer nearby](../foundations/caching/lesson.md) (id: caching)
- [Indexes are precomputed answers](../../cs/indexes.md) (id: indexes)
- [Serve useful suggestions within a latency budget](./search-autocomplete/lesson.md) (id: search-autocomplete)
