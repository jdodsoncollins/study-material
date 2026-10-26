---
id: transactions-isolation
title: Isolation defines what concurrent transactions can observe
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
  - interviews
  - interviews/system-design
prerequisites:
  - indexes
  - locks-and-concurrency
related:
  - indexes
  - locks-and-concurrency
  - cap-and-consistency
  - sharding
company_signal: []
sources_consulted:
  - https://www.postgresql.org/docs/current/transaction-iso.html
  - https://www.postgresql.org/docs/current/mvcc.html
updated: 2026-10-26
status: canonical
---

# Isolation defines what concurrent transactions can observe

## Snapshot

- Atomicity groups transactional changes into commit or rollback.
- Isolation defines which effects concurrent transactions may observe.
- Durability concerns committed changes surviving failures under the database's configured guarantees. ACID consistency concerns maintained invariants, not CAP consistency.
- Name the anomaly and the protected invariant before choosing a transaction strategy.

## Why it shows up in interviews

Two purchases can each observe the last item in stock. A transaction boundary alone does not explain what happens next: the reads, update conditions, locking, and isolation level determine whether both can succeed.

## Core idea

### ELI5

Two requests read `stock = 5`. Each sells two and writes back 3. Four items were sold, but the stored value only fell by two. This is a lost update caused by writing a value calculated from a stale read.

A single guarded statement such as `UPDATE stock SET quantity = quantity - 2 WHERE id = :id AND quantity >= 2` can combine the check and change. Inspect the affected-row count. For a rule spanning several rows, consider appropriate locks or serializable transactions and handle retries.

Optimistic concurrency is another approach: save the version read, then update only if that version is still current. Incrementing a version without comparing it does not detect a conflict.

## Comparison

The table describes SQL-standard minimum guarantees. Engines may provide stronger behavior; PostgreSQL Repeatable Read, for example, also prevents phantom reads while still allowing serialization anomalies.

| Level | Dirty reads | Nonrepeatable reads | Phantoms | Serialization anomalies |
| --- | --- | --- | --- | --- |
| Read uncommitted | Allowed | Allowed | Allowed | Allowed |
| Read committed | Prevented | Allowed | Allowed | Allowed |
| Repeatable read | Prevented | Prevented | May be allowed | Allowed |
| Serializable | Prevented | Prevented | Prevented | Prevented for committed transactions |

Snapshot isolation is not synonymous with serializable. A stable snapshot can still permit write skew when concurrent transactions change different rows after reading the same condition.

### Easy

Start with five items at version 3. Selling two against version 3 leaves three items at version 4.

```ts
type Stock = { quantity: number; version: number };
function sell(row: Stock, take: number, expectedVersion: number): boolean {
  if (!Number.isInteger(take) || take <= 0) return false;
  if (row.version !== expectedVersion || row.quantity < take) return false;
  row.quantity -= take;
  row.version++;
  return true;
}
const stock: Stock = { quantity: 5, version: 3 };
console.log(sell(stock, 2, 3), stock.quantity, stock.version); // true 3 4
console.log(sell(stock, 2, 3), stock.quantity); // false 3: stale version
console.log(sell(stock, 2, 4), stock.quantity); // true 1: fresh version
```

This synchronous example models the condition. In a database, the version check and update must be one atomic statement, not a separate SELECT followed by an unconditional UPDATE.

### Medium

A failed version check means the caller's view is stale. Reread the data, reevaluate the business rule, and retry within a bound. Do not just resubmit a previously calculated absolute quantity.

### Hard

Two on-call engineers each see the other still available, then independently mark themselves unavailable. Different rows changed, so row-version checks alone need not protect the rule “at least one engineer is available.” Protect the shared invariant with an appropriate serialization or locking strategy.

**Try it:** would wrapping an external email send in a database transaction roll back the email? No. Use a transactional outbox or another explicit handoff; rollback only covers work participating in the transaction.

## Common mistakes

- Equating serializable with literally running one transaction at a time. Concurrent execution may be allowed if committed effects match a serial order.
- Treating write skew as a phantom read. They describe different anomalies.
- Retrying only one statement after a serialization failure. Retry the whole transaction from fresh reads, including its decisions.
- Holding locks during slow external calls, or assuming a timeout means the database rolled back.

## How to talk about it

“The invariant is nonnegative stock. I can enforce this single-row rule with an atomic conditional update. For a multi-row rule I need stronger coordination. I will handle conflicts and unknown outcomes explicitly rather than assuming a transaction removes them.”

## Cross-links

- [Indexes are precomputed answers](./indexes.md) (id: indexes)
- [Locks buy correctness, not speed](./locks-and-concurrency.md) (id: locks-and-concurrency)
- [Consistency promises during failures](../system-design/foundations/cap-and-consistency.md) (id: cap-and-consistency)
- [Splitting a keyspace so one box is not the product](../system-design/foundations/sharding/lesson.md) (id: sharding)
- [HTTP is a conversation, TCP is the pipe](./http-and-tcp.md) (id: http-and-tcp)
