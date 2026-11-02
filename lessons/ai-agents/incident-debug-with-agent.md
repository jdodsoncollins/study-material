---
id: incident-debug-with-agent
title: Debug an incident with an agent on the telemetry
slug: incident-debug-with-agent
kind: strategy
track: ai-agents
difficulty: core
estimated_minutes: 16
summary: Form a hypothesis from the deploy and the metrics, then use an agent on logs and traces with a hard limit on code changes.
tags:
  - ai-agents
  - ai-agents/tools
  - interviews
  - interviews/ai
prerequisites:
  - traces-trajectories
  - observability-slos
related:
  - traces-trajectories
  - observability-slos
  - edge-waf
  - agent-mistakes
  - repo-round-three-phase
company_signal:
  - name: Replit
    evidence: https://x.com/niallohiggins/status/2028634203429232951
    year: 2026
    confidence: high
  - name: Datadog
    evidence: https://careers.datadoghq.com/candidate-experience/interviewing-at-datadog-ai-guidelines/
    year: 2026
    confidence: medium
sources_consulted:
  - https://x.com/niallohiggins/status/2028634203429232951
  - https://x.com/chrislciaba/status/2115667819014893939
  - https://careers.datadoghq.com/candidate-experience/interviewing-at-datadog-ai-guidelines/
updated: 2026-11-02
status: canonical
---

# Debug an incident with an agent on the telemetry

## Snapshot

- An engineering leader proposed a round: debug a live incident with an agent connected to telemetry, and a limit of two code changes [2nd].
- Replit's SRE round, in the interviewer's own post, runs in a real cloud project with infrastructure-as-code and a coding agent allowed [P].
- The skill is hypothesis first, then a narrow agent query, then a reproduction, then a small fix.
- Datadog expects AI only in rounds it announces as AI-assisted [P]. This drill assumes the round allows the agent.
- Practice faults below are planted. They are not reports of a real outage.

## Why it shows up in interviews

Read-and-repair rounds already ask you to move through an unfamiliar repo. This variant adds production evidence: a deploy, a latency graph, and traces. The agent is useful for pulling exemplars and searching a large diff. It is a poor first move if you have not said what you think broke. CoderPad's survey puts "catches and fixes AI mistakes" first among AI-allowed signals at 66% [P]. Here the mistake is often a confident grep that is not the failing path.

## Core idea

### Order of moves

1. Read the symptom and the deploy diff. Say one hypothesis out loud.
2. Ask the agent for evidence that would falsify it: exemplar slow traces, the new lines in the diff, the error rate by route.
3. Reproduce with one input before you edit.
4. Spend the change budget. Two changes means the fix and a regression test, not a rewrite.
5. Say the prevention: a timeout, a lint, a canary.

If the agent names a file you have not opened, open it before you believe it.

### A local lab shape

You do not need a vendor account. A compose file with an API, a worker, a database, and a tiny tool that answers `query_logs`, `query_traces`, and `get_metrics` is enough. Point the agent at those three tools only. Rotate the planted fault between sessions so you cannot memorize the file.

## Worked example

### Fault 1 — a rule that explodes on long paths

Prompt, copied from the proposed round and restated on a publish route [2nd for the round shape]:

> p99 on `/publish` went from 200 ms to 9 s after today's deploy. Find it and fix it. At most two code changes. Use the agent however you like.

Plant: a new edge-rule regular expression catastrophically backtracks on long paths.

Strong run:

- Hypothesis from the diff before any grep: "a new rule matches the path, and the pattern is nested quantifiers."
- Agent query: "show exemplar traces for `/publish` over 1 s and the span names."
- You see time inside rule evaluation, not the database.
- Reproduce with one long path.
- Change 1: cap the pattern or roll the rule back. Change 2: a test with a pathological path.
- Follow-up you say unprompted: reject unsafe patterns at save time, time-box evaluation, canary the ruleset. That design is [edge rules](../system-design/cases/edge-waf.md) (id: edge-waf).

### Fault 2 — a retry double-count

Same budget. Symptom: yesterday's bandwidth total is about 2× on one workspace after a worker retry. Hypothesis: the ingest path counts an event id twice when the first attempt timed out after the write. The agent may list writers of the counter. You still name the missing uniqueness constraint. Related design: [usage metering](../system-design/cases/usage-metering.md) (id: usage-metering).

### Fault 3 — a stale allow

Symptom: a member who was just denied can still publish. Hypothesis: the permission cache is not keyed with a generation, so an old allow wins. Two changes: include the generation in the cache key, and a test that a deny after a cached allow is a deny. Related design: [multi-tenant roles](../system-design/cases/multi-tenant-rbac.md) (id: multi-tenant-rbac).

### Rubric

| Signal | Points |
| --- | --- |
| Hypothesis before the agent searches | 0–3 |
| Agent queries that could falsify the hypothesis | 0–2 |
| Reproduced before the fix | 0–2 |
| Stayed inside the change budget | 0–1 |
| A prevention step, not only the patch | 0–2 |

Seven or more out of 10, including the hypothesis points, is the bar.

## Common mistakes

- "Search the repo for latency" as the first prompt.
- A third code change that refactors unrelated files.
- Fixing the symptom in a dashboard query instead of the service.
- No reproduction, so you cannot tell the test from a lucky green run.
- Skipping the prevention sentence. The review is partly about judgment.

## How to talk about it

"p99 moved at the deploy, and the diff adds a path rule with nested quantifiers. I'll ask the agent for slow `/publish` traces. If the time is in rule evaluation, I'll reproduce with a long path, then spend one change on the rule and one on a test. Follow-up is a compile-time reject for that pattern class and a canary."

## Cross-links

- [Read a trace before you rewrite the prompt](./traces-trajectories.md) (id: traces-trajectories)
- [Metrics, logs, traces, and the budget for failure](../system-design/foundations/observability-slos.md) (id: observability-slos)
- [Push edge rules without freezing a publish](../system-design/cases/edge-waf.md) (id: edge-waf)
- [Diagnose agent failures before changing the prompt](./agent-mistakes.md) (id: agent-mistakes)
- [Multi-phase repo rounds with an AI assistant](./repo-round-three-phase.md) (id: repo-round-three-phase)
