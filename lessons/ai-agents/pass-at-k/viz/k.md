# k

```mermaid
flowchart LR
  t1[Trial 1] --> any{any pass?}
  t2[Trial 2] --> any
  t3[Trial 3] --> any
  any -->|pass@k| hope[At least one]
  t1 --> all{all pass?}
  t2 --> all
  t3 --> all
  all -->|pass^k| slo[Every time]
```
