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
