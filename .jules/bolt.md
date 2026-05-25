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

## 2024-06-15 - Unnecessary DB writes and Next.js Cache invalidations on Blur
**Learning:** Tabbing through inputs triggers `onBlur` events which call server actions (like `updateTask`). If no actual value was changed, executing the default `UPDATE` statement and invoking `revalidatePath('/')` causes unnecessary database writes and completely invalidates the Next.js router cache, forcing an expensive and jarring full-page re-render.
**Action:** Implement an early return inside the update logic. By comparing the new payload with the current state, completely skip the DB transaction and cache invalidation if no fields have materially changed.
## 2024-05-25 - Avoid App-Level Relational Copies in Loops
**Learning:** Copying relational data (like subtasks or labels) in loops or during task recurrence via application-level queries (`tx.select()` followed by mapping to `tx.insert().values()`) introduces N+1 performance issues, slow iteration, and significant memory allocation overhead. Benchmarks show `INSERT INTO ... SELECT` directly in SQLite reduces iteration times by ~20% and memory footprint by over 10x.
**Action:** Replace dynamic application-level map/inserts with raw SQL `INSERT INTO ... SELECT` statements when copying existing records, ensuring all required fields are correctly projected.
## 2024-05-24 - SQL INSERT INTO SELECT for Relation Copying
**Learning:** When copying relational data (like task labels or subtasks) for a new task occurrence, fetching the existing relations into application memory with `.select().all()` and then mapping over them to `.insert()` creates unnecessary memory allocations and serialization overhead. Benchmarks confirm that replacing this application-level loop with a raw SQL `INSERT INTO ... SELECT` statement improves the relation copying performance by keeping the data movement entirely within the SQLite engine.
**Action:** Replace dynamic application-level map inserts with raw SQL INSERT INTO SELECT statements when copying relational data. Use Drizzle schema objects (e.g., table.column) for column names to ensure type safety and handle potential schema changes.
## 2024-12-05 - Avoid Promise.all for synchronous SQLite queries
**Learning:** The `better-sqlite3` driver relies on synchronous C++ bindings that block the Node.js main thread. Wrapping Drizzle ORM execution methods like `.all()`, `.get()`, or `.run()` in `await Promise.all` does not achieve true parallelization and instead introduces unnecessary promise scheduling overhead. Benchmarks show sequential awaits are consistently faster for multiple database queries.
**Action:** Use sequential awaits instead of `Promise.all` when executing multiple queries with `better-sqlite3`.

## 2026-04-17 - Fixed Field Iteration for Object Filtering
**Learning:** Iterating over `Object.keys(data)` and checking against a `Set` of allowed keys is less efficient than iterating over a fixed array of allowed keys and checking if they exist in the input object, especially when the input object contains many extra fields. Benchmarks showed a ~36% performance improvement for larger objects.
**Action:** Replace `Object.keys(data)` loops for data filtering/security sanitization with iteration over a constant array of allowed field names.

