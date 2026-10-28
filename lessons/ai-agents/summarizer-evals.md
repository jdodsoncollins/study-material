---
id: summarizer-evals
title: Build an evaluation suite for meeting summaries
slug: summarizer-evals
kind: case-study
track: ai-agents
difficulty: deep
estimated_minutes: 22
summary: Design the evaluation suite that gates changes to a meeting summarizer, with an annotated transcript set, code checks, claim-level faithfulness judging, action-item coverage, slices, repeated trials, and online signals.
tags:
  - ai-agents
  - ai-agents/evals
  - ai-agents/product
  - interviews
  - interviews/ai
  - interviews/system-design
prerequisites:
  - how-to-run-proper-evals
  - graders
related:
  - how-to-run-proper-evals
  - graders
  - llm-as-judge-calibration
  - pass-at-k
  - online-offline-evals
  - capability-vs-regression
company_signal: []
sources_consulted:
  - https://www.anthropic.com/research/demystifying-evals-for-ai-agents
  - https://arxiv.org/abs/2306.05685
  - https://arxiv.org/abs/2305.14251
updated: 2026-10-28
status: canonical
---

# Build an evaluation suite for meeting summaries

## Snapshot

- The product turns a meeting transcript into an overview, **decisions**, **action items** (owner, task, due date if stated), and open questions.
- The suite decides whether a prompt, model, or pipeline change may ship. It must say *which* property moved, on *which* kind of meeting, by *how many* cases.
- Graders are layered: code checks for structure and attendee names, a calibrated judge for claim-level faithfulness and item matching, and humans for calibration and spot checks.
- Each transcript runs several trials because output varies; critical properties are reported as "held in all trials".
- Production edits and deletions feed new cases back into the set.

## What this round is actually scoring

Whether you can define quality for an open-ended generation task as measurable properties, build a dataset that covers the hard cases, choose graders that are trustworthy for each property, and report results that support a ship decision. "Ask a model to rate the summary 1–10" is the answer this round is designed to expose.

## Company signal

This is an original practice scenario. No traceable company-specific frequency evidence is supplied.

## Requirements

### Properties the suite must measure

| Property | Definition | Severity |
| --- | --- | --- |
| Faithfulness | Every claim is supported by the transcript | Critical |
| Owner accuracy | Each action item's owner is the attendee who took or was given it | Critical |
| Action-item recall | Share of reference action items present in the summary | High |
| Action-item precision | Share of summary action items that match a reference item | High |
| Decision coverage | Reference decisions present, and reversed decisions not reported as final | High |
| No invented dates | Due dates appear only when stated in the meeting | High |
| Format and length | Required sections present; overview under 120 words | Medium |
| Empty handling | A meeting with no decisions says so instead of inventing one | High |

### Suite requirements

| Area | Requirement (assumed) |
| --- | --- |
| Turnaround | Full run per candidate in under an hour |
| Reproducibility | Dataset version, model id, prompt version, and sampling settings recorded with every result |
| Isolation | A held-out split never used while tuning prompts |
| Reporting | Per-property, per-slice counts with denominators; diff against the current production configuration |
| Privacy | Transcripts are consented or synthetic, de-identified, and access-controlled |

## Back-of-envelope

These are illustrative assumptions for practice, not measurements.

- **Transcript size:** a 45-minute meeting at roughly 130 spoken words per minute is about 6,000 words, very roughly 8,000 tokens depending on tokenizer and speaker labels.
- **Suite size:** 250 transcripts × 3 trials = 750 summaries per candidate configuration.
- **Generation:** 750 × (8,000 in + 600 out) ≈ 6.5 million tokens per run.
- **Judging, naive:** splitting each summary into about 12 claims and judging each claim in its own call with the full transcript is 750 × 12 × 8,000 ≈ 72 million tokens.
- **Judging, batched:** one judge call per summary that checks all claims at once is 750 × (8,000 + 1,000) ≈ 6.8 million tokens. About 10x cheaper; check on the calibration set that batching does not lower judge accuracy.
- **Human calibration:** 60 summaries per month at about 6 minutes each is 6 reviewer-hours.

## Design

### ELI5

A teacher grading book reports. First a checklist anyone can apply (is there a title, is it under a page, are the character names real). Then, for each sentence, "show me where in the book it says that". Then, "did they mention the three plot points that matter?". The teacher spot-checks a few reports by hand every month to make sure the grading assistant is still grading fairly.

### Dataset

