# window

```mermaid
flowchart LR
  L[left] --> slice[window]
  R[right] --> slice
  slice --> ok{invariant?}
  ok -->|no| shrink[move left]
  ok -->|yes| grow[move right]
  shrink --> slice
  grow --> slice
```