## 2024-05-24 - Missing Index on Heavily Filtered Boolean Fields
**Learning:** When fetching data filtered by a boolean field (like `is_completed = false` for an Inbox view), the lack of an index causes a full table scan. As the table grows over time (e.g., users complete many tasks), the proportion of the target boolean state becomes skewed, and the full scan becomes a significant bottleneck. Benchmarks show adding an index on `is_completed` improves query time for incomplete tasks by ~6x on a 100k row table.
**Action:** Always consider adding indexes to boolean fields if they are the primary filter for high-traffic views (like a default Inbox or Dashboard), especially when the distribution of that boolean state is expected to be highly skewed.
## 2024-04-20 - Prevent unnecessary Server Action network calls onBlur
**Learning:** Next.js Server Actions triggered by UI events (like `onBlur`) can cause expensive router cache invalidations (e.g., `revalidatePath`) and unnecessary database updates if the input data hasn't actually changed.
**Action:** Implement early returns in UI components by checking if the data has changed before invoking Server Actions to prevent these performance bottlenecks.
## 2024-12-06 - Object.keys() for Partial Payloads
**Learning:** While iterating over a constant array of allowed field names is efficient for filtering large objects (to avoid iterating over many unwanted properties), doing so for `Partial` update payloads containing very few modified fields is a de-optimization. Benchmarks confirm that for small partial objects, iterating over a large fixed array and constantly checking for `undefined` is slower than simply using V8's highly optimized `Object.keys(data)`.
**Action:** Use `Object.keys()` when iterating over small `Partial` update payloads (e.g., checking what changed in a form submission), but retain constant array iteration for security sanitization/filtering of arbitrary payloads.
## 2024-05-24 - Removing Promise Overhead from better-sqlite3 Reads
**Learning:** The `better-sqlite3` driver relies on synchronous C++ bindings. Wrapping Drizzle ORM queries in `await` (which uses an internal `Thenable` wrapper) introduces unnecessary Promise resolution (microtask) overhead without achieving true parallelization.
**Action:** For optimal performance with `better-sqlite3`, remove `await` entirely from Drizzle read queries and execute them natively synchronously using `.all()`, `.get()`, or `.run()`. This bypasses Promise instantiation overhead and executes significantly faster, even inside Server Actions that are themselves defined as async.
## 2024-06-25 - better-sqlite3 Async Overhead
**Learning:** In Drizzle ORM with the `better-sqlite3` driver, SQLite is synchronous via native C++ bindings. Wrapping Drizzle DB queries with `await` doesn't provide parallelization but actually adds microtask overhead (Promise resolution).
**Action:** Remove `await` for database write queries in `src/actions/tasks.ts` and use synchronous methods like `.run()` or `.get()`.
## 2024-05-24 - React.memo and State Isolation on Subtask Lists
**Learning:** Similar to root task lists, typing in a subtask creation input located within the parent `SubtasksList` component triggers a re-render of the entire subtasks array on every keystroke, resulting in O(N) rendering overhead.
**Action:** Always isolate text input state (`newSubtaskName`, `isSubmitting`) by extracting the form into its own component (e.g., `CreateSubtaskForm`). This ensures that only the input itself re-renders during typing, preventing sibling list items from needlessly re-rendering.
## 2026-05-01 - Extract debounce timeout to hook
**Learning:** Recreating `setTimeout` within a component's `useEffect` can become difficult to maintain and introduces subtle bugs if cancellation conditions are missed, especially on search inputs.
**Action:** Always extract debounce logic into a generic `useDebounce` hook to improve component readability, abstract away cleanup logic, and make state management more robust.
## 2026-05-01 - React.memo and State Isolation on Subtask Lists
**Learning:** Similar to root task lists, typing in a subtask creation input located within the parent `SubtasksList` component or toggling a subtask triggers a re-render of the entire subtasks array, resulting in O(N) rendering overhead.
**Action:** Always extract the individual subtask list item into its own component (e.g., `SubtaskItem`) and wrap it in `React.memo()` with stable callback references to prevent sibling list items from needlessly re-rendering during state updates.

## 2024-05-03 - Client-Side Search Caching
**Learning:** Frequent debounced typing or backspacing in a search component (like `SearchCommand`) triggers redundant Server Action calls (`searchTasks`), unnecessarily hitting the database and consuming bandwidth, even for recently queried identical strings.
**Action:** Implement an in-memory client-side cache (`Map` stored in a `useRef`) for search components to store and instantly retrieve results for previously typed queries within the same session. Ensure the cache size is bounded and invalidated appropriately (e.g., when the search dialog closes) to prevent memory leaks and stale data.
## 2026-05-05 - Eliminate Redundant API calls on Subtask Creation
**Learning:** After creating a subtask via a Server Action, triggering a completely separate API fetch (`loadSubtasks`) to re-load all subtasks introduces a redundant network request and database query, degrading UI responsiveness.
**Action:** Always return the newly inserted database row directly from the Server Action (using `.returning().get()`) and optimistically append it to the client's local React state (handling potential `null` arrays) to eliminate the extra network round-trip.
## 2024-12-05 - Avoid Component Unmounting for Data Fetching\n**Learning:** Implementing `isLoading` checks to hide and entirely unmount child components during data fetching is an anti-pattern. It causes severe DOM thrashing by forcing components to unmount and remount, which hurts performance and creates jarring visual flickering. Better to pass null/undefined data and let the child components render loading skeletons or empty states.\n**Action:** Never use `!isLoading && <Component/>` to hide child components purely to avoid them making redundant API calls if they already handle null initial data. Optimize the data loading strategy (e.g., fetch in parent and pass down) instead of thrashing the DOM.

