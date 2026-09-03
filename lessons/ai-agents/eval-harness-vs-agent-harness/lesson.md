---
id: eval-harness-vs-agent-harness
title: Eval harness versus agent harness
slug: eval-harness-vs-agent-harness
kind: concept
track: ai-agents
difficulty: core
estimated_minutes: 14
summary: The agent harness is how a model acts; the eval harness is how you score those actions. Mixing them up makes interview answers and production metrics lie.
tags:
  - ai-agents
  - ai-agents/harnesses
  - ai-agents/evals
  - interviews/ai
prerequisites: []
related:
  - how-to-run-proper-evals
  - graders
  - vendor-vs-user-harness
  - coding-agent-evals
  - outcome-vs-transcript
company_signal:
  - name: Anthropic
    evidence: Public engineering essay "Demystifying evals for AI agents" (Jan 2026) defines both terms and is now a common citation in AI-platform interviews.
    year: 2026
    confidence: high
  - name: OpenAI / coding-agent vendors
    evidence: Candidate reports and harness-benchmark writeups treat Claude Code, Codex, etc. as agent harnesses wrapping a model.
    year: 2026
    confidence: medium
sources_consulted:
  - Anthropic, Demystifying evals for AI agents (2026-01-09)
  - Arize and Winder.ai harness comparison posts (2026)
  - Position paper on disclosing the harness when comparing agents
  - X threads on "Agent = Model + Harness"
updated: 2026-09-03
status: canonical
---

# Eval harness versus agent harness

## Snapshot

- An **agent harness** (scaffold) is the loop that turns a model into something that can read tools, call them, and keep going.
- An **eval harness** is the lab: reset the world, run trials, record transcripts, grade, aggregate.
- When someone says "the agent scored 81%," they scored *model + agent harness* inside *an eval harness*. Change either harness and the number moves.
- Interviews in 2026 increasingly ask you to separate those layers. Saying "we eval the LLM" is a junior answer.

## Why it shows up in interviews

Product teams shipped demos that looked brilliant and then melted in production. Interviewers want to know whether you can measure an agent without fooling yourself. Anthropic's public writeup made the vocabulary standard: task, trial, grader, transcript, outcome, eval harness, agent harness, suite.

A useful one-liner: **LLM evals grade an answer. Agent evals grade a job.**

## Core idea

Think of three nested machines:

1. **Model** — next-token brain.
2. **Agent harness** — system prompt, tool schemas, permission sandbox, memory/context folding, retry policy, stop conditions. Claude Code, Cursor's agent, Codex, a homegrown ReAct loop: these are harnesses, not models.
3. **Eval harness** — dataset of tasks, isolated environments, concurrency, graders, dashboards. Harbor, Braintrust, a pytest suite that boots a container per trial: these are eval harnesses.

[Eval loop](viz/loop.md)

A **framework** (LangGraph, Crew) is a library for writing orchestration. A harness is the running body. Frameworks can include a harness; they are not the same noun.

Boeckeler's framing (widely cited in 2026): Agent = Model + Harness. For coding agents there is a **vendor harness** you barely control and a **user harness** you do: `AGENTS.md`, tests, linters, CI gates, review bots.

## Comparison

| Question | Agent harness | Eval harness |
| --- | --- | --- |
| Job | Let the model act | Measure whether acting worked |
| Owns | Tools, loop, context, sandbox | Tasks, isolation, graders, aggregation |
| You change it to | Make the agent more capable or safer | Make the score more honest |
| Failure if confused | You "upgrade the model" when the loop was the bug | You grade the demo path, not the production path |
| Interview tell | "We added a retry + smaller tool surface" | "We run 5 trials, grade DB state, not the chat string" |

Holding the model fixed and swapping only the agent harness has moved Terminal-Bench / SWE-bench numbers by several points in published comparisons. If you do not disclose the harness, you are not comparing models.

## Common mistakes

- Grading the final assistant sentence ("Refund issued!") instead of the **outcome** (row in `refunds` table).
- Sharing filesystem or git history across trials so later trials cheat.
- Checking an exact tool-call sequence. Agents find other valid paths; you punish creativity and reward memorizing your sketch.
- Running the eval agent with different tools than production. You are then measuring a cousin.
- Quoting pass@1 from one trial as a product SLO. See [pass@k versus pass^k](../pass-at-k.md) (id: pass-at-k).

## How to talk about it

"We treat the shipping loop as the agent harness and keep it identical in CI. The eval harness resets a container, runs k trials, grades environment state with code, and uses an LLM rubric only for tone. If a score jumps after a prompt tweak, I first ask whether the eval harness still matches prod."

## Cross-links

- [How to run proper evals](../how-to-run-proper-evals.md) (id: how-to-run-proper-evals)
- [Graders: code, model, human](../graders.md) (id: graders)
- [Outcome versus transcript](../outcome-vs-transcript.md) (id: outcome-vs-transcript)
- [Vendor harness versus user harness](../vendor-vs-user-harness.md) (id: vendor-vs-user-harness)
- [Coding-agent evals](../coding-agent-evals.md) (id: coding-agent-evals)
- [Pass@k versus pass^k](../pass-at-k.md) (id: pass-at-k)
