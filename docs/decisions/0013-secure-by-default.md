# 0013. Secure by default

- **Decision:** Accepted
- **Implementation:** In progress
- **Where:** `vulns` and `vpn-manager` print a one-time link that creates the owner, encrypt TOTP secrets with a mounted key, and log every sign-in and change to members and tokens (`@openasy/auth`). `vpn-server` authenticates to `vpn-manager` with a token; the VPN CA key is not encrypted yet (ADR 0021). TLS between products and an append-only audit log are not built yet.
- **Area:** Security

## Context

Most breaches use defaults nobody changed.

## Decision

- TLS everywhere, including between products. Plain HTTP only redirects.
- No default passwords: the first start prints a one-time link to create the owner.
- Secrets (tokens, keys, passwords) are encrypted at rest.
- Every admin action is written to an append-only audit log that can be streamed to SIEM.

## Consequences

- A fresh install passes our own Posture checks.

## Where you can see it

- [Audit log](https://openasy.github.io/ui/?path=/story/products-identity--audit-log)
