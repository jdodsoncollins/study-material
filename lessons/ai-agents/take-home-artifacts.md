---
id: take-home-artifacts
title: Leave a transcript you would let a hiring manager read
slug: take-home-artifacts
kind: strategy
track: ai-agents
difficulty: core
estimated_minutes: 18
summary: Ship an AI-allowed take-home with decisions, a catch log, and a chat transcript that shows plan, check, and what you rejected.
tags:
  - ai-agents
  - ai-agents/evals
  - interviews
  - interviews/ai
prerequisites:
  - ai-policy-bands
  - greenfield-ai-build
related:
  - greenfield-ai-build
  - reviewing-ai-code
  - no-ai-fluency
  - plan-build-review
company_signal:
  - name: Rootly
    evidence: https://x.com/jjrichardtang/status/2027502646223921256
    year: 2026
    confidence: high
  - name: OpenAI
    evidence: https://openai.com/interview-guide/
    year: 2026
    confidence: high
  - name: Datadog
    evidence: https://careers.datadoghq.com/candidate-experience/interviewing-at-datadog-ai-guidelines/
    year: 2026
    confidence: high
  - name: CodeSignal
    evidence: https://codesignal.com/blog/introducing-ai-assisted-coding-assessments-interviews/
    year: 2026
    confidence: high
sources_consulted:
  - https://x.com/jjrichardtang/status/2027502646223921256
  - https://openai.com/interview-guide/
  - https://careers.datadoghq.com/candidate-experience/interviewing-at-datadog-ai-guidelines/
  - https://codesignal.com/blog/introducing-ai-assisted-coding-assessments-interviews/
  - https://coderpad.io/survey-reports/coderpad-state-of-tech-hiring-2026/
  - https://www.anthropic.com/engineering/AI-resistant-technical-evaluations
  - https://x.com/stas_sorokin_/status/2115502439667236882
updated: 2026-11-02
status: canonical
---

# Leave a transcript you would let a hiring manager read

## Snapshot

- Take-homes graded only on the diff are losing signal. Recruiters in CoderPad's 2026 survey scored take-homes at 12% for reflecting the job [P].
- A reported 45-minute take-home was fully passed by coding agents in about 20 seconds, 160 of 160 tests [2nd].
- Surviving take-homes grade the process: transcript, a short video, a live defense.
- Rootly's CEO: candidates submit the transcript and a Loom of how they used the assistant [P].
- Non-disclosure can disqualify you where the rules require it. Datadog says so for rounds where AI is not the announced mode [P].

## Why it shows up in interviews

Karat's 2026 survey says take-home and automated-test signal degrades the fastest under AI [P]. Gergely Orosz has said async take-homes increasingly come back as model capability [P, newsletter]. Anthropic redesigned a performance take-home three times because Claude kept beating it, and wrote that judgment about tooling is part of the signal [P]. Companies that still send a take-home often ask for the chat. HackerRank's MCP can show reviewers the AI history [2nd, vendor]. Codility's assistant gives the team the full transcript [2nd]. CodeSignal's AI-enabled mode includes the transcript and a session replay [P]. Hiring managers on X have called the agent transcript the most important artifact [2nd]. OpenAI's own guide says some formats allow tools and others do not, and a reported loop includes a 48-hour take-home plus a line-by-line drill [P for the guide, 2nd for that loop]. 1Password candidates describe a 48-hour events API and then a deep dive [2nd].

## Core idea

### Three files, even if they only ask for the repo

Write them as you go, not the night before you submit.

- `DECISIONS.md`: three choices, each with the alternative you rejected and why.
- `AI-LOG.md`: what you delegated, what you caught, what you rewrote.
- The transcript itself, exported before you delete the embarrassing turns. If you would not want it read aloud, it is not done.

A five-minute video script: the cut line, one decision, one miss you caught, one thing you would do with another day. Rootly asks for a short Loom with the transcript [P].

### What the assistant usually misses

Run this pass before you record. On a webhook or events sender:

- an idempotency key on the receiver
- retrying 4xx (retry 5xx and timeouts)
- jitter
- a poison message and a dead-letter path
- backoff that trusts a skewed clock
- an unbounded queue
- secrets in logs
- signature checks on the inbound call

