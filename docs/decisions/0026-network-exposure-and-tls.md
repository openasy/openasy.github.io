# 0026. Network exposure and TLS

- **Decision:** Proposed
- **Implementation:** Not started
- **Priority:** Critical
- **Area:** Security

## Context

Many incidents start with a port published by accident, for example a Docker `-p 8080:8080` that bypasses the host firewall, or a management port reachable from the internet.

## Decision

- Products listen on HTTPS (8443) only. Plain HTTP, if enabled, only redirects (ADR 0013). On first start a product creates a self-signed certificate and shows its fingerprint; you replace it with your own certificate or enable ACME.
- Examples publish ports on `127.0.0.1` unless the port is meant for the public, such as the VPN's 1194/udp or 443/tcp. The docs explain that Docker-published ports bypass host firewalls.
- Products work behind a reverse proxy. `X-Forwarded-*` headers are trusted only from addresses listed in `OPENASY_TRUSTED_PROXIES`; by default none are trusted.
- `/metrics` and other management endpoints can be bound to a separate address or port, and are not public by default.
- TLS 1.2 or newer with modern ciphers; HSTS on HTTPS responses; secure, HTTP-only, SameSite cookies.

## Consequences

- A fresh install exposes nothing to the internet except what the product exists for, and Posture checks for it (ADR 0013).
