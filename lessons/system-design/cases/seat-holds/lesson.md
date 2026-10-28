---
id: seat-holds
title: Hold concert seats without overselling
slug: seat-holds
kind: case-study
track: system-design
difficulty: core
estimated_minutes: 20
summary: Make a seat hold one conditional write with an expiry, hand the hold to payment with an idempotent key, and decide what happens when money arrives after the hold is gone.
tags:
  - system-design
  - system-design/product-cases
  - system-design/consistency
  - system-design/storage
  - interviews
  - interviews/system-design
prerequisites:
  - transactions-isolation
  - payment-idempotency
related:
  - payment-idempotency
  - transactions-isolation
  - rate-limiter
  - ride-hailing
  - caching
company_signal: []
sources_consulted:
  - https://www.postgresql.org/docs/current/explicit-locking.html
  - https://www.postgresql.org/docs/current/transaction-iso.html
  - https://docs.stripe.com/api/idempotent_requests
updated: 2026-10-28
status: canonical
---

# Hold concert seats without overselling

## Snapshot

- The operation that matters is "hold seats F7 and F8 for me for eight minutes". It must succeed for exactly one shopper.
- The authoritative state is one row per seat (or one counter per general-admission pool). The seat map everyone stares at is a cached picture of it.
- A hold is a lease: it carries an owner, an expiry, and an ID that payment confirmation must quote back.
- The hard case is a payment that succeeds after the hold expired and the seat was resold. Decide the answer before you draw boxes.

## What this round is actually scoring

Whether two shoppers can ever both pay for one seat, and whether a crash or a slow card processor between "held" and "sold" leaves a seat stuck, double-sold, or charged without a ticket.

## Company signal

This is an original practice scenario. No traceable company-specific frequency evidence is supplied.

## Requirements

| Area | Requirement |
| --- | --- |
| Browse | Show a seat map with roughly current availability |
| Hold | Reserve 1–8 specific seats, all or nothing, for 8 minutes |
| Pay | Charge once per order, even with retries and double-clicks |
| Confirm | Seats move to sold only for the hold that is paying for them |
| Release | Abandoned holds return seats to sale without manual cleanup |
| Fairness | A waiting room admits shoppers at a controlled rate when demand spikes |

| Non-functional | Target (illustrative) |
| --- | --- |
| Oversell | zero |
| Hold latency | p99 under 300 ms |
| Seat map staleness | a few seconds is acceptable; the hold is the real check |

## Back-of-envelope

These are illustrative workload assumptions, not production measurements.

- Venue: **18,000 seats**. At 10:00, **600,000 people** sit in the waiting room.
- The waiting room admits **50 shoppers/s** (3,000 per minute). Each admitted shopper makes about 1.5 hold attempts: **75 hold transactions/s**. That is small for a database. The difficulty is contention on the same rows, not volume.
- Admitted shoppers stay about 8 minutes: 50 × 480 ≈ **24,000 concurrent shoppers**. If each seat map refreshes every 5 s, that is **4,800 map reads/s**. Serve them from a snapshot rebuilt every second or two.
- 600,000 waiting clients polling their queue position every 15 s is **40,000 requests/s**. Make that path a signed token and a cheap position lookup, far from the seat database.
- Orders average 2.5 seats, so 18,000 seats are about 7,200 orders. If 60% of admitted shoppers buy, that is 30 orders/s and a sellout in about **240 s**, after roughly 12,000 admissions.
- General admission: a 4,000-ticket floor pool is one counter row. If each decrement holds its row lock for about 5 ms, that row tops out near 200 holds/s. Splitting it into 8 sub-pools of 500 raises the ceiling at the cost of "sold out" being a little fuzzy at the end.

## Design

### ELI5

Every seat has a tag: open, held by someone until a time, or sold. To hold seats, you flip their tags from open to "held by you until 10:08" in one move, and that move fails if any tag has changed. Paying turns your tags into sold, but only if they still say your name. If you walk away, the time on the tag runs out and the seat is open again.

[Walk a hold from pick to ticket](viz/hold.md)

### Operation and authoritative state

Store `seat(event_id, seat_id, state, hold_id, expires_at, version)`. The hold is a single conditional write over every requested seat:

`UPDATE seat SET state='held', hold_id=$h, expires_at=now()+8min WHERE event_id=$e AND seat_id IN ($s) AND (state='open' OR (state='held' AND expires_at < now()))`

Commit only if the updated-row count equals the number of seats requested; otherwise roll back. That makes "F7 and F8 together" all-or-nothing. In PostgreSQL at its default Read Committed level, a second shopper's update waits on the row lock, then re-checks the `WHERE` condition against the newly committed row and skips it because it is now `held`. Other engines and isolation levels behave differently (some raise a serialization error instead), so state the engine you assume. Run it in one transaction on one partition (partition by `event_id`), so there is no cross-shard coordination on the hot path.

