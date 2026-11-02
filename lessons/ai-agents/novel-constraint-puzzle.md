---
id: novel-constraint-puzzle
title: "Optional: try a puzzle where the tooling is the signal"
slug: novel-constraint-puzzle
kind: strategy
track: ai-agents
difficulty: deep
estimated_minutes: 14
summary: "Optional. Practice a novel constraint where models have little training data, and write down how you spent time on tools versus the puzzle."
tags:
  - ai-agents
  - interviews
  - interviews/ai
prerequisites:
  - take-home-artifacts
related:
  - take-home-artifacts
  - no-ai-fluency
  - coding-agent-evals
company_signal:
  - name: Anthropic
    evidence: https://www.anthropic.com/engineering/AI-resistant-technical-evaluations
    year: 2026
    confidence: high
sources_consulted:
  - https://www.anthropic.com/engineering/AI-resistant-technical-evaluations
updated: 2026-11-02
status: canonical
---

# Optional: try a puzzle where the tooling is the signal

## Snapshot

- Optional track.
- Anthropic's January 2026 engineering post says a performance take-home was redesigned three times because successive Claude models beat it [P].
- The redesign moved to novel puzzles on a constrained instruction set, without the usual debugging tools [P].
- The post says judgment about how to invest in tooling is part of the signal, and that realism may be a luxury they no longer have [P].
- The original task is public as an open challenge. The bar they published is to beat 1487 cycles [P].

## Why it shows up in interviews

A normal take-home can be finished by a coding agent in seconds. One reported 45-minute assignment was passed at 160 of 160 tests in about 20 seconds [2nd]. Anthropic's response, in their own post, was to change the task until prior knowledge and the model helped less [P]. You will not see this shape everywhere. When you do, prompting harder is the wrong preparation. The preparation is deciding how long to spend building a probe, a simulator, or a test harness before you touch the score.

## Core idea

### What they changed

The early version was "make this simulated accelerator faster." Models got good at it. The later version is closer to a puzzle game: an unfamiliar machine, little documentation, no debugger. You can still write tools. The interviewer, in that write-up, wants to see whether you notice that a tool is worth more than another hour of hand edits [P].

### How to practice without spoiling the only puzzle

Do not start by pasting the public challenge into an assistant and submitting its answer. That misses the signal the post describes.

1. Read the public statement of the machine until you can explain one instruction in your own words.
2. Set a two-hour cap. Decide in the first 20 minutes whether you will write a tiny interpreter, a trace printer, or neither. Write that decision in `AI-LOG.md` the same way as [a take-home](./take-home-artifacts.md) (id: take-home-artifacts).
3. If you use a model, ask it to explain an instruction you already think you understand, and check it. Do not ask it to "solve the challenge."
4. Stop at the cap. Record the best cycle count you actually ran, or "no score yet." The number 1487 is their published bar, not a number you should claim.

A second practice, if you do not want to touch their challenge: take a programming-puzzle game you have not played, give yourself two hours, and log every tool you built. The transfer is the log, not the score.

## Worked example

### A tooling decision, composite

You have a machine with no print instruction. You can spend 40 minutes writing a simulator that dumps the register after each op, or you can keep editing a program you cannot see. The strong choice is the simulator if the remaining time is more than an hour, because every later edit gets cheaper. The weak choice is a 90-minute prompt loop that never runs the program. Write which one you picked and the minute you picked it.

### Rubric

| Signal | Points |
| --- | --- |
| You can explain the constraint without the model | 0–3 |
| A written decision about tooling, with a time cost | 0–3 |
| The model was checked against something you already knew | 0–2 |
| You stopped at the cap with an honest score | 0–2 |

## Common mistakes

- Treating the puzzle as a prompting contest.
- Claiming 1487 without a run.
- Building a framework for four hours and never executing.
- Reading a write-up of the solution before you have a score of your own.
- Assuming every Anthropic loop uses this take-home. Their candidate guidance still says live interviews are without the model unless a round says otherwise [P].

## How to talk about it

"I spent the first twenty minutes deciding to write a register dump instead of editing blind. That cost forty minutes and made the later edits readable. I used an assistant to restate one opcode I had already traced, and I caught one mismatch. I stopped at two hours. I am not claiming their published cycle bar."

## Cross-links

- [Leave a transcript you would let a hiring manager read](./take-home-artifacts.md) (id: take-home-artifacts)
- [Keep a no-AI baseline under a timer](./no-ai-fluency.md) (id: no-ai-fluency)
- [Evaluate patches against behavior and preserved contracts](./coding-agent-evals.md) (id: coding-agent-evals)
