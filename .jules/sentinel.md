## 2024-05-24 - [Path Traversal in Uploads]
**Vulnerability:** Path Traversal vulnerability in file upload action (`src/actions/upload.ts`) allows users to write files outside the intended `public/uploads` directory by submitting filenames containing `../` (e.g., `../../../etc/passwd`).
**Learning:** The application was directly using the `name` property from the `File` object provided by the `FormData` without sanitization. The Node.js `join` function resolves `../`, causing it to traverse up the directory tree.
**Prevention:** Always sanitize user-provided filenames. Use `path.basename(file.name)` to extract only the actual filename, discarding any directory traversal attempts.

## 2024-05-25 - [Missing File Upload Size Limit]
**Vulnerability:** The application was missing a file upload size limit in `src/actions/upload.ts`. A malicious user could have uploaded a massive file (e.g., several gigabytes) which would have caused the server to crash with an Out-Of-Memory (OOM) error when attempting to read the file into a Buffer via `await file.arrayBuffer()`, leading to a Denial of Service (DoS) attack.
**Learning:** Always implement file size limits *before* reading the file into memory. Relying on metadata like `file.size` from the `FormData` is an effective way to short-circuit the request and prevent memory exhaustion.
**Prevention:** Implement file size limits early in the request lifecycle, ensuring the application rejects overly large files before allocating significant resources or attempting to read them into buffers.

## 2024-05-26 - [Add Rate Limiting to Sensitive Actions]
**Vulnerability:** Missing rate limits on actions like task creation (`createTask`) and file uploads (`uploadFile`) exposed the application to Denial of Service (DoS) and resource exhaustion attacks by allowing malicious actors to spam requests indiscriminately.
**Learning:** Next.js Server Actions execute on the server and bypass traditional client-side protections. If an action allocates resources (database writes, file system I/O, etc.), it must be protected against abuse natively. Relying only on frontend form submission states is insufficient for security.
**Prevention:** Implement IP-based or user-based rate limiting on resource-intensive Server Actions, using `headers().get('x-forwarded-for')` to track client IPs, and rejecting requests that exceed sensible limits within a given time window.

## 2024-05-27 - [Mass Assignment in Server Actions]
**Vulnerability:** Server Actions receiving data objects directly passed them to Drizzle ORM inserts/updates (e.g., `db.insert().values(data)`). This allows attackers to inject and override protected fields like `id` or `createdAt`.
**Learning:** Never pass raw, unvalidated input objects directly to database ORM methods. Next.js Server Actions expose endpoints that accept arbitrary JSON, and TypeScript types are stripped at runtime.
**Prevention:** Always destructure or explicitly select allowed fields from the input object before passing them to the ORM.

## 2024-05-28 - [Missing Rate Limit on Search Endpoint]
**Vulnerability:** The search endpoint (`src/actions/search.ts`) was missing a rate limit. Because this endpoint performs `LIKE` operations on multiple text fields, it is computationally expensive for the database. An attacker could rapidly hit this endpoint with complex queries, causing high CPU load, locking the SQLite database, and leading to a Denial of Service (DoS).
**Learning:** Database queries that use `LIKE` or fuzzy matching are significantly more expensive than primary key lookups. Any public-facing or easily triggered endpoint (like a command palette search) that executes these queries must be strictly rate-limited to prevent abuse.
**Prevention:** Always implement IP-based rate limiting on search endpoints or any endpoint executing expensive database queries to ensure the application remains available under load.

## 2024-05-16 - Prevent Memory Exhaustion DoS in Rate Limiter
**Vulnerability:** The in-memory rate limiter only performed occasional probabilistic cleanup of expired items (`Math.random() < 0.01`). An attacker could spam requests from many unique IPs faster than the probabilistic cleanup could clear them, causing unbounded Map growth and eventually crashing the Node.js process (OOM DoS).
**Learning:** Purely probabilistic cleanup in in-memory caches or rate limiters is insufficient against targeted exhaustion attacks.
**Prevention:** Always enforce a hard `MAX_STORE_SIZE` limit on in-memory collections and forcefully trigger cleanup or clearing when the limit is reached to ensure predictable memory usage.

## 2024-05-29 - [Missing Input Length Limits]
**Vulnerability:** The application was missing input length limits on task creation and updating (`src/actions/tasks.ts`). Malicious users could bypass client-side constraints and send arbitrarily large payloads for string fields (e.g., `name` or `description`), potentially leading to Database Exhaustion or Storage DoS.
**Learning:** Next.js Server Actions execute natively and accept unbounded inputs unless explicitly validated. Since there's no native size limit on string fields in these inputs, explicit constraints must be put into place to prevent malicious users from saving extremely large strings to the database.
**Prevention:** Always enforce explicit length limits on text inputs in Server Actions before inserting or updating data in the database.

