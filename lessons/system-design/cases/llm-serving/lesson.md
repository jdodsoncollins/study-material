---
id: llm-serving
title: Batching tokens onto scarce GPUs
slug: llm-serving
kind: case-study
track: system-design
difficulty: deep
estimated_minutes: 20
summary: Kiln serves tokens by batching, paging a KV cache, and queuing work because the GPU, not the JSON API, is the scarce resource.
tags:
  - system-design
  - system-design/product-cases
  - system-design/genai
  - system-design/messaging
  - interviews
  - interviews/system-design
  - interviews/ai
prerequisites:
  - interview-framework
  - queues-delivery
  - job-scheduler
related:
  - job-scheduler
  - queues-delivery
  - eval-harness-vs-agent-harness
  - tool-calling
  - interview-framework
company_signal:
  - name: OpenAI
    evidence: Candidate-reported 2025–26 roundups describe GPU job scheduling (Sora-style long generations) as a cousin of token serving; confidence is low-medium.
    year: 2026
    confidence: low
  - name: Anthropic
    evidence: Prep-site frequency and public harness essays make "how the serving loop batches and tools" a 2025–26 interview category, distinct from classic CRUD design.
    year: 2026
    confidence: medium
sources_consulted:
  - meta/RESEARCH.md (Sora-style GPU scheduler, LLM/RAG new category)
  - Public 2025–26 serving notes on continuous batching and KV cache (consulted, not copied)
  - Anthropic eval-harness vocabulary (for the agent-vs-serving split)
updated: 2026-09-02
status: canonical
---

# Batching tokens onto scarce GPUs

## Snapshot

- Product: **Kiln**, an internal LLM serving layer for a coding assistant and a short-form video generator. Two shapes share a queue philosophy and *not* a runtime.
- Token serving: a GPU wants **continuous batches** of decode steps. The scarce memory is the **KV cache** per live sequence, not the weights (weights are shared).
- Long jobs (Sora-style video, big fine-tunes): minutes to hours, closer to [Clockyard](../job-scheduler/lesson.md) (id: job-scheduler) leases than to a 50 ms token loop.
- The JSON API is a lie if you skip admission control. When GPUs are full, you **queue or reject**, you do not start a 14th sequence on an 80 GB card.

## What this round is actually scoring

2025–26 category: can you talk about batching, KV memory, and queues without hand-waving "we will scale the model"? Interviewers also want you to separate **serving** (Kiln) from the **agent harness** (tools, retries, stop conditions) and the **eval harness** (how you score it). See [eval-harness-vs-agent-harness](../../../ai-agents/eval-harness-vs-agent-harness/lesson.md) (id: eval-harness-vs-agent-harness).

## Company signal

Candidate-reported OpenAI-shaped rounds (Sora-style GPU schedulers) plus a broader 2025–26 LLM/RAG/coding-assistant design category. Confidence: **low** for a specific Sora scheduler prompt, **medium** for "design LLM serving / a coding assistant backend" as a family. Prep-site frequency is rising; this is not an official bank.

## Requirements

| Functional | v1 decision |
| --- | --- |
| Chat completions, streaming | SSE tokens, client can cancel |
| Tool-calling round trips | Pause decode, run tools, resume with prefix | 
| Video / long GPU jobs | Separate **JobLane**, not the token pool |
| Fairness | Per-tenant tokens of credit |
| Eval traffic | Same serving path, marked `eval=true` |

| Non-functional | Budget |
| --- | --- |
| Interactive p50 TTFT | 200 ms when not queued |
| Interactive p99 | Includes queue time; publish it separately |
| GPU memory | 80 GB class, weights 40 GB, rest is KV |
| Admission | Never overcommit KV to swap on the hot pool |
| Failure | Cancel is prompt; retry is at-least-once on JobLane |

## Back-of-envelope

Weights 40 GB on an 80 GB GPU → **~40 GB for KV**. A 32k-context sequence at a typical 16-bit KV might cost on the order of **a few GB**. That is why "concurrent 32k chats" is a single-digit number per GPU, not hundreds.

