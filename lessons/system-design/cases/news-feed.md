---
id: news-feed
title: Hybrid fanout when some authors are stadiums
slug: news-feed
kind: case-study
track: system-design
difficulty: core
estimated_minutes: 20
summary: Fieldnote's home stream is a fanout problem; naive write-fanout dies on stadium authors, so v1 is hybrid.
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
company_signal:
  - name: Meta
    evidence: Candidate-reported product-architecture loops and prep-site frequency (Exponent / Hello Interview) treat news feed as the most reported Meta prompt.
    year: 2026
    confidence: high
sources_consulted:
  - Hello Interview News Feed breakdowns (consulted, not copied)
  - Design Gurus 2026 FAANG guides
  - r/cscareerquestions Meta loop writeups
updated: 2026-09-02
status: canonical
---

# Hybrid fanout when some authors are stadiums

## Snapshot

- Product: **Fieldnote**, a professional social network. The round is the **home stream**, not the whole app.
- Two paths: **WaveFan** pushes a post id into each follower's inbox (write fanout). **QuietLane** leaves stadium authors out of that push; readers pull those posts at read time.
- Ranking is a separate, bounded rerank of a candidate set. Do not design a full ML platform in v1.
- The math that matters: average fanout is cheap; p99 fanout is a stadium.

## What this round is actually scoring

Meta-flavor product judgment. Can you draw *write vs read*, name the celebrity problem without being asked, and keep ranking in a box that does not swallow the round? They are not scoring whether you remember a three-tier "feed service" cartoon.

## Company signal

Candidate-reported Meta loops and prep-site frequency lists (Exponent, Hello Interview) call news feed the most reported product-architecture prompt. Confidence: **high**. Treat it as a fanout and ranking conversation, not as "design Instagram."

## Requirements

| Functional | v1 decision |
| --- | --- |
| Publish a post | Text + media pointer, one author |
| Home stream | Reverse-chron candidates, light ranker |
| Follow graph | Directed, stored separately |
| Likes / comments | Non-goal beyond a count on the post body |
| Ads | Non-goal |

| Non-functional | Budget |
| --- | --- |
| DAU | 200 million |
| Home p99 | 200 ms to first 20 items |
| Publish p99 | 300 ms to *accept* (fanout may be async) |
| Staleness | A few seconds for ordinary authors |
| Stadium authors | Must not melt WaveFan |

## Back-of-envelope

200M DAU, 4 posts/user/day → 800M posts/day ≈ 9.3k/s average, ~93k/s peak.

Naive write fanout: average 200 followers → 800M × 200 = 160B inbox writes/day ≈ **1.85M/s** average. Peak is worse. That number is why you do not fan out to everyone.

Split authors:

- Ordinary (follower count < 10k): ~99% of posts. Fanout on write into a per-user inbox of post ids.
- Stadium (≥ 10k): ~1% of posts, huge follower mass. Store on the author timeline only. Readers merge at read.

Inbox size: keep last 2k post ids per user (~16 KB). 200M × 16 KB ≈ 3.2 TB — cacheable in **StoryCache**.

Read: 200M × 8 home opens/day ≈ 18.5k/s average, ~185k/s peak. This is why inboxes live in cache, not in a join across the follow graph on every scroll.

## Design

Publish path: API writes the post body to **PostStore** (sharded by `post_id`), then enqueues a fanout job on **WaveFan**.

- WaveFan consumers load the follower list in pages. For each ordinary follower, they *append* `post_id` to `inbox:{user}`. At-least-once, so appends are idempotent on `(user, post_id)`. See [queues-delivery](../foundations/queues-delivery.md) (id: queues-delivery).
- If `follower_count ≥ 10k`, skip WaveFan. Mark the author on a **LoudSet**.

Read path: load the user's inbox (cache-aside). Pull the latest K posts from each followed LoudSet author (small list, cached). Union, take a window, send to **RankLite** (heuristic: recency, author affinity, already-seen). Hydrate bodies from PostStore / StoryCache.

Do not pre-render HTML. Cache post bodies and inboxes, not personalized pages.

## Tradeoffs

| Choice | Gain | Cost |
| --- | --- | --- |
| Write fanout for ordinary authors | Home reads are a list, not a graph join | Write amplification; mute/unfollow is messy |
| Pull for stadium authors | WaveFan survives a keynote | Home reads pay a merge; ranking must not starve ordinary posts |
| Precompute rank vs rank on read | Faster first byte if precomputed | Stale, expensive to rebuild |
| Inbox of ids vs hydrated posts | Mutations (delete, edit) stay in PostStore | Extra hydrate hop |

## Failure modes

- WaveFan consumer crashes after 30% of a follower list: resume from a cursor stored with the job, not from zero (duplicates are fenced by `(user, post_id)`).
- Inbox hot key: a user who follows 8 stadiums plus 400 ordinary authors is fine; a *stadium author's own inbox* is not on the write path.
- RankLite timeout: return reverse-chron. Empty is worse than unranked.
- Mute of a stadium author: QuietLane filter at read. Mute of an ordinary author: drop from inbox lazily.

## Follow-ups an interviewer may ask

- Stories / ephemeral: a second inbox with a 24h TTL, same hybrid rule.
- Notifications for "X posted": that is [Herald](./notification-system.md) (id: notification-system), not WaveFan.
- Multi-hop ranking features: offline, not in the 200 ms path.

## Cross-links

- [Forty-five minutes is a navigation problem](../foundations/interview-framework.md) (id: interview-framework)
- [Remembering the expensive answer nearby](../foundations/caching.md) (id: caching)
- [At-least-once, idempotency, and the dead-letter lane](../foundations/queues-delivery.md) (id: queues-delivery)
- [Ordered delivery for a 1:1 and small-group messenger](./chat-system.md) (id: chat-system)
- [Fan-out that survives flaky devices](./notification-system.md) (id: notification-system)
- [Splitting a keyspace so one box is not the product](../foundations/sharding.md) (id: sharding)
