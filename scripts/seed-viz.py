#!/usr/bin/env python3
"""Convert selected flat lessons into dirs with mermaid companions."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "lessons"

# id -> (relative lesson path without .md, insert_after_heading, stem, mermaid, steps)
SEED = {
    "url-shortener": (
        "system-design/cases/url-shortener",
        "## Design",
        "path",
        """flowchart LR
  mint[Mint API] --> keys[MintPool]
  mint --> store[ClipStore]
  click[Resolve] --> cache[Redirect cache]
  cache -->|miss| store
  store --> cdn[302 to long URL]
""",
        """title: Mint then resolve
steps:
  - caption: "Writes hit MintPool + ClipStore. Uniqueness lives here."
    nodes: [mint, keys, store]
  - caption: "Reads are 100:1. Cache then ClipStore then 302."
    nodes: [click, cache, store, cdn]
""",
    ),
    "rate-limiter": (
        "system-design/cases/rate-limiter",
        "## Design",
        "bucket",
        """flowchart TB
  req[Request] --> local[Local token bucket]
  local -->|tokens left| pass[Allow]
  local -->|empty| redis[Shared sliding window]
  redis -->|under quota| pass
  redis -->|over| shed[429]
""",
        """title: Cheap shed then fair share
steps:
  - caption: "Most traffic dies on a local bucket. No network."
    nodes: [req, local, pass]
  - caption: "When the box is dry, ask the shared window."
    nodes: [local, redis]
  - caption: "Over quota: 429. Under: allow."
    nodes: [redis, pass, shed]
""",
    ),
    "chat-system": (
        "system-design/cases/chat-system",
        "## Design",
        "delivery",
        """flowchart LR
  send[Sender] --> api[Chat API]
  api --> log[Message log]
  api --> fan[Online fanout]
  fan --> ws[WebSocket]
  ws --> recv[Recipient device]
  api --> push[Push if offline]
""",
        """title: Online vs offline
steps:
  - caption: "Persist first. The log is the source of truth."
    nodes: [send, api, log]
  - caption: "If the recipient has a socket, fan out live."
    nodes: [fan, ws, recv]
  - caption: "Otherwise enqueue a push. Do not block the write."
    nodes: [api, push]
""",
    ),
    "video-streaming": (
        "system-design/cases/video-streaming",
        "## Design",
        "abr",
        """flowchart TB
  upload[Upload] --> encode[Ladder encode]
  encode --> obj[Object store]
  play[Player] --> man[Manifest]
  man --> cdn[CDN]
  cdn --> obj
  play --> abr[ABR pick bitrate]
""",
        """title: Encode once, play many
steps:
  - caption: "Ingest becomes a bitrate ladder in object storage."
    nodes: [upload, encode, obj]
  - caption: "Player fetches a manifest, then segments from the edge."
    nodes: [play, man, cdn]
  - caption: "ABR picks a rung from buffer and bandwidth, not from hope."
    nodes: [play, abr]
""",
    ),
    "search-autocomplete": (
        "system-design/cases/search-autocomplete",
        "## Design",
        "prefix",
        """flowchart LR
  key[Keystroke] --> cache[Prefix cache]
  cache -->|hot| rank[Ranked suggestions]
  cache -->|miss| trie[Prefix index]
  trie --> rank
  rank --> ui[Typeahead]
""",
        """title: Sub-100ms prefixes
steps:
  - caption: "Hot prefixes never touch the index."
    nodes: [key, cache, rank]
  - caption: "Miss: walk the prefix index, then rank."
    nodes: [cache, trie, rank, ui]
""",
    ),
    "ride-hailing": (
        "system-design/cases/ride-hailing",
        "## Design",
        "match",
        """flowchart TB
  ping[Driver ping] --> geo[Geo index]
  ride[Ride request] --> zone[Zone]
  zone --> match[Matcher]
  geo --> match
  match --> offer[Offer to driver]
  offer --> trip[Trip]
""",
        """title: Supply meets demand
steps:
  - caption: "Pings keep the geo index warm."
    nodes: [ping, geo]
  - caption: "A request hits a zone, then the matcher."
    nodes: [ride, zone, match]
  - caption: "Offer, accept, trip. Surge is a multiplier on this path."
    nodes: [match, offer, trip]
""",
    ),
    "job-scheduler": (
        "system-design/cases/job-scheduler",
        "## Design",
        "lease",
        """flowchart LR
  cron[Cron / ad-hoc] --> q[Due queue]
  q --> worker[Worker]
  worker --> lease[Lease + heartbeat]
  worker --> run[Run]
  run -->|ok| done[Ack]
  run -->|crash| q
""",
        """title: Leases beat hope