## 2024-12-05 - Avoid Component Unmounting for Data Fetching
**Learning:** Implementing `isLoading` checks to hide and entirely unmount child components during data fetching is an anti-pattern. It causes severe DOM thrashing by forcing components to unmount and remount, which hurts performance and creates jarring visual flickering. Better to pass null/undefined data and let the child components render loading skeletons or empty states.
**Action:** Never use `!isLoading && <Component/>` to hide child components purely to avoid them making redundant API calls if they already handle null initial data. Optimize the data loading strategy (e.g., fetch in parent and pass down) instead of thrashing the DOM.
## 2026-05-13 - Parallelize IO-bound File System Operations
**Learning:** While `better-sqlite3` queries are synchronous and do not benefit from `Promise.all`, Node.js native `fs/promises` operations like file deletion are truly asynchronous. A codebase-specific anti-pattern was found where file deletions were performed sequentially in a `for...of` loop, likely mirroring the sequential nature of DB queries. Parallelizing independent IO operations like `fs.unlink` with `Promise.all` significantly reduces latency when deleting tasks with many attachments.
**Action:** Use `Promise.all` to parallelize independent `fs/promises` operations to prevent O(N) latency, contrasting this explicitly with the sequential await rule for `better-sqlite3` queries.
## 2026-05-12 - Removing async/await from Server Action internal functions
**Learning:** While I initially thought removing `async/await` entirely from synchronous server actions that only read from `better-sqlite3` would be a pure performance win, I learned that Next.js Server Actions *must* remain `async` when they are exported and imported into Client Components. The network RPC boundary inherently requires promises. However, for *internal* helper functions (like `getTaskDetailedInfo`) that are NOT directly called from Client Components, or for Server Component data fetching, removing the `async/await` from `better-sqlite3` queries does remove microtask overhead safely.
**Action:** Remove `async/await` from pure server-side helper functions and database queries in Next.js Server Components when using `better-sqlite3` to avoid microtask scheduling overhead. Ensure exported Server Actions (those containing "use server" mutations called from the client) remain `async` to satisfy Next.js RPC constraints.

## 2024-05-24 - Removing Promise Overhead from better-sqlite3 Transactions
**Learning:** The better-sqlite3 driver relies on synchronous C++ bindings. Wrapping Drizzle ORM transactions in `await` introduces unnecessary Promise resolution (microtask) overhead without achieving true parallelization.
**Action:** For optimal performance with better-sqlite3, remove `await` entirely from Drizzle transactions and execute them synchronously.
## 2024-12-06 - Awaiting Exported Server Actions in Client Components
**Learning:** While removing `async/await` from `better-sqlite3` read queries eliminates microtask overhead on the server, exported Next.js Server Actions inherently return a Promise across the RPC boundary when invoked from Client Components. If a Client Component (like `TaskDetailSheet`) incorrectly assumes an imported Server Action is synchronous, it will set state to a pending Promise or undefined. This can cause severe performance issues, such as child components interpreting the undefined state as an initial mount and triggering their own redundant fallback network requests.
**Action:** Always correctly `await` or chain `.then()` on Next.js Server Actions when invoking them from Client Components, even if the underlying server-side code was optimized to run synchronously.

## 2024-05-24 - Do not remove await from Next.js Server Actions
**Learning:** Exported Next.js Server Actions automatically return Promises across the RPC boundary when imported, even if the underlying logic (like `better-sqlite3` queries) is strictly synchronous. Attempting to optimize performance by removing `await` from these calls inside Server Components will pass unresolved Promise objects directly into React elements, resulting in catastrophic rendering failures.
**Action:** Never remove `await` from exported Next.js Server Actions when they are imported and called within Server Components.

## 2024-05-24 - Early Returns in Next.js Server Action State Updates
**Learning:** Next.js Server Actions that toggle boolean states (like task completion) or perform partial updates often omit a strict equality check against the existing database state. If an action is triggered redundantly (e.g., rapid clicking or scripts), this omission results in unnecessary database transactions and expensive, full-route invalidations (`revalidatePath`).
**Action:** Always implement a strict early return (e.g., `if (task.isCompleted === isCompleted) return;`) immediately after fetching the current state in Server Actions to definitively prevent redundant writes and cache purging.
## 2026-05-16 - Inspecting better-sqlite3 Write Results
**Learning:** When deleting or updating rows with Drizzle ORM and `better-sqlite3`, it is unnecessary to perform a separate SELECT query to verify if the row existed prior. The native `.run()` method directly returns an object containing a `.changes` property (indicating the number of rows affected).
**Action:** Use `const result = db.delete(...).run(); if (result.changes > 0) { ... }` to accurately detect if an operation modified data, which allows for safe early returns and skips expensive framework operations like `revalidatePath`.

