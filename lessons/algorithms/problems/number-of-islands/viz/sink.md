# sink

```mermaid
flowchart TB
  scan[scan cell] --> land{land?}
  land -->|no| scan
  land -->|yes| start[count += 1]
  start --> dfs[sink 4-neighbors]
  dfs --> scan
```