steps:
  - caption: "Due work lands in a queue. Workers pull."
    nodes: [cron, q, worker]
  - caption: "A lease + heartbeat owns the attempt."
    nodes: [worker, lease, run]
  - caption: "Crash before ack: the lease expires, the job is due again."
    nodes: [run, q, done]
""",
    ),
    "payment-idempotency": (
        "system-design/cases/payment-idempotency",
        "## Design",
        "keys",
        """flowchart TB
  tap[Pay Now] --> key[Idempotency key]
  key --> seen{key seen?}
  seen -->|yes| replay[Return first result]
  seen -->|no| ledger[Append ledger]
  ledger --> psp[PSP charge]
  psp --> store[Store result under key]
""",
        """title: Double-tap must not double-charge
steps:
  - caption: "Client sends a key. The second tap reuses it."
    nodes: [tap, key]
  - caption: "If we already finished this key, replay. Do not charge."
    nodes: [seen, replay]
  - caption: "Otherwise append the ledger, call the PSP, remember the result."
    nodes: [seen, ledger, psp, store]
""",
    ),
    "notification-system": (
        "system-design/cases/notification-system",
        "## Design",
        "channels",
        """flowchart LR
  event[Event] --> pref[Preferences]
  pref --> q[Per-channel queue]
  q --> push[Push]
  q --> sms[SMS]
  q --> email[Email]
  push --> dlq[DLQ]
  sms --> dlq
""",
        """title: Fan-out with taste
steps:
  - caption: "Preferences gate the event before any vendor call."
    nodes: [event, pref, q]
  - caption: "Each channel is its own queue and retry story."
    nodes: [q, push, sms, email]
  - caption: "Poison goes to a DLQ, not an infinite retry."
    nodes: [push, dlq]
""",
    ),
    "llm-serving": (
        "system-design/cases/llm-serving",
        "## Design",
        "batch",
        """flowchart TB
  req[Completion req] --> q[GPU wait queue]
  q --> batch[Continuous batch]
  batch --> kv[KV cache]
  batch --> gpu[GPU]
  gpu --> tok[Tokens out]
""",
        """title: GPUs hate idle
steps:
  - caption: "Requests wait. Capacity is the scarce object."
    nodes: [req, q]
  - caption: "A batcher fills the GPU; KV cache is the memory tax."
    nodes: [batch, kv, gpu]
  - caption: "Tokens stream out. Queueing delay is the SLO fight."
    nodes: [gpu, tok]
""",
    ),
    "caching": (
        "system-design/foundations/caching",
        "## Core idea",
        "aside",
        """flowchart LR
  app[App] --> cache{Cache hit?}
  cache -->|yes| ret[Return]
  cache -->|no| db[Database]
  db --> fill[Fill cache]
  fill --> ret
""",
        """title: Cache-aside
steps:
  - caption: "Read the cache first."
    nodes: [app, cache, ret]
  - caption: "Miss: read the source of truth, then fill."
    nodes: [cache, db, fill, ret]
""",
    ),
    "sharding": (
        "system-design/foundations/sharding",
        "## Core idea",
        "keyspace",
        """flowchart TB
  key[Partition key] --> hash[Hash / range]
  hash --> s0[Shard 0]
  hash --> s1[Shard 1]
  hash --> s2[Shard 2]
""",
        """title: Split the keyspace
steps:
  - caption: "Pick a key that matches the hot query."
    nodes: [key]
  - caption: "Hash or range maps that key onto a box."
    nodes: [hash, s0, s1, s2]
""",
    ),
    "queues-delivery": (
        "system-design/foundations/queues-delivery",
        "## Core idea",
        "once",
        """flowchart LR
  prod[Producer] --> q[Queue]
  q --> work[Consumer]
  work -->|ok| ack[Ack]
  work -->|crash| q
  work --> idemp[Idempotent write]
""",
        """title: At-least-once
steps:
  - caption: "The queue keeps the message until ack."
    nodes: [prod, q, work]
  - caption: "Crash before ack: it comes back. Design for duplicates."
    nodes: [work, q, idemp]
""",
    ),
    "sliding-window": (
        "algorithms/patterns/sliding-window",
        "## Worked approach",
        "window",
        """flowchart LR
  L[left] --> slice[window]
  R[right] --> slice
  slice --> ok{invariant?}
  ok -->|no| shrink[move left]
  ok -->|yes| grow[move right]
  shrink --> slice
  grow --> slice
""",
        """title: Restore the invariant
steps:
  - caption: "Right edge eats the next item."
    nodes: [R, slice]
  - caption: "If the invariant breaks, left edge gives items back."
    nodes: [ok, shrink, L]
  - caption: "When it holds, record the answer and grow again."
    nodes: [ok, grow]
