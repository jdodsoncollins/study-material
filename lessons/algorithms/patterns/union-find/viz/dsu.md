# dsu

```mermaid
flowchart LR
  a[Find a] --> ra[Root a]
  b[Find b] --> rb[Root b]
  ra --> same{same root?}
  rb --> same
  same -->|no| link[Link by rank]
```
