---
id: news-feed
title: Build a feed with bounded fanout
slug: news-feed
kind: case-study
track: system-design
difficulty: core
estimated_minutes: 20
summary: Combine bounded fanout and read-time merging while preserving durable publication and current visibility rules.
tags:
  - system-design
  - system-design/product-cases
  - system-design/caching
  - system-design/messaging
  - interviews
  - interviews/system-design
prerequisites:
  - interview-framework
  - caching
  - queues-delivery
related:
  - interview-framework
  - caching
  - queues-delivery
  - chat-system
  - notification-system
company_signal: []
sources_consulted:
  - https://kafka.apache.org/41/design/design/#message-delivery-semantics
updated: 2026-10-26
status: canonical
---

# Build a feed with bounded fanout

## Snapshot

- Separate durable posts from the candidate lists used to build a home feed.
- Push ordinary authors' posts to follower inboxes; evaluate pull-based handling for very large audiences.
- Treat ranking, privacy, and freshness as separate decisions.
- A queue helps fanout recover, but the post and publication event need a safe commit boundary.

## What this round is actually scoring

Whether one high-fanout author, a delayed worker, or a privacy change breaks the design.

## Company signal

This is an original practice scenario. No traceable company-specific frequency evidence is supplied.

## Requirements

| Area | Requirement |
| --- | --- |
| Publish | Create a durable post and distribute it to eligible followers |
| Read | Return a ranked page with a stable pagination cursor |
| Privacy | Enforce current blocking and visibility rules on reads |
| Degradation | Permit delayed feed inclusion; define a useful fallback when ranking fails |

## Back-of-envelope

These are illustrative workload assumptions, not production measurements.

Assume 200 million users and 2,000 retained candidate IDs per user. At eight bytes per ID, that is 3.2 TB of raw IDs if all users have full inboxes. Ranking metadata, indexes, replication, and runtime overhead add storage.

A post to 500 followers causes about 500 candidate insertions. A post to 20 million followers cannot be sized from the average alone. A threshold such as 10,000 followers is a tunable starting assumption, not an established universal split.

## Design

### ELI5

Store the post once. For most authors, place its ID in followers' candidate lists. For extremely large audiences, retrieve recent posts from those authors when a follower reads, then merge and rank the candidates.

[Follow hybrid fanout](viz/hybrid.md)

### Write and read paths

Commit a post and an outbox event together. A relay publishes the event; workers insert candidates idempotently using `(recipient, post_id)`. Track fanout progress so a retry resumes without creating duplicate entries.

At read time, merge the pushed inbox with eligible posts from pull-based authors. Bound the amount of work per page: a person following many large authors must not trigger an unbounded scatter. Cache or pre-merge candidate streams where useful. Rank the bounded set and hydrate post details.

Apply authorization and block/mute policies before returning results. Lazy cleanup can remove old candidates later, but must not be the only enforcement for a privacy change. A ranking outage may fall back to reverse chronological order over **authorized** candidates.

Use a cursor tied to a stable ordering or snapshot policy. Explain whether new posts can appear between pages and how duplicates are prevented.

## Tradeoffs

| Strategy | Benefit | Cost |
| --- | --- | --- |
| Push every post | Cheap feed reads | Large audiences create write bursts |
| Pull every author | Cheap publication | Expensive reads for users following many authors |
| Hybrid | Limits extreme fanout | Two paths and a merge policy |
| Precomputed ranking | Faster reads | Stale features and more update work |

## Failure modes

- A post commits but publication is lost: recover through the transactional outbox.
- Duplicate fanout events: unique candidate keys make insertion replayable.
- A blocked author remains in an inbox: filter with current policy before serving.
- A hot author's burst backs up ordinary work: use separate scheduling budgets and lag metrics.

## Follow-ups an interviewer may ask

**Easy:** trace a post to three followers and a retry of the fanout event.

**Medium:** one author gains 20 million followers. Explain how existing followers move between push and pull without missing or duplicating candidates.

**Hard:** a block occurs while ranking is unavailable. Show why the chronological fallback still enforces the block.

## Cross-links

- [Forty-five minutes is a navigation problem](../../foundations/interview-framework.md) (id: interview-framework)
- [Remembering the expensive answer nearby](../../foundations/caching/lesson.md) (id: caching)
- [At-least-once, idempotency, and the dead-letter lane](../../foundations/queues-delivery/lesson.md) (id: queues-delivery)
- [Order messages and resume delivery](../chat-system/lesson.md) (id: chat-system)
- [Route notifications without confusing acceptance and delivery](../notification-system/lesson.md) (id: notification-system)
- [Splitting a keyspace so one box is not the product](../../foundations/sharding/lesson.md) (id: sharding)
