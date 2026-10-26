---
id: llm-serving
title: Budget model memory and schedule streamed generation
slug: llm-serving
kind: case-study
track: system-design
difficulty: deep
estimated_minutes: 20
summary: Budget model and request memory, schedule prefill and decode, and distinguish stream recovery from a new generation.
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
company_signal: []
sources_consulted:
  - https://arxiv.org/abs/2309.06180
updated: 2026-10-26
status: canonical
---

# Budget model memory and schedule streamed generation

## Snapshot

- Model weights, KV cache, activations, workspaces, and fragmentation all consume memory.
- Prefill and decode have different resource profiles and interact when sharing a device.
- Admission control should budget tokens and memory, not only request count.
- Reconnecting to an existing response is different from generating a new response.

## What this round is actually scoring

Whether the service sustains latency targets under mixed prompt lengths, cancellations, and overload without exceeding memory.

## Company signal

This is an original practice scenario. No traceable company-specific frequency evidence is supplied.

## Requirements

| Area | Requirement |
| --- | --- |
| Request | Bounded prompt and output lengths with tenant quotas |
| Stream | Observable time to first token and inter-token latency |
| Schedule | Fairness between short and long requests under overload |
| Recover | Explicit cancellation, reconnect, and failed-generation behavior |

## Back-of-envelope

These are illustrative workload assumptions, not production measurements.

For an illustrative model, KV bytes per sequence are approximately `2 × layers × KV heads × head dimension × cached tokens × bytes per element`. The factor two accounts for keys and values.

With 32 layers, 8 KV heads, dimension 128, 32,768 tokens, and two-byte elements, that is 4 GiB per sequence. An illustrative 80 GiB device with 40 GiB of weights and 8 GiB reserved for other runtime memory leaves 32 GiB for KV storage: at most eight such sequences before additional headroom and allocator effects. Actual model architecture, quantization, prefix sharing, and runtime matter.

A throughput claim such as 512 sequences × 40 tokens/s = 20,480 tokens/s is arithmetic over assumed measurements, not a demonstrated capability. It must be benchmarked with the intended prefill/decode mix.

## Design

### ELI5

Load a model, admit requests that fit, and repeatedly schedule their next work. Long prompts first need processing; each active response then needs memory for its context and repeated decode steps.

[Follow generation scheduling](viz/batch.md)

### Admission and execution

Estimate prompt and maximum output token requirements before admission. Maintain per-tenant request, token, and concurrency budgets. Queue bounded work, reject excess promptly, and expose retry guidance rather than allowing an unbounded wait.

Use continuous batching where supported to replace completed sequences with waiting ones. Chunked prefill or separate prefill/decode resources can reduce interference, but their benefit is workload- and runtime-dependent. Paged KV allocation can reduce wasted memory; it does not remove the need to account for weights and runtime buffers.

Stream identified response events and record cancellation. Reclaim memory after in-flight device work can safely stop using it. For tool waits, keeping, offloading, or recomputing KV state is an engine-specific tradeoff.

If the product supports stream reconnect, persist generated events with sequence IDs and resume the same response from that log. A fresh model call may generate different text; an idempotency key alone does not make it safe to splice a new completion onto an old prefix. Otherwise return an explicit interrupted response and offer a new generation.

## Tradeoffs

| Choice | Benefit | Cost |
| --- | --- | --- |
| Larger batches | Potentially better throughput | Higher waiting time and memory demand |
| Short output caps | Predictable resource bounds | May truncate useful answers |
| Prefix sharing | Less repeated prefill/KV storage | Cache isolation and lifecycle complexity |
| Persisted stream events | Reliable reconnect to one response | Storage and retention cost |

## Failure modes

- Long prompts consume the device: token-aware admission and scheduling protect other work.
- Cancellation leaks memory: track request and device-work lifetimes explicitly.
- A worker dies mid-stream: resume only if the product has a compatible durable recovery mechanism; otherwise mark the response interrupted.
- A checkpoint is loaded under another model/runtime version: validate compatibility before reuse.

## Follow-ups an interviewer may ask

**Easy:** double cached tokens in the example. What happens to KV memory per sequence?

**Medium:** short requests slow down during large prefills. Identify measurements that separate queue delay, prefill, and decode.

**Hard:** reconnect after receiving token event 120. Explain the difference between replaying events from the same response and starting a new stochastic generation.

## Cross-links

- [Schedule occurrences and recover leased work](../job-scheduler/lesson.md) (id: job-scheduler)
- [At-least-once, idempotency, and the dead-letter lane](../../foundations/queues-delivery/lesson.md) (id: queues-delivery)
- [Separate the system doing the work from the system measuring it](../../../ai-agents/eval-harness-vs-agent-harness/lesson.md) (id: eval-harness-vs-agent-harness)
- [Make tool contracts enforceable](../../../ai-agents/tool-calling/lesson.md) (id: tool-calling)
- [Enforce request budgets across servers](../rate-limiter/lesson.md) (id: rate-limiter)
- [Forty-five minutes is a navigation problem](../../foundations/interview-framework.md) (id: interview-framework)
- [Publish renditions and serve adaptive playback](../video-streaming/lesson.md) (id: video-streaming)
