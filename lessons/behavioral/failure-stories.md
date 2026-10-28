---
id: failure-stories
title: Tell a mistake so the repair is the story
slug: failure-stories
kind: strategy
track: behavioral
difficulty: core
estimated_minutes: 15
summary: Answer failure questions with a real mistake you own, a short account of the damage, and most of the time spent on detection, repair, and what changed afterward.
tags:
  - behavioral
  - behavioral/stories
  - behavioral/delivery
  - interviews
  - interviews/behavioral
prerequisites:
  - story-bank
related:
  - story-bank
  - conflict-stories
  - ownership-ambiguity
  - behavioral-scoring
company_signal: []
sources_consulted:
  - https://sre.google/sre-book/postmortem-culture/
  - https://doi.org/10.2307/2666999
updated: 2026-10-28
status: canonical
---

# Tell a mistake so the repair is the story

## Snapshot

- "Tell me about a failure" is asking for ownership and growth, not for a confession.
- Pick a mistake that was really yours, had a visible consequence, and led to a lasting change in how you work.
- Spend about a fifth of the answer on what went wrong and the rest on how it was found, how you fixed it, and what changed so it would not happen again.
- Do not pick a disguised strength ("I work too hard") or a catastrophe you cannot explain calmly.

## Why it shows up in interviews

Everyone who ships software makes mistakes. Interviewers ask about them to see whether you notice your own errors, say so quickly, fix them, and change something afterward. Those are the ownership and growth signals described in [what the interviewer writes down](./behavioral-scoring.md) (id: behavioral-scoring).

Blameless postmortem practice in operations teams is a useful model here. The idea is to describe what happened and why the system allowed it, without making the story about who to punish. In an interview you do take personal ownership, since it is your story, but the same habits help: timeline, contributing factors, fix, follow-up. Research on team learning has also described how people are more likely to report errors when they expect it to be safe to do so; interviewers are, in part, checking whether you would.

Variants you may hear: "Tell me about a mistake", "…a project that didn't go well", "…a time you got critical feedback", "…a decision you'd make differently".

## Core idea

### ELI5

Tell it like a small, honest incident report about yourself:

1. **What I did** — one or two sentences, first person, no hedging. "I merged a migration without testing it against production-sized data."
2. **What it caused** — the visible consequence, sized accurately. Not minimized, not dramatized.
3. **How it was found** — by you, by an alert, by a user, by a teammate. Being found by someone else is fine; say so.
4. **What I did next** — the first hour: stop the damage, tell the people affected.
5. **The fix** — the actual repair.
6. **What changed** — a habit, a check, a process, a piece of tooling. This is the part that scores.
7. **Evidence it stuck** — "Since then…" if you have it.

### Choosing the mistake

| Usable | Avoid |
| --- | --- |
| A bug you shipped that users saw | A failure that was entirely someone else's fault |
| An estimate you got badly wrong | A disguised strength ("I cared too much") |
| A conversation you handled poorly, then repaired | Something involving ethics, harassment, or legal trouble |
| Feedback you resisted, then acted on | A mistake from so long ago you can't describe the fix |
| A project you should have stopped earlier | A story where nothing changed afterward |

Scale matters a little: for a senior role, a mistake with no consequence beyond your own afternoon reads as too small. But the honesty and the change matter more than the size.

## Worked example

Fictional composites from a team running a notification service for a mobile app.

### Easy

**"Tell me about a mistake you made."**

"I changed the default time zone handling in our reminder scheduler and didn't check what happened for users who had never set a time zone. About a day's worth of reminders for those users went out at the wrong hour. A support ticket flagged it the next morning. I reverted the change within the hour, posted in our team channel what I'd broken, and wrote the fix with a test for the no-time-zone case. Since then I start any date-handling change by listing the inputs that have no value, and I add a test for each before touching the code."

Clear ownership, sized consequence, concrete change.

### Medium

**"Tell me about a project that didn't go well."**

"I estimated two weeks to move our push notifications to a new delivery provider. It took seven. My mistake was estimating from the happy path: I hadn't looked at how we handled devices that had uninstalled the app, which turned out to differ between the old and new provider. By week three I knew the estimate was wrong but I kept hoping to catch up, and I told my lead only at the end of week four. She was fair about it but said she'd have moved another person onto it in week three if she'd known. What I changed: I now break estimates into the parts I've read code for and the parts I haven't, and give a range for the second group. And I send a short status note when anything slips by more than a few days, even if I think I can recover."

The more interesting mistake is the late warning, and the candidate names it. That is what makes the story credible.

### Hard

**"Tell me about critical feedback you received."**

"In a review, a senior engineer told me my design documents were hard to follow: long background, and the decision buried on page three. My first reaction was defensive; I thought the background was necessary. I asked two other reviewers whether they agreed and both said yes, more gently. So I tried a format that starts with the decision and the main alternative in the first paragraph, and moves background to the end. On my next document, review took one round instead of three. I still think some background is needed, so I keep it, but it goes after the decision now."

This works because it shows the defensive reaction honestly, a check of the feedback, a specific change, and a measured result.

## Common mistakes

| Habit | What the interviewer hears | Fix |
| --- | --- | --- |
| Long setup, rushed ending | The repair and learning are missing | Keep the mistake to about a fifth of the answer |
| Passive voice: "a bug was introduced" | Avoiding ownership | "I introduced a bug" |
| Spreading the blame: "the requirements were unclear" | Low ownership | Mention contributing factors after owning your part |
| Disguised strength | Not answering | Use a real mistake with a real cost |
| No change afterward | No growth | Name the habit or check you added |
| Overdramatizing | Poor judgment about severity | Size the impact precisely and calmly |

## How to talk about it

Say the mistake in your first sentence so the interviewer knows you are not dodging: "I shipped a scheduler change that sent a day of reminders at the wrong hour." Then keep the tone matter-of-fact. You do not need to apologize to the interviewer or perform regret. End on the change and, if you have it, evidence that the change stuck.

If they follow up with "Why didn't you catch it earlier?", answer directly. That follow-up is normal and is not a trap.

**Notebook exercise:** In your notes for this lesson, write one real mistake as seven short lines matching the seven steps above. Then count: if lines one and two together are longer than lines four through seven together, rewrite them shorter. Finally, write one sentence that starts "Since then, I…" and check that it describes something you actually do.

## Cross-links

- [Build a small bank of stories you can bend](./story-bank/lesson.md) (id: story-bank)
- [Disagree in a way that improves the decision](./conflict-stories/lesson.md) (id: conflict-stories)
- [Take the unclear problem and give it edges](./ownership-ambiguity.md) (id: ownership-ambiguity)
- [What the interviewer writes down](./behavioral-scoring.md) (id: behavioral-scoring)
- [Cut scope out loud, early, to a named person](./prioritization-deadlines.md) (id: prioritization-deadlines)
