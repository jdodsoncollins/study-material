---
id: fine-tune-vs-prompt-vs-retrieve
title: Choose prompting, retrieval, or fine-tuning
slug: fine-tune-vs-prompt-vs-retrieve
kind: concept
track: ai-agents
difficulty: core
estimated_minutes: 13
summary: Use prompting for instructions, retrieval for facts that change or need access control, and fine-tuning for stable behavior you can show with many examples, after an eval set proves the simpler option falls short.
tags:
  - ai-agents
  - ai-agents/models
  - ai-agents/retrieval
  - ai-agents/product
  - interviews
  - interviews/ai
prerequisites:
  - prompting-structured-output
  - rag-pipeline
related:
  - prompting-structured-output
  - rag-pipeline
  - cost-latency-budgets
  - how-to-run-proper-evals
company_signal: []
sources_consulted:
  - https://arxiv.org/abs/2005.11401
  - https://arxiv.org/abs/2106.09685
  - https://arxiv.org/abs/2203.02155
updated: 2026-10-28
status: canonical
---

# Choose prompting, retrieval, or fine-tuning

## Snapshot

- **Prompting** changes what the model is told for one call. Fastest to iterate; limited by the window and by how well instructions transfer.
- **Retrieval** changes what the model can read for one call. Best for facts that change, must be cited, or depend on who is asking.
- **Fine-tuning** changes the model's weights from examples. Best for stable behavior (format, tone, a narrow classification) you can demonstrate many times.
- Start with an eval set and a prompt baseline. Move to retrieval or tuning only when measured failures point there; the options combine.

## Why it shows up in interviews

"Should we fine-tune on our docs?" is a common question with a usual answer of "probably not first". Interviewers check whether you separate **knowledge** problems from **behavior** problems, know what each option costs to build and to keep current, and insist on measurement before training.

## Core idea

### ELI5

A new hire at a help desk. **Prompting** is the sticky note on their monitor: "Be brief. Always ask for the order number." **Retrieval** is the searchable binder of current policies they look things up in. **Fine-tuning** is weeks of practice on past tickets until the house style is second nature. You would not retrain someone each time a policy changes; you update the binder. You would not hand them a binder to fix their tone; you coach them.

Questions that decide it:

1. Is the failure missing or outdated **knowledge**, or wrong **behavior** (format, tone, decision rule)?
2. How often does the underlying information change, and must answers cite it?
3. Does access depend on the user (tenant docs, permissions)?
4. Do you have hundreds to thousands of high-quality labeled examples of the desired behavior?
5. Will a smaller tuned model meet a cost or latency target the prompt-only approach cannot?

## Comparison

| Option | Fits when | Data you need | Keeping it current | Typical failure |
| --- | --- | --- | --- | --- |
| Prompt (instructions) | Task is describable; behavior varies by request | A labeled eval set to check changes | Edit text, rerun evals | Instructions ignored on edge cases; prompt grows past the window |
| Prompt + examples (few-shot) | Format or label boundaries are easier to show than describe | A handful of well-chosen examples, plus the eval set | Swap examples | Examples overfit to one style; costs tokens on every call |
| Retrieval (RAG) | Facts change, must be cited, or are per-user/tenant | Clean, chunked source documents with metadata and ACLs; labeled questions | Re-index changed documents | Right document not retrieved; stale chunk retrieved |
| Supervised fine-tuning (full or adapter such as LoRA) | Stable, narrow behavior; strict format; cheaper smaller model needed | Hundreds to many thousands of reviewed input-output pairs, held-out test set | Retrain and re-evaluate when behavior or base model changes | Learns label noise; forgets general skills; does not reliably memorize facts for recall |
| Preference tuning (from ranked outputs) | Quality is easier to compare than to specify | Pairs or rankings of outputs by reviewers | Same as fine-tuning, plus reviewer calibration | Optimizes the reviewers' biases |
| Combination (tuned model + retrieval + prompt) | Behavior and knowledge both matter | All of the above | Each part on its own cadence | Harder to attribute regressions; evaluate each part |

Availability of tuning for a given hosted model, and its pricing, varies by provider and changes over time. Check before committing a plan to it.

## Common mistakes

- Fine-tuning on a document dump to "teach the facts", then finding the model still misstates details and cannot cite sources.
- Expecting tuning to respect per-user permissions; weights cannot enforce access control.
- Skipping the prompt-only baseline, so there is no evidence tuning helped.
- Training on unreviewed logs that include past mistakes or sensitive data.
- Evaluating the tuned model on examples drawn from the training set.
- Forgetting that a base-model upgrade may require re-tuning and re-evaluating.

## How to talk about it

"First I would build an eval set and a prompt baseline. If failures are about missing or changing facts, or answers must cite sources and respect permissions, I add retrieval. If failures are stable behavior problems, such as format or a narrow decision, and we have a few thousand reviewed examples, I would consider fine-tuning, often an adapter on a smaller model to also cut cost. I would compare each option on the held-out set before shipping."

**Practice:** for each request, pick an option and give a one-line reason: (a) answer questions about this week's shipping cutoffs, (b) always produce a ticket summary in a fixed four-field format, (c) match the brand voice in marketing emails, (d) classify 2 million chat messages a day into 12 intents under a strict cost cap.

## Cross-links

- [Ask for structure, then verify it](./prompting-structured-output.md) (id: prompting-structured-output)
- [Build retrieval that the answer can cite](./rag-pipeline/lesson.md) (id: rag-pipeline)
- [Do the token math before picking a model](./cost-latency-budgets.md) (id: cost-latency-budgets)
- [Build an evaluation from the task contract](./how-to-run-proper-evals.md) (id: how-to-run-proper-evals)
- [Measure new capabilities and protect established behavior](./capability-vs-regression.md) (id: capability-vs-regression)
