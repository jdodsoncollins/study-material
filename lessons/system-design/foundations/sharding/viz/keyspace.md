# keyspace

```mermaid
flowchart TB
  key[Partition key] --> hash[Hash / range]
  hash --> s0[Shard 0]
  hash --> s1[Shard 1]
  hash --> s2[Shard 2]
```
