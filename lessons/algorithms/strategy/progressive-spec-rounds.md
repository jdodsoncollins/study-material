---
id: progressive-spec-rounds
title: Pass a leveled spec without rewriting
slug: progressive-spec-rounds
kind: strategy
track: algorithms
difficulty: core
estimated_minutes: 15
summary: Practical coding rounds that unlock one level at a time reward a small extensible design, reading every test first, and finishing levels cleanly over clever code.
tags:
  - algorithms
  - interviews
  - interviews/leetcode
prerequisites:
  - pattern-first-prep
  - hash-maps
related:
  - session-store-levels
  - pattern-first-prep
  - lru-cache
  - ai-pairing-interview
company_signal:
  - name: Anthropic
    evidence: https://www.sundeepteki.org/advice/anthropic-codesignal-assessment-guide
    year: 2026
    confidence: low
  - name: Ramp
    evidence: https://www.techprep.app/blog/ramp-interview-process
    year: 2026
    confidence: low
sources_consulted:
  - https://www.sundeepteki.org/advice/anthropic-codesignal-assessment-guide
  - https://www.techprep.app/blog/ramp-interview-process
updated: 2026-10-28
status: canonical
---

# Pass a leveled spec without rewriting

## Snapshot

- Format: one problem, three or four levels, roughly 60 to 90 minutes. Each level's tests unlock after the previous level passes, and old tests keep running.
- Typical subjects: an in-memory key-value store, a bank or wallet ledger, a file system, a task queue. The algorithms are easy; the cost is in structure and edge cases.
- Read every visible test before typing. They are the spec, including the boundaries the prose skips.
- Choose a data shape on level one that can hold later fields: one class, one map of rows, a timestamp on every call.
- Three clean levels usually beat four half-working ones. Stop polishing; move on when tests pass.

## Why it shows up in interviews

Pattern drills check whether you can recognize a known shape. Teams that ship product code also want to see whether you can build something small, keep it working while requirements change, and avoid a rewrite under time pressure. A leveled spec tests exactly that, and it is harder to answer from memory or from an assistant in one shot because each level depends on choices you made earlier.

Candidates and prep sites describe this format for online assessments and some live practical rounds. Formats change. Ask the recruiter how many levels, which language, whether tests are visible, and whether an assistant is allowed. Treat the company names in this lesson's frontmatter as low-confidence secondhand reports, not as a description of any current loop.

## Core idea

### ELI5

You are building a shed that will become a house. The first room must stand on its own, but you pour the foundation big enough for the next rooms, and you never tear down a wall that already passes inspection.

1. **Skim all levels you can see** (2 minutes). Some platforms show only the current level; then read its tests twice.
2. **Pin the boundaries** from the tests: inclusive or exclusive, sorted how, ties broken how, what a miss returns.
3. **Pick the row shape.** One map from id to a small record. Add fields later; never change the key.
4. **Thread time and ids through every method** from the start if any call has them.
5. **Write level one plainly.** No speculative abstractions, just room to grow.
6. **Run tests, commit mentally, move on.** Each new level adds fields, helpers, or methods. Earlier methods change only if a test says so.

### Time budget for a four-level, 90-minute round

| Level | Minutes | What usually arrives |
| --- | --- | --- |
| 1 | 10–15 | Create, read, delete |
| 2 | 15–20 | Filtered or sorted queries, ranking |
| 3 | 20–25 | Time: expiry, scheduling, history |
| 4 | 20–25 | Merge, undo, versioning, or a big refactor |
| Buffer | 5–10 | Re-run everything, fix one edge |

If level three is not passing by minute 60, finish it rather than starting four.

## Worked example

A shared-expense app keeps wallets in memory. Amounts are integer cents.

### Easy

Level one: `open(t, id)`, `deposit(t, id, cents)`, `transfer(t, from, to, cents)`. A transfer from an unknown wallet or with too little money returns `null`; otherwise the sender's new balance.

