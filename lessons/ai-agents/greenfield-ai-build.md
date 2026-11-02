---
id: greenfield-ai-build
title: Greenfield builds in your own environment with AI
slug: greenfield-ai-build
kind: strategy
track: ai-agents
difficulty: core
estimated_minutes: 22
summary: Build a working feature from scratch in 45–60 minutes with your own IDE and AI, absorbing requirements that arrive mid-session.
tags:
  - ai-agents
  - interviews
  - interviews/ai
prerequisites:
  - ai-pairing-interview
  - progressive-spec-rounds
related:
  - repo-round-three-phase
  - reviewing-ai-code
  - ai-policy-bands
  - interview-integrity
company_signal:
  - name: Shopify
    evidence: https://www.hellointerview.com/blog/shopify-ai-enabled-coding
    year: 2026
    confidence: medium
  - name: Canva
    evidence: https://www.canva.dev/blog/engineering/yes-you-can-use-ai-in-our-interviews/
    year: 2025
    confidence: high
  - name: Vercel
    evidence: https://v0-eng-prep-guide.vercel.app/
    year: 2026
    confidence: high
  - name: WorkOS
    evidence: https://workos.com/blog/designing-the-ai-proof-interview
    year: 2026
    confidence: high
sources_consulted:
  - https://www.hellointerview.com/blog/shopify-ai-enabled-coding
  - https://www.canva.dev/blog/engineering/yes-you-can-use-ai-in-our-interviews/
  - https://www.canva.dev/blog/engineering/ai-interview-success/
  - https://v0-eng-prep-guide.vercel.app/
  - https://workos.com/blog/designing-the-ai-proof-interview
  - https://x.com/snugoff/status/1996214401733656698
updated: 2026-11-02
status: canonical
---

# Greenfield builds in your own environment with AI

## Snapshot

- 45–60 minute round in an empty repo (Shopify, Canva) or your own machine (Vercel, WorkOS)
- Bring your own IDE and AI tools; screen-share so the interviewer sees how you use AI
- The problem starts simple and grows: hidden follow-ups arrive at minutes 15, 25, and 35
- Graded on planning, design that absorbs change, testing, and visible ownership of AI output
- Canva's three failure modes: "AI Showcase" (showing off prompts), "Feature Marathon" (breadth over quality), "Hands-Off" (over-delegating)
- WorkOS: "leaning on AI to do all the heavy lifting won't get you far"

## Why it shows up in interviews

By late 2026, Shopify, Canva, Vercel, and WorkOS all test greenfield builds with AI expected or allowed. The format mirrors real product work: you pick a data model, build incrementally, and adapt when requirements change. It tests whether you can plan before prompting, delegate aggressively without losing control, and own the result. Canva explicitly "insists" on AI; Shopify candidates who don't use AI "usually get creamed."

## Core idea

### The three phases (your own internal structure, not always visible to the interviewer)

**Phase 1: Scope and plan (0–5 minutes)**

Say your plan out loud before typing anything.

What to say:
- "I'm building a mini drag-and-drop designer. In scope: canvas, add box or text, drag, select, edit text. Out of scope: styles panel, persistence, collaboration until I hear otherwise."
- "I'll use a flat `nodes: Record<id, Node>` with `parentId` because it makes nesting and undo cheaper later."
- "I'm starting in planning mode because I don't like to ask AI to generate a bunch of code right away."

What not to do:
- Paste the whole prompt into Cursor or Claude Code
- Start coding before stating the data model
- Spend 10 minutes debating framework choice

**Phase 2: Build in increments (5–45 minutes)**

Delegate scaffolding; own the core design.

Good delegation:
- "Generate a React component scaffold with a canvas and a toolbar"
- "Write a test for the case where the node has no parent"
- "Explain the difference between `onPointerDown` and `onMouseDown` for touch support"

Bad delegation:
- "Build the app"
- Accepting a suggestion to store positions in component state instead of the reducer
- Letting the AI refactor the data model mid-build

Run tests after every change. Say what you're checking: "This should render two boxes and a text node."

**Phase 3: Absorb follow-ups (throughout, especially at minutes 15, 25, 35)**

