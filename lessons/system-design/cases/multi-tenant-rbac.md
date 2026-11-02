---
id: multi-tenant-rbac
title: Resolve agency, workspace, and site roles
slug: multi-tenant-rbac
kind: case-study
track: system-design
difficulty: core
estimated_minutes: 18
summary: Inherit permissions from agency to workspace to site, let a deny win, and keep a cache from serving a stale allow.
tags:
  - system-design
  - system-design/product-cases
  - system-design/consistency
  - interviews
  - interviews/system-design
prerequisites:
  - authn-authz
  - caching
related:
  - authn-authz
  - caching
  - usage-metering
  - mcp-tool-platform
  - incident-debug-with-agent
company_signal:
  - name: Figma
    evidence: https://www.figma.com/blog/
    year: 2026
    confidence: low
sources_consulted:
  - https://www.rfc-editor.org/rfc/rfc6749.html
updated: 2026-11-02
status: canonical
---

# Resolve agency, workspace, and site roles

## Snapshot

- A person acts through an agency, on a client workspace, on a single site.
- A role can be set at any level. The effective permission is computed, not stored as a pile of copied rows.
- An explicit deny beats an inherited allow.
- A cache that serves a stale allow is a security bug, not a performance bug.
- Original practice design. Numbers are illustrative.

## What this round is actually scoring

Whether you can explain one check from an HTTP request to yes or no, including inheritance, deny precedence, cache invalidation, and an audit row. Interviewers then change the tree and see if your model survives.

## Company signal

Candidates sometimes describe a permission-reachability exercise in product-design loops, including at Figma [2nd, single-source, low confidence]. This lesson does not claim that exercise's prompt. It is a multi-tenant role design you can practice on a whiteboard. Confirm the round. The Figma evidence link is the public blog index, not a description of their interview.

## Requirements

| Area | Requirement |
| --- | --- |
| Tree | Agency → workspace → site. A person has roles at one or more nodes |
| Inheritance | A workspace allow applies to its sites unless a site row says otherwise |
| Deny | An explicit deny at a node beats any allow inherited from an ancestor |
| Check | `can(person, action, site)` is pure given a snapshot of rows |
| Freshness | A role change is visible to checks within 5 seconds |
| Audit | Every deny and every sensitive allow (publish, billing, invite) writes an append-only row |
| Tenancy | A person in agency A cannot name a site id from agency B and receive an allow |

## Back-of-envelope

Illustrative.

2,000 agencies, 15 workspaces each, 8 sites each: 240,000 sites. If each site has four role bindings, that is about a million rows. This is a correctness problem, not a fan-out problem. Peak checks: 400/s globally is enough for this story. The cache is for read amplification on a hot site, not because a million rows do not fit in memory. State that. A million rows do fit. You still cache because the check walks ancestors and you do not want that walk on every static asset request. Publish and billing checks can hit the database.

A role change fan-out: one workspace has 8 sites. Invalidating those cache keys is a small write. Invalidating "everything we ever cached for this person" is the bug-shaped version.

## Design

### ELI5

The question is "may Ada publish this site?" You walk from the site up to the workspace and the agency. The first explicit row for that action wins. If that row is deny, the answer is no even if the agency says allow. If you find nothing, the answer is no.

### Model

Rows: `(principal, node, action, effect, generation)` where `effect` is allow or deny, and `node` is an agency, workspace, or site. `generation` is a counter on the workspace, bumped on every role write in that workspace.

Resolution for a site:

1. Load the chain: site, its workspace, its agency. If the site's agency id does not match the caller's agency, return deny and audit. Do not leak whether the site exists.
2. For the action, scan site, then workspace, then agency. The first matching row wins.
3. No row means deny.

Do not copy inherited allows onto the site when the parent changes. Copying looks fast and goes stale.

### Cache

Key: `(principal, site, action, workspaceGeneration)`. A bumped generation misses. A 60-second TTL is a backstop if the bump is lost, not the primary freshness story. The requirement is 5 seconds, so the bump path has to be the one you trust. Publish and billing skip the cache.

### Audit and invites

Audit append: who asked, which node, allow or deny, generation, request id. Invites are rows that are not yet bindings. An expired invite does not resolve. Expiry is a timestamp on the invite, checked in the same function as the role walk, not in a cron that might be late.

## Tradeoffs

| Choice | Benefit | Cost |
| --- | --- | --- |
| Walk ancestors at read time | One write updates every child | More reads, so you cache carefully |
| Materialize effective permissions | Fast checks | Easy to serve a stale allow |
| Deny wins over inherited allow | Matches admin expectations | You must define "explicit" |
| Generation in the cache key | A change shows up on the next read | Every writer must bump |
| Cache skipped for publish | The dangerous action is fresh | Those requests pay the walk |

## Failure modes

- The cache stores `allow` without the generation, so a new deny is invisible until TTL.
- Deny is checked only at the site, so a workspace deny does not cover a new site.
- The API returns 404 for a cross-agency id and 403 for a real site, which confirms the id exists.
- The audit log is best-effort and drops the deny you needed later.
- An invite link is a bearer token with no expiry.

## Follow-ups an interviewer may ask

**Easy:** The agency allows publish, the site denies it. What does `can` return?

**Medium:** You remove Ada from the workspace. She had a cached allow. What is the next publish result, and which key changed?

**Hard:** Two agencies merge. Which rows move, and how do you keep a stale generation from granting the old tree?

## Cross-links

- [Who you are versus what you may do](../foundations/authn-authz/lesson.md) (id: authn-authz)
- [Remembering the expensive answer nearby](../foundations/caching/lesson.md) (id: caching)
- [Bill bandwidth from events without double-counting](./usage-metering.md) (id: usage-metering)
- [Design a tool platform with scopes and an audit log](./mcp-tool-platform.md) (id: mcp-tool-platform)
- [Debug an incident with an agent on the telemetry](../../ai-agents/incident-debug-with-agent.md) (id: incident-debug-with-agent)
