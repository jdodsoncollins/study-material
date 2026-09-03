# pin

```mermaid
flowchart TB
  sort[Sort] --> pin[Pin i]
  pin --> L[left = i+1]
  pin --> R[right = n-1]
  L --> sum[sum vs 0]
  R --> sum
  sum --> move[Move L or R]
```
