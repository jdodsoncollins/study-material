---
id: feature-flags
title: Shipping dark, flipping in production
slug: feature-flags
kind: case-study
track: system-design
difficulty: intro
estimated_minutes: 14
summary: Switchyard evaluates flags from a local snapshot so a config change is a versioned publish, not a 2M QPS dependency.
tags:
  - system-design
  - system-design/product-cases
  - system-design/caching
  - interviews
  - interviews/system-design
prerequisites:
  - interview-framework
  - caching
related:
  - caching
  - rate-limiter
  - interview-framework
  - job-scheduler
  - news-feed
company_signal:
  - name: Stripe
    evidence: Candidate-reported loops treat feature-flag / config-evaluation systems as a recurring mid-level prompt.
    year: 2026
    confidence: medium
  - name: Meta
    evidence: Prep-site frequency and candidate reports on feed/product ramps mention percentage rollouts and kill switches as follow-ups.
    year: 2026
    confidence: medium
sources_consulted:
  - Stripe candidate-report roundups (feature flags)
  - Design Gurus 2026 FAANG guides
  - r/cscareerquestions threads on ramping and kill switches
updated: 2026-09-02
status: canonical
---

# Shipping dark, flipping in production

## Snapshot

- Product: **Switchyard**. Services ask "is `quiet_lane_v2` on for this user?" and get a boolean (or a small payload) in microseconds.
- The serving path is a **local snapshot**, not a database round trip. 2M evaluations/s cannot call a config API.
- A flag is a versioned rule: percentage, allow-list, segment, or kill switch. Publish is transactional. Rollback is "restore last snapshot."
- Consistency is **bounded stale** (a few seconds), except kill switches which push immediately. That is a [CAP](../foundations/cap-and-consistency.md) (id: cap-and-consistency) budget, not a personality.

## What this round is actually scoring

Can you keep evaluation off the critical dependency list, and can you ramp 1% → 10% → 100% without splitting a user's session every request? Interviewers will ask about stampede when everyone fetches a new snapshot, and about a bad flag taking production down.

## Company signal

Candidate-reported Stripe loops, plus prep-site frequency on ramps / kill switches at product companies (Meta-shaped feed ramps). Confidence: **medium**. Label it candidate-reported / prep-site frequency.

## Requirements

| Functional | v1 decision |
| --- | --- |
| Boolean + multivariate flags | Payload ≤ 2 KB |
| Targeting | User id hash, percent, allow-list, employee override |
| Kill switch | Forces off, bypasses percent |
| Audit who flipped | Immutable change log |
| Experiment assignment | Sticky per user for the flag's life |

| Non-functional | Budget |
| --- | --- |
| Eval p99 in-process | < 1 ms |
| Snapshot freshness | 30s default, 2s for kill |
| Eval QPS | 2M (every Fieldnote request asks 5 flags) |
| Publish p99 | 2 s to first box, 10 s to fleet |
| Fail | Last-known snapshot, never empty-deny the app |

## Back-of-envelope

2M evals/s. If each eval were a 1 ms RPC, you would need a heroic central cluster and you would still add a failure domain. In-process: 5 flags × a hash + a percent compare is nanoseconds. Snapshot size: 5k flags × 1 KB rules ≈ 5 MB. Trivial to mmap.

Publish: 5k boxes pulling 5 MB every 30s ≈ 830 MB/s of origin if naive. Use a CDN or an internal object store plus **version gossip** ("latest is `v1842`") so boxes download only on change. Same origin-shield idea as [Stagecast](./video-streaming.md) (id: video-streaming).

## Design

**Control plane**: authors edit a flag, Switchyard writes a new immutable snapshot to object storage, records `vN` in a tiny metadata table, and notifies **Relays**.

**Data plane**: each app embeds a SDK. SDK holds snapshot `vN` in memory. Evaluation: hash(`flag_id:user_id`) → bucket 0–9999; compare to percent; apply allow-list and kill. Sticky because the hash is stable.

Kill switch: metadata watch (long-poll or websocket) so `vN+1` is applied in ~2s. Regular ramps ride the 30s poll.

[Clockyard](./job-scheduler.md) (id: job-scheduler) can time a ramp (`10% at 16:00`) as a job that publishes a new snapshot — do not put a clock inside every SDK.

Consistency for users: a user may see old then new within the freshness window. For money or legal copy, the *product* should not hide behind a flag that is still ramping; use a server-authoritative check on that path.

## Tradeoffs

| Choice | Gain | Cost |
| --- | --- | --- |
| Local snapshot vs RPC eval | Survives Switchyard outages | Seconds of skew across boxes |
| Hash stickiness vs random per request | Stable UX, honest experiments | A user is stuck on a bad variant until you change the salt |
| One snapshot for all flags vs per-flag files | Atomic multi-flag changes | Tiny flags pay for a 5 MB download |
| Kill via push vs waiting for poll | Incidents end faster | Another moving part |

## Failure modes

- Bad snapshot (rule that throws): SDK keeps `vN-1`, marks `vN` poison, alerts. Canary a slice of boxes first.
- Stampede on publish: jitter the download 0–5s, or push the file through a CDN. See [caching](../foundations/caching.md) (id: caching).
- Hash salt change mid-experiment: everyone reshuffles; never do this silently.
- Flag default `false` with fail-closed SDK: a missing snapshot turns the app off. Default is **fail-open to last-known**.

## Follow-ups an interviewer may ask

- Entitlements vs flags: paid features belong in Till's customer record, not a 30s-stale percent.
- Per-request overrides for support: a header, audited, never in the public SDK.
- Fieldnote ranking flags: ramp by user, not by post, so a session is coherent.

## Cross-links

- [Remembering the expensive answer nearby](../foundations/caching.md) (id: caching)
- [Token buckets and sliding windows at the edge](./rate-limiter.md) (id: rate-limiter)
- [Cron, ad-hoc, leases, and retries](./job-scheduler.md) (id: job-scheduler)
- [Hybrid fanout when some authors are stadiums](./news-feed/lesson.md) (id: news-feed)
- [Forty-five minutes is a navigation problem](../foundations/interview-framework.md) (id: interview-framework)
- [CAP as a conversation, not a religion](../foundations/cap-and-consistency.md) (id: cap-and-consistency)
