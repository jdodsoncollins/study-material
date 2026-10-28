---
id: project-deep-dive
title: Explain a system you built at three zoom levels
slug: project-deep-dive
kind: strategy
track: behavioral
difficulty: core
estimated_minutes: 18
summary: Prepare one project you can explain in thirty seconds, five minutes, or thirty minutes, with your specific contribution, the main tradeoffs, and real numbers ready at each level.
tags:
  - behavioral
  - behavioral/projects
  - interviews
  - interviews/behavioral
  - interviews/system-design
prerequisites:
  - story-bank
related:
  - story-bank
  - behavioral-scoring
  - interview-framework
  - influence-without-authority
company_signal: []
sources_consulted:
  - https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
updated: 2026-10-28
status: canonical
---

# Explain a system you built at three zoom levels

## Snapshot

- A project deep dive asks you to walk through something you built while the interviewer probes design choices, your role, and what you learned.
- Prepare three zoom levels: a thirty-second headline, a five-minute walkthrough with one diagram, and enough detail to go thirty minutes deep on any single component.
- The interviewer is checking three things: that you understand the system, that the decisions were yours or that you can explain them, and that you can say what you would change.
- Have three to five real numbers ready (traffic, size, latency, team size, timeline). If you do not know a number, say so instead of guessing.

## Why it shows up in interviews

Some loops include a round dedicated to a past project, and many behavioral and system-design rounds open with "Tell me about something you built." It tests depth that a whiteboard problem cannot: did you make real tradeoffs under real constraints? It also tests honesty about your role, since follow-up questions quickly reveal whether a design was yours.

This round sits between behavioral and system design. The structure of [Forty-five minutes is a navigation problem](../../system-design/foundations/interview-framework.md) (id: interview-framework) applies to the technical part; the ownership and scope signals from [what the interviewer writes down](../behavioral-scoring.md) (id: behavioral-scoring) apply to the rest.

## Core idea

### ELI5

Think of a map app. Zoomed out, you see the country. Zoom in, you see a city. Zoom in again, you see one street. The interviewer controls the zoom with their questions. Your job is to have a clear picture ready at each level, and to notice which level they want.

[Three zoom levels](viz/zoom.md)

**Thirty seconds — the headline.** What the system does, for whom, why it mattered, and your role. One sentence each.

**Five minutes — the walkthrough.** Draw (or describe) four to six boxes. Trace one request through them. Name the two or three decisions that shaped the design and what each traded away. State your part precisely.

**Thirty minutes — any one box.** For each component, know: why it exists, what data it holds, what happens when it fails, what you would change now. You do not need this for every box, but you need it for the boxes you built.

### What to prepare in writing

| Item | Why |
| --- | --- |
| One diagram you can draw from memory in two minutes | The interviewer will ask you to |
| Three to five real numbers, with units | Shows you measured; anchors tradeoff discussion |
| Two or three decisions, each with the alternative you rejected and why | This is the judgment evidence |
| One thing that went wrong and how you fixed it | Growth evidence, and it is often asked |
| One thing you would change today | Shows you kept thinking after it shipped |
| A sentence that separates your work from the team's | Ownership evidence, and protects you in follow-ups |

Teams that write short decision records (context, decision, consequences) have an easier time with this round, because the reasoning was written down when it happened. If you have those for your project, reread them.

### Your contribution

Be exact. "I designed the caching layer and wrote most of it; another engineer built the ingestion side; the tech lead chose the database before I joined." This sentence prevents an awkward moment later when the interviewer asks why you chose the database.

## Worked example

A fictional composite project: a link-preview service for a team chat app. When someone pastes a URL, the app shows a title, description, and image.

### Easy

**Thirty seconds:**

"I built the service that generates link previews in our chat app. When someone pastes a URL, we fetch the page, pull out a title and image, and show a card. It mattered because previews were the most-requested missing feature. I designed it and wrote most of the backend; one other engineer built the client card."

That is the whole headline. Stop and let them choose where to go.

### Medium

**Five minutes:**

