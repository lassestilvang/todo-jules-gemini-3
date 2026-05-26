## 2024-05-25 - Fix IP Extraction for Rate Limiting
**Vulnerability:** The rate limiter was using `.pop()` on the `x-forwarded-for` header to extract the client IP. `x-forwarded-for` contains a comma-separated list of IPs. The last IP (extracted by `.pop()`) is often the IP of the shared reverse proxy or load balancer, not the originating client.
**Learning:** This could cause a global Denial of Service (DoS) where all users are grouped into one rate limit bucket because they share the same reverse proxy IP.
**Prevention:** Use `.split(',')[0]?.trim()` to get the originating client IP (the first IP in the list).
