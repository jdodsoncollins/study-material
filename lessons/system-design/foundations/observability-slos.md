---
id: observability-slos
title: Metrics, logs, traces, and the budget for failure
slug: observability-slos
kind: concept
track: system-design
difficulty: core
estimated_minutes: 16
summary: Use metrics to detect, traces to locate, and logs to explain; define user-facing SLIs and SLOs, and spend the error budget deliberately with burn-rate alerts.
tags:
  - system-design
  - system-design/foundations
  - interviews
  - interviews/system-design
prerequisites:
  - interview-framework
related:
  - traces-trajectories
  - load-balancing
  - rate-limiter
  - llm-serving
  - online-offline-evals
company_signal: []
sources_consulted:
  - https://sre.google/sre-book/service-level-objectives/
  - https://sre.google/workbook/alerting-on-slos/
  - https://sre.google/workbook/error-budget-policy/
  - https://prometheus.io/docs/practices/histograms/
  - https://github.com/open-telemetry/opentelemetry.io/blob/main/content/en/docs/concepts/signals/traces.md
updated: 2026-10-28
status: canonical
---

# Metrics, logs, traces, and the budget for failure

## Snapshot

- **Metrics** are cheap numeric time series (counters, gauges, histograms) for dashboards and alerts. Label cardinality is their main cost.
- **Logs** are timestamped records of discrete events. Structured logs with a request or trace ID are searchable; free text mostly is not.
- **Traces** follow one request across services as a tree of spans, which shows where the time went.
- An **SLI** measures something users feel (fraction of checkout requests that succeed under 300 ms). An **SLO** is the target for it (99.9% over 30 days). An **SLA** is a contract with consequences.
- The **error budget** is 1 − SLO. Burn-rate alerts page when the budget is being spent fast enough to matter, instead of on every blip.

## Why it shows up in interviews

Designs end with "and how would you know it's working?" A strong answer names two or three SLIs tied to the product's promise, explains how to find the slow component when they degrade, and describes what pages a human at 3 a.m. versus what waits for morning. It also shows that "add monitoring" has a cost: high-cardinality labels and verbose logs can cost more than the service.

## Core idea

### ELI5

Metrics are the dashboard lights: they tell you something is wrong. Traces are the map of one trip through the system: they tell you where. Logs are the notes taken at each stop: they tell you why. An SLO is the promise you make about the lights, and the error budget is how much breakage that promise allows before you stop shipping features and fix things.

### Metrics

- **Counter:** only increases (requests served, errors). Rates come from differences over time.
- **Gauge:** goes up and down (queue depth, memory in use).
- **Histogram:** counts observations in buckets (request latency). Percentiles are estimated from buckets, and bucket counts from many servers can be added together.

You cannot average per-server p99 values to get a fleet p99. Aggregate the histograms, then compute the percentile. Each unique combination of label values is a separate series, so a `user_id` label on a latency histogram can create millions of series. Keep high-cardinality detail in traces and logs.

### Logs

Log in a structured format with fields such as `trace_id`, `route`, `status`, and `duration_ms`. Sample or rate-limit noisy success logs; keep errors. Do not log secrets, tokens, or personal data you are not allowed to retain. Logs are the most expensive signal per byte at volume.

### Traces

A trace is a tree of spans, each with a start time, duration, service, and attributes. Context propagation (for example the W3C `traceparent` header) carries the trace ID across service calls and queues. Tracing usually samples: head sampling decides at the start, tail sampling keeps traces that turned out slow or failed. A trace shows that 180 ms of a 220 ms checkout was the payment call.

### SLIs, SLOs, and error budgets

Pick SLIs from the user's point of view: availability (good requests ÷ valid requests), latency (requests faster than a threshold ÷ valid requests), freshness for pipelines, correctness where measurable. Measure as close to the user as practical, such as at the load balancer.

