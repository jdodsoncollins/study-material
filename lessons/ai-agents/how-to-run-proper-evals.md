---
id: how-to-run-proper-evals
title: Start evals from real failures, not a synthetic pile
slug: how-to-run-proper-evals
kind: strategy
track: ai-agents
difficulty: core
estimated_minutes: 16
summary: A useful agent eval is a small set of fully specified, already-solved failures run in clean rooms and graded on world state, then read by a human.
tags:
  - ai-agents
  - ai-agents/evals
  - interviews
  - interviews/ai
prerequisites:
  - eval-harness-vs-agent-harness
related:
  - eval-harness-vs-agent-harness
  - graders
  - outcome-vs-transcript
  - capability-vs-regression
  - coding-agent-evals
  - interview-ai-round
company_signal:
  - name: Anthropic
    evidence: Public 2026 eval essay argues for starting with a few dozen real tasks, isolated trials, and outcome graders rather than huge synthetic banks.
    year: 2026
    confidence: high
  - name: OpenAI
    evidence: Candidate reports of "design an eval" follow-ups in AI-platform loops track this same recipe.
    year: 2026
    confidence: medium
sources_consulted:
  - Anthropic, Demystifying evals for AI agents (2026-01-09)
  - SWE-bench Verified / Terminal-Bench outcome-grader practice
  - Arize eval-harness writeups (2026)
updated: 2026-09-02
status: canonical
---

# Start evals from real failures, not a synthetic pile

## Snapshot

- Begin with **20–50 tasks** taken from incidents the current agent already botched, not a generated thousand-item bank.
- Every task needs an **unambiguous spec** and a **reference solution** that a competent human (or the old script) can execute. If nobody can solve it, you are measuring the puzzle, not the agent.
- Run each trial in an **isolated environment**. Leftover files, cookies, and git history are cheats.
- **Grade the outcome** in the world. Then **read the transcripts** so you know *why* the score moved.

## Why it shows up in interviews

Demos pass; production does not. Interviewers in 2026 ask you to "stand up an eval" the way they used to ask you to "stand up a test suite." They want the sequence: real failures → tight specs → isolation → outcome grade → transcript review. Reciting "we use LLM-as-judge on 10k prompts" is the junior answer.

## Core idea

An eval task is a job, not a chat prompt. Write it so two engineers would agree on pass/fail without a meeting.

The loop:

1. Mine last month's tickets, pager, and "the agent did what?" Slack.
2. Turn each into a spec with start state, allowed tools, and a checkable end state.
3. Prove solvability with a reference path (script, fixture, or recorded human trial).
4. Boot a clean env per trial. Run *k* trials. See [pass@k versus pass^k](./pass-at-k.md) (id: pass-at-k).
5. Grade world state with code whenever you can. See [graders](./graders.md) (id: graders).
6. Sample transcripts every time the score jumps or a new failure cluster appears.

Twenty good tasks beat two hundred vague ones because you can actually read them.

## Worked example

A returns-desk agent in a shop called **Harborline**. Last month it double-refunded, emailed the wrong customer, and stalled on gift-card orders. You pull 32 of those threads.

| Field | Harborline task `R-17` |
| --- | --- |
| Start state | Order `HL-9041`, paid, delivered, 14 days ago; customer asks for a partial refund on SKU `mug-blue` only |
| Spec | Refund $24.00 to the original card; restock 1 unit; leave the matching saucer as fulfilled; write one confirmation email |
| Reference | A 12-line script hitting the same tools the agent has; it passes the grader |
| Isolation | Fresh Postgres + fake Stripe per trial; no shared `/tmp` |
| Outcome grader | `refunds` row amount/target, inventory delta, email fixture to the right `user_id` |
| Not graded | Exact tool order, apology wording (separate tone rubric, sampled) |

You do not add "be helpful" to the spec. You do not grade the sentence `Refund issued.` See [outcome versus transcript](./outcome-vs-transcript.md) (id: outcome-vs-transcript).

After the first run you sit with ten failing transcripts. Half are one bug (gift-card refunds hit the card tool). That is the whole point of a small suite: you can read.

## Common mistakes

- Starting from a public benchmark and calling it your product eval. Public benches measure a cousin of your job.
- Specs that a second engineer would argue with ("handle the refund reasonably").
- No reference solution, so impossible and underspecified tasks hide in the average.
- Shared state across trials: trial 3 "passes" because trial 2 already restocked the mug.
- Shipping a dashboard of pass@1 from a single trial and calling it an SLO.
- Never reading transcripts, so you "improve" the prompt while the tool schema is the bug.

## How to talk about it

"I would not start with a thousand synthetic prompts. I would freeze 20–50 incidents, write pass/fail so two of us would agree, prove each task is solvable, reset a container per trial, grade database and side effects, and read a sample of transcripts every time the number moves. Capability and regression stay in separate buckets."

If they ask what you do next week: add tasks only from new failure clusters, not from imagination.

## Cross-links

- [Eval harness versus agent harness](./eval-harness-vs-agent-harness.md) (id: eval-harness-vs-agent-harness)
- [Graders: code, model, human](./graders.md) (id: graders)
- [Outcome versus transcript](./outcome-vs-transcript.md) (id: outcome-vs-transcript)
- [Capability versus regression](./capability-vs-regression.md) (id: capability-vs-regression)
- [Coding-agent evals](./coding-agent-evals.md) (id: coding-agent-evals)
- [How the 2026 AI interview round actually works](./interview-ai-round.md) (id: interview-ai-round)
