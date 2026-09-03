---
id: ride-hailing
title: Matching and surge, not a map with cars on it
slug: ride-hailing
kind: case-study
track: system-design
difficulty: deep
estimated_minutes: 22
summary: Driftway is a matching problem plus a pricing engine; drawing cars on a map is the shallow version senior interviewers bounce.
tags:
  - system-design
  - system-design/product-cases
  - system-design/realtime
  - system-design/storage
  - interviews
  - interviews/system-design
prerequisites:
  - interview-framework
  - sharding
  - queues-delivery
related:
  - sharding
  - queues-delivery
  - rate-limiter
  - interview-framework
  - payment-idempotency
company_signal:
  - name: Uber
    evidence: Candidate-reported senior loops (prep-site frequency plus loop writeups) say "design Uber" is too shallow; the real ask is the surge-pricing / matching engine.
    year: 2026
    confidence: medium
sources_consulted:
  - Hello Interview / Design Gurus ride-hailing notes (consulted, not copied)
  - r/cscareerquestions and r/OfferEngineering Uber senior reports
  - meta/RESEARCH.md frequency table
updated: 2026-09-02
status: canonical
---

# Matching and surge, not a map with cars on it

## Snapshot

- Product: **Driftway**. Riders request a trip; drivers get an offer; a **SurgeBoard** prices the hex.
- v1 is point-to-point, one region, no pooling. The map is a client. The system is **geo-index + match + price + trip state**.
- Senior reports (Uber-shaped) bounce candidates who stop at "websocket the nearest car." The interesting engine is **how a hex's multiplier moves**, and how matching still terminates when demand spikes.
- Location pings are a firehose. You store the latest ping, not the whole trail, on the matching path.

## What this round is actually scoring

Can you pick a geo shard, bound the match loop, and talk about surge as a control system (stability, gaming, fairness) rather than a lookup table? Depth beats a fleet of microservices named after cars.

## Company signal

Candidate-reported Uber senior loops, plus prep-site frequency, say "design Uber" is too shallow and the surge / dispatch engine is the real ask. Confidence: **medium** (repeated reports, not a huge independent pile). Label it as candidate-reported, not official.

## Requirements

| Functional | v1 decision |
| --- | --- |
| Rider requests a trip | Pickup hex, dropoff, product type |
| Driver offers | One offer at a time, 15s TTL |
| Surge multiplier | Per hex, published every few seconds |
| Trip lifecycle | `requested → offered → accepted → enroute → complete` |
| Pooling, scheduled, cross-city | Non-goals |

| Non-functional | Budget |
| --- | --- |
| Match p99 (first offer) | 3 s |
| Location ping | 4 s while on shift |
| Surge update | 5 s publish |
| Double-assign a driver | Never |
| Payment | Hand off to Till; do not design the ledger here |

## Back-of-envelope

2 million trips/day ≈ 23/s average, **~230/s** peak city-wide. That is small. The firehose is pings: 80k on-shift drivers × 1 ping/4s = **20k/s** location writes. Riders opening the map: 50k concurrent viewers × 1 ping/8s ≈ 6k/s.

Match QPS follows requests (~230/s peak), but each request may query a neighboring set of hexes and 20 candidate drivers. CPU, not disk.

Surge: thousands of hexes, a tiny time series. Cheap to store, easy to get *wrong* as a control loop.

## Design

**GeoHex** shards the city (H3-style, ~500 m). Each hex has a **MatchBroker** owner (consistent hash). Driver pings update `driver:{id} → {hex, loc, status}` in an in-memory map plus a short TTL store. Idle drivers are in a per-hex set.

Request path:

1. Rider request lands on the pickup hex's broker.
2. Broker gathers idle drivers in that hex + neighbors (k-ring), filters product type, ranks by ETA.
3. Offer goes to driver 1. 15s timer. Reject or timeout → driver 2.
4. Accept: compare-and-set driver status `idle → busy`. If CAS fails, the driver was stolen; continue. This is the [idempotency](./payment-idempotency.md) (id: payment-idempotency) cousin: at-least-once offers, exactly-one assignment.

**SurgeBoard** is a separate loop, not a line inside MatchBroker:

- Input: requests/min and idle drivers/min per hex (and neighbors).
- Output: multiplier `m` in [1.0, 5.0], smoothed (do not jump 1.0 → 4.2 in one tick).
- Publish to a snapshot the app reads. Matching *uses* `m` to decide whether to wait for more drivers or to shed riders with a high quote.

Do not "set price = demand/supply." That oscillates. Talk in terms of a damped controller and a max step per 5s tick. Mention gaming: drivers going offline at the hex border, riders walking 200 m. Neighbor smoothing exists to make that less profitable.

Trip complete: enqueue billing to Till with an idempotency key `trip_id`.

## Tradeoffs

| Choice | Gain | Cost |
| --- | --- | --- |
| Hex-owned broker vs global matcher | Locality, shard by city | Airport hex is a hotspot |
| Offer waterfall vs broadcast to 10 drivers | No thundering accept | Extra seconds of wait |
| Surge as a snapshot vs computed at request | Stable quote on the client | 5s stale price |
| Store every ping vs latest-only | Matching stays small | You need a different store for "trail" / fraud |

## Failure modes

- Airport hex melts: split into sub-hexes, or add a queue of riders (a *virtual* hex) so the broker does not scan 3,000 idle drivers on every request.
- Surge oscillation: cap `Δm` per tick, include neighbors, never use a single-tick ratio.
- Broker death: pings have TTL; another box takes the hex; in-flight offers timeout and retry. See [queues-delivery](../foundations/queues-delivery.md) (id: queues-delivery).
- Double accept: CAS on driver status; loser gets "offer expired."

## Follow-ups an interviewer may ask

- Pooling: a second matcher on overlapping routes, different SLA. Do not bolt it onto v1.
- Fraud / GPS spoof: a scoring service off the 3s path.
- Why this is not "design Uber": because the map, chat, and payments are other rounds. Stay on match + surge.

## Cross-links

- [Splitting a keyspace so one box is not the product](../foundations/sharding.md) (id: sharding)
- [At-least-once, idempotency, and the dead-letter lane](../foundations/queues-delivery.md) (id: queues-delivery)
- [Making a double-click charge once](./payment-idempotency.md) (id: payment-idempotency)
- [Token buckets and sliding windows at the edge](./rate-limiter.md) (id: rate-limiter)
- [Forty-five minutes is a navigation problem](../foundations/interview-framework.md) (id: interview-framework)
- [CAP as a conversation, not a religion](../foundations/cap-and-consistency.md) (id: cap-and-consistency)
