---
id: embeddings-vector-search
title: Find nearby meaning with vectors and filters
slug: embeddings-vector-search
kind: concept
track: ai-agents
difficulty: core
estimated_minutes: 15
summary: Turn text into vectors, rank by similarity, trade recall for speed with approximate indexes, and apply metadata filters without losing results.
tags:
  - ai-agents
  - ai-agents/retrieval
  - cs
  - cs/data-structures
  - interviews
  - interviews/ai
prerequisites:
  - llm-basics
related:
  - rag-pipeline
  - rag-vs-agents
  - indexes
  - search-autocomplete
company_signal: []
sources_consulted:
  - https://arxiv.org/abs/1603.09320
  - https://arxiv.org/abs/1702.08734
  - https://github.com/pgvector/pgvector
updated: 2026-10-28
status: canonical
---

# Find nearby meaning with vectors and filters

## Snapshot

- An **embedding model** maps text to a fixed-length vector; texts with similar meaning land near each other.
- **Cosine similarity** compares direction and ignores length. On unit-length vectors it equals the dot product.
- Exact search compares the query with every vector. **Approximate nearest neighbor (ANN)** indexes skip most of them and trade some recall for speed.
- **Metadata filters** (tenant, team, language, date) must be applied in a way that still returns k allowed results.
- Vectors from different embedding models, or different versions of one model, are not comparable. Changing models means re-embedding the corpus.

## Why it shows up in interviews

Retrieval-augmented features, semantic search, deduplication, and "similar tickets" all reduce to vector search. Interviewers check whether you know what the score means, why "nearest" can still be irrelevant, how an index trades accuracy for latency, and how access control interacts with a top-k query.

## Core idea

### ELI5

Give every help article a pin on a huge map, placed so articles about the same thing sit close together. A question also gets a pin. Search means "find the pins closest to the question's pin". A filter means "only look at pins of this color". An approximate index is a set of shortcuts across the map so you do not measure the distance to every pin.

1. Embed each document chunk once, at write time. Store the vector with its id and metadata.
2. At query time, embed the question with the **same** model.
3. Score candidates by similarity, keep the top k, and check that the best score is good enough to use.

### Similarity

Cosine similarity is the dot product divided by both lengths. It ranges from -1 to 1; in practice many text embedding models produce mostly positive scores, so the absolute value is model-specific. Compare scores from one model on one corpus, and set any threshold from labeled examples, not intuition.

```ts
type Doc = { id: string; team: string; vec: number[] };

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na === 0 || nb === 0 ? 0 : dot / Math.sqrt(na * nb);
}

function search(query: number[], docs: Doc[], team: string, k: number) {
  return docs
    .filter(d => d.team === team)
    .map(d => ({ id: d.id, score: Number(cosine(query, d.vec).toFixed(3)) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

const docs: Doc[] = [
  { id: "refund-policy", team: "billing", vec: [0.9, 0.1, 0.2] },
  { id: "reset-password", team: "accounts", vec: [0.1, 0.9, 0.1] },
  { id: "invoice-pdf", team: "billing", vec: [0.4, 0.2, 0.9] },
  { id: "refund-eu", team: "billing", vec: [0.8, 0.3, 0.1] },
  { id: "chargeback-faq", team: "risk", vec: [0.85, 0.15, 0.2] },
];
const refundQuestion = [0.85, 0.2, 0.15];
console.log(search(refundQuestion, docs, "billing", 2));  // refund-policy 0.992, refund-eu 0.991
console.log(search(refundQuestion, docs, "accounts", 2)); // still returns reset-password at 0.347
console.log(cosine([1, 0], [0, 1]), cosine([2, 2], [1, 1])); // 0 and 1: length does not matter
```

Real vectors have hundreds or thousands of dimensions; three keep the arithmetic visible. Note the second call: nearest-neighbor search always returns *something*. Without a threshold, an unrelated article becomes "context".

