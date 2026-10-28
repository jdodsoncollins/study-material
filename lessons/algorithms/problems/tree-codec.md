---
id: tree-codec
title: Save and restore a question tree
slug: tree-codec
kind: problem
track: algorithms
difficulty: deep
estimated_minutes: 18
summary: Write a preorder walk with an explicit marker for every missing child, then rebuild by reading tokens in the same preorder.
tags:
  - algorithms
  - algorithms/trees
  - algorithms/strings
  - interviews
  - interviews/leetcode
prerequisites:
  - tree-dfs
related:
  - tree-dfs
  - support-flow-depth
  - briefing-layers
  - encoding-unicode
company_signal: []
sources_consulted: []
updated: 2026-10-28
status: canonical
---

# Save and restore a question tree

## Snapshot

- Same shape as "serialize and deserialize a binary tree." You choose the format; the only test is that restore(save(tree)) gives back the same shape and values.
- Preorder plus a marker for each missing child (`#`) is enough to rebuild uniquely. Preorder without markers is not.
- Rebuild by reading tokens in the same order you wrote them: value, then left subtree, then right subtree.
- Level-order with `null` (the format these lessons use for test input) also works; it is the breadth-first version of the same idea.

## Prompt

The help-center bot from [the depth lesson](./support-flow-depth.md) edits its yes/no question tree in the browser and saves it to local storage, which holds strings. Write `save(root)` to produce a string and `restore(text)` to rebuild the tree.

The tree, level-order: `[1, 2, 3, null, 4, 5, 6, null, null, 7]`.

```
        1
      /   \
     2     3
      \   / \
       4 5   6
        /
       7
```

With the preorder format below, `save` produces `"1,2,#,4,#,#,3,5,7,#,#,#,6,#,#"`, and `restore` of that string returns a tree with the same shape and ids.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "Encode / persist / send a tree and get it back" | Pick a traversal and record missing children |
| Format is up to you | Say why it is unambiguous before coding |
| Only a BST, no markers allowed | Preorder alone suffices, because the ordering tells you where each subtree ends |
| Values are arbitrary strings | Commas inside values break naive splitting; escape or length-prefix |

## Worked approach

### ELI5

Describe the tree out loud so someone else can rebuild it without seeing it.

1. Say the question id. Then describe its "yes" side completely. Then its "no" side.
2. When a side is empty, say "nothing" (`#`). Without that word, the listener cannot tell where one side ends.
3. The listener rebuilds in the same order: read an id, build the yes side from the next words, then the no side.

### Syntax

```ts
const tokens = "1,2,#,4,#,#".split(",");
let i = 0;
const next = () => tokens[i++];
console.log(next(), next(), next()); // 1 2 #
console.log(tokens.length - i);      // 3 tokens left
```

### Then the details

```ts
type TreeNode = { v: number; L: TreeNode | null; R: TreeNode | null };

function save(root: TreeNode | null): string {
  const out: string[] = [];
  const walk = (n: TreeNode | null): void => {
    if (!n) { out.push("#"); return; }
    out.push(String(n.v));
    walk(n.L);
    walk(n.R);
  };
  walk(root);
  return out.join(",");
}

function restore(text: string): TreeNode | null {
  const tokens = text.split(",");
  let i = 0;
  const build = (): TreeNode | null => {
    const t = tokens[i++];
    if (t === "#" || t === undefined) return null;
    const n: TreeNode = { v: Number(t), L: null, R: null };
    n.L = build();
    n.R = build();
    return n;
  };
  return build();
}

const leaf = (v: number): TreeNode => ({ v, L: null, R: null });
const flow: TreeNode = {
  v: 1,
  L: { v: 2, L: null, R: leaf(4) },
  R: { v: 3, L: { v: 5, L: leaf(7), R: null }, R: leaf(6) },
};
const text = save(flow);
console.log(text);                      // 1,2,#,4,#,#,3,5,7,#,#,#,6,#,#
console.log(save(restore(text)) === text); // true
console.log(save(null), restore("#"));  // # null
```

The footgun is the shared index. `build` must advance one cursor that both recursive calls see; returning the cursor from each call or closing over a variable both work. Re-splitting or slicing the token list in each call makes it O(n²).

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Preorder with `#` markers | O(n) save and restore | O(n) string, O(h) recursion | Default |
| Level-order with `null` | O(n) | O(n) string, O(width) queue | No recursion; trims trailing nulls |
| Preorder only, BST | O(n) with bounds | O(n) | No markers needed for a BST |
| JSON of nested objects | O(n) | O(n), larger string | Fine in practice; recursion depth still applies |

## Walkthrough

### Easy

One question `[9]`. Save: `9`, then its empty left `#`, then its empty right `#` → `"9,#,#"`. Restore: read 9, left reads `#` → null, right reads `#` → null.

### Medium

Restoring the prompt string `1,2,#,4,#,#,3,5,7,#,#,#,6,#,#`:

1. `1` is the root. Build its left from the next token.
2. `2`. Its left is `#`. Its right is `4`, whose two children are `#`, `#`. Node 2 done.
3. Back at 1, build its right: `3`. Its left is `5`; 5's left is `7` (`#`, `#`); 5's right is `#`.
4. 3's right is `6` (`#`, `#`). All 15 tokens consumed: 7 ids and 8 markers. A tree with n nodes always has n + 1 missing-child markers.

### Hard

Why markers matter: the trees `[1, 2]` (2 is a left child) and `[1, null, 2]` (2 is a right child) both have preorder `1, 2`. With markers they become `1,2,#,#,#` and `1,#,2,#,#`.

Follow-ups:

- **Deep trees.** A chain of 100,000 questions makes both recursive functions 100,000 frames deep. Level-order save/restore with a queue avoids that.
- **String values.** If each question stores its text, a comma in the text breaks `split(",")`. Use `JSON.stringify` per value, or length-prefix each token (`5:hello`). Choose the unit (UTF-16 code units, bytes) deliberately: see [bytes are not characters](../../cs/encoding-unicode.md).
- **Size.** Markers roughly double the token count. If space matters, a BST can drop them because ordering bounds tell you where a subtree ends.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| No marker for missing children | Two different trees save the same | Emit `#` for each null child |
| `Number("")` or a trailing comma | Phantom node with value 0 | Join with a separator and never append an extra one |
| Each recursive call slices the array | O(n²) | One shared cursor |
| Comparing restored trees by reference | Always false | Compare shape and values, or compare re-saved strings |
| Assuming values are single digits | Parsing by character breaks on `-12` or `305` | Split on a separator |

## Interview moves

- Pick the format first and say why it is unambiguous: "preorder with a marker for every null."
- Show the two-node example that breaks marker-free preorder.
- Write `save` and `restore` as mirror images; the interviewer should see the same order in both.
- Raise depth and value-escaping before they do.

## Cross-links

- [Visit a subtree before its sibling](../patterns/tree-dfs/lesson.md) (id: tree-dfs)
- [Longest chain of support questions](./support-flow-depth.md) (id: support-flow-depth)
- [Shift briefings by depth](./briefing-layers/lesson.md) (id: briefing-layers)
- [Bytes are not characters](../../cs/encoding-unicode.md) (id: encoding-unicode)
- [Recursion is a stack you didn't allocate](../../cs/recursion-call-stack.md) (id: recursion-call-stack)
