---
id: notification-system
title: Route notifications without confusing acceptance and delivery
slug: notification-system
kind: case-study
track: system-design
difficulty: core
estimated_minutes: 16
summary: Route durable events through authorized channel attempts and distinguish provider acceptance from observed delivery.
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
company_signal: []
sources_consulted:
  - https://developer.apple.com/documentation/usernotifications/sending-notification-requests-to-apns
updated: 2026-10-26
status: canonical
---

# Route notifications without confusing acceptance and delivery

## Snapshot

- Separate the business event, recipient decision, channel attempt, and delivery receipt.
- Queue redelivery is different from a provider or device receiving a notification.
- Preferences, authorization, and quiet hours can change while work waits.
- Dedupe keys must identify the intended effect, including device identity where needed.

## What this round is actually scoring

Whether the service handles bursts and retries without violating recipient preferences or claiming delivery it cannot observe.

## Company signal

This is an original practice scenario. No traceable company-specific frequency evidence is supplied.

## Requirements

| Area | Requirement |
| --- | --- |
| Channels | Email, push, and an in-app inbox |
| Preferences | Honor opt-outs, priority, and quiet hours by message category |
| State | Distinguish queued, provider-accepted, delivered when observable, and failed |
| Recovery | Bound retries and preserve inspectable failed work |

## Back-of-envelope

These are illustrative workload assumptions, not production measurements.

Assume 200 million users receive twenty notifications/day. That is four billion notifications/day, about 46,300/s average. A tenfold peak is about 463,000/s. The channel mix determines actual provider requests; multi-device push can exceed the logical notification count.

Measure payload sizes, vendor quotas, and retry rates. Capacity for 80,000 push attempts/s would cover only that channel's assumed share, not the whole peak by itself.

## Design

### ELI5

A business event produces recipient work. The router checks whether each person should receive it, chooses channels, and records each attempt. A provider saying “accepted” is a different fact from a person receiving or reading it.

[Route channel work](viz/channels.md)

### State and dispatch

Create a durable event ID at the source and publish through an outbox where the event accompanies a database change. Expand recipients in bounded batches. Store a logical notification key such as `(event, recipient, category)`; use a separate channel-attempt key, and include the target device for device-specific push.

Apply authorization and preferences before enqueueing and recheck relevant changes at dispatch time. Delay eligible work for quiet hours using an explicit time-zone policy. Urgent categories need their own user-visible rules, not a hidden bypass.

Separate channel queues and budgets so a slow email provider does not block push or the in-app inbox. Retry transient errors with backoff and provider guidance; remove invalid device tokens and stop permanent failures.

Use provider idempotency where available. If a provider accepts a request but its response is lost, local deduplication cannot prove whether a repeat would send twice. Reconcile when possible and document residual duplicate risk. Push transport is best-effort and may expire or collapse messages; use a durable in-app inbox for information users must later recover.

## Tradeoffs

| Choice | Benefit | Cost |
| --- | --- | --- |
| Separate channel queues | Isolates vendor slowdowns | More scheduling and observability |
| Delivery receipts | Better outcome evidence | Provider/channel coverage varies |
| Collapse repeated updates | Less device noise | Inappropriate for independently important events |
| Durable inbox | Recoverable history | Storage, retention, and read-state management |

## Failure modes

- Preferences change while queued: re-evaluate before dispatch.
- A provider response times out: record an unknown attempt, not an assumed failure.
- Poison payloads repeatedly fail: bound retries and expose diagnostics with sensitive fields minimized.
- A recipient has three devices: dedupe per intended device effect rather than dropping two deliveries.

## Follow-ups an interviewer may ask

**Easy:** a provider returns success. Which state can the service truthfully record?

**Medium:** a user opts out after enqueueing but before dispatch. Identify the second preference check.

**Hard:** a provider offers neither idempotency nor delivery lookup. Explain the unavoidable uncertainty after a lost response and choose a product policy for duplicates versus missed attempts.

## Cross-links

- [At-least-once, idempotency, and the dead-letter lane](../../foundations/queues-delivery/lesson.md) (id: queues-delivery)
- [Schedule occurrences and recover leased work](../job-scheduler/lesson.md) (id: job-scheduler)
- [Order messages and resume delivery](../chat-system/lesson.md) (id: chat-system)
- [Build a feed with bounded fanout](../news-feed/lesson.md) (id: news-feed)
- [Enforce request budgets across servers](../rate-limiter/lesson.md) (id: rate-limiter)
- [Forty-five minutes is a navigation problem](../../foundations/interview-framework.md) (id: interview-framework)
