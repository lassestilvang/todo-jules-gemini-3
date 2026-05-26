## 2024-05-25 - Fix IP Extraction for Rate Limiting
**Vulnerability:** The rate limiter was using `.pop()` on the `x-forwarded-for` header to extract the client IP. `x-forwarded-for` contains a comma-separated list of IPs. The last IP (extracted by `.pop()`) is often the IP of the shared reverse proxy or load balancer, not the originating client.
**Learning:** This could cause a global Denial of Service (DoS) where all users are grouped into one rate limit bucket because they share the same reverse proxy IP.
**Prevention:** Use `.split(',')[0]?.trim()` to get the originating client IP (the first IP in the list).

## 2025-05-26 - Prevent Path Traversal via Backslashes
**Vulnerability:** File deletion logic used `split('/').pop()` to extract filenames from file paths. This failed to account for Windows-style backslashes (`\`), allowing path traversal if an attacker uploaded a file with a name like `..\..\etc\passwd`.
**Learning:** Always normalize paths or explicitly split on both forward slashes and backslashes when sanitizing user-provided filenames across different operating systems.
**Prevention:** Use `path.split(/[\/\\\\]/).pop()` to securely extract the base filename, and ensure it is not `.` or `..`.
