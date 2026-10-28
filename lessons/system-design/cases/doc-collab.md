---
id: doc-collab
title: Merge concurrent edits in a shared notes doc
slug: doc-collab
kind: case-study
track: system-design
difficulty: deep
estimated_minutes: 22
summary: Give each open document one sequencing owner, choose operational transform or a CRDT on purpose, keep presence out of the durable log, and replay offline edits without duplicating them.
tags:
  - system-design
  - system-design/product-cases
  - system-design/realtime
  - system-design/consistency
  - interviews
  - interviews/system-design
prerequisites:
  - chat-system
  - cap-and-consistency
related:
  - chat-system
  - cap-and-consistency
  - file-sync
  - sharding
  - load-balancing
company_signal: []
sources_consulted:
  - https://doi.org/10.1145/67544.66963
  - https://hal.inria.fr/inria-00555588
  - https://www.inkandswitch.com/local-first/
updated: 2026-10-28
status: canonical
---

# Merge concurrent edits in a shared notes doc

## Snapshot

- The operation is "apply this edit to revision r of document d". Every edit names the revision it was made against.
- Operational transform (OT) usually relies on one sequencer per document; CRDTs make edits commute so replicas converge without one.
- Both converge on the same text. Neither guarantees the merged sentence still reads well; that is a product problem, not a math one.
- Cursors and "who is here" are presence: ephemeral, lossy, and never written to the edit log.

## What this round is actually scoring

Whether you can say where an edit becomes durable, how two simultaneous edits end up identical on every screen, and what happens to an hour of offline typing when the laptop reconnects.

## Company signal

This is an original practice scenario. No traceable company-specific frequency evidence is supplied.

## Requirements

| Area | Requirement |
| --- | --- |
| Edit | Several people type into the same meeting-notes doc and see each other's changes within a second |
| Converge | After everyone stops typing, every copy shows identical text |
| Presence | Show who is in the doc and where their cursor is |
| Offline | A laptop on a flight keeps editing; edits merge on reconnect |
| History | Restore the doc as of any point in the last 30 days |

| Non-functional | Target (illustrative) |
| --- | --- |
| Remote edit visible | p95 under 300 ms within a region |
| Lost acknowledged edits | none |
| Presence | best effort; a stale cursor for a few seconds is fine |

## Back-of-envelope

These are illustrative workload assumptions, not production measurements.

- Peak: 300,000 documents open, average 3 editors each = **900,000 live connections**. At 20,000 connections per session server, about **45 servers**.
- 30% of editors are typing at any moment, and clients batch keystrokes into an operation every 500 ms: 900,000 × 0.3 × 2 = **540,000 ops/s**. At about 100 bytes per op, 54 MB/s in.
- Each op fans out to the other two editors: about **1.08 million deliveries/s**.
- Cursor updates throttled to 5 per second per typing editor: 270,000 × 5 = 1.35 million presence messages/s. That is more than the edits, which is why presence must not share the durable path.
- Day-average 120,000 ops/s × 86,400 s × 100 B ≈ **1.04 TB/day** of op log. Thirty days of history is about **31 TB** before compression. Periodic snapshots (say every 500 ops) keep load time bounded.

## Design

### ELI5

Everyone edits their own copy right away so typing feels instant. Each edit says "I typed this at position 4 when the doc was at version 12." One owner for the doc puts edits in order. If your edit arrives after someone else's, the owner slides your position over by however many characters they added in front of you, so your edit still lands next to the same word.

### Operation and authoritative state

Route each document ID to one **session owner** (a shard map or consistent hashing over session servers). Every editor of that doc connects to it. The owner holds the current text in memory and assigns a monotonically increasing **revision** to each accepted op. The authoritative state is the doc's **op log plus its latest snapshot**, stored durably; the in-memory copy is a cache.

**OT path.** A client sends `(client_id, client_seq, base_revision, op)`. If `base_revision` is behind, the owner transforms the op against every op committed since then and assigns the next revision. The client does the mirror-image transform on its pending ops when it receives ops from others.

