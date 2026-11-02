---
id: repo-round-three-phase
title: Multi-phase repo rounds with an AI assistant
slug: repo-round-three-phase
kind: strategy
track: ai-agents
difficulty: core
estimated_minutes: 20
summary: Read an unfamiliar 400–1200 line codebase, fix bugs, add features, and optimize—with or without AI—in about 60 minutes.
tags:
  - ai-agents
  - ai-agents/evals
  - interviews
  - interviews/ai
prerequisites:
  - debug-unfamiliar-repo
  - interview-ai-round
related:
  - ai-policy-bands
  - interview-integrity
  - reviewing-ai-code
company_signal:
  - company: Meta
    roles: [SWE]
    signal: Three-phase AI-enabled CoderPad round with provided assistant (Claude, GPT, Gemini, Llama); assistant can read files but not edit them; Phase 1 fix a bug with failing tests given, Phase 2 implement core feature 120+ LOC, Phase 3 optimize against larger tiered data files
    source_url: https://interviewing.io/blog/how-to-use-ai-in-meta-s-ai-assisted-coding-interview-with-real-prompts-and-examples
    accessed: 2026-11-02
    confidence: high
    notes: Candidate-reported via interviewing.io and Hello Interview, consistent across multiple sources
  - company: Google
    roles: [SWE L3/L4]
    signal: Code comprehension round with Gemini available, 200–500 LOC, about 60 minutes; read, find bugs, explain design choices, propose fixes; graded on AI fluency, prompt engineering, and catching when Gemini is wrong
    source_url: https://www.businessinsider.com/google-interview-process-ai-gemini-coding-comprehension-software-engineer-2026-10
    accessed: 2026-11-02
    confidence: high
    notes: Business Insider Oct 20 2026 report plus candidate reports
  - company: Amazon
    roles: [SDE]
    signal: Online assessment includes ~60-min AI-assisted repo task fixing about 6 failing tests across controller, service, and repository layers in a Node/MERN, Django, or Spring Boot service, after a ~40-min DSA problem without AI
    source_url: https://www.aboutamazon.com/news/workplace/artificial-intelligence-resume-jobs-hiring-amazon
    accessed: 2026-11-02
    confidence: high
    notes: Primary source from Amazon Jan 2026 plus candidate reports on LeetCode and Reddit
  - company: Coinbase
    roles: [SWE]
    signal: AI-assisted, repo-based debugging and code-review tasks with an explicit AI-fluency rubric covering effective use, appropriate application, and understanding model limits
    source_url: https://www.coinbase.com/blog/interviewing-engineers-in-the-ai-era-lessons-from-a-year-of-rebuilding
    accessed: 2026-11-02
    confidence: med
    notes: Search synthesis from blog post; discussed on Hacker News Aug 2026
sources_consulted:
  - https://interviewing.io/blog/how-to-use-ai-in-meta-s-ai-assisted-coding-interview-with-real-prompts-and-examples
  - https://www.hellointerview.com/blog/meta-ai-enabled-coding
  - https://www.businessinsider.com/google-interview-process-ai-gemini-coding-comprehension-software-engineer-2026-10
  - https://www.aboutamazon.com/news/workplace/artificial-intelligence-resume-jobs-hiring-amazon
  - https://leetcode.com/discuss/post/8337376/
  - https://coderpad.io/survey-reports/coderpad-state-of-tech-hiring-2026/
updated: 2026-11-02
status: canonical
---

# Multi-phase repo rounds with an AI assistant

## Snapshot

- 60-minute format with an existing 400–1200 line codebase in a hosted editor
- Three phases: fix bugs (with failing tests), implement a feature, optimize for scale
- An AI assistant panel is available (Meta, Google, Coinbase, Amazon OA) or required (Shopify, Canva)
- The assistant can usually read files but not always edit them
- Read the codebase first (5–8 minutes) before prompting anything
- Use the AI for narrow, checkable tasks; keep tests green after every change
- CoderPad's 2026 survey: 66% of hiring leaders say "catches and fixes AI mistakes" is the top signal

## Why it shows up in interviews

As of late 2026, multi-file repo rounds replaced or supplemented from-scratch coding at Meta, Google, Coinbase, and in Amazon's online assessment. CoderPad calls them "1000–2000 line code bases" where "you have to add a feature in a short amount of time." The format tests whether you can read unfamiliar code, form hypotheses, delegate narrow work to an AI, and catch when the AI is wrong—all under time pressure.

## Core idea

### The three-phase structure

**Phase 1: Fix (8–25 minutes)**

You're given a repo with failing tests. Your job: get them green.

