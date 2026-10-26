---
id: capability-vs-regression
title: Measure new capabilities and protect established behavior
slug: capability-vs-regression
kind: concept
track: ai-agents
difficulty: core
estimated_minutes: 12
summary: Measure new capabilities while protecting established behavior, with explicit severity and uncertainty rules.
tags:
  - ai-agents
  - ai-agents/evals
  - interviews
  - interviews/ai
prerequisites:
  - how-to-run-proper-evals
related:
  - how-to-run-proper-evals
  - pass-at-k
  - coding-agent-evals
  - online-offline-evals
  - eval-harness-vs-agent-harness
company_signal: []
sources_consulted:
  - https://www.swebench.com/SWE-bench/
updated: 2026-10-26
status: canonical
---

# Measure new capabilities and protect established behavior

## Snapshot

- Capability evaluation asks whether the system can handle a target class of work.
- Regression evaluation asks whether a change damages behavior that matters.
- A task may serve both purposes; these are evaluation goals, not mutually exclusive file types.
- Release decisions need severity, uncertainty, and explicit thresholds.

## Why it shows up in interviews

An improved average can hide a harmful loss on a small but important task category. A useful comparison shows both what improved and what became less reliable.

## Core idea

### ELI5

Keep a set of tasks that represents the work you want to enable and a set of checks that protects behavior you already depend on. Some will overlap. Label the purpose of each result instead of collapsing every score into one number.

For deterministic invariants, such as “never mutate another tenant's records,” one confirmed violation may block a release. For stochastic task success, a small observed drop may be sampling variation. Examine repeated trials, task-level differences, and an appropriate uncertainty estimate before attributing the change.

In coding benchmarks, fail-to-pass tests are tests expected to change from failing on the base version to passing after a patch. Pass-to-pass tests should remain passing. Those are roles within a patch evaluation; they are not synonyms for entire capability and regression datasets.

## Worked example

### Easy

A parser fix makes an empty-input test pass while existing valid-input tests still pass. The new case demonstrates the fix, and the existing cases protect prior behavior.

### Medium

A forty-task agent suite changes from 36 successes to 37 in one run. Each task changes the raw rate by 2.5 percentage points. That observation does not establish a 99% reliability guarantee or prove the improvement will repeat. Inspect paired outcomes and rerun where uncertainty matters.

### Hard

A change improves ordinary tasks but sends an unauthorized message in one scenario. Report that violation separately from the mean success rate. Determine whether it is reproducible and apply the predeclared release rule; a higher average does not erase it.

**Practice:** decide which evidence would block a release for an incorrect total, an extra external write, and a one-point judge-score drop. Distinguish contract violations from uncertain aggregate movement.

## Common mistakes

- Treating every score fluctuation as a regression or every improvement as suspicious.
- Expecting a stochastic regression suite to score exactly 100% in every run without evidence.
- Repeatedly tuning on the final holdout and still calling it independent.
- Claiming rare-failure reliability from a tiny suite with no failures.

## How to talk about it

“I will report capability gains by task category, preserve deterministic invariants, and define the release thresholds before inspecting the new results. Uncertain differences need more evidence; confirmed critical violations need a fix.”

## Cross-links

- [Build an evaluation from the task contract](./how-to-run-proper-evals.md) (id: how-to-run-proper-evals)
- [Success across one attempt, retries, and repeated runs](./pass-at-k/lesson.md) (id: pass-at-k)
- [Evaluate patches against behavior and preserved contracts](./coding-agent-evals.md) (id: coding-agent-evals)
- [Combine controlled tests with production evidence](./online-offline-evals.md) (id: online-offline-evals)
- [Practice AI-assisted coding and evaluation discussions](./interview-ai-round.md) (id: interview-ai-round)
