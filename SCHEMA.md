# Lesson schema

Every lesson is one Markdown file. The Codeatrophy app parses this schema. Do not invent extra top-level keys. Do not omit required keys.

## File location

```
lessons/<track>/<optional-group>/<id>.md
```

`id` matches the filename without `.md`. IDs are unique across the whole repo.

## Frontmatter (YAML, required)

```yaml
---
id: two-sum
title: Pair lookup instead of nested scanning
slug: two-sum
kind: problem
track: algorithms
difficulty: intro
estimated_minutes: 12
summary: Find two values that add to a target by remembering what you still need, not by checking every pair.
tags:
  - algorithms
  - algorithms/hash-maps
  - interviews/leetcode
prerequisites:
  - hash-maps
related:
  - three-sum
  - two-pointers
company_signal:
  - name: Meta
    evidence: Candidate reports and LeetCode company tags consistently list pair-sum / hash-index problems in phone screens.
    year: 2026
    confidence: high
sources_consulted:
  - Blind 75 / NeetCode pattern lists (2026)
  - r/leetcode company-tagged prep threads
updated: 2026-09-02
status: canonical
---
```

### Field rules

| Field | Type | Rules |
| --- | --- | --- |
| `id` | string | kebab-case, unique, equals filename |
| `title` | string | Original teaching title, not a LeetCode title dump |
| `slug` | string | equals `id` |
| `kind` | enum | `pattern` `problem` `concept` `case-study` `strategy` `glossary` |
| `track` | enum | `algorithms` `system-design` `ai-agents` `cs` |
| `difficulty` | enum | `intro` `core` `deep` |
| `estimated_minutes` | int | 8–25 |
| `summary` | string | one sentence, no trailing period required but preferred |
| `tags` | string[] | nested paths, parent tags included (see TAGS.md) |
| `prerequisites` | string[] | other lesson `id`s; empty list allowed |
| `related` | string[] | other lesson `id`s; at least 2 |
| `company_signal` | object[] | may be empty; never claim official leaked questions |
| `sources_consulted` | string[] | what was read, not quoted |
| `updated` | date | ISO `YYYY-MM-DD` |
| `status` | enum | `canonical` |

`company_signal.confidence`: `high` (many independent reports), `medium` (repeated in prep sites + some reports), `low` (single thread / rumor).

## Body (required H2s by kind)

Use exactly these H2 headings, in this order. H3s are allowed under them. No H1 other than the title.

### `pattern` and `problem`

1. `# <title>` (must match frontmatter title)
2. `## Snapshot` — 3–5 bullet facts
3. `## Prompt` — original restatement of the task. Never paste LeetCode / Grokking wording.
4. `## Recognition signals` — table: cue → why it matters
5. `## Worked approach` — prose + one original code sample
6. `## Complexity` — table: approach / time / space / notes
7. `## Walkthrough` — numbered steps on an original example
8. `## Pitfalls` — table: trap / what happens / fix
9. `## Interview moves` — how to talk while solving
10. `## Cross-links` — markdown links to other lessons using relative paths, plus `id:` in the link text or a trailing `(id: foo)`

### `case-study` (system design)

1. `# <title>`
2. `## Snapshot`
3. `## What this round is actually scoring`
4. `## Company signal` — labeled as candidate-reported
5. `## Requirements` — functional / non-functional tables
6. `## Back-of-envelope`
7. `## Design` — components, data, paths. Original names, not copied diagrams.
8. `## Tradeoffs` — table
9. `## Failure modes`
10. `## Follow-ups an interviewer may ask`
11. `## Cross-links`

### `concept` and `strategy` and `glossary`

1. `# <title>`
2. `## Snapshot`
3. `## Why it shows up in interviews`
4. `## Core idea`
5. `## Worked example` or `## Comparison` (table required)
6. `## Common mistakes`
7. `## How to talk about it`
8. `## Cross-links`

## Cross-link format

```md
- [Hash maps as an index](../patterns/hash-maps.md) (id: hash-maps)
- [Three-value search](./three-sum.md) (id: three-sum)
```

Relative path must resolve. `id:` must match the target file's frontmatter `id`.

## Originality rules

- Restate every classic problem in a new domain (warehouse bins, ticket stubs, chat receipts, GPS pings).
- Invent the numeric walkthrough. Do not use `[2,7,11,15] target 9`.
- Teach the idea; do not paste a famous editorial.
- Company names appear only in `company_signal` or "Company signal" with evidence and confidence.
- Short quotes from public essays are allowed only if clearly attributed and under 20 words. Prefer paraphrase.

## Code

- TypeScript or Python. One language per file.
- No imports of interview-site helper types.
- Keep samples under ~40 lines unless the topic is a full design sketch.
