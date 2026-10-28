---
id: cost-latency-budgets
title: Do the token math before picking a model
slug: cost-latency-budgets
kind: concept
track: ai-agents
difficulty: core
estimated_minutes: 15
summary: Estimate per-request and daily cost from input, cached, and output tokens, estimate latency from time to first token plus decode speed, and use caching, batching, streaming, and model tiers to hit a budget.
tags:
  - ai-agents
  - ai-agents/models
  - ai-agents/product
  - system-design
  - system-design/genai
  - interviews
  - interviews/ai
prerequisites:
  - llm-basics
related:
  - llm-basics
  - llm-serving
  - fine-tune-vs-prompt-vs-retrieve
  - request-budget
company_signal: []
sources_consulted:
  - https://arxiv.org/abs/2309.06180
updated: 2026-10-28
status: canonical
---

# Do the token math before picking a model

## Snapshot

- Hosted model APIs commonly bill **input** and **output** tokens at separate rates, with output usually the more expensive of the two. Prices and discounts change often; every number here is invented for the arithmetic and dated October 2026.
- **Latency ≈ time to first token + output tokens ÷ decode speed.** Long prompts raise the first term; long answers dominate the second.
- **Prompt caching** discounts a repeated prompt prefix. **Batch** endpoints, where offered, trade hours of delay for a lower price. **Streaming** shortens perceived wait, not total time.
- **Model tiers:** route easy, high-volume work to a smaller model and escalate the hard cases. Measure quality per tier before routing.

## Why it shows up in interviews

"Would this be affordable at our volume?" and "why does it feel slow?" are the first questions a staff engineer or product lead asks about an AI feature. A design that ignores token math can be off by 10x in cost. Interviewers want a quick, explicit estimate and a list of levers, not a guess about which model is "best".

## Core idea

### ELI5

A taxi meter with two rates: one for the distance you describe to the driver (input), a higher one for the distance driven (output). If you repeat the same directions every ride, some companies give you a discount for that repeated part (caching). Riding at night, when cabs are idle, is cheaper but you wait (batch). A smaller car is cheaper and quicker for short trips, but cannot carry everything (model tiers).

1. Count tokens per request: fixed instructions, variable input, retrieved context, expected output.
2. Multiply by rates and by requests per day.
3. Estimate latency from first-token time and output length.
4. Pull the levers that cut the biggest term first.

### The arithmetic

```ts
// Illustrative prices per million tokens, invented for this lesson (not any provider's list price)
type Tier = { name: string; inPerM: number; cachedInPerM: number; outPerM: number; ttftMs: number; outTokPerSec: number };
const small: Tier = { name: "small", inPerM: 0.5, cachedInPerM: 0.05, outPerM: 2, ttftMs: 300, outTokPerSec: 150 };
const large: Tier = { name: "large", inPerM: 5, cachedInPerM: 0.5, outPerM: 20, ttftMs: 900, outTokPerSec: 50 };

function budget(t: Tier, requestsPerDay: number, inTokens: number, cachedShare: number, outTokens: number) {
  const cached = inTokens * cachedShare;
  const fresh = inTokens - cached;
  const perRequest = (fresh * t.inPerM + cached * t.cachedInPerM + outTokens * t.outPerM) / 1e6;
  const latencyMs = t.ttftMs + (outTokens / t.outTokPerSec) * 1000;
  return {
    tier: t.name,
    perRequestUsd: Number(perRequest.toFixed(5)),
    perDayUsd: Math.round(perRequest * requestsPerDay),
    latencySec: Number((latencyMs / 1000).toFixed(1)),
  };
}

// Inbox triage: 200k emails/day, 3,000-token prompt (2,400 of it a fixed instruction prefix), 60-token label
console.log(budget(small, 200_000, 3000, 0, 60));   // $324/day, 0.7 s
console.log(budget(small, 200_000, 3000, 0.8, 60)); // $108/day with the prefix cached
console.log(budget(large, 200_000, 3000, 0.8, 60)); // $1,080/day, 2.1 s
// Reply drafting: same prompt, 400-token draft
console.log(budget(large, 20_000, 3000, 0.8, 400)); // $244/day, 8.9 s: output dominates
```

