# Research and evidence policy

The October 2026 audit removed company-frequency assertions and vague source labels that could not be traced to specific public evidence. The lessons are original practice material. Empty `company_signal` or `sources_consulted` lists are intentional; they are preferable to invented provenance.

Capacity figures, product names, and workload scenarios are teaching assumptions unless explicitly identified as measured results. A source in frontmatter records a reference consulted for the relevant concept; it is not an endorsement of every design choice in the lesson.

## Primary references used in the audit

| Area | Reference | What it helps verify |
| --- | --- | --- |
| Arrays and linked nodes | [Open Data Structures](https://opendatastructures.org/ods-java/) | Representation and operation-cost assumptions |
| JavaScript collections and numbers | [ECMAScript](https://tc39.es/ecma262/) | Map semantics, safe integers, and language contracts |
| Text boundaries | [Unicode UAX 29](https://www.unicode.org/reports/tr29/) | Code points versus grapheme boundaries |
| HTTP | [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html), [RFC 9111](https://www.rfc-editor.org/rfc/rfc9111.html) | Methods, retries, ranges, and caching |
| Transactions and indexes | [PostgreSQL isolation](https://www.postgresql.org/docs/current/transaction-iso.html), [multicolumn indexes](https://www.postgresql.org/docs/current/indexes-multicolumn.html) | Engine-specific guarantees and index limitations |
| Concurrency | [OSTEP locks](https://pages.cs.wisc.edu/~remzi/OSTEP/threads-locks.pdf), [Node workers](https://nodejs.org/api/worker_threads.html) | Locks and JavaScript worker memory boundaries |
| Distributed consistency | [Gilbert and Lynch](https://www.comp.nus.edu.sg/~gilbert/pubs/BrewersConjecture-SigAct.pdf) | The formal CAP tradeoff |
| Queue effects | [Kafka delivery semantics](https://kafka.apache.org/41/design/design/#message-delivery-semantics) | The scope of transactional exactly-once processing |
| Idempotency | [Stripe request contract](https://docs.stripe.com/api/idempotent_requests) | Payload conflicts, replay, and retention limits |
| IDs, crawling, video | [RFC 9562](https://www.rfc-editor.org/rfc/rfc9562.html), [RFC 9309](https://www.rfc-editor.org/rfc/rfc9309.html), [RFC 8216](https://www.rfc-editor.org/rfc/rfc8216.html) | UUID formats, robots rules, and playlist lifecycle |
| Model serving | [PagedAttention paper](https://arxiv.org/abs/2309.06180) | KV-cache allocation and serving constraints |
| Evaluation terminology | [Agent evaluation guide](https://www.anthropic.com/research/demystifying-evals-for-ai-agents) | Harness, task, trial, and grader vocabulary |
| Sampling success | [HumanEval paper](https://arxiv.org/html/2107.03374v2) | Per-task pass@k estimation |
| Qualitative judging | [MT-Bench judge study](https://arxiv.org/abs/2306.05685) | Biases to investigate when calibrating judges |
| Coding evaluation | [SWE-bench documentation](https://www.swebench.com/SWE-bench/) | Reproducible patch evaluation |
| Tracing | [OpenTelemetry trace documentation source](https://github.com/open-telemetry/opentelemetry.io/blob/main/content/en/docs/concepts/signals/traces.md) | Spans, relationships, and links |
| Chat integration | [Slash commands](https://docs.slack.dev/interactivity/implementing-slash-commands/), [Events API](https://docs.slack.dev/apis/events-api/), [signature verification](https://docs.slack.dev/authentication/verifying-requests-from-slack/) | Distinct payloads, response deadlines, and verified intake |
| Teaching sequence | [IES practice guide](https://ies.ed.gov/ncee/wwc/PracticeGuide/1) | Worked examples, retrieval practice, and spaced review as general learning practices |

The teaching sequence uses an explanation, a small demonstration, a worked trace, and a transfer question. These are practical editorial choices informed by general learning research, not a claim that a specific interview-preparation schedule or number of patterns is experimentally optimal.

## Adding evidence

- Prefer the specification, original paper, or implementation's official documentation for a technical contract.
- State the version and assumptions when behavior depends on an engine, protocol, or runtime.
- Keep calculations reproducible and distinguish averages, peaks, decimal units, and binary units.
- Preserve an exact public URL and date for any future candidate-reported company claim; keep uncertainty visible. Do not infer interview frequency from product similarity or a prep site's topic list.
- Keep original examples and independent expected results. Consult a source to check a claim, not to copy its tutorial.
