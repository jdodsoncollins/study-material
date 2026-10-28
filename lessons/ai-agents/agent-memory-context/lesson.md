---
id: agent-memory-context
title: Decide what the model sees each turn
slug: agent-memory-context
kind: concept
track: ai-agents
difficulty: core
estimated_minutes: 16
summary: Rebuild the context window on every call from pinned instructions, task state, recent turns, a running summary, and retrieved memories, and decide deliberately what to forget.
tags:
  - ai-agents
  - ai-agents/harnesses
  - ai-agents/retrieval
  - interviews
  - interviews/ai
prerequisites:
  - llm-basics
related:
  - llm-basics
  - rag-pipeline
  - prompt-injection-guardrails
  - traces-trajectories
company_signal: []
sources_consulted:
  - https://arxiv.org/abs/2307.03172
  - https://arxiv.org/abs/2310.08560
updated: 2026-10-28
status: canonical
---

# Decide what the model sees each turn

## Snapshot

- The model is stateless. "Memory" is whatever your code puts into the next call's context window.
- **Working context** is assembled per call: pinned instructions, task state, recent turns, a summary of older turns, and retrieved long-term memories.
- **Summaries are lossy.** Keep identifiers, numbers, decisions, and open commitments verbatim; compress chatter.
- **Scratchpads** (a notes file or a structured task state the agent updates) let long tasks survive trimming.
- **Forgetting is a feature:** stale, superseded, sensitive, user-deleted, and untrusted content should not keep riding along.

## Why it shows up in interviews

Long chats, multi-hour coding agents, and assistants that "remember you" all hit the same wall: the window is finite, cost grows with every resent token, and quality can drop when key facts are buried in a long context. Interviewers probe whether you can describe a context-assembly policy, a memory write policy, and how you would test both.

## Core idea

### ELI5

A tutor meets you every week. Before each session they reread a one-page card about you (your goals, what you already learned), the last few minutes of notes, and any old worksheet that matches today's topic. They do not reread every past session word for word. After the session they update the card, and they cross out things that are no longer true.

[See how a call is assembled](viz/assemble.md)

### Assembling working context

1. **Pinned:** system instructions, hard constraints, tool definitions. Never trimmed.
2. **Task state:** a small structured record (goal, decisions so far, open questions, next step). Updated by code or by the agent through a tool, then pinned.
3. **Recent turns:** as many as fit, newest first.
4. **Running summary:** older turns compressed into a paragraph, refreshed when turns are dropped.
5. **Retrieved memories:** facts from earlier sessions or a knowledge store, fetched by relevance to the current turn, each with source and date.

```ts
type Turn = { role: "user" | "assistant"; text: string };

// Rough estimate for the sample only; use the provider's tokenizer in production
const tokens = (s: string) => Math.ceil(s.length / 4);

function packContext(pinned: string, turns: Turn[], summary: string, budget: number) {
  let used = tokens(pinned) + tokens(summary);
  const kept: Turn[] = [];
  for (let i = turns.length - 1; i >= 0; i--) {
    const cost = tokens(turns[i].text);
    if (used + cost > budget) break;
    kept.unshift(turns[i]);
    used += cost;
  }
  const dropped = turns.length - kept.length;
  return { used, keptTurns: kept.length, dropped, needsNewSummary: dropped > 0 };
}

const pinned = "You help plan a 3-day trip. Budget cap: $1,200. Never book without the user's OK."; // 21 tokens
const summary = "Earlier: user picked Lisbon, May 9-12, prefers trains, allergic to shellfish."; // 20 tokens
const turns: Turn[] = [
  { role: "user", text: "Find me hotels near the river under $180 a night." },
  { role: "assistant", text: "Three options: Casa Rio $165, Alfama Loft $172, Tejo Inn $149." },
  { role: "user", text: "Tejo Inn. Now dinner ideas for the first night?" },
  { role: "assistant", text: "Two picks with no shellfish on the tasting menu: Horta and Prado." },
];
console.log(packContext(pinned, turns, summary, 120)); // everything fits: 99 tokens
console.log(packContext(pinned, turns, summary, 70));  // drops the 2 oldest turns, summary must absorb them
```