The model ignores some real costs: some providers charge extra to *write* a cache entry, retries and failed validations add calls, and agent loops multiply everything by the number of steps. Add those as multipliers once you know them.

### Levers

| Lever | What it cuts | Catch |
| --- | --- | --- |
| Shorter prompt, fewer retrieved chunks | Input cost, time to first token | Can drop needed context; re-run evals |
| Put stable text first, enable prompt caching | Cost and often latency of the repeated prefix | Only exact prefix matches hit; cache entries expire |
| Cap output length, ask for terse formats | Output cost and decode time | Truncated answers; set a max and check for it |
| Batch endpoint for offline jobs | Price, where offered | Results arrive later (often hours) |
| Streaming | Perceived latency | Total time unchanged; UI must handle partial output and cancellation |
| Smaller model or router | Cost and latency per call | Quality loss on hard cases; measure per slice |
| Parallel independent calls | Wall-clock time | Same or higher total cost; rate limits |
| Cache whole answers for repeated questions | Entire call | Staleness and per-user data must not leak across users |

## Worked example

### Easy

Triage on the small tier costs $324/day uncached. Moving the fixed 2,400-token instruction block to the front and enabling caching gives $108/day in this model. That is the first lever because it changes no behavior.

### Medium

Product wants the large model for triage "for quality". At $1,080/day versus $108, ask what the quality difference is on the labeled set. If the small model is within a point overall but worse on the `legal` label, route only emails the small model marks low-confidence or `legal` to the large one. At 10% escalation the blended cost is about $108 + $108 ≈ $216/day.

### Hard

Drafting replies takes 8.9 s on the large tier; users abandon after about 3 s. The 400 output tokens at 50 tokens/s are 8 s of it, so prompt trimming barely helps. Stream the draft so the first words appear after about 0.9 s, cap drafts at 200 tokens with a "longer" button, and test whether the small tier's drafts pass review. Decode-bound latency is solved on the output side.

**Practice:** an agent takes 6 tool-using steps per task, each resending a growing context that averages 8,000 input tokens and produces 300 output tokens. Using the large tier numbers above, estimate the cost per task, then name the two levers you would try first.

## Common mistakes

- Quoting a model price as a fact without a date or source; prices change.
- Estimating from the prompt alone and forgetting output, retries, and agent steps.
- Putting variable text (user name, timestamp) at the start of the prompt and defeating prefix caching.
- Expecting streaming to reduce cost or total time.
- Switching tiers on overall accuracy without checking the slices that matter.
- Caching full answers across users when answers depend on private data.

## How to talk about it

"Let me do the token math: about 3,000 input tokens with a 2,400-token stable prefix, 60 output tokens, 200,000 requests a day. With today's prices for the tiers we are considering, that is roughly this per day. Latency is first-token time plus output length over decode speed, so for short labels the prompt matters and for drafts the output does. I would cache the prefix, cap output, batch the offline jobs, and route only hard cases to the larger model after measuring both on our eval set."

## Cross-links

- [Predict a token, sample it, repeat](./llm-basics.md) (id: llm-basics)
- [Budget model memory and schedule streamed generation](../system-design/cases/llm-serving/lesson.md) (id: llm-serving)
- [Choose prompting, retrieval, or fine-tuning](./fine-tune-vs-prompt-vs-retrieve.md) (id: fine-tune-vs-prompt-vs-retrieve)
- [A budget for in-flight requests](../cs/request-budget.md) (id: request-budget)
- [Remembering the expensive answer nearby](../system-design/foundations/caching/lesson.md) (id: caching)
