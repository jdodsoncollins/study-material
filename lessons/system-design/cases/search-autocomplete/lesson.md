---
id: search-autocomplete
title: Serve useful suggestions within a latency budget
slug: search-autocomplete
kind: case-study
track: system-design
difficulty: intro
estimated_minutes: 14
summary: Serve versioned prefix candidates within explicit latency, memory, freshness, and removal budgets.
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
  - load-balancing
  - rate-limiter
  - indexes
  - interview-framework
company_signal: []
sources_consulted:
  - https://www.unicode.org/reports/tr29/
updated: 2026-10-26
status: canonical
---

# Serve useful suggestions within a latency budget

## Snapshot

- Define normalization, ranking, and privacy before selecting a prefix structure.
- Separate client debounce, network delay, and server latency budgets.
- Precomputed candidates make reads cheap but delay updates and removals.
- Memory estimates must include candidates, strings, and indexing overhead.

## What this round is actually scoring

Whether the design returns relevant suggestions quickly while handling skew, stale ranking, and urgent removals.

## Company signal

This is an original practice scenario. No traceable company-specific frequency evidence is supplied.

## Requirements

| Area | Requirement |
| --- | --- |
| Query | Return up to eight suggestions for prefixes of at least two normalized characters |
| Ranking | Use a documented popularity/relevance signal and locale |
| Latency | Target a 50 ms service-plus-network response; budget debounce separately |
| Safety | Support prompt removal of disallowed or private suggestions |

## Back-of-envelope

These are illustrative workload assumptions, not production measurements.

Assume twenty million distinct query strings averaging twelve characters. An upper bound of eleven eligible prefixes per string gives 220 million prefix associations. Eight eight-byte candidate IDs per distinct prefix could alone require up to 14.08 GB before strings, scores, and structure overhead; shared prefixes lower that count.

A claimed 12 GB snapshot needs measurement and compression assumptions. Do not infer it from the query count alone. A 30 ms debounce also cannot be hidden inside an independently claimed 50 ms end-to-end keystroke budget.

## Design

### ELI5

As the user types, look up a short list of likely completions for the current prefix. Build those lists outside the request path, then rank or filter a small candidate set at read time.

[Follow prefix lookup](viz/prefix.md)

### Build and serve

Normalize queries under an explicit Unicode and locale policy. Aggregate allowed query events into a rolling ranking window, filter private or abusive terms, and build a versioned trie, finite-state structure, or prefix map. Validate a new snapshot before atomically switching readers to it.

Keep hot portions in memory if measurements justify it; a disk access is not automatically too slow, but its tail latency under load must fit the budget. Popular prefixes such as `an` can dominate traffic. Partitioning by the first two characters does not guarantee balanced shards; use measured prefix frequency and replicated serving capacity.

The client cancels or ignores obsolete responses using request sequence IDs. The service returns a snapshot/version indicator where useful. Emergency suppression is checked on the read path so an hourly snapshot does not delay an urgent removal for an hour.

Personalization must respect data access boundaries. Do not expose another user's private queries through a globally shared cache.

## Tradeoffs

| Choice | Benefit | Cost |
| --- | --- | --- |
| Precomputed top candidates | Fast bounded reads | Stale ranking and larger snapshots |
| Online ranking | Fresher context | More request-path work |
| Prefix trie | Natural prefix traversal | Pointer/structure overhead |
| Compressed immutable index | Compact serving snapshot | Rebuild and update complexity |

## Failure modes

- Old responses arrive after new ones: client sequence checks prevent stale display.
- Snapshot deployment is incomplete: retain the last validated version.
- One prefix becomes hot: replicate its serving capacity or cache its result.
- A term must disappear now: enforce a current suppression list before responding.

## Follow-ups an interviewer may ask

**Easy:** the user types `an`, then `and`; responses arrive in reverse order. Which should display?

**Medium:** ranking updates hourly but a private term appears. Explain the removal path independent of snapshot rebuild.

**Hard:** one locale's popular prefix consumes half the requests. Show why alphabetic partitioning needs an additional skew strategy.

## Cross-links

- [Remembering the expensive answer nearby](../../foundations/caching/lesson.md) (id: caching)
- [Spreading work without creating a new bottleneck](../../foundations/load-balancing.md) (id: load-balancing)
- [Enforce request budgets across servers](../rate-limiter/lesson.md) (id: rate-limiter)
- [Indexes are precomputed answers](../../../cs/indexes.md) (id: indexes)
- [Distribute versioned feature decisions](../feature-flags.md) (id: feature-flags)
- [Forty-five minutes is a navigation problem](../../foundations/interview-framework.md) (id: interview-framework)