Common planted defects:
- Off-by-one at a boundary (`<=` vs `<`)
- Timezone bugs (local time vs UTC)
- Missing dedupe (duplicate IDs are double-counted)
- A test that passes for the wrong reason (it asserts on a mock, not real behavior)

Strategy:
- Read the failing tests first; they tell you what's expected
- Read the entry point second (often `index.ts` or `main.py`)
- Read the data model third (types, schemas, or class definitions)
- Say your mental model out loud before asking the AI anything
- One hypothesis per failing test: "This test expects UTC but the code uses local time"
- Run tests after every change
- Don't skip a test because you "think" it will pass after another fix

**Phase 2: Implement (20–45 minutes)**

Add a feature, often 120+ lines of code.

Examples from Meta (candidate-reported):
- Tiered pricing: the first 100 GB at $X, the next 900 GB at $Y, then $Z, with per-workspace overrides
- Optimizing unique characters across a set of words
- Adding directional gates to a BFS maze

Strategy:
- Write a pure function with table tests first if the feature has a core algorithm (e.g., `price(tiers, gb)` for tiered pricing)
- Delegate boilerplate to the AI ("generate a test scaffold for the rate function")
- Keep the data model and interfaces under your own control
- Test edge cases: exactly at a tier boundary, 0, huge inputs, negative values if the API allows them
- Ask the AI for narrow help: "list the edge cases this misses"
- Don't paste the whole phase 2 prompt into the assistant

**Phase 3: Optimize (15–57 minutes, if time permits)**

Make the code fast enough to handle a large data file (often 5M or 10M events).

Strategy:
- **Measure first.** Time the code on the large file before changing anything. Say the baseline out loud: "It takes 8 seconds on the 5M file."
- Identify the Big-O bottleneck: "The window lookup is O(n·m) because we scan all windows for every event."
- Replace it with a sorted sweep or a hash by window key
- Measure again and confirm the speedup
- If there's a tiered data setup (1K, 100K, 5M files), make sure your fix still passes the small cases

### When the AI assistant is read-only

Meta's format (as reported by Hello Interview and interviewing.io) gives the assistant read access to files but not edit access. You read the AI's suggestions and type the changes yourself. This means:
- You can ask "explain this function" or "list every place a Date is constructed"
- You cannot ask the AI to edit the file directly
- You must understand the suggestion well enough to implement it

The assistant is also reportedly "nerfed" sometimes—deliberately limited or wrong—so you must verify every answer.

### Mode-switching: Amazon OA variant

Amazon's online assessment (as of January 2026) runs two back-to-back segments:
1. ~40 minutes on one DSA problem, **no AI**
2. ~60 minutes on a repo task with **an AI assistant**, fixing ~6 failing tests across controller, service, and repository layers

Candidates report: "provided AI won't save you" and "more about your prompting ability." Practice switching modes mid-session: fluent typing for DSA, then hypothesis-driven prompting for the repo.

## Worked approach

### Reading order (5–8 minutes, no prompting yet)

1. **Tests.** What's failing? What do the assertions expect?
2. **Entry point.** Where does a request start? What's the call chain?
3. **Data model.** What are the types, schemas, or classes? What's mutable?
4. **Say your mental model out loud** before asking the AI anything.

### Hypothesis log

For each bug, write down your hypothesis before fixing it. Examples:
- "The billing window uses local time; DST shifts will break it."
- "Duplicate event IDs aren't deduped; the sum is too high."
- "The `<=` at the window's closing boundary includes the next window's first event."

This keeps you from blindly accepting the AI's first suggestion.

### Prompts that stay checkable

Good uses of the AI in a repo round:
- "Explain this function in one sentence."
- "List the edge cases this `rate()` function misses."
- "What inputs would make this return NaN?"
- "Write a test for the case where the workspace has no overrides."

Bad uses:
- "Solve phase 2."
- Pasting the whole task description.
- Asking it to refactor while tests are red.

### Time plan

A 60-minute sample timeline:
- 0–8 min: read (tests, entry, data model), say mental model aloud
- 8–25 min: phase 1 (fix bugs, one hypothesis per test)
- 25–45 min: phase 2 (add feature, test-first if algorithmic)
- 45–57 min: phase 3 (measure, fix Big-O, measure again)
- 57–60 min: summary

## Practice drills

### Drill 1: Usage metering (TS, 600 LOC)

**Setup:**
- `ingest.ts` parses bandwidth events
- `window.ts` buckets them into billing periods
- `rate.ts` applies a price tier
- `report.ts` produces per-site totals
- `tests/` has 4 failing tests and `data/` with 1K, 100K, and 5M-event files

