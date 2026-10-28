---
id: docs-assistant
title: Answer support questions from internal docs
slug: docs-assistant
kind: case-study
track: ai-agents
difficulty: core
estimated_minutes: 22
summary: Design a cited question-answering assistant for support staff over internal docs, with permission-aware retrieval, fast freshness, an honest no-answer path, and separate retrieval and answer evaluation.
tags:
  - ai-agents
  - ai-agents/retrieval
  - ai-agents/product
  - ai-agents/evals
  - system-design
  - system-design/genai
  - interviews
  - interviews/ai
  - interviews/system-design
prerequisites:
  - rag-pipeline
  - embeddings-vector-search
related:
  - rag-pipeline
  - embeddings-vector-search
  - prompt-injection-guardrails
  - online-offline-evals
  - search-autocomplete
company_signal: []
sources_consulted:
  - https://arxiv.org/abs/2005.11401
  - https://arxiv.org/abs/2307.03172
  - https://arxiv.org/abs/2309.15217
updated: 2026-10-28
status: canonical
---

# Answer support questions from internal docs

## Snapshot

- Support agents ask questions in their ticket console and get a short answer with links to the exact doc sections used.
- Retrieval respects document permissions at query time; restricted runbooks never reach the prompt for people outside the group.
- Edits and deletions show up in answers within minutes, not at the next nightly rebuild.
- When evidence is weak, the assistant says it found nothing and points to escalation instead of guessing.
- Quality is measured as retrieval recall, answer faithfulness, and real-world feedback, each with its own owner.

## What this round is actually scoring

Whether you can turn "chat over our docs" into a system with explicit data flow: ingestion and freshness, permission filtering inside retrieval, a generation contract with citations and abstention, and an evaluation plan that tells you which component to fix. A plain "embed everything and ask the model" answer misses most of the points.

## Company signal

This is an original practice scenario. No traceable company-specific frequency evidence is supplied.

## Requirements

### Functional

| Area | Requirement |
| --- | --- |
| Ask | Agent types a question; the open ticket's product, plan, and locale are passed as context |
| Answer | Two to six sentences, each claim cited to a doc section; links open the source |
| Permissions | Docs carry group ACLs (for example, a fraud-operations runbook is visible only to that team); answers use only docs the asker may read |
| Freshness | Edits, ACL changes, and deletions reflected within 15 minutes |
| No answer | Explicit "not found in docs" with the closest links and an escalation option |
| Feedback | Helpful / wrong / outdated buttons, with optional comment |

### Non-functional

| Area | Target (assumed) |
| --- | --- |
| Latency | First token under 2 s, complete answer under 6 s at p95 |
| Availability | If the model provider is down, fall back to ranked search results |
| Privacy | Customer personal data in the ticket is minimized before it goes to the model; logs are access-controlled and expire |
| Safety | The assistant never sends anything to customers; the agent copies or edits the text |

## Back-of-envelope

These are illustrative assumptions for practice, not measurements.

- **Corpus:** 40,000 documents (help center articles, internal runbooks, macros, release notes) averaging 2,500 tokens: about 100 million tokens.
- **Chunks:** about 400 tokens with some overlap, so roughly 300,000 chunks.
- **Vectors:** at 1,024 dimensions in float32, 4 KiB each: about 1.2 GB raw, plus index overhead. One node holds it in memory; run replicas for availability.
- **Change rate:** 1% of docs edited per day is 400 docs, about 1 million tokens to re-chunk and re-embed daily. Cheap; freshness is a pipeline-latency problem, not a cost problem.
- **Queries:** 600 agents × 25 questions per shift = 15,000/day. Over a 10-hour window that is about 0.4 queries/s on average; assume a 4x peak near 1.7/s.
- **Tokens per answer:** 800 instructions + 500 ticket context + 6 chunks × 400 = about 3,700 input and 300 output. Daily: about 56 million input and 4.5 million output tokens. Price it with current rates for the tiers you are considering; the stable instruction prefix is a caching candidate.

## Design

### ELI5

A librarian who checks your badge before pulling binders, only quotes pages you are allowed to read, writes the page number next to every sentence, and says "we do not have a page on that" instead of improvising.

[Follow one question](viz/ask.md)

### Ingestion

- **Connectors** for the wiki, help center, and macro store emit change events (create, update, delete, ACL change). A nightly reconcile compares source and index to catch missed events.
- **Parse and chunk** on headings; keep tables and procedure lists intact. Prepend document title and section path to each chunk.
- **Metadata per chunk:** `doc_id`, `version`, `section`, `groups` (ACL), `product`, `locale`, `updated_at`, `source_url`.
- **Index:** keyword (BM25) and vector indexes over the same chunk ids. New versions are written, then old versions are tombstoned atomically per document so search never sees both or neither.
- **ACL-only changes** update metadata without re-embedding.