## 2024-06-25 - SQLite WAL Mode & .gitignore
**Learning:** Enabling SQLite Write-Ahead Logging (WAL) mode via `sqlite.pragma('journal_mode = WAL');` significantly improves database concurrency by allowing simultaneous readers and a writer. However, it generates local binary files `sqlite.db-shm` and `sqlite.db-wal` alongside the main database file.
**Action:** When enabling WAL mode, always immediately add `sqlite.db-shm` and `sqlite.db-wal` to `.gitignore` to prevent these temporary binary files from being committed and causing merge conflicts.

## 2024-06-25 - Date Manipulation Micro-Optimizations
**Learning:** Attempting to replace standard date libraries (like `date-fns`) with manual string manipulation or lexicographical string comparisons (e.g., `task.date < todayStr`) for micro-optimizations easily introduces severe functional regressions and timezone bugs. For example, comparing ISO strings can fail for tasks that become overdue on the same day if time components vary, and manual substring slicing ignores local timezone offsets.
**Action:** Never replace robust date parsing and formatting logic with naive string manipulation just to save a few milliseconds. Speed without correctness is useless.

## 2026-05-18 - Prevent over-fetching subtasks in main queries
**Learning:** Root-level list queries were fetching all tasks including subtasks, unnecessarily transferring and rendering data that is already handled within the task detail view.
**Action:** Always filter root-level queries with `sql\`${tasks.parentId} IS NULL\`` to prevent over-fetching and render bloat.
## 2024-05-24 - Unnecessary revalidatePath on deep UI actions
**Learning:** Calling `revalidatePath('/')` unconditionally in Server Actions that only affect deeply nested, isolated UI states (such as subtasks or task attachments) causes the Next.js router cache to purge. This forces a heavy, full-page RSC re-render of all root components (tasks, lists, labels), creating unnecessary DB queries and bandwidth usage, even when the frontend component (like `SubtasksList` or `AttachmentsList`) already handles the state update optimistically.
**Action:** When a Next.js Server Action updates data that is explicitly filtered out of root-level queries (e.g., `parentId IS NULL`) or dynamically fetched only inside modals (like attachments), rely strictly on local state optimistic updates and do NOT call `revalidatePath('/')` to preserve router cache and avoid massive redundant re-renders.

## 2024-05-25 - Skip cache invalidation for subtask updates
**Learning:** In Next.js, calling `revalidatePath('/')` after modifying a task purges the router cache and triggers a full-page RSC re-render. If the task being modified is a subtask (which are explicitly filtered out from root-level list queries via `parentId IS NULL`), this re-render is entirely redundant and severely degrades application responsiveness.
**Action:** Always fetch or verify the `parentId` of the task being updated or toggled. Conditionally execute `revalidatePath('/')` ONLY if the task is a root task (`parentId === null`), allowing child components to handle subtask updates optimistically without purging the global cache.

## 2024-05-25 - Avoid relying on Server Action revalidation for simple UI toggles
**Learning:** Relying solely on Next.js Server Action `revalidatePath('/')` to update the UI after simple actions like marking a task as complete creates a noticeable perceived latency (100-300ms network roundtrip) and causes a full RSC re-render of the list.
**Action:** When a Server Component passes down an array of data (like `tasks`), use the `useOptimistic` hook initialized with the prop to manage optimistic updates for simple toggles. Wrap the state update in `startTransition` and execute it before the Server Action call to provide an instantaneous sub-16ms UI update while the server synchronizes in the background.
## 2024-05-25 - Avoid full cache invalidation on nested updates
**Learning:** Calling `revalidatePath("/")` inside a Next.js Server Action triggers a full route re-render. If the action modifies deeply nested data (like a subtask) that is already explicitly filtered out of root queries, and the client UI handles the update optimistically, invalidating the entire cache is a severe performance bottleneck causing massive RSC render tree bloat.
**Action:** Remove `revalidatePath("/")` from Server Actions that mutate nested entities (like subtasks) which are not part of the root component data fetching.

## 2026-05-24 - Disable Next.js Link prefetching for dynamic/dense menus
**Learning:** Next.js defaults to aggressively prefetching routes for every `<Link>` that enters the viewport. In dense navigation components like sidebars displaying dynamic, user-generated content (e.g., numerous lists or tags), this default behavior can cause a surge of unnecessary background network requests and server-side data fetching on page load, exhausting bandwidth and DB connections.
**Action:** Add prefetch={false} to Link components in sidebars and other dense navigation menus specifically for dynamic routes or non-critical pages to prevent aggressive prefetching, while retaining default prefetching for core static routes.
