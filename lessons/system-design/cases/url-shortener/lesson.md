---
id: url-shortener
title: Create and resolve short links safely
slug: url-shortener
kind: case-study
track: system-design
difficulty: intro
estimated_minutes: 18
summary: Create unique short-link mappings safely and resolve them under explicit expiry, replay, and cache policies.
tags:
  - system-design
  - system-design/product-cases
  - system-design/caching
  - system-design/storage
  - interviews
  - interviews/system-design
prerequisites:
  - interview-framework
  - caching
related:
  - interview-framework
  - caching
  - sharding
  - load-balancing
  - rate-limiter
  - unique-ids
company_signal: []
sources_consulted:
  - https://www.rfc-editor.org/rfc/rfc9110.html
  - https://www.rfc-editor.org/rfc/rfc9111.html
updated: 2026-10-26
status: canonical
---

# Create and resolve short links safely

## Snapshot

- Create a short code, persist its destination, and resolve it with a redirect.
- Enforce uniqueness atomically; a large keyspace does not eliminate collisions.
- Define replay behavior for creation and freshness behavior for edits or takedowns.
- Estimate read traffic separately from creation traffic.

## What this round is actually scoring

Whether the read path, key allocation, and cache policy preserve the product promises after retries and failures.

## Company signal

This is an original practice scenario. No traceable company-specific frequency evidence is supplied.

## Requirements

| Area | Requirement |
| --- | --- |
| Create | Authenticated users create a link with an optional expiry |
| Resolve | Public lookup by code; expired or removed codes do not redirect |
| Retry | The same creation operation returns the same result |
| Takedown | Agree on a revocation target before selecting cache lifetimes |

## Back-of-envelope

These are illustrative workload assumptions, not production measurements.

Assume 5 million creations and 5 billion resolves per day: about 58 writes/s and 57,900 reads/s on average. A tenfold read peak is about 579,000/s. Five years produces roughly 9.1 billion mappings. At 500 bytes each, that is about 4.6 TB before indexes and replicas.

Seven base-62 characters provide 62⁷ ≈ 3.52 trillion codes. At 9.1 billion occupied codes, a new uniform random candidate collides with probability about 0.26%. That is low per attempt but many collisions across billions of attempts. Check and retry; do not declare collisions impossible.

## Design

### ELI5

Creating a link reserves a unique label for a destination. Resolving reads the label's current mapping. Caches may hold copies, so edits must account for those copies.

[Trace creation and resolution](viz/path.md)

### Data and request paths

Store `code`, destination, owner, expiry, status, and version. Protect `code` with a unique constraint. Scope a creation idempotency key to the authenticated owner and retain the original request fingerprint and result; reject reuse with a different payload.

Generate a random candidate, then atomically insert the mapping and creation result. Retry a unique-key collision with a new candidate. If the response is lost after commit, replay the operation key to retrieve the committed result. A pre-generated pool is an alternative only if ownership and consumption are also crash-safe.

For a resolve, check a cache, then the authoritative mapping on a miss. Cache negative results briefly and carefully: a cached miss must not hide a newly created link from its creator. Apply expiration and takedown rules before redirecting.

A 302 response is not inherently uncacheable. Choose explicit HTTP cache directives and CDN invalidation behavior. A strict revocation target may require short-lived or revalidated responses and an authoritative block check. It cannot retract a destination already visited.

## Tradeoffs

| Choice | Benefit | Cost |
| --- | --- | --- |
| Random code plus unique insert | Simple distributed candidates | Collisions require retries |
| Sequential allocation | Predictable allocation | Guessable codes; allocator capacity to evaluate |
| Long redirect cache lifetime | Fewer origin reads | Slower edits and takedowns |
| Short cache lifetime | Faster refresh | More origin traffic |

## Failure modes

- A lost creation response must not create another link on replay.
- A stale fill after invalidation can restore an old destination; use a version-aware policy when freshness requires it.
- A viral code may need replicated cache capacity even if the database is sharded.
- Validate destinations and operate abuse controls; successful storage does not make a destination safe.

## Follow-ups an interviewer may ask

**Easy:** two users shorten the same URL. Should they share a code? Decide whether ownership, expiry, and analytics make these distinct mappings.

**Medium:** a candidate code already exists. Trace the atomic rejection and retry.

**Hard:** an abusive link is cached in a disconnected region. Explain what revocation promise remains possible and when that region must stop serving.

## Cross-links

- [Forty-five minutes is a navigation problem](../../foundations/interview-framework.md) (id: interview-framework)
- [Remembering the expensive answer nearby](../../foundations/caching/lesson.md) (id: caching)
- [Splitting a keyspace so one box is not the product](../../foundations/sharding/lesson.md) (id: sharding)
- [Spreading work without creating a new bottleneck](../../foundations/load-balancing.md) (id: load-balancing)
- [Enforce request budgets across servers](../rate-limiter/lesson.md) (id: rate-limiter)
- [HTTP is a conversation, TCP is the pipe](../../../cs/http-and-tcp.md) (id: http-and-tcp)
- [Time-ordered IDs with per-worker sequences](../../foundations/unique-ids/lesson.md) (id: unique-ids)
