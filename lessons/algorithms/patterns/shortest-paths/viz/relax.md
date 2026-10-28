# relax

```mermaid
flowchart LR
  r0((0)) -->|4| r1((1))
  r0 -->|1| r2((2))
  r2 -->|2| r1
  r1 -->|1| r3((3))
  r2 -->|5| r3
  r3 -->|3| r4((4))
```
