# prefix

```mermaid
flowchart LR
  key[Keystroke] --> cache[Prefix cache]
  cache -->|hot| rank[Ranked suggestions]
  cache -->|miss| trie[Prefix index]
  trie --> rank
  rank --> ui[Typeahead]
```
