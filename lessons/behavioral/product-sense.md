---
id: product-sense
title: "Optional: frame a user, a metric, and a trade-off"
slug: product-sense
kind: strategy
track: behavioral
difficulty: intro
estimated_minutes: 14
summary: "Optional. Answer a product prompt by naming the user, the pain, the metric you would move, and the cost of the fix."
tags:
  - behavioral
  - behavioral/projects
  - interviews
  - interviews/behavioral
prerequisites:
  - project-deep-dive
related:
  - project-deep-dive
  - behavioral-scoring
  - closing-questions
  - portfolio-prototypes
company_signal: []
sources_consulted: []
updated: 2026-11-02
status: canonical
---

# Optional: frame a user, a metric, and a trade-off

## Snapshot

- Optional track. Use it when a loop has a product conversation, not as a substitute for the core path.
- Candidate notes mention product rounds alongside engineering rounds at several companies [2nd]. Treat the company list as rumor until a recruiter confirms it.
- One hiring manager's public note values prototypes that show taste and empathy. That is one team's practice [P, see the portfolio lesson].
- A strong answer picks a narrow user and a metric. A weak one lists features.
- The prompts below are practice. They are not leaked questions.

## Why it shows up in interviews

Some loops ask what you would improve in the product, or how a user would configure the thing you just built. Shopify-style practical rounds are described as growing a design and then asking how a user would set it up [2nd]. The engineering lessons in this corpus already force a cut line. This lesson is the same cut in product language: who hurts, what number moves, what you refuse to build.

## Core idea

### Four beats

1. **User.** One person, not "users." A podcaster editing a transcript. A recruiter trying to get an interview on the calendar. A listener deciding whether a cloned voice is allowed.
2. **Pain.** What they do today, in one sentence, including the workaround.
3. **Metric.** One number you could read in a month. Time to a correct sentence. Time from request to a scheduled interview. The share of clone attempts that recorded consent.
4. **Trade-off.** What gets worse if you win. Speed versus accuracy. Fewer clicks versus a consent step people try to skip.

If you cannot name the metric, you are still brainstorming. Stop and pick one.

Use a number from your own shipping history when you have one. Do not borrow a metric you cannot define.

## Worked example

### Three practice prompts

Spend 15 minutes on one. Write the four beats. Then say them in under three minutes.

**Transcript editing.** "Make transcript editing better for a podcaster who publishes a weekly interview." A narrow pain: fixing a name that the transcript got wrong in twelve places. Metric: minutes from upload to a transcript they trust, or the count of repeated manual replacements. Trade-off: auto-replace is fast and will corrupt a name that was right once. Say which default you pick and why.

**Scheduling.** "Shorten the time to get a candidate on the calendar." User: the recruiter, not the candidate, if the queue is the recruiter's. Metric: hours from "move forward" to a confirmed slot. Trade-off: more automated slots can increase no-shows. Name the cap you would accept.

**Voice cloning.** "Design the consent step before someone's voice can be cloned." User: the person whose voice it is. Metric: share of clones that have a recorded yes, and the drop-off on that step. Trade-off: a strict step stops abuse and also stops a legitimate project that cannot find the speaker. Say what you block anyway.

### A weak answer and a stronger one

Weak: "Add AI editing, templates, and sharing." No user, no metric, three features.

Stronger: "The podcaster is fixing one misspelled name across the episode. I'd measure minutes-to-trusted-transcript. I'd ship replace-all with a preview of the twelve hits, not a silent rewrite, because a silent rewrite will 'fix' a sentence that was already right."

## Common mistakes

- A feature list with no user.
- A metric you could not query ("delight").
- Ignoring the trade-off, or naming one you would not actually accept.
- Talking about a company you have not used as if you had internal numbers.
- Skipping the cut. Taste is also what you would not build this quarter.

## How to talk about it

"The user is the podcaster fixing one name. The metric is minutes until they trust the transcript. I'd preview the replacements. I would not silently rewrite, because the cost is a correct sentence changed. I'd look at that metric for a month before adding a second feature."

**Notebook:** Write one of the three prompts in four beats, in your notes. Then write the feature you are explicitly not building.

## Cross-links

- [Explain a system you built at three zoom levels](./project-deep-dive/lesson.md) (id: project-deep-dive)
- [What the interviewer writes down](./behavioral-scoring.md) (id: behavioral-scoring)
- [Ask questions that show how the team works](./closing-questions.md) (id: closing-questions)
- [Optional: show a small prototype and a taste memo](../ai-agents/portfolio-prototypes.md) (id: portfolio-prototypes)
