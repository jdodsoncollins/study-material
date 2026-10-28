---
id: llm-basics
title: Predict a token, sample it, repeat
slug: llm-basics
kind: concept
track: ai-agents
difficulty: intro
estimated_minutes: 14
summary: Explain tokens, the shared context window, temperature and sampling, and why the same prompt can return different text.
tags:
  - ai-agents
  - ai-agents/models
  - interviews
  - interviews/ai
prerequisites: []
related:
  - prompting-structured-output
  - cost-latency-budgets
  - pass-at-k
  - llm-serving
company_signal: []
sources_consulted:
  - https://arxiv.org/abs/1706.03762
  - https://arxiv.org/abs/1508.07909
  - https://arxiv.org/abs/1904.09751
updated: 2026-10-28
status: canonical
---

# Predict a token, sample it, repeat

## Snapshot

- A model reads and writes **tokens**: subword pieces from a fixed vocabulary, not words or characters.
- Each step produces a score for every possible next token; a **sampler** picks one, appends it, and the loop repeats.
- Input and output tokens share one **context window**. Anything outside it does not exist for that call.
- **Temperature** and similar settings reshape the probabilities. Variation between runs is expected behavior, and serving systems may not guarantee identical output even at temperature 0.

## Why it shows up in interviews

Every later design question leans on these facts. Cost is priced per token. Latency grows with output length because generation is sequential. A "flaky" classifier is often a sampling decision. A chat that "forgot" the first message usually overflowed or was trimmed. An interviewer wants to hear you reason from the mechanism instead of treating the model as a black box that sometimes misbehaves.

## Core idea

### ELI5

Picture autocomplete on your phone, run in a loop. The model looks at everything typed so far, guesses how likely each next piece is, and one piece is chosen. That piece is added to the text and the model guesses again. It stops at a stop token, a stop sequence, or a length cap.

1. Split the text into tokens.
2. Score every token in the vocabulary as the next one.
3. Turn scores into probabilities; temperature sharpens or flattens them.
4. Pick one token (most likely, or a random draw weighted by probability).
5. Append it and go back to step 2.

### Tokens

Tokenizers such as byte-pair encoding build a vocabulary of frequent character sequences. Common English words are often one token; rare words, code identifiers, numbers, and many non-English scripts split into several. "About four characters per token" is a rough English heuristic for some tokenizers, not a rule. Count with the tokenizer your provider documents when money or limits depend on it.

### The context window

The window is a cap on total tokens the model can attend to in one call: system instructions, conversation history, retrieved documents, tool definitions, tool results, and the answer it is writing. Most APIs also take a separate maximum output length. If the prompt uses most of the window, the answer has little room, and a long history must be trimmed or summarized by your code. The model keeps no memory between calls; a chat product resends the conversation every turn.

### Sampling and temperature

The model outputs raw scores (logits). Softmax turns them into probabilities. Dividing the logits by a temperature before softmax changes the shape: below 1 concentrates probability on the top choice, above 1 spreads it out. Temperature 0 is usually treated as "always pick the top token" (greedy). Top-p (nucleus) sampling keeps only the smallest set of tokens whose probabilities add to p, then draws from that set.

```ts
// Next-token scores after "Your order has": shipped, arrived, been
function softmax(logits: number[], temperature: number): number[] {
  const scaled = logits.map(x => x / temperature);
  const max = Math.max(...scaled);
  const exps = scaled.map(x => Math.exp(x - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(x => Number((x / sum).toFixed(3)));
}

const logits = [2.0, 1.0, 0.5];
console.log("t=1.0", softmax(logits, 1.0)); // [0.629, 0.231, 0.14]
console.log("t=0.5", softmax(logits, 0.5)); // sharper
console.log("t=2.0", softmax(logits, 2.0)); // flatter
```

### Why outputs vary

With sampling on, a different random draw early in the answer changes every later step, because each token conditions the next. Even with greedy decoding, providers may batch your request with others, change hardware, or update the model behind an alias; floating-point differences can flip a near-tie. Treat determinism as something to measure, not assume. If you need repeatable behavior, pin the model version where the provider allows it, lower temperature, constrain the output format, and test across several runs.

```ts
// Same probabilities, three different random draws (a seeded generator stands in for the sampler)
function draw(probs: number[], r: number): number {
  let acc = 0;
  for (let i = 0; i < probs.length; i++) {
    acc += probs[i];
    if (r < acc) return i;
  }
  return probs.length - 1;
}

const words = ["shipped", "arrived", "been"];
const probs = [0.629, 0.231, 0.14];
for (const r of [0.12, 0.71, 0.93]) console.log(r, "->", words[draw(probs, r)]);
```

## Worked example

### Easy

A support chat sends 1,200 tokens of instructions, 5,400 tokens of history, and asks for up to 1,000 output tokens. With an illustrative 8,000-token window, 7,600 tokens are committed and the call fits. Add a 900-token pasted order log and it does not; your code must trim history, summarize it, or reject the paste before calling.

### Medium

A ticket router labels "refund for a double charge" as `billing` in 18 of 20 runs and `account` in 2. That is not a mystery: at a nonzero temperature the second label had real probability. Lower the temperature, give one clear example of each label, constrain the output to the label set, and measure again on the full test set rather than one rerun.

### Hard

The team sets temperature 0 and still sees one label change after a provider's weekend update. Explain that the alias now points at a different model snapshot, or serving changes broke a near-tie. Pin a dated model version if offered, keep a regression set, and report consistency as "k of n runs agree" instead of promising determinism.

**Practice:** explain to a product manager, in four sentences, why their two screenshots of the same prompt show different answers, and what you would change if the feature needs the same answer every time.

## Common mistakes

- Estimating cost or limits with word counts instead of the provider's token counts.
- Forgetting that output tokens and tool results consume the same window.
- Assuming the model remembers earlier calls; only resent text is visible.
- Treating temperature 0 as a guarantee of identical output.
- Judging a prompt change from one run of each version.

## How to talk about it

"The model scores possible next tokens and a sampler picks one, so every answer is a sequence of draws inside a fixed token budget. I will count tokens with the real tokenizer, leave room for the output, choose sampling settings for the task, and measure variation over repeated runs."

## Cross-links

- [Ask for structure, then verify it](./prompting-structured-output.md) (id: prompting-structured-output)
- [Do the token math before picking a model](./cost-latency-budgets.md) (id: cost-latency-budgets)
- [Decide what the model sees each turn](./agent-memory-context/lesson.md) (id: agent-memory-context)
- [Success across one attempt, retries, and repeated runs](./pass-at-k/lesson.md) (id: pass-at-k)
- [Budget model memory and schedule streamed generation](../system-design/cases/llm-serving/lesson.md) (id: llm-serving)
- [Floats are scientific notation, not decimals](../cs/floating-point.md) (id: floating-point)
