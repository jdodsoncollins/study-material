# slide

```mermaid
flowchart LR
  right[advance right] --> seen{letter inside window?}
  seen -->|no| grow[grow width]
  grow --> right
  seen -->|yes| jump[left = last + 1]
  jump --> grow
```
