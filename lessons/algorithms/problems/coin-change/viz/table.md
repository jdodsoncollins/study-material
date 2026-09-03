# table

```mermaid
flowchart LR
  x[amount x] --> tok[try each token t]
  tok --> fit{t <= x?}
  fit -->|yes| take["dp[x] = min(dp[x], dp[x-t]+1)"]
  take --> x
  fit -->|no| x
```