Error budget for a 99.9% SLO over 30 days: 0.1% of the period, about 43.2 minutes of full outage, or 0.1% of requests. **Burn rate** is the observed error ratio divided by the budget ratio. A burn rate of 1 spends exactly the budget over the window; 10 spends it in a tenth of the window. Alerting on a fast burn over a short window plus a slower burn over a longer window catches both sudden outages and slow leaks while ignoring brief noise. An error budget policy states what happens when the budget is gone, for example pausing risky launches.

## Worked example

A checkout API serves 120 million requests per 30 days. SLO: 99.9% of requests succeed.

### Easy

Budget: 0.1% × 120,000,000 = 120,000 failed requests per 30 days. In time terms, 0.1% of 43,200 minutes is 43.2 minutes.

### Medium

For the last hour, 0.5% of requests failed. Burn rate = 0.005 ÷ 0.001 = 5. If that continued, the 30-day budget would be gone in 30 ÷ 5 = 6 days. That is worth a ticket today, probably not a page.

### Hard

A deploy pushes errors to 2%: burn rate 20. At that rate, one hour consumes 20 ÷ 720 ≈ 2.8% of the monthly budget, and the full budget lasts 36 hours. A rule such as "page when the 1-hour burn rate exceeds 14.4 and the 5-minute burn rate also exceeds 14.4" fires here (14.4 for one hour is 2% of a 30-day budget). The short window lets the alert clear quickly once the rollback lands. The thresholds are a starting point to tune against your traffic.

```ts
function budget(slo: number, requests: number) {
  return { allowedFailures: Math.round((1 - slo) * requests), outageMinutes30d: +((1 - slo) * 30 * 24 * 60).toFixed(1) };
}
function burnRate(errorRatio: number, slo: number): number {
  return +(errorRatio / (1 - slo)).toFixed(2);
}
function hoursUntilEmpty(rate: number, windowDays = 30): number {
  return rate <= 0 ? Infinity : +((windowDays * 24) / rate).toFixed(1);
}

console.log(budget(0.999, 120_000_000));               // { allowedFailures: 120000, outageMinutes30d: 43.2 }
console.log(burnRate(0.005, 0.999), hoursUntilEmpty(5)); // 5 144  (six days)
console.log(burnRate(0.02, 0.999), hoursUntilEmpty(20)); // 20 36
```

## Common mistakes

| Trap | What happens | Fix |
| --- | --- | --- |
| Averaging p99 across servers | A number that is not any real percentile | Merge histograms, then compute |
| `user_id` as a metric label | Millions of series, huge cost | Put per-user detail in traces or logs |
| SLI on CPU or memory | Alerts that users never notice | Measure success and latency users experience |
| 100% SLO | No room to deploy or fail; impossible to meet | Pick a target the product needs, then defend it |
| Paging on every error spike | Alert fatigue, ignored pages | Multi-window burn-rate alerts |
| No trace context across the queue | Traces stop at the producer | Propagate trace context in message headers |

## How to talk about it

"Two SLIs: checkout success rate and the fraction of checkouts under 300 ms, measured at the load balancer, each with a 99.9% 30-day SLO. That gives 120,000 failed requests of budget a month at our volume. We page on a fast burn, about 14× over an hour confirmed by the last five minutes, and file tickets on a slow burn. Every request carries a trace ID through the payment queue, so when latency moves, the trace shows which hop."

## Cross-links

- [Use observable execution evidence to diagnose failures](../../ai-agents/traces-trajectories.md) (id: traces-trajectories)
- [Spreading work without creating a new bottleneck](./load-balancing.md) (id: load-balancing)
- [Enforce request budgets across servers](../cases/rate-limiter/lesson.md) (id: rate-limiter)
- [Budget model memory and schedule streamed generation](../cases/llm-serving/lesson.md) (id: llm-serving)
- [Forty-five minutes is a navigation problem](./interview-framework.md) (id: interview-framework)
