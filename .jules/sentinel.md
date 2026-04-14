## 2024-05-24 - [Path Traversal in Uploads]
**Vulnerability:** Path Traversal vulnerability in file upload action (`src/actions/upload.ts`) allows users to write files outside the intended `public/uploads` directory by submitting filenames containing `../` (e.g., `../../../etc/passwd`).
**Learning:** The application was directly using the `name` property from the `File` object provided by the `FormData` without sanitization. The Node.js `join` function resolves `../`, causing it to traverse up the directory tree.
**Prevention:** Always sanitize user-provided filenames. Use `path.basename(file.name)` to extract only the actual filename, discarding any directory traversal attempts.

## 2024-05-25 - [Missing File Upload Size Limit]
**Vulnerability:** The application was missing a file upload size limit in `src/actions/upload.ts`. A malicious user could have uploaded a massive file (e.g., several gigabytes) which would have caused the server to crash with an Out-Of-Memory (OOM) error when attempting to read the file into a Buffer via `await file.arrayBuffer()`, leading to a Denial of Service (DoS) attack.
**Learning:** Always implement file size limits *before* reading the file into memory. Relying on metadata like `file.size` from the `FormData` is an effective way to short-circuit the request and prevent memory exhaustion.
**Prevention:** Implement file size limits early in the request lifecycle, ensuring the application rejects overly large files before allocating significant resources or attempting to read them into buffers.
