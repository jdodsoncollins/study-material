---
id: clone-contacts
title: Deep-copy a contact graph with cycles
slug: clone-contacts
kind: problem
track: algorithms
difficulty: core
estimated_minutes: 14
summary: Copy a graph by walking it once and keeping an original-to-copy map, so every node is created exactly once and cycles resolve to the copy already made.
tags:
  - algorithms
  - algorithms/graphs
  - algorithms/hash-maps
  - interviews
  - interviews/leetcode
prerequisites:
  - bfs
  - hash-maps
related:
  - bfs
  - dfs-backtracking
  - hash-maps
  - number-of-islands
company_signal: []
sources_consulted:
  - https://algs4.cs.princeton.edu/41graph/
updated: 2026-10-28
status: canonical
---

# Deep-copy a contact graph with cycles

## Snapshot

- Same shape as "clone graph." Undirected, connected, nodes reachable from the one you are handed.
- The map `original → copy` does two jobs: it is the visited set, and it is how a later edge finds a copy that already exists.
- Create the copy *before* you follow its neighbours, or a cycle recurses forever.
- BFS or DFS both work. Each node and each edge is handled once: O(V + E).

## Prompt

A chat app shows an offline "people you talk to" view. It needs its own copy of the contact graph so edits in the view never touch the live objects.

Each person is a node `{ id, links }`, where `links` holds references to other people. As an adjacency list (index = id): `[[1, 3], [0, 2], [1, 3], [0, 2, 4], [3]]`.

```
  0 ─── 1
  │     │
  3 ─── 2
  │
  4
```

Given person 0, return a copy of person 0 whose whole reachable graph is new objects with the same ids and the same link order. Read back as an adjacency list, the copy is `[[1, 3], [0, 2], [1, 3], [0, 2, 4], [3]]`, and no copied node is one of the originals.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "Deep copy" of linked objects that can point back | Original → copy map |
| Cycles (0 → 1 → 2 → 3 → 0 here) | Without the map, recursion never ends |
| "Copy a list with random pointers" | Same map, applied to a list |
| Returning ids instead of objects | Then it is just copying arrays; ask what they want |

## Worked approach

### ELI5

You are photocopying a web of index cards connected by string.

1. Copy the first card. Write "card 0 → copy 0" in a notebook.
2. For each string on the original card, look up the card at the other end in the notebook.
3. Already copied? Tie your copy to that copy. Not yet? Copy it now, write it in the notebook, and put it on your to-do pile.
4. Work through the pile until it is empty.

The notebook is the whole trick. It stops you from copying any card twice, and it is how a string back to card 0 finds copy 0.

### Syntax

```ts
type Person = { id: number; links: Person[] };
const a: Person = { id: 0, links: [] };
const b: Person = { id: 1, links: [a] };
a.links.push(b); // a cycle: a → b → a

const copies = new Map<Person, Person>();
copies.set(a, { id: a.id, links: [] });
console.log(copies.has(a), copies.get(a) !== a); // true true
```

### Then the details

```ts
type Person = { id: number; links: Person[] };

function cloneContacts(start: Person | null): Person | null {
  if (!start) return null;
  const copies = new Map<Person, Person>([[start, { id: start.id, links: [] }]]);
  const queue: Person[] = [start];
  for (let head = 0; head < queue.length; head++) {
    const orig = queue[head];
    const copy = copies.get(orig)!;
    for (const friend of orig.links) {
      if (!copies.has(friend)) {
        copies.set(friend, { id: friend.id, links: [] }); // create before exploring
        queue.push(friend);
      }
      copy.links.push(copies.get(friend)!);
    }
  }
  return copies.get(start)!;
}

// Build the prompt graph from its adjacency list.
const adj = [[1, 3], [0, 2], [1, 3], [0, 2, 4], [3]];
const people: Person[] = adj.map((_, id) => ({ id, links: [] }));
adj.forEach((ns, id) => { for (const n of ns) people[id].links.push(people[n]); });

const copy = cloneContacts(people[0])!;
console.log(copy !== people[0], copy.links.map((p) => p.id)); // true [1, 3]
console.log(copy.links[0].links[0] === copy);                 // true: the cycle points at the copy
console.log(cloneContacts(null));                             // null
```

The detail: put the copy in the map at the moment you first *discover* a node, not when you dequeue it. Otherwise two neighbours that both see the same undiscovered node each create a copy.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| BFS with original → copy map | O(V + E) | O(V) map and queue | Default |
| Recursive DFS with the same map | O(V + E) | O(V) map + O(V) call stack | Shorter; deep graphs can overflow |
| JSON round-trip | Fails | | `JSON.stringify` throws on cycles |
| `structuredClone` | O(V + E) | O(V) | Handles cycles in modern runtimes; ask if a library call is allowed |

## Walkthrough

### Easy

Two people `[[1], [0]]`. Copy 0, queue [0]. Process 0: friend 1 is new, copy it, link copy0 → copy1. Process 1: friend 0 is already in the map, link copy1 → copy0. Result `[[1], [0]]`, two new objects.

### Medium

The prompt. Queue order and what each step does:

1. Start: map {0}. Process 0: friends 1 and 3 are new. Map {0, 1, 3}. copy0.links = [c1, c3].
2. Process 1: friend 0 seen, friend 2 new. copy1.links = [c0, c2].
3. Process 3: friends 0 and 2 already seen (2 was added in step 2), friend 4 new. copy3.links = [c0, c2, c4].
4. Process 2: friends 1 and 3 seen. copy2.links = [c1, c3].
5. Process 4: friend 3 seen. copy4.links = [c3].

Five copies, ten link entries (five undirected edges, each stored twice). Link order matches the original because you append in the original's order.

### Hard

A person who lists themselves (`[[0]]`): processing 0 sees friend 0 already in the map and links copy0 → copy0. No special case needed.

Follow-up: "the graph may be disconnected and you are given every node." Run the same loop from each node that is not yet in the map, and return the list of copies. Follow-up: "copy a linked list where each node also has a random pointer." Same map; one pass to create copies, one pass to wire `next` and `random`.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| No visited map | Infinite recursion on the first cycle | Map original → copy |
| Creating the copy when dequeued, not when discovered | Duplicate copies of one node | Insert into the map on discovery |
| Returning a node with the original's `links` array | Copy shares edges with the original | Fresh `links: []` for every copy |
| Copying ids, not objects | Correct numbers, but the task wanted new objects | Ask what "copy" means for the caller |
| `JSON.parse(JSON.stringify(g))` | Throws on cycles | Write the walk, or ask about `structuredClone` |

## Interview moves

- Say why the map is needed before writing anything: cycles and shared neighbours.
- Point at the line where the copy enters the map and say "on discovery."
- Mention `structuredClone` as the production answer and offer to write the walk anyway.
- Give O(V + E) and explain that each undirected edge is seen from both ends.

## Cross-links

- [Expand level by level](../patterns/bfs/lesson.md) (id: bfs)
- [Explore, undo, try the next branch](../patterns/dfs-backtracking.md) (id: dfs-backtracking)
- [Hash maps as an index](../patterns/hash-maps.md) (id: hash-maps)
- [Land clusters on a map](./number-of-islands/lesson.md) (id: number-of-islands)
- [Trees are graphs with a promise](../../cs/trees-graphs.md) (id: trees-graphs)
