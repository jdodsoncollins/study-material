# once

```mermaid
flowchart LR
  prod[Producer] --> q[Queue]
  q --> work[Consumer]
  work -->|ok| ack[Ack]
  work -->|crash| q
  work --> idemp[Idempotent write]
```
