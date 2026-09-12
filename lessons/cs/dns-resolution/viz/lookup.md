# lookup

```mermaid
flowchart TB
  stub[Stub] --> rec[office resolver]
  rec --> cache{cache hit?}
  cache -->|yes| ans[Answer + TTL]
  cache -->|no| root[Root]
  root --> tld[TLD com]
  tld --> auth[Auth example.com]
  auth --> rec
```
