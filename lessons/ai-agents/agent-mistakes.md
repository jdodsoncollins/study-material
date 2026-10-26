---
id: agent-mistakes
title: Diagnose agent failures before changing the prompt
slug: agent-mistakes
kind: strategy
track: ai-agents
difficulty: core
estimated_minutes: 16
summary: Trace failures to observable evidence, repair the responsible component, and add a focused regression case.
tags:
  - ai-agents
  - ai-agents/failure-modes
  - ai-agents/evals
  - interviews
  - interviews/ai
prerequisites:
  - eval-harness-vs-agent-harness
related:
  - tool-calling
  - coding-agent-evals
  - traces-trajectories
  - how-to-run-proper-evals
  - interview-ai-round
company_signal: []
sources_consulted:
  - https://www.anthropic.com/research/demystifying-evals-for-ai-agents
updated: 2026-10-26
status: canonical
---

# Diagnose agent failures before changing the prompt

## Snapshot

- Classify failures from observable evidence rather than guessing the cause.
- Distinguish task ambiguity, missing evidence, wrong actions, tool failures, and grading errors.
- Fix the component responsible for the observed failure.
- Add a targeted regression case without overfitting the entire system to one trace.

## Why it shows up in interviews

A prompt change may hide an environment or authorization bug. A useful debugging explanation traces the failure to evidence and tests whether the proposed repair addresses it.

## Core idea

### ELI5

Start at the incorrect outcome and work backward through the observable actions. Ask where the run first departed from the contract and what information or capability was available at that point.

A repeated read is not automatically a loop bug: polling can be legitimate if state changes and a stop policy exists. A missing test call is not automatically a failed task: it matters when verification is necessary or explicitly required. Judge the behavior against the task rather than a universal preferred trace.

## Worked example

### Easy

The agent reports a successful update, but the tool returned “permission denied.” The failure is incorrect handling/reporting of the tool result. Repair the result contract or behavior and add a case where rejection must be reported honestly.

### Medium

The agent repeatedly searches because the expected document is absent from the fixture. A longer prompt does not create the missing evidence. Correct the fixture if it is defective, or define an appropriate “insufficient information” outcome if absence is part of the task.

### Hard

A patch passes visible tests but changes behavior outside the requested area. Review the task scope and add meaningful preservation tests. Diff size is a review signal, not a correctness proof or a universal release gate.

| Observed problem | Evidence to inspect | Candidate repair |
| --- | --- | --- |
| Wrong record updated | Identity, lookup result, authorization | Stronger tool-side checks and disambiguation |
| Endless retries | Error classes, budgets, state changes | Bounded retry/stop policy |
| Correct work graded as failure | Rubric and trusted state | Repair the grader and re-evaluate |
| Confident answer without evidence | Retrieval results and claims | Evidence checks and uncertainty behavior |

**Practice:** choose one failure and write a test that would fail before the repair and pass after it. Keep the expected behavior broad enough to permit a different valid sequence of actions.

## Common mistakes

- Calling every failure a reasoning problem without inspecting the tool/environment.
- Adding a long special-case instruction for every incident.
- Treating tool-call order as mandatory when the contract allows alternatives.
- Ignoring a faulty grader because its result is easy to aggregate.
- Reporting a list of failure types as their measured prevalence.

## How to talk about it

“The first incorrect step was the update after an ambiguous lookup. I will require the tool to resolve an authorized record unambiguously, then test normal, ambiguous, and denied cases.”

## Cross-links

- [Make tool contracts enforceable](./tool-calling/lesson.md) (id: tool-calling)
- [Evaluate patches against behavior and preserved contracts](./coding-agent-evals.md) (id: coding-agent-evals)
- [Use observable execution evidence to diagnose failures](./traces-trajectories.md) (id: traces-trajectories)
- [Build an evaluation from the task contract](./how-to-run-proper-evals.md) (id: how-to-run-proper-evals)
- [Evaluate the configuration you actually deploy](./vendor-vs-user-harness.md) (id: vendor-vs-user-harness)
- [Practice AI-assisted coding and evaluation discussions](./interview-ai-round.md) (id: interview-ai-round)
