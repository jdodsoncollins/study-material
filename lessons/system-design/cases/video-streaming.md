---
id: video-streaming
title: Chunked playback from ingest to CDN
slug: video-streaming
kind: case-study
track: system-design
difficulty: core
estimated_minutes: 18
summary: Stagecast is a YouTube-shaped pipeline that ingests once, encodes a ladder, ships chunks through a CDN, and keeps the origin off the watch path.
tags:
  - system-design
  - system-design/product-cases
  - system-design/caching
  - interviews
  - interviews/system-design
prerequisites:
  - interview-framework
  - caching
  - load-balancing
related:
  - caching
  - load-balancing
  - sharding
  - interview-framework
  - job-scheduler
company_signal:
  - name: Google
    evidence: Candidate-reported loops and prep-site frequency lists treat video streaming as a Google-flavored (YouTube-shaped) prompt with encoding and CDN depth.
    year: 2026
    confidence: high
sources_consulted:
  - Design Gurus 2026 FAANG guides
  - Hello Interview question DB (video)
  - r/OfferEngineering Google-style depth writeups
updated: 2026-09-02
status: canonical
---

# Chunked playback from ingest to CDN

## Snapshot

- Product: **Stagecast**. Creators upload; viewers play adaptive chunks. v1 is VOD, not live, not comments.
- The watch path should hit a **ChunkCDN** edge, not the encoder, not the origin disk.
- Ingest writes a mezzanine blob, then **LadderEncoder** produces 360p/720p/1080p chunked files plus a manifest.
- Google-flavor depth is the ladder, cache hierarchy, and what a 2-hour 4K upload does to GPU/CPU encode capacity — not a play button.

## What this round is actually scoring

Scale honesty on *bytes*, not QPS of JSON. Can you separate upload, encode, and playback? Can you size egress so you never run watch traffic through the DC? They will ask why the first 4 seconds start before the ladder is finished.

## Company signal

Candidate-reported loops and prep-site frequency lists treat video streaming as a Google-flavored (YouTube analog) prompt. Confidence: **high**. Expect encoding, CDN, and storage-tier follow-ups, not a social graph.

## Requirements

| Functional | v1 decision |
| --- | --- |
| Upload a video | Resumable chunked PUT to **IngestMill** |
| Playback | HLS-like manifest + 4s media chunks |
| Adaptive bitrate | 360 / 720 / 1080 ladder |
| Thumbnail + preview | Generated with the ladder |
| Live, 4K, DRM | Non-goals (mention, defer) |

| Non-functional | Budget |
| --- | --- |
| Time-to-first-frame | 2 s after play, using a fast-start 360p |
| Upload resume | After a phone blip, no full restart |
| Watch availability | Origin miss is rare; CDN miss is tolerated |
| Encode SLA | 1× realtime for 720p; 1080p can lag |

## Back-of-envelope

50M DAU watching 40 minutes at an average 2.5 Mbps (mix of 360–1080).

Egress: 50e6 × 40 × 60 × 2.5e6 bits / 86400 ≈ **3.5 Tbps** average. Peak evening ×3 ≈ **10 Tbps**. This number *must* leave the building via CDN. Your origin is for misses and new titles.

Uploads: 400k hours/day ingested. Average mezzanine 8 Mbps → 400k × 3600 × 8e6 / 8 ≈ 1.4 PB/day inbound before encode. You will not keep mezzanine forever; keep it 30 days, then delete or cold-store.

Chunks: 4-second segments. A 12-minute 720p watch is 180 chunk GETs. Small objects, huge QPS at the edge. Edge cache hit rate on popular titles should be > 95%.

## Design

Upload: client splits into 8 MB blocks, checksums each, PUTs to IngestMill (object store). Completion writes a **Title** row `status=uploaded` and enqueues an encode job on [Clockyard](./job-scheduler.md) (id: job-scheduler).

LadderEncoder (workers, CPU or GPU):

1. Fast-start: produce 360p chunks + manifest as soon as the first 30s are encoded. Status becomes `playable`.
2. Rest of 360p, then 720p, then 1080p. Manifest grows. Players poll or receive a "ladder updated" hint.
3. Thumbnails, previews, loudness.

Playback: app fetches the manifest from a nearby edge. Chunk URLs are content-addressed and **immutable**, so CDN TTLs can be days. A title update publishes a *new* manifest, not a rewrite of chunk 47.

Origin shield: regional mid-tier caches in front of object storage so a global miss storm on a new title does not melt one disk pool. Same stampede idea as [caching](../foundations/caching.md) (id: caching).

## Tradeoffs

| Choice | Gain | Cost |
| --- | --- | --- |
| VOD chunks vs one giant MP4 | Adaptive bitrate, seek, CDN-friendly | Lots of small objects, manifest logic |
| Fast-start 360p | First frame before the ladder is done | Users on good networks still start ugly |
| Immutable chunks | Long CDN TTL, trivial invalidation | Edits republish the title |
| Pre-encode all rungs vs just-in-time | Predictable playback | Encode fleet cost on videos nobody watches |
| Client upload to origin vs browser→edge | Simpler auth | Far-away creators suffer; later add edge ingest |

## Failure modes

- Encode worker dies at 80%: lease expires, another worker resumes from last completed rung, not from byte zero. See [job-scheduler](./job-scheduler.md) (id: job-scheduler).
- New title goes viral before 720p exists: serve 360p, origin-shield the chunks, do not block play.
- Bad chunk checksum at the edge: evict, fetch origin, never rewrite in place.
- Upload of a huge file with a slow phone: block-level resume, expiry of abandoned mezzanine after 24h.

## Follow-ups an interviewer may ask

- Live: different ingest (RTMP/WHIP), sliding manifest, DVR window. Do not pretend VOD is live.
- Comments / likes: Fieldnote-shaped, out of this round.
- Cost: cold storage for titles with no watch in 90 days, keep 360p hot.

## Cross-links

- [Remembering the expensive answer nearby](../foundations/caching.md) (id: caching)
- [Spreading work without creating a new bottleneck](../foundations/load-balancing.md) (id: load-balancing)
- [Cron, ad-hoc, leases, and retries](./job-scheduler.md) (id: job-scheduler)
- [Splitting a keyspace so one box is not the product](../foundations/sharding.md) (id: sharding)
- [Forty-five minutes is a navigation problem](../foundations/interview-framework.md) (id: interview-framework)
- [HTTP and TCP as interview tools](../../cs/http-and-tcp.md) (id: http-and-tcp)
