---
id: go-reading
title: "Optional: read Go without pretending to ship it"
slug: go-reading
kind: strategy
track: cs
difficulty: intro
estimated_minutes: 16
summary: "Optional. Learn enough Go to follow a handler, an error return, and a slice in a comprehension round if your daily language is TypeScript."
tags:
  - cs
  - cs/data-structures
  - interviews
  - interviews/system-design
prerequisites:
  - http-and-tcp
related:
  - http-and-tcp
  - no-ai-fluency
  - sql-with-ai
  - debug-unfamiliar-repo
company_signal:
  - name: Render
    evidence: https://render.com/blog/so-you-want-to-hire-a-ux-engineer
    year: 2021
    confidence: low
sources_consulted:
  - https://go.dev/doc/tutorial/handle-errors
  - https://render.com/blog/so-you-want-to-hire-a-ux-engineer
updated: 2026-11-02
status: canonical
---

# Optional: read Go without pretending to ship it

## Snapshot

- Optional track. It is for reading and a small bug, not for a job that expects production Go.
- Candidate notes describe practical rounds in Go and SQL at some infrastructure companies, with thin public detail [2nd].
- Render's 2021 UX-engineering post said a take-home could use any online resources. That post is old. Do not treat it as the current loop [P, dated].
- The surprises versus TypeScript are errors as values, slices that share a backing array, and `nil`.
- A comprehension round still starts with tests, then the handler, then the data, as in [an unfamiliar repo](../ai-agents/debug-unfamiliar-repo.md) (id: debug-unfamiliar-repo).

## Why it shows up in interviews

If a round is "fix a failing test in this service" and the service is Go, you do not need to have shipped Go. You need to read a signature, follow `if err != nil`, and not "fix" a slice by assuming it copied. Mux is described in candidate notes as an Elixir and Go stack, again with little public interview detail [2nd]. Ask the recruiter what language the repo is. This lesson is the evening-before version, not a language course.

## Core idea

### The three translations

**Errors.** Go functions often return `(value, error)`. The zero value comes back with the error. You check the error before you use the value. There is no `throw` on the happy path of the standard library. A handler that ignores `err` is the bug.

**Slices.** A slice is a pointer, a length, and a capacity into an array. Passing a slice to a function does not copy the elements. `append` may or may not allocate. If you need a snapshot, copy the elements. Mutating `s[i]` mutates the caller's array when the backing store is shared.

**Nil.** A nil slice is safe to range over (zero times). A nil map panics on write. A nil pointer panics on field access. When a test panics, look at the nil before you look at the algorithm.

### A TypeScript picture of the error check

```ts
function readGoStyle(ok: boolean, value: number): string {
  if (!ok) return "err";
  return `value ${value}`;
}

console.log(readGoStyle(false, 0));
console.log(readGoStyle(true, 12));
```

The Go you are reading looks like this:

```go
func bytesOf(site string) (int, error) {
    row, err := load(site)
    if err != nil {
        return 0, err
    }
    return row.Bytes, nil
}
```

`load` is not defined here. The point is the order: error first, then the number. Returning `row.Bytes` before the check is the defect.

## Worked example

### A 40-minute comprehension

You are given a small HTTP service and one failing test: a second request sees the first request's site id. Hypothesis before you edit: a package-level slice or map is reused across requests. In Go, a handler closure that appends to a package-level `[]string` will leak across calls. The fix is a slice created inside the handler, or a copy. Say "package level" out loud so you do not start rewriting the router.

### What you may look up

If the round allows docs, look up `append` and `http.HandlerFunc`. Narrate it. Do not look up "solve this interview" if the round is no-AI. Policy is [the bands lesson](../ai-agents/ai-policy-bands.md) (id: ai-policy-bands).

### Rubric

| Signal | Points |
| --- | --- |
| You checked `err` before using the value | 0–2 |
| You found shared mutable state | 0–3 |
| The fix is local | 0–2 |
| You can say what you did not understand and looked up | 0–1 |

## Common mistakes

- Treating a compile error as the bug when the test panics on nil.
- Assuming a slice argument is a copy, the way a TypeScript array spread would be.
- Ignoring `err` because the test's failure message talks about the value.
- Spending the session learning the whole module system. You need `if err` and the handler.
- Citing a 2021 blog as this year's process.

## How to talk about it

"I'll read the failing test, then the handler. I expect a package-level slice shared across requests. I'll check every `err` before the value. If `append` is involved I'll ask whether the backing array is shared. I'm not rewriting the router."

## Cross-links

- [HTTP and TCP, enough to debug a connection](./http-and-tcp.md) (id: http-and-tcp)
- [Find the bug in a repo you have never seen](../ai-agents/debug-unfamiliar-repo.md) (id: debug-unfamiliar-repo)
- [Keep a no-AI baseline under a timer](../ai-agents/no-ai-fluency.md) (id: no-ai-fluency)
- [Optional: explain a query an assistant rewrote](./sql-with-ai.md) (id: sql-with-ai)
