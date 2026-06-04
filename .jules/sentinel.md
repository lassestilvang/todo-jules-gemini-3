## 2024-05-25 - Fix IP Extraction for Rate Limiting
**Vulnerability:** The rate limiter was using `.pop()` on the `x-forwarded-for` header to extract the client IP. `x-forwarded-for` contains a comma-separated list of IPs. The last IP (extracted by `.pop()`) is often the IP of the shared reverse proxy or load balancer, not the originating client.
**Learning:** This could cause a global Denial of Service (DoS) where all users are grouped into one rate limit bucket because they share the same reverse proxy IP.
**Prevention:** Use `.split(',')[0]?.trim()` to get the originating client IP (the first IP in the list).

## 2025-05-26 - Prevent Path Traversal via Backslashes
**Vulnerability:** File deletion logic used `split('/').pop()` to extract filenames from file paths. This failed to account for Windows-style backslashes (`\`), allowing path traversal if an attacker uploaded a file with a name like `..\..\etc\passwd`.
**Learning:** Always normalize paths or explicitly split on both forward slashes and backslashes when sanitizing user-provided filenames across different operating systems.
**Prevention:** Use `path.split(/[\/\\\\]/).pop()` to securely extract the base filename, and ensure it is not `.` or `..`.
## 2024-05-29 - Defense in Depth for File Uploads
**Vulnerability:** File upload missing MIME type and empty file validation, which allowed zero-byte file DoS and potential file spoofing via extension mismatch.
**Learning:** Relying solely on file extensions for security is insufficient because attackers can manipulate the extension. Checking the MIME type adds a crucial layer of defense in depth against file spoofing, while checking for a zero-size file prevents resource exhaustion or empty state bugs.
**Prevention:** Always validate file size, enforce a strictly permitted list of extensions, AND validate the MIME type (file.type) during file uploads before processing or saving the file.

## 2025-05-30 - Missing Rate Limiting on Read-Heavy Server Actions
**Vulnerability:** Public Server Actions that only read data (like fetching attachments or subtasks) were missing rate limiting.
**Learning:** Even read-only Server Actions can be abused by attackers to exhaust database connections or compute resources, causing a Denial of Service (DoS) if they are called directly from Client Components.
**Prevention:** Always apply rate limiting to read-heavy Server Actions, not just mutations.
## 2024-05-31 - Add Rate Limiting to getTaskDetailedInfo Server Action
**Vulnerability:** The `getTaskDetailedInfo` function in `src/actions/tasks.ts` was an exported Server Action (`'use server'`) that was called directly from the `TaskDetailSheet` Client Component to fetch associated labels, subtasks, and attachments. It lacked rate limiting.
**Learning:** Even if a function is read-only and wrapped in a React `cache()`, if it is exposed as a public Server Action and performs database queries (like `db.select()...`), it can be directly invoked by a malicious client repeatedly. This can exhaust the database connection pool or compute resources, leading to a Denial of Service (DoS).
**Prevention:** Always ensure that read-heavy Server Actions, especially those making multiple database queries (like `getTaskDetailedInfo`), implement rate limiting just like mutating Server Actions to protect backend resources.
## 2024-06-04 - Add Rate Limiting to getTaskDetailedInfo Server Action
**Vulnerability:** The `getTaskDetailedInfo`, `getActivityLogs`, and `getTaskLabels` functions in `src/actions/tasks.ts` were exported Server Actions (`'use server'`) that were called directly from the `TaskDetailSheet` Client Component to fetch associated labels, subtasks, and attachments. It lacked rate limiting.
**Learning:** Even if a function is read-only and wrapped in a React `cache()`, if it is exposed as a public Server Action and performs database queries (like `db.select()...`), it can be directly invoked by a malicious client repeatedly. This can exhaust the database connection pool or compute resources, leading to a Denial of Service (DoS).
**Prevention:** Always ensure that read-heavy Server Actions, especially those making multiple database queries (like `getTaskDetailedInfo`), implement rate limiting just like mutating Server Actions to protect backend resources.
