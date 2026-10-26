---
id: traces-trajectories
title: Use observable execution evidence to diagnose failures
slug: traces-trajectories
kind: concept
track: ai-agents
difficulty: core
estimated_minutes: 12
summary: Link observable actions, spans, trials, and outcomes so failures can be diagnosed without unnecessary sensitive logging.
tags:
  - ai-agents
  - ai-agents/evals
  - ai-agents/harnesses
  - interviews
  - interviews/ai
prerequisites:
  - eval-harness-vs-agent-harness
related:
  - outcome-vs-transcript
  - online-offline-evals
  - eval-harness-vs-agent-harness
  - how-to-run-proper-evals
  - llm-as-judge-calibration
company_signal: []
sources_consulted:
  - https://opentelemetry.io/docs/concepts/signals/traces/
updated: 2026-10-26
status: canonical
---

# Use observable execution evidence to diagnose failures

## Snapshot

- A trace links operations; spans describe bounded pieces of work.
- A trajectory records the observable sequence of an agent's interactions and actions.
- A trial can contain several turns and traces; a trace is not inherently one chat turn.
- Logs help diagnose and reproduce conditions without guaranteeing identical stochastic output.

## Why it shows up in interviews

A final failure score tells you that something went wrong. Structured evidence helps distinguish retrieval, planning, tool, environment, and grading failures.

## Core idea

### ELI5

Give the task and trial stable IDs. Link model calls, tool calls, retries, and external results to the work they belong to. Record enough evidence to explain the result without collecting unnecessary sensitive content.

Spans have timing, status, and parent/child relationships; links can connect work across otherwise separate trace structures, such as an asynchronous queue. A chat session may cover several requests and traces. An evaluation trial may intentionally include multiple turns; reset between independent trials or explicitly model the continuation.

A trajectory should capture observable messages, tool arguments/results, and relevant state changes. It need not expose or require hidden model reasoning. Store model and prompt versions, environment identifiers, budgets, and grader versions alongside the evidence. Redact secrets and minimize personal data, with appropriate access and retention controls.

## Worked example

### Easy

A lookup returns no customer. The evidence should distinguish “no matching record” from “tool timed out” and “permission denied.” Those outcomes require different agent behavior.

### Medium

A worker retries a timed-out write. Link both attempts to the same logical operation ID and record the downstream result. Otherwise a viewer may mistake a duplicate side effect for two separate user requests.

### Hard

A task passes once and fails on replay with identical visible inputs. Compare model/runtime versions, environment state, external dependencies, sampling, and timing. Matching recorded conditions improves diagnosis, but does not guarantee bit-for-bit output or identical concurrent scheduling.

**Practice:** design a minimal evidence record for a failed invoice draft: task/trial IDs, authorized tenant, fixture/version, tool outcome, resulting draft ID/state, and grader finding. Omit credentials and unrelated customer data.

## Common mistakes

| Mistake | Consequence | Repair |
| --- | --- | --- |
| Treat a trace as always one turn | Multi-turn work is fragmented | Link sessions, tasks, trials, and traces explicitly |
| Log only text | Tool failures and effects are hidden | Record structured outcomes |
| Require private reasoning text | Evidence may be unavailable or unnecessary | Use observable actions and results |
| Log every raw payload forever | Sensitive data exposure grows | Minimize, redact, restrict, and expire |

## How to talk about it

“I will retain the observable evidence needed to explain the outcome and link retries to logical operations. Reproduction means controlling recorded conditions, with stochastic and external variability stated explicitly.”

## Cross-links

- [Grade the result and the constraints that matter](./outcome-vs-transcript/lesson.md) (id: outcome-vs-transcript)
- [Combine controlled tests with production evidence](./online-offline-evals.md) (id: online-offline-evals)
- [Separate the system doing the work from the system measuring it](./eval-harness-vs-agent-harness/lesson.md) (id: eval-harness-vs-agent-harness)
- [Budget model memory and schedule streamed generation](../system-design/cases/llm-serving/lesson.md) (id: llm-serving)
- [Schedule occurrences and recover leased work](../system-design/cases/job-scheduler/lesson.md) (id: job-scheduler)
- [Build an evaluation from the task contract](./how-to-run-proper-evals.md) (id: how-to-run-proper-evals)
