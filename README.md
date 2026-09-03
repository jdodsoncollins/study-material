# study-material

Public interview study notes for [Codeatrophy](https://github.com/jdodsoncollins/Codeatrophy).

First corpus: **71 original lessons** with nested tags and cross-links.

| Track | What is in it |
| --- | --- |
| `lessons/algorithms` | 15 patterns, 9 problems, 1 prep strategy |
| `lessons/system-design` | 6 foundations, 12 company-shaped cases |
| `lessons/ai-agents` | Harnesses, evals, graders, agent failure modes |
| `lessons/cs` | Complexity, data structures, OS, networking, databases, concurrency |

Lessons are original writeups, not scraped editorials. Schema: [SCHEMA.md](./SCHEMA.md). Tags: [TAGS.md](./TAGS.md). Research log: [meta/RESEARCH.md](./meta/RESEARCH.md). Machine index: [catalog.json](./catalog.json) (regenerate with `node scripts/build-catalog.mjs`).

A lesson that needs a figure lives in a directory (`<id>/lesson.md` plus `viz/<stem>.md` mermaid companions and optional `viz/<stem>.steps.yaml` highlight steps). Convert on demand; the rest stay single files. GitHub renders the mermaid files. The Codeatrophy app inlines them and steps highlights.

Codeatrophy downloads this repo on launch. Personal notes and user tags live in the app, not in these files.
