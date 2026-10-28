---
id: capacity-estimation
title: Back-of-envelope numbers that change the design
slug: capacity-estimation
kind: concept
track: system-design
difficulty: intro
estimated_minutes: 14
summary: Turn daily users into per-second rates, bytes, and in-flight work, then use the result to decide whether a design choice is needed at all.
tags:
  - system-design
  - system-design/foundations
  - interviews
  - interviews/system-design
prerequisites:
  - interview-framework
related:
  - url-shortener
  - sharding
  - caching
  - load-balancing
  - news-feed
company_signal: []
sources_consulted: []
updated: 2026-10-28
status: canonical
---

# Back-of-envelope numbers that change the design

## Snapshot

- An estimate exists to make a decision: one box or many, cache or not, shard or not. Stop calculating once the decision is clear.
- A day has 86,400 seconds. Rounding it to 100,000 is fine for a first pass; say that you rounded.
- Averages hide peaks. State a peak factor as an assumption and size for the peak.
- Little's law links rate, time in system, and concurrency: in-flight work ≈ arrival rate × mean time in system.
- Keep decimal units (GB = 10⁹ bytes) and binary units (GiB = 2³⁰ bytes) separate, and count replicas and indexes on top of raw bytes.

## Why it shows up in interviews

Interviewers ask for numbers to see whether you can tell a 50 requests/s service from a 500,000 requests/s one, because those two need different designs. A precise answer to the wrong question earns little. A rough answer that ends with "so a single primary database is enough for writes, but reads need a cache" moves the conversation forward.

Write the assumptions on the board where the interviewer can change them. If they say "make it ten times bigger," you should be able to redo the arithmetic in a few seconds.

## Core idea

### ELI5

Start from people, multiply to actions, divide by time, and multiply by size.

```
people per day × actions per person        = actions per day
actions per day ÷ 86,400                    = average actions per second
average × peak factor                       = peak actions per second
actions per day × bytes per action          = new bytes per day
new bytes per day × days retained × copies  = stored bytes
peak rate × seconds each request spends     = requests in flight
```

Every line is an assumption you can name. The peak factor, the retention period, and the number of copies usually move the answer more than the precise user count.

### Rates, bytes, and concurrency

**Rate.** Divide by 86,400. One million events per day is about 11.6/s. One billion per day is about 11,600/s.

**Bytes.** Multiply count by average size, then decide what else is stored: indexes, replicas, erasure coding overhead, and metadata. Say "raw" when you leave those out.

**Concurrency.** Little's law says the average number of items in a stable system equals the average arrival rate times the average time each item spends inside. If 2,000 requests/s arrive and each takes 50 ms end to end, about 100 are in flight on average. That number sizes connection pools, worker counts, and memory per request. It uses the mean time, so a long tail of slow requests still needs separate headroom.

**Read/write ratio.** Estimate reads and writes separately. A short-link service might create 60 links/s and resolve 60,000/s. Those numbers point at different components.

### Reference magnitudes

These are order-of-magnitude anchors for reasoning, not measurements of any particular machine. Check them against the hardware and network in front of you.

| Operation | Rough magnitude | Use it for |
| --- | --- | --- |
| Main memory reference | ~100 ns | Why in-memory lookups are cheap |
| Random read from a datacenter SSD | ~10–100 µs | Why a disk-backed index can still be fast |
| Round trip inside one datacenter | ~0.5 ms | Why chatty service calls add up |
| Round trip across a continent | ~30–80 ms | Why cross-region writes hurt latency |
| Sequential read of 1 MB from memory | ~tens of µs | Why scans of hot data are fine |

## Worked example

A photo app lets people comment on posts. Assume 30 million daily active users, 12 comments each per day, 400 bytes stored per comment, a peak of five times the average, and three years of retention with three replicas.

### Easy

```
30,000,000 × 12           = 360,000,000 comments/day
360,000,000 ÷ 86,400      ≈ 4,167 comments/s average
4,167 × 5                 ≈ 20,833 comments/s at peak
```

