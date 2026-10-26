# swing

```mermaid
flowchart LR
  more{cur exists?} -->|no| head[Return prev]
  more -->|yes| save[Save cur.next]
  save --> flip[Set cur.next to prev]
  flip --> slide[Advance prev and cur]
  slide --> more
```
