# 0018. One application per product; agents and servers are separate

- **Decision:** Accepted
- **Implementation:** Implemented
- **Where:** `vpn` and `vpn-server` (a server on the host), `vulns` and `vulns-agent` (an agent on each host), `infra` and `infra-agent`, and `logs` and `logs-agent` (an agent in one place that reads many hosts).
- **Area:** Architecture

## Context

Each product has an API and a web UI, and some also need software on hosts (the OpenVPN server, Runtime and Network IDS sensors, backup agents). Splitting a product into microservices would multiply versions, deployments and failure modes, and SQLite works best with a single writer.

## Decision

- Inside a product there are no microservices: the API and the web UI live in one repository, run in one process and ship in one container with one version.
- The repository may separate `server/` and `web/`, but they are released together. With forward-only upgrades (ADR 0010) there is never a UI talking to an API of another version.
- The web UI is an ordinary client of the public API (ADR 0014). The product can run headless, with the UI switched off.
- One process owns the product's SQLite database. Nothing else opens the file.
- Products integrate only through their public APIs, signed webhooks and OIDC. No product reads another product's database.
- Everything outside the application is a separate part, of one of two kinds, named after the product:
  - **Agents** (`<product>-agent`) collect data. An agent runs on a host only for work that must happen there (`vulns-agent` reads the host's packages; Runtime and Network IDS sensors watch the host). Otherwise it runs in one place: installed once, it gets its settings there and reads many hosts at intervals, without installing anything on them. `infra-agent` works this way (ADR 0031).
  - **Servers** (`<product>-server`) carry traffic themselves, where it has to pass: `vpn-server` runs OpenVPN on the host the clients connect to.
- The application itself is named after the product alone (`vpn`, `vulns`, `infra`), with no suffix. Until 0.4.0 the VPN application was called `vpn`; it was renamed to follow this.
- Agents and servers take their settings from the application, have no database of their own, talk only to their product's API, and are versioned with it (ADR 0019).

## Consequences

- A product is installed as one container plus its agents or servers where needed; for VPN that is `vpn` (API and UI) and `vpn-server` (OpenVPN on the host), for Vulnerabilities `vulns` and `vulns-agent` on each host, for Infrastructure `infra` and one `infra-agent` per network.
- Scaling a product means running a bigger instance, not more services. Large data paths (logs, metrics, traces) use their own storage engines inside the same product.
