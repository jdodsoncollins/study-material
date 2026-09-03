---
id: graders
title: Code graders, model judges, and humans
slug: graders
kind: concept
track: ai-agents
difficulty: core
estimated_minutes: 12
summary: Prefer a code check on world state; use an LLM judge for fuzzy qualities you have calibrated; keep humans as the gold you sample against.
tags:
  - ai-agents
  - ai-agents/evals
  - interviews
  - interviews/ai
prerequisites:
  - eval-harness-vs-agent-harness
related:
  - how-to-run-proper-evals
  - llm-as-judge-calibration
  - outcome-vs-transcript
  - coding-agent-evals
  - pass-at-k
company_signal:
  - name: Anthropic
    evidence: The 2026 agent-eval essay treats code, model, and human graders as the three workable scoring methods and ranks them by objectivity.
    year: 2026
    confidence: high
sources_consulted:
  - Anthropic, Demystifying evals for AI agents (2026-01-09)
  - Arize LLM-as-judge guidance (2026)
  - SWE-bench Verified unit-test graders
updated: 2026-09-02
status: canonical
---

# Code graders, model judges, and humans

## Snapshot

- A **grader** maps a trial (transcript + environment) to a score. Most agent evals should be mostly **code**.
- **LLM-as-judge** is for qualities a program cannot hash: tone, policy paraphrase, "did this email actually answer the question."
- **Humans** label a gold slice and audit drift. They are too slow to be the nightly CI.
- Mixing them without saying so is how a 0.82 becomes a story instead of a measurement.
- A good suite is mostly code, a little pinned judge, and a human sample you actually look at.

## Why it shows up in interviews

"How do you score the agent?" is the follow-up after "design an eval." Interviewers are listening for *what is checkable in the world* versus *what needs a rubric*. If you reach for a judge model first, they assume you have never been burned by a verbose, self-preferring grader.

## Core idea

Pick the cheapest grader that cannot be talked into a yes.

- **Code** asserts facts: row exists, test suite went fail→pass, HTTP 409 did not double-charge, file hash, invariant `inventory >= 0`.
- **Model judge** answers a frozen rubric on a transcript or artifact. It must be [calibrated](./llm-as-judge-calibration.md) (id: llm-as-judge-calibration) against humans and then pinned.
- **Human** is the reference for the judge and for tasks where the spec is still being discovered.

Grade **outcomes** with code. Grade **soft qualities** with a judge. Do not grade an exact tool sequence unless the sequence *is* the product (compliance recording, "must call `confirm` before `delete`").

## Comparison

| Grader | What it is good at | What it lies about | When to use it |
| --- | --- | --- | --- |
| Code | Money, inventory, tests, schemas, HTTP side effects | Valid alternate paths if you overfit the steps | Default for pass/fail of the job |
| LLM judge | Tone, summary faithfulness, policy language | Verbosity bias, position bias, "sounds confident" | Calibrated rubric on a *named* quality |
| Human | Novel policy, "would we ship this" | Fatigue, disagreement, cost | Gold labels + weekly audit sample |

Harborline example: the refund **amount and target** are code. Whether the confirmation email is "plain and non-legalistic" is a judge with a three-bullet rubric. Whether gift-card law was respected on an unseen edge is a human review of the cluster, then a new code assertion once you know the rule.

## Common mistakes

- Grading the assistant's last sentence (`Refund issued!`) instead of the `refunds` table. See [outcome versus transcript](./outcome-vs-transcript.md) (id: outcome-vs-transcript).
- Asking a judge "did the agent do a good job?" — one axis, no examples, no freeze.
- Using the same model family as judge and agent without checking self-preference.
- Encoding the author's favorite tool order into pytest, then punishing a shorter valid path.
- Letting the judge prompt float in the same PR as the agent prompt, so both drift together.
- Calling a 1–5 Likert score an SLO. Binary, named checks compose; vibes do not.

## How to talk about it

"Default grader is code on environment state. I add an LLM judge only for a quality I can name and calibrate on a human gold set, and I pin that judge. Humans label the gold and spot-check failures. If a check can be written as `SELECT`, it will be."

If they ask about partial credit: split the job into independent binary graders (refund, restock, email) and report them separately. Averaging them into one number is a dashboard choice, not a truth. Partial credit that a judge invents cannot be bisected when the score drops.

## Cross-links

- [Start evals from real failures](./how-to-run-proper-evals.md) (id: how-to-run-proper-evals)
- [Calibrate the judge before you trust the score](./llm-as-judge-calibration.md) (id: llm-as-judge-calibration)
- [Outcome versus transcript](./outcome-vs-transcript.md) (id: outcome-vs-transcript)
- [Coding-agent evals](./coding-agent-evals.md) (id: coding-agent-evals)
- [Eval harness versus agent harness](./eval-harness-vs-agent-harness.md) (id: eval-harness-vs-agent-harness)
