## 2024-05-24 - Sidebar Text Overflow

**Learning:** When rendering user-generated content like lists or label names in a constrained layout (like a sidebar), it easily breaks the UI design if the text is exceptionally long. It needs standard `truncate` (ellipsis) to remain graceful without bleeding into other areas. Furthermore, `shrink-0` needs to be applied to adjacent icons to keep them from being squished when the flex container gets squeezed.

**Action:** Always wrap user-provided text in constrained UI areas within a `<span className="truncate">` tag and apply `shrink-0` to the adjacent icons inside flexbox rows.
