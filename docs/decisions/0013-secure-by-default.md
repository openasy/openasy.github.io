# 0013. Secure by default

- **Decision:** Accepted
- **Implementation:** In progress
- **Where:** Every product prints a one-time link that creates the owner, encrypts sign-in secrets with a mounted key, and logs every sign-in and change to members and tokens (`@openasy/auth`). `vpn-server`, `infra-agent` and `logs-agent` enrol with a one-time token and then use a secret of their own (ADR 0032); `vulns-agent` still shares one token per product. `vpn` seals its CA key (ADR 0021). Identity keeps an audit log of sign-ins and changes for 400 days. TLS between products, and an append-only audit log in every product, are not built yet.
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
