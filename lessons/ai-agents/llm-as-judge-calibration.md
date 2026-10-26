---
id: llm-as-judge-calibration
title: Calibrate a judge on held-out decisions
slug: llm-as-judge-calibration
kind: concept
track: ai-agents
difficulty: deep
estimated_minutes: 14
summary: Calibrate a qualitative judge on reviewed examples and report held-out error counts with explicit denominators.
tags:
  - ai-agents
  - ai-agents/evals
  - interviews
  - interviews/ai
prerequisites:
  - graders
related:
  - graders
  - outcome-vs-transcript
  - how-to-run-proper-evals
  - online-offline-evals
  - pass-at-k
company_signal: []
sources_consulted:
  - https://arxiv.org/abs/2306.05685
updated: 2026-10-26
status: canonical
---

# Calibrate a judge on held-out decisions

## Snapshot

- A judge's score is a measurement that can disagree with human review.
- Define the rubric and error costs before tuning prompts or thresholds.
- Separate calibration examples from held-out assessment examples.
- Report error counts and denominators, not an unexplained accuracy percentage.

## Why it shows up in interviews

An evaluation can appear to improve because its judge rewards confident wording or misses a particular error. Calibration checks whether the measurement tracks the intended criterion.

## Core idea

### ELI5

Have reviewers label examples using a written rubric. Tune the judge on one portion, then freeze its prompt, model version, and decision rule before assessing it on a separate portion. Inspect disagreements by category.

Use examples that challenge the distinction: fluent wrong answers, terse correct ones, unsupported claims, and task output containing instructions aimed at the judge. Treat the candidate output as untrusted evidence. Provide only the data the rubric needs.

Position, verbosity, and self-preference effects have been observed in model-judge research, including [MT-Bench](https://arxiv.org/abs/2306.05685). Check for them in your setup rather than assuming every judge has the same bias. Pairwise grading can be useful; randomize or reverse presentation order and inspect order sensitivity.

## Worked example

### Easy

Use an illustrative held-out set of eighty examples: forty human-labeled passes and forty failures. Suppose the judge produces these counts:

| Human label | Judge pass | Judge fail |
| --- | --- | --- |
| Pass | 36 | 4 |
| Fail | 3 | 37 |

Agreement is 73/80 = 91.25%. The false-positive rate is 3/40 = 7.5% among human-labeled failures. Precision among judge passes is 36/39 ≈ 92.3%. Each answers a different question.

### Medium

If false passes are more costly, adjust the decision threshold on calibration data and remeasure on held-out data. The resulting lower false-positive rate may increase false failures; report both.

### Hard

Only two privacy violations appear in the sample. Excellent aggregate agreement cannot establish reliable detection of that rare category. Add a targeted review set, report its sampling limits, and estimate uncertainty at the relevant unit. Human disagreement also requires adjudication or explicit reporting.

**Practice:** change the table's false positives from three to six. Recalculate accuracy, false-positive rate, and precision. Then explain which metric best reflects the release risk you care about.

## Common mistakes

- Tuning on the same examples used to report final agreement.
- Calling disagreement with one reviewer an objective model error without checking the rubric.
- Using an undefined “false-pass percentage.”
- Assuming temperature zero guarantees identical judge output.
- Reusing a calibration result after changing the model, rubric, or task distribution without checking it again.

## How to talk about it

“I will freeze a rubric, calibrate on reviewed examples, and assess on held-out cases. I will report the confusion matrix and the errors that matter for this product, then review disagreements before trusting aggregate scores.”

## Cross-links

- [Choose a grader for the evidence available](./graders/lesson.md) (id: graders)
- [Grade the result and the constraints that matter](./outcome-vs-transcript/lesson.md) (id: outcome-vs-transcript)
- [Build an evaluation from the task contract](./how-to-run-proper-evals.md) (id: how-to-run-proper-evals)
- [Combine controlled tests with production evidence](./online-offline-evals.md) (id: online-offline-evals)
- [Separate the system doing the work from the system measuring it](./eval-harness-vs-agent-harness/lesson.md) (id: eval-harness-vs-agent-harness)
- [Success across one attempt, retries, and repeated runs](./pass-at-k/lesson.md) (id: pass-at-k)
