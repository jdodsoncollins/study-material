---
id: outcome-vs-transcript
title: Grade the world, not the speech
slug: outcome-vs-transcript
kind: concept
track: ai-agents
difficulty: core
estimated_minutes: 12
summary: The transcript is what the agent said and called; the outcome is what the environment became. Product success lives in the second, debugging in the first.
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
company_signal:
  - name: Anthropic
    evidence: The 2026 agent-eval essay uses outcome versus transcript as the core scoring distinction, including the refund-utterance failure mode.
    year: 2026
    confidence: high
sources_consulted:
  - Anthropic, Demystifying evals for AI agents (2026-01-09)
  - X threads on grading trajectories versus final strings
  - Arize tracing versus evaluation posts (2026)
updated: 2026-09-02
status: canonical
---

# Grade the world, not the speech

## Snapshot

- **Outcome** — environment after the trial: rows, files, test results, emails actually queued, money moved.
- **Transcript** — the ordered record of messages, tool calls, and observations. Also called a trajectory when you care about the path.
- "Refund issued" in the assistant text is speech. A `refunds` row for `$24.00` on order `HL-9041` is an outcome.
- Score the outcome for pass/fail. Read the transcript to see why.

## Why it shows up in interviews

LLM evals trained a generation of engineers to grade the final string. Agents can talk a perfect job and do nothing, or do the job with an ugly path. Interviewers listen for whether you can name both artifacts and assign them different jobs: **gate on the world, debug on the trace.**

## Core idea

The product promise is a state change, not a paragraph.

Write the grader against the same stores the user would notice. If the user notices a refund, query `refunds`. If the user notices a merged PR, run the tests. If the user notices an email, look at the mail fixture, not the model's narration of sending one.

Use the transcript when:

- You need to enforce a **policy on the path** (must `confirm` before `delete_account`).
- You are clustering failures (wrong file, tool loop, ignored error).
- You are calibrating a judge on tone.

Do not use the transcript as a poor man's outcome ("the model said it restocked"). Models lie in the helpful register.

## Comparison

Harborline trial on order `HL-9041`.

| Check | Transcript says | Outcome is | Grade this? |
| --- | --- | --- | --- |
| Refund | `Refund issued!` | No row in `refunds` | Fail on outcome |
| Refund | Tool error, then retry with idempotency key | One row, `$24.00`, right card | Pass on outcome |
| Restock | Called `adjust_inventory` twice | `mug-blue` +1 net | Pass if net is the spec |
| Email | "I emailed Sam" | Mail fixture empty | Fail on outcome |
| Path policy | Never called `confirm` | Account deleted | Fail on transcript *and* outcome |

The second row is the important one: a messy transcript and a correct world. Punishing the mess trains the agent to imitate your sketch. Unless the path is regulated, let it be ugly.

See [traces, trajectories, sessions](./traces-trajectories.md) (id: traces-trajectories) for how these artifacts nest.

## Common mistakes

- String-matching the last assistant message for keywords (`refund`, `done`, `fixed`).
- Requiring an exact tool-call sequence copied from the author's reference solution.
- Grading mocked tool *return values* the agent invented, not the fake Stripe the eval harness owns.
- Dumping the whole transcript into an LLM judge with "did it succeed?" — that is a second narrator.
- Ignoring side effects outside the happy store (emailed the wrong `user_id` while refunding the right order).
- No screenshot of the world: you cannot replay the outcome, only the chat.

## How to talk about it

"I grade database rows, inventory, and queued emails — the world the customer would see. I read transcripts to cluster failures and to enforce a short list of path policies like confirm-before-delete. If the agent says 'refund issued' and the table is empty, that is a fail, and it is also a reason not to trust speech as a grader."

If they want a picture:

```
env₀ → agent harness (transcript grows) → env₁
                         ↓                  ↓
                    debug / policy      pass/fail
```

## Cross-links

- [Graders: code, model, human](./graders.md) (id: graders)
- [Spans, traces, trajectories, sessions](./traces-trajectories.md) (id: traces-trajectories)
- [Start evals from real failures](./how-to-run-proper-evals.md) (id: how-to-run-proper-evals)
- [Eval harness versus agent harness](./eval-harness-vs-agent-harness/lesson.md) (id: eval-harness-vs-agent-harness)
- [Tools that are safe to call twice](./tool-calling.md) (id: tool-calling)
