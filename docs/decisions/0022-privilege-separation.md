# 0022. Privilege separation

- **Decision:** Proposed
- **Implementation:** In progress
- **Where:** `vpn-manager` runs as non-root in a distroless image; `vpn-server` gets only `NET_ADMIN` and `/dev/net/tun`. Desired-state pull and the read-only filesystem are not built yet.
- **Priority:** Critical
- **Area:** Security

## Context

The VPN needs root-level powers: creating TUN devices, changing routes and firewall rules. Giving those powers to the process that also parses web requests would turn any web bug into a host compromise.

## Decision

- Products (API and UI) run as a non-root user in a distroless image, with a read-only root filesystem, no added capabilities and `no-new-privileges`. They never touch the host network.
- Everything that needs privileges runs in a separate agent (ADR 0018) with the smallest set it needs. `vpn-server` gets `NET_ADMIN` and `/dev/net/tun`, not `--privileged` or the host network unless the deployment requires it.
- Inside an agent, the privileged part is as small as possible: the agent drops to an unprivileged user for everything except starting OpenVPN and applying network changes.
- An agent accepts no inbound connections from the product. It pulls its desired state over TLS (ADR 0023), validates it against a fixed schema and refuses anything outside it, for example routes or firewall rules outside the configured networks.
- Trust boundaries are written down per product: browser to product, product to agent, agent to host. A compromised product must not be able to run arbitrary commands on a host through its agents.

## Consequences

- Each product's security page lists its processes, users, capabilities and trust boundaries.
- Container settings in the published compose files and Helm charts follow this record, and CI checks them.
