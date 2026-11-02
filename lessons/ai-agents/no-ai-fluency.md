---
id: no-ai-fluency
title: Keep a no-AI baseline under a timer
slug: no-ai-fluency
kind: strategy
track: ai-agents
difficulty: core
estimated_minutes: 16
summary: Practice timed TypeScript with no assistant so rounds that forbid AI still show fluency, tests, and narrated lookups.
tags:
  - ai-agents
  - interviews
  - interviews/ai
prerequisites:
  - interview-integrity
  - ai-policy-bands
related:
  - interview-integrity
  - payment-idempotency
  - repo-round-three-phase
  - take-home-artifacts
company_signal:
  - name: Stripe
    evidence: https://www.linkedin.com/posts/eugenetherecruiter_in-part-1-i-talked-about-why-keyword-stuffing-activity-7420386143898181634-hsr5
    year: 2026
    confidence: high
  - name: Anthropic
    evidence: https://www.anthropic.com/candidate-ai-guidance
    year: 2025
    confidence: high
  - name: Cursor
    evidence: https://www.businessinsider.com/cursor-interview-process-no-ai-on-site-project-coding-tool-2025-6
    year: 2025
    confidence: high
sources_consulted:
  - https://www.linkedin.com/posts/eugenetherecruiter_in-part-1-i-talked-about-why-keyword-stuffing-activity-7420386143898181634-hsr5
  - https://www.anthropic.com/candidate-ai-guidance
  - https://www.businessinsider.com/amazon-stop-people-using-ai-cheat-job-interviews-2025-2
  - https://www.businessinsider.com/cursor-interview-process-no-ai-on-site-project-coding-tool-2025-6
  - https://interviewing.io/blog/how-is-ai-changing-interview-processes-not-much-and-a-whole-lot
updated: 2026-11-02
status: canonical
---

# Keep a no-AI baseline under a timer

## Snapshot

- About a third of companies ban AI in interviews, and many loops mix a no-AI round with an AI round.
- Stripe forbids AI and allows Google and Stack Overflow. Watch the AI summary at the top of search results.
- Amazon's February 2025 live-loop guidance forbids generative AI unless a round explicitly allows it. The 2026 online assessment is a different, AI-assisted format.
- Anthropic's candidate guidance: live interviews and take-homes are without Claude unless a round says otherwise.
- Run this as a weekly control so the no-AI baseline does not decay.

## Why it shows up in interviews

CoderPad's 2026 survey still has algorithmic exercises in use at 43% of teams, and an interviewing.io survey of FAANG interviewers found none of 52 respondents saying their company had dropped algorithmic questions [P]. Big-company loops that added an AI round kept the older rounds. Cursor's reported screens allow autocomplete from the language server and nothing more [R]. 1Password's live rounds are described by candidates as no-AI [2nd]. If you only practice with an assistant, those rounds measure a skill you stopped training.

## Core idea

### What to keep in your head

Standard-library recall for TypeScript, written by hand:

- `Map` and `Set`: `get`, `set`, `has`, `delete`, iterating keys.
- Sort comparators that return a number, including the 32-bit surprise if you use subtraction on huge integers.
- String and array methods you actually reach for: `slice`, `toSorted`, `Map` group-by with a loop. Say out loud when you check MDN.

### Allowed-resource etiquette

When a round allows docs, narrate the lookup: "I'm checking MDN for whether `sort` is stable." Stripe's recruiter says Google and Stack Overflow are expected, and warns that an AI answer may sit above the real thread [P]. Scroll past it. Do not type while the interviewer is still asking the question. If you take notes, say so. The tells Amazon's recruiters were given are covered in [what proctoring flags](./interview-integrity.md) (id: interview-integrity).

### Weekly control

Twice a week, one medium problem, no assistant and no autocomplete beyond the language server, target 25 minutes. Once a week, the 45-minute control below. Once a month, a bug-squash: an unfamiliar file, a failing test, Google only.

