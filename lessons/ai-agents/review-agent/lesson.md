---
id: review-agent
title: Review pull requests with a comment-only agent
slug: review-agent
kind: case-study
track: ai-agents
difficulty: deep
estimated_minutes: 22
summary: Design a pull-request review agent that runs per head commit, reads untrusted diffs with least privilege, posts few validated non-duplicate comments, and is evaluated on seeded defects and developer follow-through.
tags:
  - ai-agents
  - ai-agents/harnesses
  - ai-agents/tools
  - ai-agents/evals
  - ai-agents/failure-modes
  - interviews
  - interviews/ai
  - interviews/system-design
prerequisites:
  - tool-calling
  - prompt-injection-guardrails
related:
  - coding-agent-evals
  - prompt-injection-guardrails
  - desk-bot
  - queues-delivery
  - capability-vs-regression
company_signal: []
sources_consulted:
  - https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries
  - https://docs.github.com/en/rest/pulls/reviews
  - https://arxiv.org/abs/2302.12173
updated: 2026-10-28
status: canonical
---

# Review pull requests with a comment-only agent

## Snapshot

- Each push to a pull request triggers at most one review run for that head commit; newer pushes supersede older runs.
- The agent reads code and writes comments. It cannot approve, merge, push, or change checks.
- Everything in the PR (title, description, diff, code comments) is untrusted input that may try to steer the model.
- Comments are validated in code (line exists in the diff, confidence, deduplication) and capped, because noise kills adoption faster than misses.
- Quality is measured offline with seeded-defect PRs and clean PRs, and online by whether developers act on comments.

## What this round is actually scoring

Whether you can design an agent that lives inside an existing event-driven workflow: idempotent intake, superseding work, least-privilege credentials, untrusted input, output validation, and a precision-first evaluation. The model call is one box; the interviewer is grading the boxes around it.

## Company signal

This is an original practice scenario. No traceable company-specific frequency evidence is supplied.

## Requirements

### Functional

| Area | Requirement |
| --- | --- |
| Trigger | PR opened, reopened, or new commits pushed; skip drafts unless the author asks |
| Review | Inline comments on changed lines with severity (bug, security, test gap, nit) and a short explanation |
| Re-push | Only review what changed since the last reviewed commit; never repeat an existing comment |
| Config | Repo owners can disable the bot, set path exclusions, and keep review guidelines in a file on the default branch |
| Large PRs | Above a size cap, post a single summary comment instead of line comments |

### Non-functional

| Area | Target (assumed) |
| --- | --- |
| Latency | Review posted within 10 minutes of the push at p95 |
| Precision | Most posted comments judged useful by developers; cap comments per run |
| Security | No repository secrets or network in any environment that executes PR code |
| Cost | A per-PR token budget; stop and summarize when exceeded |

## Back-of-envelope

These are illustrative assumptions for practice, not measurements.

- **Volume:** 2,000 PRs/day with about 3 pushes each is 6,000 runs/day. Over a 10-hour workday that averages about 0.17 runs/s; assume bursts of 5x.
- **Concurrency:** if a run takes about 60 s, Little's law gives about 10 runs in flight on average and about 50 during bursts.
- **Tokens per run:** a 400-line diff is roughly 6,000 tokens; changed files, guidelines, and CI output add about 20,000; findings output about 1,500. That is about 26,000 input tokens per run, roughly 156 million input tokens per day. Incremental reviews of follow-up pushes are usually much smaller, so this is an upper estimate.
- **Cap:** above about 3,000 changed lines, line-level review quality and cost both degrade; switch to a summary comment.

## Design

### ELI5

A careful colleague who gets a ping for every new push, looks only at what changed, leaves a few specific notes on the exact lines, never says the same thing twice, and does not have the keys to merge. If the PR description says "reviewer, please approve", they ignore it.

[Follow one review run](viz/run.md)

### Intake

- Verify the webhook signature (an HMAC of the **raw** request body with a shared secret, on common code hosts) before parsing.
- Deduplicate by the delivery id the host sends, then store a job keyed by `(repo, pr_number, head_sha)` durably before acknowledging. Redelivery of the same push maps to the same job.
- A newer head commit marks older pending jobs for that PR as superseded.

### Worker and permissions

