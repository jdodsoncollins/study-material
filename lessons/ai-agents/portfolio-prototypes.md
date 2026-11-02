---
id: portfolio-prototypes
title: "Optional: show a small prototype and a taste memo"
slug: portfolio-prototypes
kind: strategy
track: ai-agents
difficulty: intro
estimated_minutes: 12
summary: "Optional. Prepare a five-minute demo of something you shipped, plus a one-page note on why you built it, what you cut, and what you learned."
tags:
  - ai-agents
  - interviews
  - interviews/ai
prerequisites:
  - product-sense
  - project-deep-dive
related:
  - product-sense
  - project-deep-dive
  - plan-build-review
  - ai-fluency-slope
company_signal:
  - name: Anthropic
    evidence: https://felixrieseberg.com/hunger-beats-tenure-advice-for-junior-engineers/
    year: 2026
    confidence: medium
sources_consulted:
  - https://felixrieseberg.com/hunger-beats-tenure-advice-for-junior-engineers/
  - https://x.com/felixrieseberg/status/2115200995546566910
updated: 2026-11-02
status: canonical
---

# Optional: show a small prototype and a taste memo

## Snapshot

- Optional track.
- On 27 October 2026, Felix Rieseberg wrote that he had dropped the traditional coding interview for his team and now looks for small prototypes that show taste, empathy, and principled thinking [P].
- He is a hiring manager at Anthropic. The post is his team's practice, not a published company-wide policy.
- The artifact is a demo plus a one-page memo. The memo is the signal.
- Use something you actually shipped. Do not borrow a story.

## Why it shows up in interviews

Most of this corpus trains timed rounds. A minority of teams, in 2026, said out loud that they would rather see a prototype than a live algorithm. Rieseberg's post is the primary source for that stance, and it is narrow: one team [P]. Cursor's reported onsite is a build during the interview, which is different: you make the thing there [R, see the half-day lesson]. This lesson is for the case where the work already exists and you have to talk about the cuts.

## Core idea

### The memo

One page, three headings:

- **Why this.** The user and the pain, in the sense of [the product frame](../behavioral/product-sense.md) (id: product-sense).
- **What I cut.** Two features you did not build, and the reason. Taste is the cut.
- **What I learned.** One surprise from real use, with a number if you have one. "People liked it" is not a learning.

Then a five-minute demo path you can do on a laptop with no network if the network fails: one happy path, one edge you are proud of, one known gap you say before they find it.

### What not to bring

A tour of every screen. A generated README you cannot defend line by line. Someone else's project. A private employer system you should not show.

If the only interesting thing you have is this study habit, do not force it into a product demo. Pick a prototype, or skip this optional track.

## Worked example

### A composite memo

A fictional notes app, so the shape is visible. Replace it.

**Why this.** The user is someone who records a meeting and loses the decision. The pain is scrolling a transcript to find the sentence where they agreed.

**What I cut.** I did not build multiplayer, and I did not build a summary model in the first version. Multiplayer would hide whether the single-player capture was any good. The model would invent decisions. I shipped search over the transcript instead.

**What I learned.** In a week of my own use, I opened search 11 times and played the audio from the hit 9 of those times. The hit without the audio was not enough. So the next cut was "keep the audio link on every hit," not "add a chatbot."

Demo: search a word, land on the line, play three seconds, show a miss. Mention the gap: no speaker labels yet.

### Rubric you can apply to your own memo

| Signal | Points |
| --- | --- |
| A specific user and pain | 0–3 |
| Cuts you can defend | 0–3 |
| A learning from use, not from the build log | 0–3 |
| A five-minute path that includes a gap you name | 0–2 |

## Common mistakes

- A feature tour with no cut.
- Claiming the post is Anthropic's company policy.
- Demo that needs an account you cannot log into on stage.
- Hiding the gap until someone asks.
- A memo written by an assistant that you then cannot explain.

## How to talk about it

"I cut multiplayer and I cut a summary model. I kept search that jumps to the audio. In my own week I followed the audio on 9 of 11 searches, so the next piece is that link, not a chat box. Speaker labels are still missing."

**Notebook:** Draft the three headings for a real prototype. If you do not have one, write "no prototype yet" and do not invent one.

## Cross-links

- [Optional: frame a user, a metric, and a trade-off](../behavioral/product-sense.md) (id: product-sense)
- [Explain a system you built at three zoom levels](../behavioral/project-deep-dive/lesson.md) (id: project-deep-dive)
- [Plan, build, and review in one half-day](./plan-build-review.md) (id: plan-build-review)
- [Tell the slope of your AI practice](../behavioral/ai-fluency-slope.md) (id: ai-fluency-slope)
