---
id: tool-calling
title: Make tool contracts enforceable
slug: tool-calling
kind: concept
track: ai-agents
difficulty: core
estimated_minutes: 14
summary: Enforce tool authorization, semantic validation, replay behavior, and any required scoped user approval.
tags:
  - ai-agents
  - ai-agents/tools
  - ai-agents/harnesses
  - interviews
  - interviews/ai
prerequisites:
  - eval-harness-vs-agent-harness
related:
  - agent-mistakes
  - vendor-vs-user-harness
  - eval-harness-vs-agent-harness
  - outcome-vs-transcript
  - rag-vs-agents
  - desk-bot
company_signal: []
sources_consulted:
  - https://json-schema.org/understanding-json-schema
  - https://docs.stripe.com/api/idempotent_requests
updated: 2026-10-26
status: canonical
---

# Make tool contracts enforceable

## Snapshot

- A tool schema defines inputs; the implementation must enforce authorization and semantics.
- Distinguish read-only queries from operations with external effects.
- Idempotency keys identify logical operations, with conflicts detected separately.
- Confirmation, when required, must come from trusted user interaction scoped to the action.

## Why it shows up in interviews

A well-formed function call can still target the wrong tenant, use the wrong unit, or repeat an uncertain side effect. Explain the contract at the implementation boundary.

## Core idea

### ELI5

Treat a model's proposed call as a request to a service. The service validates the shape, the meaning, and the caller's authority before doing anything.

[Follow validation and execution](viz/call.md)

Use explicit units, bounded inputs, and clear result states. Resolve the authenticated user and tenant from trusted context; do not grant access merely because the model supplies a tenant ID. Treat retrieved text and tool results as data, not as authority to change permissions or instructions.

For a mutation, scope an idempotency key to the authenticated principal and operation. Store a separate canonical payload fingerprint and reject reuse with a different payload. Including the amount in the key itself would allow a changed amount to become a new operation instead of detecting the conflict.

If product policy requires confirmation, present the exact action and bind the user's trusted approval to that payload, identity, and expiry. A model calling `confirm()` is not user approval. Existing authorization may already cover an action; confirmation rules should reflect the product's real policy.

## Worked example

### Easy

`lookup_order(order_id)` verifies that the authenticated user can read that order. A syntactically valid order ID belonging to another tenant returns no protected data.

### Medium

`create_invoice` accepts amounts in integer cents and an operation ID. A retry with the same payload returns the existing invoice. The same operation ID with a different amount returns a conflict. Two genuinely separate identical invoices use distinct operation IDs; a body hash alone would conflate them.

### Hard

The provider times out after an email submission. Record the uncertain state and use the provider's idempotency or lookup contract. Local deduplication alone cannot determine whether the email was sent. Similarly, an absolute “set inventory to 5” can overwrite another update unless it includes a version/invariant check.

**Practice:** list three checks missing from a schema that accepts `{tenant_id, order_id, amount}`. Check trusted tenant authorization, order ownership/state, and amount units/range before discussing model prompting.

## Common mistakes

- Treating JSON-schema validity as authorization.
- Allowing external content to expand tool permissions.
- Using a new key after an uncertain result from the previous operation.
- Letting the agent approve its own proposed action when user approval is required.
- Returning only “error” when callers need to distinguish rejection, retryable failure, and unknown outcome.

## How to talk about it

“The model proposes an operation; the tool enforces identity, authorization, invariants, and replay behavior. I will make uncertain outcomes explicit and bind any required user approval to the exact action.”

## Cross-links

- [Diagnose agent failures before changing the prompt](../agent-mistakes.md) (id: agent-mistakes)
- [Separate the system doing the work from the system measuring it](../eval-harness-vs-agent-harness/lesson.md) (id: eval-harness-vs-agent-harness)
- [Evaluate the configuration you actually deploy](../vendor-vs-user-harness.md) (id: vendor-vs-user-harness)
- [Grade the result and the constraints that matter](../outcome-vs-transcript/lesson.md) (id: outcome-vs-transcript)
- [At-least-once, idempotency, and the dead-letter lane](../../system-design/foundations/queues-delivery/lesson.md) (id: queues-delivery)
- [Schedule occurrences and recover leased work](../../system-design/cases/job-scheduler/lesson.md) (id: job-scheduler)
- [Build a chat assistant with durable jobs and authorized tools](../desk-bot/lesson.md) (id: desk-bot)
