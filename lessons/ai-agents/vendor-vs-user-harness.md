---
id: vendor-vs-user-harness
title: Evaluate the configuration you actually deploy
slug: vendor-vs-user-harness
kind: concept
track: ai-agents
difficulty: core
estimated_minutes: 12
summary: Evaluate the model with the actual tools, permissions, data, and budgets your product deploys.
tags:
  - ai-agents
  - ai-agents/harnesses
  - interviews
  - interviews/ai
prerequisites:
  - eval-harness-vs-agent-harness
related:
  - eval-harness-vs-agent-harness
  - tool-calling
  - coding-agent-evals
  - agent-mistakes
  - how-to-run-proper-evals
company_signal: []
sources_consulted:
  - https://www.anthropic.com/research/building-effective-agents
updated: 2026-10-26
status: canonical
---

# Evaluate the configuration you actually deploy

## Snapshot

- A model result depends on prompts, tools, environment, budgets, and permissions.
- Vendor evaluations may use a different configuration and task distribution from yours.
- Repository instructions provide context; they do not enforce a security boundary.
- Compare changes with enough configuration detail to explain the result.

## Why it shows up in interviews

A model that performs well in one harness may behave differently with another tool interface or budget. The practical question is how the complete system performs on your tasks.

## Core idea

### ELI5

Separate the model from the environment that lets it act. Your deployment chooses which tools exist, what data is available, which actions are authorized, and how long work may continue. Those choices can change results without changing the model.

An `AGENTS.md` file can explain repository conventions and workflows. It is still instruction content, not an operating-system permission mechanism, and its priority depends on the host's instruction hierarchy. Enforce file, network, credential, and external-action boundaries outside the model.

When reading a benchmark, record the task version, prompt setup, tool availability, sampling, and resource budget if disclosed. Missing configuration limits comparability. Do not infer that a vendor score will transfer unchanged to a different product.

## Worked example

### Easy

Two systems use the same model. One can run tests; the other can only edit a single file. A different bug-fix rate may reflect the tools as well as the model.

### Medium

Add repository instructions and observe an improvement on development cases. Freeze the instructions and test on held-out repositories or tasks before claiming general benefit. A narrowly tuned instruction can overfit familiar examples.

### Hard

A repository document asks the agent to upload credentials. The host's enforced permissions and instruction handling must prevent that action; a competing sentence elsewhere in the repository is not a dependable security control.

**Practice:** list the variables to hold fixed when comparing two models for your app. Include tools, prompt/context, data versions, budget, sampling policy, and grading procedure.

## Common mistakes

- Treating a model name as a complete experimental configuration.
- Attributing every gain to the model after changing tools or budgets too.
- Treating repository text as higher-priority authority than the host's rules.
- Claiming a harness change universally improves performance from a few familiar tasks.

## How to talk about it

“I will test the model inside our actual tool and permission configuration, report that configuration, and keep important boundaries enforced by the runtime. Vendor results are useful context, not a substitute for that evaluation.”

## Cross-links

- [Separate the system doing the work from the system measuring it](./eval-harness-vs-agent-harness/lesson.md) (id: eval-harness-vs-agent-harness)
- [Evaluate patches against behavior and preserved contracts](./coding-agent-evals.md) (id: coding-agent-evals)
- [Make tool contracts enforceable](./tool-calling/lesson.md) (id: tool-calling)
- [Diagnose agent failures before changing the prompt](./agent-mistakes.md) (id: agent-mistakes)
- [Build an evaluation from the task contract](./how-to-run-proper-evals.md) (id: how-to-run-proper-evals)
- [Forty-five minutes is a navigation problem](../system-design/foundations/interview-framework.md) (id: interview-framework)