Rootly's discriminating moment, in the CEO's telling: one candidate noticed a missed retry path, another kept hitting fix [P].

### Transcript hygiene

Graded chats, from the reports above, punish long vague prompts, repeated "fix the error," and secrets pasted into the box. A chat you can defend has short prompts with constraints, a visible plan then act then check, few retries, and no credentials. After two failed attempts on the same bug, drop to hand debugging and say so in the log.

Disclose tools when the page says to. Datadog's May 2026 guidelines: AI is expected only in announced AI-assisted coding interviews, and hiding use can disqualify you [P]. GitLab and Deliveroo are described, secondhand via an October 2026 aggregator, as wanting AI use cited on take-homes [2nd].

## Comparison

Score any practice round, AI or not, on this 1–4 guide. It merges published criteria from Canva, Zapier, Sierra, Datadog, and the CoderPad survey signal that catching AI mistakes was the top choice at 66% [P].

| Score | Framing | Delegation | Verification | Ownership |
| --- | --- | --- | --- | --- |
| 1 | No plan; prompting first | The agent drives | None, or only the agent's tests | Cannot explain the output |
| 2 | Vague plan, no cut line | Some blind accepts | Tests sometimes | Explains what, not why |
| 3 | Plan, a cut, risks named | Right-sized chunks; you keep the core design | Tests every step; at least one AI error caught | Trade-offs out loud |
| 4 | Plan absorbs a new requirement | Few prompts; you reject and redirect | Adversarial tests; you name likely misses first | Production path and an honest account of the AI |

Aim for 3 or higher in every column, and 4 on verification.

### Take-home rubric

For the drill below, add this on top of the 1–4 guide.

| Signal | Points |
| --- | --- |
| Correctness under failure: retries, dedupe, dead letter | 0–4 |
| Documented catches: the AI missed it and you wrote it down | 0–3 |
| Transcript quality | 0–3 |
| Defense: any line explained; a live extension works | 0–4 |
| Scope discipline | 0–2 |

### Strong versus weak chat

| Weak | Strong |
| --- | --- |
| Pastes the whole prompt in the first minute | Restates the job, names a cut, then delegates |
| "Build the worker" | "Scaffold the HTTP handler; I will write the retry policy" |
| Accepts green tests the agent wrote for its own code | Adds one adversarial test per change |
| Never rejects a diff, or loops on "fix it" | Rejects at least one suggestion and says why |
| Secrets, customer payloads, or long rambles | Constraints, file pointers, no secrets |

## Common mistakes

- A spec-complete repo with no point of view in `DECISIONS.md`.
- AI boilerplate left in, including comments that narrate the next line.
- A file you cannot explain when a friend points at twenty lines. That is the reported OpenAI drill-down shape [2nd].
- Over-scoping past the time box.
- Treating an "AI-proof" puzzle as a prompting contest. Anthropic's public write-up says the signal moved to tooling judgment [P]. That drill is [the puzzle track](./novel-constraint-puzzle.md) (id: novel-constraint-puzzle).

## How to talk about it

"I used the assistant for the HTTP scaffold and the first test file. I wrote the retry policy. The log shows I rejected a version that retried 4xx. The transcript has the plan, the check, and that rejection. Same key on the receiver collapses a retry to one delivery."

**Notebook:** After your next three-hour practice, paste the three headings of `DECISIONS.md` and five lines of `AI-LOG.md` into your notes. If the log has no rejection, do the pass again.

## Cross-links

- [Greenfield builds in your own environment with AI](./greenfield-ai-build.md) (id: greenfield-ai-build)
- [Reviewing AI-generated code and PRs](./reviewing-ai-code.md) (id: reviewing-ai-code)
- [Keep a no-AI baseline under a timer](./no-ai-fluency.md) (id: no-ai-fluency)
- [Plan, build, and review in one half-day](./plan-build-review.md) (id: plan-build-review)
- [Make a payment retry refer to one operation](../system-design/cases/payment-idempotency/lesson.md) (id: payment-idempotency)
- [Try a puzzle where the tooling is the signal](./novel-constraint-puzzle.md) (id: novel-constraint-puzzle)
