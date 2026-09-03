# layers

```mermaid
flowchart TB
  start[Start] --> q[Queue]
  q --> node[Pop node]
  node --> nbs[Enqueue unseen neighbors]
  nbs --> q
  node --> dist[Distance = layer]
```
