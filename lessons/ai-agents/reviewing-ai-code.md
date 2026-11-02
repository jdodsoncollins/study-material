---
id: reviewing-ai-code
title: Reviewing AI-generated code and PRs
slug: reviewing-ai-code
kind: strategy
track: ai-agents
difficulty: core
estimated_minutes: 18
summary: Spot hallucinated APIs, missing error paths, security gaps, and test theater in code an AI drafted, then decide approve or request changes.
tags:
  - ai-agents
  - ai-agents/failure-modes
  - interviews
  - interviews/ai
prerequisites:
  - review-agent
  - agent-mistakes
related:
  - repo-round-three-phase
  - interview-ai-round
  - ai-policy-bands
company_signal:
  - name: Polar
    evidence: https://github.com/polarsource/polar
    year: 2026
    confidence: low
  - name: Coinbase
    evidence: https://news.ycombinator.com/item?id=49162299
    year: 2026
    confidence: medium
  - name: Sierra
    evidence: https://sierra.ai/blog/the-ai-native-interview
    year: 2026
    confidence: high
sources_consulted:
  - https://sierra.ai/blog/the-ai-native-interview
  - https://coderpad.io/survey-reports/coderpad-state-of-tech-hiring-2026/
  - https://news.ycombinator.com/item?id=49162299
updated: 2026-11-02
status: canonical
---

# Reviewing AI-generated code and PRs

## Snapshot

- A 30–45 minute round where you review a ~300-line AI-drafted PR and decide approve or request changes
- CoderPad: 21% of teams use code-review exercises; 66% of hiring leaders say "catches and fixes AI mistakes" is the top signal
- Common AI defects: hallucinated APIs, over-abstraction, swallowed errors, missing retries and idempotency, insecure defaults, test theater (tests that pass vacuously), comment bloat
- Lead with blockers (security, correctness), then should-fix (performance, clarity), then nits (style)
- Write one comment that teaches, not just points out the problem
- Some rounds ask you to fix the blocker with an agent after reviewing

## Why it shows up in interviews

As AI-written code became a larger share of production changesets (Coinbase reported 5.7% to 50%+ from Q1 to Q4 2025), companies started testing whether candidates can review it. CoderPad found 21% of teams use code-review tasks. Polar, Coinbase, and Sierra all use AI-code-review rounds. Sierra is piloting a format where you review a colleague's draft PR and improve it using coding agents. The format directly tests the #1 signal in CoderPad's 2026 survey: "catches and fixes AI mistakes."

## Core idea

### Seven common AI defect patterns

**1. Hallucinated APIs**

The AI invents a method or argument that doesn't exist.

Example: `mailer.sendBatch(recipients)` when the real API is `mailer.send(recipient)` called per recipient.

How to catch it: check imports and type definitions. If the method isn't defined, the AI hallucinated it.

**2. Over-abstraction**

The AI adds an unnecessary abstraction layer, often with only one implementation.

Example: a `ThresholdChecker` interface with one concrete class, used once.

How to catch it: ask "would we ever have a second implementation?" If no, inline it.

**3. Swallowed errors**

The AI wraps a call in try-catch and logs the error but doesn't propagate it or record failure.

Example: the caller cannot tell a failed send from a successful one.

```ts
function deliverAlert(send: () => void): string {
  try {
    send();
    return "sent";
  } catch {
    return "sent";
  }
}

console.log(deliverAlert(() => {
  throw new Error("mailbox down");
}));
console.log(deliverAlert(() => {}));
```

How to catch it: trace every error path. Does the caller know it failed? Is there a retry or a fallback?

**4. Missing retries, idempotency, and dedupe**

The AI writes a happy-path network call with no retry logic, no idempotency key, and no dedupe.

Example: an alert fires on every event after a threshold, with no "already sent" state.

How to catch it: ask "what happens if this runs twice?" and "what happens if the network fails halfway?"

**5. Insecure defaults**

The AI fetches sensitive data without checking permissions or logs secrets.

Example: fetching a workspace owner's email without verifying the caller's access.

How to catch it: trace every data read and write. Does it check auth? Does it log PII or secrets?

**6. Test theater**

The AI writes tests that pass vacuously because they mock the thing being tested or assert on irrelevant values.

Example: a test mocks the `checkThreshold` function itself, so it always returns true and the test passes.

How to catch it: read the test setup. Does it mock the logic you're supposed to verify?

**7. Comment bloat and unused code**

The AI adds 40 lines of comments narrating what the code does, plus an abstraction that's never used.

Example: `// Define the interface for checking thresholds` above every method in a one-class file.

How to catch it: count comments vs. lines of code. If comments outnumber code 2:1, it's bloat.

### Severity rubric

Label each comment **blocker**, **should-fix**, or **nit**.

**Blocker:** security, correctness, or a bug that will break production.
- The alert fires on every event after 80% with no "already sent" state
- The owner's email is fetched without a permission check
- A hallucinated API that won't compile

**Should-fix:** performance, clarity, or technical debt that matters.
- An N+1 plan lookup inside the ingest loop
- Missing retry logic on a network call
- An unused abstraction layer

**Nit:** style, naming, or comment bloat.
- A verbose comment that just narrates the code
- Inconsistent spacing

Lead with blockers. Then should-fix. Then nits if time permits.

### Comment tone

**Good:** "This needs a dedupe key per (workspace, period, threshold). Without it, the alert fires on every event after 80%."

