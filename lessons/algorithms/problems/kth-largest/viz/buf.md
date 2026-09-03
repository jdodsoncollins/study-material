# buf

```mermaid
flowchart LR
  score[next score] --> beat{beats the k-floor?}
  beat -->|no| score
  beat -->|yes| evict[drop the smallest of k]
  evict --> score
```
