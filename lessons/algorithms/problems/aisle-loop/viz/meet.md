# meet

```mermaid
flowchart LR
  start[slow and fast on head] --> step[slow +1, fast +2]
  step --> end{fast at null?}
  end -->|yes| no[no loop]
  end -->|no| same{same node?}
  same -->|no| step
  same -->|yes| yes[loop]
```
