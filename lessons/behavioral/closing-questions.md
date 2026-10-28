---
id: closing-questions
title: Use the last five minutes to learn something real
slug: closing-questions
kind: strategy
track: behavioral
difficulty: intro
estimated_minutes: 12
summary: Prepare questions that tell you how the team actually works, match each question to the person you are talking to, and close by tying one thing you heard to one thing you did.
tags:
  - behavioral
  - behavioral/stories
  - interviews
  - interviews/behavioral
prerequisites:
  - behavioral-scoring
related:
  - behavioral-scoring
  - story-bank
  - project-deep-dive
  - interview-framework
company_signal: []
sources_consulted: []
updated: 2026-10-28
status: canonical
---

# Use the last five minutes to learn something real

## Snapshot

- Most interviews end with "What questions do you have for me?" Treat it as your chance to evaluate the job, not as a formality.
- Good questions ask about specific, recent events: "What happened the last time…" gets a more useful answer than "What's the culture like?"
- Match the question to the person: an engineer knows the codebase and on-call, a manager knows priorities and growth, a recruiter knows process and timeline.
- Close briefly: thank them, and if it fits naturally, connect one thing they said to one thing you have done.

## Why it shows up in interviews

The closing questions are rarely scored as heavily as the main part of a round, and practices differ by company and interviewer. Still, they are part of the impression you leave, and some interviewers note whether a candidate seemed curious about the work. More importantly, they are your main source of information about whether you want the job. Each interviewer sees a different slice of the team.

## Core idea

### ELI5

Ask about things that already happened, not opinions. "How do you handle on-call?" invites a polished answer. "Walk me through the last time you were paged" invites a real one.

1. **Prepare six to eight questions** before the interview day, grouped by who can answer them.
2. **Pick two per interviewer** based on their role. Do not ask everyone the same thing, unless you are checking whether answers agree.
3. **Listen and follow up once.** A follow-up shows you heard the answer.
4. **Watch the clock.** If two minutes remain, ask one question, not three.
5. **Close**: thank them by name, and if something they said connects to your experience, say so in one sentence.

### Questions by audience

| Ask an engineer | Ask a manager | Ask a recruiter |
| --- | --- | --- |
| "What did you work on last week?" | "What would a good first three months look like in this role?" | "What are the next steps, and when should I expect to hear back?" |
| "Walk me through the last time you were paged." | "What's the team's biggest problem right now?" | "Is there anything I should prepare for the next round?" |
| "How does a change get from your laptop to production?" | "How do people on this team grow to the next level?" | "Who else will I meet, and what will each conversation focus on?" |
| "What's something you'd change about the codebase if you had a month?" | "Tell me about a recent disagreement on the team and how it was settled." | "What's the timeline for a decision?" |
| "How are design decisions written down and reviewed?" | "What did the last person in this role move on to?" | — |

### Questions to skip

- Anything answered on the first page of the company's careers or about page.
- Salary and benefits in a technical round; save those for the recruiter.
- "Did I pass?" Interviewers usually cannot tell you, and the question puts them in an awkward spot.
- Questions designed to impress rather than to learn.

## Worked example

Fictional composites. The candidate is interviewing for a backend role on a team that builds an inbox for a customer-support product.

### Easy

**Interviewer: an engineer on the team. Four minutes left.**

Candidate: "What did you work on last week?"
Engineer: "Mostly a migration to move attachments to a new storage service."
Candidate: "What was the trickiest part?"
Engineer: "Old attachments with inconsistent metadata."
Candidate: "That sounds familiar. I ran into the same thing re-indexing old mail in search. Thanks for walking me through it."

One question, one follow-up, one sentence of connection. That fits in four minutes.

### Medium

**Interviewer: the hiring manager. Ten minutes left.**

Candidate: "What's the team's biggest problem right now?"
Manager: "We ship fast but incidents have gone up."
Candidate: "What's been tried so far?"
Manager: "We added a review checklist, but people skip it."
Candidate: "What would a good first three months look like for this role, given that?"

The second question builds on the first answer. The candidate learns that reliability is a real pain point, which tells them both what the job will be and which stories from their bank to emphasize in later rounds.

### Hard

**Interviewer: an engineer. The candidate is unsure about on-call load.**

Candidate: "Walk me through the last time you were paged."
Engineer: "Tuesday night, a queue backed up. I restarted a worker."
Candidate: "How often does that happen?"
Engineer: "That one? Maybe weekly."
Candidate: "Is anyone working on the root cause?"
Engineer: "It's on the backlog."

The candidate now has real information: a recurring page without a fix. They can ask the hiring manager about it in the next conversation ("I heard a queue issue pages weekly; how do you decide when to fix recurring pages?"). That is evaluation, done politely.

## Common mistakes

| Habit | What happens | Fix |
| --- | --- | --- |
| "No, I think you covered everything" | Missed chance to learn | Always have at least two prepared |
| Asking opinions: "Do you like it here?" | Polite, uninformative answer | Ask about a specific recent event |
| Same three questions for every interviewer | Overlapping answers | Match questions to role |
| Long multi-part questions | Interviewer answers one part | One question at a time |
| Overrunning the time | Interviewer has another meeting | Watch the clock; drop to one question |
| A closing speech recapping your strengths | Feels rehearsed | One sentence connecting their answer to your experience, if natural |

## How to talk about it

Ask one question, listen, ask one follow-up. If the interviewer's answer surprises you, it is fine to say "That's helpful to know." When time is up, thank them by name and stop.

If you run out of prepared questions, ask about something they mentioned earlier in the interview: "You mentioned the attachment migration; how did you decide to do it now?"

**Notebook exercise:** In your notes for this lesson, write two questions for each of three audiences: an engineer on the team, the hiring manager, and the recruiter. Each question should ask about a specific past event or a concrete next step, not an opinion. Then write one closing sentence that connects a likely answer to a story from your own story bank.

## Cross-links

- [What the interviewer writes down](./behavioral-scoring.md) (id: behavioral-scoring)
- [Build a small bank of stories you can bend](./story-bank/lesson.md) (id: story-bank)
- [Explain a system you built at three zoom levels](./project-deep-dive/lesson.md) (id: project-deep-dive)
- [Forty-five minutes is a navigation problem](../system-design/foundations/interview-framework.md) (id: interview-framework)
