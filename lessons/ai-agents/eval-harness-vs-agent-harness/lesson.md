---
id: eval-harness-vs-agent-harness
title: Separate the system doing the work from the system measuring it
slug: eval-harness-vs-agent-harness
kind: concept
track: ai-agents
difficulty: core
estimated_minutes: 14
summary: Separate the configured system performing a task from the fixtures, evidence, and graders measuring it.
tags:
  - ai-agents
  - ai-agents/harnesses
  - ai-agents/evals
  - interviews
  - interviews/ai
prerequisites: []
related:
  - how-to-run-proper-evals
  - graders
  - vendor-vs-user-harness
  - coding-agent-evals
  - outcome-vs-transcript
company_signal: []
sources_consulted:
  - https://www.anthropic.com/research/demystifying-evals-for-ai-agents
updated: 2026-10-26
status: canonical
---

# Separate the system doing the work from the system measuring it

## Snapshot

- The agent harness runs the model, tools, state, and stopping policy.
- The evaluation harness prepares tasks, runs trials, collects evidence, and grades results.
- A score describes a configured system on a specified task distribution.
- Keep the evaluator's trusted evidence and rules outside the agent's control.

## Why it shows up in interviews

A comparison is difficult to interpret if a model change also changes tools, prompts, permissions, or time budgets. Naming the two harnesses makes those variables visible.

## Core idea

### ELI5

One system lets the agent do a job. Another sets up a fair test of that job and checks what happened. They interact, but they have different authority.

[Follow the evaluation loop](viz/loop.md)

The agent harness might load repository instructions, expose file tools, call a model repeatedly, and stop at a cost limit. The evaluation harness might reset a repository fixture, request a bug fix, run independent tests, inspect the diff, and record cost and latency.

A task is the scenario and success contract. A trial is one execution under a particular configuration. A grader converts evidence into a score or finding. Version all three so a later comparison has a reproducible meaning. This vocabulary is useful, but implementations may use different names.

## Worked example

### Easy

A coding agent is asked to fix pagination. The agent harness gives it a checkout and a shell. The evaluation harness supplies a known starting commit and later tests that page boundaries neither duplicate nor omit records.

### Medium

The new model performs better, but it also receives twice the token budget. The result is a valid comparison of two configurations, not an isolated estimate of the model change. Run a controlled comparison if the model effect is the question.

### Hard

The agent edits a test file to make its own checks pass. Keep trusted evaluation tests outside the writable task environment, then test the submitted artifact in a fresh environment. Legitimate task-directed changes to project tests can still be reviewed; they do not replace independent evidence.

**Practice:** classify repository reset, tool authorization, output grading, and stopping after a token budget. Reset and grading belong to evaluation; authorization and stopping belong to execution, with evaluation recording their configuration.

## Common mistakes

| Mistake | Consequence | Better practice |
| --- | --- | --- |
| Compare model names only | Tool and budget changes are hidden | Record the full configuration |
| Grade the agent's own success claim | Incorrect reports can pass | Inspect tests or external state |
| Reuse a dirty environment | Trials influence one another | Reset or explicitly model continuation |
| Keep only a score | Failures cannot be diagnosed | Retain bounded, appropriately protected evidence |

## How to talk about it

“I will freeze the task fixtures and grading rules, record the agent configuration, and compare both success and resource use. A changed tool policy is a changed system, even if the model name stays the same.”

## Cross-links

- [Build an evaluation from the task contract](../how-to-run-proper-evals.md) (id: how-to-run-proper-evals)
- [Choose a grader for the evidence available](../graders/lesson.md) (id: graders)
- [Grade the result and the constraints that matter](../outcome-vs-transcript/lesson.md) (id: outcome-vs-transcript)
- [Evaluate the configuration you actually deploy](../vendor-vs-user-harness.md) (id: vendor-vs-user-harness)
- [Evaluate patches against behavior and preserved contracts](../coding-agent-evals.md) (id: coding-agent-evals)
- [Success across one attempt, retries, and repeated runs](../pass-at-k/lesson.md) (id: pass-at-k)
