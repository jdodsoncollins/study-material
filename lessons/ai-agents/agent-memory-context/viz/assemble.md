# assemble

```mermaid
flowchart TB
  pinned[Pinned: instructions, constraints, tool list] --> pack{Fits the budget?}
  state[Task state and scratchpad notes] --> pack
  recall[Retrieved memories with provenance] --> pack
  recent[Recent turns, newest first] --> pack
  summary[Running summary of older turns] --> pack
  pack -->|yes| call[Model call]
  pack -->|no| trim[Drop oldest turns, refresh summary]
  trim --> pack
  call --> write{Worth remembering?}
  write -->|decision, preference, fact with source| store[(Memory store)]
  write -->|chatter, stale, or untrusted| forget[Let it expire]
  store --> recall
```
