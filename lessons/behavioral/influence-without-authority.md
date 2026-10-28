---
id: influence-without-authority
title: Change a decision you do not own
slug: influence-without-authority
kind: strategy
track: behavioral
difficulty: core
estimated_minutes: 15
summary: Influence stories show how you changed what another person or team did by understanding what they needed, making the change cheap for them, and backing it with evidence rather than rank.
tags:
  - behavioral
  - behavioral/leadership
  - behavioral/conflict
  - interviews
  - interviews/behavioral
prerequisites:
  - conflict-stories
related:
  - conflict-stories
  - ownership-ambiguity
  - behavioral-scoring
  - project-deep-dive
company_signal: []
sources_consulted:
  - "Cohen and Bradford, Influence Without Authority, 3rd ed. (Wiley, 2017): exchange and understanding the other party's interests"
  - "Fisher, Ury, and Patton, Getting to Yes, 3rd ed. (Penguin, 2011): separating positions from interests"
updated: 2026-10-28
status: canonical
---

# Change a decision you do not own

## Snapshot

- Most engineers have to change other people's minds without being their manager: a neighboring team's API, a product manager's plan, a shared standard.
- Influence comes from three places you can show in a story: you understood what they cared about, you made the change cheaper for them, and you brought evidence.
- Good stories include the person who said no at first, and what you learned from their objection.
- "I escalated and leadership told them to do it" is a story about authority, not influence. Use it only if the question is about escalation.

## Why it shows up in interviews

From mid-level onward, a lot of impact depends on work other people do. Interviewers ask "Tell me about a time you convinced someone to change direction" or "…got buy-in from another team" to see collaboration and leadership without the org chart. For senior and staff roles this is often the main evidence of scope, as described in [what the interviewer writes down](./behavioral-scoring.md) (id: behavioral-scoring).

## Core idea

### ELI5

You want another team to do something. Before asking, answer three questions:

1. **What do they care about?** Their goals, their on-call load, their roadmap, what their manager is measured on. Ask them, don't guess.
2. **What does saying yes cost them?** Time, risk, a migration, a meeting. Can you pay some of that cost yourself?
3. **What evidence would move them?** A number, a demo, a user quote, a prototype in their codebase.

Then the sequence most good stories follow:

1. Talk to the person one-on-one before any group meeting.
2. Frame the change in terms of their interest, not yours.
3. Offer to do part of the work: write the first pull request, the migration script, the doc.
4. Start small: one endpoint, one service, one sprint, with a way to back out.
5. Give credit publicly when it works.

### Kinds of currency

Influence often works as an exchange. Things you can offer that do not need authority:

| You can offer | Example |
| --- | --- |
| Your time | "I'll write the migration and the tests." |
| Information | "Here's the error log showing what your clients see." |
| Reduced risk | "We'll run it behind a flag for one week; you can turn it off." |
| Visibility | "I'll present the result at the team review and name your team." |
| Reciprocity | "We'll take your feature request into our next sprint." |

## Worked example

Fictional composites. The candidate works on a team that builds a chat app; another team owns the shared user-profile service.

### Easy

**"Tell me about a time you persuaded a teammate."**

"Our team reviewed pull requests whenever someone got to them, and reviews sometimes sat for days. I suggested a rotation: one reviewer each day. A teammate objected that it would interrupt deep work. I suggested we try it for two weeks with the reviewer's slot limited to the first hour of their day. After two weeks, the waiting time for reviews had dropped noticeably and the teammate said the morning slot was fine. We kept it."

Small, true, shows an objection taken seriously and an experiment with an end date.

### Medium

**"Tell me about a time you influenced another team."**

"Our chat app called the profile service once per message to get the sender's display name, and during busy evenings those calls timed out and messages showed blank names. The profile team had other priorities. I met their tech lead and asked what their on-call looked like; it turned out our traffic was a big part of their evening pages. So the pitch became: a batch endpoint would cut their load from us substantially. I wrote the endpoint as a pull request against their repo, following their conventions, and offered to be on call for it for the first two weeks. They reviewed, asked for one change, and merged it. Their evening pages from our traffic stopped."

What makes it work: found their interest (on-call pain), paid the cost (wrote the code, took the pager), small scope.

### Hard

**"Tell me about a time you changed a decision you didn't agree with."**

"Product wanted to add read receipts to group chats by default. I thought it would hurt users in large groups, both socially and in terms of the extra traffic. I didn't own the decision. I asked the product manager what problem read receipts solved, and it was that people in small work groups didn't know if a message had been seen. I pulled our numbers on group sizes and found most groups were small, but a meaningful share of message volume came from large groups. I proposed receipts on by default only below a group size threshold, with an opt-in above it. I also built a quick prototype to show that the traffic cost below the threshold was small. The product manager took it to her lead with my numbers. They shipped the threshold version. I made sure the launch note credited the product manager's original idea, because it was hers; I only shaped the edge."

What makes it work: understood the goal, used data, proposed a version that kept their goal, let the decision owner decide, credited accurately.

## Common mistakes

| Habit | What it signals | Fix |
| --- | --- | --- |
| Influence by escalation only | Relies on authority | Show direct conversation and evidence first |
| Pitching your benefit | Other team has no reason to say yes | Frame in their interest |
| Asking them to do all the work | High cost for them | Offer to write the first version |
| Big-bang proposal | Risky, easy to reject | Propose a small, reversible first step |
| Forgetting the objection | Story sounds too easy | Include who said no and why |
| Taking all the credit | Erodes trust | Credit others by role, accurately |

## How to talk about it

Name the people by role and say clearly that you had no authority over them: "The profile team didn't report to my manager and had their own roadmap." Then describe what you learned about their interests, because that is the insight. Close with what happened to the relationship: did you work together again?

If asked "What if they'd still said no?", describe what you would have done: accepted it, found a workaround on your side, or escalated with both teams' cases written down and both teams aware.

**Notebook exercise:** In your notes for this lesson, write down one time you needed someone outside your reporting line to do something. Fill three lines: what they cared about, what saying yes would have cost them, and what you offered or could have offered to reduce that cost. Then write one sentence describing the first, smallest step you proposed (or would propose now).

## Cross-links

- [Disagree in a way that improves the decision](./conflict-stories/lesson.md) (id: conflict-stories)
- [Take the unclear problem and give it edges](./ownership-ambiguity.md) (id: ownership-ambiguity)
- [What the interviewer writes down](./behavioral-scoring.md) (id: behavioral-scoring)
- [Explain a system you built at three zoom levels](./project-deep-dive/lesson.md) (id: project-deep-dive)
- [Distribute versioned feature decisions](../system-design/cases/feature-flags.md) (id: feature-flags)
