# stack

```mermaid
flowchart LR
  ch[next mark] --> kind{opener?}
  kind -->|yes| push[push]
  push --> ch
  kind -->|no| pop{top matches?}
  pop -->|yes| ch
  pop -->|no| bad[illegal]
```
