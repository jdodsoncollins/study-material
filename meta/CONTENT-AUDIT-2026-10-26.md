# Content audit — 2026-10-26

## Scope

Read and edited all 91 lesson bodies: 18 CS lessons, 15 algorithm patterns, 20 algorithm problems, one preparation strategy, 21 system-design lessons, and 16 AI/agent lessons. Reviewed all 51 Mermaid companions and their step captions, correcting diagrams and captions that contradicted the revised lessons. Stable lesson IDs, file locations, curriculum membership, and schedule coverage are preserved.

This was an editorial and technical audit with targeted primary-source checks, executable examples, and independent reference checks. It is not a formal proof of every algorithm, a production load test of the design cases, or a claim that the material is error-free.

## Corrections that affect understanding

| Area | Before | Corrected treatment |
| --- | --- | --- |
| Numeric representation | Incorrect floating-point example and overly broad comparison advice | Binary64 limits, safe integers, exact versus approximate comparison, and integer-cent allocation |
| Text | Character counts conflated units, points, and graphemes | Explicit counting contract and runnable grapheme-safe truncation |
| HTTP and downloads | Retries and resume inferred from too little information | Method/effect semantics, object identity, validated ranges, and a correct ninth partial range |
| Transactions | Isolation levels and anomalies overstated | SQL minimums separated from PostgreSQL behavior; write skew distinguished from lost updates |
| Algorithm traces | Missing three-sum result and incorrect bracket/anagram traces | Complete examples checked against independent outcomes |
| Complexity | Queue shifting, stack space, sorting workspace, and amortization oversimplified | Assumptions and actual implementation costs stated |
| Queue/payment effects | Dedup marker could lose work or allow duplicate external effects | Atomic local effects, durable operations, downstream cooperation, and reconciliation |
| Rate limiting | Local bypass could exceed the stated global allowance | Atomic authoritative checks and a derived overshoot requirement |
| Capacity | Inconsistent upload rates and memory/headroom claims | Recomputed rates, units, KV-cache formulas, and labeled scenario inputs |
| Scheduling/matching | Lease or offer expiry treated as sufficient coordination | Generation checks, authoritative reservations, and external-effect limits |
| Evaluation | Suite-average probabilities, best-of-k, and reliability mixed together | Per-task estimates, explicit sampling assumptions, actual-policy evaluation |
| Judges | Ambiguous error rates and tuning/evaluation overlap | Held-out calibration assessment with counts and denominators |
| Chat assistant | Slash payloads treated as event envelopes; progress before acknowledgement | Separate adapters, atomic durable intake, prompt acknowledgement, authorized tools |
| Diagrams | Some diagrams contradicted safe execution order | Approval before effects, authoritative limiter path, durable publication and reservation steps |

## Writing and teaching

Generic Easy/Medium/Hard placeholders were replaced with concrete traces and transfer questions. The pattern/problem ladder now consistently introduces an invariant and small syntax example before the full solution. Summaries and cross-link labels agree with the revised lessons. Unsupported company-frequency claims, vague provenance, shaming language, and implied benchmark measurements were removed where found. Cross-links now resolve to the stable IDs they name.

The system-design cases explain the operation, authoritative state, commit boundary, recovery behavior, and tradeoff before asking a failure follow-up. AI lessons distinguish observed evidence from claims and define what each measurement can support. Capacity figures are explicitly illustrative.

## Verification

- `node scripts/build-catalog.mjs`: 91 lessons, zero structural/link/step issues.
- `node scripts/check-examples.mjs`: 90 runnable TypeScript examples; 31 independent reference/edge-case groups; 48,218 assertions; zero failures.
- All 90 snippets also passed TypeScript strict checking as isolated modules using TypeScript 6.0.3, ES2022, DOM, and Intl libraries.
- Independent checks cover pair/triple search, top-k, binary-search feasibility, windows, monotonic stacks, nonadjacent sums, one-trade profit, boundary area, coin change, grid counts, interval components, topological order, rotated lookup, LRU behavior, brackets, byte ranges, Unicode, cent allocation, retry policy, pass@k estimates, and ID field limits.
- `git diff --check`: passed.

The catalog builder now validates closed metadata fields, required heading order, teaching ladders, tag parents, relative link/ID agreement, and diagram highlight nodes. It leaves the existing catalog untouched when validation fails. The example checker is a regression tool for this repository's reviewed examples, not a security sandbox for arbitrary submissions.

## Future edits

Run both checks after changing a lesson. Update the prose, runnable example, diagram, step captions, and summary together. Add a reference or edge case when a correction reveals a reusable failure mode. A new version of an external service should trigger a check of the relevant integration lesson rather than an assumption that its contract is unchanged.
