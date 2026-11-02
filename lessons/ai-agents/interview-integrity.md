---
id: interview-integrity
title: What proctoring flags and how to stay clean
slug: interview-integrity
kind: strategy
track: ai-agents
difficulty: intro
estimated_minutes: 12
summary: Understand what detection tools watch for so you can present honest work without triggering false positives.
tags:
  - ai-agents
  - interviews
  - interviews/ai
prerequisites: []
related:
  - ai-policy-bands
  - interview-ai-round
  - ai-pairing-interview
company_signal:
  - name: Amazon
    evidence: https://www.businessinsider.com/amazon-stop-people-using-ai-cheat-job-interviews-2025-2
    year: 2025
    confidence: high
  - name: HackerRank
    evidence: https://support.hackerrank.com/articles/5663779659-proctor-mode
    year: 2026
    confidence: high
  - name: Meta
    evidence: https://interviewing.io/blog/how-to-use-ai-in-meta-s-ai-assisted-coding-interview-with-real-prompts-and-examples
    year: 2026
    confidence: medium
sources_consulted:
  - https://www.businessinsider.com/amazon-stop-people-using-ai-cheat-job-interviews-2025-2
  - https://support.hackerrank.com/articles/5663779659-proctor-mode
  - https://codesignal.com/blog/introducing-ai-assisted-coding-assessments-interviews/
  - https://interviewing.io/blog/how-to-use-ai-in-meta-s-ai-assisted-coding-interview-with-real-prompts-and-examples
updated: 2026-11-02
status: canonical
---

# What proctoring flags and how to stay clean

## Snapshot

- Proctoring platforms watch for overlays, typing patterns, tab switches, copy-paste, and webcam anomalies
- Amazon's recruiter guidance lists behavioral tells like typing while being asked a question and reading answers aloud
- HackerRank takes screenshots every 15 seconds and detects conversation-like typing patterns
- CoderPad, CodeSignal, and Karat review AI transcripts when AI is allowed; Codility gives the hiring team the full chat
- Honest and fluent beats clever; narrate your lookups in allowed resources

## Why it shows up in interviews

As AI use grew in 2025–2026, companies built detection into platforms and interviewer training. Even in AI-allowed rounds, platforms record your AI transcript and screen activity. In no-AI rounds, proctoring looks for overlay tools, off-screen reading, and typing patterns that suggest you're feeding questions to an assistant. Understanding what gets flagged helps you present honest work without triggering false positives.

## Core idea

### What platforms detect

**Screen and webcam monitoring**

HackerRank Proctor Mode (as of 2026):
- Webcam face and object detection
- Single-monitor check
- Full-screen enforcement
- Tab monitoring
- Screenshots every 15 seconds (5 seconds when suspicious)
- Analysis for "invisible overlay applications"
- "Conversation detection" from typing and deleting patterns in the editor
- Copy-paste disabled
- Code-similarity checks
- Integrity results rated High or Medium

CodeSignal: In AI-enabled mode, the full transcript of AI interactions plus session replay is visible to reviewers.

CoderPad: Copy/paste and tab-leave detection on by default.

