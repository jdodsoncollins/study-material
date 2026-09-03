# wait

```mermaid
flowchart LR
  day[today] --> hotter{hotter than stack top?}
  hotter -->|yes| pop[pop, write i - j]
  pop --> hotter
  hotter -->|no| push[push today]
  push --> day
```
