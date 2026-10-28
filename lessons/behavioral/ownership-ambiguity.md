---
id: ownership-ambiguity
title: Take the unclear problem and give it edges
slug: ownership-ambiguity
kind: strategy
track: behavioral
difficulty: core
estimated_minutes: 15
summary: Ownership and ambiguity stories show how you turned a vague problem into a stated goal, a first small step, and a plan others could follow, then carried it past launch.
tags:
  - behavioral
  - behavioral/leadership
  - behavioral/delivery
  - interviews
  - interviews/behavioral
prerequisites:
  - story-bank
related:
  - behavioral-scoring
  - influence-without-authority
  - prioritization-deadlines
  - failure-stories
company_signal: []
sources_consulted:
  - https://basecamp.com/shapeup
updated: 2026-10-28
status: canonical
---

# Take the unclear problem and give it edges

## Snapshot

- Ambiguity questions ask what you do when nobody has told you exactly what to build. Ownership questions ask whether you carry work through the parts nobody assigned.
- The core move is the same: write down what the problem is, what "done" means, and the smallest step that would teach you something, then share it.
- Show the moment the problem became clear, and what you did to make it clear. That moment is the evidence.
- Ownership continues after launch: measuring, fixing, documenting, handing off.

## Why it shows up in interviews

As engineers become more senior, more of their work arrives as a symptom ("users say the editor feels slow", "on-call is miserable") rather than a ticket. Interviewers ask "Tell me about a time you worked on something with unclear requirements" or "…took ownership of something outside your role" to check scope and ownership, two of the signals in [what the interviewer writes down](./behavioral-scoring.md) (id: behavioral-scoring).

For senior roles in particular, an answer that waits for someone else to define the problem tends to read as below the level.

## Core idea

### ELI5

When the problem is foggy, draw a box around it on paper.

1. **Write the symptom** in the words the people affected use.
2. **Ask** two or three people closest to it what they think is going on. Listen for numbers and examples.
3. **Write a one-paragraph problem statement**: who is affected, what they experience, how you will know it got better.
4. **Pick a time box.** Decide how much effort the problem is worth before you start, not after. Fixed time with flexible scope keeps an unclear problem from expanding forever.
5. **Do the smallest step that removes the most uncertainty**: a measurement, a prototype, a log query.
6. **Share the box** — the statement, the time box, the first finding — with whoever cares, and ask if it matches their view.
7. **Carry it through**: ship, measure against the statement, write down what is left, hand it off or close it.

### Ownership without overreach

Taking ownership is not taking over. Good stories show you checking whether someone already owns the area, telling them what you plan to do, and handing back cleanly when done. If you fixed something in another team's code, say how you coordinated with that team.

## Worked example

Fictional composites from a team building a browser-based document editor.

### Easy

**"Tell me about a time requirements were unclear."**

"I was asked to 'add export' to our editor. Nobody had said which formats. Instead of building all of them, I looked at the support inbox and found that nearly every request mentioned one format. I wrote a short note proposing that format first, with the other two listed as later, and my lead agreed in a comment. I shipped the first format in a week."

Shows the habit at small scale: look for evidence, write it down, get agreement.

### Medium

**"Tell me about a time you took ownership of something outside your job."**

"Our editor's test suite took long enough that people stopped running it locally, and failures showed up only in CI. It wasn't anyone's assigned work. I asked in our team channel if anyone was already on it, and nobody was. I spent an afternoon measuring and found that a handful of tests accounted for most of the time, each starting a full browser. I proposed giving myself one week, wrote that down in the channel, and in that week moved those tests to a lighter test setup where they didn't need a real browser. The suite became short enough that people ran it before pushing again. Afterward I added a note to the contributing guide about when a test needs a real browser, so the slow tests wouldn't creep back."

Shows checking for an existing owner, measuring, a time box, follow-through (the guide note).

### Hard

**"Tell me about the most ambiguous problem you've worked on."**

"Leadership said 'the editor feels slow', with no more detail. I first asked support and sales what customers actually said. Three different complaints came back: slow first load, lag while typing in long documents, and slow sync between collaborators. I wrote a one-page statement treating those as three problems, proposed measuring each before fixing any, and suggested a six-week time box for the whole effort. My manager agreed. The measurements showed typing lag was the most common complaint by a wide margin and only affected documents over a certain length. I focused there first and left sync for later, which I said explicitly in the update so nobody thought it was forgotten. Typing lag in long documents dropped below what users could notice, according to our measure. Sync stayed on the list and another engineer picked it up next quarter, using my measurement setup."

Shows splitting a vague mandate into named problems, measuring before building, a stated time box, explicit choice of what not to do, and a handoff.

## Common mistakes

| Habit | What it signals | Fix |
| --- | --- | --- |
| "My manager clarified the requirements, then I built it" | Waited for someone else to resolve ambiguity | Show what *you* did to clarify |
| Building the biggest version first | Poor judgment under uncertainty | Describe the smallest step that taught you something |
| Taking over another team's area silently | Overreach | Describe asking, informing, and handing back |
| Story ends at launch | Ownership stops early | Include measurement and follow-up after shipping |
| Never naming what you chose not to do | Scope looks unbounded | Say what you deferred and who knew |

## How to talk about it

Name the ambiguity precisely at the start: "The request was 'the editor feels slow', with no metric and no owner." Then make the turning point audible: "That's when I wrote it up as three separate problems." Interviewers remember that moment.

If they ask "How did you know you were working on the right thing?", point to the evidence you gathered and the people who agreed with the written statement.

**Notebook exercise:** In your notes for this lesson, write a real situation from your work where the problem was unclear when you got it. Write the symptom as you first heard it, then the one-paragraph problem statement you wrote (or wish you had written). Under it, list the smallest first step you took, and one thing you deliberately did not do. If you did not write a statement at the time, note that honestly; it is useful material for the reflection beat.

## Cross-links

- [What the interviewer writes down](./behavioral-scoring.md) (id: behavioral-scoring)
- [Change a decision you do not own](./influence-without-authority.md) (id: influence-without-authority)
- [Cut scope out loud, early, to a named person](./prioritization-deadlines.md) (id: prioritization-deadlines)
- [Tell a mistake so the repair is the story](./failure-stories.md) (id: failure-stories)
- [Build a small bank of stories you can bend](./story-bank/lesson.md) (id: story-bank)
