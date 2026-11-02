---
id: ai-fluency-slope
title: Tell the slope of your AI practice
slug: ai-fluency-slope
kind: strategy
track: behavioral
difficulty: core
estimated_minutes: 15
summary: Prepare four true stories of what you tried, abandoned, systematized, and caught, each with a number you can defend.
tags:
  - behavioral
  - behavioral/stories
  - interviews
  - interviews/ai
  - interviews/behavioral
prerequisites:
  - story-bank
  - ai-judgment-stories
related:
  - ai-judgment-stories
  - story-bank
  - behavioral-scoring
  - project-deep-dive
company_signal:
  - name: Zapier
    evidence: https://zapier.com/blog/raising-ai-fluency-bar-in-hiring
    year: 2026
    confidence: high
  - name: Anthropic
    evidence: https://www.anthropic.com/research/employment-at-anthropic
    year: 2026
    confidence: high
  - name: Google
    evidence: https://www.businessinsider.com/google-interview-process-ai-gemini-coding-comprehension-software-engineer-2026-10
    year: 2026
    confidence: high
sources_consulted:
  - https://zapier.com/blog/raising-ai-fluency-bar-in-hiring
  - https://www.anthropic.com/research/employment-at-anthropic
  - https://www.businessinsider.com/google-interview-process-ai-gemini-coding-comprehension-software-engineer-2026-10
updated: 2026-11-02
status: canonical
---

# Tell the slope of your AI practice

## Snapshot

- Zapier's V2 hiring rubric grades the slope of someone's AI practice: what they started with, what they tried, and what they abandoned [P].
- The same rubric adds accountability: you can delegate the work and you cannot delegate the accountability [P].
- A rough result with visible iteration beats a polished result with no process [P].
- Anthropic's 2026 scorecard analysis says mentions of AI-tooling track record grew, and the largest gains in emphasis were autonomy and judgment [P].
- Google recruiting, in an October 2026 report, said AI fluency is required for every software role [R]. Confirm the round's tool rules separately. Fluency as a hiring bar is not the same as AI allowed in the interview.

## Why it shows up in interviews

[Judgment stories](./ai-judgment-stories.md) (id: ai-judgment-stories) cover a single catch. Slope stories cover a year. Interviewers who use a fluency rubric want the trajectory: a tool you dropped, a check you turned into a habit, and a boundary you still own. Live skills tests in Zapier's description watch candidates prompt, push back, and adapt [P]. The behavioral form of that test is this lesson. The stories have to be yours. The composite below is a shape, not a biography to memorize.

## Core idea

### Four slots

Use the [story bank](./story-bank/lesson.md) (id: story-bank) beats, and add one line for what you systematized.

| Slot | Question it answers | Number you need |
| --- | --- | --- |
| Tried and dropped | What did you stop, and why? | Time or defects that made you stop |
| Boundary you still own | What do you refuse to delegate? | What broke, or what you audit |
| Systematized | What is now a repeatable loop? | How often it runs, or who else uses it |
| Caught before ship | When was the model confidently wrong? | The check, and whether users saw it |

Zapier's line about accountability fits the second slot. If the assistant drafted a permission check, you still own the allow and the deny. If you cannot name the invariant, you delegated the accountability.

Do not invent a metric. "It felt faster" fails this rubric. "The checklist caught two missing retries in one week" passes if it is true.

### A composite, not your story

A calendar team tried generating migration SQL from a prose spec and stopped after one review missed a dropped `NOT NULL`. They kept the assistant for test stubs only. The boundary they still own is who may see a shared calendar: a human writes that predicate, and the assistant may draft tests for it. The loop they systematized is a Friday pass: three adversarial cases added to whatever the assistant touched that week. The catch: a generated query counted a user twice after a join, a coworker spotted it on the pull request, and it never shipped. That is the shape. Replace every noun with your own.

One public loop you can talk about if you actually run it: this corpus. Read a lesson, attempt it closed-book, then read. That is a system with a cadence. It counts only if you do it and can say how many sessions you finished.

## Worked example

### Easy

"What have you changed about how you use these tools?"

Name the drop first. "I stopped letting it write the auth predicate after a review caught a missing deny. I still let it draft the test names. Every Friday I add one case it did not think of. Last month that was four cases, and one of them failed."

### Medium

"Tell me about a time you pushed back."

Use the caught-before-ship slot. The first sentence is the miss. The second is the check. The third is the habit. Keep the damage short. If users never saw it, say that, and do not inflate it into an outage.

### Hard

"How do you know you're getting better, not just faster?"

This is the slope question. Contrast two dates. "In March I accepted the first diff if tests passed. In September I required one adversarial case, and I can show the four failures that case produced." If you do not have two dates, you do not have this answer yet. Write it in your notes before you need it.

## Common mistakes

- A tool tour: model names, no decision you abandoned.
- Borrowed numbers, or a multiplier you cannot define.
- "We shipped AI" with no personal boundary.
- A catch story where you noticed after customers did, told as if you had prevented it.
- Claiming a team policy you only followed. Say what you personally added.

## How to talk about it

"I can delegate the draft and I cannot delegate the check. I dropped generating the permission predicate. I kept a Friday adversarial pass. Here is the count from last month, and here is the bug it caught before merge."

**Notebook:** Write the four slots in five lines each, in your own notes. Each slot needs one number. If a number is missing, leave the slot blank rather than inventing one. Then say the hard answer out loud in under two minutes.

## Cross-links

- [Show judgment about the tools you use](./ai-judgment-stories.md) (id: ai-judgment-stories)
- [Build a small bank of stories you can bend](./story-bank/lesson.md) (id: story-bank)
- [What the interviewer writes down](./behavioral-scoring.md) (id: behavioral-scoring)
- [Explain a system you built at three zoom levels](./project-deep-dive/lesson.md) (id: project-deep-dive)
- [Leave a transcript you would let a hiring manager read](../ai-agents/take-home-artifacts.md) (id: take-home-artifacts)