**Behavioral tells (Amazon's February 2025 recruiter guidance)**

Recruiters watch for:
- Typing while being asked a question
- Reading answers aloud, including self-corrections on misread words (a tell that you're reading AI output)
- Eyes tracking text off-screen
- Confident answers that don't address the question
- Reacting confusedly to incorrect AI output

Amazon's guidance warns that suspected AI use "may result in disqualification."

**AI transcript review (when AI is allowed)**

When AI is permitted, the platform often records your chat history:
- HackerRank's MCP shows reviewers the candidate's AI chat history (as of October 2026)
- Codility's "Cody" gives the hiring team the full transcript
- Karat NextGen allows only its integrated assistant and records interactions
- CodeSignal Cosmo provides transcript plus session replay

Hiring managers on X describe the agent transcript as "the most important artifact" of a take-home.

**What overlay tools look like**

Interview Coder (marketed November 2025 as an "undetectable translucent desktop overlay"; it became Cluely) was designed to evade detection by sitting on top of the interview window. In January 2026, reports surfaced of a user-data leak. Overlay tools are explicitly targeted by HackerRank's "invisible overlay application" detection.

### How to stay clean

**In no-AI rounds**

1. **Close all overlays and extra monitors.** Use one screen. Turn off virtual backgrounds.
2. **Don't type while being asked a question.** If you take notes, say so: "I'm writing down the constraints."
3. **Narrate lookups in allowed resources.** Stripe allows Google and Stack Overflow. If you check MDN for a method signature, say it out loud: "I'm checking MDN for the Array.prototype.toSorted signature."
4. **Watch for AI answers at the top of Google search results.** Stripe's recruiter Eugene Ho warns about this explicitly. Scroll past the AI summary to Stack Overflow or MDN.
5. **Don't use an overlay or teleprompter tool.** Interview Coder leaked user data, and platforms detect these.
6. **Practice standard-library recall** so you don't need to look up basics under time pressure.
7. **Turn off autocomplete beyond the language server** if the guidelines forbid it. Cursor's screens allow language-server autocomplete but nothing more.

**In AI-allowed rounds**

1. **Use only the provided tool** unless the guidelines explicitly say "your own setup." Meta's AI-enabled round allows only the CoderPad assistant, not outside tools.
2. **Disclose AI use** when required. Datadog's May 2026 guidelines say non-disclosure can disqualify you. GitLab and Deliveroo require citing AI in take-homes.
3. **Produce a transcript you're glad to have graded.** Short, specific prompts with constraints. Visible plan → act → check cycles. Few retries. No secrets pasted in. (See the rubric in the AI-assisted coding lesson.)
4. **Ask the recruiter per round.** "Which rounds allow AI? Which tools? Will my screen be recorded? Do you review the AI transcript?"

**In all rounds**

- Share your entire screen with background filters off (Meta's reported requirement).
- Keep your webcam on and facing you.
- Don't switch tabs or applications unless the format explicitly allows it (e.g., looking up documentation in an allowed-resource round).
- If you need to adjust your setup (close a notification, silence a phone), narrate what you're doing: "I'm closing a notification."

### The integrity cost of cheating

- Disqualification (Amazon's guidance)
- Being flagged across "nearly all interview types" (Meta's reported practice)
- Data leaks (Interview Coder)
- Reputation damage if word spreads in the industry

## Worked example

### Easy

A no-AI round on HackerRank. You've closed extra monitors, turned off overlays, and disabled autocomplete beyond the language server. During the problem explanation, you don't type. When you need to check if JavaScript's `Array.prototype.sort` is stable, you say: "I'm checking MDN for sort stability," then look it up in a browser tab. You narrate the answer: "It's stable as of ES2019."

### Medium

An AI-allowed take-home for Rootly. You use your own setup (Cursor + Claude), keep the AI log, and submit it with a Loom. Your transcript shows short prompts: "write a test for the retry path", "explain why this needs an idempotency key". No secrets. The Loom narrates one mistake you caught: "The AI missed the retry jitter, so I added it."

### Hard

A Meta AI-enabled CoderPad round. The assistant is provided and can read files but not edit them. You read the codebase first (5 minutes), then ask the assistant: "list every place a Date is constructed." You catch that the AI's suggested fix for a timezone bug breaks a different test. You say: "This changes the window boundary, but it fails the test for events at midnight UTC. I'll need a different approach."

## Common mistakes

- Using an overlay tool or second monitor in a proctored round
- Typing while the interviewer is still explaining the problem
- Reading AI output aloud without saying "the AI suggested…"
- Not narrating allowed lookups (Google, Stack Overflow, MDN)
- Pasting secrets or proprietary code into an AI chat that gets reviewed
- Using outside tools in a "provided assistant only" round
- Treating a take-home as unmonitored when the guidelines require disclosing AI use

## How to talk about it

"I understand that proctoring platforms watch for overlays, typing patterns, and tab switches, and that AI transcripts are reviewed when AI is allowed. In no-AI rounds, I practice standard-library fluency and narrate any allowed lookups. In AI-allowed rounds, I use only the provided tool or my own setup if explicitly permitted, and I produce a transcript I'm comfortable being graded on. Honest and fluent beats clever."

## Cross-links

- [Three AI policy bands and how to ask which one applies](./ai-policy-bands.md) (id: ai-policy-bands)
- [Practice AI-assisted coding and evaluation discussions](./interview-ai-round.md) (id: interview-ai-round)
- [How AI interview policies changed from 2025 through 2026](./ai-interview-timeline-2026.md) (id: ai-interview-timeline-2026)
- [Practice pairing with an AI assistant on a known problem](./ai-pairing-interview.md) (id: ai-pairing-interview)
