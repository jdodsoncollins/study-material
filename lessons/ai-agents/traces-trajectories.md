---
id: traces-trajectories
title: Spans, traces, trajectories, and sessions
slug: traces-trajectories
kind: concept
track: ai-agents
difficulty: core
estimated_minutes: 12
summary: A span is one call, a trace is one trial's DAG, a trajectory is the ordered agent path, and a session is the user's longer story. Eval, debug, and product metrics do not live on the same noun.
tags:
  - ai-agents
  - ai-agents/evals
  - ai-agents/harnesses
  - interviews
  - interviews/ai
prerequisites:
  - eval-harness-vs-agent-harness
related:
  - outcome-vs-transcript
  - online-offline-evals
  - eval-harness-vs-agent-harness
  - how-to-run-proper-evals
  - llm-as-judge-calibration
company_signal:
  - name: Arize
    evidence: Observability writeups in 2026 standardized span/trace language for LLM apps; interviews expect you to add trajectory/session on top.
    year: 2026
    confidence: medium
sources_consulted:
  - Arize / Winder.ai tracing and harness posts (2026)
  - X threads on evaluating trajectories not just final strings
  - OpenTelemetry-style span/trace vocabulary as used in LLM apps
updated: 2026-09-02
status: canonical
---

# Spans, traces, trajectories, and sessions

## Snapshot

- **Span** — one timed operation: a model call, a tool call, a retrieval, a grader.
- **Trace** — the DAG of spans for one request or one eval trial. Parent/child, timings, attributes, errors.
- **Trajectory** — the *ordered* agent path: (thought, tool, observation)* plus the final act. A view of the trace that humans debug.
- **Session** — the user's conversation or ticket across many tasks. Product metrics (CSAT, time-to-resolution) live here.
- Mixing these nouns is how teams "eval the session" with a span-level judge and then cannot reproduce a trial.

## Why it shows up in interviews

Platform rounds ask how you would instrument an agent. The junior answer is "we log prompts." The senior answer names four grains and assigns jobs: **serve and bill at span, reproduce at trace, debug at trajectory, report the business at session.** Same instinct as request vs job vs workflow in [job schedulers](../system-design/cases/job-scheduler.md) (id: job-scheduler).

## Core idea

Think of Harborline's refund agent as a distributed system that happens to include a model.

A customer opens ticket `T-441`. That session may contain three user turns: "where is my mug," "actually refund it," "thanks." Each turn is a trace. Inside the refund trace, spans might be `llm.plan`, `tool.get_order`, `llm.choose`, `tool.refund`, `grader.outcome`. The trajectory is those spans read as a story, including the text the model produced between tools.

Eval trials should be **one trace long** with a frozen start state. You may *sample* sessions to mine new tasks, but you do not let a 40-turn chat be your unit of pass/fail — you cannot isolate it. See [how to run proper evals](./how-to-run-proper-evals.md) (id: how-to-run-proper-evals).

Store enough in the trace to rebuild the world: tool args, tool results, env version, model id, harness sha, token counts. The trajectory is a projection. Do not persist only the pretty view.

## Comparison

| Noun | Grain | You use it to | You do not use it to |
| --- | --- | --- | --- |
| Span | One call | Latency, cost, error rate, [serving](../system-design/foundations/llm-serving.md) (id: llm-serving) SLOs | Declare the job succeeded |
| Trace | One trial / one turn | Reproduce, bind an outcome grade, compare harness versions | Quote CSAT |
| Trajectory | Ordered path | Cluster ruts, enforce confirm-before-delete, teach | Be the only grader |
| Session | Many turns, one user | Product analytics, mine new eval tasks | Be a CI unit (too much shared state) |

Outcome still sits on the trace: after the refund trace, the `refunds` row exists or it does not. See [outcome versus transcript](./outcome-vs-transcript.md) (id: outcome-vs-transcript). The trajectory explains a missing row ("never called `refund`, just spoke").

## Common mistakes

- One blob named `messages.json` with no span ids, so you cannot see that `run_tests` took 11 of 12 minutes.
- Judging the session ("was this customer happy") and using that as a nightly regression number.
- Calling the whole chat a "prompt" and losing tool observations.
- Dropping tool results from storage because they were large, then being unable to replay.
- Treating a trajectory match against a golden path as pass/fail.
- Different trace schema in prod and in the eval harness, so online/offline joins are fan fiction.

## How to talk about it

"I would instrument spans like any RPC, group them into a trace per trial, grade the outcome on that trace, and keep a trajectory view for humans. Sessions are how I find new tasks and how product reports, not how CI passes. If we cannot point at a trace id for a refund, we cannot eval it."

If they ask what to index: `trace_id`, `task_id`, `harness_sha`, `model`, `outcome`, `error_cluster`.

## Cross-links

- [Outcome versus transcript](./outcome-vs-transcript.md) (id: outcome-vs-transcript)
- [Offline gates and online drift](./online-offline-evals.md) (id: online-offline-evals)
- [Eval harness versus agent harness](./eval-harness-vs-agent-harness.md) (id: eval-harness-vs-agent-harness)
- [LLM serving](../system-design/foundations/llm-serving.md) (id: llm-serving)
- [Job scheduler](../system-design/cases/job-scheduler.md) (id: job-scheduler)
- [Start evals from real failures](./how-to-run-proper-evals.md) (id: how-to-run-proper-evals)
