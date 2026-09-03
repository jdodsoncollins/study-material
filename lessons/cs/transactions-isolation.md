---
id: transactions-isolation
title: Isolation is which lie you agreed to
slug: transactions-isolation
kind: concept
track: cs
difficulty: deep
estimated_minutes: 16
summary: A transaction groups reads and writes into one commit-or-rollback; isolation levels name which concurrent anomalies you are willing to see.
tags:
  - cs
  - cs/databases
  - cs/concurrency
  - interviews/system-design
prerequisites:
  - indexes
  - locks-and-concurrency
related:
  - indexes
  - locks-and-concurrency
  - cap-and-consistency
  - sharding
company_signal:
  - name: Stripe
    evidence: Payments and ledger interviews repeatedly probe double-charge, lost updates, and "what isolation would you pick for this row."
    year: 2026
    confidence: medium
sources_consulted:
  - ANSI isolation phenomena (dirty, non-repeatable, phantom) as taught in DB courses
  - MVCC / snapshot-isolation notes vs true serializable
  - System-design debriefs on idempotency plus row-level transactions
updated: 2026-09-02
status: canonical
---

# Isolation is which lie you agreed to

## Snapshot

- **Atomicity**: all of the transaction's writes land, or none do.
- **Isolation**: concurrent transactions behave *as if* they did not see each other's in-flight work — up to a named level of cheating.
- **Durability**: after commit, a crash does not unwind you. **Consistency** (the C in ACID) is "constraints still hold," not CAP-C.
- Read phenomena: dirty read, non-repeatable read, phantom. Isolation levels are a menu of which you allow.

## Why it shows up in interviews

Any "two requests hit the last oat milk" prompt is isolation plus locking. They want you to name the anomaly, pick a level or an explicit lock, and *not* default to SERIALIZABLE for a read-only feed. Mixing ACID-C with CAP-C is a classic wrong turn; CAP lives in [cap-and-consistency](../system-design/foundations/cap-and-consistency.md) (id: cap-and-consistency).

## Core idea

Two baristas, one fridge row `oat_ml = 200`. Each sale reads, subtracts 40, writes.

```
T1 read 200          T2 read 200
T1 write 160         T2 write 160     lost update: one sale vanished
```

That is a **lost update**. Fixes: `UPDATE ... SET oat_ml = oat_ml - 40` (atomic), `SELECT ... FOR UPDATE`, optimistic `WHERE oat_ml = 200` and retry, or serializable snapshot that aborts one of them.

MVCC (Postgres-style): readers see a snapshot, writers make new row versions. Readers do not block readers. You still can lose updates unless you ask for stronger.

## Comparison

| Level | Dirty read | Non-repeatable | Phantom | Typical use |
| --- | --- | --- | --- | --- |
| Read uncommitted | yes | yes | yes | Almost never |
| Read committed | no | yes | yes | Default in many engines |
| Repeatable read | no | no | often yes | "My snapshot of these rows" |
| Snapshot (SI) | no | no | write skew possible | Common "serializable-ish" |
| Serializable | no | no | no | Inventory, money, seats |

```ts
function debit(row: { ml: number; version: number }, take: number): boolean {
  if (row.ml < take) return false;
  // Optimistic: commit only if version is still what we read.
  row.ml -= take;
  row.version += 1;
  return true;
}

const tank = { ml: 40, version: 3 };
console.log(debit(tank, 15), tank); // true { ml: 25, version: 4 }
console.log(debit(tank, 40), tank); // false, unchanged ml

```

If the `UPDATE ... WHERE version = :old` hits 0 rows, retry the transaction. That is an isolation strategy you can explain without naming an engine.

## Common mistakes

- "SERIALIZABLE means it ran one at a time." It means *equivalent* to some serial order; engines use locks or SSI, not a global queue.
- Ignoring write skew under snapshot isolation: two doctors leave the ward because each saw the other still on shift.
- Using a transaction for a 30-second HTTP call. You hold locks / versions; do the I/O outside.
- Confusing rollback with "the client got an error so nothing happened." Timeouts are the danger zone; use idempotency keys.

## How to talk about it

"I name the anomaly first: lost update, dirty read, phantom, write skew. For money and seats I want a single-row atomic update or serializable, plus an idempotency key so a retry does not double-apply. For a feed I am fine with read committed. ACID consistency is constraints; CAP consistency is linearizability across replicas — different conversations."

If they ask locking vs MVCC: "MVCC lets readers skip writer locks. Writers still conflict on the same row. I pick row locks when the business rule is 'this seat is mine until I commit.'"

## Cross-links

- [Indexes are precomputed answers](./indexes.md) (id: indexes)
- [Locks buy correctness, not speed](./locks-and-concurrency.md) (id: locks-and-concurrency)
- [CAP as a conversation tool](../system-design/foundations/cap-and-consistency.md) (id: cap-and-consistency)
- [Split the keyspace on purpose](../system-design/foundations/sharding/lesson.md) (id: sharding)
- [HTTP is a conversation, TCP is the pipe](./http-and-tcp.md) (id: http-and-tcp)
