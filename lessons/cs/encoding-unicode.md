---
id: encoding-unicode
title: Bytes are not characters
slug: encoding-unicode
kind: concept
track: cs
difficulty: core
estimated_minutes: 13
summary: Unicode assigns code points to characters; UTF-8 and UTF-16 encode those points as bytes. Length, truncation, and HTTP headers all lie if you mix the layers.
tags:
  - cs
  - cs/data-structures
  - cs/networking
  - interviews/frontend
prerequisites: []
related:
  - http-and-tcp
  - hashing-internals
  - floating-point
  - two-pointers
company_signal:
  - name: Google
    evidence: Frontend and API screens still catch candidates on string length, emoji, and "why did this JSON filename break in transit."
    year: 2026
    confidence: medium
sources_consulted:
  - Unicode code point vs scalar vs grapheme cluster notes
  - UTF-8 / UTF-16 encoding as taught in systems and web courses
  - JS string UTF-16 code-unit behavior (`.length`, surrogate pairs)
updated: 2026-09-02
status: canonical
---

# Bytes are not characters

## Snapshot

- **Unicode** is a catalog: U+0041 is "A", U+00E9 is "é", U+1F9C7 is "waffle." Those numbers are **code points**, not bytes.
- **UTF-8** encodes a code point as 1–4 bytes. ASCII is unchanged. It is the internet default.
- **UTF-16** encodes most BMP code points as one 16-bit unit and the rest as a *surrogate pair*. JS strings are UTF-16 units.
- A user-perceived character (grapheme) can be several code points: `e` + combining acute.

## Why it shows up in interviews

`s.length`, truncation, hashing, and HTTP `Content-Type` are where this leaks. Frontend rounds love `"👍".length`. Backend rounds love "we stored this as latin1 and the name José became JosÃ©." Treat it as a layering problem, same instinct as HTTP vs TCP.

## Core idea

Three lengths for one string, none of them "obvious."

```
text:  waffle emoji 🧇
code points:     1
UTF-16 units:    2   (surrogate pair)   ← JS .length
UTF-8 bytes:     4
grapheme:        1   (what a user counts)
```

UTF-8:

```
U+0041  A     → 41
U+00E9  é     → C3 A9
U+1F9C7 waffle → F0 9F A7 87
```

You must not slice UTF-8 in the middle of a sequence. You must not slice JS strings in the middle of a surrogate pair. You must not hash "é" composed and "é" decomposed as the same key unless you normalize.

## Worked example

A ticket kiosk stores guest names. Naive truncate to 10 "chars" for the badge.

```ts
function utf16Units(s: string): number {
  return s.length; // code units, not graphemes
}

function truncateUtf16(s: string, max: number): string {
  if (s.length <= max) return s;
  let cut = max;
  const hi = s.charCodeAt(cut - 1);
  if (hi >= 0xd800 && hi <= 0xdbff) cut -= 1; // don't split a pair
  return s.slice(0, cut);
}
```

| API | Counts | Trap |
| --- | --- | --- |
| JS `s.length` | UTF-16 units | Emoji = 2; some flags = 4 |
| `[...s].length` | Code points (mostly) | Still not graphemes |
| `TextEncoder#encode` | UTF-8 bytes | Right for buffers / HTTP |
| Grapheme splitter | User-perceived chars | Needed for "first letter" avatars |

HTTP: `Content-Type: application/json; charset=utf-8`. A body of UTF-8 bytes decoded as latin1 is mojibake, not a random bug. See [http-and-tcp](./http-and-tcp.md) (id: http-and-tcp).

## Common mistakes

- Using `.length` to validate "max 20 characters" in a form. Say *graphemes* or *bytes* and pick one.
- Truncating a UTF-8 buffer at byte 255 for a `VARCHAR`. You can cut a 4-byte emoji in half and fail the next parse.
- Hashing usernames without NFC/NFD normalization. The same visual name misses the cache.
- Assuming one byte per English letter in a mixed-language column, then overflowing a `CHAR(10)`.

## How to talk about it

"I separate code points, UTF-8 bytes, UTF-16 units, and graphemes. In JS, `.length` is units, so emoji is not 1. On the wire I send UTF-8 and I set the charset. If I key a map on a name, I normalize first. If I truncate, I truncate on a boundary, not a raw byte index."

If they ask why UTF-8 won: "ASCII compatibility, no endianness, and streaming-friendly. UTF-16 won inside JS/Java/Windows for history, which is why the lengths disagree."

## Cross-links

- [HTTP is a conversation, TCP is the pipe](./http-and-tcp.md) (id: http-and-tcp)
- [Why a map is "O(1)" until it isn't](./hashing-internals.md) (id: hashing-internals)
- [Floats are scientific notation, not decimals](./floating-point.md) (id: floating-point)
- [Two pointers](../algorithms/patterns/two-pointers/lesson.md) (id: two-pointers)
- [Hash maps as an index](../algorithms/patterns/hash-maps.md) (id: hash-maps)
- [Cache as a second store](../system-design/foundations/caching/lesson.md) (id: caching)
