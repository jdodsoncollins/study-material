---
id: behavioral-scoring
title: What the interviewer writes down
slug: behavioral-scoring
kind: concept
track: behavioral
difficulty: intro
estimated_minutes: 14
summary: Behavioral rounds are usually scored against a short list of signals such as scope, ownership, judgment, collaboration, and growth, and the expected size of each depends on the level you are interviewing for.
tags:
  - behavioral
  - behavioral/stories
  - behavioral/leadership
  - interviews
  - interviews/behavioral
prerequisites:
  - story-bank
related:
  - story-bank
  - ownership-ambiguity
  - project-deep-dive
  - interview-ai-round
company_signal: []
sources_consulted:
  - https://doi.org/10.1111/j.1744-6570.1997.tb00709.x
  - https://doi.org/10.1111/peps.12052
updated: 2026-10-28
status: canonical
---

# What the interviewer writes down

## Snapshot

- In a structured behavioral round, the interviewer typically has a short list of signals and writes evidence for each from what you say.
- Common signals in software roles: **scope**, **ownership**, **judgment**, **collaboration**, and **growth**. Names differ by company; the ideas recur.
- Evidence is specific actions you took. Adjectives about yourself ("I'm very collaborative") are not evidence.
- The same story can be scored as junior or senior depending on how wide the problem was and how much of the shaping you did.

## Why it shows up in interviews

Structured interviewing, as described in the selection research literature, means asking every candidate comparable questions and rating answers against defined criteria instead of an overall impression. Many engineering organizations use some version of this for behavioral rounds: a question bank, a list of signals, and a written feedback form completed after the conversation.

You will usually not see the form. Knowing roughly what is on it changes how you tell a story: you leave evidence for each signal instead of hoping the listener infers it.

What follows is a general description. Specific companies use their own signal names, weights, and level definitions, and they change them. If a recruiter shares a list of values or competencies, prepare against that list.

## Core idea

### ELI5

The interviewer is filling in a form with five boxes while you talk. Each box needs a sentence that starts "The candidate…" and ends with something you did. Your job is to make each box easy to fill.

| Signal | The question behind it | Evidence that fills the box |
| --- | --- | --- |
| Scope | How big and how unclear was the problem you handled? | Number of people, teams, or systems affected; how defined the problem was when you got it |
| Ownership | Did you carry it to the end, including the unglamorous parts? | Follow-through after launch, fixing your own mistakes, closing loops without being asked |
| Judgment | Did you make sensible tradeoffs with incomplete information? | The options you considered, why you chose one, what you gave up |
| Collaboration | How did you work with people who wanted different things? | Specific conversations, how you handled disagreement, credit given accurately |
| Growth | Do you learn from outcomes and get better? | What you changed afterward, feedback you sought and acted on |

Interviewers also listen for things that can count against you: blaming others, taking credit for a team's work, claiming you have never made a mistake, or a story that gets less specific under follow-up questions.

### Levels, stated generally

Leveling ladders vary, but most describe something like this progression. Treat it as a rough map, not a definition any company uses.

| Rough level | Typical scope in stories | What ownership looks like |
| --- | --- | --- |
| Early career | A well-defined task or feature, with guidance | Finishing it, testing it, asking for help at the right time |
| Mid-level | A feature or small project end to end | Breaking it into tasks, unblocking yourself, handling rollout |
| Senior | An unclear problem that spans a team, or touches a neighboring team | Defining the problem, choosing the approach, bringing others along |
| Staff and above | Direction across several teams, or a technical risk nobody owns | Setting direction, changing how others work, picking what not to do |

A common miss is telling a story that is a level below the role. A senior candidate who only describes well-specified tickets leaves the scope box nearly empty, even if the work was excellent.

## Worked example

The answers below are fictional composites. Each answers "Tell me about a time you improved something that was not assigned to you."

### Easy

"Our mobile app's release checklist was a long wiki page, and people skipped steps. I turned it into a script that runs the checks that can be automated and prints the rest as a list. Releases since then haven't had a missed step from that list."

What the form gets: ownership (did it unprompted), a small but real result. Scope is narrow and there is no judgment or collaboration evidence. Fine for an early-career role; thin for senior.

### Medium

"Same checklist. Before writing anything, I asked the three people who ran releases most often which steps they skipped and why. Two steps were skipped because they were slow, so I automated those first. One step turned out to be obsolete, so I proposed removing it and the release owner agreed. I shipped the script in a week and checked in after the next two releases to see what still got missed."

What the form gets: collaboration (asked the users), judgment (prioritized by why steps were skipped, removed one instead of automating it), ownership (followed up after release). Scope still a single team.

### Hard

"Same checklist, but the cause was bigger: three app teams each had their own release process and their own missed steps, and two recent incidents came from a step one team didn't know existed. Nobody owned release process across teams. I wrote a one-page comparison of the three checklists, found six steps that every team needed, and proposed a shared script for those six while leaving each team's own steps alone. I got each team's release owner to review it, ran it in parallel with the old process for two release cycles, and then the teams switched. I'd do the parallel run again; it's what convinced the most skeptical team."

What the form gets: scope across teams, a problem nobody owned, judgment in what to standardize and what to leave alone, collaboration with peers who did not report to the candidate, and a reflection.

## Common mistakes

| Habit | Effect on the form | Fix |
| --- | --- | --- |
| Describing traits instead of actions | Boxes stay empty | Replace "I'm detail-oriented" with the specific check you added |
| All "we", no "I" | Ownership box empty | Name your part; credit others by role |
| Only happy endings | Growth box empty, and stories sound polished | Include what went wrong and what you changed |
| Picking stories below the target level | Scope reads small | Choose the widest true story you have for each slot |
| Inflating scope | Falls apart under follow-up | Claim exactly your part; a narrow true story beats a wide false one |
| Treating one company's value list as universal | Prep misses what this loop asks | Ask the recruiter what the round covers |

## How to talk about it

After telling a story, it is fine to name the tradeoff out loud, briefly: "The judgment call was standardizing only the six shared steps." That makes the judgment box easy to fill without lecturing. If the interviewer asks a follow-up like "What would you do differently?", they are usually probing growth; give a real answer, not "nothing".

If you are not sure what level of story they want, ask: "I can give you a single-team example or a cross-team one. Which is more useful?"

**Notebook exercise:** In your notes for this lesson, take the strongest story from your story bank. Under five headings (scope, ownership, judgment, collaboration, growth), write the one sentence from that story that fills each box. Any heading you cannot fill is either a gap in how you tell the story or a sign you need a different story for that signal. Mark which.

## Cross-links

- [Build a small bank of stories you can bend](./story-bank/lesson.md) (id: story-bank)
- [Take the unclear problem and give it edges](./ownership-ambiguity.md) (id: ownership-ambiguity)
- [Explain a system you built at three zoom levels](./project-deep-dive/lesson.md) (id: project-deep-dive)
- [Change a decision you do not own](./influence-without-authority.md) (id: influence-without-authority)
- [Practice AI-assisted coding and evaluation discussions](../ai-agents/interview-ai-round.md) (id: interview-ai-round)
