---
id: capability-vs-regression
title: Capability evals climb; regression evals guard
slug: capability-vs-regression
kind: concept
track: ai-agents
difficulty: core
estimated_minutes: 12
summary: Capability suites ask whether the agent can do new hard jobs; regression suites ask whether yesterday's jobs still pass. Averaging them hides both stories.
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
company_signal:
  - name: Anthropic
    evidence: The 2026 agent-eval essay separates capability measurement from regression gates as different products of the same harness.
    year: 2026
    confidence: high
sources_consulted:
  - Anthropic, Demystifying evals for AI agents (2026-01-09)
  - SWE-bench Verified versus repo unit-test regression practice
  - AI-platform interview writeups on "why did the agent regress" (2026)
updated: 2026-09-02
status: canonical
---

# Capability evals climb; regression evals guard

## Snapshot

- A **capability eval** is a hill you expect to climb: hard, even undersampled tasks that today's agent often fails.
- A **regression eval** is a fence: tasks that used to pass and must keep passing when you change the prompt, the model, or the tools.
- One blended "81%" will rise because you added easy tasks, or fall because you added hard ones, and you will not know which.
- Ship gates belong on the fence. Research dashboards belong on the hill.

## Why it shows up in interviews

"Why did the agent regress?" is a 2026 loop question. The strong answer names two suites with two owners. Capability can go down on purpose while you tighten a tool schema. Regression going down after a model bump is a rollback.

## Core idea

Treat the two suites as different datasets, different aggregators, different reactions.

**Capability.** Sourced from jobs you *wish* you could sell. Scores are low. You track pass@k, error clusters, and whether a new harness trick moves the frontier. A drop can mean the tasks got harder, which is allowed if you say so.

**Regression.** Sourced from jobs you *already* sell, plus every incident you never want twice. Scores should sit near 1.0 at pass@1 or pass^k, depending on retry policy. A single drop is a failing build. You add a task when production teaches you a new way to break.

Coding agents already know this split as **fail-to-pass** (new bug) versus **pass-to-pass** (old tests stay green). See [coding-agent evals](./coding-agent-evals.md) (id: coding-agent-evals). Product agents need the same split: new "partial restock plus gift card" versus "single-item card refund still works."

## Comparison

Harborline, after a model swap.

| | Capability suite (18 hard tasks) | Regression suite (40 known-good) |
| --- | --- | --- |
| Source | Roadmap + latest incident types | Last quarter's passing jobs + fixed bugs |
| Expected score | 0.2–0.6 pass@3 | ≥ 0.99 pass@1 |
| If it drops | Diagnose; maybe accept while climbing | Block the release |
| If it rises | Celebrate a real gain | Suspicious — did the grader loosen? |
| Owner | Research / agent-harness team | Whoever ships the product |
| Online analog | Shadow on new intents | Canary on live refunds |

Never average the two columns. A 10-point capability gain that costs 2 regression points is not "net +8." It is a product incident with a research win stapled on.

## Common mistakes

- One suite, one number, two interpretations in the same Slack thread.
- Putting stretch tasks in CI so the build is always red and people ignore it.
- Putting only easy tasks in CI so you never notice the agent cannot do the new workflow.
- Deleting a regression task because "we don't hit gift cards this week."
- Changing the grader in the same PR as the agent and calling the jump a capability win.
- Using pass@k on the regression suite to paper over flaky isolation. See [pass@k versus pass^k](./pass-at-k/lesson.md) (id: pass-at-k).

## How to talk about it

"I keep two suites. Capability is the hill — hard tasks, pass@k, we expect to fail and we track clusters. Regression is the fence — yesterday's jobs, pass@1, any drop rolls back. I would never quote a blended score in a ship meeting."

If they ask what happens when a capability task starts passing consistently: promote a *simplified, frozen* version into regression. Do not move the living hard task; freeze a contract.

## Cross-links

- [Start evals from real failures](./how-to-run-proper-evals.md) (id: how-to-run-proper-evals)
- [Pass@k versus pass^k](./pass-at-k/lesson.md) (id: pass-at-k)
- [Coding-agent evals](./coding-agent-evals.md) (id: coding-agent-evals)
- [Offline gates and online drift](./online-offline-evals.md) (id: online-offline-evals)
- [How the 2026 AI interview round actually works](./interview-ai-round.md) (id: interview-ai-round)
