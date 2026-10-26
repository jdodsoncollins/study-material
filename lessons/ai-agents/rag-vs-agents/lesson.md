---
id: rag-vs-agents
title: Choose retrieval, a workflow, or an adaptive loop
slug: rag-vs-agents
kind: concept
track: ai-agents
difficulty: intro
estimated_minutes: 12
summary: Choose a retrieval workflow or bounded adaptive loop from the task’s uncertainty and evidence requirements.
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
company_signal: []
sources_consulted:
  - https://www.anthropic.com/research/building-effective-agents
updated: 2026-10-26
status: canonical
---

# Choose retrieval, a workflow, or an adaptive loop

## Snapshot

- Retrieval-augmented generation supplies retrieved material as context for generation.
- Retrieval can involve several queries, reranking, or iterative refinement.
- An agent selects actions dynamically; those actions may be entirely read-only.
- Use the simplest control flow that meets the task and evidence requirements.

## Why it shows up in interviews

A task does not require an adaptive loop merely because it uses an LLM or search. Conversely, some investigations cannot be represented well by one fixed retrieve-and-answer sequence.

## Core idea

### ELI5

A retrieval pipeline finds relevant evidence and uses it to answer. A fixed workflow follows predefined stages. An agent can decide what to do next based on results. These approaches can be combined: an agent may use retrieval, and a retrieval system may contain several deterministic stages.

[Compare control flows](viz/split.md)

Choose from the task's uncertainty. A product FAQ with predictable questions may work well with retrieval, reranking, and grounded generation. Investigating why an order is delayed may require choosing between order state, shipment events, and a follow-up question. That can justify a bounded adaptive loop even if every tool is read-only.

Neither retrieval nor an agent guarantees factual answers. Evaluate whether relevant evidence was retrieved, whether claims are supported, whether the answer addresses the question, and whether access controls were respected. When evidence is insufficient, the system needs a clear uncertainty or escalation behavior.

## Worked example

### Easy

A user asks for the refund window. Retrieve the applicable policy version and quote or summarize the relevant condition with a source. Do not silently substitute a policy from another region or date.

### Medium

A search returns several related documents but omits the exception that governs this order. A fluent answer can be grounded in the wrong subset. Inspect retrieval coverage and the final answer separately.

### Hard

The user asks why a specific order is delayed. A bounded read-only agent checks authorized order state, follows the relevant shipment reference, and asks for clarification only when needed. Set budgets and stopping rules so an inconclusive search does not loop forever.

**Practice:** decide whether a fixed workflow would suffice if the investigation always follows the same three checks. Explain what new uncertainty would justify dynamic tool selection.

## Common mistakes

- Defining RAG as necessarily one retrieval call.
- Defining an agent as necessarily having write tools.
- Treating retrieved text as trusted instructions.
- Measuring answer style while ignoring retrieval misses or cross-tenant leaks.
- Adding a loop without a stopping criterion or a measurable benefit.

## How to talk about it

“I will begin with a fixed retrieval workflow if the path is predictable. If the next step depends materially on observed results, I will evaluate a bounded adaptive loop and measure the added cost and success.”

## Cross-links

- [Make tool contracts enforceable](../tool-calling/lesson.md) (id: tool-calling)
- [Separate the system doing the work from the system measuring it](../eval-harness-vs-agent-harness/lesson.md) (id: eval-harness-vs-agent-harness)
- [Build an evaluation from the task contract](../how-to-run-proper-evals.md) (id: how-to-run-proper-evals)
- [Grade the result and the constraints that matter](../outcome-vs-transcript/lesson.md) (id: outcome-vs-transcript)
- [Budget model memory and schedule streamed generation](../../system-design/cases/llm-serving/lesson.md) (id: llm-serving)
- [Choose a grader for the evidence available](../graders/lesson.md) (id: graders)