With the 100,000 shortcut you would get 3,600/s average. The rounding error is about 14%, which does not change any decision here.

### Medium

```
360,000,000 × 400 B       = 144 GB/day raw
144 GB × 1,095 days       ≈ 157.7 TB raw over three years
157.7 TB × 3 replicas     ≈ 473 TB
```

473 TB will not fit on one database server. That single number justifies talking about partitioning comments by post. The 400-byte figure excludes indexes; an index on `(post_id, created_at)` adds more, so say "before indexes."

If someone reports the storage in TiB, convert: 473 × 10¹² ÷ 2⁴⁰ ≈ 430 TiB. Mixing the two silently is a 10% error that looks like a mistake.

### Hard

Comment writes at peak take 40 ms each in the database, including a replicated commit. In flight at peak: 20,833 × 0.04 ≈ 833 concurrent writes. If one database primary handles a few hundred concurrent writes comfortably on the assumed hardware, that is a second argument for splitting writes across partitions. If the interviewer cuts the peak factor to 2, concurrency drops to about 333 and the argument weakens. Saying which assumption the decision depends on is the strong answer.

```ts
type Load = { dailyUsers: number; actionsPerUser: number; bytesPerAction: number; peakFactor: number; retainDays: number; copies: number; secondsPerRequest: number };

function estimate(l: Load) {
  const perDay = l.dailyUsers * l.actionsPerUser;
  const avgPerSec = perDay / 86_400;
  const peakPerSec = avgPerSec * l.peakFactor;
  const storedBytes = perDay * l.bytesPerAction * l.retainDays * l.copies;
  const inFlightAtPeak = peakPerSec * l.secondsPerRequest; // Little's law
  return {
    avgPerSec: Math.round(avgPerSec),
    peakPerSec: Math.round(peakPerSec),
    storedTB: +(storedBytes / 1e12).toFixed(1),
    inFlightAtPeak: Math.round(inFlightAtPeak),
  };
}

const comments: Load = { dailyUsers: 30e6, actionsPerUser: 12, bytesPerAction: 400, peakFactor: 5, retainDays: 1095, copies: 3, secondsPerRequest: 0.04 };
console.log(estimate(comments));                    // { avgPerSec: 4167, peakPerSec: 20833, storedTB: 473, inFlightAtPeak: 833 }
console.log(estimate({ ...comments, peakFactor: 2 })); // peak 8333/s, about 333 in flight
```

## Common mistakes

| Trap | What happens | Fix |
| --- | --- | --- |
| Sizing from the daily average | The system falls over at lunch | Name a peak factor and size for it |
| Forgetting replicas and indexes | Storage is off by 3× or more | Say "raw" and then multiply explicitly |
| Mixing GB and GiB | A 7–10% error that looks careless | Pick one unit system and label it |
| Using p99 latency in Little's law | Concurrency estimate is inflated or meaningless | Use mean time in system; size tail headroom separately |
| Calculating to four significant figures | Time spent on precision nobody needs | Round, then say which decision the number supports |
| One number for reads and writes | Cache and database get the same treatment | Estimate each path separately |

## How to talk about it

"Thirty million people times twelve comments is 360 million a day, about 4,000 a second, call it 20,000 at a 5× peak. At 400 bytes that's 144 GB a day raw, roughly 470 TB over three years with three copies, so comments must be partitioned. At 40 ms per write we have about 800 writes in flight at peak. If the peak factor is lower, the write side gets easier, but the storage argument for partitioning stays."

## Cross-links

- [Forty-five minutes is a navigation problem](./interview-framework.md) (id: interview-framework)
- [Splitting a keyspace so one box is not the product](./sharding/lesson.md) (id: sharding)
- [Remembering the expensive answer nearby](./caching/lesson.md) (id: caching)
- [Create and resolve short links safely](../cases/url-shortener/lesson.md) (id: url-shortener)
- [Build a feed with bounded fanout](../cases/news-feed/lesson.md) (id: news-feed)
- [Spreading work without creating a new bottleneck](./load-balancing.md) (id: load-balancing)
