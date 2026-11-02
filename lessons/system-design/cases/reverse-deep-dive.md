---
id: reverse-deep-dive
title: "Optional: critique a system someone else is running"
slug: reverse-deep-dive
kind: strategy
track: system-design
difficulty: core
estimated_minutes: 16
summary: "Optional. Spend 45 minutes on a public architecture, naming the goal, the bottleneck, the failure, and one change."
tags:
  - system-design
  - system-design/foundations
  - interviews
  - interviews/system-design
prerequisites:
  - interview-framework
  - project-deep-dive
related:
  - interview-framework
  - project-deep-dive
  - cdn-edge-caching
  - observability-slos
company_signal:
  - name: Vercel
    evidence: https://v0-eng-prep-guide.vercel.app/
    year: 2026
    confidence: high
sources_consulted:
  - https://v0-eng-prep-guide.vercel.app/
updated: 2026-11-02
status: canonical
---

# Optional: critique a system someone else is running

## Snapshot

- Optional track.
- Vercel's published prep guide includes a reverse deep dive: critique a real production system on a shared drawing surface [P].
- You are not presenting your own project. That is [the forward deep dive](../../behavioral/project-deep-dive/lesson.md) (id: project-deep-dive).
- Use a public write-up you can cite. Do not describe a private system you cannot source.
- 45 minutes. One change, with a cost.

## Why it shows up in interviews

Forward deep dives show whether you understood what you built. A reverse dive shows whether you can read someone else's system and disagree with a piece of it without pretending you have their metrics. Vercel lists it beside fullstack coding, a system design, and a values conversation [P]. The tool is a drawing surface. The signal is the critique.

## Core idea

### Four boxes

Draw only these.

1. **Goal.** What the public docs say the system is for, in one sentence. If you are guessing, label the guess.
2. **Bottleneck.** The scarce resource: origin fetches, purge time, a hot key, a model, a human in the loop. Tie it to a mechanism you read, not a vibe.
3. **Failure.** One concrete break: stale content after a publish, a thundering herd on expiry, a region loss, a bad config pushed everywhere.
4. **Change.** One modification. Name what gets worse. "Add a cache" is not a change until you name the key and the invalidation.

If you cannot point at a paragraph in the public docs for the goal, pick a different system.

### How to spend 45 minutes

- 10 minutes reading, no drawing. Bookmark two pages.
- 10 minutes on the four boxes, pencil.
- 15 minutes on the change and its cost.
- 10 minutes saying it aloud as if the interviewer is about to ask "what did you not have numbers for?"

## Worked example

### A public cache, practiced

Use a vendor's public description of incremental static regeneration or any similar "serve the stale page, rebuild in the background" design. The point of the exercise is the critique shape, not a secret about that vendor.

**Goal.** Serve a page quickly and refresh it after the underlying data changes, without a full site rebuild on every request.

**Bottleneck.** The first request after expiry, or the purge fan-out when many pages share a tag. You do not know their number. Say "I don't have the fan-out size."

**Failure.** A publish that should drop a page, while edges keep the previous document until a long TTL. Or a rebuild storm when a popular tag expires everywhere at once.

**Change.** Tie invalidation to the content tag the publish already knows, and cap concurrent rebuilds per tag. The cost: some requests still see the old page until the cap drains, so you show the age. You refuse a design that blocks the request on a global rebuild.

That is enough for 45 minutes. A second change is how this drill fails.

### What you say when you lack numbers

"The docs describe stale-while-revalidate. I don't know their rebuild concurrency. The risk I'm designing for is a tag that expires on every edge at once. I'd cap rebuilds and show age. If their cap already exists, I'd ask to see it rather than invent one."

## Common mistakes

- Retelling the marketing page.
- A private architecture you cannot cite.
- Three changes and no cost.
- Inventing QPS. Label every number you did not read.
- Critiquing your own project and calling it reverse. That is the other lesson.

## How to talk about it

"The goal is fresh pages without rebuilding the site per request. The scarce part is the rebuild after a shared tag expires. I don't have their concurrency number. I'd cap rebuilds per tag and show the page age. The cost is a longer stale window, which I'd rather have than a herd."

## Cross-links

- [Forty-five minutes is a navigation problem](../foundations/interview-framework.md) (id: interview-framework)
- [Explain a system you built at three zoom levels](../../behavioral/project-deep-dive/lesson.md) (id: project-deep-dive)
- [Serving from the edge without serving the wrong thing](../foundations/cdn-edge-caching/lesson.md) (id: cdn-edge-caching)
- [Metrics, logs, traces, and the budget for failure](../foundations/observability-slos.md) (id: observability-slos)
