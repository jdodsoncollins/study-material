---
id: interview-ai-round
title: Practice AI-assisted coding and evaluation discussions
slug: interview-ai-round
kind: strategy
track: ai-agents
difficulty: core
estimated_minutes: 16
summary: Practice reviewing AI-assisted work, designing authorized tool workflows, and explaining evaluation evidence.
tags:
  - ai-agents
  - ai-agents/evals
  - interviews
  - interviews/ai
prerequisites:
  - eval-harness-vs-agent-harness
related:
  - how-to-run-proper-evals
  - eval-harness-vs-agent-harness
  - agent-mistakes
  - capability-vs-regression
  - coding-agent-evals
company_signal: []
sources_consulted:
  - https://www.swebench.com/SWE-bench/
updated: 2026-10-26
status: canonical
---

# Practice AI-assisted coding and evaluation discussions

## Snapshot

- Clarify what tools and assistance the exercise permits.
- Explain the task contract, proposed workflow, and evidence of completion.
- Review generated work as code you are responsible for understanding.
- Use precise evaluation terms only when they help explain a measurement.

## Why it shows up in interviews

AI-related exercises can ask about implementation, system behavior, or evaluation. The formats below are practice scenarios, not claims about any company’s current interview process.

## Core idea

### ELI5

Practice making decisions while an AI system contributes uncertain work. You should be able to explain what it produced, identify what remains unverified, and choose the next useful check.

For coding, keep the requested change and important invariants visible. For system design, identify tools, permissions, state, retries, and stopping conditions. For evaluation, define tasks, outcomes, graders, and the sample that supports the conclusion.

## Worked example

### Easy

A practice exercise permits an assistant to draft a parser fix. Before accepting it, state the input contract, inspect the change, and test a valid input, a malformed input, and a prior behavior that must remain supported. Explain why those checks matter.

### Medium

Design a support assistant that can read orders and prepare draft replies. Separate read permissions from send authority, identify how user approval is represented if sending requires it, and show what happens after an uncertain tool response.

### Hard

A proposed release improves pass@1 on a small task set but worsens one authorization scenario. Explain the sample's limits, the critical constraint, and the next evidence needed. Do not convert a benchmark percentage directly into a service-level reliability promise.

**Practice:** give a three-minute review of a deliberately flawed generated solution. Name one correct part, one unsupported assumption, one concrete defect, and a check that would reveal it. Then implement the smallest justified repair.

## Common mistakes

- Describing all interviews as following one current format without evidence.
- Using evaluation vocabulary without defining the task and denominator.
- Accepting a plausible explanation without checking the artifact.
- Spending the exercise polishing a prompt while ignoring the observed failure.
- Hiding uncertainty instead of naming the next useful verification step.

## How to talk about it

“The assistant produced a candidate solution. I will verify the requested behavior and preserved constraints, explain the result, and state any remaining uncertainty. For evaluation questions, I will define the measurement before quoting a score.”

## Cross-links

- [Build an evaluation from the task contract](./how-to-run-proper-evals.md) (id: how-to-run-proper-evals)
- [Separate the system doing the work from the system measuring it](./eval-harness-vs-agent-harness/lesson.md) (id: eval-harness-vs-agent-harness)
- [Diagnose agent failures before changing the prompt](./agent-mistakes.md) (id: agent-mistakes)
- [Measure new capabilities and protect established behavior](./capability-vs-regression.md) (id: capability-vs-regression)
- [Evaluate patches against behavior and preserved contracts](./coding-agent-evals.md) (id: coding-agent-evals)
- [Forty-five minutes is a navigation problem](../system-design/foundations/interview-framework.md) (id: interview-framework)
- [Schedule occurrences and recover leased work](../system-design/cases/job-scheduler/lesson.md) (id: job-scheduler)
- [Success across one attempt, retries, and repeated runs](./pass-at-k/lesson.md) (id: pass-at-k)
