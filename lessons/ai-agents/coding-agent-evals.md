---
id: coding-agent-evals
title: Evaluate patches against behavior and preserved contracts
slug: coding-agent-evals
kind: concept
track: ai-agents
difficulty: core
estimated_minutes: 14
summary: Test submitted patches against the requested behavior, preserved contracts, and independent grading evidence.
tags:
  - ai-agents
  - ai-agents/evals
  - ai-agents/harnesses
  - interviews
  - interviews/ai
prerequisites:
  - how-to-run-proper-evals
related:
  - how-to-run-proper-evals
  - graders
  - capability-vs-regression
  - vendor-vs-user-harness
  - agent-mistakes
  - eval-harness-vs-agent-harness
company_signal: []
sources_consulted:
  - https://www.swebench.com/SWE-bench/
updated: 2026-10-26
status: canonical
---

# Evaluate patches against behavior and preserved contracts

## Snapshot

- Fix the base repository state and execution environment for each trial.
- Check that the requested behavior changes and unrelated behavior remains intact.
- Keep trusted grading evidence independent of the submitted patch.
- Record the result, relevant side effects, and resource limits.

## Why it shows up in interviews

A patch can pass a narrow test while deleting functionality or weakening checks. A useful coding evaluation tests the requested contract and important properties the patch must preserve.

## Core idea

### ELI5

Give the agent a reproducible repository and a task. After it finishes, apply the resulting patch to a clean base and test what the program does. Inspect the patch for prohibited or suspicious changes, but do not substitute a preferred code shape for behavior.

Fail-to-pass tests demonstrate behavior that fails on the base and should pass after the fix. Pass-to-pass tests protect behavior that already works. These test roles do not prove complete correctness; their coverage still matters.

Use trusted evaluation tests outside the agent's writable environment. The task may legitimately require editing project tests, but those edits cannot redefine the evaluator's success criteria. Separate product code, submitted tests, and trusted grading logic.

## Worked example

### Easy

A pagination bug repeats the last item of page one as the first item of page two. A regression test records the complete result sequence and verifies each expected item occurs exactly once. Checking only the first page would miss the defect.

### Medium

The patch makes the target test pass by returning an empty result. Add meaningful nonempty cases and preservation tests. A reference implementation or independently derived expected values can help catch a grader that merely mirrors the submitted code.

### Hard

An agent disables authentication to make an integration test pass. Functional output may look correct, but the authorization contract fails. Include negative tests and review consequential changes. A small diff is not necessarily correct; a large diff is not automatically wrong.

**Practice:** for a cache bug, propose one test that fails before the patch, one existing behavior to preserve, and one invalidation or authorization edge case. Explain which property each test measures.

## Common mistakes

| Mistake | Consequence | Repair |
| --- | --- | --- |
| Trust only tests the agent changed | Success criteria can be weakened | Independent evaluation tests |
| Ignore base failures | Unrelated failures are misattributed | Establish the baseline |
| Require an exact reference diff | Valid implementations fail | Behavior-based checks plus relevant review |
| Ignore timeouts | Product limits disappear from the score | Record the configured budget and failure cause |

## How to talk about it

“I will test the patch on a clean base, verify the target behavior, preserve relevant existing contracts, and inspect risky changes. Passing tests is evidence within their coverage, not a proof of every possible behavior.”

## Cross-links

- [Build an evaluation from the task contract](./how-to-run-proper-evals.md) (id: how-to-run-proper-evals)
- [Choose a grader for the evidence available](./graders/lesson.md) (id: graders)
- [Measure new capabilities and protect established behavior](./capability-vs-regression.md) (id: capability-vs-regression)
- [Evaluate the configuration you actually deploy](./vendor-vs-user-harness.md) (id: vendor-vs-user-harness)
- [Diagnose agent failures before changing the prompt](./agent-mistakes.md) (id: agent-mistakes)
- [Separate the system doing the work from the system measuring it](./eval-harness-vs-agent-harness/lesson.md) (id: eval-harness-vs-agent-harness)
