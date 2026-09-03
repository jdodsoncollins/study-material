---
id: tool-calling
title: Tools that are safe to call twice
slug: tool-calling
kind: concept
track: ai-agents
difficulty: core
estimated_minutes: 14
summary: Tool schemas should be tight, retries should be idempotent, and irreversible actions should require a confirm the eval actually checks.
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
company_signal:
  - name: Anthropic
    evidence: Public agent-harness writing treats tool design (schemas, stop conditions, permissions) as the harness, not the model.
    year: 2026
    confidence: high
sources_consulted:
  - Anthropic, Building effective agents
  - Fowler / Boeckeler, Agent = Model + Harness
  - Stripe-style idempotency notes as applied to agent tools
updated: 2026-09-02
status: canonical
---

# Tools that are safe to call twice

## Snapshot

- A tool is an API the model can invoke. The **schema**, the **side effects**, and the **error text** are part of the agent harness.
- Tight JSON schemas beat a kitchen-sink `run_anything(cmd: str)`.
- Anything that moves money, sends mail, or deletes state needs **idempotency** and, if it cannot be undone, a **confirm** step the grader enforces.
- Agents retry. If a retry is a double charge, the bug is the tool, not the model.

## Why it shows up in interviews

"Design the tools" is the agent version of "design the API." Interviewers want idempotency keys, least privilege, and a story for irreversible actions — the same instincts as [queues and delivery](../system-design/foundations/queues-delivery.md) (id: queues-delivery) and [job schedulers](../system-design/cases/job-scheduler.md) (id: job-scheduler), now sitting under a stochastic caller.

## Core idea

Assume every tool will be called zero times, once, twice with the same args, and once with wrong args. Design for all four.

- **Schema.** Required fields, enums, descriptions that name units (`cents`, `user_id`, not "the customer"). Extra properties forbidden. One job per tool.
- **Idempotency.** `refund(order_id, amount_cents, idempotency_key)` stores a ledger keyed by that tuple. Retry = read the same row. This is the same pattern as at-least-once consumers.
- **Confirm.** `delete_account` and `send_blast` do not mutate on first call. They return a `preview_id`. A second tool, or a typed confirm, spends it. The [outcome/transcript split](./outcome-vs-transcript.md) (id: outcome-vs-transcript) matters: here the *path* is product policy.
- **Errors.** Return a structured reason the model can branch on (`INSUFFICIENT_INVENTORY`, not a 500 HTML page).
- **Surface area.** Twenty sharp tools beat eighty overlapping ones. Overlap is how you get loops. See [agent mistakes](./agent-mistakes.md) (id: agent-mistakes).

The eval harness must expose the *same* tools as production, including the confirm dance. A cousin tool set measures a cousin agent.

## Comparison

| Tool | Retry if the client times out | Confirm required | Eval check |
| --- | --- | --- | --- |
| `get_order(order_id)` | Safe, read-only | No | Schema + fixture row |
| `refund(..., idempotency_key)` | Must not double-pay | No, but ledger is the safety | Exactly one ledger row after two identical calls |
| `adjust_inventory(sku, delta)` | Needs an idempotency key or a desired-absolute | No | Net delta, never negative |
| `send_email(user_id, body)` | Dedup on `(user_id, thread_id, body_hash)` | Maybe, if blast-sized | Fixture count == 1 |
| `delete_account(user_id)` | Must not delete on a replay of step 1 | Yes, `preview_id` | No delete unless confirm span exists |

Harborline learned this when the agent retried `refund` after a 504 and the customer got `$48`. The model did what any at-least-once worker does. The tool was not a worker.

## Common mistakes

- One `sql_query` / `shell` tool and a prayer. Least privilege is a schema problem.
- Idempotency key generated inside the tool instead of passed in, so the agent's retry is a new key.
- Confirm implemented only in the system prompt ("always ask the user") with no second tool and no grader.
- Error strings that change every call, so the model cannot pattern-match.
- Silent success on unknown fields (typo `ammount_cents` ignored, refunds 0).
- Different tool names in eval and prod ("we mocked Stripe as `fake_charge`").

## How to talk about it

"I treat tools as an API for a caller who retries and hallucinates fields. Tight schemas, idempotency keys on anything with a side effect, confirm-plus-preview for deletes and blasts, structured errors, and the eval uses the production tool surface. If we cannot make a call safe to retry, we do not let the agent call it without a human in the loop."

Tie it to serving limits if they ask about load: tool fan-out is a [serving](../system-design/foundations/llm-serving.md) (id: llm-serving) and queueing problem, not a prompt problem.

## Cross-links

- [Mistakes coding agents keep making](./agent-mistakes.md) (id: agent-mistakes)
- [Eval harness versus agent harness](./eval-harness-vs-agent-harness/lesson.md) (id: eval-harness-vs-agent-harness)
- [Vendor harness versus user harness](./vendor-vs-user-harness.md) (id: vendor-vs-user-harness)
- [Outcome versus transcript](./outcome-vs-transcript.md) (id: outcome-vs-transcript)
- [Queues and delivery](../system-design/foundations/queues-delivery.md) (id: queues-delivery)
- [Job scheduler](../system-design/cases/job-scheduler.md) (id: job-scheduler)
