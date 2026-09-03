---
id: pass-at-k
title: Pass@k is a lottery; pass^k is a contract
slug: pass-at-k
kind: concept
track: ai-agents
difficulty: core
estimated_minutes: 12
summary: pass@k asks whether any of k trials worked; pass^k asks whether every trial worked. Products that cannot retry need the second number.
tags:
  - ai-agents
  - ai-agents/evals
  - interviews
  - interviews/ai
prerequisites:
  - how-to-run-proper-evals
related:
  - how-to-run-proper-evals
  - capability-vs-regression
  - online-offline-evals
  - eval-harness-vs-agent-harness
  - coding-agent-evals
company_signal:
  - name: Anthropic
    evidence: The 2026 agent-eval essay popularized pass@k versus pass^k as the reliability language for agent suites.
    year: 2026
    confidence: high
sources_consulted:
  - Anthropic, Demystifying evals for AI agents (2026-01-09)
  - SWE-bench reporting conventions for pass@k
  - Candidate reports of reliability SLOs in AI-platform interviews (2026)
updated: 2026-09-02
status: canonical
---

# Pass@k is a lottery; pass^k is a contract

## Snapshot

- Agents are stochastic. One trial is an anecdote.
- **pass@k** — probability that *at least one* of *k* independent trials succeeds. "Can it hit the target if we let it roll."
- **pass^k** (pass-hat-k / pass-to-the-k) — probability that *all k* trials succeed. "Can I trust it every time."
- A coding sandbox with retries cares about pass@k. A refund tool that charges a card cares about pass^k.

## Why it shows up in interviews

Quoting "the agent is 81%" without *k*, without trial count, and without saying which aggregator is how people get surprised in production. Interviewers want you to pick the metric that matches the product: lottery with retries versus a contract that must hold on every call.

## Core idea

[k](viz/k.md)

Hold the task fixed. Run *k* i.i.d. trials in isolated envs. Let *c* be the number of successes.

With a single-trial success probability *p* (estimated from many tasks × trials):

- `pass@k ≈ 1 − (1 − p)^k` — extra rolls help a lot when *p* is middling.
- `pass^k ≈ p^k` — extra required successes destroy you when *p* is not tiny-error.

pass@k is a **capability** lens: hill-climb whether the agent *can*. pass^k is a **reliability** lens: whether a pipeline of steps, or a user who will not retry, will survive. See [capability versus regression](../capability-vs-regression.md) (id: capability-vs-regression).

Do not turn k=1 pass rate into an SLO for a multi-step agent. Five tools in sequence is closer to pass^5 of each step, not pass@5 of the whole job.

## Comparison

Harborline refund agent, same 32-task suite, *p* = 0.70 per trial.

| Metric | Formula (iid) | Value at p=0.70 | Product reading |
| --- | --- | --- | --- |
| pass@1 | *p* | 0.70 | One-shot UI, no retry button |
| pass@3 | 1−(1−p)³ | 0.973 | Internal "try three times, take a winner" |
| pass^3 | p³ | 0.343 | Three independent customers, all must be correct |
| pass^8 | p⁸ | 0.058 | An 8-step workflow that cannot checkpoint |

The same agent looks like a miracle under pass@3 and like a coin under pass^3. Neither number is wrong. The interview is whether you know which one your SLO is.

If trials are *not* independent (shared cache, shared memory, temperature 0 plus identical seed), both formulas lie. Isolation is part of the metric. See [how to run proper evals](../how-to-run-proper-evals.md) (id: how-to-run-proper-evals).

## Common mistakes

- Reporting pass@1 from a single trial per task and calling it "81% accurate."
- Using pass@k as a ship gate for irreversible tools (charges, emails, deletes).
- Raising *k* until the dashboard looks green instead of raising *p*.
- Averaging pass@k across a mixed suite of toy and production tasks.
- Comparing two models' pass@k with different *k*, different harnesses, or different isolation.
- Forgetting that a user-visible retry is a product choice: latency, cost, and duplicate side effects.

## How to talk about it

"I would publish both. pass@k tells me whether the model-plus-harness can solve the task at all. pass^k, or pass@1 with a tight confidence interval, is what I would put next to an SLO if the action is not safely retryable. If the product retries internally, I have to make those retries idempotent or I am just rolling the lottery against the customer's card."

If they ask for a sketch, write *p*, *k*, and "retryable?" on the board before any percentage.

## Cross-links

- [Start evals from real failures](../how-to-run-proper-evals.md) (id: how-to-run-proper-evals)
- [Capability versus regression](../capability-vs-regression.md) (id: capability-vs-regression)
- [Offline gates and online drift](../online-offline-evals.md) (id: online-offline-evals)
- [Eval harness versus agent harness](../eval-harness-vs-agent-harness/lesson.md) (id: eval-harness-vs-agent-harness)
- [Tools that are safe to call twice](../tool-calling/lesson.md) (id: tool-calling)
