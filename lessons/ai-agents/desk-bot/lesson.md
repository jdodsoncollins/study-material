---
id: desk-bot
title: Build a chat assistant with durable jobs and authorized tools
slug: desk-bot
kind: case-study
track: ai-agents
difficulty: core
estimated_minutes: 22
summary: Acknowledge verified chat requests after durable intake, then run bounded jobs with authorized tools.
tags:
  - ai-agents
  - ai-agents/product
  - ai-agents/harnesses
  - ai-agents/tools
  - interviews
  - interviews/ai
  - interviews/system-design
prerequisites:
  - eval-harness-vs-agent-harness
  - tool-calling
related:
  - tool-calling
  - traces-trajectories
  - queues-delivery
  - payment-idempotency
  - vendor-vs-user-harness
  - agent-mistakes
company_signal: []
sources_consulted:
  - https://docs.slack.dev/interactivity/implementing-slash-commands/
  - https://docs.slack.dev/apis/events-api/
  - https://docs.slack.dev/authentication/verifying-requests-from-slack/
updated: 2026-10-26
status: canonical
---

# Build a chat assistant with durable jobs and authorized tools

## Snapshot

- Acknowledge incoming platform requests quickly, then do long work asynchronously.
- Normalize different platform payloads instead of assuming one event envelope.
- Persist accepted work before acknowledging it as accepted.
- Enforce user authority and any required confirmation at the tool boundary.

## What this round is actually scoring

Whether a slow, retrying agent remains responsive and avoids lost jobs, unauthorized actions, or duplicate effects.

## Company signal

This is an original practice scenario. No traceable company-specific frequency evidence is supplied.

## Requirements

| Area | Requirement |
| --- | --- |
| Invoke | Support a slash command and mentions with distinct payload handling |
| Respond | Acknowledge within the platform deadline; post progress/results asynchronously |
| Tools | Read authorized orders and prepare drafts; protected actions follow explicit approval policy |
| Recover | Persist jobs, bound retries, and represent uncertain external outcomes |

## Back-of-envelope

These are illustrative workload assumptions, not production measurements.

Assume two accepted jobs/s on average, twenty seconds of mean in-system time, and a stable workload. Little's law gives about forty concurrent jobs on average. At twenty jobs/s and the same mean duration, that becomes about 400; a worst-case duration is not interchangeable with a mean in this calculation.

At 2,000 tokens/job and two jobs/s sustained all day, consumption is about 345.6 million tokens/day. Measure the actual duration, token distribution, and burst behavior before sizing workers.

## Design

### ELI5

Verify the request, save a durable ticket, acknowledge receipt, and let a bounded worker handle the ticket. The worker can use only tools authorized for that user. Its final message reflects the recorded outcome.

[Follow request intake](viz/hook.md)

### Platform intake

Verify the signature against the raw body and check timestamp freshness. Resolve the installation and authenticated user before accepting work. Slash commands have form payloads and do not supply an Events API `event_id` or a message-thread envelope. Slack's documented slash-command acknowledgement deadline is three seconds; custom slash commands cannot be invoked in message threads. Use an ephemeral acknowledgement and an appropriate later response path.

For Events API mentions, use the outer `event_id` for delivery deduplication and the nested event's conversation/message fields for reply context. Normalize both inputs into an internal job record; do not invent missing payload fields. For slash redelivery, use a documented request identifier if available or a scoped fingerprint of the verified delivery within its replay window, with an explicit retention policy.

Atomically store the accepted-delivery record and durable job/outbox entry before acknowledging accepted work. Do not set a standalone dedup flag and then enqueue: a crash between those operations loses the job. Post any progress message asynchronously after acknowledgement, not as a prerequisite that consumes the deadline.

### Worker and authority

[Follow the bounded tool loop](viz/loop.md)

The worker receives trusted user/tenant context and narrow tool capabilities. `lookup_order(order_id)` checks authorization; tool output and retrieved messages remain untrusted data. Apply time, token, and action budgets.

When approval is required, a verified interactive action binds the user to an exact preview, payload hash, operation ID, and expiry. An agent-generated “confirmed” message is insufficient. Persist the operation state and use downstream idempotency where supported. If posting a message times out after acceptance, reconcile or record uncertainty; a local dedup table cannot guarantee that an external message was never duplicated.

## Tradeoffs

| Choice | Benefit | Cost |
| --- | --- | --- |
| Durable intake before acknowledgement | Recover accepted jobs | Intake must stay within the response deadline |
| Separate channel payload adapters | Correct event identity and reply context | More explicit integration code |
| Narrow user-scoped tools | Enforced access boundaries | Authorization checks on every operation |
| Editable progress message | Less channel noise | Must recover the message identity after uncertain posting |

## Failure modes

- Intake storage is unavailable: do not acknowledge durable acceptance that did not happen.
- Duplicate platform delivery: return the existing job outcome under the delivery policy.
- Worker crashes after an external action: resume the operation with its stable identity or reconcile uncertainty.
- User loses permission while the job waits: recheck authority before the protected action.
- The model runs out of budget: report the partial result and unresolved work accurately.

## Follow-ups an interviewer may ask

**Easy:** explain why slash-command input and a mention event need different parsers.

**Medium:** crash after storing a dedup marker but before enqueueing. Replace that sequence with an atomic durable intake.

**Hard:** the user approves one invoice preview, then the proposed amount changes. Explain why the old approval cannot authorize the new payload.

## Cross-links

- [Make tool contracts enforceable](../tool-calling/lesson.md) (id: tool-calling)
- [Separate the system doing the work from the system measuring it](../eval-harness-vs-agent-harness/lesson.md) (id: eval-harness-vs-agent-harness)
- [Use observable execution evidence to diagnose failures](../traces-trajectories.md) (id: traces-trajectories)
- [Make a payment retry refer to one operation](../../system-design/cases/payment-idempotency/lesson.md) (id: payment-idempotency)
- [Evaluate the configuration you actually deploy](../vendor-vs-user-harness.md) (id: vendor-vs-user-harness)
- [Diagnose agent failures before changing the prompt](../agent-mistakes.md) (id: agent-mistakes)
