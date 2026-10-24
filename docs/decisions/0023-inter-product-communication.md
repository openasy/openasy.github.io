# 0023. Communication between products and agents

- **Decision:** Accepted
- **Implementation:** In progress
- **Where:** `infra-agent` and `logs-agent` enrol with a one-time token and then use their own secret; they ask their product for work, keep running when it is unreachable and say so in `/readyz`. `vpn-server` enrols the same way (ADR 0032), pulls its config from `vpn` with `ETag` and a 10 second timeout, keeps the last good config when the manager is unreachable, and takes disconnect requests in the heartbeat answer; servers set up before 0.6.0 may still share `VPN_SERVER_TOKEN` until a later release removes it. `vulns-agent` still shares one token per product. `Idempotency-Key` is not built yet.
- **Area:** Architecture

## Context

Products link to each other (ADR 0001) and agents report to their product (ADR 0018). Without rules, every integration would invent its own authentication, retries and failure behaviour.

## Decision

- Traffic between hosts is HTTPS, through the proxy in front of the products (ADR 0013, 0026). An agent in the same compose network as its product calls it by service name over plain HTTP, which never leaves the host. Products call each other only through public APIs (ADR 0014) with scoped tokens (ADR 0003); a link token is limited to the entities and actions the link needs and expires.
- Agents authenticate with a per-agent identity: a client certificate issued by their product at enrolment, or a per-agent token. A shared token for all agents is only for first enrolment.
- Calls have a timeout (default 10 seconds), retries with exponential backoff and jitter for safe requests, and an `Idempotency-Key` header on every write that may be retried. The receiver keeps keys for 24 hours.
- Events between products are signed webhooks (ADR 0001) with a timestamp and an id, delivered at least once; receivers ignore duplicates.
- Agents pull desired state and push status (ADR 0022). When the product is unreachable, an agent keeps running with the last good configuration, queues status, and reports as degraded in `/readyz`. It never stops working because the product is down.
- Linked products show "connect X to see this" or "X is unreachable" instead of errors (ADR 0001).

## Consequences

- Shared client code for timeouts, retries and idempotency lives in one library per language, so every product behaves the same.