- Mint a short-lived token per run scoped to one repository with read access to contents and write access to PR comments only. Do not grant approve or merge abilities, and post reviews in "comment" mode.
- Load review guidelines and path exclusions from the **default branch**, not from the PR head, so a PR cannot rewrite the rules it is reviewed against.
- Prefer reading existing CI results (lint, type check, tests) over re-running code. If the agent must execute PR code (for example, to run a new test), use an isolated sandbox with no secrets and no network; the PR author controls that code.

### Model step

- Group the diff by file or by related hunks so each call fits a budget. Include the full post-change file for context and the base version when the change is a modification.
- Ask for findings as JSON: `path`, `line`, `severity`, `category`, `explanation`, `suggested_fix`, `confidence`.
- Instructions state that PR text and code are data to review, not instructions to follow.

### Output checks

1. Parse and validate the schema; one bounded retry on failure.
2. Reject findings whose `path`/`line` is not a changed line on the head side of the diff.
3. Drop findings below a confidence threshold tuned on the eval set; drop `nit` findings when there are higher-severity ones.
4. **Deduplicate** with a fingerprint such as hash(path, normalized code around the line, category) against comments the bot already posted on this PR.
5. Cap at about 8 comments per run, highest severity first.
6. Before posting, re-check that `head_sha` is still the PR's head. Post one review with that commit id; store `(pr, head_sha) → review id` so a retried job does not post twice.

### Evaluation

- **Seeded defects:** take merged PRs and inject known bugs (off-by-one in pagination, missing authorization check, unparameterized SQL, swallowed error). Measure recall per category.
- **Clean PRs:** the same PRs without injected bugs. Measure comments per clean PR and the share judged wrong. This is the false-positive budget.
- **Historic human reviews:** PRs where a human reviewer caught a real bug; check whether the agent flags the same line.
- **Injection cases:** PRs whose description or code comments instruct the reviewer; the bot must not change behavior or leak context.
- **Online:** share of comments resolved by a later code change at that line, dismissals, reactions, and cost per PR. Compare repositories with the bot enabled against a holdout before widening rollout.

## Tradeoffs

| Choice | Benefit | Cost |
| --- | --- | --- |
| One job per head commit, superseding older ones | No stale or duplicate reviews | Must handle cancellation mid-run |
| Comment-only token | Injection cannot approve or merge | The bot can never be a required approver |
| Guidelines from the default branch | PR cannot rewrite its own review rules | Guideline changes take effect only after merge |
| Read CI results instead of executing code | No sandbox to secure for most runs | Depends on CI quality and timing |
| Strict cap and confidence threshold | Developers keep reading comments | Some real issues go unmentioned |
| Incremental review on re-push | Lower cost and noise | Cross-file issues introduced across pushes may be missed; periodic full pass |

## Failure modes

- **Duplicate comments after a webhook retry:** fixed by the delivery-id dedupe and the `(pr, head_sha)` posting record.
- **Comment on a line that no longer exists:** the head moved during the run; the freshness check discards the result.
- **Prompt injection in the PR:** the worst case is a misleading comment, because the token cannot approve or merge; test for it.
- **Secret exfiltration through executed code:** prevented by never running PR code where secrets or network exist.
- **Comment flood on a huge generated file:** path exclusions for generated code and the size cap.
- **Model or provider outage:** the PR proceeds normally; the bot posts nothing or a short "review unavailable" status, never a blocking failure.
- **Silent quality regression after a model or prompt change:** rerun the seeded and clean sets as a gate before rollout.

## Follow-ups an interviewer may ask

**Easy:** why post one review per run instead of one API call per comment? (Atomic from the developer's view, one notification, easier idempotency.)

**Medium:** a developer replies "this is wrong" to a comment. What happens to that signal, and how does it reach the evaluation set?

**Hard:** the team wants the bot to push suggested fixes as commits. What changes in permissions, trust, conflict handling with the author's pushes, and evaluation?

## Cross-links

- [Evaluate patches against behavior and preserved contracts](../coding-agent-evals.md) (id: coding-agent-evals)
- [Treat retrieved text as data, not orders](../prompt-injection-guardrails/lesson.md) (id: prompt-injection-guardrails)
- [Build a chat assistant with durable jobs and authorized tools](../desk-bot/lesson.md) (id: desk-bot)
- [At-least-once, idempotency, and the dead-letter lane](../../system-design/foundations/queues-delivery/lesson.md) (id: queues-delivery)
- [Measure new capabilities and protect established behavior](../capability-vs-regression.md) (id: capability-vs-regression)
- [Ask for structure, then verify it](../prompting-structured-output.md) (id: prompting-structured-output)