Interactive fleet: 64 GPUs. If each holds 8 live sequences, 512 in-flight. At 40 tokens/s/sequence decode, you have plenty of tokens — until everyone sends a 20k prefix at 17:00 and prefill saturates.

Prefill (prompt) is compute-heavy; decode is memory-bandwidth-heavy. **BatchWaiter** groups arriving prefills for a few milliseconds so the GPU does one fat kernel instead of 12 skinny ones. Too much wait and TTFT dies.

Video JobLane: 10-minute gens, 8 dedicated GPUs. Throughput is jobs/hour, not tokens/s. Queue in Clockyard, lease the GPU, heartbeat, DLQ on poison checkpoints.

## Design

[batch](viz/batch.md)

**Front door**: auth, [QuotaDesk](../rate-limiter/lesson.md) (id: rate-limiter) per tenant, then **Queue**. Interactive queue is small and expires (fail the request after 5s waiting). JobLane queue is durable.

**BatchWaiter** + **KVBlock**:

- New request: estimate KV pages from `max_tokens + prompt_len`. If the pool cannot reserve pages, stay in queue.
- Prefill, then decode in a continuous batch: every step, the GPU runs whatever sequences are live. Finished sequences free pages; the waiter admits the next.
- Cancel: drop from the batch, free KV immediately.

Tool calls: the sequence **yields** (KV stays reserved for a bounded time) while the [tool-calling](../../../ai-agents/tool-calling/lesson.md) (id: tool-calling) harness talks to tools. Bound that pause or you have a KV leak. Long tools should snapshot KV to host memory and give the pages back.

JobLane (Sora cousin): Clockyard run, GPU lease, progress checkpoints in object storage. A crash resumes from the last checkpoint, not from token 0. Different SLO, different dashboards, **do not** mix these workers with interactive decode.

Eval: same Kiln, but eval traffic cannot starve interactive. Separate credit pool. Scores belong in the eval harness, not in Kiln.

## Tradeoffs

| Choice | Gain | Cost |
| --- | --- | --- |
| Continuous batch vs static batch of 8 | GPU stays busy as sequences finish | Harder isolation; noisy neighbor |
| Reserve KV vs overcommit + swap | Predictable latency | Lower concurrency |
| Yield-on-tool vs evict KV | Fast resume | KV held during a potentially slow tool |
| Interactive + JobLane on one GPU | Utilization | A 10-minute gen wrecks TTFT |

## Failure modes

- KV fragmentation: page allocator (blocks) rather than one contiguous allocation per sequence.
- Retry of a streamed chat: client may already have 40 tokens; use an idempotency key and resume, or accept duplicate prefix and let the client splice. At-least-once is the honest story ([queues-delivery](../../foundations/queues-delivery/lesson.md) (id: queues-delivery)).
- One tenant's 32k prefills: credit tokens, not just QPS.
- GPU ECC / job hang: lease watchdog, fence the device, requeue the JobLane run.

## Follow-ups an interviewer may ask

- Multi-model: one queue per model (different weights), not one magical GPU that swaps 40 GB every request.
- Speculative decoding / smaller draft models: a throughput trick, mention if they zoom.
- Why this is not "design ChatGPT": the product loop is the agent harness; Kiln is the scarce-resource scheduler underneath.

## Cross-links

- [Cron, ad-hoc, leases, and retries](../job-scheduler/lesson.md) (id: job-scheduler)
- [At-least-once, idempotency, and the dead-letter lane](../../foundations/queues-delivery/lesson.md) (id: queues-delivery)
- [Eval harness versus agent harness](../../../ai-agents/eval-harness-vs-agent-harness/lesson.md) (id: eval-harness-vs-agent-harness)
- [Tool calling as a contract](../../../ai-agents/tool-calling/lesson.md) (id: tool-calling)
- [Token buckets and sliding windows at the edge](../rate-limiter/lesson.md) (id: rate-limiter)
- [Forty-five minutes is a navigation problem](../../foundations/interview-framework.md) (id: interview-framework)
- [Chunked playback from ingest to CDN](../video-streaming/lesson.md) (id: video-streaming)
