---
id: interview-ai-round
title: How the 2026 AI interview round actually works
slug: interview-ai-round
kind: strategy
track: ai-agents
difficulty: core
estimated_minutes: 16
summary: 2026 loops mix AI-assisted coding, "design an eval," and "why did the agent regress." They score whether you can use a model without surrendering correctness or measurement.
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
company_signal:
  - name: Meta
    evidence: Candidate reports (2025–2026) describe an AI-assisted coding round where a model is available in the editor and the grader is still your tests and explanation.
    year: 2026
    confidence: medium
  - name: OpenAI / Anthropic / AI-platform teams
    evidence: Repeated prep-site and Blind-style reports of "design an eval for this agent" and "debug this regression from a trace," not trivia about a vendor API.
    year: 2026
    confidence: medium
sources_consulted:
  - Public Meta AI-assisted coding interview reports (2025–2026)
  - Anthropic, Demystifying evals for AI agents (2026-01-09)
  - meta/RESEARCH.md AI-and-agentic-coding notes
  - Hello Interview / Exponent-style roundup threads on new AI rounds
updated: 2026-09-02
status: canonical
---

# How the 2026 AI interview round actually works

## Snapshot

- The round is not "have you used Cursor." It is **can you keep a contract with a stochastic intern in the loop**.
- Three shapes show up: **AI-assisted coding**, **design an eval**, **debug an agent regression** from a trace.
- They still want tests, isolation, tradeoffs, and a spoken plan. The model is a tool you must not outsource judgment to.
- Vocabulary that scores: agent harness vs eval harness, outcome vs transcript, pass@k vs pass^k, capability vs regression.

## Why it shows up in interviews

Product orgs shipped agents, then shipped incidents. Interviewers added a round that checks the new literacy the way they once added system design. Meta-style AI-assisted coding (candidate-reported) puts a model in the pad and watches whether you paste, or whether you reproduce and grade. Platform teams ask you to measure an agent the way this track teaches. Pair with a general [interview framework](../system-design/foundations/interview-framework.md) (id: interview-framework): requirements, plan, tradeoffs, failure modes — now with graders.

## Core idea

You are being scored on **control**, not on prompt cleverness.

**AI-assisted coding.** Use the model to search, draft, and explain. You still: restate the spec, write or run a failing test, read errors, reject invented APIs, and submit only what you have seen go green. Treat the model's "tests pass" line as speech. See [agent mistakes](./agent-mistakes.md) (id: agent-mistakes).

**Design an eval.** Pick 20–50 real failures, unambiguous specs, reference solutions, isolated envs, outcome graders, k trials, transcript review. Split capability and regression. Name what is code vs judge vs human. Do not start with a public bench as the product metric.

**Why did the agent regress.** They hand you a score drop and a few traces. Walk the layers: did the eval harness change, did the vendor or user harness change, did the tool schema change, did the task mix change, or did the model get worse. Look at outcomes first, then cluster ruts in the trajectory.

Speak in systems: the same brain that designs a [job scheduler](../system-design/cases/job-scheduler/lesson.md) (id: job-scheduler) can design retries and isolation for trials.

## Worked example

Three boards, one Harborline day.

| Round shape | Prompt you might hear (paraphrased) | What a strong 10 minutes looks like | Fail tell |
| --- | --- | --- | --- |
| AI-assisted coding | Pad has a model; fix stale-promo 500s in checkout | You run the test, ask the model for a diff, verify `pricing/promos.py`, refuse a new factory, re-run | Paste a 80-line rewrite you never executed |
| Design an eval | "We want a refunds agent. How do you know it works?" | 32 incidents, table of spec/isolation/grader, pass@1 as SLO because charges are not a lottery, judge only on email tone and calibrated | "We'll LLM-judge 10k chats" |
| Debug a regression | pass@1 on refunds fell 0.99 → 0.71 after a 'prompt cleanup' | You ask which suite, check grader sha, notice `refund` lost its idempotency_key, match double-charge traces | "The new model is worse" with no layer analysis |

Notice the coding row still looks like a normal interview if you mute the model. That is the point. The model is optional compute. The contract is yours.

## Common mistakes

- Treating the AI coding round as a race to accept autocomplete.
- Designing an eval with no isolation, no reference solution, and a vibe judge.
- Quoting SWE-bench as the company SLO.
- Debugging a regression by tweaking the system prompt first.
- Never saying "outcome" or "harness," then drowning in model names.
- Skipping tradeoffs: judge cost, trial budget, irreversible tools, online shadow.

## How to talk about it

"I would keep the same skeleton I use for system design. Goal and non-goals. Unit of work. What we measure. What we refuse to measure with a judge. Then I would walk one concrete task — Harborline refund R-17 — from spec to isolated trial to code grader to a sampled transcript. If this is a coding pad with a model, I narrate reproduce-then-patch and I do not trust speech."

Close with a ship rule: regression fence in CI, capability hill on a dashboard, online sensors after the tools are idempotent.

## Cross-links

- [Start evals from real failures](./how-to-run-proper-evals.md) (id: how-to-run-proper-evals)
- [Eval harness versus agent harness](./eval-harness-vs-agent-harness/lesson.md) (id: eval-harness-vs-agent-harness)
- [Mistakes coding agents keep making](./agent-mistakes.md) (id: agent-mistakes)
- [Capability versus regression](./capability-vs-regression.md) (id: capability-vs-regression)
- [Coding-agent evals](./coding-agent-evals.md) (id: coding-agent-evals)
- [Interview framework](../system-design/foundations/interview-framework.md) (id: interview-framework)
- [Job scheduler](../system-design/cases/job-scheduler/lesson.md) (id: job-scheduler)
- [Pass@k versus pass^k](./pass-at-k/lesson.md) (id: pass-at-k)
