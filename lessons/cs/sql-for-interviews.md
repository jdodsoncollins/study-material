---
id: sql-for-interviews
title: Joins, groups, and windows on two small tables
slug: sql-for-interviews
kind: concept
track: cs
difficulty: core
estimated_minutes: 18
summary: Read a SQL query in its logical order, choose the right join, filter groups with HAVING, and use window functions for top-N-per-group and running totals.
tags:
  - cs
  - cs/databases
  - interviews
  - interviews/leetcode
prerequisites:
  - indexes
related:
  - indexes
  - transactions-isolation
  - choosing-a-datastore
  - hash-maps
company_signal: []
sources_consulted:
  - https://www.postgresql.org/docs/current/queries-table-expressions.html
  - https://www.postgresql.org/docs/current/tutorial-window.html
  - https://www.postgresql.org/docs/current/sql-select.html
updated: 2026-10-28
status: canonical
---

# Joins, groups, and windows on two small tables

## Snapshot

- Read a query in its logical order: `FROM`/`JOIN` → `WHERE` → `GROUP BY` → `HAVING` → window functions → `SELECT` → `ORDER BY` → `LIMIT`. Most confusing errors come from forgetting this order.
- `INNER JOIN` keeps matching pairs only. `LEFT JOIN` keeps every left row and fills missing right columns with `NULL`.
- `WHERE` filters rows before grouping; `HAVING` filters groups after aggregation.
- Window functions (`ROW_NUMBER`, `RANK`, `SUM(...) OVER`) compute across related rows without collapsing them, which solves top-N-per-group and running totals.
- `NULL` is "unknown": `NULL = NULL` is not true, `COUNT(col)` skips nulls, and `NOT IN` with a null in the list matches nothing.

## Why it shows up in interviews

Data-heavy roles and many backend loops include a short SQL exercise: "users who never ordered," "customers with at least two orders," "each user's biggest order." The questions test whether you know which rows survive each clause. Interviewers also listen for whether you notice the `LEFT JOIN` plus `COUNT(*)` trap and whether you can explain a window function instead of writing a correlated subquery for everything.

## Core idea

### ELI5

Glue the tables together first, throw away rows you do not want, sort the rest into piles, throw away piles you do not want, then compute anything that looks across a pile without merging it, and finally choose which columns to show and in what order.

Everything below uses these two tables.

**users**

| id | name | city |
| --- | --- | --- |
| 1 | Ana | Lisbon |
| 2 | Ben | Oslo |
| 3 | Chi | Lisbon |
| 4 | Dev | Pune |

**orders**

| id | user_id | total | placed_on |
| --- | --- | --- | --- |
| 101 | 1 | 40 | 2026-10-01 |
| 102 | 1 | 25 | 2026-10-03 |
| 103 | 2 | 60 | 2026-10-03 |
| 104 | 3 | 15 | 2026-10-04 |
| 105 | 1 | 70 | 2026-10-05 |
| 106 | 3 | 30 | 2026-10-06 |

### Joins

| Join | Rows kept | Dev (no orders) |
| --- | --- | --- |
| `INNER JOIN` | Pairs where `o.user_id = u.id` | Dropped |
| `LEFT JOIN` | Every user; order columns `NULL` when no match | One row, order columns `NULL` |
| `LEFT JOIN … WHERE o.id IS NULL` | Users with no match (anti-join) | Only Dev |
| `CROSS JOIN` | Every user × every order (24 rows) | Six rows |

A condition on the right table placed in `WHERE` turns a `LEFT JOIN` back into an inner join, because the `NULL` rows fail it. Put such conditions in the `ON` clause if you want to keep unmatched left rows.

### Grouping

`GROUP BY` makes one output row per group. Every selected column must be grouped or aggregated. `HAVING` can refer to aggregates; `WHERE` cannot.

### Window functions

`f(...) OVER (PARTITION BY a ORDER BY b)` computes `f` for each row using the rows in its partition, in that order. The row count stays the same. Window results cannot be used in `WHERE` of the same query because they are computed later; wrap the query in a subquery or CTE and filter outside.

| Function | Ties on the order key |
| --- | --- |
| `ROW_NUMBER()` | 1, 2, 3, 4: ties broken arbitrarily unless you add a tiebreaker |
| `RANK()` | 1, 2, 2, 4: gaps after ties |
| `DENSE_RANK()` | 1, 2, 2, 3: no gaps |

## Worked example

### Easy

Users who never ordered:

```sql
SELECT u.name
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE o.id IS NULL;
```

Result: `Dev`. `NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id)` gives the same answer and is safe with nulls. `WHERE u.id NOT IN (SELECT user_id FROM orders)` returns nothing if any `user_id` is `NULL`.

