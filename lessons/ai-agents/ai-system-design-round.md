---
id: ai-system-design-round
title: Whiteboard an AI system starting from failure and evals
slug: ai-system-design-round
kind: strategy
track: ai-agents
difficulty: core
estimated_minutes: 22
summary: Run three 45-minute prompts for eval design, a cited contract assistant, and an agent that repeats a side effect.
tags:
  - ai-agents
  - ai-agents/evals
  - ai-agents/tools
  - interviews
  - interviews/ai
prerequisites:
  - how-to-run-proper-evals
  - summarizer-evals
  - tool-calling
related:
  - summarizer-evals
  - how-to-run-proper-evals
  - llm-as-judge-calibration
  - agent-mistakes
  - mcp-tool-platform
company_signal:
  - name: Zapier
    evidence: https://zapier.com/blog/raising-ai-fluency-bar-in-hiring
    year: 2026
    confidence: high
sources_consulted:
  - https://zapier.com/blog/raising-ai-fluency-bar-in-hiring
  - https://www.anthropic.com/research/employment-at-anthropic
  - https://x.com/Anshuman_kirty/status/2104332992424333590
  - https://x.com/newlinedotco/status/2058986461114904812
updated: 2026-11-02
status: canonical
---

# Whiteboard an AI system starting from failure and evals

## Snapshot

- Candidate reports in 2026 describe evals in round after round: golden sets, a calibrated judge, regression checks when the prompt or model changes [2nd].
- A strong answer leads with failure modes and the eval pipeline. A weak one leads with a model name [2nd].
- Split deterministic code from the model. Side effects need idempotency keys.
- The corpus already teaches the pieces. These prompts are the 45-minute shape.
- Score with the 1–4 guide in [take-home artifacts](./take-home-artifacts.md) (id: take-home-artifacts). Verification here is the eval plan.

## Why it shows up in interviews

People who have been through AI-engineer loops describe the same checklist: offline evals on a golden set, online signals such as thumbs-down and escalations, an LLM-as-judge checked against human labels, and a regression gate on prompt or model swaps [2nd]. RAG questions split retrieval quality, groundedness, and answer relevance. Agent questions ask which tool, in what order, and whether the task finished. Zapier's hiring rubric watches whether you define good before you start and catch what is wrong before it ships [P]. Anthropic's 2026 scorecard write-up says autonomy and judgment gained emphasis [P]. None of that is a claim that every company asks these three prompts. They are practice, copied from reported shapes and restated.

## Core idea

### Order on the board

1. Failure modes, before boxes.
2. What is code and what is a model call.
3. Tool schemas: names, errors, idempotency.
4. The eval: sample, metric, calibration, regression gate.
5. Cost, latency, and where a human stays in the loop.
6. One story from your own work: what you measured, what broke, what you changed. Use a number you can defend. Do not borrow someone else's incident.

## Worked example

### Prompt A — support summaries

45 minutes. "Design the evals that gate a change to a support-ticket summarizer for a hosted-site product. Tickets include customer text."

Skeleton, aligned with [the summarizer suite](./summarizer-evals.md) (id: summarizer-evals):

- Failure modes: invented refunds, the wrong site, dropped action items, private data copied into the summary.
- Golden set: on the order of a hundred tickets labeled by support, including "do not summarize, escalate."
- Metrics: faithfulness to the ticket, action-item recall, and a refusal rate on the escalate slice.
- Judge: an LLM-as-judge only after you report agreement with the human labels. See [calibration](./llm-as-judge-calibration.md) (id: llm-as-judge-calibration).
- Gate: a prompt or model swap cannot ship if faithfulness drops on the golden set.

| Signal | Points |
| --- | --- |
| Failure modes before architecture | 0–3 |
| Separate metrics, not one vague "quality" | 0–3 |
| Judge calibrated, plus a regression gate | 0–4 |
| Cost of the judge and of the summarizer | 0–2 |

### Prompt B — contract questions

45 minutes. Reported RAG rounds ask you to build a system and evaluate it, sometimes with an assistant allowed for planning [2nd]. Restated, not as a leaked bank question:

