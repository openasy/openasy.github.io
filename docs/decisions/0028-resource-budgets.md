# 0028. Resource budgets

- **Decision:** Proposed
- **Implementation:** In progress
- **Where:** `vpn-manager` and `vpn-server` build for amd64 and arm64 and need no external services. Budgets are not measured in CI yet.
- **Priority:** Medium
- **Area:** Operations

## Context

People self-host on small virtual machines and single-board computers. Running well there is an advantage over tools that need a cluster.

## Decision

- Every product publishes its idle and typical use. Default budget for a product without large data: under 256 MB of memory and under 5% of one CPU at idle, an image under 300 MB, and a database that stays small with default retention.
- Agents stay under 64 MB of memory, apart from the software they run (OpenVPN, sensors).
- Every image is built for `linux/amd64` and `linux/arm64` (ADR 0016).
- No required external services: no database server (ADR 0011), no message queue, no cloud API. Optional integrations stay optional.
- CI measures memory, image size and start time for every release and fails when a budget is exceeded by more than 10% without a recorded reason.

## Consequences

- A small VPS with 1 GB of memory can run a handful of products together.
