---
id: catalog-crawler
title: A polite harvest of other people's HTML
slug: catalog-crawler
kind: case-study
track: system-design
difficulty: core
estimated_minutes: 18
summary: CatalogMoth crawls vendor part pages with a per-host politeness clock, a frontier queue, and a seen-filter that is allowed to lie one way.
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
company_signal:
  - name: Google
    evidence: Candidate-reported search-infra loops and prep-site lists still treat web crawler as a classic "queues plus politeness plus seen-set" prompt.
    year: 2026
    confidence: high
  - name: Amazon
    evidence: Candidate-reported L5s use crawler/scraper variants when the team is discovery, ads, or marketplace catalog.
    year: 2026
    confidence: medium
sources_consulted:
  - Mercator / crawler-architecture lecture notes (politeness, frontier)
  - robots.txt and crawl-delay as actually observed
  - Bloom-filter false-positive talk in interview threads
updated: 2026-09-02
status: canonical
---

# A polite harvest of other people's HTML

## Snapshot

- Product: **CatalogMoth**. It fetches vendor part pages so the warehouse search index is not a week stale. v1 is GET, HTML only, no login, no JS render.
- The scarce resource is **the vendor's patience**, not your CPU. Per-host politeness is the design, not a footnote.
- Three pieces: a **Frontier** of URLs, a **Seen** filter, a **Fetcher** pool that respects `robots.txt` and a per-host clock.
- Seen is allowed false positives (skip a URL you might not have fetched). False negatives (fetch twice) are the safe lie.

## What this round is actually scoring

Queues, backpressure, and being a good citizen on other people's servers. A drawing that says "scrape with 10k workers" is a fail.

## Company signal

Candidate-reported Google/Amazon crawler prompts and prep-site frequency lists. Confidence: **high** at Google-shaped loops, **medium** elsewhere. Expect politeness, duplicate URL suppression, and "what if the sitemap lies."

## Requirements

| Functional | v1 decision |
| --- | --- |
| Seed | A sitemap plus a seed list of vendor hosts |
| Fetch | GET, follow redirects ≤ 5, cap 2 MB |
| Extract | `<a href>` in-host only for v1 |
| robots.txt | Honor `Disallow` and `Crawl-delay` |
| Freshness | Recrawl on a host budget, not a global timer |

| Non-functional | Budget |
| --- | --- |
| Hosts | 8,000 vendors |
| Pages | 40 million known |
| Fetch | 400/s global, **1 every 2s per host** unless robots says slower |
| Duplicate fetches | < 1% |
| Freshness | 48h for price-bearing pages |

## Back-of-envelope

400 fetches/s × 86_400 ≈ 35M/day. 40M pages / 35M ≈ a little over one day to sweep if the frontier is well mixed. It will not be: a few vendors are huge. Per-host 0.5/s × 8k hosts = 4k/s theoretical; you will never run that because the huge hosts saturate their own clock and the tiny ones starve the mix if you naively FIFO.

Frontier must be **sharded by host**, not by URL hash. URL hash puts one vendor on many workers and they all hammer it.

HTML 80 KB average × 400/s ≈ 32 MB/s ingest. Cheap. The index write is a [job](../job-scheduler/lesson.md) (id: job-scheduler) off the fetch path.

## Design

[crawl](viz/crawl.md)

**Frontier** is a queue per host (or a heap of host-queues keyed by `next_allowed_at`). A **Dispatcher** pops the host whose clock is due, hands one URL to a **Fetcher**.

Fetcher:

1. Resolve host ([DNS](../../../cs/dns-resolution/lesson.md) (id: dns-resolution) with its own cache; do not use a shared 1s TTL).
2. Check robots (cached per host, recache hourly).
3. GET. 429 / 503 → lengthen that host's clock, requeue the URL.
4. Extract links. Each candidate is normalized (lowercase host, strip fragment, drop session query params you know).
5. **Seen** (Bloom + a precise store for the last N days): if probably-seen, drop. Else enqueue on that host's queue.

Bloom at 40M URLs, 0.1% FP, ~10 bits/item ≈ 50 MB. Fits on each dispatcher. A false positive skips a page; a nightly precise reconciliation can rescue.

Seeds and sitemaps enter the same Frontier. Recrawl: a successful fetch writes `next_seen_at` on the card; a sweeper re-enqueues when due.

## Tradeoffs

| Choice | Gain | Cost |
| --- | --- | --- |
| Queue per host | Politeness is structural | Hot host has a long queue; need a cap and drop policy |
| URL-hash sharding | Even workers | Politeness becomes a distributed lock. Don't |
| Bloom seen | Tiny, fast | Silent skips; must accept FP |
| Render JS | Get the SPA catalog | 10–100× cost, bot farms, out of v1 |
| Global rate 400/s | Protects *you* | Does not protect a single vendor; host clock does |

## Failure modes

- Vendor 500s for an hour: clock backs off exponentially, other hosts continue.
- Bloom saturation: FP rate climbs, you skip new pages. Rebuild from the precise store.
- Sitemap bomb (10M junk URLs): per-host queue cap, drop tail, log. Do not let one vendor eat RAM.
- Fetcher crash after GET before Seen update: you may fetch twice. Safe lie. Idempotent index write.

## Follow-ups an interviewer may ask

- Login / paywall: out of v1; that is a crawler with secrets and a lawyer.
- Canonical URL across `www` and `m.`: extra normalization, not a new store.
- Priority: price pages before blog. Weighted host queues, still polite.

## Cross-links

- [At-least-once, idempotency, and the dead-letter lane](../../foundations/queues-delivery/lesson.md) (id: queues-delivery)
- [A name is not an address](../../../cs/dns-resolution/lesson.md) (id: dns-resolution)
- [Cron, ad-hoc, leases, and retries](../job-scheduler/lesson.md) (id: job-scheduler)
- [Token buckets and sliding windows at the edge](../rate-limiter/lesson.md) (id: rate-limiter)
- [IDs that sort without a coordinator](../../foundations/unique-ids/lesson.md) (id: unique-ids)