### Medium

Users with at least two orders, with their order count and spend:

```sql
SELECT u.name, COUNT(o.id) AS orders, SUM(o.total) AS spent
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id, u.name
HAVING COUNT(o.id) >= 2
ORDER BY u.name;
```

| name | orders | spent |
| --- | --- | --- |
| Ana | 3 | 135 |
| Chi | 2 | 45 |

`COUNT(*)` would count Dev's single null-filled row as 1. That does not change this result, but with `HAVING COUNT(*) >= 1` Dev would wrongly appear. The sketch below runs this query over arrays, clause by clause.

```ts
type User = { id: number; name: string };
type Order = { id: number; user_id: number; total: number };

function ordersPerUser(users: User[], orders: Order[], minOrders: number) {
  // FROM users LEFT JOIN orders
  const joined = users.flatMap((u) => {
    const mine = orders.filter((o) => o.user_id === u.id);
    return mine.length ? mine.map((o) => ({ u, o })) : [{ u, o: null as Order | null }];
  });
  // GROUP BY u.id
  const groups = new Map<number, { name: string; count: number; spent: number }>();
  for (const { u, o } of joined) {
    const g = groups.get(u.id) ?? { name: u.name, count: 0, spent: 0 };
    if (o) { g.count += 1; g.spent += o.total; } // COUNT(o.id) skips nulls
    groups.set(u.id, g);
  }
  // HAVING, then ORDER BY name
  return [...groups.values()].filter((g) => g.count >= minOrders).sort((a, b) => a.name.localeCompare(b.name));
}

const users: User[] = [{ id: 1, name: "Ana" }, { id: 2, name: "Ben" }, { id: 3, name: "Chi" }, { id: 4, name: "Dev" }];
const orders: Order[] = [
  { id: 101, user_id: 1, total: 40 }, { id: 102, user_id: 1, total: 25 }, { id: 103, user_id: 2, total: 60 },
  { id: 104, user_id: 3, total: 15 }, { id: 105, user_id: 1, total: 70 }, { id: 106, user_id: 3, total: 30 },
];
console.log(ordersPerUser(users, orders, 2)); // Ana 3 135, Chi 2 45
console.log(ordersPerUser(users, [], 1));     // []
```

### Hard

Each user's largest order, and each user's running spend by date:

```sql
WITH ranked AS (
  SELECT o.*,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY total DESC, id) AS rn,
         SUM(total)   OVER (PARTITION BY user_id ORDER BY placed_on, id) AS running
  FROM orders o
)
SELECT user_id, id, total, running FROM ranked WHERE rn = 1;
```

`rn = 1` picks order 105 (70) for user 1, 103 (60) for user 2, and 106 (30) for user 3. The `running` column on those rows is 135, 60, and 45: for Ana, the running sum by date is 40, 65, 135, and order 105 is her latest. If two orders tie on `total` and you want both, use `RANK()` instead of `ROW_NUMBER()`. The `id` in each `ORDER BY` makes the result deterministic.

## Common mistakes

| Trap | What happens | Fix |
| --- | --- | --- |
| `COUNT(*)` after a `LEFT JOIN` | Users with no rows count as 1 | `COUNT(right.id)` |
| Right-table filter in `WHERE` | `LEFT JOIN` silently becomes inner | Move the condition into `ON` |
| `NOT IN` with a nullable column | Zero rows returned | `NOT EXISTS` or filter nulls |
| Aggregate in `WHERE` | Error, or the wrong idea of what's filtered | Use `HAVING` |
| Filtering on a window result in the same query | Error: computed after `WHERE` | Wrap in a CTE or subquery |
| `ROW_NUMBER` with no tiebreaker | Different rows on different runs | Add a unique column to `ORDER BY` |
| Joining before aggregating two child tables | Row multiplication inflates sums | Aggregate each child first, then join |

## How to talk about it

"I'll start from users and `LEFT JOIN` orders so users with no orders survive, group by user, and count `o.id` rather than star so they count as zero. The two-order threshold is on an aggregate, so it goes in `HAVING`. For the largest order per user I'll use `ROW_NUMBER` partitioned by user, ordered by total with id as a tiebreaker, in a CTE, and filter `rn = 1` outside. An index on `orders(user_id)` serves the join."

## Cross-links

- [Indexes are precomputed answers](./indexes.md) (id: indexes)
- [Isolation defines what concurrent transactions can observe](./transactions-isolation.md) (id: transactions-isolation)
- [Pick a store by its access pattern](../system-design/foundations/choosing-a-datastore.md) (id: choosing-a-datastore)
- [Hash maps as an index](../algorithms/patterns/hash-maps.md) (id: hash-maps)
