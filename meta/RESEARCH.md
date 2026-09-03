# Research log

What was consulted while writing the first corpus. Nothing here is copied into lessons.

## Algorithms

- Blind 75 origin (Teamblind post) and NeetCode 150 pattern grouping
- 2026 pattern roundups comparing ~14 core templates vs long-tail lists
- r/leetcode threads on Meta/Amazon tagged lists; Amazon "repeats tagged questions more than Meta is predictable"
- Frequency consensus: hash maps, two pointers, sliding window, trees/BFS, graphs, 1D/2D DP, heaps/top-k, intervals, stacks

## System design

Candidate-reported and prep-site frequency (not official company banks):

| Prompt | Where it shows up | Confidence |
| --- | --- | --- |
| URL shortener | Amazon L5 staple; common junior/mid across Google/Meta/Amazon | high |
| News feed | Most reported Meta product-architecture prompt (~Exponent / Hello Interview) | high |
| Chat / messenger | Meta product loops | high |
| Rate limiter | Hello Interview community reports; mid-level all three | high |
| Job scheduler | Hello Interview Meta reports (10k jobs/s, cron + ad-hoc) | medium |
| Video streaming | Google-flavored (YouTube) | high |
| Autocomplete | Google search product analog | high |
| Ride-hailing / surge | Uber senior reports; "design Uber" is too shallow, surge engine is the real ask | medium |
| Payments / ledger / double-charge | Stripe + X posts on idempotency | medium |
| Feature flags | Stripe candidate reports | medium |
| Street View ingest | Google L7 EM report (r/OfferEngineering, 2026) | medium |
| Sora-style GPU job scheduler | OpenAI candidate-report roundups | low-medium |
| Ticket booking / seat lock | rising classic (Ticketmaster) | medium |
| LLM / RAG / coding assistant design | 2025–2026 new category | medium |

Sources: Design Gurus 2026 FAANG guides, Hello Interview question DB + News Feed / Rate Limiter breakdowns, r/leetcode, r/cscareerquestions, r/OfferEngineering, X threads on requirements/tradeoffs/idempotency.

## AI and agentic coding

- Anthropic, *Demystifying evals for AI agents* (2026-01-09): eval harness vs agent harness, graders, pass@k vs pass^k, capability vs regression, outcome vs transcript
- Anthropic, *Building effective agents*; long-running agent harness notes
- Arize / Winder.ai harness vs framework vs eval harness distinctions
- Position paper: *Stop Comparing LLM Agents Without Disclosing the Harness* (harness variance can exceed model variance)
- Martin Fowler / Boeckeler "Agent = Model + Harness"; vendor harness vs user harness (AGENTS.md, tests, CI)
- SWE-bench Verified, Terminal-Bench as coding-agent outcome graders
- X: harness engineering as guides + sensors; eval the trajectory not just the final string

## CS foundations

Standard undergraduate + interview CS: complexity, memory layout, hashing, trees/graphs, OS virtual memory, HTTP, indexes, isolation levels, locks vs STM-level talk, CAP as a conversation tool not a religion.
