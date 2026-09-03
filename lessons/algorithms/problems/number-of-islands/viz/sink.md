# sink

```mermaid
flowchart TB
  scan[scan cell] --> land{pallet?}
  land -->|no| scan
  land -->|yes| start[count += 1]
  start --> dfs[sink 4-neighbors]
  dfs --> scan
```
