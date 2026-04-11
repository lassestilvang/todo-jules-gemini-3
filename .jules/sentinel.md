## 2024-05-24 - [Path Traversal in Uploads]
**Vulnerability:** Path Traversal vulnerability in file upload action (`src/actions/upload.ts`) allows users to write files outside the intended `public/uploads` directory by submitting filenames containing `../` (e.g., `../../../etc/passwd`).
**Learning:** The application was directly using the `name` property from the `File` object provided by the `FormData` without sanitization. The Node.js `join` function resolves `../`, causing it to traverse up the directory tree.
**Prevention:** Always sanitize user-provided filenames. Use `path.basename(file.name)` to extract only the actual filename, discarding any directory traversal attempts.
