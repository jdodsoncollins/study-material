---
id: blob-store
title: Camera rolls that never fit on one disk
slug: blob-store
kind: case-study
track: system-design
difficulty: core
estimated_minutes: 20
summary: RollKeep stores dock camera clips as immutable blobs; the fight is resumable upload, a tiny metadata index, and a cold path that is allowed to be slow.
tags:
  - system-design
  - system-design/product-cases
  - system-design/storage
  - interviews
  - interviews/system-design
prerequisites:
  - interview-framework
  - unique-ids
related:
  - unique-ids
  - caching
  - video-streaming
  - sharding
  - dns-resolution
company_signal:
  - name: Dropbox
    evidence: Candidate-reported loops and prep-site lists keep "design Dropbox / Google Drive" as a mid/senior storage prompt; the real score is chunking, metadata, and sync, not a filesystem drawing.
    year: 2026
    confidence: high
  - name: Amazon
    evidence: S3-shaped object-store prompts show up in L5/L6 backend loops as durability and multipart-upload probes.
    year: 2026
    confidence: high
sources_consulted:
  - Public S3 multipart / immutability talk
  - Dropbox-style metadata vs block-store split in system-design roundups
  - r/cscareerquestions storage-round writeups
updated: 2026-09-02
status: canonical
---

# Camera rolls that never fit on one disk

## Snapshot

- Product: **RollKeep**. Dock cameras upload 30s clips. A clip is a blob. v1 is upload, download by id, list a camera's day. No collaborative editing, no POSIX.
- Blobs are **immutable**. A new take is a new id. Mutation is a metadata pointer swing.
- Two stores: **ClipBytes** (the bytes) and **ClipCard** (who owns it, size, checksum, camera_id, t_start). Never query bytes by camera.
- Uploads are **chunked and resumable**. A forklift driving through Wi-Fi will drop the TCP session.

## What this round is actually scoring

Whether you split metadata from bytes, whether an upload can restart, and what "durable" means (how many disks, which region, when the client gets a 201). Drawing a folder tree is a fail.

## Company signal

Candidate-reported Dropbox/Drive prompts and Amazon object-store prompts both live here. Confidence: **high**. Expect multipart upload, consistency of the metadata pointer, and "what if a chunk is lost."

## Requirements

| Functional | v1 decision |
| --- | --- |
| Upload a clip | Resumable, 8 MiB chunks, SHA-256 of the whole |
| Download by clip_id | 302 to a signed URL, 15 min |
| List a camera's day | Metadata only, 1000 clips max |
| Delete | Tombstone the card; GC bytes later |
| Dedup | Same checksum, two cards may share bytes |

| Non-functional | Budget |
| --- | --- |
| Cameras | 40,000 |
| Clip size | 12 MB average |
| Write | 40k clips/hour peak ≈ 110/s |
| Durability | 11 nines talk, 3 replicas in-region |
| Upload p99 | Resume, not a single 12 MB POST |

## Back-of-envelope

40k cameras × 12 clips/hour × 12 MB ≈ **5.8 TB/hour** ingest at peak. 140 TB/day. Keep 14 days hot ≈ 2 PB. That is not a Postgres BYTEA.

110 clips/s × 2 chunks (12/8) ≈ 220 chunk PUTs/s. Trivial for a blob fleet. The metadata writes (one row per clip) are the thing you shard: hash(`camera_id`) so a list-by-day is one shard.

Bandwidth into a region: 5.8 TB/h ≈ 13 Gbps. Size the ingest VIPs for that, not for QPS.

## Design

[put](viz/put.md)

Client asks **CardAPI** for an upload session. CardAPI mints a [YardTicket](../../foundations/unique-ids/lesson.md) (id: unique-ids) `clip_id`, opens a session `{clip_id, chunk_size, expected_chunks}`, returns signed PUT URLs for each chunk against **ClipBytes**.

Client PUTs chunks 0..n-1. Each PUT is idempotent on `(clip_id, n, checksum)`. A retry with the same checksum is a no-op. A retry with a different checksum is a 409.

When the last chunk lands, CardAPI concatenates (logically — ClipBytes may store chunks separately and stream them in order), verifies the whole SHA, writes **ClipCard** `{clip_id, camera_id, t_start, size, sha, replica_set}`, and returns 201. Readers never see the clip until the card exists.

Download: CardAPI authz, then a signed GET for the object (or a 302 to the [CDN](../../foundations/caching/lesson.md) (id: caching) if the camera is public playback). Bytes do not flow through CardAPI.

Three replicas in three racks. A put is durable when two of three ack. The third catches up. That is the durability sentence; do not say "RAID" and sit down.

## Tradeoffs

| Choice | Gain | Cost |
| --- | --- | --- |
| Immutable blobs | Simple replication, cheap dedup | "Edit" is a new id |
| Metadata separate | List-by-day is a small query | Two systems to keep in sync |
| Client-side chunking | Survives Wi-Fi | Client complexity, abort GC |
| Shared bytes on same SHA | Saves disk | Privacy: two tenants must not learn they matched |
| Sync 2-of-3 | Fast 201 | A rack loss can still be ok; two racks is not |

## Failure modes

- Client dies at chunk 3 of 8: session expires in 24h, GC deletes orphan chunks. Card never published.
- ClipBytes node dies mid-put: retry the signed URL (or a new one for a replica). Idempotent PUTs.
- Card written, replica 3 never got bytes: repair job from replica 1/2. Reads prefer a healthy replica.
- Checksum mismatch at finalize: 422, do not publish a card, keep the session open for retry.

## Follow-ups an interviewer may ask

- Cross-region: async replicate cards and bytes; reads are sticky to the home region in v1.
- Video transcode: that is a [job](../job-scheduler/lesson.md) (id: job-scheduler) on finalize, output a second blob, pointer on the card.
- POSIX sync / block-level: out of v1. That is a different product (and a longer round).

## Cross-links

- [IDs that sort without a coordinator](../../foundations/unique-ids/lesson.md) (id: unique-ids)
- [Remembering the expensive answer nearby](../../foundations/caching/lesson.md) (id: caching)
- [Chunked playback from ingest to CDN](../video-streaming/lesson.md) (id: video-streaming)
- [Splitting a keyspace so one box is not the product](../../foundations/sharding/lesson.md) (id: sharding)
- [A name is not an address](../../../cs/dns-resolution/lesson.md) (id: dns-resolution)
