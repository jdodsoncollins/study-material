# evict

```mermaid
flowchart LR
  get[get / put] --> map[Hash map]
  map --> node[List node]
  node --> front[Move to front]
  put2[put when full] --> tail[Evict tail]
  tail --> map
```
