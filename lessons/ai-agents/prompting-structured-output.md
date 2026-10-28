---
id: prompting-structured-output
title: Ask for structure, then verify it
slug: prompting-structured-output
kind: concept
track: ai-agents
difficulty: intro
estimated_minutes: 15
summary: Write instructions and examples that pin down the task, request output against a schema, and validate with a bounded retry before anything downstream trusts it.
tags:
  - ai-agents
  - ai-agents/models
  - ai-agents/tools
  - interviews
  - interviews/ai
prerequisites:
  - llm-basics
related:
  - llm-basics
  - tool-calling
  - prompt-injection-guardrails
  - graders
company_signal: []
sources_consulted:
  - https://json-schema.org/understanding-json-schema
  - https://arxiv.org/abs/2005.14165
updated: 2026-10-28
status: canonical
---

# Ask for structure, then verify it

## Snapshot

- A good prompt states the **task, inputs, constraints, and output format** explicitly, and separates instructions from untrusted data with clear delimiters.
- **Examples** (few-shot) teach format and edge cases faster than adjectives; choose them to cover the hard cases, not just the easy one.
- Request output against a **schema**. Many APIs offer a JSON or schema-constrained mode; feature names and guarantees differ by provider and change over time.
- **Validate** in code: parse, check the schema, then check meaning. On failure, retry a bounded number of times with the specific error, then fall back.

## Why it shows up in interviews

Any feature that turns model text into program state (a ticket category, a calendar event, a tool argument) needs a contract. Interviewers want to see that you treat model output like input from an untrusted client: shaped by the prompt, enforced by code.

## Core idea

### ELI5

Hand a new teammate a form with labeled boxes and two filled-in samples, instead of saying "write me something about this email". When the form comes back, check every box before filing it. If a box is wrong, hand it back with a note saying which box, at most a couple of times.

1. Say what the job is, what the input is, and what shape the answer must have.
2. Show one or two complete examples, including a tricky one.
3. Parse the reply. Check the shape. Check that the values make sense.
4. If it fails, send back the exact complaint and try again, up to a limit.
5. Still failing: return a safe default, queue for a human, or surface an error.

### Instructions that hold

- Put stable instructions first (system or developer message), then reference material, then the specific request.
- Wrap user-supplied or retrieved text in delimiters such as `<email>…</email>` and say that its contents are data. This reduces confusion; it does **not** stop a determined injection (see the guardrails lesson).
- Name the allowed values ("one of billing, bug, account") instead of "pick a category".
- Say what to do when the input does not fit: an `unknown` value or an explicit refusal field beats a forced guess.
- Keep a prompt in version control with its eval set; a prompt edit is a code change.

### Schemas and validation

A schema (JSON Schema, or the subset a provider supports) states types, required fields, and enums. A constrained decoding mode, where available, prevents malformed JSON. Neither checks meaning: a well-formed `priority: 4` for a password-reset question is still wrong, and a valid `order_id` may belong to another customer. Semantic checks and authorization stay in your code.

```ts
type Ticket = { category: "billing" | "bug" | "account"; priority: number; summary: string };
const CATEGORIES = ["billing", "bug", "account"];

function validate(x: any): string[] {
  const errors: string[] = [];
  if (typeof x !== "object" || x === null) return ["not an object"];
  if (!CATEGORIES.includes(x.category)) errors.push(`category must be one of ${CATEGORIES.join("|")}`);
  if (!Number.isInteger(x.priority) || x.priority < 1 || x.priority > 4) errors.push("priority must be an integer 1-4");
  if (typeof x.summary !== "string" || x.summary.length === 0 || x.summary.length > 80) errors.push("summary must be 1-80 chars");
  return errors;
}

// Stand-in for a model call: replies in order, ignoring the prompt
function fakeModel(replies: string[]) {
  let i = 0;
  return (_prompt: string) => replies[Math.min(i++, replies.length - 1)];
}

function extract(model: (p: string) => string, email: string, maxAttempts: number) {
  let prompt = `Return JSON {category, priority, summary} for this email:\n<email>${email}</email>`;
  let errors: string[] = [];
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const raw = model(prompt);
    try {
      const parsed = JSON.parse(raw);
      errors = validate(parsed);
      if (errors.length === 0) return { ok: true, attempt, value: parsed as Ticket };
    } catch {
      errors = ["reply was not valid JSON"];
    }
    prompt += `\nYour last reply was rejected: ${errors.join("; ")}. Reply with JSON only.`;
  }
  return { ok: false, attempt: maxAttempts, errors };
}

const email = "I was charged twice for order 4471, please fix";
const replies = [
  "Sure! Here is the JSON: {category: billing}",
  '{"category":"refund","priority":2,"summary":"Double charge on order 4471"}',
  '{"category":"billing","priority":2,"summary":"Double charge on order 4471"}',
];
console.log(extract(fakeModel(replies), email, 3)); // ok on attempt 3
console.log(extract(fakeModel(replies), email, 2)); // gives up with the last error
```

The fake model makes the control flow testable offline: attempt 1 is not JSON, attempt 2 is JSON with an invalid enum, attempt 3 passes. With a budget of 2, the caller gets a structured failure it can route to a fallback.

## Worked example

### Easy

A calendar assistant extracts `{title, start, durationMinutes}` from "Lunch with Priya Thursday at 12:30 for an hour". The schema requires an ISO timestamp and an integer. Validation confirms `durationMinutes` is 60 and `start` parses; code, not the model, resolves "Thursday" against the user's time zone.

### Medium

A cart-review classifier returns `"category": "Billing "` with a capital and a trailing space 3% of the time. Do not normalize silently forever: tighten the enum in the schema mode, add an example, and keep a lenient normalizer only if the eval shows it never maps to the wrong value.

### Hard

The model returns valid JSON with `priority: 1` (urgent) for every email that contains the word "urgent", including newsletters. The schema cannot catch this; it is a task-quality problem. Add a labeled eval set with marketing emails, include a counter-example in the prompt, and measure precision on priority 1 before and after. Retrying with "be careful" does not fix a systematic bias.

**Practice:** design the fallback for the `ok: false` case in an inbox triage feature. Who sees the email, what label does it get, and what gets logged so the failure becomes a test case?

## Common mistakes

- Using regex to fish JSON out of chatty prose instead of requesting a strict format.
- Treating schema-valid output as correct or authorized.
- Retrying without telling the model what was wrong, or retrying without a cap.
- Few-shot examples that all look alike, so the edge case is never shown.
- Hiding a fallback that silently assigns a default label, which then skews metrics.
- Changing a prompt without rerunning its evaluation set.

## How to talk about it

"I give the model a clear task, delimited input, the allowed values, and a couple of examples that include the edge case. I ask for schema-shaped output, then parse, validate shape, and validate meaning in code. On failure I retry once or twice with the exact error, then fall back and log the case for the eval set."

## Cross-links

- [Predict a token, sample it, repeat](./llm-basics.md) (id: llm-basics)
- [Make tool contracts enforceable](./tool-calling/lesson.md) (id: tool-calling)
- [Treat retrieved text as data, not orders](./prompt-injection-guardrails/lesson.md) (id: prompt-injection-guardrails)
- [Choose a grader for the evidence available](./graders/lesson.md) (id: graders)
- [Choose prompting, retrieval, or fine-tuning](./fine-tune-vs-prompt-vs-retrieve.md) (id: fine-tune-vs-prompt-vs-retrieve)
