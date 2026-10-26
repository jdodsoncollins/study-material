---
id: outcome-vs-transcript
title: Grade the result and the constraints that matter
slug: outcome-vs-transcript
kind: concept
track: ai-agents
difficulty: core
estimated_minutes: 12
summary: Grade observable outcomes and required constraints rather than trusting the agent’s report or one preferred tool sequence.
tags:
  - ai-agents
  - ai-agents/evals
  - interviews
  - interviews/ai
prerequisites:
  - eval-harness-vs-agent-harness
related:
  - graders
  - traces-trajectories
  - how-to-run-proper-evals
  - eval-harness-vs-agent-harness
  - tool-calling
company_signal: []
sources_consulted:
  - https://www.anthropic.com/research/demystifying-evals-for-ai-agents
updated: 2026-10-26
status: canonical
---

# Grade the result and the constraints that matter

## Snapshot

- A fluent report is not evidence that an external action succeeded.
- Check final state, artifacts, and observed effects against the task contract.
- Path constraints matter when authorization, cost, privacy, or required procedure makes them part of success.
- Allow valid alternative solutions unless the task requires a particular method.

## Why it shows up in interviews

Agents can describe a correct result while leaving files, records, or external systems unchanged. Conversely, different tool sequences can produce equally valid results.

## Core idea

### ELI5

Start with what must be true after the task. Then add limits on how the system may get there. Grade both from trustworthy evidence rather than from the agent's description of itself.

[Compare claims with evidence](viz/grade.md)

If the task is “prepare a patch,” inspect the patch and its behavior. If it is “merge this approved pull request,” tests alone are insufficient: inspect the repository's merge state too. The required outcome determines the evidence.

A final state comparison can miss transient or external effects. Restoring a deleted file does not erase an unauthorized email sent during the run. Record and grade effects that the contract prohibits even if the final local state looks correct.

## Worked example

### Easy

A support agent says it updated a customer's address. The grader reads the authorized customer's actual address record and verifies the requested fields. It also checks that other customers were unchanged.

### Medium

Two agents use different valid lookup sequences and produce the same authorized update. Do not fail one for deviating from a preferred trace unless that sequence was a real constraint. Latency and cost can be separate measurements.

### Hard

The address is correct, but the agent exported the customer list to an unapproved endpoint. Outcome correctness passes; the privacy constraint fails. The overall task fails under a contract that requires both.

**Practice:** write three assertions for “create one draft invoice, do not send it.” Check its fields, count matching drafts, and verify no send event occurred. A message saying “draft created” satisfies none of those assertions by itself.

## Common mistakes

| Mistake | What it misses | Better evidence |
| --- | --- | --- |
| Grade the final sentence | Actions may not have happened | Stored state and artifacts |
| Require one exact tool trace | Valid alternative paths | Outcome plus necessary constraints |
| Check only the final database | External or temporary side effects | Relevant event evidence |
| Assume a test pass proves a merge | Repository state is separate | PR/commit state and tests |

## How to talk about it

“I will define success as observable state plus required constraints. The transcript helps explain a failure, but the agent cannot certify its own outcome.”

## Cross-links

- [Choose a grader for the evidence available](../graders/lesson.md) (id: graders)
- [Use observable execution evidence to diagnose failures](../traces-trajectories.md) (id: traces-trajectories)
- [Build an evaluation from the task contract](../how-to-run-proper-evals.md) (id: how-to-run-proper-evals)
- [Separate the system doing the work from the system measuring it](../eval-harness-vs-agent-harness/lesson.md) (id: eval-harness-vs-agent-harness)
- [Make tool contracts enforceable](../tool-calling/lesson.md) (id: tool-calling)
