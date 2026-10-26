# 0031. Nothing installed on hosts: one agent reads them

- **Decision:** Accepted
- **Implementation:** Implemented
- **Where:** `infra-agent` reads hosts over SSH, containers through the host's Docker or Podman and BMCs over Redfish (ADR 0055), and `infra` reads Kubernetes through its API, without installing anything. `vpn-server` stays on its host, because it runs OpenVPN.
- **Area:** Architecture

## Context

An agent on every host is one more thing to install, update, monitor and trust on machines that should run only their own workload. Many teams cannot install software on production hosts at all, and every agent is code with privileges on the host. We design isolated systems: OpenAsy should look at hosts, not live on them.

Reading hosts from one place has its own costs. Whatever holds the credentials can reach every host, so it becomes the most valuable target; the network must let it in; and it only sees what it asks for, when it asks. That place must not be the web application people use, where one bug would hand out a shell on every host.

## Decision

- Hosts are read by an agent installed once, next to the product or in the network of the hosts (ADR 0018), not by the product and not by software on each host. Nothing is installed on the host, nothing is written there, and nothing keeps running there after a collection.
- **The agent holds the keys; the product holds none.** The agent makes its SSH certificate authority and keys on first start and keeps them sealed with its own key-encryption key. The product tells it which host to read, never what to run: the collection script is built into the agent, every job is checked again by the agent, and certificates are always for the `openasy` principal. A compromised product therefore cannot run commands of its own on any host.
- The agent connects out to the product and asks for work; the product never connects to it. It enrols once with a one-time token and then has its own secret (ADR 0023). An agent of another version is refused (ADR 0019).
- One agent per network: hosts behind a firewall are read by an agent there, which only needs to reach the product, rather than opening every network to one place. Each agent has its own CA, so hosts trust only the agent of their network.
- **Hosts** are read over SSH as a dedicated, unprivileged account (`openasy`) with read-only commands. The account has no password, no interactive shell use, no port or agent forwarding and no TTY.
- **Credentials are short-lived.** The agent signs a certificate for each collection, valid for 5 minutes and only for the `openasy` principal. Hosts trust it with `TrustedUserCAKeys` and accept it only for that account through `AuthorizedPrincipalsFile`, so the authority can never log in as root or anyone else. A fixed key in `authorized_keys`, limited with `restrict`, is supported for hosts that cannot change `sshd_config`: the agent's own, or one the install brings. A host in the hosts file (ADR 0052) names that one with `keyFile`, a file name in the agent's read-only key folder (`/keys`); Infrastructure and Logs keep and send only the name, and the agent reads the key itself, so they never hold anything that opens a host. A certificate is useless five minutes after it is signed, but a stolen CA, like a stolen fixed key, opens the hosts until they stop trusting it.
- **Host keys are pinned** when a host is added, after an admin checks the fingerprint the agent reports. A changed host key stops collection for that host until an admin accepts it.
- **Privileges are opt-in and named.** Without them, what needs root is shown as "not readable". With them, the host gets a `sudoers` file the agent generates to match its script, which allows a fixed list of read-only commands with fixed arguments and nothing else. Reading containers needs access to the Docker socket, which is equivalent to root on that host; it is a separate switch, off by default, and the UI says so.
- **Clusters** are read through the Kubernetes API with a token for a read-only ClusterRole the product provides. It cannot read Secrets or ConfigMaps (RBAC cannot limit a list to names) or change anything.
- **Secrets are not collected.** Environment variables are kept by name only. Values that look like passwords, tokens or keys in command lines are masked by the agent, so they never leave the network of the host.
- Hosts that one agent cannot reach directly can be reached through an SSH jump host read by the same agent.
- Cluster tokens are encrypted at rest with the product's key-encryption key (ADR 0021).

## Consequences

- The trust boundaries are browser to product, agent to product, and agent to host over SSH. A compromised product can make agents collect, but not run anything else, and learns nothing it did not already store. A compromised agent can run commands as the unprivileged `openasy` account on the hosts that trust its CA, and the read-only `sudo` commands where they were allowed; it cannot log in as anyone else, and a certificate is useless 5 minutes after the agent is stopped. Each product's security page says this plainly.
- Changes are seen at the collection interval (5 minutes by default). Something that lives for seconds, such as a short process, is the job of Runtime, which does run on hosts.
- Collection is a read-only, idempotent script run over one SSH connection, tested against real `sshd`, Docker and Kubernetes servers in CI (ADR 0029).
- `vulns` takes its package lists from Infrastructure when `INFRA_VULNS_URL` is set, so hosts without `vulns-agent` are covered too. infra-agent reads each package's source package (deb source, src.rpm, apk origin) and Infrastructure sends them as a CycloneDX SBOM with it, which is what Grype matches advisories by: the findings are the ones a scan on the host gives.
