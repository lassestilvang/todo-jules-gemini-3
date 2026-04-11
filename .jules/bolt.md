# Bolt's Journal

## 2024-05-24 - React.memo on List Items
**Learning:** By default, React components render all their children when state changes. In a list view, if there is a text input updating state on every keystroke, the entire list will re-render, leading to an O(N) re-render cost.
**Action:** Wrap individual list item components in `React.memo` (like `TaskItem`) to skip re-rendering if their props haven't changed. Ensure parent components pass stable callback references (like `setState` functions which are stable by default).
