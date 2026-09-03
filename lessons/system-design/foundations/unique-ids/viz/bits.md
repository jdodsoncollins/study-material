# bits

```mermaid
flowchart LR
  mint[Mint on worker] --> pack[time 41b]
  pack --> worker[worker 10b]
  worker --> seq[seq 12b]
  seq --> id[64-bit YardTicket]
  id --> log[Event log]
```
