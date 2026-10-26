---
id: dns-resolution
title: A name is not an address
slug: dns-resolution
kind: concept
track: cs
difficulty: intro
estimated_minutes: 14
summary: DNS is a cached tree walk from a stub to an authoritative name, not a magic lookup of a hostname.
tags:
  - cs
  - cs/networking
  - interviews
  - interviews/system-design
prerequisites:
  - http-and-tcp
related:
  - http-and-tcp
  - caching
  - load-balancing
  - unique-ids
company_signal: []
sources_consulted: []
updated: 2026-10-26
status: canonical
---

# A name is not an address

## Snapshot

- A hostname is a **label path**. `www.shop.example.com` is four labels, not a server.
- Your laptop is a **stub**. It asks a **recursive resolver** (often the office DNS, or 1.1.1.1). The recursor does the tree walk and caches.
- The walk is **root → TLD → authoritative zone**. Referrals follow delegated zones, not necessarily every label. Cached data or an authoritative answer can shorten the walk.
- **TTL** limits how long a cached DNS record may normally be reused without refreshing. Negative answers (NXDOMAIN) are cached too.

## Why it shows up in interviews

"What happens when you type a URL" is the warm-up that tells them whether you will invent a box named DNS or describe a cached tree. System design follow-ups (multi-region, failover, "why did clients stick to a dead IP") all hang on TTL and who is allowed to answer.

## Core idea

### ELI5

The recursor is a [Remembering the expensive answer nearby](../../system-design/foundations/caching/lesson.md) (id: caching) in front of a read-only tree. You do not query the whole internet from the laptop; you query one recursor that already asked last minute.

[lookup](viz/lookup.md)

Stub asks the office resolver for `www.shop.example.com` A. The resolver looks in its cache. Miss: ask a **root** for `.com`. Root returns the **TLD** nameservers for `com`. TLD returns the **authoritative** nameservers for `example.com`. For this simplified example, that zone directly answers the A query for `www.shop.example.com`. An AAAA lookup is a separate query, and another delegation or CNAME could add steps. The resolver stores each of those with its TTL and answers the stub.

CNAME is a detour: the recursor restarts the walk on the canonical name. MX, NS, TXT are other record types on the same tree; the walk is the same, the last question changes.

## Worked example

Resolve `www.shop.example.com` with an empty recursor cache.

1. Stub → resolver: "A for `www.shop.example.com`?"
2. Resolver → root: "who owns `com`?" Answer: TLD set `a.gtld-servers.net`.
3. Resolver → TLD: "who owns `example.com`?" Answer: `ns1.example.com` (glue A comes along so you are not circular).
4. Resolver → `ns1.example.com`: "A for `www.shop.example.com`?" Answer: `203.0.113.17`, TTL 60s.
5. Next stub in that minute is a cache hit. After 60s, that answer expires. Delegation records may still be cached; each record has its own remaining TTL.

If `ns1.example.com` is down and `ns2` is in the NS set, the recursor tries the other. That is failover. It is not anycast unless you also announce the same IP from two places.

| Record or cache result | Role | Check |
| --- | --- | --- |
| A / AAAA | IPv4 / IPv6 address | Query type and remaining TTL |
| CNAME | Alias to another name | Follow the target; avoid loops |
| NXDOMAIN | Name does not exist | Negative-cache lifetime |

**Try it:** the A record expired but the authoritative nameserver delegation is still cached. Does the resolver have to start at the root? No; it can reuse valid cached delegation data.

## Common mistakes

| Trap | What happens | Fix |
| --- | --- | --- |
| "DNS is a database we query from the app" | You just designed a 2M QPS SPOF | Apps should not be the recursor; use the platform resolver and cache at the edge |
| TTL 1s for "instant failover" | Recursors ignore or hammer you | Choose TTL from failover and query-load needs; account for caches and use health-checked routing where appropriate |
| Forgetting negative cache | A typo floods the auth servers | NXDOMAIN is cached; say that |
| One nameserver | A zone outage is a product outage | Two NS, different networks |
| CNAME at the zone apex | A CNAME cannot coexist with the apex SOA and NS records | Use A/AAAA or a provider’s documented flattening mechanism |

## How to talk about it

"The stub asks a recursor. The recursor walks root, TLD, auth, and caches each hop by TTL. Failover is extra nameservers and short-enough TTLs, not a magic DNS box. If they want zero-TTL failover I will move it to anycast or a health-checked VIP."

Pair with [HTTP is a conversation, TCP is the pipe](../http-and-tcp.md) (id: http-and-tcp): DNS happens *before* the TCP handshake. A stale address can send a connection attempt to a server that no longer serves the site.

## Cross-links

- [HTTP is a conversation, TCP is the pipe](../http-and-tcp.md) (id: http-and-tcp)
- [Remembering the expensive answer nearby](../../system-design/foundations/caching/lesson.md) (id: caching)
- [Spreading work without creating a new bottleneck](../../system-design/foundations/load-balancing.md) (id: load-balancing)
- [Time-ordered IDs with per-worker sequences](../../system-design/foundations/unique-ids/lesson.md) (id: unique-ids)
