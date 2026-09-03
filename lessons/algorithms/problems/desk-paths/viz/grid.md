# grid

```mermaid
flowchart TB
  seed[first row and col = 1] --> cell[cell = above + left]
  cell --> next[next cell]
  next --> cell
```
