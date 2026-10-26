---
id: catalog-crawler
title: Crawl a bounded catalog politely
slug: catalog-crawler
kind: case-study
track: system-design
difficulty: core
estimated_minutes: 18
summary: Coordinate a durable crawl frontier with host budgets, destination checks, deduplication, and revisits.
tags:
  - system-design
  - system-design/product-cases
  - system-design/messaging
  - interviews
  - interviews/system-design
prerequisites:
  - interview-framework
  - queues-delivery
related:
  - queues-delivery
  - dns-resolution
  - job-scheduler
  - rate-limiter
  - unique-ids
company_signal: []
sources_consulted:
  - https://www.rfc-editor.org/rfc/rfc9309.html
updated: 2026-10-26
status: canonical
---

# Crawl a bounded catalog politely

## Snapshot

- Keep durable frontier state separate from fetch workers.
- Enforce per-host admission and robots rules before requests.
- Use probabilistic filters only where false positives are acceptable.
- Recheck destination policy across DNS resolution and redirects.

## What this round is actually scoring

Whether the crawl makes progress without violating host budgets or losing important URLs silently.

## Company signal

This is an original practice scenario. No traceable company-specific frequency evidence is supplied.

## Requirements

| Area | Requirement |
| --- | --- |
| Scope | Crawl an allowlisted set of public catalog hosts |
| Politeness | At most one request every two seconds per host in this scenario |
| Content | Normalize URLs, deduplicate, and retain fetch results |
| Recovery | Retry transient failures and schedule revisits under an explicit freshness policy |

## Back-of-envelope

These are illustrative workload assumptions, not production measurements.

Assume forty million pages averaging 80 KB. That is about 3.2 TB of responses. At 400 pages/s, bandwidth is roughly 32 MB/s and a single pass takes about 27.8 hours before retries and host limits.

One host limited to a request every two seconds permits only 86,400 requests in 48 hours. A global worker count cannot make a larger single-host backlog meet that deadline.

For forty million entries and a target Bloom-filter false-positive rate of 0.1%, the usual sizing formula `m = −n ln(p)/(ln 2)²` gives about 575 million bits, or 72 MB, with roughly ten hash functions. This is an approximation under the filter's hashing assumptions.

## Design

### ELI5

The frontier chooses an eligible URL whose host is allowed to receive another request. A worker fetches it, records the result, extracts allowed links, and returns those links to the frontier.

[Follow the crawl frontier](viz/crawl.md)

### Admission and state

Store canonical URL identity, last fetch, next eligible time, status, and content fingerprint. Lease frontier entries so crashed workers can be recovered. Coordinate host budgets across workers; each worker having its own full per-host allowance would multiply the traffic.

Fetch and apply robots rules for the appropriate authority, with explicit error and caching behavior. `Crawl-delay` is an optional extension, not a directive standardized by RFC 9309. Robots rules express crawler preferences; they are not authorization to access protected content.

Resolve and validate public destination addresses, restrict schemes, and recheck every redirect. An allowlisted hostname must not become a route to loopback or private infrastructure through DNS or redirects. Cap response size and redirects under the product policy; handle robots-file redirects according to its protocol separately.

A standard insert-only Bloom filter can report false positives but no false negatives for correctly inserted entries under its assumptions. If a false positive would skip an essential page, confirm “seen” against a durable set. Revisits need timestamped durable state; a permanently positive filter is not a recrawl scheduler.

## Tradeoffs

| Choice | Benefit | Cost |
| --- | --- | --- |
| Durable exact seen set | Avoids probabilistic omissions | More storage and lookups |
| Bloom prefilter | Cheap membership rejection | Positive results may need confirmation |
| Per-host frontier queues | Enforces politeness | Many queues and uneven progress |
| Content fingerprints | Avoids reprocessing identical content | Does not replace URL/access policy |

## Failure modes

- A host sends throttling responses: lower its rate and honor applicable retry guidance.
- A worker dies after fetching: replay safely and deduplicate stored results.
- Redirects cross scope: validate the new destination before connecting.
- One large host dominates the backlog: report the host-limited completion estimate honestly.

## Follow-ups an interviewer may ask

**Easy:** calculate the maximum requests to one host in a minute under the scenario budget.

**Medium:** a Bloom filter says a new URL was seen. Explain when an exact check is required.

**Hard:** an allowed hostname resolves to a private address on a later retry. Identify where destination validation must occur.

## Cross-links

- [At-least-once, idempotency, and the dead-letter lane](../../foundations/queues-delivery/lesson.md) (id: queues-delivery)
- [A name is not an address](../../../cs/dns-resolution/lesson.md) (id: dns-resolution)
- [Schedule occurrences and recover leased work](../job-scheduler/lesson.md) (id: job-scheduler)
- [Enforce request budgets across servers](../rate-limiter/lesson.md) (id: rate-limiter)
- [Time-ordered IDs with per-worker sequences](../../foundations/unique-ids/lesson.md) (id: unique-ids)