Score the control with the 1–4 guide in [take-home artifacts](./take-home-artifacts.md) (id: take-home-artifacts). On a no-AI round, verification means tests you wrote, not a transcript.

## Worked example

### The 45-minute control

This copies a Stripe-style integration round, not a leaked prompt [P, recruiter: Integration and Bug Squash exist; AI is not allowed]. Restated:

> You have an HTTP-shaped ledger. Implement `transfer(from, to, amount, idempotencyKey)`. Retries with the same key and the same payload return the first result. The same key with a different payload is a conflict. Google and docs are allowed. No AI, and no autocomplete beyond the language server.

A small in-memory sketch you should be able to write without help:

```ts
function transfer(
  balances: Map<string, number>,
  seen: Map<string, string>,
  from: string,
  to: string,
  amount: number,
  key: string,
): string {
  const fingerprint = `${from}|${to}|${amount}`;
  const prior = seen.get(key);
  if (prior && prior !== fingerprint) return "conflict";
  if (prior) return "replay";
  const bal = balances.get(from) ?? 0;
  if (bal < amount) return "short";
  balances.set(from, bal - amount);
  balances.set(to, (balances.get(to) ?? 0) + amount);
  seen.set(key, fingerprint);
  return "ok";
}

const balances = new Map([["ada", 80], ["bo", 10]]);
const seen = new Map<string, string>();
console.log(transfer(balances, seen, "ada", "bo", 40, "k-19"));
console.log(transfer(balances, seen, "ada", "bo", 40, "k-19"));
console.log(transfer(balances, seen, "ada", "bo", 15, "k-19"));
```

Say the three results before you run them: `ok`, `replay`, `conflict`. Then name what this sketch does not do: concurrent claims, a provider timeout, or a key that expires. That discussion is [payment retries](../system-design/cases/payment-idempotency/lesson.md) (id: payment-idempotency).

### Rubric for the control

| Signal | Points |
| --- | --- |
| Correctness, including idempotency | 0–4 |
| Tests written by hand | 0–2 |
| Debugging from the stack trace, not from a chat | 0–2 |
| Narrating each allowed lookup | 0–1 |
| Finished inside 45 minutes | 0–1 |

Eight or more out of 10 is the bar for this drill. If you miss the conflict case, do not add features. Fix that case and rerun.

### Bug squash, Google only

Open a small library you do not know. Break one test on purpose the night before, or use a failing test you have not seen. 30 minutes. You may search the docs. You may not paste the test into an assistant. Write the hypothesis before the edit: "the assertion expects UTC and this `Date` is local."

## Common mistakes

- Treating "no AI" as "no docs" on a round that allows Google.
- Reading the AI box at the top of the search results as if it were the docs.
- Letting autocomplete write the body while you only tab through it, on a screen that allows only the language server.
- Skipping the weekly control because the next loop is AI-allowed. Amazon's reported online assessment is a no-AI problem and then an AI repo task in one sitting [2nd for the split; the assistant itself is Amazon's own post, P].
- Silent lookups. Narration is part of the signal.

## How to talk about it

"This round is no-AI, so I'll write the tests and the transfer myself. Same key and same payload replays; same key and a different amount conflicts. I'm checking MDN for `Map` iteration, not for the design. If I get stuck I'll read the stack trace before I search."

## Cross-links

- [What proctoring flags and how to stay clean](./interview-integrity.md) (id: interview-integrity)
- [Three AI policy bands and how to ask which one applies](./ai-policy-bands.md) (id: ai-policy-bands)
- [Make a payment retry refer to one operation](../system-design/cases/payment-idempotency/lesson.md) (id: payment-idempotency)
- [Multi-phase repo rounds with an AI assistant](./repo-round-three-phase.md) (id: repo-round-three-phase)
- [Leave a transcript you would let a hiring manager read](./take-home-artifacts.md) (id: take-home-artifacts)
