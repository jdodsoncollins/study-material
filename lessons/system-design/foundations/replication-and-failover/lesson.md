---
id: replication-and-failover
title: Copies, leaders, and who is allowed to write
slug: replication-and-failover
kind: concept
track: system-design
difficulty: core
estimated_minutes: 18
summary: Choose synchronous or asynchronous replication from what an acknowledgement must survive, and make failover safe with terms, majorities, and fencing.
tags:
  - system-design
  - system-design/foundations
  - system-design/storage
  - system-design/consistency
  - interviews
  - interviews/system-design
prerequisites:
  - cap-and-consistency
related:
  - cap-and-consistency
  - sharding
  - chat-system
  - job-scheduler
  - transactions-isolation
company_signal: []
sources_consulted:
  - https://raft.github.io/raft.pdf
  - https://lamport.azurewebsites.net/pubs/paxos-simple.pdf
  - https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf
  - https://www.postgresql.org/docs/current/warm-standby.html
updated: 2026-10-28
status: canonical
---

# Copies, leaders, and who is allowed to write

## Snapshot

- Replication keeps copies of data on several machines so a failure does not lose it or stop service.
- Synchronous replication waits for replicas before acknowledging; asynchronous replication acknowledges first and copies later, so a failover can lose acknowledged writes.
- With N replicas, a write quorum W and read quorum R overlap when R + W > N. Overlap alone does not make reads linearizable.
- Failover needs three things: detecting the failure, choosing exactly one new leader, and stopping the old one from writing (fencing).
- Consensus protocols such as Raft and Paxos make "one leader per term, committed means stored on a majority" a proven property instead of a hope.

## Why it shows up in interviews

Almost every design says "and we replicate the database." The follow-up is always about what happens at the bad moment: the leader acknowledged a chat message and then crashed, or a network partition left two machines each believing they are the leader. Saying which writes survive and how a stale leader is stopped shows you understand the acknowledgement you are promising.

## Core idea

### ELI5

One machine, the leader, decides the order of writes. It sends each write to followers. When enough followers have it, the leader tells the client "done." If the leader disappears, the remaining machines agree on a replacement, and the replacement must already hold every write anyone was told was done. If the old leader comes back, it learns it is out of date and stops accepting writes.

[Watch a failover choose one leader](viz/failover.md)

### Synchronous, asynchronous, and in between

| Mode | Acknowledge after | Survives leader loss? | Cost |
| --- | --- | --- | --- |
| Asynchronous | Leader's local commit | Writes not yet copied can be lost | Lowest write latency |
| Synchronous to one standby | Leader plus a named standby | Yes, if that standby is promoted | A slow standby slows every write |
| Majority (quorum) | A majority of replicas | Yes, if the new leader comes from a majority | Tolerates a minority of slow or failed nodes |

PostgreSQL, for example, can run standbys asynchronously or require confirmation from one or more synchronous standbys before a commit returns. Read the engine's documentation for exactly what "confirmed" means: received, flushed to disk, or applied.

### Replication lag and what readers see

Followers apply writes some time after the leader. Reading from a follower can return old data. Common product promises:

- **Read-your-writes:** after I post a comment, I see it. Route my reads to the leader for a short time, or to a follower that has applied at least my write's position.
- **Monotonic reads:** I never see newer data and then older data. Pin a session to one follower or track the highest position it has seen.

### Leaderless quorums

Some stores (in the style of the Dynamo paper) let any of N replicas accept a write. A write succeeds when W replicas confirm; a read asks R replicas and takes the newest version. If R + W > N, every read set overlaps every write set in at least one replica. That overlap is useful, but it does not settle concurrent writes to the same key, partial writes that later fail, or "sloppy" quorums that write to substitute nodes during a partition. Those need version vectors, conflict resolution, or read repair, and the store's documentation states which guarantees remain.

### Failover and split brain

Leaders are usually declared dead by timeout. A timeout cannot tell a crashed leader from a slow or partitioned one. If you promote a new leader while the old one is still accepting writes, you have **split brain**: two leaders ordering writes independently.

Defenses:

- **Majority election.** A candidate needs votes from a majority. Two majorities of the same group always share a member, so two leaders cannot be elected for the same term.
- **Terms (epochs).** Every election increases a term number. Replicas reject messages from a leader with an older term.
- **Fencing tokens.** Storage or downstream services accept writes only with the current term or a higher token, so an old leader that wakes up after a pause is refused even if it has not noticed.

