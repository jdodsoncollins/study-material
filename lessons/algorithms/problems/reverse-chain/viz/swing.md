# swing

```mermaid
flowchart LR
  save[save nxt] --> flip[cur.next = prev]
  flip --> slide[prev = cur, cur = nxt]
  slide --> more{cur?}
  more -->|yes| save
  more -->|no| head[return prev]
```