**Bad:** "This is wrong." (Not helpful.)

**Better:** "Can you explain why this doesn't retry on 5xx?" (Teaches by asking.)

Write at least one comment that explains the principle, not just the fix.

## Worked example

### First pass (5–10 minutes, no comments yet)

1. Read the PR description. What's the intent?
2. Skim the file list. How many files? Are tests included?
3. Read the tests first. Do they mock the thing being tested? Do they cover failure paths?
4. Read the main logic. Does it match the intent?
5. List the top 2–3 issues in your head before writing comments.

### Second pass (15–25 minutes, write comments)

1. Write blocker comments first. Include the principle: "This needs an idempotency key because retries will fire the alert twice."
2. Write should-fix comments. Estimate the cost: "This N+1 will add 200 ms per 1K events."
3. Write nit comments if time permits.
4. Decide: **approve**, **approve with changes**, or **request changes**.

### If the round includes fixing the blocker with an agent (10–15 minutes)

1. Point the agent at the specific file and function: "In `alerts/check.ts`, add a dedupe check per (workspace, period, threshold)."
2. Give it the test to pass: "The test in `alerts/check.test.ts` line 45 should pass."
3. Read the diff. Did it add the dedupe, or did it mock the threshold function?
4. Run the tests.

### Practice drills

### Drill 1: Usage alerts PR

**Setup:** An agent-generated PR, about 300 lines, adding "usage alerts: email the workspace owner when bandwidth passes 80% of plan."

**Planted defects:**
1. The alert fires on every event after 80%, with no "already sent" state. **Blocker.**
2. A hallucinated `mailer.sendBatch` API.
3. The N+1 plan lookup is inside the ingest loop.
4. The owner's email is fetched without a permission check, so an agency member can trigger it. **Security blocker.**
5. The tests mock the threshold function itself, so they pass vacuously.
6. 40 lines of comment bloat and an unused abstraction layer.

**Task:** Leave review comments as you would on GitHub, decide approve / request changes, and—if time allows—use an agent to fix defect #1.

**Rubric (0–12):**
- (4) Found the blockers first (#1 and #4)
- (3) Caught the hallucinated API and the vacuous tests (AI-specific tells)
- (2) Severity calibration (blocker / should-fix / nit)
- (2) Comment tone and clarity; at least one comment that teaches
- (1) Correct final call (request changes)

### Drill 2: Webhook retry PR

**Setup:** An agent adds retry logic to webhook delivery.

**Planted defects:**
1. Retries happen on 4xx (should be 5xx and timeouts only). **Blocker.**
2. No jitter in exponential backoff.
3. Secrets are logged.
4. No poison-message handling (infinite retry loops).

**Rubric:** same structure, 4 blockers this time.

### Drill 3: RBAC inheritance PR

**Setup:** An agent adds deny overrides to a permission resolver.

**Planted defects:**
1. Deny precedence is checked after caching, so cached `allow` beats a fresh `deny`. **Blocker.**
2. An unused `PermissionChecker` interface with one implementation.
3. The cache isn't cleared when roles change.

### Pitfalls

- Style nitpicks while a logic bug ships
- Rewriting the PR instead of reviewing it
- Not running the code or tests
- Marking everything as a blocker (severity calibration failure)
- Missing the hallucinated API because you didn't check imports
- Trusting the tests without reading them (test theater)
- Writing "this is wrong" without explaining why or how to fix it

### Interview moves

- "I'll read the PR description, then the tests, then the main logic, and list the top issues before I write comments."
- "This is a blocker: the alert fires on every event after 80% with no 'already sent' state. It needs a dedupe key per (workspace, period, threshold)."
- "This test mocks the function it's supposed to verify. If I change `checkThreshold` to always return false, this test still passes."
- "The hallucinated `sendBatch` API is a tell that an AI wrote this. The real API is `send` per recipient."
- "I'm requesting changes because of the two blockers. The N+1 and the comment bloat are should-fix, but they don't block merge if the owner disagrees."

## Common mistakes

- Not reading the tests first (test theater is a common AI defect)
- Treating a should-fix as a blocker or vice versa
- Not checking if an API exists before accepting it
- Writing only "looks good" or "this is wrong" comments with no detail
- Spending the whole round on comment bloat instead of the blockers
- Not running the code to verify a suspected bug
- Assuming the AI's retry logic is correct without checking the status codes

## How to talk about it

"When I review AI-generated code, I look for hallucinated APIs, missing error paths, insecure defaults, and test theater—tests that pass vacuously because they mock the thing being verified. I lead with blockers like correctness and security, then should-fix for performance and clarity, then nits if time permits. I write at least one comment that teaches the principle, not just points out the problem. In a PR-review round, I'd decide approve, approve with changes, or request changes based on the severity of the issues."

## Cross-links

- [Build an agent that reviews PRs](./review-agent/lesson.md) (id: review-agent)
- [Diagnose agent failures before changing the prompt](./agent-mistakes.md) (id: agent-mistakes)
- [Multi-phase repo rounds with an AI assistant](./repo-round-three-phase.md) (id: repo-round-three-phase)
- [Practice AI-assisted coding and evaluation discussions](./interview-ai-round.md) (id: interview-ai-round)
- [Three AI policy bands and how to ask which one applies](./ai-policy-bands.md) (id: ai-policy-bands)
