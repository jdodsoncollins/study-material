# branch

```mermaid
flowchart TB
  i[index i] --> skip[skip parts i]
  i --> take[push parts i]
  skip --> next[i + 1]
  take --> next
  next --> leaf{i = n?}
  leaf -->|yes| copy[copy path]
  leaf -->|no| i
```
