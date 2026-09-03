---
id: vendor-vs-user-harness
title: The harness you rent versus the harness you write
slug: vendor-vs-user-harness
kind: concept
track: ai-agents
difficulty: core
estimated_minutes: 12
summary: Claude Code and cousins are a rented loop; AGENTS.md, tests, linters, and CI are the harness you actually own. Fair model comparisons hold one of those fixed.
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
company_signal:
  - name: Thoughtworks / Fowler
    evidence: Boeckeler's 2026 "Agent = Model + Harness" framing, including vendor versus user harness, is widely cited in platform interviews.
    year: 2026
    confidence: high
  - name: Anthropic
    evidence: Claude Code is discussed in candidate reports and public posts as a vendor agent harness wrapping a model.
    year: 2026
    confidence: high
sources_consulted:
  - Martin Fowler / Birgitta Boeckeler on Agent = Model + Harness
  - Anthropic Claude Code / long-running agent harness notes
  - Position paper: Stop Comparing LLM Agents Without Disclosing the Harness
updated: 2026-09-02
status: canonical
---

# The harness you rent versus the harness you write

## Snapshot

- **Vendor harness** — Claude Code, Cursor's agent, Codex, a hosted ReAct runtime. Loop, compaction, built-in tools, permission UI. You pick it; you do not fork it every afternoon.
- **User harness** — `AGENTS.md`, repo maps, Makefile targets, tests, linters, types, CI gates, review bots, secrets layout. This is yours.
- The thing that ships is model + vendor harness + user harness. Changing any layer moves the number.
- Interviews reward "I invest where I have the diff." That is usually the user harness and the eval harness, not a custom loop.

## Why it shows up in interviews

Teams argue about models while the repo has no `AGENTS.md` and CI is optional. Interviewers want you to split **rented intelligence** from **owned constraints**, the same way you would split a managed queue from your consumer logic. See [eval harness versus agent harness](./eval-harness-vs-agent-harness/lesson.md) (id: eval-harness-vs-agent-harness).

## Core idea

Boeckeler's line, paraphrased: an agent is a model dropped into a harness. For coding, that harness has two landlords.

The vendor landlord gives you a loop that already knows how to read files, run a shell, and fold a long context. You will lose an arms race if you reimplement that from a blog post.

The user landlord is the repo as a place a junior could succeed: where the tests live, which commands are legal, what "done" means, which files are radioactive. A strong user harness makes a mediocre vendor look competent. A missing one makes every vendor look drunk.

Eval rule: when you A/B models, freeze both harnesses. When you A/B vendors, freeze the user harness and the eval. When you change `AGENTS.md`, that is a harness change, not a model miracle. Published Terminal-Bench swings from harness swaps have been larger than typical model swaps; if you hide the harness, you are not comparing models.

## Comparison

Harborline's checkout repo.

| Layer | Examples | You change it to | Eval must match? |
| --- | --- | --- | --- |
| Model | Opus-class, GPT-class, local coder | Raw capability | Name it |
| Vendor harness | Claude Code, Cursor agent, homegrown loop | Tools, retries, compaction, permissions | Yes — same loop as prod |
| User harness | `AGENTS.md`, `make test`, ruff, CI, CODEOWNERS | Make the healthy path obvious | Yes — same docs and gates |
| Eval harness | Container per trial, hidden tests, k trials | Honest scores | This *is* the lab |

`AGENTS.md` is not documentation theater. It is a system prompt you version. "Run `make test-checkout` before you edit. Never touch `alembic/versions`. Promo rules live in `pricing/promos.py`." That paragraph has moved fail-to-pass more than a temperature tweak.

## Common mistakes

- Rebuilding a vendor loop to "own the stack," then falling behind on compaction and permissions.
- Comparing two models in two different IDEs and quoting a winner.
- Empty repo onboarding: the agent greps for 40 minutes and edits the wrong tree. See [agent mistakes](./agent-mistakes.md) (id: agent-mistakes).
- Putting secrets in the vendor's default sandbox policy and calling it a model hallucination.
- Eval that injects extra tools (`submit_patch`) the developer agent does not have.
- Treating CI as unrelated to the agent. CI *is* the user harness's grader.

## How to talk about it

"I rent the vendor loop and I spend engineering time on the user harness: AGENTS.md, one obvious test command, linters, and CI the agent cannot disable. Evals run that same pair. If a score jumps, I ask which layer moved — model, vendor, user, or eval — before I take credit."

If they ask what you would do week one on a greenfield coding agent: write the user harness and twenty real-bug tasks, not a new framework.

## Cross-links

- [Eval harness versus agent harness](./eval-harness-vs-agent-harness/lesson.md) (id: eval-harness-vs-agent-harness)
- [Coding-agent evals](./coding-agent-evals.md) (id: coding-agent-evals)
- [Tools that are safe to call twice](./tool-calling/lesson.md) (id: tool-calling)
- [Mistakes coding agents keep making](./agent-mistakes.md) (id: agent-mistakes)
- [Start evals from real failures](./how-to-run-proper-evals.md) (id: how-to-run-proper-evals)
- [Interview framework](../system-design/foundations/interview-framework.md) (id: interview-framework)
