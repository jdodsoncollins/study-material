# kinds

```mermaid
flowchart TB
  trial[Trial] --> code[Code grader]
  trial --> model[LLM judge]
  trial --> human[Human]
  code --> score[Score]
  model --> score
  human --> score
```