```ts
type Wallet = { balance: number; sent: number };

class Ledger {
  private wallets = new Map<string, Wallet>();
  open(t: number, id: string): boolean {
    if (this.wallets.has(id)) return false;
    this.wallets.set(id, { balance: 0, sent: 0 });
    return true;
  }
  deposit(t: number, id: string, cents: number): number | null {
    const w = this.wallets.get(id);
    if (!w) return null;
    w.balance += cents;
    return w.balance;
  }
  transfer(t: number, from: string, to: string, cents: number): number | null {
    const a = this.wallets.get(from), b = this.wallets.get(to);
    if (!a || !b || from === to || a.balance < cents) return null;
    a.balance -= cents;
    a.sent += cents;
    b.balance += cents;
    return a.balance;
  }
  // Level two: rank by total sent, ties by id.
  topSenders(t: number, n: number): string[] {
    return [...this.wallets.entries()]
      .sort(([ia, a], [ib, b]) => b.sent - a.sent || (ia < ib ? -1 : 1))
      .slice(0, n)
      .map(([id, w]) => `${id}(${w.sent})`);
  }
}

const l = new Ledger();
l.open(1, "mia"); l.open(2, "raj"); l.open(3, "zoe");
l.deposit(4, "mia", 4000);
console.log(l.transfer(5, "mia", "raj", 1250), l.transfer(6, "raj", "zoe", 2000)); // 2750 null
l.transfer(7, "raj", "zoe", 250);
console.log(l.topSenders(8, 2)); // [ 'mia(1250)', 'raj(250)' ]
```

The `sent` field and the unused `t` look like overhead on level one. They are what make level two a single new method.

### Medium

Level two asks for `topSenders(t, n)`. Because `sent` already lives on the row, it is a sort with a stated tie-break. Without it you would be scanning a transfer log you never kept. Say the tie-break before coding; the tests almost always include one.

### Hard

Level three: `schedule(t, from, to, cents, delay)` runs a transfer at `t + delay`, and every other call must first run any due transfers in time order. Add a pending list sorted by due time (ties by creation order) and a private `runDue(t)` that every public method calls first. Level one and two methods gain one line each. If you had skipped `t` on level one, every signature and test adapter would change now.

Level four often asks to merge two wallets. Decide out loud what happens to pending transfers that point at the merged wallet before writing code.

## Common mistakes

| Habit | Cost | Fix |
| --- | --- | --- |
| Bare functions over a global object | Level three needs shared helpers you cannot add cleanly | One class, private helpers |
| Rewriting at each level | Old tests break; minutes lost | Add fields and helpers; leave passing code alone |
| Over-engineering level one | Time gone before the hard levels | Plain code plus room in the row shape |
| Skipping the visible tests | Wrong boundary, wrong tie-break | Read them first; list the edges they test |
| Hardcoding outputs to pass tests | Reviewers or later levels catch it | Solve the general rule |
| Chasing level four with level three red | Zero credit for both | Finish the current level |

## How to talk about it

"I'll read the tests first and list the edges: boundaries, ties, misses. I'm keeping one map from id to a small record, and every method takes the timestamp now even though level one ignores it, because expiry or scheduling is likely next. Level one is plain. When the next level arrives, I'll add a field or a helper rather than rewrite."

**Practice:** take [the session store](../problems/session-store-levels.md) (id: session-store-levels) and set a 45-minute timer for its three levels. Then invent a fourth level (versioned reads, undo, or merge) and add it without changing any earlier test.

## Cross-links

- [A session store that grows one level at a time](../problems/session-store-levels.md) (id: session-store-levels)
- [Patterns first, problems second](./pattern-first-prep.md) (id: pattern-first-prep)
- [A lookup cache with least-recently-used eviction](../problems/lru-cache/lesson.md) (id: lru-cache)
- [Drive the assistant in a live coding round](../../ai-agents/ai-pairing-interview.md) (id: ai-pairing-interview)
