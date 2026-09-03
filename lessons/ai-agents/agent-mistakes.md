---
id: agent-mistakes
title: Mistakes coding agents keep making
slug: agent-mistakes
kind: strategy
track: ai-agents
difficulty: core
estimated_minutes: 16
summary: Coding agents fail in a short list of ruts — skipping repro, editing the wrong file, looping tools, hallucinating APIs — and evals plus harness design should hunt those ruts by name.
tags:
  - ai-agents
  - ai-agents/failure-modes
  - ai-agents/evals
  - interviews
  - interviews/ai
prerequisites:
  - eval-harness-vs-agent-harness
related:
  - tool-calling
  - coding-agent-evals
  - traces-trajectories
  - how-to-run-proper-evals
  - interview-ai-round
company_signal:
  - name: Meta
    evidence: Candidate reports of 2026 AI-assisted coding rounds score whether you verify the model's patch instead of pasting it.
    year: 2026
    confidence: medium
  - name: Anthropic
    evidence: Public coding-agent and eval writeups catalog tool loops, skipped repro, and prompt-only "fixes" as first-class failure modes.
    year: 2026
    confidence: high
sources_consulted:
  - Anthropic, Building effective agents; coding-agent harness notes
  - SWE-bench Verified failure analyses
  - Public Meta AI-assisted interview reports (2026)
updated: 2026-09-02
status: canonical
---

# Mistakes coding agents keep making

## Snapshot

- Most coding-agent failures are not "the model is bad at algorithms." They are ruts in the loop.
- The ruts repeat: skip repro, edit the wrong file, invent an API, ignore the compiler, loop a tool, write tests that bless the bug, or "fix" the system prompt instead of the code.
- Your eval suite should name these clusters. Your user harness (tests, `AGENTS.md`, CI) should make the healthy path cheaper than the rut.
- In interviews, walking a transcript and pointing at the rut is the senior move.

## Why it shows up in interviews

AI-assisted coding rounds and "why did this agent regress" prompts are transcript-reading tests. Interviewers want you to debug the *process*, not rewrite the function from scratch while ignoring the trace. See [how the 2026 AI interview round actually works](./interview-ai-round.md) (id: interview-ai-round).

## Core idea

Treat the agent like a junior who types fast and does not like to read. The harness must force the scientific-method order: **reproduce → read the error → change the smallest true cause → re-run the same test.**

Evals then score two things: the [outcome](./outcome-vs-transcript/lesson.md) (id: outcome-vs-transcript) (fail-to-pass plus pass-to-pass) and, when you debug, the trajectory for which rut it fell into. Do not grade "used my favorite files." Do grade "did not claim green while tests are red."

## Worked example

Harborline's checkout service. Hidden test: carts with a stale promo code should return `200` with `promo_applied=false`, not `500`. The agent is given the repo, the failing test name, and a shell.

| Rut | What the transcript shows | What the world becomes | Harness / eval counter |
| --- | --- | --- | --- |
| Skipping repro | Edits `pricing.py` before running pytest | Random churn, still red | Agent instructions: run the named test first; eval fails if no test span exists |
| Wrong file | Patches `legacy_cart.py` that nothing imports | Tests still fail | Repo map in `AGENTS.md`; blame/coverage hints |
| Hallucinated API | Calls `Cart.applyDiscount()` that does not exist | ImportError | Force read of the module; code grader cannot be talked out of ImportError |
| Not reading errors | Same patch retried after a clear stack frame | Loop of identical diffs | Stop condition on repeated tool args |
| Tool loop | `run_tests` × 12 with no file change | Timeout, $$ | Timeout + repeated-call breaker in the agent harness |
| Wrong tests | Rewrites the test to expect `500` | Green, product still broken | Hidden fail-to-pass tests the agent cannot edit |
| Over-engineering | New `PromoStrategyFactory` for a one-line nil check | Pass-to-pass fails elsewhere | Diff-size budget; pass-to-pass suite |
| Prompt-only "fix" | Author changes system prompt, leaves `pricing.py` broken | Demo chat looks wiser, CI red | Eval uses the shipping harness, not a parallel prompt |

The hidden-test row is the one that saves you in production: the agent must not own the grader.

## Common mistakes

- Treating every failure as a model-quality problem. First ask which rut the trajectory is.
- Letting the agent edit the tests that define the bug.
- No stop condition on identical tool calls. See [tool calling](./tool-calling/lesson.md) (id: tool-calling).
- Measuring only fail-to-pass, so a 400-line rewrite that breaks neighbors still "wins."
- Reading the last assistant message ("all tests pass") instead of the pytest span.
- Humans "helping" by pasting a stack overflow snippet the agent already tried.

## How to talk about it

"I would open the transcript and tag the rut before I talk about the patch. Did it reproduce. Did it read the error. Did it touch the file the stack names. Did it invent an API. Did it loop. Did it edit tests. Then I would say which harness change makes that rut expensive — hidden tests, repeated-call breaks, AGENTS.md that says run pytest first — versus which eval we add so this incident never leaves the regression suite."

If they hand you a live AI coding round: run the failing test yourself, treat the model as a search engine with a diff, and do not submit until *you* have seen the outcome.

## Cross-links

- [Tools that are safe to call twice](./tool-calling/lesson.md) (id: tool-calling)
- [Coding-agent evals](./coding-agent-evals.md) (id: coding-agent-evals)
- [Spans, traces, trajectories, sessions](./traces-trajectories.md) (id: traces-trajectories)
- [Start evals from real failures](./how-to-run-proper-evals.md) (id: how-to-run-proper-evals)
- [Vendor harness versus user harness](./vendor-vs-user-harness.md) (id: vendor-vs-user-harness)
- [How the 2026 AI interview round actually works](./interview-ai-round.md) (id: interview-ai-round)
