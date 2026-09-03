---
id: online-offline-evals
title: Offline gates and online drift
slug: online-offline-evals
kind: concept
track: ai-agents
difficulty: core
estimated_minutes: 12
summary: Offline evals are a frozen, isolated suite you can compare across commits; online evals watch live traffic for drift. You ship with both or you fly on one instrument.
tags:
  - ai-agents
  - ai-agents/evals
  - ai-agents/product
  - interviews
  - interviews/ai
prerequisites:
  - how-to-run-proper-evals
related:
  - how-to-run-proper-evals
  - capability-vs-regression
  - traces-trajectories
  - pass-at-k
  - llm-as-judge-calibration
company_signal:
  - name: Anthropic
    evidence: Public eval writing treats isolated offline suites as the scientific unit; production monitoring is a separate loop.
    year: 2026
    confidence: medium
sources_consulted:
  - Anthropic, Demystifying evals for AI agents (2026-01-09)
  - Arize online/offline evaluation posts (2026)
  - Classic ML: offline replay versus online A/B, applied to agents
updated: 2026-09-02
status: canonical
---

# Offline gates and online drift

## Snapshot

- **Offline** — a frozen task set, reset envs, k trials, graders you already trust. Comparable across git shas. This is CI.
- **Online** — live or shadow traffic, real users, real tools, distribution that will not sit still. This is production sensors.
- Offline without online is a museum. Online without offline is a vibe dashboard you cannot bisect.
- Shadow (run the new agent, do not act) is the bridge when the tool has side effects.

## Why it shows up in interviews

"Would you A/B the agent?" is a trap if you have no offline gate. Interviewers want the same split they want for ranking or ads: **replayable offline for regression, online for drift and long-tail intents you never wrote down.** Pair it with [capability versus regression](./capability-vs-regression.md) (id: capability-vs-regression).

## Core idea

Offline is an experiment. You choose the tasks, you own isolation, you can say "this sha is worse on gift-card refunds." That sentence is illegal online unless you have traces and a grader that still makes sense on live state.

Online is a sensor. Users will ask for things not in your 40 tasks. Tools will 504. Prompts will collide with a holiday SKU. You log [traces](./traces-trajectories.md) (id: traces-trajectories), sample outcomes you *can* grade automatically (refund ledger vs ticket close reason), and mine failures into the offline suite.

Shadow and canary:

- **Shadow** — new harness sees the ticket, writes a proposed action, graders compare to the champion or to a delayed human. No customer-visible mutate.
- **Canary** — a slice of live traffic, only after offline regression is green and the tools are idempotent.
- **Holdout** — keep a slice on the old agent so seasonality does not masquerade as a win.

Do not LLM-judge 100% of live chats on a floating rubric. Pin the judge, sample, and prefer code outcomes even online (`refunds` row exists).

## Comparison

Harborline refunds.

| | Offline suite | Online sensors |
| --- | --- | --- |
| Input | 40 frozen tickets + fixtures | Today's tickets |
| Env | Fake Stripe, reset DB | Real money, real stock |
| Grade | Code + pinned tone judge | Ledger invariants; sampled human; delayed labels |
| Question | Did this sha get worse? | Is the world drifting? |
| Cadence | Every PR / nightly k trials | Always-on, plus weekly cluster review |
| Failure mode | Overfit to the museum | Cannot bisect, double-charges while you "learn" |

A model bump that holds offline pass@1 at 0.99 and then dumps online on a new gift-card SKU is not an offline failure. It is a missing task. Promote it.

## Common mistakes

- Shipping on a playground chat log ("it felt better").
- Online A/B on irreversible tools without idempotency or shadow. See [tool calling](./tool-calling.md) (id: tool-calling).
- Offline suite never updated, so it is a 2025 costume party.
- Using live LLM-as-judge as the only online metric; the judge drifts with the seasons.
- Different traces in prod and CI, so you cannot turn an online incident into an offline task.
- Quoting online "success rate" that counts the agent saying "done."

## How to talk about it

"Offline is the gate: frozen tasks, isolated envs, regression must not drop. Online is the sensor: traces, ledger invariants, sampled labels, and a weekly promotion of new failures into the suite. I would shadow a new harness on refunds before it can touch Stripe, and I would not A/B a non-idempotent tool."

If they ask about cost: run full k-trial offline on the regression fence; sample capability; sample online judges. Spend the GPU budget where a human will read the miss.

## Cross-links

- [Start evals from real failures](./how-to-run-proper-evals.md) (id: how-to-run-proper-evals)
- [Capability versus regression](./capability-vs-regression.md) (id: capability-vs-regression)
- [Spans, traces, trajectories, sessions](./traces-trajectories.md) (id: traces-trajectories)
- [Pass@k versus pass^k](./pass-at-k.md) (id: pass-at-k)
- [Calibrate the judge before you trust the score](./llm-as-judge-calibration.md) (id: llm-as-judge-calibration)
- [Tools that are safe to call twice](./tool-calling.md) (id: tool-calling)
