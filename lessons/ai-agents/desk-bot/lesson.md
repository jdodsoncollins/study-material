---
id: desk-bot
title: A clerk in the chat that is allowed to wait
slug: desk-bot
kind: case-study
track: ai-agents
difficulty: core
estimated_minutes: 22
summary: DockDesk is an agent behind a chat slash command; the design is verify-then-queue, an idempotent tool loop, and a reply that Slack retries cannot double-post.
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
company_signal:
  - name: Slack
    evidence: Candidate-reported "build a Slack bot / assistant" prompts at product and infra companies now assume an LLM loop, not a regex, and score retries, permissions, and thread replies.
    year: 2026
    confidence: medium
  - name: OpenAI
    evidence: Public assistant-in-chat product talks and candidate-reported AI-round design questions use a messaging surface as the harness boundary.
    year: 2026
    confidence: medium
sources_consulted:
  - Slack retry / Events API idempotency notes
  - Anthropic effective-agents loop (tools, stop, permissions)
  - Stripe-style idempotency as applied to chat actions
updated: 2026-09-02
status: canonical
---

# A clerk in the chat that is allowed to wait

## Snapshot

- Product: **DockDesk** lives in **YardWire** (the warehouse chat). `/desk where is N-4` should answer in the thread. `/desk page nights on N-4` may page a human.
- Chat platforms retry HTTP. If you model-call on the webhook, you will post twice and page twice.
- Split: **WireHook** verifies and acks in < 3s. **DeskJobs** runs the [agent harness](../eval-harness-vs-agent-harness/lesson.md) (id: eval-harness-vs-agent-harness). **ClerkLoop** is the model + tools.
- Tools are the product: `lookup_pallet`, `post_thread`, `page_oncall`. `page_oncall` is irreversible and needs a confirm the eval actually checks.

## What this round is actually scoring

Whether you treat Slack (or Teams, or Discord) as an **at-least-once inbox**, whether the model is off the request path, and whether a tool retry is a double page. "We call GPT in the webhook" is a fail.

## Company signal

Candidate-reported "design a Slack assistant" prompts at AI and product companies, plus public agent-harness writing. Confidence: **medium** (the surface is new-ish; the retry/idempotency instincts are old). Expect event retries, thread replies, and permission scopes.

## Requirements

| Functional | v1 decision |
| --- | --- |
| Slash `/desk …` | Ack in thread immediately, answer later |
| Lookup a pallet | `lookup_pallet(sku)` → bin, last scan |
| Page on-call | `page_oncall(sku, team)` after a confirm emoji |
| Mentions | Same pipeline as slash; `event_id` is the key |
| Permissions | Bot can read the channel it was invited to, nothing else |

| Non-functional | Budget |
| --- | --- |
| Seats | 4,000 warehouse staff |
| Commands | 20/s peak, 2/s average |
| Ack | 2.5s (platform timeout is 3s) |
| Answer p50 | 8s (one model round + one tool) |
| Double post | Never; retries must collapse |

## Back-of-envelope

2/s average × 20s of model+tools worst case → ~40 in-flight jobs. A small worker pool. Tokens: 2/s × 2k tokens/job × 86400 ≈ 350M tokens/day if every message is a novel. It will not be. Cap context to the thread (last 20) plus the tool results.

The 3s ack is the hard number. DNS plus TLS plus verify plus enqueue must fit. The model must not.

## Design

[hook](viz/hook.md)

YardWire POST `/hooks/desk` with `{event_id, user, channel, thread_ts, text, type}`. **WireHook**:

1. Verify the signing secret. Fail closed.
2. Dedup `event_id` in a 24h set. Duplicate → 200 empty. This is the same instinct as [payment keys](../../system-design/cases/payment-idempotency/lesson.md) (id: payment-idempotency).
3. Enqueue **DeskJob** `{event_id, …}`.
4. `chat.postMessage` a placeholder ("looking") **once**, keyed by `event_id`.
5. Return 200.

[loop](viz/loop.md)

**ClerkLoop** (the [user harness](../vendor-vs-user-harness.md) (id: vendor-vs-user-harness), not the vendor's chat agent):

1. Load thread tail + user id + the slash text.
2. Model proposes a tool call or a final answer.
3. Tools:
   - `lookup_pallet(sku)` — read-only, retry-safe.
   - `post_thread(markdown)` — idempotent on `(event_id, part)`. Edits the placeholder rather than posting a new message when possible.
   - `page_oncall(sku, team)` — requires a prior `confirm_page` tool result in this job. Without it, the harness refuses. Retries use `Idempotency-Key: event_id`.
4. Stop when the model emits a final answer, or after 6 tool rounds, or on a budget timer (25s). Then [trace](../traces-trajectories.md) (id: traces-trajectories) the job.

The platform's retry of the webhook never re-enters the model. The job worker is at-least-once; tools make that safe.

## Tradeoffs

| Choice | Gain | Cost |
| --- | --- | --- |
| Queue behind the hook | Makes the 3s budget | User sees "looking" first |
| Edit placeholder vs new messages | No double-post spam | Need `chat.update` scope |
| Confirm tool for page | Eval can check it | Extra round trip |
| Vendor Slack-GPT feature | Faster demo | You do not own retries, traces, or tools |
| Sync model in the webhook | Simpler drawing | Timeouts, double pages, no trace |

## Failure modes

- YardWire retries the POST three times: dedup on `event_id`, one job, one placeholder.
- Model loops on `lookup_pallet`: round cap, then post "I failed, human please."
- `page_oncall` 500: retry with the same key; the pager side must treat it as one page.
- Signing secret rotated: fail closed, on-call on WireHook, do not run jobs unsigned.
- User asks in a channel the bot cannot read: 403 from the API, post a short "invite me."

## Follow-ups an interviewer may ask

- DMs vs channels: same pipeline, different authz.
- Images of pallets: a vision tool, or a link to [RollKeep](../../system-design/cases/blob-store/lesson.md) (id: blob-store).
- Eval: a fixture YardWire that replays `event_id`s and asserts one page, one final post, confirm-before-page. That is the [eval harness](../eval-harness-vs-agent-harness/lesson.md) (id: eval-harness-vs-agent-harness), not a vibe check in prod.

## Cross-links

- [Tools that are safe to call twice](../tool-calling/lesson.md) (id: tool-calling)
- [Eval harness versus agent harness](../eval-harness-vs-agent-harness/lesson.md) (id: eval-harness-vs-agent-harness)
- [Spans, traces, trajectories, and sessions](../traces-trajectories.md) (id: traces-trajectories)
- [Making a double-click charge once](../../system-design/cases/payment-idempotency/lesson.md) (id: payment-idempotency)
- [The harness you rent versus the harness you write](../vendor-vs-user-harness.md) (id: vendor-vs-user-harness)
- [Mistakes coding agents keep making](../agent-mistakes.md) (id: agent-mistakes)
