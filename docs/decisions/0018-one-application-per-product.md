# 0018. One application per product; agents are separate

- **Decision:** Accepted
- **Implementation:** Implemented
- **Where:** `vpn-manager` and `vpn-server` (an agent on the host), `vulns` and `vulns-agent`, `infra` and `infra-agent` (an agent in one place that reads many hosts).
- **Area:** Architecture

## Context

Each product has an API and a web UI, and some also need software on hosts (the OpenVPN server, Runtime and Network IDS sensors, backup agents). Splitting a product into microservices would multiply versions, deployments and failure modes, and SQLite works best with a single writer.

## Decision

- Inside a product there are no microservices: the API and the web UI live in one repository, run in one process and ship in one container with one version.
- The repository may separate `server/` and `web/`, but they are released together. With forward-only upgrades (ADR 0010) there is never a UI talking to an API of another version.
- The web UI is an ordinary client of the public API (ADR 0014). The product can run headless, with the UI switched off.
- One process owns the product's SQLite database. Nothing else opens the file.
- Products integrate only through their public APIs, signed webhooks and OIDC. No product reads another product's database.
- Everything that collects data or acts on hosts is a separate agent, outside the product. An agent runs in one of two ways:
  - **On a host**, only for work that must happen there: `vpn-server` runs OpenVPN; Runtime and Network IDS sensors watch the host.
  - **In one place**: installed once, it gets its settings there and reads many hosts at intervals, without installing anything on them. `infra-agent` works this way (ADR 0031).
- Agents have no database of their own, talk only to their product's API, and are versioned with it.

## Consequences

- A product is installed as one container plus its agents where needed; for VPN that is `vpn-manager` (API and UI) and `vpn-server` (OpenVPN on the host), for Infrastructure `infra` and one `infra-agent` per network.
- Scaling a product means running a bigger instance, not more services. Large data paths (logs, metrics, traces) use their own storage engines inside the same product.
