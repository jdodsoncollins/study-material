# path

```mermaid
flowchart LR
  mint[Mint API] --> keys[MintPool]
  mint --> store[ClipStore]
  click[Resolve] --> cache[Redirect cache]
  cache -->|miss| store
  store --> cdn[302 to long URL]
```