At a budget of 70, the turn with "Tejo Inn $149" falls out. If the summary is not refreshed to say "chose Tejo Inn at $149/night", the agent can no longer check the $1,200 cap. That is the core risk of trimming: a number the constraint depends on disappears.

### Summaries and scratchpads

Write summaries for the next reader, which is the model. Keep: names, ids, amounts, dates, chosen options, refusals, and promises ("I'll check train times"). Drop: greetings, alternatives already rejected (unless the rejection reason matters). For multi-step agents, a scratchpad the agent edits through a tool ("update_notes") is easier to audit than a summary regenerated each turn, and it survives a crash if you persist it.

### Long-term memory

Treat cross-session memory as a small retrieval system: each memory has a subject, text, source turn, timestamp, and owner. Retrieve by relevance and recency. Write only on clear signals (an explicit preference, a confirmed decision). Let users see and delete what is stored. Scope memories to the user; never retrieve across accounts.

### What to forget

- **Superseded:** "prefers aisle seats" replaced by "prefers window seats". Store the newer one and retire the old.
- **Stale:** a delivery ETA from last week. Expire by time or by task completion.
- **Sensitive:** card numbers, health details, credentials. Do not store unless the product truly needs it and the user agreed.
- **Untrusted:** instructions found inside emails or pages. Saving them turns a one-time injection into a permanent one.
- **Deleted by the user:** honor it in every store, including summaries that quoted it.

## Worked example

### Easy

A chat of 40 short turns fits the window. Keep it whole; summarizing early adds loss without saving much. Start trimming when the measured token count crosses a threshold you set below the window, leaving room for retrieved context and the answer.

### Medium

A coding agent has been running 90 minutes and the conversation is 3x the window. Pin the task statement and a notes file listing files changed, tests failing, and the current hypothesis. Trim tool outputs aggressively (a 2,000-line test log becomes "14 passed, 2 failed: test_cart_total, test_coupon_stack" plus the two stack traces).

### Hard

An assistant stored "user's manager is Dana" six months ago; the user changed teams. It now drafts emails to the wrong manager. Fixes: timestamps and a staleness policy on relationship facts, a confirmation step when using a memory older than N days for an action, and a visible memory list the user can edit. Add an eval case: an old memory contradicted by a recent turn, where the recent turn must win.

**Practice:** write the task-state record you would pin for a "plan my move to a new apartment" agent after turn 30. Which five fields must never be dropped?

## Common mistakes

- Resending the full history until the call fails, then truncating from the front blindly.
- Summaries that paraphrase numbers and ids ("a hotel around $150").
- Letting raw tool outputs dominate the window.
- Writing every turn to long-term memory, including injected or sensitive text.
- No way for users to inspect or delete what is remembered.
- Never testing memory behavior with contradictions and stale facts.

## How to talk about it

"Each call is assembled: pinned instructions and task state first, then recent turns newest-first, a running summary for the rest, and a few retrieved memories with source and date. Summaries keep ids, numbers, and decisions verbatim. Memory writes are deliberate, scoped to the user, editable, and they expire; untrusted content never becomes memory."

## Cross-links

- [Predict a token, sample it, repeat](../llm-basics.md) (id: llm-basics)
- [Build retrieval that the answer can cite](../rag-pipeline/lesson.md) (id: rag-pipeline)
- [Treat retrieved text as data, not orders](../prompt-injection-guardrails/lesson.md) (id: prompt-injection-guardrails)
- [Use observable execution evidence to diagnose failures](../traces-trajectories.md) (id: traces-trajectories)
- [Do the token math before picking a model](../cost-latency-budgets.md) (id: cost-latency-budgets)
- [Remembering the expensive answer nearby](../../system-design/foundations/caching/lesson.md) (id: caching)
