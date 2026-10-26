---
id: chat-system
title: Order messages and resume delivery
slug: chat-system
kind: case-study
track: system-design
difficulty: core
estimated_minutes: 20
summary: Persist ordered conversation messages and resume delivery independently for each device.
tags:
  - system-design
  - system-design/product-cases
  - system-design/realtime
  - system-design/messaging
  - system-design/consistency
  - interviews
  - interviews/system-design
prerequisites:
  - interview-framework
  - queues-delivery
  - cap-and-consistency
related:
  - queues-delivery
  - news-feed
  - notification-system
  - cap-and-consistency
  - http-and-tcp
company_signal: []
sources_consulted:
  - https://kafka.apache.org/41/design/design/#message-delivery-semantics
updated: 2026-10-26
status: canonical
---

# Order messages and resume delivery

## Snapshot

- Define ordering within a conversation rather than across all conversations.
- A server acknowledgement should identify the durability promise it represents.
- Distinguish message delivery to each device from the user's read state.
- Reconnection resumes from durable cursors and tolerates duplicate delivery.

## What this round is actually scoring

Whether messages remain correctly ordered and recoverable when acknowledgements, connections, or leaders fail.

## Company signal

This is an original practice scenario. No traceable company-specific frequency evidence is supplied.

## Requirements

| Area | Requirement |
| --- | --- |
| Send | One-to-one and small-group text messages |
| Order | A stable order within each conversation |
| Devices | Reconnect each device independently; synchronize user read state |
| Delivery | Retry retained messages until acknowledged or until a defined retention policy applies |

## Back-of-envelope

These are illustrative workload assumptions, not production measurements.

Assume 10 million daily users send 20 messages each: 200 million messages/day, about 2,315/s average. A tenfold peak is about 23,150/s. At one kilobyte per stored message, raw growth is about 200 GB/day before indexes and replication.

Group fanout multiplies delivery work. A message addressed to 50 devices can require 50 deliveries, even though it is stored once. Socket capacity and reconnect behavior require measurement.

## Design

### ELI5

A conversation has an authoritative ordered log. Sending appends once to that log; devices keep track of the last messages they have received. Reconnecting asks for the missing part.

[Trace ordered delivery](viz/delivery.md)

### State and paths

Route a conversation to an authoritative partition. In one atomic operation, check the sender's client operation ID, allocate a conversation sequence, and append the message. Return the sequence only after the chosen durability condition is met. A retry with the same operation ID returns the previous result; a different payload with that ID is rejected.

Fence old leaders after failover so two owners cannot assign conflicting positions. State the replication and recovery policy rather than assuming a sequence counter alone solves failover.

Track delivery cursors by `(conversation, device)` and read cursors by `(conversation, user)` according to the product's multi-device policy. Deliveries may repeat; clients deduplicate by message ID. If a cursor predates retained history, return an explicit resynchronization response.

Push notifications are hints to reconnect, not proof that the device received or read a message. Keep the durable log as the recovery source. With end-to-end encryption, server-side plaintext search is unavailable; client-side search remains a separate option.

## Tradeoffs

| Choice | Benefit | Cost |
| --- | --- | --- |
| Per-conversation order | Matches the user's view | A very hot conversation has one ordering bottleneck |
| Device delivery cursors | Reliable independent reconnects | More state than a single user cursor |
| Durable acknowledgement | Clear recovery contract | Replication latency |
| Ephemeral presence | Low overhead | Approximate status during failures |

## Failure modes

- A response is lost after append: reuse the client operation ID.
- Two leaders remain active: reject the stale owner's writes with fencing.
- A device reconnects repeatedly: deduplicate deliveries and bound catch-up work.
- A user leaves a group: authorize history and new delivery under the stated membership policy.

## Follow-ups an interviewer may ask

**Easy:** send a message, lose the acknowledgement, and resend it. How many log entries should exist?

**Medium:** the phone has received sequence 20 while the laptop has received 15. Identify the two delivery cursors and the independent read state.

**Hard:** fail over while a leader has acknowledged data. Explain which replicas may take over without violating that acknowledgement.

## Cross-links

- [At-least-once, idempotency, and the dead-letter lane](../../foundations/queues-delivery/lesson.md) (id: queues-delivery)
- [Consistency promises during failures](../../foundations/cap-and-consistency.md) (id: cap-and-consistency)
- [Build a feed with bounded fanout](../news-feed/lesson.md) (id: news-feed)
- [Route notifications without confusing acceptance and delivery](../notification-system/lesson.md) (id: notification-system)
- [HTTP is a conversation, TCP is the pipe](../../../cs/http-and-tcp.md) (id: http-and-tcp)
- [Forty-five minutes is a navigation problem](../../foundations/interview-framework.md) (id: interview-framework)