""",
    ),
    "two-pointers": (
        "algorithms/patterns/two-pointers",
        "## Worked approach",
        "squeeze",
        """flowchart LR
  L[left] --> sum[L + R]
  R[right] --> sum
  sum --> cmp{vs target}
  cmp -->|small| moveL[left++]
  cmp -->|big| moveR[right--]
  cmp -->|equal| done[pair]
""",
        """title: Discard a side each step
steps:
  - caption: "Sorted input. Ends are the extreme pair."
    nodes: [L, R, sum]
  - caption: "Too small: throw away the left value."
    nodes: [cmp, moveL]
  - caption: "Too big: throw away the right value."
    nodes: [cmp, moveR, done]
""",
    ),
    "bfs": (
        "algorithms/patterns/bfs",
        "## Worked approach",
        "layers",
        """flowchart TB
  start[Start] --> q[Queue]
  q --> node[Pop node]
  node --> nbs[Enqueue unseen neighbors]
  nbs --> q
  node --> dist[Distance = layer]
""",
        """title: First time you see it is shortest
steps:
  - caption: "Seed the queue with the start."
    nodes: [start, q]
  - caption: "Pop a node, enqueue neighbors you have not seen."
    nodes: [node, nbs, q]
  - caption: "Layer index is the unweighted distance."
    nodes: [node, dist]
""",
    ),
    "lru-cache": (
        "algorithms/problems/lru-cache",
        "## Worked approach",
        "evict",
        """flowchart LR
  get[get / put] --> map[Hash map]
  map --> node[List node]
  node --> front[Move to front]
  put2[put when full] --> tail[Evict tail]
  tail --> map
""",
        """title: Map + list
steps:
  - caption: "The map finds the node in O(1)."
    nodes: [get, map, node]
  - caption: "Use moves that node to the front."
    nodes: [node, front]
  - caption: "A full put evicts the tail and drops the map entry."
    nodes: [put2, tail, map]
""",
    ),
    "three-sum": (
        "algorithms/problems/three-sum",
        "## Worked approach",
        "pin",
        """flowchart TB
  sort[Sort] --> pin[Pin i]
  pin --> L[left = i+1]
  pin --> R[right = n-1]
  L --> sum[sum vs 0]
  R --> sum
  sum --> move[Move L or R]
""",
        """title: Pin one, squeeze two
steps:
  - caption: "Sort so two pointers are legal."
    nodes: [sort]
  - caption: "Pin i. The rest is a pair search."
    nodes: [pin, L, R]
  - caption: "Walk L/R like two-sum on a sorted slice."
    nodes: [sum, move]
""",
    ),
    "union-find": (
        "algorithms/patterns/union-find",
        "## Worked approach",
        "dsu",
        """flowchart LR
  a[Find a] --> ra[Root a]
  b[Find b] --> rb[Root b]
  ra --> same{same root?}
  rb --> same
  same -->|no| link[Link by rank]
""",
        """title: Find then link
steps:
  - caption: "Find compresses the path to a root."
    nodes: [a, ra, b, rb]
  - caption: "Different roots: link the shorter under the taller."
    nodes: [same, link]
""",
    ),
    "topological-sort": (
        "algorithms/patterns/topological-sort",
        "## Worked approach",
        "kahn",
        """flowchart TB
  zeros[Indegree 0 queue] --> node[Pop]
  node --> out[Append to order]
  node --> dec[Decrement neighbors]
  dec --> zeros
  leftover[Leftover nodes] --> cycle[Cycle]
""",
        """title: Kahn's peel
steps:
  - caption: "Start with every node of indegree 0."
    nodes: [zeros, node]
  - caption: "Emit it, decrement neighbors, enqueue new zeros."
    nodes: [out, dec, zeros]
  - caption: "Anything left is a cycle. No legal order."
    nodes: [leftover, cycle]
""",
    ),
    "graders": (
        "ai-agents/graders",
        "## Core idea",
        "kinds",
        """flowchart TB
  trial[Trial] --> code[Code grader]
  trial --> model[LLM judge]
  trial --> human[Human]
  code --> score[Score]
  model --> score
  human --> score
""",
        """title: Three graders
steps:
  - caption: "Code graders are cheap and brittle. Use them as the gate."
    nodes: [trial, code, score]
  - caption: "LLM judges catch nuance. Calibrate them against humans."
    nodes: [model, human, score]
""",
    ),
    "pass-at-k": (
        "ai-agents/pass-at-k",
        "## Core idea",
        "k",
        """flowchart LR
  t1[Trial 1] --> any{any pass?}
  t2[Trial 2] --> any
  t3[Trial 3] --> any
  any -->|pass@k| hope[At least one]
  t1 --> all{all pass?}
  t2 --> all
  t3 --> all
  all -->|pass^k| slo[Every time]
""",
        """title: Hope vs SLO
