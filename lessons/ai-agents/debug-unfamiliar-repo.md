---
id: debug-unfamiliar-repo
title: Find the bug in a repo you have never seen
slug: debug-unfamiliar-repo
kind: strategy
track: ai-agents
difficulty: core
estimated_minutes: 16
summary: In an open-codebase round, map the repo, reproduce the bug as a failing test, trace it with search before trusting any suggestion, make the smallest fix, and rerun everything before extending the feature.
tags:
  - ai-agents
  - ai-agents/failure-modes
  - interviews
  - interviews/ai
prerequisites:
  - ai-pairing-interview
related:
  - ai-pairing-interview
  - interview-ai-round
  - coding-agent-evals
  - agent-mistakes
company_signal:
  - name: Meta
    evidence: https://interviewing.io/blog/how-to-use-ai-in-meta-s-ai-assisted-coding-interview-with-real-prompts-and-examples
    year: 2026
    confidence: low
sources_consulted:
  - https://interviewing.io/blog/how-to-use-ai-in-meta-s-ai-assisted-coding-interview-with-real-prompts-and-examples
  - https://cadence.withremote.ai/blog/ai-technical-interviews
updated: 2026-10-28
status: canonical
---

# Find the bug in a repo you have never seen

## Snapshot

- The round: a small multi-file project, a reported bug, often a feature to add afterward. Sometimes an assistant is allowed. Usually about an hour.
- What is scored is the path: how you narrowed it down, whether you proved the bug before fixing, and whether you reran the tests after.
- Order: map → reproduce → hypothesize → trace → smallest fix → full test run → then the feature.
- A failing test that reproduces the report is worth more than any guess. Write it before touching the code.
- An assistant is good at "summarize this file" and "where is X called". It is weak at "what is the bug". Verify every claim against the code.

## Why it shows up in interviews

Most engineering time is spent reading and changing code someone else wrote. Algorithm drills do not show that. An open-codebase round does, and it also shows how a candidate behaves when an assistant is confidently wrong. Prep sites describe this format for some AI-allowed rounds, mixing a debug step with a small feature in other files. The format is new and varies; ask what tools are allowed and whether you can run the tests.

## Core idea

### ELI5

You are a new hire handed a bug ticket on day one. You do not read every file. You find the front door, find the room the ticket mentions, make the problem happen on purpose, and only then start moving furniture.

1. **Map (5 minutes).** README, the entry point, the test command, the folder names. Run the tests once and note which already fail.
2. **Restate the report** as input → expected → actual. Ask the interviewer for a concrete example if the ticket is vague.
3. **Reproduce** with the smallest failing test you can write. Confirm it fails for the reported reason.
4. **Hypothesize** two or three candidate causes out loud. Rank them.
5. **Trace** with search: find the function, its callers, and where the data is shaped. Read, do not skim.
6. **Fix small.** One change that makes the new test pass. No drive-by refactors.
7. **Rerun everything.** The new test, the old tests, and the ones that already failed (did they change?).
8. **Then extend.** Only after the bug is closed, start the feature with its own test.

### Where an assistant helps and where it does not

| Ask it | Do not ask it |
| --- | --- |
| "Summarize what `feed.ts` exports and who imports it" | "Find the bug" with no reproduction |
| "List every caller of `nextPage`" (then check with search) | "Rewrite this module" |
| "Write a test for this input and expected output" | "Make the tests pass" |
| "Draft boilerplate for this endpoint following `users.ts`" | Changes across many files at once |

## Worked example

A social app's feed API pages posts by cursor. The ticket: "Scrolling the feed skips a post between pages."

### Easy

Map: `server.ts` (routes), `feed.ts` (paging), `store.ts` (posts sorted newest first). Tests in `feed.test.ts` pass. Restate: posts with ids 9 down to 1, page size 3. Page one is `9, 8, 7`, cursor `7`. Page two should be `6, 5, 4`. Reproduce with a check:

```ts
const posts = [9, 8, 7, 6, 5, 4, 3, 2, 1]; // newest first

function nextPageBuggy(cursor: number | null, size: number): number[] {
  const start = cursor === null ? 0 : posts.indexOf(cursor) + 1;
  return posts.slice(start + 1, start + 1 + size);
}
function nextPage(cursor: number | null, size: number): number[] {
  const start = cursor === null ? 0 : posts.indexOf(cursor) + 1;
  return posts.slice(start, start + size);
}

console.log(nextPageBuggy(7, 3), "should be [6, 5, 4]"); // [ 5, 4, 3 ]
console.log(nextPage(null, 3), nextPage(7, 3), nextPage(1, 3)); // [ 9, 8, 7 ] [ 6, 5, 4 ] []
```

The test fails for the reported reason: post 6 is skipped. The existing tests only covered page one, which is why they passed.

### Medium

The assistant, asked to explain the bug, says "`indexOf` is O(n); switch to a map." That is true and irrelevant. Say so: "That is a performance note, not this bug. The skip comes from adding one twice: once in `start`, once in `slice`." Fix only that. Rerun all tests, including the new page-two and empty-last-page cases.

### Hard

Follow-up: "Posts can be deleted between requests. What if the cursor post is gone?" `indexOf` returns −1, so `start` becomes 0 and the user sees page one again. That is a design question, not a one-line fix. Say the tradeoff: cursor by id plus timestamp (`created < cursor.created`) survives deletes; index-based cursors do not. Write the test for the deleted-cursor case first, then change the query to "posts older than the cursor's timestamp". This is the [pagination](../system-design/foundations/api-design-pagination.md) (id: api-design-pagination) lesson showing up inside a coding round.

**Practice:** take any small open-source project you have not used, pick a closed bug from its tracker, check out the commit before the fix, and give yourself 40 minutes to reproduce it as a failing test. Compare your fix with the real one.

## Common mistakes

| Habit | What the interviewer sees | Fix |
| --- | --- | --- |
| Reading every file top to bottom | No plan; time gone | Entry point, then the path the ticket touches |
| Fixing before reproducing | Cannot prove the fix | Failing test first |
| Accepting the assistant's diagnosis | No judgment | Check the claim against the code and the test |
| Big refactor alongside the fix | Risk with no evidence | Smallest change; note the refactor for later |
| Running only the new test | Possible regression | Full suite, every time |
| Starting the feature with the bug open | Two moving parts | Close the bug, then extend |

## How to talk about it

"First I'll find the entry point and run the tests so I know the baseline. Then I'll turn the report into a failing test. I'll name two or three likely causes and trace the one I think is most likely. When I fix it, I'll keep the change small and rerun everything. I'll use the assistant to summarize files and find callers, and I'll check what it says against the code."

## Cross-links

- [Drive the assistant in a live coding round](./ai-pairing-interview.md) (id: ai-pairing-interview)
- [Practice AI-assisted coding and evaluation discussions](./interview-ai-round.md) (id: interview-ai-round)
- [Evaluate patches against behavior and preserved contracts](./coding-agent-evals.md) (id: coding-agent-evals)
- [Diagnose agent failures before changing the prompt](./agent-mistakes.md) (id: agent-mistakes)
- [Cursor pagination and API shape](../system-design/foundations/api-design-pagination.md) (id: api-design-pagination)
