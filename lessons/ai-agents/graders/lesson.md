---
id: graders
title: Choose a grader for the evidence available
slug: graders
kind: concept
track: ai-agents
difficulty: core
estimated_minutes: 12
summary: Match executable checks, calibrated model judgments, and human review to the properties being evaluated.
tags:
  - ai-agents
  - ai-agents/evals
  - interviews
  - interviews/ai
prerequisites:
  - eval-harness-vs-agent-harness
related:
  - how-to-run-proper-evals
  - llm-as-judge-calibration
  - outcome-vs-transcript
  - coding-agent-evals
  - pass-at-k
company_signal: []
sources_consulted:
  - https://arxiv.org/abs/2306.05685
updated: 2026-10-26
status: canonical
---

# Choose a grader for the evidence available

## Snapshot

- Use executable checks for properties that can be checked directly.
- Model judges can assess qualitative criteria, but need calibration and monitoring.
- Human review supplies judgment and labels; disagreement should be recorded rather than hidden.
- Separate correctness, constraint violations, and resource use.

## Why it shows up in interviews

A grading approach should match the property being measured. A regular expression can recognize a number without proving that the number is correct.

## Core idea

### ELI5

A grader is a measurement procedure. Choose one that can observe the property you care about, then test whether it makes the distinctions you need.

[Compare grader types](viz/kinds.md)

Executable checks can compare structured fields, run behavioral tests, count external writes, or verify a permission boundary. Model judges can evaluate a response against a qualitative rubric when direct checks are incomplete. Human review can resolve ambiguity and assess whether the rubric itself matches the product's goals.

Binary pass/fail is useful for clear contracts. Ordinal ratings or pairwise preferences can be useful for graded qualities when their interpretation is defined. Do not average unrelated criteria into a score that lets style compensate for a prohibited action.

## Worked example

### Easy

An answer must report a total of 183 cents. A regex that finds any currency-looking amount is insufficient. Parse the relevant field and compare its value and unit to the expected result.

### Medium

An explanation should distinguish amortized append from worst-case resize. A model judge can assess that distinction using a rubric and examples. Calibrate against independently reviewed explanations, including fluent but incorrect ones.

### Hard

Human reviewers disagree about whether a response was sufficiently cautious. Investigate the rubric, evidence, and category definition before treating either label as unquestionable truth. Preserve unresolved cases or adjudicate them with a documented process.

**Practice:** assign a grader to each property: “JSON parses,” “no record from another tenant was returned,” and “the explanation teaches the invariant clearly.” Use a parser, an authorization-aware data check, and calibrated qualitative review respectively.

## Common mistakes

- Using lexical overlap as a substitute for correctness.
- Asking a judge to infer database state from a confident narrative.
- Giving a judge task output as instructions rather than untrusted evidence.
- Tuning the rubric and reporting accuracy on the same examples.
- Assuming human labels or model scores are error-free.

## How to talk about it

“I will check exact outcomes with code and use a calibrated rubric for the remaining qualitative properties. Critical constraints remain separate gates, and disagreements become review evidence.”

## Cross-links

- [Build an evaluation from the task contract](../how-to-run-proper-evals.md) (id: how-to-run-proper-evals)
- [Calibrate a judge on held-out decisions](../llm-as-judge-calibration.md) (id: llm-as-judge-calibration)
- [Grade the result and the constraints that matter](../outcome-vs-transcript/lesson.md) (id: outcome-vs-transcript)
- [Evaluate patches against behavior and preserved contracts](../coding-agent-evals.md) (id: coding-agent-evals)
- [Separate the system doing the work from the system measuring it](../eval-harness-vs-agent-harness/lesson.md) (id: eval-harness-vs-agent-harness)
