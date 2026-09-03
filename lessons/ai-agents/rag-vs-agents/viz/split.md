# split

```mermaid
flowchart LR
  q[Question] --> rag[Retrieve then answer]
  q --> agent[Plan, tools, loop]
  rag --> doc[Citations]
  agent --> act[Side effects]
```