**Planted defects:**
1. Billing windows use local time, not UTC
2. Off-by-one at the window's closing boundary
3. Duplicate event IDs are double-counted
4. A test that asserts on a mock

**Phase 2:** Add tiered pricing (first 100 GB at $X, next 900 GB at $Y, then $Z, with per-workspace overrides)

**Phase 3:** `report` must finish on the 5M file in under 2 s

**Rubric (0–14):**
- (2) Mapped the code before prompting
- (2) Each fix came from a stated hypothesis
- (2) Caught at least one wrong AI suggestion
- (2) Phase 2 has tier-boundary tests (exactly 100 GB, 0, huge)
- (2) Measured before optimizing
- (2) Reached phase 3
- (2) Communication throughout

10 or more is a hire signal.

### Drill 2: Permission resolver (TS, 800 LOC)

**Setup:**
- Agency → workspace → site role inheritance
- `resolve.ts`, `inherit.ts`, `cache.ts`, `tests/`

**Planted defects:**
1. Inheritance stops at the first `null` instead of continuing up the chain
2. Deny overrides aren't checked

**Phase 2:** Add deny overrides (an explicit `deny` beats any inherited `allow`)

**Phase 3:** Memoize resolved permissions; clear the cache when roles change

### Drill 3: Webhook delivery worker (TS, 900 LOC)

**Setup:**
- `ingest.ts`, `deliver.ts`, `retry.ts`, `status.ts`, `tests/`

**Planted defects:**
1. Retries happen on 4xx (should be 5xx and timeouts only)
2. No idempotency key on the receiver side

**Phase 2:** Add a dead-letter queue after 5 retries

**Phase 3:** Batch deliveries to the same endpoint

### Run each drill twice

1. **With the AI panel limited to read-only** (as Meta reportedly does): ask "explain this function" but type the fix yourself
2. **With no AI at all**: pure fluency, as in Stripe's Bug Squash or Amazon's DSA segment

## Pitfalls

- Pasting the whole task into the assistant within 60 seconds
- Not noticing the AI is wrong (Meta's assistant is sometimes "nerfed")
- Silence while waiting on the model (fill wait time with "what I expect and how I'll check it")
- Skipping phase 1 tests because you "think" they'll pass after another fix
- Running out of time before phase 3 because you over-engineered phase 2
- Accepting AI-generated tests as proof that AI-generated code is correct (circular validation)

## Interview moves

- "I'll read the tests first, then the entry point, then the data model, and say my mental model before I ask the AI anything."
- "This test expects UTC. The bug is likely in `window.ts` where we call `new Date()` without a timezone."
- "I'm going to ask the AI to list edge cases for the tier boundaries, then write those tests before implementing the feature."
- "The AI suggested this fix, but it breaks the midnight UTC test. I need a different approach."
- "Phase 3 target: under 2 seconds on the 5M file. Current baseline: 8 seconds. The bottleneck is the O(n·m) window lookup. I'll replace it with a hash by window key."

## Common mistakes

- Starting with the AI instead of reading the code
- Not forming a hypothesis before fixing a bug
- Accepting the first AI suggestion without verifying it
- Writing phase 2 feature code before writing tests
- Optimizing phase 3 without measuring the baseline
- Over-delegating to the AI in a read-only assistant setup
- Forgetting that Amazon's OA mixes no-AI DSA with AI-assisted repo work in one session

## How to talk about it

"In a multi-phase repo round, I read the tests, entry point, and data model first—before prompting anything. I form a hypothesis for each bug, use the AI for narrow checkable tasks like 'list the edge cases this misses,' and run tests after every change. In phase 3, I measure before optimizing. I expect the assistant to be wrong sometimes, so I verify every suggestion. I also practice the same drills with no AI to keep my raw fluency sharp, since Amazon's OA mixes both modes in one session."

## Cross-links

- [Debug an unfamiliar repo](./debug-unfamiliar-repo.md) (id: debug-unfamiliar-repo)
- [Practice AI-assisted coding and evaluation discussions](./interview-ai-round.md) (id: interview-ai-round)
- [Three AI policy bands and how to ask which one applies](./ai-policy-bands.md) (id: ai-policy-bands)
- [What proctoring flags and how to stay clean](./interview-integrity.md) (id: interview-integrity)
- [Reviewing AI-generated code and PRs](./reviewing-ai-code.md) (id: reviewing-ai-code)
- [Read-and-repair beats write-from-scratch](../algorithms/strategy/progressive-spec-rounds.md) (id: progressive-spec-rounds)