### Approximate indexes, conceptually

- **Graph indexes** (HNSW is the common one) link each vector to some near neighbors across several layers. A query starts at an entry point and greedily walks toward closer nodes. A larger search breadth (often called `ef_search`) visits more nodes: better recall, more latency.
- **Cluster indexes** (IVF) group vectors around centroids. A query scans only the few nearest clusters (`nprobe`). Probing more clusters raises recall and cost.
- **Quantization** (for example product quantization) stores compressed vectors to save memory, at some loss of precision. Systems often rescore the top candidates with full vectors.

Measure ANN quality as **recall@k against exact search** on your own queries, at the latency you need. Parameter names and defaults differ by library; read the one you use.

### Filters

Suppose a user may only see `billing` documents and asks for the top 5.

- **Post-filter:** fetch the top 5 overall, then drop disallowed ones. You may return 1 result, or 0, even though 40 allowed matches exist further down.
- **Pre-filter:** restrict to allowed vectors first, then search. Correct, but a graph index built over all vectors may navigate poorly when most nodes are excluded; some engines fall back to exact scan or expand the search.
- **Partition:** a separate index or namespace per tenant when tenants never mix. Simple isolation, more indexes to operate.

For access control, the filter is a security boundary: it must use the caller's verified identity, and over-fetching must never leak disallowed text into the prompt.

### Dense, sparse, hybrid

Embeddings catch paraphrases ("money back" vs "refund"). Keyword scoring such as BM25 catches exact tokens embeddings blur: error codes, SKUs, names. Hybrid retrieval runs both and merges the lists (for example with reciprocal rank fusion). It is a common default for support and code search.

## Worked example

### Easy

"How do I get my money back?" matches `refund-policy` (0.992) and `refund-eu` (0.991) in the sample. Both are relevant; the near-tie is a hint that a reranker or the user's region should break it.

### Medium

The same query under the `accounts` filter returns `reset-password` at 0.347, far below the 0.99 range. Set a minimum score from labeled examples (say, the lowest score that was still judged relevant in a validation set) and answer "no matching article" below it.

### Hard

An inbox search index holds 50 million message chunks across 20,000 tenants. Post-filtering top-50 results for a small tenant often returns nothing. Choose between per-tenant partitions (strong isolation, many small indexes), filtered ANN with a fallback to exact search for small tenants, or a hybrid. Measure recall@10 per tenant-size bucket, not just the global average.

**Practice:** you switch to a newer embedding model. List what must be rebuilt, how you would run old and new indexes side by side, and what metric decides the cutover.

## Common mistakes

- Mixing vectors from two embedding models or versions in one index.
- Treating the top result as relevant without a threshold or "no answer" path.
- Post-filtering a small top-k and silently returning too few allowed results.
- Applying tenant filters from model-supplied arguments instead of the authenticated session.
- Tuning ANN settings without measuring recall against exact search.
- Using pure vector search for queries dominated by IDs, codes, or exact names.

## How to talk about it

"I embed chunks at write time and the query at read time with the same model, rank by cosine, and keep a minimum score so we can say 'not found'. For scale I use an ANN index and tune it against exact-search recall. Access filters come from the verified user and are applied before ranking, or in a way that still guarantees k allowed results."

## Cross-links

- [Build retrieval that the answer can cite](./rag-pipeline/lesson.md) (id: rag-pipeline)
- [Choose retrieval, a workflow, or an adaptive loop](./rag-vs-agents/lesson.md) (id: rag-vs-agents)
- [Indexes are precomputed answers](../cs/indexes.md) (id: indexes)
- [Serve useful suggestions within a latency budget](../system-design/cases/search-autocomplete/lesson.md) (id: search-autocomplete)
- [Answer support questions from internal docs](./docs-assistant/lesson.md) (id: docs-assistant)
- [Predict a token, sample it, repeat](./llm-basics.md) (id: llm-basics)