```ts
type Seat = { state: "open" | "held" | "sold"; holdId?: string; expiresAt?: number };

// In production this is one conditional UPDATE inside a transaction.
function hold(seats: Map<string, Seat>, ids: string[], holdId: string, now: number, ttlMs: number): boolean {
  const free = ids.every(id => {
    const s = seats.get(id);
    return s !== undefined && (s.state === "open" || (s.state === "held" && (s.expiresAt ?? 0) <= now));
  });
  if (!free) return false;
  for (const id of ids) seats.set(id, { state: "held", holdId, expiresAt: now + ttlMs });
  return true;
}
// Payment succeeded: sell only seats this hold still owns.
function confirm(seats: Map<string, Seat>, ids: string[], holdId: string, now: number): boolean {
  const mine = ids.every(id => {
    const s = seats.get(id);
    return s?.state === "held" && s.holdId === holdId && (s.expiresAt ?? 0) > now;
  });
  if (mine) for (const id of ids) seats.set(id, { state: "sold", holdId });
  return mine;
}

const min = 60_000;
const seats = new Map<string, Seat>(["F7", "F8", "F9"].map(id => [id, { state: "open" }]));
console.log(hold(seats, ["F7", "F8"], "maya", 0, 8 * min)); // true
console.log(hold(seats, ["F8", "F9"], "leo", 1 * min, 8 * min)); // false: F8 is Maya's
console.log(hold(seats, ["F8", "F9"], "leo", 9 * min, 8 * min)); // true: Maya's hold expired
console.log(confirm(seats, ["F7", "F8"], "maya", 9.5 * min)); // false: refund Maya
```

### Commit boundary and payment handoff

There are two commits, and money sits between them.

1. **Hold committed.** The conditional write above, plus an `order(order_id, hold_id, amount, state='awaiting_payment')` row in the same transaction.
2. **Payment started.** On "Pay", move the order to `paying` and extend the seats' expiry to a hard cap (for example, 5 more minutes) in one write. The sweeper does not release seats in `paying`. Call the payment provider with `order_id` as the idempotency key so a double-click or retry cannot charge twice.
3. **Sold committed.** When the provider confirms (synchronous reply or webhook, whichever arrives first; handle both idempotently), run `confirm`: seats `held → sold` only where `hold_id` matches, and the order becomes `paid` in the same transaction. Issue tickets from that committed state through an outbox, not from the webhook handler directly.

If `confirm` fails because the hold is gone, the customer has been charged for nothing. Refund automatically and tell them. That path must exist and be tested, because the extended expiry only makes it rare.

### Recovery behavior

- **Expiry.** The condition `expires_at < now()` makes expired holds reusable even if no cleanup ran. A sweeper still releases them every few seconds so the seat map updates and the order is marked `expired`.
- **Crash after hold, before response.** The client retries with the same request ID; return the existing hold instead of creating a second one.
- **Crash after charge, before confirm.** A reconciler polls the provider for `paying` orders older than a minute and finishes or refunds them.
- **Seat map cache.** Rebuilt from the seat table every second or two. It can show a seat as open that was just held; the hold write is the check that counts.

## Tradeoffs

| Choice | Benefit | Cost |
| --- | --- | --- |
| Row per seat, conditional update | Exact; all-or-nothing groups | Hot rows for premium seats; partition by event |
| Counter per GA pool | One row for 4,000 tickets | Lock-bound ceiling; split into sub-pools near the limit |
| Optimistic version check | No lock waits | Many retries under contention; worse when everyone wants row A |
| Distributed lock service for holds | Familiar | A second source of truth that can disagree with the seat table |
| 8-minute hold | Time to type card details | Seats idle while undecided shoppers browse |
| Waiting room | Smooth, fair admission; protects the database | Another system to run; sessions need signed tokens |

## Failure modes

- **Two shoppers, one seat.** Both see F8 open in the cached map and click. Only one conditional update matches; the other gets "just taken" and a refreshed map.
- **Late payment.** Covered above. Without the `paying` extension it is common; with it, rare. Either way, refund automatically.
- **Webhook replay.** The provider delivers the success webhook three times. Confirmation is keyed by `order_id`; the second and third are no-ops.
- **Bots hold everything.** Scripts grab 8 seats and let them expire, over and over. Per-account hold limits, rate limits at admission, and shorter holds for repeated expirations.
- **Clock disagreement.** App servers compute `expires_at` with skewed clocks. Use the database's clock for both setting and checking expiry.

## Follow-ups an interviewer may ask

**Easy:** trace Maya holding F7 and F8, then Leo trying F8 and F9 one minute later.

**Medium:** the card processor takes 40 s and the hold had 10 s left. What state is the seat in, and who can buy it?

**Hard:** move from assigned seats to a 4,000-person standing floor with 300 holds/s at on-sale. Where does the single counter break, and how do you split it without overselling?

## Cross-links

- [Make a payment retry refer to one operation](../payment-idempotency/lesson.md) (id: payment-idempotency)
- [Isolation defines what concurrent transactions can observe](../../../cs/transactions-isolation.md) (id: transactions-isolation)
- [Enforce request budgets across servers](../rate-limiter/lesson.md) (id: rate-limiter)
- [Reserve drivers before confirming a match](../ride-hailing/lesson.md) (id: ride-hailing)
- [Remembering the expensive answer nearby](../../foundations/caching/lesson.md) (id: caching)
- [Locks buy correctness, not speed](../../../cs/locks-and-concurrency.md) (id: locks-and-concurrency)
