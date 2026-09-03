# study-material — agent notes

Public interview corpus consumed by [Codeatrophy](https://github.com/jdodsoncollins/Codeatrophy). You write **lessons**, not app UI. The app downloads this repo; it never writes back.

Read [SCHEMA.md](./SCHEMA.md) before adding or editing a lesson. Tags: [TAGS.md](./TAGS.md). Index: [catalog.json](./catalog.json). After any lesson or viz change, run:

```bash
node scripts/build-catalog.mjs
```

That script must exit 0. It is the parser the app trusts.

## Lessons

- Original writeups. Restate common problems (two-sum, URL shortener, news feed) in a new domain and new numbers. Do not paste LeetCode / Grokking / Hello Interview / Alex Xu text.
- Frontmatter keys are closed. Do not invent extra top-level keys. `id` = filename (flat) or parent directory (`lesson.md`).
- Required H2s and order depend on `kind` — see SCHEMA.md.
- Nested tags include parents (`algorithms` and `algorithms/hash-maps`).
- Cross-links: relative `.md` path plus `(id: foo)`. Incoming links to a directory lesson use `…/<id>/lesson.md`.
- Company names only in `company_signal` (or the case-study “Company signal” section), labeled candidate-reported, with `confidence`.

## Viz (on demand)

Do **not** migrate every lesson into a directory. Convert when a figure would actually teach.

```
lessons/<track>/…/<id>/lesson.md
lessons/<track>/…/<id>/viz/<stem>.md          # mermaid fence — GitHub renders this file
lessons/<track>/…/<id>/viz/<stem>.steps.yaml  # optional highlight steps
```

Embed from `lesson.md` with a GitHub-native link, alone on a line:

```md
[Walk the bins](viz/walk.md)
```

`{{viz: walk}}` is an alias. No XML. Steps highlight mermaid **node ids** in that diagram (`nodes: [scan, hit]`). Catalog fails if an embed has no file, and if a `viz/*.md` is never referenced.

Proof lessons: `two-sum`, `news-feed`, `eval-harness-vs-agent-harness`.

## Don’t

- Edit Codeatrophy from this repo.
- Put secrets or user notes in lessons.
- Treat files under `viz/` as lessons.
- Claim official leaked company questions.