## 2024-05-30 - [Missing Input Length Limits in Other Server Actions]
**Vulnerability:** Similar to previous findings, Server Actions for lists, labels, subtasks, and searches were missing input length validation. A malicious user could send excessively long strings for fields like `name`, `color`, and `query`, potentially causing Database Exhaustion, Application Layer DoS via expensive LIKE operations (for search queries), or Storage DoS.
**Learning:** Next.js Server Actions execute natively and accept unbounded inputs unless explicitly validated. Since there's no native size limit on string fields in these inputs, explicit constraints must be put into place across all server actions that accept user string inputs, not just the primary entity (tasks).
**Prevention:** Always enforce explicit string length limits (e.g., maximum 255 characters) on text inputs in Server Actions before inserting data into the database or using it in queries.
## 2024-05-23 - Missing Rate Limit on Update Endpoint
**Vulnerability:** The `updateTask` server action was missing rate limiting, allowing unauthenticated attackers to send high volumes of requests to update a task.
**Learning:** Because `updateTask` appends changes to the `activityLogs` table, lacking a rate limit exposes the application to DoS attacks via database storage exhaustion.
**Prevention:** All data-mutating Server Actions, including update endpoints, must enforce rate limiting based on client IP.
## 2024-04-24 - Missing Rate Limiting on Update Operations
**Vulnerability:** The `updateTask` Server Action lacked rate limiting, while `createTask` was protected.
**Learning:** Attackers can bypass creation rate limits by exploiting unprotected update endpoints to perform Denial of Service (DoS) attacks or exhaust database storage (especially when updates trigger append-only operations like activity logging).
**Prevention:** Ensure all data-mutating Server Actions, not just creation endpoints, enforce rate limiting based on client IP.

## [DATE] - Rate Limiting Mocking in Bun Tests
**Vulnerability:** Not a vulnerability directly, but a testing issue where mocking Next.js `headers` via `mock.module` failed in Bun.
**Learning:** When mocking modules in Bun tests (e.g., using `mock.module(...)`), ensure the `import { mock } from 'bun:test';` statement strictly precedes any `mock.module(...)` calls to avoid `TypeError: undefined is not an object (evaluating 'mock.module')` errors.
**Prevention:** Always place `mock.module` calls after all `bun:test` imports.

## 2024-04-28 - Missing Security Headers
**Vulnerability:** Missing Security Headers
**Learning:** Next.js applications do not include crucial security headers (like X-Frame-Options and X-Content-Type-Options) by default, leaving them exposed to Clickjacking and MIME-sniffing vulnerabilities.
**Prevention:** Always implement a `next.config.mjs` with an `async headers()` configuration to enforce baseline defense-in-depth security headers across all application routes.

## 2024-04-29 - Missing Rate Limiting on Database Delete Actions
**Vulnerability:** Database deletion endpoints (e.g., `deleteTask`, `deleteList`) lacked rate limiting.
**Learning:** Even though creation endpoints were rate-limited, destructive actions were left unbounded, potentially allowing an attacker to perform Denial of Service (DoS) by spamming delete requests, leading to database exhaustion.
**Prevention:** Ensure all data-mutating Server Actions (create, update, delete, toggle) enforce IP-based rate limiting.
## 2026-05-01 - [Content Security Policy (CSP)]
**Vulnerability:** Missing Content Security Policy (CSP) headers, specifically `object-src 'none'`.
**Learning:** Allowed file uploads like .pdf can execute embedded JavaScript if rendered inline. A CSP with `object-src 'none'` prevents execution of plugins or embedded objects, providing a layer of defense. For full XSS protection, a stricter CSP without `unsafe-inline` or `unsafe-eval` is required.
**Prevention:** Enforce a CSP in `next.config.mjs`. Aim for a strong policy by avoiding `unsafe-inline` and `unsafe-eval` to effectively sandbox application behavior and restrict executable resources.
## 2024-05-31 - [Orphaned File Storage DoS and Data Leak on Deletion]
**Vulnerability:** When a task or subtask is deleted (`deleteTask`, `deleteSubtask`), the application deletes the row from the `tasks` table but fails to cascade-delete associated records from `activityLogs`, `taskLabels`, and `attachments`. Crucially, it does not delete the physical uploaded files from the filesystem. This can lead to massive storage accumulation (Storage DoS) and potentially leak sensitive data if the files remain accessible via direct URL after the parent task is conceptually deleted.
**Learning:** SQLite does not enable `PRAGMA foreign_keys` by default, meaning `ON DELETE CASCADE` constraints are often ignored at the database engine level unless explicitly enabled on every connection. Furthermore, database-level cascading deletes do not trigger application-level side effects (like deleting physical files from the `public/uploads` directory).
**Prevention:** Always implement explicit cleanup logic in Server Actions when deleting entities that have physical file dependencies. Delete the physical files first (or simultaneously) using `fs.unlink`, and use explicit database transactions to delete all dependent rows to ensure database integrity when foreign keys are disabled.

