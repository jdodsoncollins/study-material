---
id: sql-with-ai
title: "Optional: explain a query an assistant rewrote"
slug: sql-with-ai
kind: strategy
track: cs
difficulty: core
estimated_minutes: 16
summary: "Optional. Fix a doubled aggregate with an assistant if the round allows it, then explain every join and every count in your own words."
tags:
  - cs
  - cs/databases
  - interviews
  - interviews/ai
prerequisites:
  - sql-for-interviews
related:
  - sql-for-interviews
  - usage-metering
  - take-home-artifacts
  - no-ai-fluency
company_signal: []
sources_consulted:
  - https://www.postgresql.org/docs/current/queries-table-expressions.html
updated: 2026-11-02
status: canonical
---

# Optional: explain a query an assistant rewrote

## Snapshot

- Optional track.
- A reported analytics prompt is: here is a broken query, use an assistant to fix it, then explain every decision it made [2nd].
- Candidate notes also mention a SQL round beside a React exercise at a publishing company [2nd]. That is one report.
- A figure sometimes repeated online, that most analytics interviews now test prompt engineering, had no source behind it. Do not use that number.
- The skill is the explanation. A green query you cannot narrate fails the round.

## Why it shows up in interviews

SQL is still a practical screen, and an assistant writes plausible joins quickly. The failure mode is a join that multiplies rows and a `COUNT` or `SUM` that believes the multiplication. If the round allows AI, the transcript should show you asking for the row multiplicity, not "fix this query." If the round does not, you still need the same explanation. Check the policy. [No-AI fluency](../ai-agents/no-ai-fluency.md) (id: no-ai-fluency) is the other mode.

## Core idea

### What to ask before you accept a rewrite

- What is the grain of the result, one row per what?
- Which join can multiply rows?
- Is the aggregate before or after that join?
- What happens to a site with no events?

Then read the rewrite and answer those four yourself. If you cannot, you do not understand it yet.

### A doubled sum, in miniature

Two sites. Ada has two bandwidth events, 10 and 30. Bo has none. A join to an alerts table that has two alerts for Ada will show Ada's bytes twice if you sum after the join.

```ts
const events = [
  { site: "ada", bytes: 10 },
  { site: "ada", bytes: 30 },
];
const alerts = [
  { site: "ada", id: 1 },
  { site: "ada", id: 2 },
];

function sumAfterJoin(): number {
  let total = 0;
  for (const event of events) {
    for (const alert of alerts) {
      if (event.site === alert.site) total += event.bytes;
    }
  }
  return total;
}

console.log(sumAfterJoin());
```

The log is 80, not 40. Each event was added once per alert. The fix is to sum events per site first, then join the alerts if you need a count of alerts as a separate column.

The SQL shape of the bug:

```sql
-- grain is wrong: alerts multiply events
SELECT e.site, SUM(e.bytes)
FROM events e
JOIN alerts a ON a.site = e.site
GROUP BY e.site;
```

The repair is a subquery or a CTE that aggregates `events` to one row per site, then joins. Say "aggregate first" out loud.

## Worked example

### A 30-minute drill

Prompt, restated from the reported shape [2nd], on the metering domain:

> Daily bandwidth by site is about 2× for sites that have alerts. Here is the query. Fix it. Explain every join.

If AI is allowed: ask it to state the grain and to point at the join that multiplies. Do not ask it to "make the numbers look right" by adding `DISTINCT` on the sum. `DISTINCT` inside `SUM` hides the grain bug and drops legitimate duplicate byte values that were actually two events.

Then explain, in order: the CTE grain, why the join moved, what a site with no events returns, and what you rejected (`SUM(DISTINCT bytes)`).

### Rubric

| Signal | Points |
| --- | --- |
| You named the grain before editing | 0–3 |
| You found the multiplying join | 0–3 |
| The fix aggregates before the join | 0–2 |
| You rejected a distinct-sum that hides the bug | 0–2 |
| A site with no rows is mentioned | 0–1 |

If the round records the chat, this explanation is the transcript. Keep it short. See [take-home artifacts](../ai-agents/take-home-artifacts.md) (id: take-home-artifacts).

## Common mistakes

- `SUM(DISTINCT …)` to force the total you expected.
- Explaining the assistant's prose instead of the join order.
- Forgetting the site with zero events. A plain join drops it. A left join keeps it, and then `COUNT(*)` counts the placeholder row. That second trap is why you name the aggregate.
- Quoting an unsourced "percent of interviews" statistic.
- Using the assistant on a round that forbade it because the prompt mentioned SQL.

## How to talk about it

"The grain I want is one row per site per day. This join to alerts runs before the sum, so Ada's 10 and 30 are each added twice, and the total is 80 instead of 40. I'll aggregate events first, then attach the alert count. I won't use SUM DISTINCT, because two real 10-byte events would collapse. Bo, with no events, should still appear if the question is 'all sites.'"

## Cross-links

- [Joins, groups, and windows on two small tables](./sql-for-interviews.md) (id: sql-for-interviews)
- [Bill bandwidth from events without double-counting](../system-design/cases/usage-metering.md) (id: usage-metering)
- [Leave a transcript you would let a hiring manager read](../ai-agents/take-home-artifacts.md) (id: take-home-artifacts)
- [Keep a no-AI baseline under a timer](../ai-agents/no-ai-fluency.md) (id: no-ai-fluency)
