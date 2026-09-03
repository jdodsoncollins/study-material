# channels

```mermaid
flowchart LR
  event[Event] --> pref[Preferences]
  pref --> q[Per-channel queue]
  q --> push[Push]
  q --> sms[SMS]
  q --> email[Email]
  push --> dlq[DLQ]
  sms --> dlq
```
