---
id: how-to-run-proper-evals
title: Build an evaluation from the task contract
slug: how-to-run-proper-evals
kind: strategy
track: ai-agents
difficulty: core
estimated_minutes: 16
summary: Build representative and targeted tasks from an observable success contract, then compare configurations with protected evaluation cases.
tags:
  - ai-agents
  - ai-agents/evals
  - interviews
  - interviews/ai
prerequisites:
  - eval-harness-vs-agent-harness
related:
  - eval-harness-vs-agent-harness
  - graders
  - outcome-vs-transcript
  - capability-vs-regression
  - coding-agent-evals
  - interview-ai-round
company_signal: []
sources_consulted:
  - https://www.anthropic.com/research/demystifying-evals-for-ai-agents
updated: 2026-10-26
status: canonical
---

# Build an evaluation from the task contract

## Snapshot

- Define observable success before collecting a score.
- Include ordinary work, difficult cases, and consequential failure scenarios.
- Keep development examples separate from a protected final evaluation set.
- Inspect failures and improve the task, grader, or system based on evidence.

## Why it shows up in interviews

A useful evaluation explains which decision its results can support. A small convenience sample can guide debugging without establishing broad production reliability.

## Core idea

### ELI5

Start with a job people need done. Write down the initial state, allowed actions, required result, and constraints. Then create repeatable examples that expose whether the system can do that job.

1. Define the task population and the release question.
2. Build fixtures from representative work, incidents, edge cases, and purposeful synthetic variations.
3. Establish expected outcomes or a reviewable rubric, including when abstention is correct.
4. Run baseline trials with recorded configuration and budgets.
5. Inspect failures by category and verify that graders detect them correctly.
6. Make one interpretable change, compare, and use protected cases for the final decision.

A starting set of twenty to fifty carefully reviewed tasks may be manageable for development. That is a workflow suggestion, not a statistically sufficient sample size for rare failures or a universal target.

## Worked example

### Easy

Evaluate an agent that edits an address. A fixture contains an authorized customer and an unrelated customer. The expected result changes only the requested fields on the authorized record. A read-only request expects no mutation.

### Medium

Add ambiguous customer names, missing permission, duplicate submission, and a timeout after an update. Some tasks should end by asking for clarification or reporting uncertainty. A dataset containing only successful happy paths cannot measure those behaviors.

### Hard

Production incidents dominate the available examples. Keep them as a targeted stress suite, but do not present their raw pass rate as ordinary traffic performance. Build a representative sample or declare explicit weights, and report stress results separately.

**Practice:** draft three cases before changing a prompt: a normal case, an ambiguity case, and a prohibited-action case. For each, name the evidence that distinguishes a true pass from a convincing explanation.

## Common mistakes

- Repeatedly editing the final holdout after seeing results.
- Treating incident-only data as representative traffic.
- Adding synthetic examples without checking realism or expected behavior.
- Removing difficult cases merely to make the score stable.
- Reporting a rate without sample size, task definition, or configuration.
- Counting infrastructure failures as model failures without recording their cause; product-impacting failures still matter end to end.

## How to talk about it

“I will begin with a small reviewed development set, then expand coverage and uncertainty analysis for the release decision. We will retain a protected evaluation set and report important failure categories separately from the mean.”

## Cross-links

- [Separate the system doing the work from the system measuring it](./eval-harness-vs-agent-harness/lesson.md) (id: eval-harness-vs-agent-harness)
- [Choose a grader for the evidence available](./graders/lesson.md) (id: graders)
- [Grade the result and the constraints that matter](./outcome-vs-transcript/lesson.md) (id: outcome-vs-transcript)
- [Measure new capabilities and protect established behavior](./capability-vs-regression.md) (id: capability-vs-regression)
- [Evaluate patches against behavior and preserved contracts](./coding-agent-evals.md) (id: coding-agent-evals)
- [Practice AI-assisted coding and evaluation discussions](./interview-ai-round.md) (id: interview-ai-round)
