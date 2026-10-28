---
id: rag-pipeline
title: Build retrieval that the answer can cite
slug: rag-pipeline
kind: concept
track: ai-agents
difficulty: core
estimated_minutes: 18
summary: Chunk documents with their metadata, retrieve and rerank under access filters, cite chunk ids, and evaluate retrieval separately from generation.
tags:
  - ai-agents
  - ai-agents/retrieval
  - ai-agents/evals
  - system-design
  - system-design/genai
  - interviews
  - interviews/ai
prerequisites:
  - embeddings-vector-search
related:
  - embeddings-vector-search
  - rag-vs-agents
  - docs-assistant
  - graders
  - prompt-injection-guardrails
company_signal: []
sources_consulted:
  - https://arxiv.org/abs/2005.11401
  - https://arxiv.org/abs/2307.03172
  - https://arxiv.org/abs/2309.15217
updated: 2026-10-28
status: canonical
---

# Build retrieval that the answer can cite

## Snapshot

- Retrieval-augmented generation (RAG) fetches relevant passages at question time and puts them in the prompt, so answers can use current, private text the model was never trained on.
- **Chunking** decides what can be found. Split on structure (headings, sentences), keep metadata, and test chunk size on real questions.
- A typical read path is **retrieve wide, rerank narrow, generate with citations**, then check that each citation points at a supplied chunk.
- Evaluate **retrieval** (did the right chunk arrive?) and **generation** (is the answer supported by what arrived?) separately, or you cannot tell which half failed.

## Why it shows up in interviews

"Add a chatbot over our docs" is one of the most common applied-AI design prompts. A strong answer goes beyond "embed and ask": it covers what a chunk is, how access control and freshness flow through the index, what the model is told to do with weak evidence, and how you would know retrieval is the bottleneck.

## Core idea

### ELI5

An open-book exam. Before answering, a librarian pulls the few pages most likely to help. You answer only from those pages and write the page number next to each claim. If the pages do not cover the question, you say so.

1. Ahead of time: cut documents into passages, label each with source, section, version, and who may read it, then index them.
2. At question time: find candidate passages the asker may read, keep the best few, and give them to the model with ids.
3. The model answers using only those passages and cites ids. Code checks that the ids exist in what was supplied.

[Follow the write and read paths](viz/flow.md)

### Chunking

Small chunks match precisely but lose context ("it is 10 days" — what is?). Large chunks carry context but dilute similarity and crowd the window. Practical moves: split on headings and sentence boundaries, prepend the document title and section heading to each chunk, use a small overlap so a sentence cut at a boundary still appears whole somewhere, and keep tables or code blocks intact.

```ts
// Split a policy page into overlapping word windows, keeping the heading on every chunk
function chunk(heading: string, text: string, size: number, overlap: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  const step = size - overlap;
  for (let start = 0; start < words.length; start += step) {
    out.push(`${heading}: ${words.slice(start, start + size).join(" ")}`);
    if (start + size >= words.length) break;
  }
  return out;
}

const refunds =
  "Refunds go to the original card within 10 business days. Gift card purchases are refunded as store credit. " +
  "Orders marked final sale cannot be refunded.";
for (const c of chunk("Refunds", refunds, 12, 3)) console.log(c);
```

The output shows the weakness of fixed windows: chunk 0 ends on "Gift card" mid-sentence. The 3-word overlap rescues it here because chunk 1 starts with "days. Gift card". A sentence-aware splitter would avoid the cut entirely. Word counts stand in for tokens to keep the sample readable.

### Retrieve, rerank, generate

- **Retrieve wide:** hybrid keyword + vector search for, say, 30–50 candidates, with the access filter from the verified user applied in the query.
- **Rerank narrow:** a cross-encoder or a model-based reranker scores (question, chunk) pairs jointly, which is more accurate than comparing two independent vectors but too slow for the whole corpus. Keep the top 4–8.
- **Order and label:** give each chunk an id and source. Models can underuse material in the middle of a long context, so fewer, better chunks often beat many.
- **Generate:** instruct the model to answer from the supplied chunks, cite ids per claim, and say it cannot find the answer when the chunks do not support one. Retrieved text is data; instructions inside it are not followed.
- **Check:** reject or repair answers whose cited ids were not supplied; optionally verify that the cited chunk supports the sentence.