```ts
type Insert = { pos: number; text: string; site: string };

// Shift `op` so it still means the same thing after `applied` has already landed.
function transformInsert(op: Insert, applied: Insert): Insert {
  const before = applied.pos < op.pos || (applied.pos === op.pos && applied.site < op.site);
  return before ? { ...op, pos: op.pos + applied.text.length } : op;
}
function apply(doc: string, op: Insert): string {
  return doc.slice(0, op.pos) + op.text + doc.slice(op.pos);
}

const base = "Ship v2";
const ana = { pos: 4, text: " the", site: "ana" };
const ben = { pos: 7, text: " today", site: "ben" };
const ownerView = apply(apply(base, ana), transformInsert(ben, ana));
const benView = apply(apply(base, ben), transformInsert(ana, ben));
console.log(ownerView, "|", benView, ownerView === benView); // Ship the v2 today | Ship the v2 today true
```

Real OT also transforms deletes against inserts and deletes, and that matrix is where published algorithms have had subtle bugs. Use a tested library; in the interview, show one pair and name the rest.

**CRDT path.** Give every character a unique, ordered ID such as `(lamport_counter, site_id)` and insert "after character X" instead of "at position 4". Deletes leave tombstones. Merges commute, so peers converge in any order without a sequencer. The cost is metadata: IDs and tombstones can make the stored doc several times larger than its text, so plan compaction.

A central owner is still useful with a CRDT: it gives one place to persist, authorize, and fan out. The difference is that offline peers and a second region can merge without asking it.

### Commit boundary

An op is **committed** when the owner has appended it, with its revision, to the doc's durable log (a replicated log or a database append). Only then does the owner ack the author and broadcast it. The author keeps the op in a pending buffer until the ack arrives. `(client_id, client_seq)` makes a resend idempotent: the owner returns the existing revision instead of applying it twice.

Presence goes over the same socket but into an in-memory map with a heartbeat TTL (for example, drop a cursor after 10 s without updates). It is never logged or acked.

### Recovery behavior

- **Owner crash.** The shard map assigns the doc to a new owner, which loads the last snapshot plus the log tail. Clients reconnect, report their last acked revision, receive missing ops, and resend pending ones. Dedup by `(client_id, client_seq)` prevents doubled text. Fence the old owner (a lease or epoch number) so a half-dead process cannot keep assigning revisions.
- **Offline laptop.** It reconnects with base revision 1,240 and 600 local ops; the doc is now at 1,980. OT transforms 600 ops against 740: doable but slow and lock-step on the owner. A CRDT merges without transforms. Either way, show the result to the user: two people rewriting the same paragraph converge to text containing both edits, which may need a human to tidy.
- **Snapshot corruption.** Keep the op log long enough to rebuild from an older snapshot.

## Tradeoffs

| Choice | Benefit | Cost |
| --- | --- | --- |
| OT with a central sequencer | Compact ops; mature in server-centric editors | Owner is on the hot path; long offline histories are expensive to transform |
| Sequence CRDT | Order-free merges; good for offline and peer-to-peer | Per-character metadata and tombstones; harder rich-text semantics |
| Snapshot every 500 ops | Fast doc open | Snapshot writes and storage |
| Presence on a separate lossy path | Edit log stays small; dropped cursors are harmless | Two message types to version |
| Lock a paragraph while someone types | No merge surprises | Feels broken on slow networks; stale locks |

## Failure modes

- **Double apply.** A client resends after a timeout and the owner applies the op twice. Fix: idempotent `(client_id, client_seq)`.
- **Split brain.** Two servers each think they own the doc and hand out revision 1,981. Fix: an epoch on the shard assignment and a conditional append that rejects the stale epoch.
- **Presence storm.** 200 viewers in an all-hands doc each send cursor moves; fanout is quadratic. Fix: throttle, and show only editors or a count past a threshold.
- **Large paste.** A 2 MB paste becomes one huge op. Cap op size and chunk it.
- **Permission revoked mid-session.** The owner must recheck access on reconnect and drop the socket, not just hide the share icon.

## Follow-ups an interviewer may ask

**Easy:** two people insert at the same position at the same time. Which text comes first, and why is it the same on both screens?

**Medium:** the session owner dies. Walk the client's pending buffer, the reconnect, and the dedupe.

**Hard:** support a second region where both regions accept edits during a network split. What breaks with a single-sequencer OT design, and what would you change?

## Cross-links

- [Order messages and resume delivery](./chat-system/lesson.md) (id: chat-system)
- [Consistency promises during failures](../foundations/cap-and-consistency.md) (id: cap-and-consistency)
- [Sync files across devices with chunks and a change journal](./file-sync/lesson.md) (id: file-sync)
- [Splitting a keyspace so one box is not the product](../foundations/sharding/lesson.md) (id: sharding)
- [Spreading work without creating a new bottleneck](../foundations/load-balancing.md) (id: load-balancing)