### Consensus at a conceptual level

Raft, as one widely taught example, keeps a replicated log. A leader is elected for a term by majority vote. The leader appends entries and replicates them; an entry is **committed** once a majority stores it, and a committed entry is never lost by a later election because a candidate can win only if its log is at least as up to date as a majority's. Paxos reaches the same kind of agreement with a different structure. You rarely implement these in an interview. You do need to say that your coordination service, lock service, or replicated database uses one, and what its majority requirement means for availability: five replicas tolerate two failures; four replicas still tolerate only one.

## Worked example

A chat service keeps each conversation's log on five replicas and acknowledges a message after a majority stores it.

### Easy

Majority of five is three. The leader stores message 41 and two followers confirm. That is three copies, so the client receives "sent." Two replicas can now fail and message 41 survives on at least one remaining copy.

### Medium

The leader crashes after replicas A and B confirm message 42, while C and D only have up to 41. Which replicas may become leader without losing an acknowledged write? Message 42 was acknowledged, so the new leader must have it. A and B have it. In Raft-style elections a candidate needs three votes, and a voter refuses a candidate whose log is behind its own. If C runs, it can count its own vote and D's, but the third must come from A or B, and both refuse because C ends at 41. So only A or B can win, and both hold message 42.

### Hard

The old leader was not dead. It was paused for 12 seconds by a long garbage-collection pause, then resumes and tries to append message 43 in term 6. The cluster elected a new leader in term 7. Followers reject the term-6 append. But the old leader also writes attachment metadata to a separate object store, which knows nothing about terms. Unless that store checks a fencing token, the stale write lands. The fix belongs at every resource the leader writes to, not only in the replication protocol.

```ts
type Replica = { name: string; lastIndex: number; up: boolean };

function eligibleLeaders(replicas: Replica[], ackedIndex: number): string[] {
  const majority = Math.floor(replicas.length / 2) + 1;
  const up = replicas.filter((r) => r.up);
  if (up.length < majority) return []; // no majority, no election
  // A candidate must already hold every acknowledged write.
  return up.filter((r) => r.lastIndex >= ackedIndex).map((r) => r.name);
}

const afterCrash: Replica[] = [
  { name: "old", lastIndex: 42, up: false },
  { name: "A", lastIndex: 42, up: true },
  { name: "B", lastIndex: 42, up: true },
  { name: "C", lastIndex: 41, up: true },
  { name: "D", lastIndex: 41, up: true },
];
console.log(eligibleLeaders(afterCrash, 42)); // [ 'A', 'B' ]
console.log(eligibleLeaders(afterCrash.map((r) => ({ ...r, up: r.name === "C" || r.name === "D" })), 42)); // []
```

This models only the safety rule. A real protocol also needs vote bookkeeping per term and a log comparison that includes terms, not just indexes.

## Common mistakes

| Trap | What happens | Fix |
| --- | --- | --- |
| "We replicate, so no data loss" | Async failover drops acknowledged writes | Say what the ack waits for |
| Promoting on timeout alone | Split brain during a partition | Majority election plus terms |
| Fencing only the database | A stale leader still writes elsewhere | Check a token at every downstream resource |
| R + W > N means strong consistency | Concurrent or partial writes still conflict | Name the conflict rule and the store's actual guarantee |
| Four replicas for more safety | Still tolerates only one failure for majority | Use odd sizes for majority systems |
| Reading followers for everything | Users miss their own writes | Route read-your-writes reads deliberately |

## How to talk about it

"Each partition has a leader and two followers, and we acknowledge after a majority stores the write, so losing any one machine loses nothing we've acknowledged. Failover uses the store's consensus: one leader per term, and nodes reject an older term. The leader also writes to the object store, so those writes carry the term as a fencing token. Follower reads are fine for the timeline, but a user's own posts read from the leader for a few seconds."

## Cross-links

- [Consistency promises during failures](../cap-and-consistency.md) (id: cap-and-consistency)
- [Splitting a keyspace so one box is not the product](../sharding/lesson.md) (id: sharding)
- [Order messages and resume delivery](../../cases/chat-system/lesson.md) (id: chat-system)
- [Schedule occurrences and recover leased work](../../cases/job-scheduler/lesson.md) (id: job-scheduler)
- [Isolation defines what concurrent transactions can observe](../../../cs/transactions-isolation.md) (id: transactions-isolation)
- [Pick a store by its access pattern](../choosing-a-datastore.md) (id: choosing-a-datastore)