Follow-ups test whether your design absorbs change.

Examples (Shopify-style):
- Minute 15: "Elements can be nested inside a container."
- Minute 25: "Add undo/redo."
- Minute 35: "Two users edit at once. What changes in your data model?" (Discussion only, often.)

Examples (WorkOS-style backend):
- Minute 15: "Add deny overrides."
- Minute 25: "An audit log."
- Minute 35: "Invite expiry."

If your data model is sound, each follow-up should touch only the reducer or the API layer, not require a rewrite.

### Environment preset (before the call starts)

**Pre-call checklist:**
1. Have a TypeScript template with `tsx`/`vitest` and a lint config ready
2. Make sure the screen-share layout puts the editor, terminal, and agent pane in view
3. Have a fallback chat window ready (Cursor Code or Claude in a browser tab)
4. Test your microphone and camera
5. Close notifications and extra monitors

Canva explicitly recommends: "Have your preferred AI-integrated development environment ready" and "a basic project structure" ready.

### Workflow: two conversations at once

Narrate your intent to the interviewer → prompt → read the diff aloud → run → confirm.

Example:
- (To interviewer) "I'm going to delegate the drag handler to the AI, then verify it updates the reducer."
- (To AI) "Write a pointer-down handler that updates the node's position in the reducer. Assume the node ID is in a data attribute."
- (Read diff aloud) "It's updating position in the reducer. Let me check if it reads the data attribute correctly."
- (Run) "Dragging a box. It moves. Good."
- (To interviewer) "The drag handler works. Next I'll add selection on click."

### Canva's three failure modes (avoid these)

**1. AI Showcase**
Showing off prompts and tools instead of building the feature.

What it looks like: Switching between Cursor, Claude Code, and v0 mid-round, narrating each model's strengths.

Why it fails: The interviewer cares about the output, not the tool.

**2. Feature Marathon**
Building five half-working features instead of one complete vertical slice.

What it looks like: A toolbar with 6 buttons, none of which work end to end.

Why it fails: Breadth over quality; no proof that you can finish.

**3. Hands-Off**
Accepting AI code unreviewed.

What it looks like: Pasting the prompt, accepting the diff, skipping tests. "The AI did that."

Why it fails: You can't explain a file. No ownership.

### Rejection patterns from the field

From X, December 2025: candidates "paste the whole prompt into Cursor or Claude Code, get a half-working codebase, then freeze when asked to fix a bug or explain a design decision."

From Shopify (Hello Interview), June 2026: a candidate was rejected for using AI "inefficiently." They had used it only to write code "while keeping the logic and thinking to myself." The feedback: "If you can use AI, why not use it to its fullest?"

The target is the middle: delegate aggressively, verify visibly.

## Worked example

### Drill setup (practice this format)

Pick one of these prompts. Set a timer for 60 minutes. Use your own IDE and AI tools. At minutes 15, 25, and 35, reveal the next follow-up.

**Prompt 1 (Canva-style frontend):**
"Build a mini-Webflow designer with AI. It's deliberately broad—you pick the scope. You have 60 minutes."

Hidden follow-ups:
1. Minute 15: "Elements can be nested inside a container."
2. Minute 25: "Add undo/redo."
3. Minute 35: "Two users edit at once. What changes in your data model?" (Discussion only.)

**Prompt 2 (WorkOS-style backend):**
"Build an API that issues and verifies agency → workspace role grants."

Hidden follow-ups:
1. Minute 15: "Add deny overrides."
2. Minute 25: "An audit log."
3. Minute 35: "Invite expiry."

**Prompt 3 (Shopify-style):**
"Build an LRU cache."

Hidden follow-ups:
1. Minute 15: "Make capacity configurable."
2. Minute 25: "Add a pluggable storage backend (in-memory vs. Redis)."
3. Minute 35: "Thread-safe in a multi-threaded environment." (Discussion only.)

### Rubric (Canva's three areas plus WorkOS)

Score 0–3 per area.

**Problem-solving and scoping (0–3):**
- Clear plan before prompting
- Scope cut stated explicitly
- Risks named ("undo will be expensive if I snapshot the whole state")

