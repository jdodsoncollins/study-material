---
id: interview-framework
title: Forty-five minutes is a navigation problem
slug: interview-framework
kind: strategy
track: system-design
difficulty: core
estimated_minutes: 18
summary: Practice requirements, estimates, request paths, and failure analysis in a bounded system-design discussion.
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
company_signal: []
sources_consulted:
  - https://www.rfc-editor.org/rfc/rfc9110.html
updated: 2026-10-26
status: canonical
---

# Forty-five minutes is a navigation problem

## Snapshot

- Start with the user action and the promise the system must keep.
- Estimate traffic and storage to choose between plausible designs, then check the most important assumptions.
- Trace one write, one read, and one failure before adding components.
- Spend depth on the risk that could invalidate the design: contention, fanout, latency, durability, or authorization.

## Why it shows up in interviews

An open-ended prompt leaves more decisions than a short discussion can resolve. A clear structure helps your partner follow the reasoning and challenge assumptions. The goal is a defensible design with explicit limits, not a particular number of boxes.

## Core idea

### ELI5

Treat the diagram as a route a request takes. At every stop, ask what data changes, who owns that change, and what the caller observes if the next stop fails.

1. Restate the main user action. Separate required behavior from optional features.
2. Specify the important promises: response time, ordering, freshness, durability, and access control.
3. Estimate average and peak demand separately. Write units beside every number.
4. Choose an API and the records needed to enforce those promises.
5. Walk the normal path, then interrupt it at a difficult boundary.
6. Compare one alternative and explain what evidence would change your choice.

For a 45-minute practice session, one possible allocation is 7 minutes for requirements and estimates, 10 for an initial design, 20 for a deep dive, and 8 for failures and review. Adapt it to the conversation; it is a rehearsal aid, not a scoring rubric.

## Worked example

### Easy

Design a short-link service. Required actions: create a mapping and resolve a key. Start with a service and a database whose unique key prevents two mappings from owning the same short code. Explain how a retry of the same creation request returns the existing result.

### Medium

Assume 5 billion resolves per day and 5 million creations per day. That is about 57,900 resolves/s and 58 creations/s **on average**. A tenfold resolve peak would be about 579,000/s. These are scenario inputs, not measurements. A cache helps only to the extent that requests reuse keys; estimate the miss rate before sizing the database.

### Hard

The interviewer adds immediate abuse takedowns. A long browser cache lifetime now conflicts with the product requirement. Discuss a measurable revocation target, cache invalidation, and what happens when invalidation cannot reach a region. Drawing a second cache would not resolve that conflict.

**Practice:** close the lesson and give a two-minute explanation of the creation path. Include a lost response after commit. Check that your explanation includes a stable request key, a durable mapping, and a replay response.

## Common mistakes

| Habit | Why it weakens the design | Better next step |
| --- | --- | --- |
| Pick a database before naming queries | The access pattern may not fit | List the reads and updates first |
| Treat an estimate as a benchmark | Capacity depends on workload and hardware | State what must be measured |
| Add a queue between two writes | A crash can leave only one write committed | Explain the atomic boundary or recovery |
| Promise zero downtime without a failure model | The promise cannot be evaluated | Name the failures and permitted degradation |

## How to talk about it

“I will first make create and resolve correct on one authoritative store. The read estimate suggests evaluating a cache. The deeper question is whether a cached redirect may outlive a takedown, so I will define that behavior before choosing cache lifetimes.”

## Cross-links

- [Spreading work without creating a new bottleneck](./load-balancing.md) (id: load-balancing)
- [Remembering the expensive answer nearby](./caching/lesson.md) (id: caching)
- [Splitting a keyspace so one box is not the product](./sharding/lesson.md) (id: sharding)
- [Consistency promises during failures](./cap-and-consistency.md) (id: cap-and-consistency)
- [Create and resolve short links safely](../cases/url-shortener/lesson.md) (id: url-shortener)
- [Build a feed with bounded fanout](../cases/news-feed/lesson.md) (id: news-feed)
- [HTTP is a conversation, TCP is the pipe](../../cs/http-and-tcp.md) (id: http-and-tcp)
