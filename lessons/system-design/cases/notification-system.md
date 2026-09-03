---
id: notification-system
title: Fan-out that survives flaky devices
slug: notification-system
kind: case-study
track: system-design
difficulty: core
estimated_minutes: 16
summary: Herald accepts an event once, fans it into per-device attempts, and treats every channel as at-least-once with a dead-letter lane.
tags:
  - system-design
  - system-design/product-cases
  - system-design/messaging
  - interviews
  - interviews/system-design
prerequisites:
  - interview-framework
  - queues-delivery
related:
  - queues-delivery
  - chat-system
  - job-scheduler
  - rate-limiter
  - news-feed
company_signal:
  - name: Amazon
    evidence: Candidate-reported L5 loops and prep-site frequency lists treat notification/fan-out systems as a standard operations-heavy prompt (retries, channels, DLQ).
    year: 2026
    confidence: high
  - name: Meta
    evidence: Candidate-reported messenger and feed follow-ups often pivot into "how does the push get to the phone."
    year: 2026
    confidence: medium
sources_consulted:
  - Hello Interview notification / job writeups (consulted, not copied)
  - Design Gurus 2026 FAANG guides
  - X threads on idempotency and at-least-once delivery
updated: 2026-09-02
status: canonical
---

# Fan-out that survives flaky devices

## Snapshot

- Product: **Herald**. Apps (Kettle, Fieldnote, ClipForge, Till) publish an event; Herald decides who gets it, on which channel, and how it is retried.
- Channels: push (APNs/FCM), email, SMS, in-app inbox. v1 is transactional, not marketing blasts.
- Every channel is **at-least-once**. Devices double-tap; providers retry. Dedup on `event_id + user_id + channel`.
- Preference, quiet hours, and rate limits live in Herald, not in every product.

## What this round is actually scoring

Can you separate *accept the event* from *talk to a flaky vendor*, and can you stop a poison payload from stalling a user? Amazon-flavor loops will kill the SMS vendor and watch whether you DLQ. Do not design a new Kafka.

## Company signal

Candidate-reported L5 loops and prep-site frequency lists treat notification systems as a standard operations-heavy prompt. Meta writeups often reach the same design as a follow-up to chat or feed. Confidence: **high** at Amazon-shaped loops, **medium** as a Meta pivot.

## Requirements

| Functional | v1 decision |
| --- | --- |
| Publish event | `{event_id, user_id, template, payload}` |
| Per-user preferences | Channel allow-list, quiet hours |
| Push, email, SMS, in-app | Push + in-app first; SMS for auth only |
| Unsubscribe / revoke device | Immediate on next attempt |
| Read inbox | Last 50 in-app notifications |

| Non-functional | Budget |
| --- | --- |
| Accept p99 | 50 ms |
| Push attempt p99 | 2 s including vendor |
| At-least-once | Yes, with dedup |
| Drop on preference miss | Silent, counted |
| Peak ingest | 200k events/s (Fieldnote publish spikes) |

## Back-of-envelope

Fieldnote: 800M posts/day but we do **not** notify every follower. Notifications are for DMs, mentions, and "you were followed." Estimate 20 notifications/user/day × 200M = 4B/day ≈ 46k/s average, **~460k/s** peak if we ever did naive post-notify — which is why product forbids it.

Kettle offline push: a fraction of 139k messages/s. Budget **80k push attempts/s** peak.

Each attempt: a 200-byte ticket in **DeliveryLog**. 80k/s × 200 B ≈ 16 MB/s. Easy. The scarce resource is vendor QPS and device tokens, not disk.

## Design

**TopicRouter** accepts events (idempotent on `event_id`). It loads preferences from a cached snapshot, expands to `N` **delivery tickets** `{event_id, user_id, channel, device_token}`, and enqueues them.

**ChannelAdapters** consume tickets:

- Push adapter talks to APNs/FCM with vendor-specific batching.
- Email adapter talks to the mail provider; 429s back off.
- In-app adapter appends to `inbox:{user}` (same shape as Fieldnote's id inbox).

Tickets use a 30s lease. Success writes `delivered` to DeliveryLog. Crash before ack → retry. Dedup table keyed by `(event_id, user_id, channel)` makes the side effect effectively-once *to the vendor*, which still may deliver twice — the client de-dupes by `event_id`. See [queues-delivery](../foundations/queues-delivery.md) (id: queues-delivery).

**Quiet hours** are applied at ticket-creation time, with a delayed queue (or [Clockyard](./job-scheduler.md) (id: job-scheduler)) to release in the morning.

**QuotaDesk** caps per-user push at 10/hour for social events so a mention storm cannot wake a phone all night. Auth SMS bypasses that cap and fail-closes if the meter is down. See [rate-limiter](./rate-limiter.md) (id: rate-limiter).

## Tradeoffs

| Choice | Gain | Cost |
| --- | --- | --- |
| Fan-out tickets vs one queue per event | Adapters scale independently | More messages |
| Delayed quiet-hours queue | Simple product rule | Clock skew; "08:00" is per user TZ |
| Fail-open social vs fail-closed auth | Availability where it is safe | Two code paths, must not mix |
| In-app + push for the same event | Users see it somewhere | Double noise if not deduped in UI |

## Failure modes

- Vendor 5xx: exponential backoff, then DLQ the ticket, not the original event (other channels may have succeeded).
- Bad device token: adapter marks token dead; do not retry five times.
- TopicRouter duplicate publish: `event_id` unique index, return the original expansion.
- Preference change after tickets were created: adapters re-check a version number; stale tickets drop.

## Follow-ups an interviewer may ask

- Marketing blasts: different fleet, different opt-in, never share the transactional queue.
- Digest email: Clockyard cron, not per-event email.
- Cross-region: tickets are user-sharded; vendors are global.

## Cross-links

- [At-least-once, idempotency, and the dead-letter lane](../foundations/queues-delivery.md) (id: queues-delivery)
- [Cron, ad-hoc, leases, and retries](./job-scheduler.md) (id: job-scheduler)
- [Ordered delivery for a 1:1 and small-group messenger](./chat-system.md) (id: chat-system)
- [Hybrid fanout when some authors are stadiums](./news-feed.md) (id: news-feed)
- [Token buckets and sliding windows at the edge](./rate-limiter.md) (id: rate-limiter)
- [Forty-five minutes is a navigation problem](../foundations/interview-framework.md) (id: interview-framework)
