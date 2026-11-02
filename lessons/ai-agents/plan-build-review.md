---
id: plan-build-review
title: Plan, build, and review in one half-day
slug: plan-build-review
kind: strategy
track: ai-agents
difficulty: core
estimated_minutes: 18
summary: Practice a scoped plan, a two-hour solo build with any tools, and a review of the demo, the data model, and how you used AI.
tags:
  - ai-agents
  - interviews
  - interviews/ai
prerequisites:
  - greenfield-ai-build
  - take-home-artifacts
related:
  - greenfield-ai-build
  - take-home-artifacts
  - reviewing-ai-code
  - project-deep-dive
company_signal:
  - name: Sierra
    evidence: https://sierra.ai/blog/the-ai-native-interview
    year: 2026
    confidence: high
  - name: Cursor
    evidence: https://www.businessinsider.com/cursor-interview-process-no-ai-on-site-project-coding-tool-2025-6
    year: 2025
    confidence: medium
sources_consulted:
  - https://sierra.ai/blog/the-ai-native-interview
  - https://www.businessinsider.com/cursor-interview-process-no-ai-on-site-project-coding-tool-2025-6
  - https://openai.com/interview-guide/
updated: 2026-11-02
status: canonical
---

# Plan, build, and review in one half-day

## Snapshot

- Sierra's April 2026 post drops coding and algorithms rounds. The onsite is Plan, a two-hour solo Build with any AI tools, then Review [P].
- Criteria are shared in advance and do not depend on what you build. Cutting scope is fine. They hire for a spike.
- Review covers product flows, data model, abstractions, extensibility, path to production, and how AI was used [P].
- Cursor's reported final stage is a two-day in-person build and demo [R for the 2025 process; 2nd for the two-day shape from an employee post].
- A reported OpenAI loop includes an experimental round that finishes a too-big task with an agent [2nd]. OpenAI's guide says AI rules vary by format [P].

## Why it shows up in interviews

Some teams stopped adding an AI round beside algorithms and removed the algorithm round. Sierra is a primary-source example [P]. An Anthropic hiring manager, Felix Rieseberg, wrote on 27 October 2026 that he had dropped the traditional coding interview for his team. That is one team's practice, not a company policy [P]. The half-day drill below copies Sierra's shape and uses a site-health product so the review has a production path to talk about. It is not a leaked prompt.

## Core idea

### The three blocks

**Plan, 30 minutes, with the interviewer.** Agree a cut line out loud. One issue type end to end beats three half-built ones. Name what is mocked. Name who is allowed to see which sites.

**Build, 2 hours, alone, any tools.** One vertical slice, then breadth. Keep a `PROCESS.md` while you work: what you delegated, what you rejected, what is mocked. That file is the same habit as [the take-home log](./take-home-artifacts.md) (id: take-home-artifacts).

**Review, 45 minutes.** Demo first. Then the data model. Then what is fake. Then the path to production: background jobs, rate limits, an audit on one-click fixes, a feature flag. Then an honest split of labor: "the agent wrote the UI and the crawler stub; I wrote ranking and the permission check; I rejected its approach of storing visibility in the client."

Sierra is also piloting a round where you review a colleague's draft pull request with coding agents [P]. That skill is [reviewing AI-written diffs](./reviewing-ai-code.md) (id: reviewing-ai-code).

## Worked example

### The practice prompt

> Plan: an agency "site health" panel. It surfaces the top three issues across client sites (broken links, slow pages, blocks from the edge rules) and offers a one-click fix only where that fix is safe. Build for two hours. Review the demo, the data model, the path to production, and how you used AI.

Strong plan, said before any prompt to the agent:

- Cut line: broken links only, a mocked crawler, real ranking. Slow pages and edge blocks are named and not built.
- Permission model: an agency role decides which sites are visible. A fix that edits a site checks that role again.
- Data model you own: `Finding { siteId, kind, evidenceUrl, rank }` and `Fix { findingId, reversible }`. The agent does not pick this.

Strong build: the slice creates a finding, ranks it, and shows it. `PROCESS.md` records one rejection. For example, the agent stored the ranking in component state, and you moved it to the store so the review can query it.

Strong review, in this order: demo, model, what is mocked, production path, AI account.

Production path you should be able to say: crawl jobs with a lease, a per-site fetch budget, an audit row for every one-click fix, and a flag that disables fixes without disabling the list.

### Rubric

Sierra's published criteria, scored for this drill [P].

| Signal | Points |
| --- | --- |
| Product flows and taste | 0–3 |
| Data model and abstractions | 0–3 |
| Path to production | 0–3 |
| How AI was used | 0–3 |
| One spike: something done unusually well | 0–2 |

Ten or more out of 14, with a non-zero spike, is the bar. A finished mock with no production path is not.

Also run the 1–4 guide in [take-home artifacts](./take-home-artifacts.md) (id: take-home-artifacts). A 4 on ownership is the review block.

## Common mistakes

- Five issue types, none clickable.
- A plan that never names the permission check.
- No `PROCESS.md`, so the review becomes "the AI did it."
- Hiding what is mocked. Sierra's post treats a cut as acceptable [P].
- Spending the review on the tool instead of the demo.

## How to talk about it

"The cut is broken links, mocked fetch, real rank. Agency role gates the site list and any fix. The agent drafted the page; I wrote the ranker and the permission check, and I rejected storing rank in the component. Next I would add a leased crawl, a fetch budget, and an audit row on the fix."

## Cross-links

- [Greenfield builds in your own environment with AI](./greenfield-ai-build.md) (id: greenfield-ai-build)
- [Leave a transcript you would let a hiring manager read](./take-home-artifacts.md) (id: take-home-artifacts)
- [Reviewing AI-generated code and PRs](./reviewing-ai-code.md) (id: reviewing-ai-code)
- [Explain a system you built at three zoom levels](../behavioral/project-deep-dive/lesson.md) (id: project-deep-dive)
- [Optional: show a small prototype and a taste memo](./portfolio-prototypes.md) (id: portfolio-prototypes)