steps:
  - caption: "pass@k: one success in k tries. Tools can live here."
    nodes: [t1, t2, t3, any, hope]
  - caption: "pass^k: every trial succeeds. That is a product SLO."
    nodes: [all, slo]
""",
    ),
    "outcome-vs-transcript": (
        "ai-agents/outcome-vs-transcript",
        "## Core idea",
        "grade",
        """flowchart TB
  agent[Agent] --> talk[Transcript]
  agent --> world[Environment]
  talk --> maybe[Looks done]
  world --> truth[Refund row]
  maybe --> wrong[False pass]
  truth --> real[Real pass]
""",
        """title: Believe the database
steps:
  - caption: "The transcript can lie with a confident sentence."
    nodes: [agent, talk, maybe, wrong]
  - caption: "The outcome is state in the world. Grade that."
    nodes: [world, truth, real]
""",
    ),
    "rag-vs-agents": (
        "ai-agents/rag-vs-agents",
        "## Core idea",
        "split",
        """flowchart LR
  q[Question] --> rag[Retrieve then answer]
  q --> agent[Plan, tools, loop]
  rag --> doc[Citations]
  agent --> act[Side effects]
""",
        """title: Lookup vs job
steps:
  - caption: "RAG is fetch-then-speak. Cite the passage."
    nodes: [q, rag, doc]
  - caption: "An agent is a loop with tools and a world that changes."
    nodes: [q, agent, act]
""",
    ),
    "tool-calling": (
        "ai-agents/tool-calling",
        "## Core idea",
        "call",
        """flowchart LR
  model[Model] --> schema[Tool schema]
  schema --> exec[Harness executes]
  exec --> obs[Observation]
  obs --> model
  exec --> ir[Irreversible?]
  ir -->|yes| confirm[Confirm]
""",
        """title: Schema, execute, observe
steps:
  - caption: "The model picks a tool and fills the schema."
    nodes: [model, schema]
  - caption: "The harness runs it and feeds the observation back."
    nodes: [exec, obs, model]
  - caption: "Irreversible tools need a confirm, not a vibe."
    nodes: [ir, confirm]
""",
    ),
}


def deepen(text: str) -> str:
    out = []
    for line in text.splitlines(True):
        if "](viz/" in line:
            out.append(line)
            continue
        line = line.replace("](../", "](\x00../")
        line = line.replace("](./", "](../")
        line = line.replace("](\x00../", "](../../")
        out.append(line)
    return "".join(out)


def convert(lesson_id: str, rel: str, heading: str, stem: str, mermaid: str, steps: str) -> None:
    src = ROOT / f"{rel}.md"
    dest_dir = ROOT / rel
    lesson = dest_dir / "lesson.md"
    if lesson.exists():
        print("skip exists", rel)
        return
    if not src.exists():
        print("missing", src)
        return
    text = deepen(src.read_text())
    embed = f"\n[{stem}](viz/{stem}.md)\n"
    needle = heading + "\n"
    if needle in text:
        text = text.replace(needle, needle + embed, 1)
    else:
        text = text + embed
    dest_dir.mkdir(parents=True, exist_ok=True)
    viz = dest_dir / "viz"
    viz.mkdir(exist_ok=True)
    (viz / f"{stem}.md").write_text(f"# {stem}\n\n```mermaid\n{mermaid.strip()}\n```\n")
    (viz / f"{stem}.steps.yaml").write_text(steps if steps.endswith("\n") else steps + "\n")
    lesson.write_text(text)
    src.unlink()
    print("converted", rel)


def rewrite_incoming(lesson_id: str, rel: str) -> None:
    name = Path(rel).name
    parent = str(Path(rel).parent)
    repls = [
        (f"](./{name}.md)", f"](./{name}/lesson.md)"),
        (f"](../{name}.md)", f"](../{name}/lesson.md)"),
        (f"](./{Path(rel).as_posix()}.md)", f"](./{rel}/lesson.md)"),
        (f"](../{Path(rel).as_posix()}.md)", f"](../{rel}/lesson.md)"),
    ]
    # common relative forms
    for p in ROOT.rglob("*.md"):
        if "/viz/" in str(p):
            continue
        t = p.read_text()
        n = t
        for a, b in repls:
            n = n.replace(a, b)
        # patterns like ../cases/url-shortener.md
        n = n.replace(f"](../{rel}.md)", f"](../{rel}/lesson.md)")
        n = n.replace(f"](../../{rel}.md)", f"](../../{rel}/lesson.md)")
        n = n.replace(f"](./{rel}.md)", f"](./{rel}/lesson.md)")
        if n != t:
            p.write_text(n)


def main() -> None:
    for lid, spec in SEED.items():
        convert(lid, *spec)
        rewrite_incoming(lid, spec[0])


if __name__ == "__main__":
    main()
