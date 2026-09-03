# delivery

```mermaid
flowchart LR
  send[Sender] --> api[Chat API]
  api --> log[Message log]
  api --> fan[Online fanout]
  fan --> ws[WebSocket]
  ws --> recv[Recipient device]
  api --> push[Push if offline]
```
