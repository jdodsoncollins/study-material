# take

```mermaid
flowchart LR
  bay[item i] --> skip[keep prev1]
  bay --> take[prev2 + score i]
  skip --> best[max]
  take --> best
  best --> next[slide prev2, prev1]
```