### Query path

1. **Identity:** resolve the agent and their groups from the identity provider (cached for minutes, not hours). The model never supplies these.
2. **Query rewrite:** combine the question with ticket fields ("plan: Business, locale: de-DE") into a search query. Minimize customer data: the model does not need the customer's name to find a refund policy.
3. **Retrieve wide:** hybrid search for about 40 candidates, filtered by `groups ∩ asker's groups`, locale, and product. The filter is part of the index query so the result still holds 40 allowed chunks.
4. **Rerank** to 6 with a cross-encoder or model-based reranker.
5. **Threshold:** if the best reranked score is under a level calibrated on labeled questions, skip generation and return "not found" with the top links.
6. **Generate:** instructions say to answer only from supplied chunks, cite chunk ids per sentence, treat chunk text as data, and abstain when the chunks do not answer the question.
7. **Verify:** every cited id must be in the supplied set and its document version still live; otherwise drop the claim or fall back to "not found".
8. **Render:** answer with source links; log question, chunk ids, answer, and latency (not full customer data) for evaluation.

### Evaluation

- **Retrieval set:** 400 real past questions labeled with the doc sections that answer them, plus 60 with no answer in the docs. Track recall@6 after reranking and the false-answer rate on no-answer questions.
- **Answer set:** for the same questions, give the model the gold chunks and grade faithfulness (every claim supported) and completeness, with a calibrated judge and periodic human review.
- **Freshness checks:** questions whose answer changed in a recent edit; the new version must win.
- **Permission checks:** questions asked by users outside a restricted group must never cite restricted chunks. This is a zero-tolerance test, not an average.
- **Online:** feedback rates, "outdated" flags routed to doc owners, and how often agents still escalate after reading the answer.

## Tradeoffs

| Choice | Benefit | Cost |
| --- | --- | --- |
| ACL filter inside retrieval | No restricted text ever enters the prompt | Filtered ANN can lose recall for small groups; may need exact-scan fallback |
| Change events plus nightly reconcile | Minutes-level freshness with a safety net | Two paths to operate and monitor |
| Hybrid keyword + vector search | Catches error codes and paraphrases | Two indexes and a fusion step to tune |
| Reranking to 6 chunks | Better precision, shorter prompt | Extra latency (often a few hundred ms) |
| Score threshold before generation | Honest no-answer path, saves tokens | Threshold must be recalibrated when models change |
| Citation verification in code | Catches invented or stale citations | Some correct answers are dropped when a citation is malformed |

## Failure modes

- **Stale answer after an edit:** ingest lag or a missed event. Alert on event-to-index latency; reconcile nightly; freshness eval cases.
- **Restricted runbook leaks:** filter applied after retrieval, or group cache too old after someone leaves a team. Filter in the query, short cache TTL, permission tests in CI.
- **Injected instructions in a wiki page:** internal docs are editable by many people. Treat chunks as data, give the assistant no tools beyond search, and render only allowlisted links.
- **Embedding model upgrade:** old and new vectors are incompatible. Build a parallel index, compare recall@6 on the eval set, then switch reads.
- **Provider outage or timeout:** show ranked search results with snippets so agents are not blocked.
- **Confident wrong answer from an outdated but live doc:** the system is faithful to a bad source. Route "outdated" feedback to the doc owner with the chunk id.

## Follow-ups an interviewer may ask

**Easy:** why not put all 40,000 docs in a very large context window instead of retrieving? (Cost per query, latency, permission filtering, and models underusing material buried in long contexts.)

**Medium:** an agent moves from the fraud team to general support. Walk through what must change, and how quickly, for their answers to stop using fraud runbooks.

**Hard:** leadership wants the assistant to answer customers directly in chat. What changes in requirements, guardrails, evaluation thresholds, and rollout?

## Cross-links

- [Build retrieval that the answer can cite](../rag-pipeline/lesson.md) (id: rag-pipeline)
- [Find nearby meaning with vectors and filters](../embeddings-vector-search.md) (id: embeddings-vector-search)
- [Treat retrieved text as data, not orders](../prompt-injection-guardrails/lesson.md) (id: prompt-injection-guardrails)
- [Combine controlled tests with production evidence](../online-offline-evals.md) (id: online-offline-evals)
- [Calibrate a judge on held-out decisions](../llm-as-judge-calibration.md) (id: llm-as-judge-calibration)
- [Serve useful suggestions within a latency budget](../../system-design/cases/search-autocomplete/lesson.md) (id: search-autocomplete)
