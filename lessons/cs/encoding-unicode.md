---
id: encoding-unicode
title: Bytes are not characters
slug: encoding-unicode
kind: concept
track: cs
difficulty: core
estimated_minutes: 13
summary: Separate UTF-16 units, Unicode code points, grapheme clusters, and UTF-8 bytes before counting, comparing, or truncating text.
tags:
  - cs
  - cs/data-structures
  - cs/networking
  - interviews
  - interviews/frontend
prerequisites: []
related:
  - http-and-tcp
  - hashing-internals
  - floating-point
  - two-pointers
company_signal: []
sources_consulted:
  - https://www.unicode.org/reports/tr29/
  - https://www.rfc-editor.org/rfc/rfc8259.html#section-8.1
updated: 2026-10-26
status: canonical
---

# Bytes are not characters

## Snapshot

- Unicode code points identify characters and other text elements. They are not byte positions.
- UTF-8 encodes Unicode scalar values in one to four bytes. Surrogate code points are not scalar values.
- JavaScript strings expose UTF-16 code units. One code point can occupy one or two units.
- A grapheme cluster approximates a user-perceived character and can contain multiple code points.

## Why it shows up in interviews

String length, truncation, byte limits, and equality are different requirements. A correct answer first specifies what “character” means for the operation: a code unit, code point, or grapheme cluster.

## Core idea

### ELI5

The same text has several valid counts. A message length limit for people may count visible characters; a network buffer counts bytes. Neither count can replace the other.

| Text | UTF-16 units | Code points | UTF-8 bytes | Grapheme clusters |
| --- | --- | --- | --- | --- |
| `A` | 1 | 1 | 1 | 1 |
| `é` | 1 | 1 | 2 | 1 |
| `e` + combining acute | 2 | 2 | 3 | 1 |
| `🧇` | 2 | 1 | 4 | 1 |

For example, U+1F9C7 (`🧇`) is `F0 9F A7 87` in UTF-8. Other emoji can contain several code points, so “an emoji is two JS units” is not a general rule.

## Worked example

### Easy

Predict `"A".length` and `"🧇".length`: one and two. Spreading a well-formed string iterates code points; it still does not group combining marks or joined emoji into graphemes.

### Medium

A chat preview should keep its first two grapheme clusters. Cutting two UTF-16 units from `A🧇B` would split the waffle's surrogate pair. Use grapheme segmentation for the requested unit.

```ts
function preview(text: string, limit: number): string {
  if (!Number.isInteger(limit) || limit < 0) throw new Error("Invalid limit");
  const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
  let result = "";
  let count = 0;
  for (const part of segmenter.segment(text)) {
    if (count === limit) break;
    result += part.segment;
    count++;
  }
  return result;
}
console.log(preview("A🧇B", 2)); // A🧇
console.log(preview("e\u0301clair", 1)); // e + combining acute, kept together
console.log(preview("hello", 0)); // empty string
```

Use a maintained segmentation implementation if the runtime lacks `Intl.Segmenter`. A byte limit needs a separate check; two graphemes can occupy many bytes.

### Hard

`"é"` and `"e\u0301"` look alike but have different code-point sequences. NFC normalization can make these canonically equivalent forms compare equal. Decide whether that matches the product's identifier policy; normalization does not solve visual confusables, and silently changing opaque IDs can be wrong.

**Try it:** which count should a UTF-8 upload limit use? Use the encoded byte length, not `.length` or the grapheme count. Which should a chat preview use? Its specified display unit, usually grapheme clusters.

## Common mistakes

- Truncating at an arbitrary byte or code-unit boundary. It can split an encoded value; even a code-point boundary can split a grapheme.
- Applying a database “character” limit without checking the database type and collation rules.
- Decoding UTF-8 as a different encoding and blaming the stored text. Check the bytes and decoder separately.
- Adding a charset parameter as a fix for all JSON errors. Interoperable JSON uses UTF-8; `application/json` does not define a charset parameter.

## How to talk about it

“I will define the unit before counting. For a preview I segment graphemes; for a network limit I count encoded bytes. For equality I specify normalization and case rules, then apply the same policy at every boundary.”

## Cross-links

- [HTTP is a conversation, TCP is the pipe](./http-and-tcp.md) (id: http-and-tcp)
- [Why a map is "O(1)" until it isn't](./hashing-internals.md) (id: hashing-internals)
- [Floats are scientific notation, not decimals](./floating-point.md) (id: floating-point)
- [Squeeze from both ends](../algorithms/patterns/two-pointers/lesson.md) (id: two-pointers)
- [Hash maps as an index](../algorithms/patterns/hash-maps.md) (id: hash-maps)
- [Remembering the expensive answer nearby](../system-design/foundations/caching/lesson.md) (id: caching)
