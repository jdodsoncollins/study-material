---
id: async-ai-screen
title: "Optional: sit an interview where the interviewer is software"
slug: async-ai-screen
kind: strategy
track: ai-agents
difficulty: intro
estimated_minutes: 12
summary: "Optional. Practice a timed screen you do alone, on camera, assuming the transcript is what gets read."
tags:
  - ai-agents
  - interviews
  - interviews/ai
prerequisites:
  - take-home-artifacts
  - interview-integrity
related:
  - take-home-artifacts
  - interview-integrity
  - ai-policy-bands
  - no-ai-fluency
company_signal:
  - name: Ashby
    evidence: https://x.com/benjaminencz/status/2110411083781640192
    year: 2026
    confidence: high
sources_consulted:
  - https://x.com/benjaminencz/status/2110411083781640192
  - https://x.com/ashbyhq/status/2052435565581373568
  - https://x.com/ashbyhq/status/2110407065323925971
updated: 2026-11-02
status: canonical
---

# Optional: sit an interview where the interviewer is software

## Snapshot

- Optional track. Do it before a screen that is explicitly asynchronous.
- Ashby announced a voice AI interviewer after acquiring Talent Llama, on 7–8 May 2026, and set a public launch for 17 November 2026 [P]. The product is structured interviews candidates do on their own time.
- That is a product announcement, not a published description of how Ashby interviews engineers.
- Other async screens show up in candidate notes (a CoderPad you take alone) and in posts about vendor AI interviewers [2nd].
- Assume the recording and the transcript are the deliverable.

## Why it shows up in interviews

The interviewer is sometimes software. Google has also been reported as piloting Gemini to help human interviewers with notes [R, October 2026]. Those are different: one replaces the live conversation, the other assists the human. You prepare for the first by speaking in complete answers, once, because there is no one to ask you to clarify your mumble. You prepare for the second by staying coherent on camera anyway.

## Core idea

### What changes when nobody is in the room

- You cannot ask a clarifying question and wait. Say your assumption, then proceed. "I'm assuming the input fits in memory. If it does not, I would stream it."
- Silence looks like a stall. Narrate the plan in one or two sentences, then type.
- The transcript rules from [take-home artifacts](./take-home-artifacts.md) (id: take-home-artifacts) apply if an assistant is allowed. If it is not, the no-AI rules apply. Ask before the day. Ashby's product is for their customers' candidates. It does not tell you whether a given employer allows an assistant inside the screen.
- A vendor may score you on a rubric you do not see. Answer in the shape those rubrics usually have: assumption, approach, check, trade-off. Short.

### A 25-minute rehearsal

Record yourself. Pick a prompt you already know, so the content is not the point. Watch it once. You are looking for: a mumbled assumption, a minute of silence, reading a generated paragraph as if it were your reasoning, and an ending with no trade-off.

## Worked example

### Easy

A coding prompt you have solved before. Two minutes spoken: inputs, output, the approach, one edge. Then code. Then one sentence on a case you did not handle. Stop at 25 minutes even if the code is unfinished. Completeness is less informative than the recording.

### Medium

A behavioral prompt from [slope stories](../behavioral/ai-fluency-slope.md) (id: ai-fluency-slope). One take. No restart unless you truly lost the thread. Restarts are a smell when the product only keeps the last try, and you may not know which it keeps.

### Hard

The screen allows a provided assistant and records the chat. Do one narrow prompt, read the answer, and say on camera what you reject. If you cannot say the rejection out loud, you are not ready for a graded transcript.

## Common mistakes

- Treating a product launch as "this company interviews this way."
- Whispering the plan and then going silent for ten minutes.
- Restarting the answer until it sounds scripted.
- Using a hidden overlay. That is the failure mode in [integrity](./interview-integrity.md) (id: interview-integrity), and a recording makes it worse.
- Assuming the assistant is allowed because the interviewer is an AI. Those are separate policies.

## How to talk about it

"I'll state the assumption on camera, then the approach, then I'll code. If I use the assistant I'll say what I asked and what I'm rejecting. I'll end with the case I did not finish."

## Cross-links

- [Leave a transcript you would let a hiring manager read](./take-home-artifacts.md) (id: take-home-artifacts)
- [What proctoring flags and how to stay clean](./interview-integrity.md) (id: interview-integrity)
- [Three AI policy bands and how to ask which one applies](./ai-policy-bands.md) (id: ai-policy-bands)
- [Tell the slope of your AI practice](../behavioral/ai-fluency-slope.md) (id: ai-fluency-slope)
