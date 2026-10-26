---
id: blob-store
title: Upload large objects with resumable parts
slug: blob-store
kind: case-study
track: system-design
difficulty: core
estimated_minutes: 20
summary: Design versioned multipart uploads, verified completion, durability, and explicit read-revocation behavior.
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
company_signal: []
sources_consulted:
  - https://www.rfc-editor.org/rfc/rfc9110.html
updated: 2026-10-26
status: canonical
---

# Upload large objects with resumable parts

## Snapshot

- Separate upload-session metadata from immutable object bytes.
- Verify parts before publishing a complete manifest.
- A durability claim needs a failure model and a repair process.
- Deleting metadata and revoking access to cached or signed URLs are different operations.

## What this round is actually scoring

Whether interrupted uploads, duplicate parts, and storage failures leave an unambiguous complete object.

## Company signal

This is an original practice scenario. No traceable company-specific frequency evidence is supplied.

## Requirements

| Area | Requirement |
| --- | --- |
| Upload | Resumable multipart clips with checksums |
| Read | Authorized range reads from a completed version |
| Publish | Incomplete uploads remain invisible as completed objects |
| Delete | Define deletion and access-revocation behavior, including existing URLs |

## Back-of-envelope

These are illustrative workload assumptions, not production measurements.

Assume 40,000 cameras each upload twelve 12 MB clips per hour. That is 480,000 clips/hour, about 133 clips/s, and 5.76 TB/hour using decimal units. Two parts per clip mean about 267 part uploads/s. Raw ingress is about 12.8 Gb/s.

Fourteen days retain about 1.94 PB of raw clips, before replication or erasure-coding overhead. A durability target such as “eleven nines” cannot be derived merely from using three replicas.

## Design

### ELI5

Create an upload session, place verified pieces in storage, and publish one manifest naming the complete set. Readers use that manifest; they never guess whether a half-uploaded object is finished.

[Follow a multipart upload](viz/put.md)

### Data and completion

Give each upload a tenant, object ID, immutable version, expected length, part plan, expiry, and authorized owner. Bind a part number to its expected byte range and checksum. Replaying the same part with the same content is safe; conflicting content is rejected or explicitly replaces that part under a versioned protocol.

On completion, verify every required part, total length, checksums, and the chosen storage durability condition. Atomically publish the manifest in the metadata store. A completion retry returns the same committed version. Orphaned parts are garbage-collected only after a grace period that respects in-flight sessions.

Place replicas across the failure domains the promise covers, or choose an erasure code with a stated repair budget. Acknowledging two of three replicas tolerates some failures only under the specified placement, consistency, and recovery assumptions; it is not a universal durability percentage.

Authorize reads by tenant and object version. A fifteen-minute signed URL can remain usable after the metadata entry is deleted unless the serving layer supports revocation. Choose shorter lifetimes or an online authorization check when the product needs faster revocation. Cross-tenant deduplication must not reveal whether another tenant owns particular content.

## Tradeoffs

| Choice | Benefit | Cost |
| --- | --- | --- |
| Larger parts | Fewer requests and metadata entries | More bytes retransmitted after a failed part |
| Replication | Simple reads and repair | Storage overhead |
| Erasure coding | Lower storage overhead | More complex reconstruction and repair |
| Signed URLs | Direct byte serving | Revocation limited by URL/cache policy |

## Failure modes

- A response is lost after a part is stored: query or replay that part safely.
- Completion races a final part: publish only after verified durability is established.
- A repair backlog grows: alert on redundancy loss and recovery time, not just successful reads.
- Delete races a download: apply the documented revocation policy.

## Follow-ups an interviewer may ask

**Easy:** one of two parts is missing. Explain why a complete manifest cannot yet be published.

**Medium:** a client retries part 2 with a different checksum. Show how the conflict is detected.

**Hard:** a region fails while repair is behind. Explain which acknowledged objects remain recoverable and what evidence supports the durability claim.

## Cross-links

- [Time-ordered IDs with per-worker sequences](../../foundations/unique-ids/lesson.md) (id: unique-ids)
- [Remembering the expensive answer nearby](../../foundations/caching/lesson.md) (id: caching)
- [Publish renditions and serve adaptive playback](../video-streaming/lesson.md) (id: video-streaming)
- [Splitting a keyspace so one box is not the product](../../foundations/sharding/lesson.md) (id: sharding)
- [A name is not an address](../../../cs/dns-resolution/lesson.md) (id: dns-resolution)
