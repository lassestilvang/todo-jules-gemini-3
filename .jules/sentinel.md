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
