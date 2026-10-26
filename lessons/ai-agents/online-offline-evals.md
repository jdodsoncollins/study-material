---
id: online-offline-evals
title: Combine controlled tests with production evidence
slug: online-offline-evals
kind: concept
track: ai-agents
difficulty: core
estimated_minutes: 12
summary: Use controlled tests, enforced shadow execution, and bounded production exposure to answer different evaluation questions.
tags:
  - ai-agents
  - ai-agents/evals
  - ai-agents/product
  - interviews
  - interviews/ai
prerequisites:
  - how-to-run-proper-evals
related:
  - how-to-run-proper-evals
  - capability-vs-regression
  - traces-trajectories
  - pass-at-k
  - llm-as-judge-calibration
company_signal: []
sources_consulted:
  - https://www.anthropic.com/research/demystifying-evals-for-ai-agents
updated: 2026-10-26
status: canonical
---

# Combine controlled tests with production evidence

## Snapshot

- Offline evaluation gives repeatable tasks and controlled comparisons.
- Online measurement reveals actual traffic, interactions, and operational failures.
- Shadow evaluation must prevent unintended real actions through enforcement.
- A canary needs defined exposure, monitoring, and rollback criteria.

## Why it shows up in interviews

Neither a fixed benchmark nor a production dashboard captures every important behavior. Explain what each can establish and how you limit exposure while learning.

## Core idea

### ELI5

Use controlled tests to catch known failure modes before exposing users. Then measure a limited deployment to discover differences between the test distribution and real use. Feed actionable findings back into representative or targeted tests.

In shadow mode, the candidate observes permitted inputs but does not control the user-facing result. Enforce that boundary with read-only credentials, simulated tools, or blocked network capabilities. Telling the model “do not send” is not a substitute for preventing sends.

An online experiment must define assignment, success metrics, guardrails, and stop conditions. Consider repeated users and shared resources when choosing the unit of analysis. A latency improvement can coexist with worse task outcomes; measure both.

## Worked example

### Easy

Replay a set of sanitized support requests against a test database. Compare resolved tasks, unauthorized writes, latency, and cost under two configurations. This identifies controlled differences but not necessarily the effect on current traffic.

### Medium

Run a shadow candidate on an approved sample of live requests. Its tools write only to an isolated simulation. Compare its proposed actions with reviewed outcomes while minimizing retained personal data. Never let the shadow copy send a second real notification.

### Hard

Expose a small eligible cohort to the candidate under a predeclared canary plan. Stop on a confirmed critical violation; use suitable uncertainty analysis for aggregate changes. Idempotency helps replay the same operation, but does not make a wrong authorized-looking action correct.

**Practice:** a shadow agent has a production email token but a prompt forbidding sends. Identify the flaw and replace the token or execution route with an enforced read-only/simulated boundary.

## Common mistakes

- Treating offline success as proof of production safety or coverage.
- Treating every production failure as untestable distribution shift.
- Letting shadow work mutate shared state.
- Selecting a winner after repeatedly checking noisy results without an analysis plan.
- Retaining full sensitive requests when minimal evidence would suffice.

## How to talk about it

“I will use offline tests for controlled coverage, enforced shadow execution for observation, and a bounded canary for actual user outcomes. Each stage has a distinct decision and a documented stop rule.”

## Cross-links

- [Build an evaluation from the task contract](./how-to-run-proper-evals.md) (id: how-to-run-proper-evals)
- [Measure new capabilities and protect established behavior](./capability-vs-regression.md) (id: capability-vs-regression)
- [Use observable execution evidence to diagnose failures](./traces-trajectories.md) (id: traces-trajectories)
- [Success across one attempt, retries, and repeated runs](./pass-at-k/lesson.md) (id: pass-at-k)
- [Calibrate a judge on held-out decisions](./llm-as-judge-calibration.md) (id: llm-as-judge-calibration)
- [Make tool contracts enforceable](./tool-calling/lesson.md) (id: tool-calling)
