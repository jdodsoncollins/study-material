---
id: ai-policy-bands
title: Three AI policy bands and how to ask which one applies
slug: ai-policy-bands
kind: strategy
track: ai-agents
difficulty: intro
estimated_minutes: 18
summary: Know which rounds allow AI, which tools, and what gets graded so you prepare in the right mode.
tags:
  - ai-agents
  - interviews
  - interviews/ai
prerequisites:
  - interview-ai-round
related:
  - ai-interview-timeline-2026
  - interview-integrity
  - ai-pairing-interview
company_signal: []
sources_consulted:
  - https://coderpad.io/survey-reports/coderpad-state-of-tech-hiring-2026/
  - https://karat.com/engineering-interview-trends-2026/
  - https://www.metacareers.com/hiring-process/
  - https://www.canva.dev/blog/engineering/yes-you-can-use-ai-in-our-interviews/
  - https://www.anthropic.com/candidate-ai-guidance
  - https://workos.com/blog/designing-the-ai-proof-interview
  - https://v0-eng-prep-guide.vercel.app/
  - https://copilotinterview.com/blog/companies-that-allow-ai-in-interviews
  - https://www.linkedin.com/posts/eugenetherecruiter_in-part-1-i-talked-about-why-keyword-stuffing-activity-7420386143898181634-hsr5
updated: 2026-11-02
status: canonical
---

# Three AI policy bands and how to ask which one applies

## Snapshot

- The industry is split roughly evenly: one-third ban AI, one-third allow it with constraints, one-third vary by round
- Three bands: **No AI**, **AI optional (judgment graded)**, **AI expected or mandatory**
- Policies often differ by round, not by company
- The first prep skill is knowing which mode a given round is in
- Always ask your recruiter: which rounds allow AI, which tools, whether your screen is recorded, and if the AI transcript is reviewed

## Why it shows up in interviews

CoderPad's 2026 survey found 34% of companies ban AI, 29% allow it with constraints, 17% allow it broadly, and 20% decide case by case. Karat reported 62% still prohibit AI in technical interviews. These numbers don't contradict each other—they sampled different populations. The takeaway: you cannot assume. Prep must cover both AI-free fluency and directing an AI well.

## Core idea

### The three bands

Think of interview AI policy as three distinct modes. A company may use different bands for different rounds in the same loop.

**Band 1: No AI**

What it tests: raw fluency, explaining your own code, correctness under pressure.

Examples:
- Stripe forbids AI in all rounds but allows Google and Stack Overflow
- Amazon's live loop forbids GenAI unless explicitly permitted (though its online assessment became AI-assisted in January 2026)
- Anthropic's live interviews and take-homes unless indicated otherwise
- Cursor's first screens (no AI other than autocomplete)
- 1Password's live rounds

How to prep:
- Practice TypeScript or Python standard-library recall without AI or autocomplete
- Write tests by hand
- Debug from stack traces and browser console alone
- Use only allowed resources (Google, Stack Overflow, MDN) and narrate when you do: "I'm checking MDN for the Array.prototype.toSorted signature"

**Band 2: AI optional, judgment graded**

What it tests: engineering with AI as an accelerator; ownership of the result.

Examples:
- WorkOS: "favorite tools totally fine" but "leaning on AI to do all the heavy lifting won't get you far"
- Vercel fullstack round: any tools on your own machine, AI use visible on screen share
- Canva: AI "insisted" on; replaces the CS fundamentals screen
- Most startups

How to prep:
- Delegate boilerplate, unfamiliar APIs, and scaffolding aggressively
- Keep the data model, interfaces, and invariants under your own control
- Test every change and catch at least one AI mistake
- Narrate your intent before prompting: "I'm starting in planning mode because I don't like to ask AI to generate a bunch of code right away"

**Band 3: AI expected or mandatory**

What it tests: directing, verifying, and correcting AI inside real code.

Examples:
- Meta AI-enabled round: candidates are "expected to use" the provided CoderPad assistant (Claude, GPT, Gemini, or Llama); outside tools aren't allowed
- Google code comprehension: Gemini provided in a 200–500 line codebase
- Amazon online assessment (as of January 2026): includes an AI-assisted repo task fixing failing tests across controller, service, and repository layers
- Coinbase repo-based rounds
- Shopify: "If they don't use a copilot, they usually get creamed"
- Warp: exceptional candidates "write fewer prompts, not more… find the edge cases before executing"