> Design a contract assistant for in-house lawyers: "Does this agreement cap our liability?" Cover retrieval, citations, evals, cost, and what happens when it is wrong.

Failure modes to put on the board first: a hallucinated clause, the right clause from the wrong version, a missed carve-out, overconfidence, and one customer's documents shown to another.

Then: clause-sized chunks, filters for contract id and version, hybrid keyword plus embedding search, a reranker, required citation spans, and a refusal when nothing clears a threshold. Evals: a lawyer-labeled set (practice scale: about 200 questions over 50 contracts), retrieval recall at k, a claim-to-span groundedness check, answer correctness by a judge whose agreement with lawyers you report, and a regression gate. Online: thumbs-down, "show source" clicks, escalations. Cost: embed once per document version, cache the stable prefix, route easy lookups to a smaller model. Below a confidence threshold, the UI says to review with counsel.

| Signal | Points |
| --- | --- |
| Failure modes first | 0–3 |
| Retrieval design | 0–2 |
| Eval pipeline with calibration and a regression gate | 0–4 |
| Cost and latency | 0–2 |
| Tenancy and safety | 0–2 |
| One real measurement story you can defend | 0–2 |

### Prompt C — the ticket that opens three times

45 minutes. Candidate reports include "your agent is looping" and agents that passed demos and failed in production on retries and idempotency [2nd]. Restated:

> A support agent answers "why did bandwidth spike?" It may call `get_usage(site, range)`, `get_top_paths(site, range)`, `get_waf_events(site, range)`, and `open_ticket(summary)`. Design the prompt, the schemas, and the loop. In production it sometimes opens three tickets. Why, and what do you change?

Strong skeleton:

- Code fetches usage and top paths. The model only interprets.
- Schemas use narrow enums, ISO ranges, and explicit errors. `open_ticket` takes a `client_request_id` and is idempotent.
- The system prompt lists allowed conclusions (bot traffic, a viral path, hotlinking, a broken cache), says to answer unknown when evidence is thin, and demands a structured output.
- The loop has a step cap, a stop condition, and one side-effecting tool behind a confirmation.
- Three tickets: a timeout retry ran the side effect again. Fix with the idempotency key, a ledger of side effects, and a tool result that says the ticket already exists.
- Path strings from `get_top_paths` are data, not instructions.
- Evals: about 30 historical spikes with labeled causes. Score the cause, and score that a ticket was created once.

| Signal | Points |
| --- | --- |
| Code versus model split | 0–3 |
| Tool and schema quality | 0–3 |
| Side effects and idempotency | 0–3 |
| Guardrails and injection | 0–2 |
| Eval plan | 0–3 |

The platform those tools would live on is [a tool platform with scopes and an audit log](../system-design/cases/mcp-tool-platform.md) (id: mcp-tool-platform).

## Common mistakes

- Prompt theory with no system: no timeout, no step cap, no idempotency.
- An LLM-as-judge with no human agreement number.
- No regression gate, so a model swap ships on a demo.
- Ignoring cost.
- A story with no measurement. "We used AI" is not a story.

## How to talk about it

"I'll start with how this is wrong: wrong version, missed carve-out, and one tenant's file in another tenant's answer. Retrieval is hybrid and filtered. The answer must cite a span or refuse. The judge is calibrated against lawyer labels, and a prompt change cannot ship if recall at 5 drops on the golden set."

## Cross-links

- [Build an evaluation suite for meeting summaries](./summarizer-evals.md) (id: summarizer-evals)
- [Build an evaluation from the task contract](./how-to-run-proper-evals.md) (id: how-to-run-proper-evals)
- [Calibrate an LLM judge against human labels](./llm-as-judge-calibration.md) (id: llm-as-judge-calibration)
- [Diagnose agent failures before changing the prompt](./agent-mistakes.md) (id: agent-mistakes)
- [Design a tool platform with scopes and an audit log](../system-design/cases/mcp-tool-platform.md) (id: mcp-tool-platform)
- [Leave a transcript you would let a hiring manager read](./take-home-artifacts.md) (id: take-home-artifacts)
