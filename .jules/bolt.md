# Bolt's Journal

## 2024-05-24 - React.memo on List Items
**Learning:** By default, React components render all their children when state changes. In a list view, if there is a text input updating state on every keystroke, the entire list will re-render, leading to an O(N) re-render cost.
**Action:** Wrap individual list item components in `React.memo` (like `TaskItem`) to skip re-rendering if their props haven't changed. Ensure parent components pass stable callback references (like `setState` functions which are stable by default).
## 2024-04-12 - Missing FK Indexes in SQLite
**Learning:** In SQLite, foreign key constraints do not automatically create indexes. When loading a task's sub-resources (logs, attachments, labels, subtasks), the lack of indexes on the `task_id` and `parent_id` columns caused O(N) full table scans. Benchmarks showed query times for these related records were ~4x slower without indexes.
**Action:** Always explicitly define indexes for columns used frequently in `WHERE` clauses, particularly foreign keys that map 1-to-many relationships.