"Four parts. The chat client sends the URL to a preview API. The API checks a cache keyed by the normalized URL. On a miss, it puts a job on a queue, and a fetcher worker downloads the page with a strict timeout and size limit, parses the metadata, and stores the result. The client shows a placeholder and gets the card when it's ready.

Three decisions shaped it. First, asynchronous fetching: some pages took several seconds, and I didn't want the send path waiting on a stranger's server. That cost us a placeholder flicker. Second, a cache keyed by normalized URL, because the same links get pasted in many channels; I normalized by dropping tracking parameters, which occasionally merged two pages that should have been separate. Third, the fetcher runs in an isolated network segment and refuses internal addresses, because fetching arbitrary URLs from inside our network is a known server-side request forgery risk.

Numbers: at launch we handled on the order of a few hundred previews per minute at peak; the cache served most requests; fetch timeout was three seconds. Team was two engineers for about six weeks."

Those numbers belong to this fictional story. In your own story, use only numbers you actually know, and say "roughly" when that is the truth.

### Hard

**Thirty minutes on one box — the interviewer asks about the fetcher.**

Likely follow-ups and the kind of answer that holds up:

- *"How did you stop it from fetching internal services?"* — "Resolve the hostname first, reject private and loopback ranges, then connect to the resolved address so a second lookup can't return a different one. Also no redirects to internal ranges, checked on each hop."
- *"What happened when a popular site was slow?"* — "The timeout capped worker time. We cached failures for a short time so a slow site pasted in a busy channel didn't fill the queue with retries."
- *"What went wrong?"* — "Early on, some sites served huge images and the worker ran out of memory. I added a size limit on the download and only stored a resized thumbnail."
- *"What would you change?"* — "I'd normalize URLs less aggressively. Merging pages that differed only by a parameter caused a few wrong previews, and the cache savings from that rule were small."
- *"Why that queue and not another?"* — "The team already ran it, so on-call knew it. I didn't evaluate alternatives deeply; for our volume the choice didn't matter much."

The last answer is a good model: honest that the choice was pragmatic, with the reason.

## Common mistakes

| Habit | What happens | Fix |
| --- | --- | --- |
| Starting at thirty-minute depth | Interviewer gets lost, time runs out | Give the headline first, then ask where to go |
| Picking a project you only partly understand | Follow-ups expose gaps | Choose one where you made or can defend the decisions |
| Inventing numbers | Breaks under one follow-up | Use real numbers or say "I don't remember exactly; it was roughly…" |
| Vague contribution | Ownership unclear | Say exactly which parts were yours |
| No tradeoffs, only features | Judgment box empty | Name what each decision cost |
| Defending every choice | Sounds rigid | Volunteer one thing you would change |
| Revealing confidential details | Trust problem | Describe the shape and scale without internal names or secrets |

## How to talk about it

Open with the headline and then ask: "Would it help if I sketched the architecture, or would you like me to go deep on one part?" That hands the zoom control to the interviewer explicitly. While walking through, signal decisions out loud: "Here's the first tradeoff." When you hit something you don't know, say so and say how you would find out.

Keep confidential information out. You can describe a system's shape and approximate scale without naming internal services or sharing numbers your employer would consider private; if unsure, round or describe relatively ("most requests were cache hits").

**Notebook exercise:** In your notes for this lesson, pick one project. Write its thirty-second headline in four sentences (what, for whom, why it mattered, your role). Below it, list four to six boxes for the diagram, three real numbers with units, two decisions with the rejected alternative for each, and one thing you would change. Then draw the diagram from memory on paper, timing yourself, and note how long it took.

## Cross-links

- [Build a small bank of stories you can bend](../story-bank/lesson.md) (id: story-bank)
- [What the interviewer writes down](../behavioral-scoring.md) (id: behavioral-scoring)
- [Forty-five minutes is a navigation problem](../../system-design/foundations/interview-framework.md) (id: interview-framework)
- [Change a decision you do not own](../influence-without-authority.md) (id: influence-without-authority)
- [Remembering the expensive answer nearby](../../system-design/foundations/caching/lesson.md) (id: caching)
