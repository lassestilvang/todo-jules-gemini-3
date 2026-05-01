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
**Learning:** Allowed file uploads like .pdf can execute embedded JavaScript if rendered inline. A strict CSP provides defense-in-depth against XSS and prevents execution of plugins or embedded scripts.
**Prevention:** Always enforce a strong CSP in `next.config.mjs` to sandbox application behavior and restrict executable resources.