**Ownership (0–3):**
- Can explain every file
- The data model is your design, not the AI's default
- Tests every step

**AI collaboration (0–3):**
- Speed without losing control
- Rejects or rewrites at least one AI suggestion
- No feature marathon or AI showcase

**Plus WorkOS (0–3):**
- Error handling (what happens if the role doesn't exist?)
- Debugging composure (a test fails; you form a hypothesis, not "ask the AI to fix it")
- Communication (narrate throughout)

12/12 is exceptional. 9/12 is a hire signal.

### Practice timeline (45-minute version, compressed)

- 0–3 min: scope out loud, choose the data model
- 3–6 min: delegate UI scaffolding, own the reducer
- 6–15 min: one vertical slice working (add a node, drag it, select it)
- 15–18 min: absorb follow-up #1 (nesting) by adding `parentId` to the data model
- 18–25 min: extend to text nodes
- 25–28 min: absorb follow-up #2 (undo) with an inverse-operation stack
- 28–35 min: tests for undo
- 35–40 min: follow-up #3 is a discussion (collaboration); name operation-based sync (CRDT or OT) vs. last-writer-wins
- 40–45 min: demo and summary

### Pitfalls

- Pasting the whole prompt into the agent within 60 seconds
- Building 5 half-features instead of 1 complete vertical slice
- Accepting a diff without reading it
- Storing mutable state in a place that makes follow-ups expensive (e.g., positions in component state instead of the reducer)
- Not testing until minute 40
- Switching tools mid-round to "show off"
- Freezing when a test fails instead of forming a hypothesis
- Over-scoping (building auth, persistence, and a styles panel when the prompt is "mini designer")

### Interview moves

- "I'm scoping this to canvas, add box or text, drag, select, edit text. Out of scope: styles panel, persistence."
- "I'll use a flat `nodes: Record<id, Node>` with `parentId` because nesting and undo will be cheaper later."
- "I'm starting in planning mode. I'll delegate the scaffolding but keep the data model under my control."
- "The AI suggested storing positions in component state. That won't work for undo, so I'm moving it to the reducer."
- "For collaboration, I'd use operation-based sync like Yjs or Automerge, where each change is a CRDT operation. Last-writer-wins is simpler but loses intent when two users edit the same node."

## Common mistakes

- Not stating the data model before prompting
- Accepting the AI's first data model without considering undo, nesting, or collaboration
- Building breadth (toolbar with 6 buttons) instead of depth (one button that works end to end)
- Not running tests until the end
- Freezing when asked to explain a file ("the AI did that")
- Over-delegating to the AI without verifying output
- Under-using AI to "prove" you can code (the Shopify "inefficient AI use" rejection)

## How to talk about it

"In a greenfield AI build, I scope out loud, choose the data model before prompting, and build one vertical slice working end to end before adding breadth. I delegate scaffolding and unfamiliar APIs aggressively but keep the core design—data model, interfaces, invariants—under my control. I test every step and reject or rewrite at least one AI suggestion. When a follow-up arrives, it should touch only the reducer or API layer, not require a rewrite. I rehearse two conversations at once: my intent to the interviewer, then the prompt, then reading the diff aloud, then running and confirming."

## Cross-links

- [Practice pairing with an AI assistant on a known problem](./ai-pairing-interview.md) (id: ai-pairing-interview)
- [Read-and-repair beats write-from-scratch](../algorithms/strategy/progressive-spec-rounds.md) (id: progressive-spec-rounds)
- [Multi-phase repo rounds with an AI assistant](./repo-round-three-phase.md) (id: repo-round-three-phase)
- [Reviewing AI-generated code and PRs](./reviewing-ai-code.md) (id: reviewing-ai-code)
- [Three AI policy bands and how to ask which one applies](./ai-policy-bands.md) (id: ai-policy-bands)
- [What proctoring flags and how to stay clean](./interview-integrity.md) (id: interview-integrity)
- [Keep the k hottest items in a tiny heap](../algorithms/patterns/heaps-top-k.md) (id: heaps-top-k)
- [Cache the recent in memory, the archive in slow storage](../algorithms/problems/lru-cache/lesson.md) (id: lru-cache)