How to prep:
- Read the code first (5–8 minutes mapping files, tests, and data model) before prompting
- Use the AI for narrow, checkable tasks: "explain this function", "list the edge cases this misses", "write a test for X"
- Run tests after every change
- Measure before optimizing in a performance phase
- Expect the assistant to be wrong sometimes; Meta's assistant is reportedly "nerfed" deliberately

### When AI is "allowed," what does that mean?

Almost always it means:
- The provided tool only, not your own setup
- In the named round, not every round
- With disclosure required (Datadog, GitLab, Deliveroo)

Your AI transcript is increasingly graded:
- HackerRank's MCP shows reviewers the candidate's AI chat history
- Codility's "Cody" gives the hiring team the full transcript
- Karat NextGen allows only its integrated assistant
- Hiring managers describe the agent transcript as "the most important artifact" of a take-home

Non-disclosure can disqualify you (Datadog's guidelines state this explicitly as of May 2026).

## Recruiter questions to ask

Before any loop, get clarity per round. Do not assume the policy is the same across all stages. Ask:

1. **Which rounds allow AI?** (e.g., "Is AI permitted in the coding screen and the system design round, or only in the take-home?")
2. **Which tools?** ("Is the AI assistant provided in the platform, or can I use my own setup?")
3. **What's graded?** ("Will my AI transcript or screen recording be reviewed?")
4. **Can I use Google or documentation?** (Stripe explicitly allows these; others may not)
5. **Is there an in-person round?** (Some companies reintroduced in-person interviews in 2026 to reduce cheating)

## Company reference table (late 2026)

This table shows reported or published policies as of November 2026. Policies change frequently—confirm with your recruiter.

| Company | Policy band | Format notes | Confidence |
|---|---|---|---|
| **Stripe** | No AI (all rounds) | Google and Stack Overflow allowed; Integration and Bug Squash rounds | High [P] |
| **Amazon** | No AI (live loop); AI-assisted (OA) | OA has ~40-min DSA (no AI) + ~60-min repo task with AI assistant; live loop forbids GenAI unless explicitly permitted | High [P, R] |
| **Anthropic** | No AI (unless indicated) | Live interviews and take-homes done without Claude unless stated otherwise; performance take-home is AI-allowed | High [P] |
| **Cursor** | No AI (screens) | No AI other than autocomplete in phone screens; 2-day in-person onsite with the team | Med [R] |
| **1Password** | No AI (live rounds) | 48-hour take-home + deep dive; live rounds forbid AI | Med [2nd, candidate-reported] |
| **Meta** | AI expected (one round) | AI-enabled CoderPad round with provided assistant; candidate chooses model; three-phase (bug, feature, optimize); other rounds unchanged | High [P] |
| **Google** | AI expected (one round) | Code comprehension pilot with Gemini; AI fluency required for all SWE jobs; DSA rounds remain; at least one in-person round | High [R] |
| **Coinbase** | AI-assisted | Repo-based debugging and code-review tasks with an AI-fluency rubric | Med [S, 2nd] |
| **Shopify** | AI expected | Two bring-your-own-IDE rounds; empty repo or README only; evolving LLD problem; push a branch at the end | High [R, 2nd] |
| **Canva** | AI expected | AI "insisted" on; Plan → develop → discuss; FE variant: "Build Canva with AI" | High [P] |
| **Warp** | AI expected | Exceptional candidates "write fewer prompts, not more" | Med [P, blog post] |
| **Vercel** | AI optional (fullstack) | Any tools on your own machine; screen share shows AI use; Reverse Deep Dive, System Design, DSA in rustpad, Deep Dive, Values rounds | High [P] |
| **WorkOS** | AI optional | ~50-min multi-stage backend problem; "favorite tools totally fine" but heavy delegation penalized | High [P] |
| **Canva** (already listed above) | AI expected | (duplicate removed) | - |
| **Datadog** | AI expected (announced rounds only) | AI expected in pre-announced AI-assisted coding interviews only; forbidden in all other rounds; non-disclosure can disqualify | High [P] |
| **OpenAI** | Varies by round | "Some formats intentionally allow them, while others are designed to assess your independent problem-solving without AI tools"; prep materials indicate which | High [P] |
| **Sierra** | AI expected (Build) | Algorithms and coding rounds removed; Plan (with interviewer) → Build (2h solo, any AI) → Review (demo, data model, path to production, AI use) | High [P] |
| **Zapier** | AI expected (skills tests) | AI fluency is a hiring criterion at every stage; skills tests watch prompting, push-back, and adapting | High [P] |
| **Replit** | AI expected (SRE) | Sandbox VM + real GCP + Terraform + Claude Code or Codex | High [P] |
| **Rootly** | AI allowed (take-home) | Transcript + Loom walkthrough graded | High [P] |
| **Microsoft** | Mixed | Reported: DSA round, then an LLD + AI round (e.g., notification system; prompting and evaluating AI output) | Low [2nd] |
| **Figma** | Unknown | FigJam system design; permission-reachability problem; candidates mention an AI-assisted round of unclear scope | Low [2nd] |
| **Polar** | AI expected | Review an AI-drafted PR in a fork of their OSS repo | Med [2nd] |
| **Ashby** | Unknown (eng rounds) | Pairing in the real codebase (interviewer types, you direct); launches candidate-facing AI Interviewer product Nov 17, 2026 | Med [2nd] |
| **ElevenLabs** | Unknown | Async CoderPad screen; React round; product round | Low [2nd] |
| **Vanta** | Unknown | Reported AI technical deep dive; practical coding | Low [2nd] |
| **Descript** | Unknown | Job posting contains AI-trap text (instructions meant to catch AI-written applications) | Low [2nd] |
| **Substack** | Unknown | React chart extension, SQL, newsletter fan-out design | Low [2nd] |
| **Mux** | Unknown | Elixir/Go stack | Low [2nd] |
| **Render** | Unknown | Practical coding (often Go/SQL), system design, behavioral; UX-eng track has optional take-home (intro + 4h + showcase); 2021 UX-eng post allowed "any online resources" | Low [P 2021 blog, not confirmed current] |
| **GC AI** | Unknown | Reported prompting exercise on their platform | Low [S, single candidate] |
| **WorkOS** (already listed above) | (duplicate removed) | - | - |

### Legend

- **[P]** Primary: the company's own page or post
- **[R]** Reported: journalism citing internal documents or named sources (e.g., Business Insider, Pragmatic Engineer)
- **[2nd]** Secondhand: candidate reports, prep-site writeups, or X posts from people who don't work at the company
- **[S]** Search synthesis: couldn't open the primary page
- **Confidence:** High (many independent reports or primary source), Med (repeated in prep sites + some reports), Low (single thread or rumor)

## Worked example

### Easy

A recruiter says "AI is allowed." Ask: "Which rounds? Is the assistant provided in the platform, or can I use my own setup? Will my screen be recorded?" The answer might be: "The take-home allows your own tools and we review the transcript. The live rounds forbid AI."

### Medium

You're preparing for a Shopify-style empty-repo round. You know AI is expected. Practice 45-minute greenfield builds with your own IDE and AI tools, and rehearse two conversations at once: say your intent to the interviewer → prompt → read the diff aloud → run → confirm.

### Hard

A Meta loop includes an AI-enabled CoderPad round. You know the assistant is provided, can read files but not edit them, and is sometimes "nerfed." Practice on purpose-built repos: spend the first 5–8 minutes mapping files and tests before asking the AI anything, and use it for narrow tasks like "list the edge cases this misses."

## Common mistakes

- Assuming "AI-allowed" means "use any tool" when it means "use the provided assistant only"
- Using outside tools in a provided-assistant round because you didn't confirm
- Not disclosing AI use in a take-home when the guidelines require it
- Treating a company's policy as applying to all rounds when it varies by stage
- Skipping no-AI practice because most companies allow it (about 60% of engineering leaders still prohibit it in at least some rounds)

## How to talk about it

"Before any loop, I confirm the AI policy per round with the recruiter: which rounds allow AI, which tools, whether my screen is recorded, and if the AI transcript is reviewed. I prep in both modes: no-AI fluency for Stripe-style rounds and AI-assisted for Meta-style rounds. The first prep skill is knowing which mode a given round is in."

## Cross-links

- [How AI interview policies changed from 2025 through 2026](./ai-interview-timeline-2026.md) (id: ai-interview-timeline-2026)
- [Practice AI-assisted coding and evaluation discussions](./interview-ai-round.md) (id: interview-ai-round)
- [What proctoring flags and how to stay clean](./interview-integrity.md) (id: interview-integrity)
- [Practice pairing with an AI assistant on a known problem](./ai-pairing-interview.md) (id: ai-pairing-interview)
