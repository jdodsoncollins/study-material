---
id: coding-agent-evals
title: Fail-to-pass is not the whole coding eval
slug: coding-agent-evals
kind: concept
track: ai-agents
difficulty: core
estimated_minutes: 14
summary: A coding-agent task is a dirty repo plus hidden tests — the bug must go red-to-green and the old suite must stay green. Do not paste SWE-bench into your product.
tags:
  - ai-agents
  - ai-agents/evals
  - ai-agents/harnesses
  - interviews
  - interviews/ai
prerequisites:
  - how-to-run-proper-evals
related:
  - how-to-run-proper-evals
  - graders
  - capability-vs-regression
  - vendor-vs-user-harness
  - agent-mistakes
  - eval-harness-vs-agent-harness
company_signal:
  - name: OpenAI / Anthropic
    evidence: SWE-bench Verified and Terminal-Bench are the cited coding-agent outcome graders in 2026 platform interviews and vendor blogs.
    year: 2026
    confidence: high
sources_consulted:
  - SWE-bench Verified methodology (fail-to-pass / pass-to-pass)
  - Terminal-Bench outcome-grader practice
  - Anthropic, Demystifying evals for AI agents (2026-01-09)
updated: 2026-09-02
status: canonical
---

# Fail-to-pass is not the whole coding eval

## Snapshot

- A coding-agent eval is not "did the model write a function." It is **did this repo get healthier**.
- **Fail-to-pass:** tests that were red on the buggy commit become green. That is the bug you cared about.
- **Pass-to-pass:** tests that were already green stay green. That is "do not smash the neighbors."
- Public benches (SWE-bench Verified, Terminal-Bench) teach the *shape*. Copying their instances into your CI measures their distribution, not yours.

## Why it shows up in interviews

Every lab wants a coding agent. Interviewers ask how you would know it works without trusting the agent's "tests pass" speech. The expected vocabulary is hidden tests, isolated checkout, fail-to-pass plus pass-to-pass, and a user harness the agent cannot rewrite. See [graders](./graders/lesson.md) (id: graders).

## Core idea

Unit of work = one PR-shaped job.

1. **Start state.** A known commit, dependencies pinned, no leftover `node_modules` from the last trial.
2. **Spec.** A ticket, a failing test *name*, or a user repro. Unambiguous: "stale promo codes should 200 with `promo_applied=false`," not "fix checkout."
3. **Reference.** A human patch that makes fail-to-pass go green without tanking pass-to-pass. If that patch does not exist, the task is not yet an eval.
4. **Hidden tests.** The agent may run a visible repro. It must not edit the files the grader owns.
5. **Grade the tree**, not the commit message.

Fail-to-pass without pass-to-pass rewards deleting the feature. Pass-to-pass without fail-to-pass rewards `git checkout -- .` and a smug transcript.

This is the coding-shaped version of [capability versus regression](./capability-vs-regression.md) (id: capability-vs-regression): the new bug is capability; the old suite is regression. Promote a once-hard task into the pass-to-pass set once it is a contract.

## Comparison

Harborline checkout, task `C-09`.

| Piece | Visible to the agent | Grader owns | Pass rule |
| --- | --- | --- | --- |
| Repro test `test_stale_promo_returns_200` | Yes, starts red | No — agent may iterate on it only if you allow a local copy | Must be green at the end (fail-to-pass) |
| Hidden tests for the same bug (edge: expired vs unknown code) | No | Yes | All green |
| Existing checkout suite (tax, gift card, empty cart) | May run | Yes, agent cannot delete | All still green (pass-to-pass) |
| Lint / typecheck | Optional tool | CI | No new errors |
| Transcript "all tests pass" | Yes | Never | Ignored |

Do not clone SWE-bench's Python issues into this table. Write tasks from *your* last twenty production fixes. Twenty Harborline tickets will move your harness; 2,200 foreign GitHub issues will move a blog post.

## Common mistakes

- Letting the agent edit grader tests, then celebrating fail-to-pass.
- Scoring only the new test, so a rewrite that breaks tax calculation still "solves" promo codes.
- Shared workspaces: trial 2 starts on trial 1's branch.
- Different agent harness in eval versus the [vendor + user harness](./vendor-vs-user-harness.md) (id: vendor-vs-user-harness) developers actually run.
- Timeout so short that only lucky one-shot patches pass — you are measuring latency, not repair.
- Publishing a SWE-bench number as if it were Harborline's SLO.

## How to talk about it

"I would freeze a commit, give the agent the ticket and a repro, hide the rest of the tests, and pass only if fail-to-pass goes green *and* pass-to-pass stays green. Isolation per trial, same tools as production. I would not import SWE-bench as the product suite; I would steal its two-bucket grader and fill the buckets from our own bugs."

If they ask about languages: the idea is repo-shaped, not Python-shaped. The grader is the test runner you already trust.

## Cross-links

- [Start evals from real failures](./how-to-run-proper-evals.md) (id: how-to-run-proper-evals)
- [Graders: code, model, human](./graders/lesson.md) (id: graders)
- [Capability versus regression](./capability-vs-regression.md) (id: capability-vs-regression)
- [Vendor harness versus user harness](./vendor-vs-user-harness.md) (id: vendor-vs-user-harness)
- [Mistakes coding agents keep making](./agent-mistakes.md) (id: agent-mistakes)
- [Eval harness versus agent harness](./eval-harness-vs-agent-harness/lesson.md) (id: eval-harness-vs-agent-harness)
