# aside

```mermaid
flowchart LR
  app[App] --> cache{Cache hit?}
  cache -->|yes| ret[Return]
  cache -->|no| db[Database]
  db --> fill[Fill cache]
  fill --> ret
```
