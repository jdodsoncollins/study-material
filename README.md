# study-material

Public interview study notes for [Codeatrophy](https://github.com/jdodsoncollins/Codeatrophy).

Corpus: original lessons with nested tags, cross-links, and mermaid companions.

| Track | What is in it |
| --- | --- |
| `lessons/algorithms` | 15 patterns, 20 problems (Top 100 Liked drills on the path), 1 prep strategy |
| `lessons/system-design` | Foundations (including unique IDs), product cases (shortener, feed, blobs, crawler, …) |
| `lessons/ai-agents` | Harnesses, evals, tools, and a chat-clerk case |
| `lessons/cs` | Complexity, data structures, OS, HTTP/TCP, DNS, databases, concurrency |

Lessons are original writeups, not scraped editorials. Schema: [SCHEMA.md](./SCHEMA.md). Tags: [TAGS.md](./TAGS.md). Ordered path: [curriculum.json](./curriculum.json) (start left, interview on the right — not a public leetcode ladder). Research log: [meta/RESEARCH.md](./meta/RESEARCH.md). Machine index: [catalog.json](./catalog.json) (regenerate with `node scripts/build-catalog.mjs`).

A lesson that needs a figure lives in a directory (`<id>/lesson.md` plus `viz/<stem>.md` mermaid companions and optional `viz/<stem>.steps.yaml` highlight steps). Convert on demand; the rest stay single files. GitHub renders the mermaid files. The Codeatrophy app inlines them and steps highlights.

Codeatrophy downloads this repo on launch. Personal notes and user tags live in the app, not in these files.
