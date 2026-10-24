# 0026. Network exposure and TLS

- **Decision:** Proposed
- **Implementation:** In progress
- **Where:** The install builder puts every product behind Caddy, nginx or Apache, publishes only the proxy, binds a host proxy's ports to `127.0.0.1`, and can use Caddy's own CA on an internal network. `<PRODUCT>_METRICS_PORT` moves `/metrics` to a port of its own. `OPENASY_TRUSTED_PROXIES` and HSTS are not built yet.
- **Priority:** Critical
- **Area:** Security

## Context

Many incidents start with a port published by accident, for example a Docker `-p 8080:8080` that bypasses the host firewall, or a management port reachable from the internet.

## Decision

- **TLS ends at a proxy, not in the product.** A product serves plain HTTP on 8080 inside its own network and is reached from outside only through a TLS proxy: Caddy in the install's compose file, which gets its certificates by ACME, nginx or Apache on the host with certbot, or the install's own. A product never holds a certificate of its own. Plain HTTP at the proxy only redirects (ADR 0013).
- Inside one compose network, products and their agents talk plain HTTP by service name, such as `http://dast:8080`; an agent in another network reaches its product's HTTPS address through the proxy (ADR 0023).
- On a network the internet cannot reach, the install builder's Caddy can use its own CA in place of ACME. Every computer that opens the products trusts its root once, and the products trust it too.
- Only the proxy is published. Every other port, such as a product's for a proxy on the host, is published on `127.0.0.1` unless it is meant for the public, such as the VPN's 1194/udp or 443/tcp. The docs explain that Docker-published ports bypass host firewalls.
- `X-Forwarded-*` headers are trusted only from addresses listed in `OPENASY_TRUSTED_PROXIES`; by default none are trusted.
- `/metrics` and other management endpoints can be bound to a separate address or port, and are not public by default.
- TLS 1.2 or newer with modern ciphers and HSTS at the proxy; secure, HTTP-only, SameSite cookies from the product.

## Consequences

- A fresh install exposes nothing to the internet except what the product exists for, and Posture checks for it (ADR 0013).