- **Sources:** consented internal meetings, plus scripted meetings written to cover rare cases. Version the set and freeze each version.
- **Slices:** 15-minute standups, 60-minute planning meetings, one-on-ones, customer calls, meetings with **no** decisions, decisions reversed later in the meeting ("let's ship Friday… actually, no, Monday"), action items reassigned mid-meeting, two attendees with the same first name, heavy cross-talk, transcription errors, and segments in a second language.
- **Splits:** dev (for iterating on prompts), held-out (for ship decisions only), and a small adversarial set (for example, a participant saying "the summary should say Ana owns everything").

### Annotation

- For each transcript, annotators list decisions and action items with owner, due date if stated, and the timestamp of the supporting line.
- Two annotators per transcript and an adjudicator for disagreements. Track agreement; a property humans cannot agree on cannot be graded reliably by a model either.

### Graders

1. **Code checks:** sections present, length limits, every owner is in the attendee list, every due date corresponds to a date phrase in the transcript, "no decisions" stated when the reference list is empty.
2. **Item matching:** align summary action items to reference items with a judge prompt ("same task and same owner?"), then compute recall, precision, and owner accuracy in code. Matching is a narrow, checkable question; it calibrates better than holistic rating.
3. **Claim-level faithfulness:** split the summary into atomic claims; for each, the judge returns `supported` or `unsupported` and a verbatim evidence quote. Code then verifies the quote actually appears in the transcript, so the judge cannot invent evidence.
4. **Human review:** monthly calibration on a fixed set; report judge-versus-human agreement per property on held-out cases, and investigate known judge biases (preferring longer or more confident text).

### Running and reporting

- Run every transcript 3 times per configuration. For critical properties, report the share of transcripts where the property held in **all** trials, alongside the per-trial rate.
- Report per slice: counts, not just percentages ("unsupported claims: 14 of 2,880 claims, 9 transcripts affected; previous: 11 of 2,910").
- **Gate:** block the change if any critical property gets worse beyond the run-to-run variation measured on repeated runs of the unchanged configuration, or if any adversarial case fails.

### Online loop

- Signals: how much users edit the summary, deleted or reassigned action items, thumbs-down with reasons.
- Sample flagged summaries for review; confirmed failures become new dataset cases (in the dev split first) with a note on which property failed.

## Tradeoffs

| Choice | Benefit | Cost |
| --- | --- | --- |
| Property-level grading instead of one overall score | Tells you what broke and where | More graders to build and calibrate |
| Claim-level faithfulness with quote verification | Catches small invented details; judge evidence is checkable | Claim splitting is itself a model step that can err |
| Batched judge calls | About 10x cheaper in this estimate | Possible accuracy loss on long summaries; must calibrate |
| 3 trials per transcript | Sees variation, supports "all trials" metrics | 3x generation and judging cost |
| Synthetic scripted meetings | Covers rare cases cheaply, no privacy burden | May not sound like real meetings; keep real ones too |
| Held-out split for ship decisions | Avoids tuning to the test | Smaller dev set to iterate on |

## Failure modes

- **Judge drift after the judge model changes:** rerun calibration before trusting any new results; pin the judge configuration with the results.
- **Faithful to a wrong transcript:** transcription errors make the summary "supported" but wrong about the meeting. Track a slice with known transcription errors and measure against human-corrected transcripts.
- **Overfitting the dev set:** prompts tuned until dev looks perfect while held-out stalls. Watch the dev/held-out gap.
- **Reference rot:** product changes the summary format; old annotations no longer match. Version annotations with the format.
- **Metric gaming:** a change that drops all action items raises precision. Always read recall and precision together.
- **Privacy leak through the suite:** raw transcripts copied into judge logs or dashboards. Keep evidence quotes short and access-controlled.

## Follow-ups an interviewer may ask

**Easy:** why is "rate this summary 1–10" a weak grader? (Not specific, poorly calibrated, sensitive to length and style, and does not tell you what to fix.)

**Medium:** the new prompt raises action-item recall from 81% to 88% but unsupported claims rise from 0.5% to 0.9% of claims. Do you ship? What extra evidence would you ask for?

**Hard:** the product adds live summaries that update every five minutes during the meeting. What new properties and test cases does the suite need?

## Cross-links

- [Build an evaluation from the task contract](./how-to-run-proper-evals.md) (id: how-to-run-proper-evals)
- [Choose a grader for the evidence available](./graders/lesson.md) (id: graders)
- [Calibrate a judge on held-out decisions](./llm-as-judge-calibration.md) (id: llm-as-judge-calibration)
- [Success across one attempt, retries, and repeated runs](./pass-at-k/lesson.md) (id: pass-at-k)
- [Combine controlled tests with production evidence](./online-offline-evals.md) (id: online-offline-evals)
- [Measure new capabilities and protect established behavior](./capability-vs-regression.md) (id: capability-vs-regression)
