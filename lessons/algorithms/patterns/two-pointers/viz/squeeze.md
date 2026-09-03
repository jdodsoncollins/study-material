# squeeze

```mermaid
flowchart LR
  L[left] --> sum[L + R]
  R[right] --> sum
  sum --> cmp{vs target}
  cmp -->|small| moveL[left++]
  cmp -->|big| moveR[right--]
  cmp -->|equal| done[pair]
```
