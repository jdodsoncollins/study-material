---
id: payment-idempotency
title: Making a double-click charge once
slug: payment-idempotency
kind: case-study
track: system-design
difficulty: core
estimated_minutes: 16
summary: Till treats a charge as a ledger append fenced by an idempotency key so a double-click, a retry, and a webhook replay all collapse to one effect.
tags:
  - system-design
  - system-design/product-cases
  - system-design/consistency
  - system-design/messaging
  - interviews
  - interviews/system-design
prerequisites:
  - interview-framework
  - queues-delivery
  - cap-and-consistency
related:
  - queues-delivery
  - cap-and-consistency
  - transactions-isolation
  - rate-limiter
  - job-scheduler
company_signal:
  - name: Stripe
    evidence: Candidate-reported loops and public X threads on idempotency keys treat double-charge / ledger design as a recurring payments prompt.
    year: 2026
    confidence: medium
  - name: Amazon
    evidence: Prep-site frequency and candidate reports on order/payment adjacent L5 designs probe "what if the client retries."
    year: 2026
    confidence: medium
sources_consulted:
  - X threads on idempotency keys and double-charge
  - Hello Interview / Design Gurus payments notes (consulted, not copied)
  - Standard interview CS on isolation and exactly-once effects
updated: 2026-09-02
status: canonical
---

# Making a double-click charge once

## Snapshot

- Product: **Till**, a Stripe-flavored charge API used by Driftway, ClipForge premium, and Stagecast tips.
- The villain is not "the bank." It is the **double-click**, the mobile retry, and the webhook the partner replays.
- v1 primitive: `POST /intents` with header `Idempotency-Key`. Same key + same body → same intent. Same key + different body → `409`.
- Money is a **ledger**, not an updatable `balance` cell. Effects are append-only entries, fenced by the key.

## What this round is actually scoring

Whether you fail closed, whether retries are safe, and whether you know the difference between "we sent the card network a capture" and "we recorded that we did." Interviewers will press on crash-between-network-and-disk.

## Company signal

Candidate-reported Stripe-shaped loops and X threads on idempotency, plus prep-site frequency on double-charge / ledger prompts. Confidence: **medium**. Label it candidate-reported; do not claim an official bank.

## Requirements

| Functional | v1 decision |
| --- | --- |
| Create a payment intent | Amount, currency, customer, destination |
| Capture / cancel | Explicit, not implicit on create |
| Idempotency key | Required on create and capture, TTL 24h |
| Webhooks to the merchant | At-least-once, signed, with `event_id` |
| Refunds, disputes, multi-capture | Non-goals (name them) |

| Non-functional | Budget |
| --- | --- |
| Peak intents | 20k/s (a drop plus a concert) |
| Create p99 | 150 ms not including the network |
| Durability | No ack until the intent row is on disk |
| Double charge | Never, even if we time out the client |
| Ledger audit | Every cent has an entry |

## Back-of-envelope

20k/s intents, 1 KB rows → 20 MB/s writes. A single primary can take this; you still shard by `merchant_id` so one marketplace cannot stall everyone. Idempotency index: 20k/s × 24h × 1 KB ≈ 1.7 TB of keys if you keep them all — so TTL 24h and hash the key.

The card network is the slow neighbor (200–800 ms). Till must not hold a row lock that long. Pattern: persist `status=pending` under the idempotency key, call the network, then append `captured` or `failed`.

## Design

**IdempotencyVault**: unique `(merchant_id, key)` → `intent_id` + hash of canonical body. Insert-first. If the row exists and the hash matches, return the stored response (even if still `pending`). If the hash differs, `409`.

**IntentLedger**: append-only. Entries like `intent_created`, `capture_requested`, `capture_ok`, `capture_failed`. Current status is a fold of the log (or a projection table updated in the same transaction). See [transactions-isolation](../../cs/transactions-isolation.md) (id: transactions-isolation): the insert of the vault row and the first ledger line commit together.

Capture path, crash-safe:

1. Client `POST /capture` with a *new* idempotency key (or a derived one `intent_id:capture`).
2. Till records `capture_requested`.
3. Call the network. If the client retries, Till sees `capture_requested` and **reconciles** with the network (not a second capture).
4. Network says ok → `capture_ok`. Webhook `payment.captured` enqueued with `event_id`.

Webhooks are [at-least-once](../foundations/queues-delivery.md) (id: queues-delivery). Partners must be idempotent on `event_id`. Till will retry for 24h, then DLQ.

[QuotaDesk](./rate-limiter.md) (id: rate-limiter) fail-closed on capture.

## Tradeoffs

| Choice | Gain | Cost |
| --- | --- | --- |
| Client-supplied idempotency key | Natural double-click fence | Clients forget; you must reject missing keys |
| Derived key from `(user, cart, amount)` | No header | Cart edits collide or sneak a second charge |
| Ledger + projection | Audit, replay | Two writes, more moving parts |
| Sync capture vs async | Simpler client | Holds the request open on the network |

## Failure modes

- Crash after network capture, before `capture_ok`: a **reconciler** (Clockyard job) looks up pending captures older than 30s and asks the network. Never "just capture again."
- Two different bodies, one key: `409`, do not guess.
- Partner webhook handler not idempotent: their bug; you still deliver at-least-once and show them `event_id`.
- Ledger primary lag: fail closed. Serving a cached "paid" is how you double-ship goods. See [CAP](../foundations/cap-and-consistency.md) (id: cap-and-consistency).

## Follow-ups an interviewer may ask

- Exactly-once to the card network: you cannot promise it; you promise *one logical capture* via reconcile.
- Multi-region active-active: uniqueness of the vault row needs a single authority per merchant (or CRDT-free fail-closed).
- Tips / splits: more ledger lines, same key story.

## Cross-links

- [At-least-once, idempotency, and the dead-letter lane](../foundations/queues-delivery.md) (id: queues-delivery)
- [CAP as a conversation, not a religion](../foundations/cap-and-consistency.md) (id: cap-and-consistency)
- [Isolation levels as a conversation](../../cs/transactions-isolation.md) (id: transactions-isolation)
- [Token buckets and sliding windows at the edge](./rate-limiter.md) (id: rate-limiter)
- [Cron, ad-hoc, leases, and retries](./job-scheduler.md) (id: job-scheduler)
- [Matching and surge, not a map with cars on it](./ride-hailing.md) (id: ride-hailing)
- [Forty-five minutes is a navigation problem](../foundations/interview-framework.md) (id: interview-framework)
