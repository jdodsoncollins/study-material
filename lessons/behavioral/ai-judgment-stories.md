---
id: ai-judgment-stories
title: Show judgment about the tools you use
slug: ai-judgment-stories
kind: strategy
track: behavioral
difficulty: core
estimated_minutes: 14
summary: Answer questions about AI coding tools with specific stories of verification, a case where the tool was wrong, and a case where you chose not to use it, so the interviewer hears judgment rather than enthusiasm or avoidance.
tags:
  - behavioral
  - behavioral/stories
  - interviews
  - interviews/behavioral
  - interviews/ai
prerequisites:
  - story-bank
related:
  - story-bank
  - failure-stories
  - behavioral-scoring
  - ai-pairing-interview
company_signal: []
sources_consulted:
  - https://cadence.withremote.ai/blog/ai-technical-interviews
updated: 2026-10-28
status: canonical
---

# Show judgment about the tools you use

## Snapshot

- Expect questions like: "How do you use AI tools day to day?", "Tell me about a time generated code was wrong", "How do you review a large generated change?", "When do you not use it?"
- The signal is judgment: what you delegate, how you verify, and when you take the wheel. Not how much you use the tool, and not whether you like it.
- Prepare three stories: one where the tool was wrong and you caught it, one where verification habits paid off, one where you chose not to use it.
- Name the check, not the vibe. "I wrote the failing test first" beats "I always review carefully."
- Do not oversell speed numbers you cannot defend, and do not claim you never use the tools if the team clearly does.

## Why it shows up in interviews

Teams now ship code that was partly written by assistants, and reviewers carry more of the risk. Interviewers want to know whether a new hire will add plausible-looking defects or catch them. Some loops add behavioral questions on exactly this, scored on specificity and verification habits. It also overlaps with the ownership and judgment signals in [what the interviewer writes down](./behavioral-scoring.md) (id: behavioral-scoring).

## Core idea

### ELI5

Talk about the assistant the way you would talk about a fast new teammate: what you trust them with, how you check their work, and a time they were confidently wrong.

Each story follows the [story bank](./story-bank/lesson.md) (id: story-bank) shape, with one extra line:

1. **Situation** — the task and why you reached for the tool, or did not.
2. **What it produced** — briefly.
3. **The check** — the test, the read-through, the search, the doc lookup. This line carries the story.
4. **What you found and did** — accept, edit, reject, or write it yourself.
5. **What changed** — a habit, a review rule, a team guideline.

### Three stories to prepare

| Story | What it shows | Weak version |
| --- | --- | --- |
| The tool was wrong and you caught it | Verification, ownership | "It hallucinated once, so I'm careful" |
| A large change you had to review | Review method under volume | "I read it all" |
| A task you chose to do yourself | Judgment about fit | "I don't trust AI" |

## Worked example

Fictional composites from a team building a calendar app.

### Easy

**"How do you use AI tools?"**

"Mostly for three things: summarizing code I haven't read, drafting tests from cases I write myself, and boilerplate that follows an existing file. I don't use it to decide what the fix is. Before I accept anything I run the tests I wrote and read the diff line by line. If it misses the same point twice, I write that part myself."

Specific uses, a stated boundary, a stated check.

### Medium

**"Tell me about a time generated code was wrong."**

"I asked an assistant to add recurring-event expansion for weekly meetings. The code looked right and the happy-path test passed. I'd written a case for a meeting that crosses a daylight-saving change, and it failed: the generated code added seven times 24 hours instead of seven calendar days, so the meeting drifted by an hour. I rewrote that part to use calendar arithmetic and added two more time-zone cases. Since then I write the date-boundary tests before asking for any date code, and I suggested we add a DST fixture to our shared test helpers, which the team did."

The check (a pre-written DST case) is named, and the change outlasted the story.

### Hard

**"When do you not use it?"**

"Two cases. First, when describing the change would take longer than writing it, like a two-line guard. Second, when I'm still working out what the design should be. Last quarter I had to decide how to store calendar sharing permissions. I worked that out on paper with a teammate, because I needed to understand the tradeoffs myself to defend them in review. Once we'd chosen the schema, I used the assistant to draft the migration and the tests, and I reviewed those like any other change."

This answer avoids both extremes and ties the choice to a reason.

## Common mistakes

| Habit | What the interviewer hears | Fix |
| --- | --- | --- |
| "I use it for everything" | No boundary, no judgment | Name what you delegate and what you do not |
| "I never use it" on a team that does | Possible friction | Explain your actual boundary and reasons |
| Vague checks: "I review carefully" | Unverifiable | Name the test, search, or doc you used |
| Big productivity numbers | Overselling | Use a concrete task instead of a multiplier |
| Blaming the tool | Low ownership | "I accepted it; my check caught it later" |
| No change afterward | No growth | End with the habit you kept |

## How to talk about it

Lead with the boundary in one sentence: "I use it for X and Y; I don't use it to decide Z." Then let the story carry the evidence. If the interviewer pushes ("Isn't that slower?"), answer with the tradeoff: "For a two-line change, yes. For the recurring-event code, the test caught a bug that would have reached users."

**Notebook exercise:** In your notes for this lesson, write the three stories above in five lines each. For each story, underline the line that names the check. If you cannot underline a concrete check, the story is not ready. Then write one sentence starting "I don't use it for…" that is true for you.

## Cross-links

- [Build a small bank of stories you can bend](./story-bank/lesson.md) (id: story-bank)
- [Tell a mistake so the repair is the story](./failure-stories.md) (id: failure-stories)
- [What the interviewer writes down](./behavioral-scoring.md) (id: behavioral-scoring)
- [Drive the assistant in a live coding round](../ai-agents/ai-pairing-interview.md) (id: ai-pairing-interview)