## 2024-05-03 - [Audit Log Spoofing via Client State]
**Vulnerability:** The `updateTask` Server Action accepted a `previousState` object from the client and used it directly to generate audit log diffs.
**Learning:** Server Actions must treat all client inputs as untrusted, even arguments that seem like harmless cache-optimizations. A malicious client could provide a fabricated `previousState` to spoof the "oldValue" in the audit log, masking their true actions.
**Prevention:** Never trust client-provided state for generating audit logs or performing security-sensitive comparisons. Always fetch the authoritative current state directly from the database prior to the update.

## 2024-06-01 - [Rate Limit IP Spoofing via X-Forwarded-For Bypass]
**Vulnerability:** The application extracted the client IP for rate limiting using `headersList.get('x-forwarded-for')?.split(',')[0].trim()`. In an `X-Forwarded-For` chain (e.g., `Client-IP, Proxy1, Proxy2`), the first IP is completely user-controlled. An attacker could trivially bypass rate limits by sending random spoofed IPs in the `X-Forwarded-For` header.
**Learning:** Never trust the first IP in the `X-Forwarded-For` header for security enforcement (like rate limits) because it can be injected by the client. The last IP in the chain is appended by the application's trusted reverse proxy (like Nginx or a cloud provider), making it the only reliable identifier.
**Prevention:** Always extract the last IP in the `X-Forwarded-For` chain using `.split(',').pop()?.trim()` instead of `[0]`, or rely on a platform-specific verified IP header (like `X-Real-IP`) if the reverse proxy guarantees it cannot be spoofed by the client.
## 2026-05-06 - [Orphaned Database Records on Deletion]
**Vulnerability:** When a list or label was deleted, the application failed to remove or update related records (e.g., `tasks.listId` or `taskLabels`). Because SQLite does not enable `PRAGMA foreign_keys` by default, this leads to orphaned many-to-many relationship records or foreign key constraint violations, risking Database Storage DoS.
**Learning:** Database-level cascading deletes (`ON DELETE CASCADE`) are often ignored in SQLite unless explicitly enabled on every connection. You cannot rely on them implicitly.
**Prevention:** Always implement explicit cleanup logic using `db.transaction()` blocks to manually delete dependent records or nullify foreign keys prior to deleting the parent record.
## 2024-05-11 - [SQL Wildcard Unescaped]
**Vulnerability:** SQL wildcard characters `%` and `_` were not escaped in a `LIKE` search query, allowing an attacker to pass `%` as a query and cause an expensive full table scan that expands the search result space, leading to DB exhaustion and Denial of Service.
**Learning:** `drizzle-orm`'s `like()` function does not automatically escape user-provided SQL wildcards (`%`, `_`). It only parameterizes the whole string, making wildcard expansion a silent performance attack vector.
**Prevention:** Always manually escape `\`, `%`, and `_` in user inputs intended for `LIKE` queries (e.g., using `query.replace(/[\\%_]/g, '\\$&')`) and construct the query using `sql\`... LIKE \${pattern} ESCAPE '\\'\``.

## 2026-05-12 - Prevent DoS via SQL LIKE wildcard exhaustion
**Vulnerability:** Drizzle ORM's `like()` helper does not escape wildcards (`%`, `_`) in user input, allowing attackers to cause database exhaustion via massive wildcard expansion.
**Learning:** Always manually escape wildcard characters and construct raw SQL templates with `ESCAPE '\\'` when passing user input to `LIKE` queries.
**Prevention:** Use .replace(/[\\%_]/g, '\\$&') and sql\`... LIKE \${pattern} ESCAPE '\\'" instead of like().
\n## 2026-05-14 - [Path Traversal via OS-dependent path.basename()]\n**Vulnerability:** Path traversal in file uploads because `path.basename()` depends on the host OS and on Linux does not treat backslashes as path separators, allowing attackers to upload files like `..\..\..\etc\passwd`.\n**Learning:** When sanitizing filenames from user input in Node.js, `path.basename()` is insufficient on its own when the host OS is Linux and the client OS is Windows.\n**Prevention:** Always normalize backslashes to forward slashes before applying `basename()`, e.g., `basename(file.name.replace(/\\/g, '/'))`.
