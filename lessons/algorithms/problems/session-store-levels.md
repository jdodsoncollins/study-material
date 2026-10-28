---
id: session-store-levels
title: A session store that grows one level at a time
slug: session-store-levels
kind: problem
track: algorithms
difficulty: core
estimated_minutes: 20
summary: Build an in-memory key-value store in levels (set/get/delete, then sorted prefix scans, then per-key expiry) without rewriting the earlier levels.
tags:
  - algorithms
  - algorithms/hash-maps
  - algorithms/strings
  - interviews
  - interviews/leetcode
prerequisites:
  - hash-maps
  - progressive-spec-rounds
related:
  - progressive-spec-rounds
  - lru-cache
  - hash-maps
  - kv-store
company_signal: []
sources_consulted:
  - https://tc39.es/ecma262/multipage/keyed-collections.html#sec-map-objects
updated: 2026-10-28
status: canonical
---

# A session store that grows one level at a time

## Snapshot

- One map from key to `{ value, expiresAt }` carries every level. Choose that shape on level one and nothing gets rewritten.
- Every operation takes a timestamp `t`, even before expiry exists. Adding `t` later means changing every signature.
- A key is live while `t < expiresAt`. A key set without a TTL has `expiresAt = Infinity`.
- Scans return keys in sorted order and skip expired rows. Sorting happens at read time, not at insert time.
- Overwriting a key replaces its TTL too. A plain `set` makes an expiring key permanent.

## Prompt

A chat app keeps login sessions in memory. Each operation arrives with a timestamp in seconds. Build it in three levels; each level's tests must keep passing when the next one arrives.

1. `set(t, key, value)`, `get(t, key)` (value or `null`), `delete(t, key)` (`true` if a live key was removed, else `false`).
2. `scan(t, prefix)`: every live key starting with `prefix`, sorted, formatted `key=value`.
3. `set(t, key, value, ttl)`: the key expires at `t + ttl`. At that second and after, it is gone.

Example:

| t | Operation | Result |
| --- | --- | --- |
| 0 | `set u:ana tok-7` | |
| 1 | `set u:bo tok-3 ttl 5` | expires at 6 |
| 2 | `set g:ops tok-9` | |
| 3 | `scan u:` | `["u:ana=tok-7", "u:bo=tok-3"]` |
| 4 | `get u:bo` | `"tok-3"` |
| 6 | `get u:bo` | `null` |
| 7 | `delete u:ana` | `true` |
| 8 | `delete u:ana` | `false` |
| 9 | `scan u:` | `[]` |

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "Level 2 unlocks when level 1 passes" | Pick a row shape that has room for later fields |
| Every call has a timestamp | Expiry or history is coming; thread `t` through now |
| "Sorted by key" output | Sort on read; a hash map has no useful order |
| "Expires at `t + ttl`" | Pin the boundary: is the key live at exactly `t + ttl`? |
| Tests visible up front | Read all of them before typing; they define the edge cases |

## Worked approach

### ELI5

A clerk keeps one index card per key. The card says the value and the second it stops being valid. Permanent cards say "never". To answer any question at second `t`, the clerk first throws away the card if its time has passed, then answers as if the store never had expiry. A prefix question means pulling every card whose name starts with those letters, putting them in alphabetical order, and reading out the live ones.

1. `set`: write a fresh card. If there is no TTL, the expiry is "never".
2. `get`: look up the card. Expired? Throw it away and say `null`.
3. `delete`: say whether a live card existed, then throw it away.
4. `scan`: filter names by prefix, sort, keep the live ones, format.

### Syntax

```ts
const rows = new Map<string, { value: string; expiresAt: number }>();
rows.set("u:ana", { value: "tok-7", expiresAt: Infinity });
rows.set("u:bo", { value: "tok-3", expiresAt: 1 + 5 });
const live = (t: number, key: string) => (rows.get(key)?.expiresAt ?? -1) > t;
console.log(live(4, "u:bo"), live(6, "u:bo")); // true false
console.log([...rows.keys()].filter((k) => k.startsWith("u:")).sort()); // [ 'u:ana', 'u:bo' ]
```

### Then the details

The one footgun is letting expiry checks spread into every method. Put them in one private `live` helper so level three touches one place.

