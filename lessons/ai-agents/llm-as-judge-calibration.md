---
id: llm-as-judge-calibration
title: Calibrate the judge before you trust the score
slug: llm-as-judge-calibration
kind: concept
track: ai-agents
difficulty: deep
estimated_minutes: 14
summary: An LLM judge is another model with biases. Pin a rubric, measure agreement on a human gold set, then freeze the judge so it cannot drift with the agent.
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
company_signal:
  - name: Anthropic
    evidence: The 2026 agent-eval essay treats model graders as useful only when the quality is fuzzy and the judge is validated.
    year: 2026
    confidence: high
sources_consulted:
  - Anthropic, Demystifying evals for AI agents (2026-01-09)
  - Arize LLM-as-judge calibration guidance (2026)
  - Public notes on position bias, verbosity bias, and self-preference in judges
updated: 2026-09-02
status: canonical
---

# Calibrate the judge before you trust the score

## Snapshot

- A **judge** is an LLM that scores a transcript or artifact against a rubric. It is not "the eval."
- **Calibration** means a human gold set, a frozen rubric, and a published agreement number — then you stop tinkering.
- Judges pick the longer answer, the first answer, and answers that sound like themselves. Your rubric has to fight that.
- If a check can be code, it should not be a judge. See [graders](./graders/lesson.md) (id: graders).

## Why it shows up in interviews

"We'll use GPT as the judge" is a common design-an-eval answer. The follow-up is "how do you know the judge is right." They want gold labels, binary questions, bias talk, and a freeze. Vague Likert scores are how dashboards go up while refunds go missing.

## Core idea

Build the judge like a test, not like a coworker.

1. **Name one quality.** "Email is plain and names the amount" is a quality. "Good job" is not.
2. **Write a short rubric with examples** of pass and fail. Split into **binary** questions; average later if you must.
3. **Collect gold.** Two humans on 50–100 items, third on disagreements. If humans cannot agree, the spec is still mush — go back to [how to run proper evals](./how-to-run-proper-evals.md) (id: how-to-run-proper-evals).
4. **Measure the judge** against gold: accuracy, false-pass rate (the dangerous one), maybe Cohen's κ. Flip answer order and pad verbosity as a bias probe.
5. **Pin** model id, prompt sha, temperature 0. The judge lives in the eval harness, not in the agent's PR.
6. **Audit.** Weekly sample of judge/human mismatches. If agreement falls, you have drift, not a better agent.

Never let the judged model and the judge be the same checkpoint if you can avoid it. Self-preference is real. If you must, report it.

Do not ask the judge whether the refund happened. Ask the database. Use the judge for tone, summary faithfulness, and "did this answer the user's actual question."

## Comparison

Harborline confirmation-email quality, n = 80 gold emails.

| Probe | What you did | What you learned | Action |
| --- | --- | --- | --- |
| Human agreement | Two raters, binary "plain + amount named" | 91% agree; remaining 9% are policy edges | Split those edges into a new code grader |
| Judge vs gold | Pinned rubric, temp 0 | 88% match, 6% false-pass | False-pass is the ship risk; tighten fail examples |
| Position bias | Swap "email A/B" order | 12-point swing toward first | Judge one item at a time, no pairwise |
| Verbosity bias | Append a fluff paragraph | Fail→pass on 8 items | Rubric: "extra legal threats = fail" |
| Self-preference | Agent-family as judge | +7 points to own transcripts | Use a different family, or code |

A 0.88 agreement can still be usable if the 0.06 false-pass cluster is ones you will also catch with a code grader (amount missing is regex-able). Calibration is how you discover that.

## Common mistakes

- One prompt: "Score 1–5, be harsh." No examples, no freeze, no gold.
- Pairwise "which is better" as a regression metric. Position bias plus no absolute bar.
- Updating the judge prompt in the same PR that "improves" the agent. Both numbers move.
- Judging the whole trajectory for success. That is [speech replacing world state](./outcome-vs-transcript/lesson.md) (id: outcome-vs-transcript).
- Gold set of 8 items and a claimed κ.
- Using the judge online at 100% traffic with a floating model alias (`latest`).

## How to talk about it

"I only use a judge for a named fuzzy quality. Binary rubric, human gold, publish false-pass, probe order and length bias, pin the judge in the eval harness, and keep outcome checks in code. If humans do not agree, I do not have an eval yet. If the judge and the agent ship together, I do not have a measurement."

If they ask for a number to quote: quote **false-pass versus gold** on the quality you actually ship, not a 1–5 mean.

## Cross-links

- [Graders: code, model, human](./graders/lesson.md) (id: graders)
- [Outcome versus transcript](./outcome-vs-transcript/lesson.md) (id: outcome-vs-transcript)
- [Start evals from real failures](./how-to-run-proper-evals.md) (id: how-to-run-proper-evals)
- [Offline gates and online drift](./online-offline-evals.md) (id: online-offline-evals)
- [Eval harness versus agent harness](./eval-harness-vs-agent-harness/lesson.md) (id: eval-harness-vs-agent-harness)
- [Pass@k versus pass^k](./pass-at-k/lesson.md) (id: pass-at-k)
