---
id: kv-store
title: Replicate a cart store with quorums
slug: kv-store
kind: case-study
track: system-design
difficulty: deep
estimated_minutes: 22
summary: Partition shopping carts across a ring of nodes, replicate each key three ways, and say exactly what a quorum read can and cannot promise after failures.
tags:
  - system-design
  - system-design/product-cases
  - system-design/storage
  - system-design/consistency
  - interviews
  - interviews/system-design
prerequisites:
  - sharding
  - cap-and-consistency
related:
  - sharding
  - cap-and-consistency
  - caching
  - blob-store
  - message-queue
company_signal: []
sources_consulted:
  - https://cassandra.apache.org/doc/latest/cassandra/architecture/dynamo.html
  - https://www.comp.nus.edu.sg/~gilbert/pubs/BrewersConjecture-SigAct.pdf
  - Kleppmann, Designing Data-Intensive Applications (O'Reilly, 2017), chapters 5–6
updated: 2026-10-28
status: canonical
---

# Replicate a cart store with quorums

## Snapshot

- The operation is `get(session_id)` and `put(session_id, cart, context)`. Nothing else: no joins, no range scans.
- Hash keys onto a ring of virtual nodes; each key lives on N = 3 replicas chosen by walking the ring.
- `R + W > N` makes read and write quorums share a replica. It does not by itself resolve concurrent writes or survive sloppy quorums.
- Hinted handoff, read repair, and background anti-entropy are three different repair paths with different speeds.

## What this round is actually scoring

Whether you can name the authoritative copy of a key when replicas disagree, and say which failures make a quorum read return something older than the last acknowledged write.

## Company signal

This is an original practice scenario. No traceable company-specific frequency evidence is supplied.

## Requirements

| Area | Requirement |
| --- | --- |
| Put | Store a shopper's cart (a small JSON blob) under the session ID |
| Get | Return the cart, or every conflicting version if the store cannot pick one safely |
| Availability | Adding an item should still work when one replica of that key is down |
| Durability | An acknowledged put survives the loss of any single node |
| Elasticity | Add or remove nodes without a full reshuffle or downtime |

| Non-functional | Target (illustrative) |
| --- | --- |
| p99 get | under 10 ms inside one region |
| p99 put | under 20 ms |
| Consistency | Tunable per request; carts accept rare merges over refusing writes |

## Back-of-envelope

These are illustrative workload assumptions, not production measurements.

- 120 million live carts × 2 KB each = **240 GB** of raw values. With N = 3 that is **720 GB** of replicas.
- Twelve storage nodes hold about **60 GB** each before indexes, compaction space, and headroom. Data size alone does not force twelve nodes; request rate and failure blast radius do.
- Average 40,000 gets/s and 12,000 puts/s. A 4× evening peak gives 160,000 gets/s and 48,000 puts/s.
- With R = 2, each get reads two replicas: 320,000 replica reads/s, or about **26,700 per node**. Each put is sent to all three replicas: 144,000 replica writes/s, or **12,000 per node**.
- One node down for 20 minutes misses about 12,000 writes/s × 1,200 s = 14.4 million writes. At 2 KB each, that is about **29 GB of hints** parked on other nodes. Hints need a cap; past it, repair falls to anti-entropy.

## Design

### ELI5

Put every cart key on a clock face. Each server owns a few slices of the face. A cart is stored by the server whose slice it lands in, plus the next two servers clockwise. To save, wait until two of the three say "written". To read, ask two of the three and take the newest. Two-out-of-three plus two-out-of-three means the groups always share at least one server.

[Follow a quorum put and get](viz/quorum.md)

### Operation and authoritative state

There is no single primary for a key. The authoritative state is the set of versions held by the key's N preference-list replicas. A client sends a request to any node, which acts as **coordinator**: it hashes the session ID, finds the first N distinct physical nodes clockwise on the ring, and fans the request out.

Use **virtual nodes**: twelve physical nodes × 64 tokens = 768 ring ranges. When a thirteenth node joins, it takes roughly 1/13 of the data (about 55 GB of the 720 GB) in small pieces from many peers, instead of halving one neighbor. Place replicas in different racks or zones, or the "three copies" share one power supply.

Each stored value carries a **version context**. A single integer is enough only if one writer at a time touches a key. Two tabs adding items concurrently need a version vector (one counter per coordinating node) so the store can tell "B replaced A" from "A and B were concurrent". Concurrent versions are kept as **siblings** and returned together; the cart service merges them (union of added items, with removal markers so a deleted item does not resurrect). Last-write-wins by wall clock is simpler and silently drops one tab's item.

```ts
type Copy = { replica: string; version: number; items: string[] };

// Every read quorum shares at least one replica with every write quorum when R + W > N.
function quorumsOverlap(n: number, w: number, r: number): boolean {
  return r + w > n;
}

// Wait for R replies, then keep the highest version. Too few replies fails the read.
function readNewest(replies: Copy[], r: number): Copy | null {
  if (replies.length < r) return null;
  return replies.slice(0, r).reduce((best, c) => (c.version > best.version ? c : best));
}

console.log(quorumsOverlap(3, 2, 2), quorumsOverlap(3, 1, 1)); // true false
const replies = [
  { replica: "B", version: 7, items: ["mug", "tea"] },
  { replica: "C", version: 6, items: ["mug"] },
];
console.log(readNewest(replies, 2)); // B's version 7
console.log(readNewest(replies.slice(0, 1), 2)); // null: one reply is not a quorum
```

The integer version in this sketch is the single-writer simplification. Swap it for a version vector before you claim concurrent puts are handled.

### Commit boundary

A put is **acknowledged** when W replicas have appended it to their commit log (and synced it, if the durability promise needs to survive power loss rather than just a process crash). The coordinator sends to all N and returns after W; the slowest replica catches up in the background. A put that reached fewer than W replicas returns an error, but it may still exist on one replica and may surface later. Say this out loud: a failed write is "unknown", not "did not happen". Client retries carry the same version context so they do not fork a new sibling.

### Recovery behavior

- **Hinted handoff.** If replica C is unreachable, the coordinator writes to the next healthy node D with a hint, "this belongs to C". D replays the hint when C returns. If hints count toward W (a *sloppy* quorum), writes stay available, but the overlap argument breaks. Suppose B and D acknowledge while A is slow, and C comes back before D replays its hint. A read that asks home replicas {A, C} sees neither copy. `R + W > N` only guarantees overlap among the same N nodes.
- **Read repair.** When a get sees B at version 7 and C at version 6, it writes version 7 back to C. This fixes hot keys quickly and never touches cold ones.
- **Anti-entropy.** Replicas periodically compare per-range hash trees (Merkle trees) and stream only the ranges that differ. This catches cold keys and expired hints.
- **Node replacement.** A permanently lost node's ranges are re-replicated from the surviving two copies. Until that finishes, those keys have N − 1 copies; track it as a durability alarm, not an availability one.

## Tradeoffs

| Choice | Benefit | Cost |
| --- | --- | --- |
| N = 3, W = 2, R = 2 | Overlapping quorums; survives one replica down for both reads and writes | Every get costs two replica reads |
| W = 1, R = 1 | Lowest latency | Reads can miss acknowledged writes; one disk failure can lose an ack |
| W = 3 | Every replica current at ack | One slow or dead replica blocks writes |
| Sloppy quorum + hints | Writes succeed during partitions | Strict overlap is lost until hints drain |
| Version vectors + siblings | No silent lost updates | Application must merge; vectors grow and need pruning |
| Last-write-wins | No merge code | Concurrent tabs drop items; clock skew picks the winner |
| Leader per key range (consensus) | Linearizable reads per key | Writes stall during leader election; more coordination per write |

## Failure modes

- **Two tabs, one cart.** Both read version 5 and write version 6 through different coordinators. With last-write-wins one item vanishes; with version vectors both survive as siblings.
- **Clock skew.** A node with a fast clock wins every last-write-wins tie for minutes. Prefer logical versions for ordering.
- **Hot key.** A flash-sale bot hammers one session ID. Adding nodes does not help; that key still has three owners. Rate-limit the client.
- **Hint pile-up.** A node down for hours exceeds the hint cap. Hints are dropped; correctness now depends on anti-entropy finishing before another replica dies.
- **Resurrected deletes.** A removed item comes back from a stale replica because the removal marker (tombstone) was garbage-collected before every replica saw it. Keep tombstones longer than the maximum repair interval.

## Follow-ups an interviewer may ask

**Easy:** with N = 3, W = 2, R = 2, replica C is down. Trace a put and then a get for the same cart.

**Medium:** two devices add different items within 50 ms. Show the versions each replica holds and what `get` returns.

**Hard:** a network split puts A on one side and B, C on the other, with sloppy quorums enabled. A put lands on {A, D}. Which reads can miss it, and what repairs it?

## Cross-links

- [Splitting a keyspace so one box is not the product](../../foundations/sharding/lesson.md) (id: sharding)
- [Consistency promises during failures](../../foundations/cap-and-consistency.md) (id: cap-and-consistency)
- [Remembering the expensive answer nearby](../../foundations/caching/lesson.md) (id: caching)
- [Upload large objects with resumable parts](../blob-store/lesson.md) (id: blob-store)
- [Keep an order-event log with offsets and redelivery](../message-queue/lesson.md) (id: message-queue)
- [Why a map is "O(1)" until it isn't](../../../cs/hashing-internals.md) (id: hashing-internals)
