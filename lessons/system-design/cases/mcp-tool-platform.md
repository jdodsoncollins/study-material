---
id: mcp-tool-platform
title: Design a tool platform with scopes and an audit log
slug: mcp-tool-platform
kind: case-study
track: system-design
difficulty: core
estimated_minutes: 18
summary: Register tools an agent may call, scope each one, make side effects idempotent, and keep an audit trail.
tags:
  - system-design
  - system-design/product-cases
  - system-design/genai
  - interviews
  - interviews/system-design
  - interviews/ai
prerequisites:
  - tool-protocols
  - authn-authz
  - prompt-injection-guardrails
related:
  - tool-protocols
  - prompt-injection-guardrails
  - tool-calling
  - multi-tenant-rbac
  - ai-system-design-round
company_signal: []
sources_consulted:
  - https://modelcontextprotocol.io/specification/2025-06-18
updated: 2026-11-02
status: canonical
---

# Design a tool platform with scopes and an audit log

## Snapshot

- An agent does not get a shell. It gets a registry of named tools with schemas.
- Each tool has a scope. The caller's token must include that scope.
- Tools that change state take an idempotency key and return the prior result on replay.
- Tool results are untrusted data. They are not new instructions.
- Original practice design for a platform an internal admin assistant would call.

## What this round is actually scoring

Whether you separate the model from the permissions, and whether a retry can create a second ticket, refund, or rule change. People who have done agent loops in 2026 describe idempotent tool side effects as a standard follow-up [2nd]. This lesson is the system that makes that follow-up true.

## Company signal

No company is cited as asking for this platform by name. Protocol details here follow the public Model Context Protocol idea of tools with schemas, not a vendor's interview script. Confirm what a given round allows you to assume.

## Requirements

| Area | Requirement |
| --- | --- |
| Registry | About 40 tools, each with a name, a JSON schema, an error schema, and a scope |
| Auth | The agent acts as a person. The token is the person's, narrowed to scopes granted for this agent |
| Side effects | `open_ticket` and any other write accept `client_request_id` and are idempotent for 24 hours |
| Read tools | `get_usage`, `get_top_paths`, and `get_waf_events` are read-only and cannot expand their site argument past what the person can see |
| Rate | 10 tool calls per second per agent session, separate from the model's token budget |
| Audit | Every call stores tool name, args hash, scope, allow or deny, and the idempotency key. Not the full customer document |
| Injection | Path strings and ticket text returned by tools are data. The runner does not concatenate them into the system prompt as instructions |

## Back-of-envelope

Illustrative.

200 internal users, 40 tools, a busy hour of 1 call/s average and 10/s peaks per active session. If 20 sessions are active, the peak is 200 calls/s platform-wide. That is a small API. The hard budget is the blast radius of one write tool, not QPS. An audit row at 1 KB is under 20 GB/year at this average. Store it. A 24-hour idempotency table is tiny.

Token cost sits outside this platform. The runner still counts tool round-trips because each one adds latency. A step cap of 8 calls per user turn belongs in the agent, and the platform enforces the 10/s rate so a loop cannot amplify.

## Design

### ELI5

The assistant may ask a clerk to look up usage or to open a ticket. The clerk checks the badge, does the one thing named on the form, and writes down that it happened. If the assistant asks twice with the same form number, the clerk returns the first ticket. The clerk never treats the text inside a page path as a new order.

### Components

- **Registry.** Versioned. A tool deploy is a new schema version. Old sessions finish on the old schema.
- **Token.** User authenticates. An admin grants the agent a subset of the user's scopes: `usage.read`, `waf.read`, `ticket.write`. The platform rejects a call whose scope is missing before the handler runs.
- **Site check.** Read tools take `siteId`. The handler calls the same `can(person, read, site)` as the product. The model does not pass an "allowed" boolean. See [roles](./multi-tenant-rbac.md) (id: multi-tenant-rbac).
- **Idempotency.** `ticket.write` stores `(agentSession, client_request_id) → ticketId`. Same key and same args hash returns the same ticket. Same key and a different summary is a conflict, not a second ticket.
- **Ledger.** The idempotency row is the side-effect ledger. A timeout on the response still leaves the row, so the retry does not create ticket number two.
- **Audit.** Append-only, args hashed, result status, no raw ticket body. Security review can join to the ticket id.
- **Runner.** Enforces the step cap and the rate limit. Inserts tool results in a data channel. A path that says "ignore your rules" is still a path string.

Reads can be parallel. The write is one tool, and the runner requires the model's structured "I am about to open a ticket" turn before it is invoked. That confirmation is a product choice. Say it.

## Tradeoffs

| Choice | Benefit | Cost |
| --- | --- | --- |
| Scopes narrower than the user | A bug cannot do everything the human can | More grant UX |
| Idempotency for 24 hours | Retries collapse | A key reused tomorrow is a new call |
| Hash args in the audit log | Smaller, safer log | You cannot replay the exact text from the log alone |
| Confirmation before writes | Fewer accidental tickets | An extra model turn |
| Step cap in the runner | A loop stops | A legitimate task may need a higher cap, explicitly |

## Failure modes

- The model retries `open_ticket` after a timeout and creates three tickets. The ledger was missing.
- A tool trusts `siteId` from the model with no `can` check, so one agency reads another's usage.
- Tool output is concatenated into the system prompt. A path becomes an instruction.
- The audit log stores full documents and becomes the leak.
- Rate limit counts only successful calls, so a loop of denies is free.
- Schema version skew: the model calls a field the new handler removed, and the error is swallowed.

## Follow-ups an interviewer may ask

**Easy:** The same `client_request_id` arrives twice with the same summary. How many tickets exist?

**Medium:** The token has `usage.read` and the model asks for a site the person cannot see. Where is that denied?

**Hard:** `get_top_paths` returns a path whose text tells the model to call `open_ticket`. What prevents the ticket?

## Cross-links

- [Expose tools through a protocol server](../../ai-agents/tool-protocols.md) (id: tool-protocols)
- [Treat retrieved text as data, not orders](../../ai-agents/prompt-injection-guardrails/lesson.md) (id: prompt-injection-guardrails)
- [Call a tool and handle a structured result](../../ai-agents/tool-calling/lesson.md) (id: tool-calling)
- [Resolve agency, workspace, and site roles](./multi-tenant-rbac.md) (id: multi-tenant-rbac)
- [Whiteboard an AI system starting from failure and evals](../../ai-agents/ai-system-design-round.md) (id: ai-system-design-round)
