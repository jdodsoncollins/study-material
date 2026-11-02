---
id: edge-waf
title: Push edge rules without freezing a publish
slug: edge-waf
kind: case-study
track: system-design
difficulty: core
estimated_minutes: 16
summary: Distribute per-site edge rules quickly, reject patterns that can stall a request, and record false positives.
tags:
  - system-design
  - system-design/product-cases
  - system-design/caching
  - interviews
  - interviews/system-design
prerequisites:
  - cdn-edge-caching
  - rate-limiter
related:
  - cdn-edge-caching
  - rate-limiter
  - usage-metering
  - incident-debug-with-agent
  - observability-slos
company_signal: []
sources_consulted:
  - https://www.rfc-editor.org/rfc/rfc9110.html
updated: 2026-11-02
status: canonical
---

# Push edge rules without freezing a publish

## Snapshot

- Each site has a versioned ruleset evaluated at the edge before the origin.
- A bad regular expression must fail at save time or be time-boxed at request time.
- A false positive needs an audited, reversible exception. It does not need a global disable.
- Rule pushes have a freshness target. Publish traffic has a latency target.
- Original practice design. The latency numbers are the exercise, not a measured outage.

## What this round is actually scoring

Whether you can change a rule without stalling unrelated sites, and whether you notice that pattern matching is a latency and safety problem, not just a feature.

## Company signal

This prompt is original. An incident-style interview that wires an agent to telemetry is a separate drill, proposed in public posts and not tied here to a named company's loop [2nd]. Replit has described an infrastructure round in a real cloud project [P, see the incident lesson]. Do not claim this ruleset design is that round.

## Requirements

| Area | Requirement |
| --- | --- |
| Scope | Rules belong to one site. A push does not reload every site |
| Freshness | A saved ruleset is in use at the edge within 30 seconds at p99 |
| Safety | Nested quantifiers and unbounded patterns are rejected at save, or evaluation stops at 2 ms and the request fails closed for that rule only |
| Publish | p99 for `/publish` stays under 300 ms when rules are healthy |
| Exception | A site admin can allow one path for 24 hours. The exception is audited and expires |
| Observe | You can see blocks by rule id, and p99 of rule evaluation separately from origin time |

## Back-of-envelope

Illustrative.

240,000 sites, but only about 20,000 have custom rules. A ruleset is 20 KB. The full custom set is about 400 MB, which fits in memory on an edge box, so the design problem is freshness and blast radius, not capacity. If 1% of publishes hit a pathological pattern and each stalls for seconds, `/publish` p99 is dominated by that 1%. That is why the 2 ms cap exists. A canary that shifts 5% of edge machines to a new ruleset version limits a bad push to that slice.

30 seconds at p99 means you cannot depend on a one-hour config poll. You push an invalidation or a version notification. Machines that miss it poll every 10 seconds as a backstop.

## Design

### ELI5

Each site has a rule booklet with a version number. The edge keeps the booklet it already has until it hears a new version. Matching a request is allowed to take 2 ms. If a rule is worse than that, that rule does not run, the request is blocked or skipped according to the rule's fail mode, and you record the rule id. A customer who was blocked by mistake gets a timed exception, not a deleted booklet.

### Pieces

- **Control plane.** Save validates the pattern (reject nested quantifiers you know are unsafe; you will not enumerate every bad pattern). On success, write ruleset version N and notify.
- **Data plane.** Edge workers key cache by `(siteId, version)`. A notification sets "desired version." Fetch on miss. Requests in flight finish on the old version.
- **Evaluate.** Run rules in order with a 2 ms budget per rule. Record `ruleId`, `us`, `action` (block, allow, skip).
- **Fail mode per rule.** "Fail closed" blocks the request if the budget trips. "Fail open" skips that rule. Default for a new custom rule is fail open until it has a week of clean latency, then the owner can choose closed. Say this tradeoff out loud.
- **Exception.** `(siteId, pathPrefix, expiresAt, actor)` checked before custom blocks. Expiry is read on the request, not by a janitor. Audit the create and the hit.
- **Canary.** New versions go to 5% of machines for 10 minutes if the ruleset diff touches a pattern, then the rest. A rollback is "desired version = N-1," not a revert of customer intent without an audit row.

### What you graph

Rule-evaluation p99 by site, block rate by rule id, notification lag, and the share of requests still on N-1. A page on evaluation p99 is how you catch the pattern the save-time check missed.

## Tradeoffs

| Choice | Benefit | Cost |
| --- | --- | --- |
| Per-site version | One site cannot force a global reload | Edges can briefly disagree |
| 2 ms budget | A bad pattern cannot own the request | You may skip a rule you meant to enforce |
| Fail open by default | A bad rule does not take down publish | A real attack can slip through that rule |
| Canary on pattern changes | Limits blast radius | 10 minutes of mixed versions |
| Timed path exception | Unblocks a false positive | Another thing to expire and audit |

## Failure modes

- A global config object. One tenant's save stalls every publish.
- Catastrophic backtracking with no budget. p99 moves from a couple hundred milliseconds to many seconds on one route. Practice that as a planted fault in [the incident drill](../../ai-agents/incident-debug-with-agent.md) (id: incident-debug-with-agent).
- The exception never expires because only a cron deletes it.
- Rollback restores N-1 and drops the audit of who rolled back.
- Block logs include the full request body. You wanted the path and the rule id.

## Follow-ups an interviewer may ask

**Easy:** A rule's pattern trips the 2 ms budget. What happens to this request, and what do you log?

**Medium:** You need the new ruleset everywhere in 30 seconds, and 2% of machines missed the notification. What is the backstop?

**Hard:** A false positive is blocking a product launch. What do you ship in the next 10 minutes that you can undo, and what do you refuse to do?

## Cross-links

- [Serving from the edge without serving the wrong thing](../foundations/cdn-edge-caching/lesson.md) (id: cdn-edge-caching)
- [Enforce request budgets across servers](./rate-limiter/lesson.md) (id: rate-limiter)
- [Bill bandwidth from events without double-counting](./usage-metering.md) (id: usage-metering)
- [Debug an incident with an agent on the telemetry](../../ai-agents/incident-debug-with-agent.md) (id: incident-debug-with-agent)
- [Metrics, logs, traces, and the budget for failure](../foundations/observability-slos.md) (id: observability-slos)
