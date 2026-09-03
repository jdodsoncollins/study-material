---
id: interview-framework
title: Forty-five minutes is a navigation problem
slug: interview-framework
kind: strategy
track: system-design
difficulty: core
estimated_minutes: 18
summary: A system-design round is scored on what you choose to deepen, not on how many boxes you draw.
tags:
  - system-design
  - system-design/foundations
  - interviews
  - interviews/system-design
prerequisites: []
related:
  - url-shortener
  - news-feed
  - load-balancing
  - caching
  - sharding
company_signal:
  - name: Google
    evidence: Candidate-reported L5/L6 loops and prep-site frequency writeups emphasize surviving a scale challenge and going deep on one bottleneck, not touring every box.
    year: 2026
    confidence: high
  - name: Amazon
    evidence: Candidate-reported L5 loops treat operational ownership, box-death, and customer-visible failure as the real score, often on a staple like a URL shortener.
    year: 2026
    confidence: high
  - name: Meta
    evidence: Candidate-reported product-architecture prompts (news feed, messenger) and prep-site frequency lists reward fanout and product tradeoffs over generic cloud diagrams.
    year: 2026
    confidence: high
sources_consulted:
  - Hello Interview question DB frequency notes (2026)
  - Design Gurus 2026 FAANG system-design roundups
  - r/cscareerquestions and r/OfferEngineering loop writeups
  - X threads on requirements-first vs diagram-first interviews
updated: 2026-09-02
status: canonical
---

# Forty-five minutes is a navigation problem

## Snapshot

- You cannot design the whole product. You can run a clock: requirements, numbers, API, data, high-level design, one deep dive, failures.
- Interviewers score *judgment*: what you asked, which bottleneck you named, and whether the numbers still hold when they double traffic.
- Company flavor changes the deep dive, not the skeleton. Google leans scale and depth. Amazon leans ownership and failure. Meta leans product shape and fanout.
- Drawing ten boxes with no QPS is a fail. One datastore, one cache, one queue, and a defended bottleneck is a pass.

## Why it shows up in interviews

A 45-minute round is a compressed on-call plus a design review. The interviewer already knows a URL shortener and a news feed. They are watching whether you can *steer*: freeze scope, pick a load, pick a consistency story, and spend the expensive minutes on the part that actually hurts.

If you skip numbers, every later choice is unfalsifiable. If you skip failures, Amazon-style loops stall. If you skip product constraints, Meta-style loops stall.

## Core idea

Run the same seven moves every time. Budget them out loud so the interviewer can redirect you.

| Clock | Move | Exit criterion |
| --- | --- | --- |
| 0–6 min | Requirements | 4–6 functional bullets, 4 non-functionals with numbers, one explicit non-goal |
| 6–10 min | Back-of-envelope | Peak QPS, storage, payload bytes; one named bottleneck |
| 10–14 min | API + data | 4 endpoints, 3 entities, primary key and access pattern |
| 14–24 min | High-level design | Request path, write path, one cache, one store, maybe one queue |
| 24–38 min | Deep dive | The bottleneck you named, not a museum tour |
| 38–43 min | Failures | One box death, one retry storm, one hot key |
| 43–45 min | Wrap | Recap the tradeoff you would reverse if traffic 10× |

State the non-goal early: "v1 is 1:1 chat, not rooms of 10k." That is how you buy the deep-dive minutes.

## Comparison

| Flavor | What they lean on | How you spend the deep dive |
| --- | --- | --- |
| Google | Scale, bottleneck honesty, going deep on *one* subsystem | Let them pick a layer (shard map, cache invalidation, encoding ladder) and stay there until the math is ugly |
| Amazon | Operational ownership, customer-visible SLAs, Leadership-Principle *behavior* | Name who pages, what happens when the queue box dies, how a duplicate write is fenced. Do not recite LP slogans |
| Meta | Product shape, fanout, celebrity / hot-author problems | Draw write-path vs read-path. Call the 1% of authors who explode naive fan-out. Mention presence, ranking, or delivery once, then pick |

Same skeleton, different zoom. A candidate who draws Kubernetes on a feed question and never mentions fan-out has failed the Meta flavor even with a pretty diagram.

## Common mistakes

- Collecting requirements forever and drawing nothing. Six minutes, then freeze.
- Inventing 50 microservices. Three to six named components beat a zoo.
- Using CAP as a personality test ("we are AP"). See [CAP as a conversation, not a religion](./cap-and-consistency.md) (id: cap-and-consistency).
- Deep-diving the load balancer because it is easy, while the hot shard is the actual product risk.
- Never saying a number with units. "A lot of reads" is not a design.
- Treating Amazon loops as trivia about Leadership Principles instead of showing ownership in the failure story.

## How to talk about it

"I will freeze v1 in six minutes, put QPS and storage on the page, then spend the middle of the round on the bottleneck those numbers create. If this is a product-heavy prompt I will start with the write vs read path. If it is operations-heavy I will start with what we do when a box dies. Redirect me at minute ten if you want a different zoom."

Then actually check the clock. If they say "assume 100:1 reads," update the cache story on the spot. That is the interview.

## Cross-links

- [Spreading work without creating a new bottleneck](./load-balancing.md) (id: load-balancing)
- [Remembering the expensive answer nearby](./caching/lesson.md) (id: caching)
- [Splitting a keyspace so one box is not the product](./sharding/lesson.md) (id: sharding)
- [CAP as a conversation, not a religion](./cap-and-consistency.md) (id: cap-and-consistency)
- [Minting short keys for a read-heavy lookup](../cases/url-shortener/lesson.md) (id: url-shortener)
- [Hybrid fanout when some authors are stadiums](../cases/news-feed/lesson.md) (id: news-feed)
- [HTTP and TCP as interview tools](../../cs/http-and-tcp.md) (id: http-and-tcp)
