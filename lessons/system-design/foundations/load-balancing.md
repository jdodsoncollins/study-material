---
id: load-balancing
title: Spreading work without creating a new bottleneck
slug: load-balancing
kind: concept
track: system-design
difficulty: intro
estimated_minutes: 12
summary: A load balancer is a traffic policy plus a health story, not a box you sprinkle in front of "the app."
tags:
  - system-design
  - system-design/foundations
  - interviews
  - interviews/system-design
prerequisites:
  - interview-framework
related:
  - caching
  - sharding
  - interview-framework
  - http-and-tcp
  - rate-limiter
company_signal:
  - name: Amazon
    evidence: Candidate-reported L4/L5 designs and prep-site frequency notes almost always expect a balancer plus a health-check story, even on junior prompts.
    year: 2026
    confidence: high
  - name: Google
    evidence: Candidate-reported loops push past "add a load balancer" into connection draining, shard-aware routing, and whether L4 or L7 is the right layer.
    year: 2026
    confidence: medium
sources_consulted:
  - Design Gurus 2026 FAANG system-design roundups
  - Hello Interview community reports on mid-level design skeletons
  - r/cscareerquestions loop writeups mentioning health checks and draining
updated: 2026-09-02
status: canonical
---

# Spreading work without creating a new bottleneck

## Snapshot

- A balancer answers: which healthy backend should take *this* request, and what happens when that backend starts dying.
- Layer-4 (TCP) is cheap and blind to URLs. Layer-7 (HTTP) can route `/redirect` to a hot cache pool and `/mint` to a write pool.
- The balancer is itself a bottleneck. You run two or more, with a virtual IP or DNS, and you drain connections before a deploy.
- Sticky sessions are a smell. Prefer storing session in [a cache](./caching.md) (id: caching) so any box can serve the next hop.

## Why it shows up in interviews

Every design that has more than one app box needs a policy for spreading work. Interviewers are not grading whether you remember a vendor name. They are grading whether you notice the new single point of failure you just drew, and whether you can pick a policy that matches the workload (stateless QPS vs keyed shard vs long websocket).

## Core idea

Name the unit of work, then pick a policy.

- **Stateless HTTP** — any healthy box. Round robin or least-connections.
- **Keyed work** — the same `clip_id` or `user_id` should hit the same cache shard. That is consistent hashing, which is routing, not "load balancing" in the round-robin sense.
- **Long-lived streams** — connections are the scarce resource. Least-connections plus draining matters more than QPS math.

Health is part of the policy. A box that fails `/healthz` twice leaves the pool. In-flight requests get a deadline, not a hang. New requests skip it. That is how you talk about deploys without inventing a platform team.

L4 vs L7 is a cost conversation. L4 (TCP/UDP) copies bytes and can handle Kettle websockets without parsing frames. L7 parses HTTP, can attach [QuotaDesk](../cases/rate-limiter.md) (id: rate-limiter) keys, and can split `/resolve` from `/mint`. You pay CPU and you now have an app-shaped failure domain at the edge. See [HTTP and TCP](../../cs/http-and-tcp.md) (id: http-and-tcp).

## Comparison

| Policy | What it optimizes | Breaks when | Interview use |
| --- | --- | --- | --- |
| Round robin | Even request counts | One request is a 30s export | Default for identical stateless boxes |
| Least connections | Live concurrency | You forget long polls look "busy" | Mixed request cost, websockets |
| Consistent hash ring | Key locality | One hot key, few virtual nodes | Cache shards, sticky *data*, not sticky boxes |
| Power of two random choices | Cheap spread, low coordination | Tiny fleets where random collides | Fast improvement over naive RR |
| L7 path routing | Different pools per URL | You turn the balancer into an app | Read pool vs write pool, `/mint` vs `/resolve` |

Worked numbers for **ClipForge** at 58k peak resolve QPS: 12 API boxes × 6k comfortable QPS = 72k headroom. Round robin is enough. The moment you add a 2 MB export endpoint, least-connections (or a separate pool) stops one box from melting.

Kettle is the other shape: 80M sockets, ~1,600 Relays. The balancer's job is connection count, draining, and not resetting a region on a config reload. Round-robin QPS math is the wrong zoom.

## Common mistakes

- Drawing one balancer box and moving on. Ask how *it* fails over.
- Sticky sessions to keep in-memory carts. That is how a deploy orphans users.
- Using the same ring for "spread CPU" and "pin a shard." Those are different jobs.
- Health-checking the TCP port but not the dependency. A box can accept sockets while its database pool is dead.
- Putting TLS termination, WAF, rate limits, and routing on one magical box, then being unable to deep-dive any of them.

## How to talk about it

"Two EdgeSplit balancers share a virtual IP. They are L7 so `/resolve` can prefer the cache-hot pool. Backends are stateless; session lives in the cache. Health is an app check that also pings the database pool. On deploy we drain: stop new connections, wait 30s, then kill. If one backend is slow, least-connections sheds it without waiting for a hard fail."

If they zoom into Google-style depth, pick *one*: connection draining, consistent-hash virtual nodes, or L4 vs L7 cost. Do not list algorithms.

## Cross-links

- [Forty-five minutes is a navigation problem](./interview-framework.md) (id: interview-framework)
- [Remembering the expensive answer nearby](./caching.md) (id: caching)
- [Splitting a keyspace so one box is not the product](./sharding.md) (id: sharding)
- [Token buckets and sliding windows at the edge](../cases/rate-limiter.md) (id: rate-limiter)
- [Minting short keys for a read-heavy lookup](../cases/url-shortener.md) (id: url-shortener)
- [HTTP and TCP as interview tools](../../cs/http-and-tcp.md) (id: http-and-tcp)
