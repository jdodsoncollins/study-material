---
id: rag-vs-agents
title: Retrieval is not an agent loop
slug: rag-vs-agents
kind: concept
track: ai-agents
difficulty: intro
estimated_minutes: 12
summary: RAG is retrieve-then-generate on a frozen corpus; an agent is a loop that can change the world. Most products need a retriever, a few tools, or both — not a 12-step persona.
tags:
  - ai-agents
  - ai-agents/product
  - ai-agents/tools
  - interviews
  - interviews/ai
prerequisites: []
related:
  - tool-calling
  - eval-harness-vs-agent-harness
  - how-to-run-proper-evals
  - outcome-vs-transcript
company_signal:
  - name: Anthropic
    evidence: Anthropic's public essay on building effective agents popularized workflows versus agents and is a common 2026 citation when interviewers ask RAG versus agent.
    year: 2026
    confidence: high
sources_consulted:
  - Anthropic, Building effective agents
  - 2025–2026 LLM / RAG / coding-assistant design reports in meta/RESEARCH.md
  - Arize RAG evaluation versus agent evaluation posts
updated: 2026-09-02
status: canonical
---

# Retrieval is not an agent loop

## Snapshot

- **RAG** — fetch chunks (or structured rows), stuff them into context, generate an answer. One shot, maybe a rerank. The world does not change.
- **Agent** — a model in a loop with tools, stop conditions, and state. It may retrieve *as one tool among many*. It may refund, patch, or book.
- A retriever is a tool. RAG is an agent with the loop unrolled to length 1.
- Interview smell: proposing a multi-agent org chart for "search the help center."

## Why it shows up in interviews

2025–2026 system-design loops added "design a coding assistant / help bot / internal Q&A." Weak answers jump to agents because the word is fashionable. Strong answers ask **does this job need a side effect and a retry, or does it need the right paragraph.** That is the same instincts as serving and retrieval in [LLM serving](../system-design/foundations/llm-serving.md) (id: llm-serving).

## Core idea

Start from the user's success condition.

If success is "the right policy paragraph, cited," you need indexing, chunking, permissions on the corpus, citations, and a faithfulness grade. A loop that can `browse`, `sql`, and `email` is extra surface area. If success is "the order is refunded," retrieval of the policy is a step, not the product. You need tools, idempotency, and an outcome grader. See [tool calling](./tool-calling.md) (id: tool-calling).

A useful middle: **workflow**. Fixed graph: retrieve policy → extract order id → `preview_refund` → maybe `confirm`. No free-form planning. Anthropic's public distinction, paraphrased: use a workflow when the path is known; use an agent when the path must be discovered.

Eval split follows the product. RAG evals grade retrieval hit rate and grounded answers. Agent evals grade jobs. Do not LLM-judge a refund on whether the citation looked nice.

## Comparison

Harborline customer bot.

| Job | Success looks like | Architecture | Grade |
| --- | --- | --- | --- |
| "What is the return window for mugs?" | Cited sentence from policy v3 | RAG over the policy corpus | Retrieval recall + groundedness |
| "Refund me for order HL-9041" | Ledger row, restock, email | Tools + confirm; policy retrieved as a tool | Outcome on DB |
| "Why was I charged tax twice, fix it if it's a bug" | Maybe a citation, maybe a ticket, maybe a patch | Workflow: retrieve, then branch to agent | Two graders, two suites |
| "Write me a haiku about mugs" | A poem | Neither. Just a model. | Do not build a harness |

Permissions ride along: RAG must not retrieve another tenant's invoices. Agents must not get a `sql` tool that ignores row-level security. Both are harness problems.

Latency and cost: RAG is typically one embed + one generate. Agents pay per step and can loop. If [serving](../system-design/foundations/llm-serving.md) (id: llm-serving) is already tight on GPUs, do not buy a loop you cannot name a reason for.

## Common mistakes

- Multi-agent "researcher / critic / CEO" for a FAQ.
- RAG over a wiki that is 14 months stale, then blaming the model for policy errors.
- Letting the agent retrieve *or* invent when the corpus misses — no abstain path.
- Evaluating an agent with a Q&A rubric (BLEU on the chat) instead of world state.
- Evaluating RAG with a task success rate that ignores citations.
- One shared context window stuffed with 80 tools *and* 40 chunks, then wondering about tool loops.

## How to talk about it

"I would ask whether the user needs a cited answer or a state change. Cited answer: RAG, permissions on the index, faithfulness eval. State change: tools, workflow if the path is known, agent loop only if it is not. Retrieval can be a tool inside the agent. I would not stand up an agent to search a help center."

If they push on "but agents are more general": generality is how you get skipped repro and surprise emails. Buy generality when the task distribution is actually wide.

## Cross-links

- [Tools that are safe to call twice](./tool-calling.md) (id: tool-calling)
- [Eval harness versus agent harness](./eval-harness-vs-agent-harness/lesson.md) (id: eval-harness-vs-agent-harness)
- [Start evals from real failures](./how-to-run-proper-evals.md) (id: how-to-run-proper-evals)
- [Outcome versus transcript](./outcome-vs-transcript.md) (id: outcome-vs-transcript)
- [LLM serving](../system-design/foundations/llm-serving.md) (id: llm-serving)
- [Graders: code, model, human](./graders.md) (id: graders)
