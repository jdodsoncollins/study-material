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
company_signal:
  - name: Amazon
    evidence: Candidate-reported backend screens still open with "what happens after you type a hostname" and expect cache, TTL, and who is authoritative, not a cloud logo.
    year: 2026
    confidence: high
sources_consulted:
  - Recursive vs authoritative resolver roles as taught in networks courses
  - TTL / negative-cache talk in SRE and backend interview threads
  - Root / TLD / zone split as described in public DNS operations writing
updated: 2026-09-02
status: canonical
---

# A name is not an address

## Snapshot

- A hostname is a **label path**. `gate.east.yard.dock` is four labels, not a server.
- Your laptop is a **stub**. It asks a **recursive resolver** (often the office DNS, or 1.1.1.1). The recursor does the tree walk and caches.
- The walk is **root → TLD → authoritative zone**. Each hop answers "who owns the next label," not the A record, until the last one.
- **TTL** is how long a cache may lie. Negative answers (NXDOMAIN) are cached too.

## Why it shows up in interviews

"What happens when you type a URL" is the warm-up that tells them whether you will invent a box named DNS or describe a cached tree. System design follow-ups (multi-region, failover, "why did clients stick to a dead IP") all hang on TTL and who is allowed to answer.

## Core idea

The recursor is a [cache](../../system-design/foundations/caching/lesson.md) (id: caching) in front of a read-only tree. You do not query the whole internet from the laptop; you query one recursor that already asked last minute.

[lookup](viz/lookup.md)

Stub asks YardDNS for `gate.east.yard.dock` A. YardDNS looks in its cache. Miss: ask a **root** for `.dock`. Root returns the **TLD** nameservers for `dock`. TLD returns the **authoritative** nameservers for `yard.dock`. Those return the A (and maybe AAAA) for `gate.east`. YardDNS stores each of those with its TTL and answers the stub.

CNAME is a detour: the recursor restarts the walk on the canonical name. MX, NS, TXT are other record types on the same tree; the walk is the same, the last question changes.

## Worked example

Resolve `gate.east.yard.dock` with an empty recursor cache.

1. Stub → YardDNS: "A for `gate.east.yard.dock`?"
2. YardDNS → root: "who owns `dock`?" Answer: TLD set `a.nic.dock`.
3. YardDNS → `a.nic.dock`: "who owns `yard.dock`?" Answer: `ns1.yard.dock` (glue A comes along so you are not circular).
4. YardDNS → `ns1.yard.dock`: "A for `gate.east.yard.dock`?" Answer: `203.0.113.17`, TTL 60s.
5. Next stub in that minute is a cache hit. After 60s, only the last hop is stale; root and TLD TTLs are usually hours.

If `ns1.yard.dock` is down and `ns2` is in the NS set, the recursor tries the other. That is failover. It is not anycast unless you also announce the same IP from two places.

## Common mistakes

| Trap | What happens | Fix |
| --- | --- | --- |
| "DNS is a database we query from the app" | You just designed a 2M QPS SPOF | Apps should not be the recursor; use the platform resolver and cache at the edge |
| TTL 1s for "instant failover" | Recursors ignore or hammer you | TTL 30–60s plus health on the **load balancer**, not on the name |
| Forgetting negative cache | A typo floods the auth servers | NXDOMAIN is cached; say that |
| One nameserver | A zone outage is a product outage | Two NS, different networks |
| CNAME at the zone apex | Some providers forbid it | A/AAAA at apex, or ALIAS/ANAME as a vendor lie |

## How to talk about it

"The stub asks a recursor. The recursor walks root, TLD, auth, and caches each hop by TTL. Failover is extra nameservers and short-enough TTLs, not a magic DNS box. If they want zero-TTL failover I will move it to anycast or a health-checked VIP."

Pair with [HTTP vs TCP](../http-and-tcp.md) (id: http-and-tcp): DNS happens *before* the TCP handshake. A stale A record means you handshake with a corpse.

## Cross-links

- [HTTP is a conversation, TCP is the pipe](../http-and-tcp.md) (id: http-and-tcp)
- [Remembering the expensive answer nearby](../../system-design/foundations/caching/lesson.md) (id: caching)
- [Spreading work without creating a new bottleneck](../../system-design/foundations/load-balancing.md) (id: load-balancing)
- [IDs that sort without a coordinator](../../system-design/foundations/unique-ids/lesson.md) (id: unique-ids)
