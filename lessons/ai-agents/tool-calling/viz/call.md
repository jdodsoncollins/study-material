# call

```mermaid
flowchart LR
  model[Model] --> schema[Tool schema]
  schema --> exec[Harness executes]
  exec --> obs[Observation]
  obs --> model
  exec --> ir[Irreversible?]
  ir -->|yes| confirm[Confirm]
```
