# Bolt's Journal

## 2024-05-24 - React.memo on List Items
**Learning:** By default, React components render all their children when state changes. In a list view, if there is a text input updating state on every keystroke, the entire list will re-render, leading to an O(N) re-render cost.
**Action:** Wrap individual list item components in `React.memo` (like `TaskItem`) to skip re-rendering if their props haven't changed. Ensure parent components pass stable callback references (like `setState` functions which are stable by default).

## 2024-04-12 - Missing FK Indexes in SQLite
**Learning:** In SQLite, foreign key constraints do not automatically create indexes. When loading a task's sub-resources (logs, attachments, labels, subtasks), the lack of indexes on the `task_id` and `parent_id` columns caused O(N) full table scans. Benchmarks showed query times for these related records were ~4x slower without indexes.
**Action:** Always explicitly define indexes for columns used frequently in `WHERE` clauses, particularly foreign keys that map 1-to-many relationships.

## 2024-05-24 - Missing FK Indexes in SQLite
**Learning:** In SQLite, foreign key constraints do not automatically create indexes. When loading a task's sub-resources or filtering by a list, the lack of indexes on the `list_id` and `recurrence_id` columns caused O(N) full table scans. Benchmarks showed query times for these related records were ~4-5x slower without indexes for larger datasets.
**Action:** Always explicitly define indexes for columns used frequently in `WHERE` clauses, particularly foreign keys that map 1-to-many relationships.

## 2024-12-02 - Duplicate Database Queries in Server Components
**Learning:** Next.js Server Components running in the App Router often trigger identical database fetch queries across multiple components (e.g., layout and page level) within the same render pass, leading to redundant work and slower execution times. Wrapping the database fetch function in React's `cache()` memoizes the query results, so the database query executes only once per server request lifecycle.
**Action:** Use React's `cache()` to wrap read-only server actions to effortlessly deduplicate queries across React Server Components without resorting to complex state management. Ensure this is limited to data fetching, not mutations.
