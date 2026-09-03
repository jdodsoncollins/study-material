---
id: chat-system
title: Ordered delivery for a 1:1 and small-group messenger
slug: chat-system
kind: case-study
track: system-design
difficulty: core
estimated_minutes: 20
summary: Kettle is a messenger with per-conversation order, presence as a lie budget, and at-least-once delivery with client-generated message ids.
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
company_signal:
  - name: Meta
    evidence: Candidate-reported product loops and prep-site frequency lists treat messenger-style chat as a high-frequency Meta prompt, with ordering and presence as the usual deep dives.
    year: 2026
    confidence: high
sources_consulted:
  - Hello Interview question DB (chat / messenger)
  - Design Gurus 2026 FAANG guides
  - r/cscareerquestions Meta messenger-style writeups
updated: 2026-09-02
status: canonical
---

# Ordered delivery for a 1:1 and small-group messenger

## Snapshot

- Product: **Kettle**. v1 is 1:1 and groups of ≤ 50. No channels of 10k, no disappearing mode.
- Order is **per conversation**, not global. A monotonically increasing `seq` owned by that conversation's shard is enough.
- Delivery is **at-least-once**. Clients mint `message_id`; relays dedup. Acks move a per-user cursor.
- Presence is a 30-second lie, not a linearizable census. **PresencePulse** heartbeats, last-writer-wins.

## What this round is actually scoring

Realtime product sense: where the websocket terminates, how you do not lose order when two devices send at once, and what "online" means when a phone sleeps. Meta-flavor loops will not let you hide in a generic "chat service" box.

## Company signal

Candidate-reported Meta product loops and prep-site frequency lists keep messenger-style chat at the top of the product-architecture pile. Confidence: **high**. Expect ordering, multi-device, and presence as follow-ups.

## Requirements

| Functional | v1 decision |
| --- | --- |
| Send / receive text | Groups ≤ 50, 1:1 |
| Multi-device | Same user, three devices, shared cursor per device |
| Delivery receipts | Sent, delivered, read — per user, not per device |
| Presence | Online / recently / offline |
| Media | Pointer in the message, blob store out of band |

| Non-functional | Budget |
| --- | --- |
| DAU | 300 million |
| Send p99 (accept) | 80 ms in-region |
| Catch-up after reconnect | 500 ms for last 50 messages |
| Order | Per-conversation total order |
| Presence accuracy | ~30s |

## Back-of-envelope

300M DAU × 40 messages/user/day = 12B messages/day ≈ **139k/s** average, ~1.4M/s peak.

200 bytes average body → 2.4 TB/day raw. Keep 30 days hot (≈ 72 TB) on **InboxLog**, colder on object storage.

Presence: 80M concurrent sockets, heartbeat every 30s → ~2.7M/s tiny writes if you treat it as a database. You will not. PresencePulse keeps state in memory per connection box, with a secondary index to find a user's boxes. Heartbeats stay on the socket; they do not hit InboxLog.

Connections: 80M sockets / 50k per **Relay** box ≈ 1,600 Relays. That fleet is the real scale, not the message table.

## Design

Client opens a websocket to **Relay** (L7 balancer with sticky *connection*, not sticky user forever). Relay authenticates, then subscribes to the user's mailbox.

Send path:

1. Client sends `{conversation_id, message_id, body}`. `message_id` is a UUID from the client.
2. Relay forwards to the **conversation shard** (hash of `conversation_id`). The shard assigns `seq`, appends to InboxLog, and fans the event to online Relays for members.
3. Offline members get a push via [Herald](./notification-system.md) (id: notification-system).
4. Duplicate `message_id` on retry returns the original `seq`.

InboxLog is an append-only log per conversation plus a per-user pointer `last_read_seq`. Catch-up is "give me seq > X." That is [at-least-once](../foundations/queues-delivery.md) (id: queues-delivery) with idempotent clients.

Group of 50: fanout 50 is cheap. Do not use Fieldnote's stadium path here; the product forbids stadiums.

## Tradeoffs

| Choice | Gain | Cost |
| --- | --- | --- |
| Seq on the conversation shard | Simple total order | That shard is a bottleneck for a hot group |
| Client `message_id` | Safe retries, multi-device echoes | Must store a dedup index |
| Websocket vs long-poll | Low latency, bidirectional | Connection fleet, draining, sticky-until-drain |
| Presence in memory | Cheap heartbeats | A Relay death looks like a mass logout until reconnect |
| Per-device vs per-user read cursor | Phones do not steal laptop unread | More state |

## Failure modes

- Relay dies: clients reconnect, catch-up from `last_ack_seq`. Presence flips offline until the new heartbeat. Budget the lie.
- Conversation shard dies: fail closed on send, serve last cached tail for read. See [CAP as a conversation](../foundations/cap-and-consistency.md) (id: cap-and-consistency).
- Two devices send at once: both get seq from the same shard; order is "whatever the shard serialized," which is the product.
- At-least-once double push: Herald and Relay both deliver; client dedups on `message_id`.

## Follow-ups an interviewer may ask

- 10k-user rooms: that is a broadcast channel, different fanout, different order rules. Out of v1.
- E2E encryption: Relay becomes a ciphertext pipe; seq still exists, search dies.
- Typing indicators: at-most-once, drop freely, never InboxLog.

## Cross-links

- [At-least-once, idempotency, and the dead-letter lane](../foundations/queues-delivery.md) (id: queues-delivery)
- [CAP as a conversation, not a religion](../foundations/cap-and-consistency.md) (id: cap-and-consistency)
- [Hybrid fanout when some authors are stadiums](./news-feed/lesson.md) (id: news-feed)
- [Fan-out that survives flaky devices](./notification-system.md) (id: notification-system)
- [HTTP and TCP as interview tools](../../cs/http-and-tcp.md) (id: http-and-tcp)
- [Forty-five minutes is a navigation problem](../foundations/interview-framework.md) (id: interview-framework)
