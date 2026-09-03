# batch

```mermaid
flowchart TB
  req[Completion req] --> q[GPU wait queue]
  q --> batch[Continuous batch]
  batch --> kv[KV cache]
  batch --> gpu[GPU]
  gpu --> tok[Tokens out]
```
