---
id: cdn-edge-caching
title: Serving from the edge without serving the wrong thing
slug: cdn-edge-caching
kind: concept
track: system-design
difficulty: core
estimated_minutes: 16
summary: A CDN caches responses close to users; the design work is choosing the cache key, the freshness rules, how to invalidate, and how to keep a miss storm away from the origin.
tags:
  - system-design
  - system-design/foundations
  - system-design/caching
  - cs
  - cs/networking
  - interviews
  - interviews/system-design
prerequisites:
  - caching
related:
  - caching
  - video-streaming
  - url-shortener
  - http-and-tcp
  - load-balancing
company_signal: []
sources_consulted:
  - https://www.rfc-editor.org/rfc/rfc9111.html
  - https://www.rfc-editor.org/rfc/rfc5861.html
  - https://www.rfc-editor.org/rfc/rfc9213.html
  - https://www.rfc-editor.org/rfc/rfc9110.html
updated: 2026-10-28
status: canonical
---

# Serving from the edge without serving the wrong thing

## Snapshot

- A content delivery network (CDN) is a fleet of shared HTTP caches in many locations (points of presence, or PoPs) in front of your origin.
- The cache key decides which requests share one stored response. Too coarse leaks or mixes content; too fine destroys the hit rate.
- Freshness comes from HTTP headers: `Cache-Control: max-age`, `s-maxage` for shared caches, `private`, `no-store`, and extensions such as `stale-while-revalidate`.
- Invalidation options: wait for expiry, purge specific URLs or tags through the CDN's API, or publish under a new versioned URL.
- Origin shielding routes edge misses through one designated cache tier so the origin sees one miss per object instead of one per PoP.

## Why it shows up in interviews

Static assets, video segments, images, and even some API responses go through a CDN in most real designs. Interviewers probe two edges: a personalized page served to the wrong user because the cache key ignored the session, and an origin knocked over when a popular object expires everywhere at once. Both are design decisions, and both have standard answers.

## Core idea

### ELI5

Put copies of popular files in many cities so people download from nearby. Each copy has a label (the key) and an expiry. When a city does not have a copy, it asks a bigger regional cache first, and only that cache asks your server. When you change a file, give it a new name, or tell every city to throw the old copy away.

[Follow an edge miss through the shield](viz/shield.md)

### Cache keys

A CDN typically keys on host, path, and query string (defaults vary by vendor), and HTTP caches also separate responses by any request headers the response names in `Vary`. Design choices:

- **Normalize the query.** Drop tracking parameters such as `utm_source` that do not change the response, and sort the remainder, so `?w=200&fmt=webp` and `?fmt=webp&w=200` share one entry.
- **Keep what changes the response.** If the image width or language changes the bytes, it must be in the key.
- **Be careful with `Vary`.** `Vary: Accept-Encoding` is normal. `Vary: Cookie` or `Vary: User-Agent` can fragment the cache into nearly one entry per user.
- **Never share personalized responses.** Mark them `Cache-Control: private` or `no-store`, or do not route them through the shared cache. A missing header plus a CDN rule that caches "everything under /api" is how one user's account page reaches another user.

### Freshness and revalidation

`max-age` sets how long any cache may reuse a response; `s-maxage` overrides it for shared caches like a CDN. `CDN-Cache-Control` (RFC 9213) lets you target CDN caches separately from browsers where supported. When an entry is stale, a cache can revalidate with `If-None-Match` (ETag) or `If-Modified-Since` and receive a small `304 Not Modified`. `stale-while-revalidate` (RFC 5861) lets a cache serve the stale copy briefly while fetching a fresh one in the background, which hides origin latency at the cost of short staleness.

### Invalidation

| Method | How fast | Cost |
| --- | --- | --- |
| Wait for TTL | Up to the TTL | None, but edits are slow to appear |
| Purge by URL | Usually seconds, vendor-dependent | Must know every URL and variant |
| Purge by tag / surrogate key | Same, for groups of objects | Vendor-specific feature; tag at response time |
| Versioned URLs (`app.3f9c.js`) | Immediate for new references | HTML or manifest that references them must itself refresh |

