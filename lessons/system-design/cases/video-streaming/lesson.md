---
id: video-streaming
title: Publish renditions and serve adaptive playback
slug: video-streaming
kind: case-study
track: system-design
difficulty: core
estimated_minutes: 18
summary: Publish verified video renditions and manifests, then adapt playback using network and buffer measurements.
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
  - blob-store
company_signal: []
sources_consulted:
  - https://www.rfc-editor.org/rfc/rfc8216.html
updated: 2026-10-26
status: canonical
---

# Publish renditions and serve adaptive playback

## Snapshot

- Upload, transcode, package, publish, and play are distinct stages.
- Immutable segments are easy to cache; evolving manifests need a different policy.
- Playback chooses a rendition using observed throughput and buffer state.
- Fast-start playback before encoding finishes requires a manifest that can grow.

## What this round is actually scoring

Whether interrupted processing and changing network conditions still produce coherent, authorized playback.

## Company signal

This is an original practice scenario. No traceable company-specific frequency evidence is supplied.

## Requirements

| Area | Requirement |
| --- | --- |
| Upload | Resume large source uploads and verify integrity |
| Process | Produce several aligned bitrate renditions |
| Play | Adaptive playback with bounded startup delay and rebuffering targets |
| Publish | Expose only verified segments and a consistent manifest |

## Back-of-envelope

These are illustrative workload assumptions, not production measurements.

Assume fifty million viewers watch forty minutes/day at an average 2.5 Mb/s. Average delivery bandwidth is about 3.47 Tb/s; peaks and regional skew add capacity requirements.

Assume 400,000 uploaded video-hours/day at 8 Mb/s. Source bytes total about 1.44 PB/day before generated renditions and replicas. These estimates motivate CDN delivery and a measured encoding-capacity plan; they do not determine a specific fleet size.

## Design

### ELI5

Store the original, create several versions of each segment, and publish a list the player follows. The player can switch quality at aligned boundaries as network conditions change.

[Follow adaptive playback](viz/abr.md)

### Processing and playback

Create a versioned upload and a durable processing job. Workers produce renditions in isolated output namespaces, verify them, and publish references atomically. Retries should reuse the logical job identity while avoiding partially overwritten outputs.

Align segment boundaries and timestamps across renditions. Publish a master playlist describing available variants and media playlists describing verified segments. Use immutable versioned segment URLs with long cache lifetimes, while manifests that change use short freshness or revalidation policies.

For a completed HLS VOD asset, the playlist is complete. For playback while encoding continues, an EVENT-style playlist can append segments and omit `EXT-X-ENDLIST` until complete; declaring an immutable VOD playlist while continuing to append is inconsistent with that contract. See [RFC 8216](https://www.rfc-editor.org/rfc/rfc8216.html).

The player estimates throughput and maintains a buffer, selecting a lower rendition when necessary. An encoder running at the viewer's playback rate does not guarantee a stall-free stream: variability can consume a small initial head start. Measure sustained encoding progress and reserve enough playable content before starting.

Authorize playback and define how signed URL lifetimes interact with takedowns. Content deletion cannot recall bytes already downloaded.

## Tradeoffs

| Choice | Benefit | Cost |
| --- | --- | --- |
| More renditions | Better fit to networks/devices | Encoding and storage cost |
| Shorter segments | Faster adaptation and lower live delay | More requests and packaging overhead |
| Complete-before-publish | Simple playback contract | Longer upload-to-play delay |
| Growing playlist | Earlier playback | Manifest refresh and encoder-progress risk |

## Failure modes

- Transcoding retries produce mixed versions: publish only one verified output version.
- A segment appears in a playlist before it is available: order publication after durable segment storage.
- A CDN serves a stale growing playlist: use the manifest's distinct freshness policy.
- Bandwidth drops: the player adapts using buffer state rather than persisting with an unsustainable bitrate.

## Follow-ups an interviewer may ask

**Easy:** a segment is missing from one rendition. Explain why verification must happen before publication.

**Medium:** a playlist grows while clients play. Choose its playlist type, refresh policy, and completion marker.

**Hard:** encoding proceeds at roughly real time but pauses for twenty seconds. Explain how startup buffer and admission policy affect playback stalls.

## Cross-links

- [Remembering the expensive answer nearby](../../foundations/caching/lesson.md) (id: caching)
- [Spreading work without creating a new bottleneck](../../foundations/load-balancing.md) (id: load-balancing)
- [Schedule occurrences and recover leased work](../job-scheduler/lesson.md) (id: job-scheduler)
- [Splitting a keyspace so one box is not the product](../../foundations/sharding/lesson.md) (id: sharding)
- [Forty-five minutes is a navigation problem](../../foundations/interview-framework.md) (id: interview-framework)
- [HTTP is a conversation, TCP is the pipe](../../../cs/http-and-tcp.md) (id: http-and-tcp)
- [Upload large objects with resumable parts](../blob-store/lesson.md) (id: blob-store)
