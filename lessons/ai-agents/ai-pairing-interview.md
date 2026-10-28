---
id: ai-pairing-interview
title: Drive the assistant in a live coding round
slug: ai-pairing-interview
kind: strategy
track: ai-agents
difficulty: core
estimated_minutes: 14
summary: Run an AI-assisted coding round minute by minute, writing checks before prompting, asking for small pieces, reading every line, and saying each decision out loud.
tags:
  - ai-agents
  - interviews
  - interviews/ai
  - interviews/leetcode
prerequisites:
  - interview-ai-round
related:
  - interview-ai-round
  - coding-agent-evals
  - agent-mistakes
  - pattern-first-prep
company_signal: []
sources_consulted: []
updated: 2026-10-28
status: canonical
---

# Drive the assistant in a live coding round

## Snapshot

- You are graded on judgment, not on how much code the assistant typed. Make your decisions visible.
- **Checks before prompts:** write three or four input → expected cases from the stated rules before asking for code.
- **Small asks:** one function or one change per prompt, with the constraints in the prompt.
- **Read every line** the assistant gives you, out loud, against the rules. Run the checks. Then accept, edit, or reject.
- When it is wrong twice on the same point, stop prompting and write that part yourself.

## Why it shows up in interviews

Some interview loops now allow, or require, an AI assistant during a coding exercise. The format varies by team and is not standardized; ask what is allowed. The companion lesson on [AI-assisted coding and evaluation discussions](./interview-ai-round.md) (id: interview-ai-round) covers what these rounds probe and how to review generated work. This one is the in-room routine: what you do and say, in order, so the interviewer can watch you steer.

## Core idea

### ELI5

Pair programming with a fast, confident junior who never says "I'm not sure". You set the direction, hand over small, clear tasks, check each one before it goes in, and explain to the person watching why you kept or changed it.

### The routine

1. **Clarify the room (1 minute).** Which assistant, what it can see (one file or the repo), whether you may run code, whether you may search docs. Say "I'll narrate what I accept and why".
2. **Restate and pin rules (3 minutes).** Turn the prompt into explicit rules: units, boundaries (`>` or `>=`), empty input, rounding, ordering. Ask the interviewer to confirm the ambiguous ones. These rules go into your prompts verbatim.
3. **Write checks first (3 minutes).** Three to five cases: the happy path from the prompt, both sides of each boundary, an empty or zero case. Typed by you, so they reflect your understanding, not the assistant's.
4. **Ask small.** "Write `total(subtotalCents)` using these rules: … Integer cents only, no floating-point results." One unit per prompt. Paste the rules; do not assume the assistant remembers them correctly.
5. **Read before running.** Walk the output top to bottom: inputs, branches, return types, anything you did not ask for (new dependencies, renamed functions, deleted code). Say what you see.
6. **Run checks and decide.** Pass: say why you trust it beyond the checks. Fail: name the cause before re-prompting.
7. **Know when to take the wheel.** Two misses on the same point, a hallucinated API, or a change you can write faster than you can describe: type it yourself.
8. **Keep a running note.** A short comment block or the interviewer's doc: decisions made, open questions, what is left. It is your recovery point if time runs short.

### What to say

- When accepting: "This matches rule 2, the boundary is strict, and the checks at 5,000 and 5,001 pass."
- When rejecting: "It multiplies by 0.9, which produces fractions of a cent. I will round the discount instead."
- When unsure: "I have not seen this method before. Before I rely on it, I will check the docs or use a plain loop."
- When short on time: "The core path works and is tested. Remaining: the coupon stacking rule. Here is how I would do it."

## Worked example

### Easy

Prompt: a cart applies 10% off when the subtotal is over $50.00. Amounts are integer cents; the discount is rounded to the nearest cent. You write checks, ask for the function, and run both the draft and your edit.

```ts
// Agreed rule: 10% off subtotals strictly over $50.00, amounts in integer cents, discount rounded to the nearest cent
const checks: [number, number][] = [[5000, 5000], [5001, 4501], [7999, 7199], [0, 0]];

// What the assistant drafted
function totalDraft(subtotalCents: number): number {
  return subtotalCents > 5000 ? subtotalCents * 0.9 : subtotalCents;
}

// After reading it against the rule
function total(subtotalCents: number): number {
  if (subtotalCents <= 5000) return subtotalCents;
  return subtotalCents - Math.round(subtotalCents / 10);
}

function run(name: string, fn: (c: number) => number) {
  const failures = checks.filter(([input, want]) => fn(input) !== want).map(([input, want]) => `${input}: got ${fn(input)}, want ${want}`);
  console.log(name, failures.length === 0 ? "all pass" : failures);
}

run("draft", totalDraft); // 5001 -> 4500.900000000001, 7999 -> 7199.1
run("fixed", total);      // all pass
```

The boundary was right; the units were wrong. Say exactly that, make the one-line change, and move on. Do not ask the assistant to "fix it" without saying what is broken.

### Medium

The interviewer adds: "Coupons stack: a $5 coupon applies after the percentage discount, and the total never goes below zero." You add checks (`[5001, coupon 500] → 4001`, `[300, coupon 500] → 0`) before prompting. The assistant's version calls `cart.applyCoupons()`, a helper that does not exist anywhere in this codebase. Say so, write the two lines with `Math.max(0, …)` yourself, and rerun. Spotting an invented API is a strong signal; quietly debugging it is a weak one.

### Hard

You ask for the coupon change and the assistant returns a rewrite of the whole module: renamed exports, a new `Money` class, and changed rounding in an unrelated tax function. Reject it out loud: "That is larger than the request and changes tax behavior I have not tested." Ask for the minimal diff to `total` only, or write it yourself. If the interviewer asks whether the `Money` class is a good idea, discuss it as a follow-up with its own tests, not as part of this change.

**Practice:** take any problem you have already solved on this path, set a 25-minute timer, and run the routine with an assistant. Record yourself. Count how many accepted lines you did not read aloud; aim for zero.

## Common mistakes

- Prompting before you understand the rules, then evaluating the output against the assistant's understanding instead of yours.
- Asking for the whole solution in one prompt and spending the round untangling it.
- Running code without reading it, or reading it silently so the interviewer cannot see your judgment.
- Re-rolling the same prompt hoping for a better answer instead of naming the defect.
- Accepting extra changes (renames, new dependencies, deleted checks) you did not request.
- Never writing code yourself, even when it would be faster than describing it.

## How to talk about it

"I'll pin the rules and write a few checks first, then ask the assistant for one function at a time with those rules in the prompt. I'll read each result against the rules out loud, run the checks, and tell you whether I'm keeping it and why. If it misses the same point twice, I'll write that part myself."

## Cross-links

- [Practice AI-assisted coding and evaluation discussions](./interview-ai-round.md) (id: interview-ai-round)
- [Evaluate patches against behavior and preserved contracts](./coding-agent-evals.md) (id: coding-agent-evals)
- [Diagnose agent failures before changing the prompt](./agent-mistakes.md) (id: agent-mistakes)
- [Floats are scientific notation, not decimals](../cs/floating-point.md) (id: floating-point)
- [Ask for structure, then verify it](./prompting-structured-output.md) (id: prompting-structured-output)
