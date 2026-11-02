---
id: frontend-practical
title: "Optional: a frontend round in two modes"
slug: frontend-practical
kind: strategy
track: ai-agents
difficulty: core
estimated_minutes: 18
summary: "Optional. Practice a React UI twice: once with no assistant, once with one, on charts, lists, canvas, a combobox, and optimistic updates."
tags:
  - ai-agents
  - interviews
  - interviews/ai
  - interviews/frontend
prerequisites:
  - no-ai-fluency
  - greenfield-ai-build
related:
  - no-ai-fluency
  - greenfield-ai-build
  - web-security-basics
  - encoding-unicode
company_signal:
  - name: Canva
    evidence: https://www.canva.dev/blog/engineering/yes-you-can-use-ai-in-our-interviews/
    year: 2025
    confidence: high
  - name: Vercel
    evidence: https://v0-eng-prep-guide.vercel.app/
    year: 2026
    confidence: high
sources_consulted:
  - https://www.canva.dev/blog/engineering/yes-you-can-use-ai-in-our-interviews/
  - https://www.canva.dev/blog/engineering/ai-interview-success/
  - https://v0-eng-prep-guide.vercel.app/
  - https://x.com/greatfrontend/status/2108183727293833623
updated: 2026-11-02
status: canonical
---

# Optional: a frontend round in two modes

## Snapshot

- Optional track. Do it after the core Judge lessons.
- Canva's engineering posts say an AI-assisted coding interview replaced a CS-fundamentals screen, including for frontend [P].
- A frontend thread described a broad "build the editor" prompt that candidates narrowed to a toolbar, dragging shapes, or text on a canvas [2nd].
- Vercel's fullstack round is on your machine, with any tools, and the screen share is supposed to show how you use them [P].
- Candidates also describe a React chart extension and a React round at product companies [2nd]. Those are single reports, not a published loop.

## Why it shows up in interviews

The corpus is heavy on algorithms and services. Some loops still put you in a browser: extend a chart, virtualize a list, or make a control keyboard-usable. Canva names three failure modes when AI is in the round: showing off tools, a feature marathon, and accepting generated code unreviewed [P]. This track is those skills, run twice so you know which mode you are in.

## Core idea

### Two clocks

For each drill, do it once in 60 minutes with no assistant, then once in 45 minutes with your editor assistant. The no-AI pass is the baseline from [no-AI fluency](./no-ai-fluency.md) (id: no-ai-fluency). The AI pass uses the same rules as [a greenfield build](./greenfield-ai-build.md) (id: greenfield-ai-build): you pick the state shape before you prompt, you narrate, and you reject at least one diff.

Score the AI pass with Canva's three areas, 0–3 each: problem framing, ownership of the state, collaboration without a feature marathon [P].

### What "done" means for a UI drill

- One path works with the keyboard, not only the pointer.
- A loading state and an error state exist, even if they are plain text.
- You can explain where the state lives and what a second requirement would touch.

## Worked example

### Five drills

Pick one per week. State the cut line in the first three minutes.

1. **Chart extension.** A line chart of daily bandwidth for one site, 30 points. Add a hover that shows the day and the bytes. Cut: no zoom, no second series. Second requirement if you finish: a gap day renders as a gap, not as zero.
2. **Virtualized list.** 10,000 site rows, only the visible ones in the DOM. Cut: fixed row height. Second requirement: the selected id stays selected when you scroll.
3. **Canvas.** Drag a rectangle on a surface. State is a list of `{id, x, y, w, h}`, not coordinates trapped in the component that drew them. Second requirement: nesting, a `parentId`. This is the same state move as the mini-designer in the greenfield lesson.
4. **Combobox.** A site picker that filters as you type, works with arrow keys, and has an accessible name. Cut: no multi-select. Second requirement: a disabled site is visible and not selectable.
5. **Optimistic update.** Toggling "published" updates the control immediately and rolls back if the request fails. Cut: one toggle. Second requirement: two toggles in flight do not restore the wrong value.

### A tiny rollback you should be able to write either way

```ts
function applyToggle(published: boolean, next: boolean, ok: boolean): boolean {
  return ok ? next : published;
}

console.log(applyToggle(false, true, true));
console.log(applyToggle(false, true, false));
```

The first log stays published. The second returns to the previous value. Say that before you look. The real UI version keeps a request id so a slow failure cannot roll back a newer click.

## Common mistakes

- Building the chart library instead of the hover.
- Putting 10,000 nodes in the DOM and calling it fast enough.
- An assistant-written canvas that stores positions in the DOM node, which breaks undo and nesting.
- A combobox that only works with a mouse.
- An optimistic toggle with no rollback, or a rollback that applies to the latest click when an older request fails.

## How to talk about it

"I'll do the list with fixed row heights and a window of DOM nodes. Selection is an id in state, not a class on the row. I'm not adding filters unless this scrolls. If the assistant puts the selected id on the DOM node, I'll move it back."

## Cross-links

- [Keep a no-AI baseline under a timer](./no-ai-fluency.md) (id: no-ai-fluency)
- [Greenfield builds in your own environment with AI](./greenfield-ai-build.md) (id: greenfield-ai-build)
- [What the browser enforces on a page](../cs/web-security-basics.md) (id: web-security-basics)
- [Bytes, code points, and graphemes](../cs/encoding-unicode.md) (id: encoding-unicode)