```ts
type Row = { value: string; expiresAt: number };

class SessionStore {
  private rows = new Map<string, Row>();

  set(t: number, key: string, value: string, ttl?: number): void {
    this.rows.set(key, { value, expiresAt: ttl === undefined ? Infinity : t + ttl });
  }
  private live(t: number, key: string): Row | null {
    const row = this.rows.get(key);
    if (!row) return null;
    if (t >= row.expiresAt) {
      this.rows.delete(key);
      return null;
    }
    return row;
  }
  get(t: number, key: string): string | null {
    return this.live(t, key)?.value ?? null;
  }
  delete(t: number, key: string): boolean {
    const had = this.live(t, key) !== null;
    this.rows.delete(key);
    return had;
  }
  scan(t: number, prefix: string): string[] {
    return [...this.rows.keys()]
      .filter((k) => k.startsWith(prefix))
      .sort()
      .filter((k) => this.live(t, k) !== null)
      .map((k) => `${k}=${this.rows.get(k)!.value}`);
  }
}

const store = new SessionStore();
store.set(0, "u:ana", "tok-7");
store.set(1, "u:bo", "tok-3", 5);
store.set(2, "g:ops", "tok-9");
console.log(store.scan(3, "u:"), store.get(4, "u:bo"), store.get(6, "u:bo"));
console.log(store.delete(7, "u:ana"), store.delete(8, "u:ana"), store.scan(9, "u:"));
```

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Map + expiry checked on read | O(1) expected `get`/`set`/`delete`; O(n log n) `scan` | O(n) | Default; expired rows linger until touched |
| Array of rows | O(n) every op | O(n) | Fails once tests get large |
| Map + sorted key list | O(log n) find, O(n) insert, O(log n + m) scan | O(n) | Worth it only if scans dominate |
| Map + min-heap of expiries | O(log n) set; purge on each op | O(n) | Frees memory eagerly; say it, build it only if asked |

## Walkthrough

### Easy

Level one with the prompt's numbers: `set u:ana tok-7` at 0, `get u:ana` at 4 → `"tok-7"`, `delete u:ana` at 7 → `true`, again at 8 → `false`. No TTL means `expiresAt = Infinity`, so `live` never drops it.

### Medium

Level two: at t = 3 the store holds `u:ana`, `u:bo`, `g:ops`. Filter by `u:` gives `u:bo`, `u:ana` in insertion order. Sort gives `u:ana`, `u:bo`. Both are live, so the result is `["u:ana=tok-7", "u:bo=tok-3"]`. `g:ops` never appears. A prefix of `""` returns every live key.

### Hard

Level three: `u:bo` was set at 1 with TTL 5, so `expiresAt = 6`. At t = 4, `4 < 6`, live. At t = 6, `6 >= 6`, gone. Now the trap: at t = 2 someone calls `set(2, "u:bo", "tok-4")` with no TTL. The new card says "never", so `get(10, "u:bo")` is `"tok-4"`. If you had kept the old expiry when overwriting, that read would wrongly return `null`. Ask the interviewer which behavior they want; the tests usually say.

A common level four asks for `getAt(t, key, atTime)`: the value as of an earlier second. That changes the row from one value to a list of `(time, value)` versions per key, searched with [binary search](../patterns/binary-search/lesson.md) (id: binary-search). Because every call already carries `t`, only the row type and two methods change.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| No timestamp on level-one methods | Every signature changes at level three | Accept `t` from the first line |
| `t > expiresAt` instead of `>=` | Key survives one extra second | Pin the boundary against the visible test |
| Overwrite keeps the old TTL | Permanent set still expires | Write a fresh row on every `set` |
| `delete` returns `true` for an expired key | Off-by-one versus the spec | Check `live` before deleting |
| Sort on insert into a plain array | O(n) writes and lost map lookups | Keep the map; sort keys during `scan` |
| Rewrite at each level | Earlier tests break under time pressure | Add fields and helpers; leave passing code alone |

## Interview moves

- Read every visible test before typing. Say the boundary out loud: "expired at exactly `t + ttl`, so live means `t < expiresAt`."
- Name the row shape first: "key maps to value plus expiry. Infinity means no expiry."
- Keep expiry in one helper and say why: "level three only touches `live` and `set`."
- When asked about memory, mention lazy expiry versus a purge heap, and say you would build the heap only if the tests stress memory.
- If time is short, finish the current level cleanly rather than half of the next one. Passing levels count; half-written ones do not.

## Cross-links

- [Pass a leveled spec without rewriting](../strategy/progressive-spec-rounds.md) (id: progressive-spec-rounds)
- [A lookup cache with least-recently-used eviction](./lru-cache/lesson.md) (id: lru-cache)
- [Hash maps as an index](../patterns/hash-maps.md) (id: hash-maps)
- [Halve the range you search](../patterns/binary-search/lesson.md) (id: binary-search)
- [Key-value store design](../../system-design/cases/kv-store/lesson.md) (id: kv-store)
