# take

```mermaid
flowchart LR
  bay[bay i] --> skip[keep prev1]
  bay --> take[prev2 + loot i]
  skip --> best[max]
  take --> best
  best --> next[slide prev2, prev1]
```
