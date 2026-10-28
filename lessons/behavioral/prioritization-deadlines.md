---
id: prioritization-deadlines
title: Cut scope out loud, early, to a named person
slug: prioritization-deadlines
kind: strategy
track: behavioral
difficulty: core
estimated_minutes: 15
summary: Deadline and prioritization stories show how you compared work by value and cost, decided what to cut or delay, and told the right person early enough for them to react.
tags:
  - behavioral
  - behavioral/delivery
  - interviews
  - interviews/behavioral
prerequisites:
  - story-bank
related:
  - ownership-ambiguity
  - failure-stories
  - conflict-stories
  - behavioral-scoring
company_signal: []
sources_consulted:
  - https://basecamp.com/shapeup
updated: 2026-10-28
status: canonical
---

# Cut scope out loud, early, to a named person

## Snapshot

- Prioritization questions check judgment: how you chose between good things when there was not time for all of them.
- Deadline questions check delivery and communication: what you did when the plan and reality diverged.
- The strongest stories include a **cut** (something deliberately not done), a **reason** tied to the goal, and a **warning** given to a specific person early, not on the due date.
- Working late to hit a date is not a prioritization story. Use it only if you also explain what you would do differently.

## Why it shows up in interviews

Every team has more work than time. Interviewers ask "Tell me about a time you had competing priorities", "…missed a deadline", or "…had to deliver under pressure" to see whether you make tradeoffs deliberately and communicate them. These answers feed the judgment and ownership signals in [what the interviewer writes down](./behavioral-scoring.md) (id: behavioral-scoring).

A common weak answer describes heroics. That shows effort, but it can also suggest the problem was noticed late and nobody was told.

## Core idea

### ELI5

When work does not fit, you have three dials: **time** (move the date), **scope** (do less), and **people** (add help, which rarely helps quickly). One useful habit, borrowed from teams that fix the time box and let scope flex, is to treat the date as fixed by default and ask what can be cut.

1. **List what is left**, with a rough size for each item.
2. **Tie each item to the goal.** Which items does the goal actually need? Which are nice to have?
3. **Find the cut.** Remove or defer items until the rest fits, with some margin.
4. **Name who needs to know** — the person who owns the date or the goal — and tell them now, with the proposed cut and the alternative (move the date).
5. **Let them decide** if it is their call. Write down what was agreed.
6. **Deliver the reduced scope**, then follow up on what was deferred so it does not vanish.

### Comparing work

When choosing between tasks, a short table beats intuition:

| Question | Why it helps |
| --- | --- |
| What happens if we never do this? | Separates must-have from nice-to-have |
| What happens if we do it a month late? | Separates urgent from important |
| How big is it, roughly? | Small important items go first |
| Is anyone blocked on it? | Unblocking others multiplies output |
| Can it be undone if we get it wrong? | Irreversible items deserve more care, not more speed |

## Worked example

Fictional composites from a team building a shopping cart and checkout for a mid-sized online store.

### Easy

**"Tell me about a time you had competing priorities."**

"In one sprint I had a bug where some discount codes applied twice, and a feature for saving the cart across devices. The bug was costing money on every affected order; the feature was a request from product with no fixed date. I fixed the bug first, told the product manager in our standup that the feature would slip two days, and she agreed."

Short and clear. The reason is tied to impact, and the person who cared was told.

### Medium

**"Tell me about a time you missed a deadline."**

"We committed to launching gift cards before a holiday sale. Halfway through, I found that partial refunds on orders paid partly by gift card were more complex than we'd planned: the refund had to go back to the card and the credit card in the right amounts. I estimated another two weeks, which would miss the sale. I wrote the product manager a short message that day: we could launch on time with gift cards working for purchases, with partial refunds handled manually by support for the first month, or launch two weeks late with everything automated. I included how many refund cases support would likely see, based on last year's return rate. She chose the on-time launch with manual refunds. Support handled a manageable number of cases, and I shipped automated refunds three weeks after the sale."

What makes it work: found the problem early, gave two options with a cost for each, the owner decided, the deferred item was delivered.

Technically the full scope missed the date. That is fine; the story shows how it was handled.

### Hard

**"Tell me about a time you had to say no."**

"Our checkout team got three requests in the same month: a new payment method from sales, an accessibility fix from our own audit, and a performance project to cut checkout load time that I'd been pushing. We had capacity for about two. I wrote a half-page table: for each, who was affected, what happened if it slipped a quarter, and rough size. The accessibility fix affected users who couldn't complete checkout at all, and it was small, so it went first. The payment method had a signed customer waiting. My performance project lost: it was the one that could slip a quarter with the least harm. I said that in the planning meeting myself, since it was mine. The sales lead was happy, and I picked the performance work up the next quarter with the same table updated."

What makes it work: explicit criteria, the candidate cut their own favorite, and the cut was announced openly.

## Common mistakes

| Habit | What it signals | Fix |
| --- | --- | --- |
| Heroics only: "I worked all weekend" | Late detection, no tradeoff | Say what you cut or when you warned someone |
| Warning on the due date | Poor communication | Show the warning coming as soon as you knew |
| "Everything was a priority" | No judgment shown | Name the item that lost and why |
| Cutting quality silently | Risky judgment | If you cut tests or reviews, say so and why it was safe |
| Deferred items disappear | Ownership stops | Mention when and how the deferred work was finished |
| Blaming the original estimate | Low ownership | Own the estimate, then explain the new information |

## How to talk about it

State the constraint in the first sentence: "Two weeks before a sale, I found the refund flow was twice as big as planned." Then make the cut and the warning explicit: "I sent the product manager two options that afternoon." Interviewers often follow up with "How did you decide?" — have the criteria ready.

If the story ends with a missed date, do not apologize for it in the interview. Explain how you handled it and what you changed afterward.

**Notebook exercise:** In your notes for this lesson, write a real time your work did not fit the time you had. List the items that were in scope, mark each "needed for the goal" or "nice to have", and write which one you cut or would cut. Then write the exact message, two or three sentences, that you sent or should have sent to the person who owned the date, including the two options.

## Cross-links

- [Take the unclear problem and give it edges](./ownership-ambiguity.md) (id: ownership-ambiguity)
- [Tell a mistake so the repair is the story](./failure-stories.md) (id: failure-stories)
- [Disagree in a way that improves the decision](./conflict-stories/lesson.md) (id: conflict-stories)
- [What the interviewer writes down](./behavioral-scoring.md) (id: behavioral-scoring)
- [Build a small bank of stories you can bend](./story-bank/lesson.md) (id: story-bank)
