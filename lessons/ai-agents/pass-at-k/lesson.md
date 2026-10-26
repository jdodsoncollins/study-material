---
id: pass-at-k
title: Success across one attempt, retries, and repeated runs
slug: pass-at-k
kind: concept
track: ai-agents
difficulty: core
estimated_minutes: 12
summary: Distinguish single-attempt success, at-least-one success, and repeated-run reliability without mixing their assumptions.
tags:
  - ai-agents
  - ai-agents/evals
  - interviews
  - interviews/ai
prerequisites:
  - how-to-run-proper-evals
related:
  - how-to-run-proper-evals
  - capability-vs-regression
  - online-offline-evals
  - eval-harness-vs-agent-harness
  - coding-agent-evals
company_signal: []
sources_consulted:
  - https://arxiv.org/html/2107.03374v2
updated: 2026-10-26
status: canonical
---

# Success across one attempt, retries, and repeated runs

## Snapshot

- Pass@1 measures success for one sampled attempt under a specified setup.
- Pass@k asks whether at least one of k attempts succeeds; it does not tell a user which answer is correct.
- An all-k success measure asks whether every attempt succeeds and answers a different question.
- Compute task-level quantities before aggregating across tasks with different difficulty.

## Why it shows up in interviews

A high “best of several” score can coexist with unreliable individual attempts. Explain the sampling procedure, how correctness is recognized, and whether retries are actually available in the product.

## Core idea

### ELI5

For one fixed task, suppose independent, identically distributed attempts each succeed with known probability p. Then:

- One attempt succeeds with probability p.
- At least one of k succeeds with probability `1 − (1 − p)^k`.
- All k succeed with probability `p^k`.

[Compare the success events](viz/k.md)

With p = 0.7 and k = 3, these are 0.7, 0.973, and 0.343. The formulas describe different events under stated assumptions. An adaptive agent that changes its plan after feedback is not automatically an independent repeated draw.

Do not put the suite's average p into a nonlinear formula and call it the suite score. For two equally weighted tasks with p values 0 and 1, average pass@1 is 0.5, but average pass@2 is also 0.5, not 0.75.

## Worked example

### Easy

Suppose five independently sampled candidates for one task contain two correct answers. For k = 2, there are ten candidate pairs; three pairs contain only failures. The estimate for at least one success is `1 − 3/10 = 0.7`.

### Medium

The [HumanEval paper](https://arxiv.org/html/2107.03374v2) uses the per-task estimator `1 − C(n−c,k)/C(n,k)` for n sampled candidates, c correct candidates, and n ≥ k. Average these task estimates using the declared task weights. This avoids treating an empirical pass@1 estimate as the known p in the formula above.

```ts
function estimatePassAtK(n: number, c: number, k: number): number {
  if (![n, c, k].every(Number.isInteger) || n < 1 ||
      c < 0 || c > n || k < 1 || k > n) {
    throw new RangeError("Require n >= k >= 1 and 0 <= c <= n");
  }
  if (n - c < k) return 1;
  let allFail = 1;
  for (let i = 0; i < k; i++) allFail *= (n - c - i) / (n - i);
  return 1 - allFail;
}
console.log(estimatePassAtK(5, 2, 2)); // 0.7
console.log(estimatePassAtK(5, 0, 2)); // 0
```

### Hard

A product generates three suggestions but cannot reliably select the correct one. Pass@3 describes the existence of a correct candidate, not delivered user success. Evaluate the actual selection or retry policy, including its costs and any repeated side effects.

Similarly, five tool steps do not have success probability `p^5` merely because a benchmark reports pass@1 = p. Steps may have different conditional success probabilities and correlated failures. Measure the end-to-end workflow.

**Practice:** explain why “one run per task is always meaningless” is too strong. One sampled run per representative task can estimate aggregate one-attempt success with uncertainty, but does not estimate each task's variability well. Repeated trials and more representative tasks answer different sources of uncertainty.

## Common mistakes

| Mistake | Why it fails | Better report |
| --- | --- | --- |
| Use mean pass@1 inside the pass@k formula | Tasks have different success probabilities | Estimate per task, then aggregate |
| Treat retries as independent by default | Feedback and shared failures change the process | Evaluate the actual policy |
| Report best-of-k as user success | A selector must identify the correct answer | Measure selection and end-to-end outcome |
| Count all trials as unrelated tasks | Shared tasks create dependence | Match uncertainty analysis to the sampling unit |

## How to talk about it

“I will report one-attempt success and the outcome of our real retry policy separately. Best-of-k is useful only with its sampling assumptions and a way to recognize success; it is not a reliability guarantee.”

## Cross-links

- [Build an evaluation from the task contract](../how-to-run-proper-evals.md) (id: how-to-run-proper-evals)
- [Measure new capabilities and protect established behavior](../capability-vs-regression.md) (id: capability-vs-regression)
- [Combine controlled tests with production evidence](../online-offline-evals.md) (id: online-offline-evals)
- [Separate the system doing the work from the system measuring it](../eval-harness-vs-agent-harness/lesson.md) (id: eval-harness-vs-agent-harness)
- [Make tool contracts enforceable](../tool-calling/lesson.md) (id: tool-calling)