### Evaluate the halves separately

Build a set of real questions, each labeled with the chunk ids that contain the answer.

```ts
function recallAtK(retrieved: string[][], gold: string[][], k: number): number {
  let hits = 0;
  for (let q = 0; q < gold.length; q++) {
    const top = new Set(retrieved[q].slice(0, k));
    if (gold[q].some(id => top.has(id))) hits++;
  }
  return hits / gold.length;
}

const gold = [["refunds#0"], ["refunds#1"], ["shipping#2"], ["refunds#2"]];
const retrieved = [
  ["refunds#0", "shipping#0", "refunds#1"],
  ["returns#4", "refunds#1", "refunds#0"],
  ["shipping#0", "shipping#1", "returns#4"],
  ["refunds#0", "refunds#1", "refunds#2"],
];
console.log("recall@1", recallAtK(retrieved, gold, 1)); // 0.25
console.log("recall@3", recallAtK(retrieved, gold, 3)); // 0.75
```

Then evaluate generation **given the gold chunks** (so retrieval cannot be blamed): is every claim supported, is the question answered, are citations correct? Finally evaluate end to end. If recall@k is low, fix chunking, query rewriting, or hybrid weights. If recall is high but answers are wrong, fix the prompt, the reranker's cut, or the model.

## Worked example

### Easy

"How long do refunds take?" retrieves `refunds#0`. The answer says "within 10 business days to the original card [refunds#0]". The citation exists in the supplied set; done.

### Medium

"Can I get a refund on a gift card?" The question about gift cards lands near `refunds#0` and `refunds#1`; the gold chunk is `refunds#1`. With k=1 the model only sees `refunds#0` and answers about card refunds. With reranking over a top-10 candidate set, `refunds#1` moves to first. The fix was retrieval, not the prompt.

### Hard

The final-sale rule was edited yesterday, but the answer quotes last month's version. Trace it: the ingest job re-embedded the new version but never deleted the old chunk, so both live in the index. Key chunks by (doc id, version), write a tombstone for superseded versions, and add a freshness check to the eval set: a question whose correct answer changed in the latest edit.

**Practice:** your recall@5 is 0.92 but users say answers are wrong a third of the time. Name the next two measurements you would run and what each result would tell you.

## Common mistakes

- Chunking by fixed size with no headings, so a chunk cannot be understood alone.
- Applying permissions after generation instead of in the retrieval query.
- Stuffing 30 chunks into the prompt and hoping the model finds the right one.
- Reporting only an end-to-end score, so retrieval and generation failures blur together.
- Trusting citation markers without checking they refer to supplied chunks.
- Keeping stale versions in the index after documents change or are deleted.

## How to talk about it

"I treat RAG as two systems. Retrieval: chunk on structure with metadata, hybrid search under the user's access filter, rerank to a handful. Generation: answer only from cited chunk ids, and abstain when the evidence is thin. I measure recall@k on labeled questions and answer faithfulness on gold context separately, so I know which half to fix."

## Cross-links

- [Find nearby meaning with vectors and filters](../embeddings-vector-search.md) (id: embeddings-vector-search)
- [Choose retrieval, a workflow, or an adaptive loop](../rag-vs-agents/lesson.md) (id: rag-vs-agents)
- [Answer support questions from internal docs](../docs-assistant/lesson.md) (id: docs-assistant)
- [Treat retrieved text as data, not orders](../prompt-injection-guardrails/lesson.md) (id: prompt-injection-guardrails)
- [Choose a grader for the evidence available](../graders/lesson.md) (id: graders)
- [Choose prompting, retrieval, or fine-tuning](../fine-tune-vs-prompt-vs-retrieve.md) (id: fine-tune-vs-prompt-vs-retrieve)