Versioned, immutable URLs with long TTLs plus a short-TTL or revalidated entry point (HTML page, playlist, manifest) is the common pattern. A purge does not reach a browser's own cache or a copy already downloaded.

### Origin shielding and request collapsing

With 40 PoPs and no shield, an object that expires everywhere can produce 40 origin requests. With a shield, edges miss into one shield cache, which makes one origin request. Many CDNs also **collapse** concurrent misses for the same key in one cache into a single upstream fetch. Neither removes the need for the origin to handle a cold start, but together they turn "N PoPs × M concurrent users" into roughly one request per object per expiry.

## Worked example

A photo app serves resized images at `/img/{photoId}?w=…&fmt=…`, from 40 PoPs.

### Easy

A request arrives as `/img/88?utm_source=mail&w=400&fmt=webp`. The CDN rule keeps only `w` and `fmt`, sorted. Key: `GET img.example.com/img/88?fmt=webp&w=400`. A second request with `utm_source=push` hits the same entry.

### Medium

An image is updated. URLs do not contain a version, TTL is one day. Without a purge, some PoPs serve the old image for up to a day. Choose: purge `/img/88*` through the CDN API, or change the app to request `/img/88?v=2&…` and include `v` in the key so the new reference is a guaranteed miss.

### Hard

A viral photo's entry expires at all 40 PoPs within the same second, and each PoP has 500 concurrent requests for it. No collapsing, no shield: up to 20,000 origin fetches. Collapsing per PoP: 40. Collapsing plus a shield: 1. The sketch computes the key and that count.

```ts
function cacheKey(method: string, host: string, url: string, keep: string[]): string {
  const [path, query = ""] = url.split("?");
  const params = query.split("&").filter(Boolean)
    .map((p) => p.split("="))
    .filter(([k]) => keep.includes(k))
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `${method} ${host}${path}` + (params.length ? "?" + params.map((p) => p.join("=")).join("&") : "");
}

function originFetches(pops: number, concurrentPerPop: number, collapse: boolean, shield: boolean): number {
  if (shield && collapse) return 1;
  if (shield) return pops * concurrentPerPop; // shield without collapsing still forwards each miss
  return collapse ? pops : pops * concurrentPerPop;
}

console.log(cacheKey("GET", "img.example.com", "/img/88?utm_source=mail&w=400&fmt=webp", ["w", "fmt"]));
console.log(originFetches(40, 500, false, false), originFetches(40, 500, true, false), originFetches(40, 500, true, true)); // 20000 40 1
```

The fetch counts are a simplified model: real CDNs vary in how they collapse and whether shields are per region.

## Common mistakes

| Trap | What happens | Fix |
| --- | --- | --- |
| Caching a personalized response publicly | One user sees another's data | `private`/`no-store`; key or bypass on auth |
| Tracking params in the key | Hit rate collapses | Allowlist the parameters that change the bytes |
| `Vary: Cookie` | One entry per user | Strip cookies for static paths; vary on a small derived header |
| Long TTL with no versioning | Edits take a day to appear | Versioned URLs, or purge by tag |
| Purge as the only takedown tool | Browser caches and downloads remain | Short TTL on sensitive entry points; accept what cannot be recalled |
| Synchronized expiry on a hot object | Origin overload | Shield, collapsing, `stale-while-revalidate` |

## How to talk about it

"Static assets and image renditions are immutable under versioned URLs with a one-year TTL. The HTML and manifests revalidate every minute. The image cache key keeps only width and format. Personalized API responses are `private` and bypass the shared cache. Misses go through a regional shield with request collapsing, so a hot object's expiry costs the origin about one fetch."

## Cross-links

- [Remembering the expensive answer nearby](../caching/lesson.md) (id: caching)
- [Publish renditions and serve adaptive playback](../../cases/video-streaming/lesson.md) (id: video-streaming)
- [Create and resolve short links safely](../../cases/url-shortener/lesson.md) (id: url-shortener)
- [HTTP is a conversation, TCP is the pipe](../../../cs/http-and-tcp.md) (id: http-and-tcp)
- [Spreading work without creating a new bottleneck](../load-balancing.md) (id: load-balancing)
