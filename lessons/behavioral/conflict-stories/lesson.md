---
id: conflict-stories
title: Disagree in a way that improves the decision
slug: conflict-stories
kind: strategy
track: behavioral
difficulty: core
estimated_minutes: 16
summary: Tell disagreement stories that show you stated the other side fairly, moved the argument to shared criteria or evidence, and committed once a decision was made.
tags:
  - behavioral
  - behavioral/conflict
  - interviews
  - interviews/behavioral
prerequisites:
  - story-bank
related:
  - story-bank
  - influence-without-authority
  - behavioral-scoring
  - failure-stories
company_signal: []
sources_consulted:
  - "Fisher, Ury, and Patton, Getting to Yes, 3rd ed. (Penguin, 2011): separating positions from interests"
updated: 2026-10-28
status: canonical
---

# Disagree in a way that improves the decision

## Snapshot

- Conflict questions test whether you can disagree productively, not whether you win.
- A strong story states the other person's position in terms they would accept, then shows how the disagreement moved from opinions to criteria, evidence, or a decision owner.
- End with what happened to the working relationship and whether you committed to the outcome, especially if you lost.
- Pick a disagreement about work (design, scope, priority, process), not a personality clash.

## Why it shows up in interviews

Software is built by groups, and groups disagree about designs, priorities, and standards constantly. Interviewers ask "Tell me about a time you disagreed with someone" or "…with your manager" or "…a conflict on your team" to see how you behave when you are confident and someone else is too. The collaboration and judgment signals from [what the interviewer writes down](../behavioral-scoring.md) (id: behavioral-scoring) both get evidence from this answer.

Two answers score poorly: "I've never really had a conflict" (not believable, and no evidence) and a story where the other person was simply wrong and you were simply right.

## Core idea

### ELI5

A disagreement has a path. Good stories walk the listener along it:

1. **Notice** the disagreement early and name it, privately, before it hardens in a meeting.
2. **Restate** the other person's position until they agree you have it right.
3. **Find the interest** under each position. "Use the queue" is a position; "I don't want to be paged at night when the email provider is slow" is an interest.
4. **Agree on criteria** that both interests care about: risk, cost, time, user impact.
5. **Get evidence** against those criteria: a small spike, a measurement, a customer conversation.
6. **Decide** with whoever owns the decision. If that is not you, make sure they have both views.
7. **Commit** to the outcome, and say so. Revisit only if new evidence arrives.

Not every story touches all seven steps. Most good ones hit restate, criteria or evidence, decide, and commit.

[The disagreement path](viz/path.md)

### Choosing the story

| Good candidate | Weak candidate |
| --- | --- |
| A design or scope disagreement with real tradeoffs on both sides | A coworker who was rude or lazy |
| One where you changed your mind, or partly did | One where you were vindicated and they were embarrassed |
| One with a peer or with your manager | One that ended with a formal complaint (save for different questions) |
| Recent enough that you remember the details | So old you only remember the feeling |

## Worked example

Fictional composites, all in one team building a checkout flow for a web shop.

### Easy

**"Tell me about a disagreement with a teammate."**

"A frontend teammate wanted to add client-side validation for card numbers. I thought server-side was enough. I asked what problem he wanted to solve, and it was that users only found out about a typo after a slow round trip. That's a real user problem, so I agreed, and we added a basic format check on the client while keeping the server as the source of truth. The disagreement took one conversation because the interest was easy to share."

Short, true-sounding, shows listening. It is light on stakes; fine as a backup story.

### Medium

**"Tell me about a time you disagreed with your manager."**

"My manager wanted to ship a saved-cards feature by the end of the quarter. I thought storing card details ourselves was a compliance risk we hadn't sized. I didn't argue it in the planning meeting; I asked for thirty minutes afterward. I said back what I understood: the goal was fewer abandoned carts from people re-typing card numbers. She agreed. Then I laid out two options: store cards ourselves, which meant a security review we hadn't scheduled, or use our payment provider's stored-card feature, which kept card data off our servers. I wrote half a page comparing the two on time, risk, and how much of the goal each delivered. She chose the provider option. It shipped two weeks later than her original date, which she accepted because the security review would have taken longer."

What makes it work: the disagreement went to criteria (time, risk, goal), there was a document, the manager made the decision, and the cost of the outcome is stated honestly.

### Hard

**"Tell me about a time you disagreed and lost."**

"Our team debated whether to split checkout into its own service. I argued against it: we were five people and I thought the operational overhead would slow us down. The tech lead wanted the split so checkout could deploy independently during sales events. We each wrote our case down against the same three criteria: deploy frequency, on-call load, and time to first release. The lead made the call to split. I said in the meeting that I'd disagreed, that I understood the reasoning, and that I'd take the deployment pipeline work since that was where I'd predicted pain. I did, and I wrote a runbook for the new service's on-call. A year later the independent deploys did help during a busy sale. On-call load did go up, and we used the runbook a lot. I think we were both partly right, and I'd still argue for writing down shared criteria first."

What makes it work: losing gracefully, taking on the work you worried about, an honest assessment later, and a reflection that is about the process rather than about being right.

## Common mistakes

| Habit | What it signals | Fix |
| --- | --- | --- |
| "I've never had a real conflict" | Low self-awareness or avoidance | Use a design or priority disagreement; everyone has those |
| The other person is a cartoon | You may not listen | State their position as they would state it |
| Arguing in front of a group first | Escalates, makes people defend positions | Describe going to them directly first |
| Story ends at "so we did it my way" | Collaboration box half-empty | Add what happened to the relationship and what you'd repeat |
| Going over someone's head as the first move | Low trust | Escalation is fine after direct conversation, and say that you told them you were escalating |
| Commit, then quietly relitigate | Unreliable | Say how you committed and what new evidence would justify reopening |

## How to talk about it

Lead with the substance of the disagreement in one line: "This was about whether to split checkout into its own service." Spend most of the time on how the disagreement moved: the restatement, the criteria, the evidence. Be generous to the other person and accurate about yourself. If you were partly wrong, say so plainly; that is often the strongest moment in the answer.

If asked "What would you have done if you couldn't agree?", describe the decision owner and how you'd make sure they had both cases in writing.

**Notebook exercise:** In your notes for this lesson, write down one real work disagreement. In two columns, write each side's *position* and then each side's *interest* underneath it. Then write the criteria you used (or should have used) to decide. Finally, write one sentence you could say to the other person today that they would agree describes their view fairly.

## Cross-links

- [Build a small bank of stories you can bend](../story-bank/lesson.md) (id: story-bank)
- [Change a decision you do not own](../influence-without-authority.md) (id: influence-without-authority)
- [What the interviewer writes down](../behavioral-scoring.md) (id: behavioral-scoring)
- [Tell a mistake so the repair is the story](../failure-stories.md) (id: failure-stories)
- [Cut scope out loud, early, to a named person](../prioritization-deadlines.md) (id: prioritization-deadlines)
