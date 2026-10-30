// How far each product is built, what it runs on, and how people connect to it.
// A product without an entry is Designed, or Planned when it is listed in PLANNED. When one ships, set its status, version and features here:
// the home page, the lists and every page follow.
// No React or @openasy/ui imports here, like goals.ts.

/**
 * Preview: released for testing. In progress: being built now. Designed: screens in Storybook only. Planned: a page
 * that says what it will do, and nothing more yet. Add "Available" with the first stable release.
 */
export type ProductStatus = "Preview" | "In progress" | "Designed" | "Planned";

export const STATUS_TONE: Record<ProductStatus, "success" | "warning" | "neutral"> = {
  Preview: "success",
  "In progress": "warning",
  Designed: "neutral",
  Planned: "neutral",
};

/** What a visitor can do with it, for goals that need several products. */
export type Readiness = "Ready to try" | "In progress" | "Designed";

export const READINESS_TONE: Record<Readiness, "success" | "warning" | "neutral"> = {
  "Ready to try": "success",
  "In progress": "warning",
  Designed: "neutral",
};

export interface Feature {
  title: string;
  done: boolean;
}

/** An open source project the product is built on. */
export interface Upstream {
  name: string;
  url: string;
  role: string;
}

export interface Client {
  platform: string;
  apps: { name: string; url: string }[];
}

/** Kubernetes install with the product's Helm chart, published as an OCI artifact next to its images. */
export interface Helm {
  /** oci://… reference of the chart. */
  chart: string;
  /** What the chart installs, in one sentence. */
  summary: string;
  /** Extra --set flags for the full install, if any. */
  set?: string[];
  /** For nodes that report to a product running elsewhere. */
  agentsOnly?: { summary: string; set: string[] };
  /** Requirements a cluster admin must know, such as Pod Security. */
  note?: string;
}

/** A task after installing, with the command for it. */
export interface Guide {
  title: string;
  text: string;
  code?: string;
}

/** One way to lay a product out, for products where the right one depends on the team. */
export interface Deployment {
  id: string;
  /** Tab label. */
  label: string;
  /** Who it suits, in one sentence. */
  fits: string;
  /** Starts with the compose file for one host. */
  compose?: boolean;
  /** `{version}` in code is the released version. */
  steps: Guide[];
  /** First release that supports it: until then the page does not show it. */
  since: string;
}

export interface ProductState {
  status: ProductStatus;
  /**
   * Signs people in with @openasy/auth: compose mounts a secrets key (openasy-kek), and the first start prints a
   * one-time link that creates the owner (ADR 0002, 0013).
   */
  signIn?: boolean;
  /** Released version, used as the image tag. */
  version?: string;
  /** Shown under the summary, for limits people must know before they run it. */
  note?: string;
  features: Feature[];
  /** For a Designed or In progress product: the plan, open to change. */
  upstream: Upstream[];
  /** Steps for the people who connect, not for the admin. */
  connect?: string[];
  clients?: Client[];
  helm?: Helm;
  guides?: Guide[];
  deployments?: Deployment[];
}

const DESIGNED: ProductState = { status: "Designed", features: [], upstream: [] };
const PLANNED_STATE: ProductState = { status: "Planned", features: [], upstream: [] };

/** Products with a page and no screens yet. Move one out once its screens are in Storybook. */
const PLANNED = new Set([
  "audience",
  "consent",
  "messages",
  "crm",
  "campaigns",
  "forms",
  "hr",
  "recruiting",
  "time",
  "payroll",
  "helpdesk",
  "live-chat",
  "knowledge-base",
  "invoices",
  "expenses",
  "purchasing",
  "contracts",
  "inventory",
  "assets",
]);

// The panel and a vpn-server on their own hosts (ADR 0032). vpn never connects to a server: servers reach it over HTTPS.
const VPN_PANEL = `openssl rand -hex 32 > openasy-kek   # keep it with your backups
docker run -d --name vpn --restart unless-stopped \\
  -p 127.0.0.1:8080:8080 -v vpn-data:/data \\
  -v "$PWD/openasy-kek:/run/secrets/openasy-kek:ro" \\
  -e VPN_PUBLIC_URL=https://vpn.internal.example.com \\
  ghcr.io/openasy/vpn:{version}
docker logs vpn | grep "no owner yet"   # one-time link that creates the owner`;
const vpnServer = (address: string) => `# on ${address}
docker run -d --name vpn-server --restart unless-stopped \\
  --cap-add NET_ADMIN --device /dev/net/tun --sysctl net.ipv4.ip_forward=1 \\
  -p 1194:1194/udp -v vpn-server-data:/var/lib/openasy-vpn \\
  -e VPN_URL=https://vpn.internal.example.com \\
  -e VPN_ENROLL_TOKEN=ove_... \\
  ghcr.io/openasy/vpn-server:{version}`;

export const STATUS: Partial<Record<string, ProductState>> = {
  vulnerabilities: {
    status: "Preview",
    version: "0.7.0",
    signIn: true,
    note: "Serve it over HTTPS and set VULNS_PUBLIC_URL to that address: cookies and passkeys need it. There is no email yet, so invitations and password resets are links an admin sends.",
    helm: {
      chart: "oci://ghcr.io/openasy/charts/vulns",
      summary: "vulns as one pod with its volume, and vulns-agent on every node as a DaemonSet. Tokens are generated on install and kept across upgrades.",
      agentsOnly: {
        summary: "Already running vulns elsewhere? Install only the agents, and every node of the cluster reports to it.",
        set: ["vulns.enabled=false", "agent.url=https://vulns.example.com", "auth.ingestToken=$VULNS_INGEST_TOKEN"],
      },
      note: "vulns-agent reads each node's / through a read-only hostPath mount, which the Pod Security baseline and restricted levels forbid: allow it for the namespace (pod-security.kubernetes.io/enforce=privileged). vulns itself meets restricted. Clusters that forbid hostPath, such as GKE Autopilot, cannot run the agent.",
    },
    guides: [
      {
        title: "Add a host",
        text: "Run vulns-agent on each host that is not a Kubernetes node. It reads the package databases through a read-only mount, as an unprivileged user, and only sends the SBOM.",
        code: `docker run -d --name vulns-agent --restart unless-stopped --hostname "$(hostname)" \\
  --read-only --tmpfs /tmp --cap-drop ALL --security-opt no-new-privileges \\
  -v /:/host:ro -e VULNS_URL=https://vulns.example.com -e VULNS_INGEST_TOKEN=... \\
  ghcr.io/openasy/vulns-agent:0.6.0`,
      },
      {
        title: "Check images in CI",
        text: "Send an SBOM after each build. With wait=true the answer holds the findings, so the job can fail on known exploited or critical vulnerabilities.",
        code: `syft "$IMAGE" -o syft-json | curl -sf -X POST -H "Authorization: Bearer $VULNS_INGEST_TOKEN" \\
  -H 'content-type: application/json' --data-binary @- \\
  "https://vulns.example.com/api/v1/sboms?kind=image&name=$IMAGE&wait=true" > result.json
jq -e '.knownExploited == 0 and .open.critical == 0' result.json`,
      },
      {
        title: "Run without internet",
        text: "Turn downloads off with VULNS_FEED_UPDATE_HOURS=0. Download the vulnerability data on a machine that has access, then upload it with an API token that has the admin role (Settings → API tokens); every host and image is matched again.",
        code: `grype db download -o vulnerability-db.tar.zst
curl -sf -X PUT -H "Authorization: Bearer $VULNS_API_TOKEN" -H 'content-type: application/zstd' \\
  --data-binary @vulnerability-db.tar.zst https://vulns.example.com/api/v1/feed`,
      },
    ],
    features: [
      { title: "Hosts: vulns-agent sends an SBOM of the host's packages, read-only and unprivileged, with no SSH", done: true },
      { title: "Images: CI sends an SBOM and can fail the build on the result", done: true },
      { title: "Known exploited (CISA KEV) first, then risk from severity and EPSS", done: true },
      { title: "Grouped by source package, with the version that fixes it", done: true },
      { title: "Every asset matched again when the vulnerability data changes, without scanning again", done: true },
      { title: "Accepted risk with a reason and an expiry", done: true },
      { title: "Servers in the shared hosts file that send no scan (OPENASY_HOSTS)", done: true },
      { title: "Works without internet: import the vulnerability data", done: true },
      { title: "REST API with an OpenAPI reference, and Prometheus metrics", done: true },
      { title: "Sign-in with passkeys, authenticator apps or your identity provider (OIDC), straight to it if you choose", done: true },
      { title: "Roles per member (owner, admin, editor, viewer), and API tokens with a role and an expiry", done: true },
      { title: "Policies, and tickets for fixes", done: false },
      { title: "Linking with Infrastructure for internet-facing and running context", done: false },
    ],
    upstream: [
      { name: "Grype", url: "https://github.com/anchore/grype", role: "matching and vulnerability data" },
      { name: "Syft", url: "https://github.com/anchore/syft", role: "package inventory (SBOM) on hosts" },
      { name: "SQLite", url: "https://sqlite.org/", role: "storage" },
      { name: "Swagger UI", url: "https://github.com/swagger-api/swagger-ui", role: "API reference" },
    ],
  },
  infrastructure: {
    status: "Preview",
    version: "0.7.0",
    signIn: true,
    note: "infra-agent holds the SSH certificate authority your hosts trust, sealed with its own key: keep openasy-agent-kek apart from its volume, and run one agent per network. Serve Infrastructure over HTTPS.",
    guides: [
      {
        title: "Prepare a host",
        text: "Nothing is installed: one account, and sshd trusts the CA of your infra-agent for that account only. Setup in the UI prints these lines with the agent's CA, and an optional sudoers file for the details that need root.",
        code: `useradd --create-home --shell /bin/sh openasy && passwd -l openasy
install -d -m 755 /etc/ssh/principals && echo openasy > /etc/ssh/principals/openasy
echo 'ssh-ed25519 AAAA... OpenAsy Infrastructure CA' > /etc/ssh/openasy_ca.pub
cat > /etc/ssh/sshd_config.d/openasy.conf <<'EOF'
TrustedUserCAKeys /etc/ssh/openasy_ca.pub
AuthorizedPrincipalsFile /etc/ssh/principals/%u
Match User openasy
  AllowTcpForwarding no
  AllowAgentForwarding no
  X11Forwarding no
  PermitTTY no
EOF
sshd -t && systemctl reload ssh`,
      },
      {
        title: "Check the host key",
        text: "List the host in inventory/hosts.yaml. The agent reports the fingerprint the host presents; compare it on the host before accepting, or name it there with hostKey. If the key changes later, collection stops until an admin accepts the new one.",
        code: "ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub",
      },
      {
        title: "Read a BMC",
        text: "Make an account with the ReadOnly role on the BMC, put its password in keys/ssh/db-1-bmc, and list the BMC under bmcs: in inventory/hosts.yaml with passwordFile: db-1-bmc. The agent reports the BMC's certificate; compare its fingerprint before accepting it, or name it there with certificate. Most BMCs take the new account in one Redfish call; iDRAC fills a free slot instead (PATCH /redfish/v1/AccountService/Accounts/3 with the same body).",
        code: `curl -k -u admin -X POST https://10.0.9.6/redfish/v1/AccountService/Accounts \\
  -H 'Content-Type: application/json' \\
  -d '{"UserName": "openasy", "Password": "...", "RoleId": "ReadOnly", "Enabled": true}'
openssl s_client -connect 10.0.9.6:443 </dev/null 2>/dev/null | openssl x509 -noout -fingerprint -sha256`,
      },
      {
        title: "Add a Kubernetes cluster",
        text: "Apply the read-only role from Setup (no Secrets, no ConfigMaps, nothing it can change), then add the cluster with its API server URL, CA and this token. Nothing runs in the cluster.",
        code: "kubectl -n openasy get secret openasy-infra-token -o jsonpath='{.data.token}' | base64 -d",
      },
    ],
    features: [
      {
        title:
          "One infra-agent per network reads hosts over SSH with 5-minute certificates, trusted for one unprivileged account only; nothing installed on hosts",
        done: true,
      },
      { title: "The agent keeps the SSH keys and runs only its own script: a compromised Infrastructure cannot run commands on hosts", done: true },
      { title: "System, processes, listening ports, services, cron, accounts, sudo, SSH keys, packages, firewall, storage and network", done: true },
      { title: "Every change kept: a new account, an opened port, a package version, a reboot", done: true },
      { title: "Pinned host keys: collection stops when a host key changes", done: true },
      { title: "Docker and Podman containers, with environment variables by name only", done: true },
      { title: "Kubernetes through its API with a read-only token: nodes, workloads, pods, services, volumes, cluster admins", done: true },
      { title: "Hosts in other networks through jump hosts", done: true },
      { title: "Optional read-only sudo rules with fixed arguments, checked against every known way out", done: true },
      {
        title:
          "Servers from a file that Logs, Vulnerabilities, Posture, Malware and Backups read too (OPENASY_HOSTS); a host key named there is trusted without an admin",
        done: true,
      },
      {
        title: "BMCs over Redfish (iDRAC, iLO, XClarity): hardware, firmware, health, accounts and network services, with GET only and a pinned certificate",
        done: true,
      },
      { title: "Cloud accounts (AWS, Hetzner and others) and hosts without SSH access", done: false },
      { title: "Package lists to Vulnerabilities, so hosts need no vulns-agent", done: true },
      { title: "Windows over SSH or WinRM", done: false },
    ],
    upstream: [
      { name: "OpenSSH", url: "https://www.openssh.com/", role: "the connection, certificates and host keys" },
      { name: "Kubernetes API", url: "https://kubernetes.io/docs/reference/kubernetes-api/", role: "clusters" },
      { name: "Redfish", url: "https://www.dmtf.org/standards/redfish", role: "BMCs" },
      { name: "SQLite", url: "https://sqlite.org/", role: "storage" },
      { name: "Swagger UI", url: "https://github.com/swagger-api/swagger-ui", role: "API reference" },
    ],
  },
  logs: {
    status: "Preview",
    version: "0.7.0",
    signIn: true,
    features: [
      { title: "Syslog over TLS, OpenTelemetry, Loki, Elasticsearch bulk and JSON lines, each source with its own token", done: true },
      { title: "logs-agent: reads the journal and container logs over SSH, with nothing installed on hosts", done: true },
      { title: "Pipelines before storage: parse, map levels, mask, drop and sample", done: true },
      { title: "Search in LogsQL, facets, volume over time and live tail", done: true },
      { title: "Saved views, with a threshold that calls a signed webhook", done: true },
      { title: "Retention, and a record of who searched for what", done: true },
      { title: "Hosts from the same file as Infrastructure (OPENASY_HOSTS)", done: true },
      { title: "Links from a host to Infrastructure", done: true },
    ],
    upstream: [
      { name: "VictoriaLogs", url: "https://docs.victoriametrics.com/victorialogs/", role: "storage and LogsQL" },
      { name: "SQLite", url: "https://sqlite.org/", role: "sources, pipelines and saved views" },
    ],
  },
  sast: {
    status: "Preview",
    version: "0.7.0",
    signIn: true,
    features: [
      { title: "Send SARIF from CI and get back whether the check passes", done: true },
      { title: "Compare every branch with the default branch: only what is new can fail", done: true },
      { title: "Findings that survive moved lines", done: true },
      { title: "False positives and accepted risk, with a reason and an end date", done: true },
      { title: "A policy per repository: which severity fails a check", done: true },
      { title: "A status and a comment on GitHub pull requests, with only what they add", done: true },
      { title: "Checks and comments on GitLab merge requests", done: true },
      { title: "Follow the repositories of a GitHub account or a GitLab group and scan each default branch when it moves", done: true },
      { title: "sast-agent: clone and scan with Opengrep, away from the product", done: true },
      { title: "Rules: OpenAsy's own, and rule repositories an install adds", done: true },
      { title: "Rules written and switched off under Rules in sast", done: true },
    ],
    upstream: [
      { name: "Opengrep", url: "https://github.com/opengrep/opengrep", role: "analysis" },
      { name: "SARIF", url: "https://sarifweb.azurewebsites.net/", role: "findings from any analyser" },
      { name: "SQLite", url: "https://sqlite.org/", role: "repositories, scans, findings and decisions" },
    ],
  },
  secrets: {
    status: "Preview",
    version: "0.5.0",
    signIn: true,
    features: [
      { title: "Send gitleaks or TruffleHog reports from CI and get back whether the check passes", done: true },
      { title: "The secret is never stored: snippets are dropped and fingerprints are salted", done: true },
      { title: "A pull request fails for a secret it adds, not for moved ones", done: true },
      { title: "Revoked, false positive and accepted risk, each with a reason", done: true },
      { title: "A policy per repository: which severity fails a check", done: true },
      { title: "secrets-agent: scan repositories, images and CI logs", done: false },
      { title: "Link a finding to the product that issued the key", done: false },
    ],
    upstream: [
      { name: "gitleaks", url: "https://github.com/gitleaks/gitleaks", role: "detection in repositories" },
      { name: "TruffleHog", url: "https://github.com/trufflesecurity/trufflehog", role: "detection with verification" },
      { name: "SQLite", url: "https://sqlite.org/", role: "repositories, scans, findings and decisions" },
    ],
  },
  malware: {
    status: "Preview",
    version: "0.7.0",
    signIn: true,
    features: [
      { title: "Send ClamAV or YARA scan reports and get back whether the check passes", done: true },
      { title: "A source's report replaces its engine's earlier view: gone is cleaned, returning reopens", done: true },
      { title: "Only path, signature, hash and size are kept, never file contents", done: true },
      { title: "Quarantined, false positive and allowed, each recorded with who and when", done: true },
      { title: "Servers in the shared hosts file that have no malware scan (OPENASY_HOSTS)", done: true },
      { title: "malware-agent: ClamAV and YARA over its host and the servers in the hosts file, read-only", done: true },
      { title: "OpenAsy's own YARA rules: web shells, miners, reverse shells", done: true },
      { title: "Buckets, upload points and quarantine", done: false },
    ],
    upstream: [
      { name: "ClamAV", url: "https://www.clamav.net/", role: "signature scanning" },
      { name: "YARA", url: "https://virustotal.github.io/yara/", role: "rule based detection" },
      { name: "SQLite", url: "https://sqlite.org/", role: "sources, detections and decisions" },
    ],
  },
  siem: {
    status: "Preview",
    version: "0.6.0",
    signIn: true,
    features: [
      { title: "Events in as JSON, kept with a retention period", done: true },
      { title: "Sigma rules with selections, modifiers and conditions, and a clear refusal for what is not supported", done: true },
      { title: "One signal per rule and host in a window, with count and sample events", done: true },
      { title: "Test a rule against recent events before enabling it", done: true },
      { title: "Severe signals open an incident in Incidents", done: true },
      { title: "Sigma correlation rules: counts, distinct values and rules in order, per group within a timespan", done: true },
      { title: "siem-agent: reads the security events of the journal over SSH, with nothing installed on hosts", done: true },
      { title: "Links to Logs and Alerts, and Sigma aggregations in a detection", done: false },
    ],
    upstream: [
      { name: "Sigma", url: "https://sigmahq.io/", role: "detection rule format" },
      { name: "SQLite", url: "https://sqlite.org/", role: "events, rules and signals" },
    ],
  },
  incidents: {
    status: "Preview",
    version: "0.5.0",
    signIn: true,
    features: [
      { title: "Open an incident with severity, commander and the products involved", done: true },
      { title: "An append-only timeline: status and severity changes write themselves", done: true },
      { title: "Tasks, evidence links and a postmortem once resolved", done: true },
      { title: "Other products open an incident over the API; the same reference never opens two", done: true },
      { title: "SIEM and Uptime open incidents, with a link back to the signal or the check", done: true },
      { title: "Incidents from Alerts, and notifications", done: false },
    ],
    upstream: [{ name: "SQLite", url: "https://sqlite.org/", role: "incidents, timeline and tasks" }],
  },
  analytics: {
    status: "In progress",
    signIn: true,
    features: [
      { title: "Sites listed in one YAML file, applied whole and read again within a minute", done: true },
      { title: "One script tag per site: page views, time and scroll, clicks and the site's own events", done: true },
      { title: "Visitors, pages, sources and campaigns, devices, goals, and every visit in order", done: true },
      { title: "Consent per site, and a visitor's data exported or deleted", done: true },
      { title: "Form values, IP addresses and query strings left out before anything is stored", done: true },
      { title: "Funnels, heatmaps, form analysis and session replays", done: false },
    ],
    upstream: [{ name: "SQLite", url: "https://sqlite.org/", role: "visits, events and daily totals" }],
  },
  mail: {
    status: "In progress",
    signIn: true,
    features: [
      { title: "Domains, mailboxes, aliases and quotas in one YAML file, applied to Stalwart whole", done: true },
      { title: "Webmail: folders, search, reading with outside pictures held back, writing and replying", done: true },
      { title: "A password for each mail app, made and removed by the person", done: true },
      { title: "MX, SPF, DKIM, DMARC and MTA-STS records checked for each domain", done: true },
      { title: "Tested against a running Stalwart", done: false },
      { title: "Filters, out-of-office replies, delivery reports and import over IMAP", done: false },
    ],
    upstream: [{ name: "Stalwart", url: "https://stalw.art/", role: "the mail server: receiving, sending, storage and spam filtering" }],
  },
  errors: {
    status: "Preview",
    version: "0.5.0",
    signIn: true,
    features: [
      { title: "Events from applications with a project key", done: true },
      { title: "Issues grouped by exception and the top application frames, not by line numbers", done: true },
      { title: "Users affected, releases and the latest events with stack traces", done: true },
      { title: "A fix that did not hold reopens the issue as a regression", done: true },
      { title: "Per-project rate limit and scrubbing of passwords and tokens", done: true },
      { title: "SDKs and source maps", done: false },
    ],
    upstream: [{ name: "SQLite", url: "https://sqlite.org/", role: "projects, issues and events" }],
  },
  "supply-chain": {
    status: "Preview",
    version: "0.5.0",
    signIn: true,
    features: [
      { title: "Keep the SBOM, signature result and provenance that CI reports for each image", done: true },
      { title: "A policy: signed by a known identity, SBOM present, minimum SLSA level, licence allow and deny lists", done: true },
      { title: "Ask whether an image is allowed, for admission and CI; unknown images are denied", done: true },
      { title: "Exceptions with a reason and an end date", done: true },
      { title: "Which images contain a package, and a licence summary per image", done: true },
      { title: "Verify signatures and provenance itself, and an admission webhook", done: false },
    ],
    upstream: [
      { name: "Sigstore cosign", url: "https://github.com/sigstore/cosign", role: "signatures, verified by your CI" },
      { name: "SLSA", url: "https://slsa.dev/", role: "provenance levels" },
      { name: "CycloneDX and SPDX", url: "https://cyclonedx.org/", role: "SBOM formats" },
      { name: "SQLite", url: "https://sqlite.org/", role: "images, evidence and policy" },
    ],
    note: "Supply Chain records what your CI reports and judges it against your policy. It does not verify signatures or provenance itself yet.",
  },
  audit: {
    status: "Preview",
    version: "0.5.0",
    signIn: true,
    features: [
      { title: "Send osv-scanner JSON or SARIF from Trivy and Grype, and get back whether the check passes", done: true },
      { title: "Compare every branch with the default branch: only what a change adds can fail", done: true },
      { title: "Severity from the CVSS vector, then the database's label; nothing unrated is ignored", done: true },
      { title: "Not affected, false positives and accepted risk, with a reason and an end date", done: true },
      { title: "Where a package is used, across every project", done: true },
      { title: "Scans that run for you, without CI", done: false },
    ],
    upstream: [
      { name: "osv-scanner", url: "https://github.com/google/osv-scanner", role: "advisories for lockfiles, run by your CI" },
      { name: "OSV", url: "https://osv.dev/", role: "the advisory database the scanners read" },
      { name: "SQLite", url: "https://sqlite.org/", role: "projects, scans, advisories and decisions" },
    ],
    note: "Audit reads what your scanner reports and holds no advisory database: an advisory published after the last scan is unknown until the next one.",
  },
  posture: {
    status: "Preview",
    version: "0.6.0",
    signIn: true,
    features: [
      { title: "Send SARIF from Trivy, kubescape, checkov or Prowler for a cloud account, cluster or hosts", done: true },
      { title: "Failed controls per target: what is new fails a check, what stops failing is fixed", done: true },
      { title: "A score over time from the share of checks that passed", done: true },
      { title: "False positives, accepted risk and compensating controls, with a reason", done: true },
      { title: "Servers in the shared hosts file that have no posture scan (OPENASY_HOSTS)", done: true },
      { title: "Checkers that run for you, in an agent", done: false },
    ],
    upstream: [
      { name: "Trivy", url: "https://github.com/aquasecurity/trivy", role: "cloud, cluster and configuration checks" },
      { name: "kubescape", url: "https://github.com/kubescape/kubescape", role: "Kubernetes benchmarks" },
      { name: "SARIF", url: "https://sarifweb.azurewebsites.net/", role: "results from any checker" },
    ],
  },
  certificates: {
    status: "Preview",
    version: "0.5.0",
    signIn: true,
    features: [
      { title: "Send certificates as PEM from cron, CI or a collector; a private key is refused whole", done: true },
      { title: "Read public endpoints with a TLS handshake every 6 hours; private addresses are refused", done: true },
      { title: "State, chain and warnings: weak keys and signatures, wildcards, self-signed, long lifetimes", done: true },
      { title: "Expiry alerts once per threshold crossed, from 30 days to expired", done: true },
      { title: "Endpoints from a file that Uptime reads too (OPENASY_ENDPOINTS), and thresholds it shares (OPENASY_CERT_WARN_DAYS)", done: true },
      { title: "Renew with ACME", done: false },
    ],
    upstream: [
      { name: "Node.js crypto and TLS", url: "https://nodejs.org/api/crypto.html#class-x509certificate", role: "reading certificates and endpoints" },
      { name: "SQLite", url: "https://sqlite.org/", role: "certificates, places and endpoints" },
    ],
  },
  uptime: {
    status: "Preview",
    version: "0.5.0",
    signIn: true,
    features: [
      { title: "HTTP, TCP, DNS and TLS checks, run by a runner from a CI cron or any machine", done: true },
      { title: "Degraded, down and outages; a check nobody ran lately is stale, never up", done: true },
      { title: "Uptime over 24 hours to 90 days, and latency percentiles", done: true },
      { title: "A public status page with no script, for the checks you choose", done: true },
      { title: "Checks from a file that Certificates reads too (OPENASY_ENDPOINTS); a TLS check fails at Certificates' critical threshold", done: true },
      { title: "Each outage opens an incident in Incidents, and its end is noted there", done: true },
      { title: "Notifications to people, beyond Prometheus", done: false },
    ],
    upstream: [
      { name: "Node.js", url: "https://nodejs.org/", role: "the runner, with no dependencies" },
      { name: "SQLite", url: "https://sqlite.org/", role: "checks, results and outages" },
    ],
    note: "Uptime probes nothing itself: a runner you start, from CI or a server, runs the checks and sends what it saw.",
  },
  backups: {
    status: "Preview",
    version: "0.5.0",
    signIn: true,
    features: [
      { title: "Runs from restic, Velero or any script, and restore tests, reported per job", done: true },
      { title: "A state per job: failing, at risk, late, untested or healthy", done: true },
      { title: "A backup nobody has restored lately counts as untested", done: true },
      { title: "Size over time and success over 30 days", done: true },
      { title: "Servers in the shared hosts file that no backup job covers (OPENASY_HOSTS)", done: true },
      { title: "Restore tests that run for you", done: false },
    ],
    upstream: [
      { name: "restic", url: "https://restic.net/", role: "backups of files and databases" },
      { name: "Velero", url: "https://velero.io/", role: "backups of Kubernetes" },
    ],
    note: "Backups tracks the jobs that make backups and makes none itself.",
  },
  risk: {
    status: "Preview",
    version: "0.4.0",
    signIn: true,
    features: [
      { title: "A risk register: likelihood, impact, treatment and a residual score", done: true },
      { title: "Acceptance with a reason, an approver and an end within a year", done: true },
      { title: "Reviews on an interval, and a heat map before and after treatment", done: true },
      { title: "Vendors: data they hold, criticality, questionnaire, rating and documents", done: true },
      { title: "A history of every change that nobody can edit", done: true },
      { title: "Other products open risks without duplicates", done: true },
      { title: "Controls of ISO 27001 and SOC 2 linked to risks, and the controls that treat none", done: true },
    ],
    upstream: [{ name: "SQLite", url: "https://sqlite.org/", role: "risks, vendors and their history" }],
  },
  "threat-intel": {
    status: "Preview",
    version: "0.4.0",
    signIn: true,
    features: [
      { title: "Import STIX 2.1, CSV and text feeds; what cannot be read is named, never dropped", done: true },
      { title: "One lookup for addresses, blocks, domains, URLs, email addresses and hashes", done: true },
      { title: "Malicious, suspicious, unknown or allowed, with the feeds and confidence behind it", done: true },
      { title: "An allow list with a reason and an end date", done: true },
      { title: "TLP:RED only for editors, admins and the ingest token", done: true },
      { title: "Pull feeds on a schedule: STIX from TAXII 2.1 collections, any kind from a URL", done: true },
    ],
    upstream: [
      { name: "STIX 2.1", url: "https://oasis-open.github.io/cti-documentation/", role: "the format feeds come in" },
      { name: "SQLite", url: "https://sqlite.org/", role: "feeds, indicators and the allow list" },
    ],
  },
  cost: {
    status: "Preview",
    version: "0.4.0",
    signIn: true,
    features: [
      { title: "Daily spend from AWS, GCP, Azure or any CSV, sent by a pipeline", done: true },
      { title: "Owners by team tag or rule, and a share nobody owns yet", done: true },
      { title: "Budgets with a forecast for the month and a burn rate", done: true },
      { title: "Anomalies a person acknowledges or marks expected", done: true },
      { title: "Rightsizing recommendations", done: false },
    ],
    upstream: [
      {
        name: "AWS Cost Explorer",
        url: "https://aws.amazon.com/aws-cost-management/aws-cost-explorer/",
        role: "spend, converted by a script in the repository",
      },
      { name: "SQLite", url: "https://sqlite.org/", role: "spend, rules, budgets and anomalies" },
    ],
    note: "Cost reads what a pipeline sends and holds no cloud credentials, so its figures are as fresh as the last export.",
  },
  deception: {
    status: "Preview",
    version: "0.1.0",
    signIn: true,
    features: [
      { title: "Canaries with a token each: links, kubeconfigs, .env files, HTML pages, host names, SSH configs and AWS keys", done: true },
      { title: "Found by a URL, a DNS name in a zone of its own, or the key's use in CloudTrail", done: true },
      { title: "Every caller gets the same answer, so nobody learns they found a canary", done: true },
      { title: "A trigger per canary and address, which a person marks a breach or a test", done: true },
      { title: "Each trigger opens an incident in Incidents", done: true },
      { title: "Decoy hosts, database users and Windows accounts", done: false },
    ],
    upstream: [
      { name: "AWS CloudTrail", url: "https://aws.amazon.com/cloudtrail/", role: "where the use of an AWS key canary is found" },
      { name: "SQLite", url: "https://sqlite.org/", role: "canaries, triggers and their hits" },
    ],
    note: "Deception holds no cloud credentials: a pipeline sends it the CloudTrail events in which a canary key may show up.",
  },
  compliance: {
    status: "Preview",
    version: "0.1.0",
    signIn: true,
    features: [
      { title: "Controls of ISO 27001, SOC 2, GDPR and PCI DSS, each with an owner", done: true },
      { title: "Checks judged on what every installed product serves at /metrics", done: true },
      { title: "Evidence by hand: a link and the day it counts until", done: true },
      { title: "Controls that do not apply, with a reason, as in a statement of applicability", done: true },
      { title: "A report per framework, and whether each control held over 90 days", done: true },
      { title: "Audits with their own scope and dates, and policies", done: false },
    ],
    upstream: [
      {
        name: "Prometheus exposition format",
        url: "https://prometheus.io/docs/instrumenting/exposition_formats/",
        role: "how the products serve their numbers",
      },
      { name: "SQLite", url: "https://sqlite.org/", role: "controls, evidence and the daily tally" },
    ],
    note: "Compliance collects evidence and certifies nothing; the auditor does. Controls that no installed product proves need evidence by hand.",
  },
  alerts: {
    status: "Preview",
    version: "0.1.0",
    signIn: true,
    features: [
      { title: "Prometheus and vmalert use it as their Alertmanager; products and scripts send alerts too", done: true },
      { title: "Routes in order by label, groups, and an alert no route takes shown, never dropped", done: true },
      { title: "Silences with a reason and an end within 30 days", done: true },
      { title: "On-call schedules, repeats until acknowledged, and escalation", done: true },
      { title: "Slack, Teams and webhooks", done: true },
      { title: "Email, phone calls and SMS directly", done: false },
      { title: "Incidents opened for severe groups", done: false },
    ],
    upstream: [
      { name: "Alertmanager API", url: "https://prometheus.io/docs/alerting/latest/alertmanager/", role: "the way alerts come in from Prometheus and vmalert" },
      { name: "SQLite", url: "https://sqlite.org/", role: "alerts, routes, silences and schedules" },
    ],
    note: "Alerts has no rule engine of its own: alerting rules stay in Prometheus or vmalert.",
  },
  automation: {
    status: "Preview",
    version: "0.1.0",
    signIn: true,
    features: [
      { title: "Playbooks started by a webhook, a schedule or a person", done: true },
      { title: "Steps in Incidents and VPN, messages, and HTTP calls to stored connections", done: true },
      { title: "Approvals as steps, given by an editor", done: true },
      { title: "Every run recorded step by step, and dry runs that send nothing", done: true },
      { title: "A drawn playbook editor", done: false },
      { title: "Branches and loops", done: false },
    ],
    upstream: [{ name: "SQLite", url: "https://sqlite.org/", role: "playbooks, connections and runs" }],
    note: "Playbooks are written as JSON for now. Steps reach only the connections an admin stored, and a template never changes a host.",
  },
  access: {
    status: "Preview",
    version: "0.1.0",
    signIn: true,
    features: [
      { title: "SSH access to one account on one server, asked for with a reason and a duration", done: true },
      { title: "Approved by someone else, or by two people", done: true },
      { title: "Short-lived certificates for the person's own key, valid on that one server", done: true },
      { title: "Access that ends by itself, and a revocation list servers fetch every minute", done: true },
      { title: "An audit log the database will not let anyone change", done: true },
      { title: "Ending open sessions and recording them", done: false },
      { title: "RDP, PostgreSQL and MySQL access", done: false },
      { title: "Approving from Slack", done: false },
    ],
    upstream: [
      { name: "OpenSSH certificates", url: "https://www.openssh.com/", role: "what servers trust, with no agent installed" },
      { name: "SQLite", url: "https://sqlite.org/", role: "requests, approvals and the audit log" },
    ],
    note: "Access never connects to a server: each server trusts its CA once, through commands Access gives. A session already open stays open when access ends.",
  },
  database: {
    status: "Preview",
    version: "0.1.0",
    signIn: true,
    features: [
      { title: "The slowest queries, from pg_stat_statements, over 7 days", done: true },
      { title: "Who blocks whom, with the session at the head of each chain", done: true },
      { title: "Replication lag, slots and the WAL they hold", done: true },
      { title: "Connections by state, and every session", done: true },
      { title: "Query plans with the costliest step marked, never run", done: true },
      { title: "MySQL and MariaDB", done: false },
      { title: "EXPLAIN ANALYZE and suggested indexes", done: false },
    ],
    upstream: [
      { name: "PostgreSQL", url: "https://www.postgresql.org/", role: "its own statistics views, read with a monitoring role" },
      { name: "SQLite", url: "https://sqlite.org/", role: "samples of the last 7 days" },
    ],
    note: "PostgreSQL 14 or newer. Database connects as a role in pg_monitor, in read-only sessions, and changes nothing.",
  },
  metrics: {
    status: "Preview",
    version: "0.1.0",
    signIn: true,
    features: [
      { title: "Every OpenAsy product scraped, and jobs of your own", done: true },
      { title: "OpenTelemetry and Prometheus remote write in", done: true },
      { title: "PromQL in dashboards and Explore, and the Prometheus API for Grafana and vmalert", done: true },
      { title: "Targets with their health and last scrape", done: true },
      { title: "Recording rules", done: false },
      { title: "Dashboard variables and Kubernetes discovery", done: false },
    ],
    upstream: [
      { name: "VictoriaMetrics", url: "https://victoriametrics.com/", role: "storage and scraping, inside the container" },
      { name: "SQLite", url: "https://sqlite.org/", role: "jobs and dashboards" },
    ],
    note: "Alerting rules stay in vmalert or Prometheus, which send what fires to Alerts.",
  },
  traces: {
    status: "Preview",
    version: "0.1.0",
    signIn: true,
    features: [
      { title: "OpenTelemetry traces in over OTLP/HTTP", done: true },
      { title: "Services with rate, errors and latency percentiles, and a service map", done: true },
      { title: "Search by service, operation, duration and errors, and any trace as a waterfall", done: true },
      { title: "Endpoints compared with the period before", done: true },
      { title: "Latency and error objectives per service", done: true },
      { title: "OTLP over gRPC and sampling", done: false },
      { title: "Latency by version or deploy", done: false },
    ],
    upstream: [
      { name: "VictoriaTraces", url: "https://docs.victoriametrics.com/victoriatraces/", role: "storage of spans, inside the container" },
      { name: "OpenTelemetry", url: "https://opentelemetry.io/", role: "how services send traces" },
    ],
  },
  endpoints: {
    status: "Preview",
    version: "0.1.0",
    signIn: true,
    features: [
      { title: "osquery on each device, with a fixed pack and no query from the server", done: true },
      { title: "Disk encryption, OS version, firewall and screen lock against one policy", done: true },
      { title: "Compliant, at risk or non-compliant, with a grace period and exceptions that end", done: true },
      { title: "Hardware, local accounts and software across devices", done: true },
      { title: "Firewall and screen lock on Linux", done: false },
      { title: "More than one policy, and owners from Identity", done: false },
    ],
    upstream: [
      { name: "osquery", url: "https://osquery.io/", role: "reads each device, with its own package" },
      { name: "SQLite", url: "https://sqlite.org/", role: "devices, results and the audit log" },
    ],
    note: "macOS and Linux are tested with real osquery output; Windows is not yet tested on a real machine.",
  },
  runtime: {
    status: "Preview",
    version: "0.1.0",
    signIn: true,
    guides: [
      {
        title: "Add a host",
        text: "Make an enrolment token under Hosts, then start Falco and runtime-agent on each host from runtime-agent's compose file. Falco watches the kernel; the agent only reads its alerts and sends them.",
        code: `curl -fsSLO https://raw.githubusercontent.com/openasy/runtime-agent/v0.1.0/compose.yaml
openssl rand -hex 32 > openasy-agent-kek   # the agent's own key: keep it with the host
RUNTIME_URL=https://runtime.example.com RUNTIME_ENROLL_TOKEN=oie_... docker compose up -d`,
      },
    ],
    features: [
      { title: "Falco's detections, each with its process tree", done: true },
      { title: "A process inventory per host and image, and programs that are new or drift", done: true },
      { title: "File integrity of watched files, with the process that changed them", done: true },
      { title: "Detections and file changes sent to SIEM", done: true },
      { title: "Killing a process or isolating a host", done: false },
      { title: "A Helm chart with the agent beside Falco", done: false },
    ],
    upstream: [
      { name: "Falco", url: "https://falco.org/", role: "the eBPF sensor on each host" },
      { name: "SQLite", url: "https://sqlite.org/", role: "events, detections and the inventory" },
    ],
    note: "runtime-agent runs beside Falco on each host, reads only, and runs nothing Runtime sends.",
  },
  "attack-surface": {
    status: "Preview",
    version: "0.1.0",
    signIn: true,
    features: [
      { title: "Only domains proven yours by a DNS record, and ranges an admin adds with a reason", done: true },
      { title: "Passive discovery from DNS and certificate transparency", done: true },
      { title: "A light check of common ports, TLS and HTTP headers, rate-limited", done: true },
      { title: "Exposures such as open databases, remote desktops and expiring certificates", done: true },
      { title: "What changed since the last scan, first", done: true },
      { title: "Look-alike domains and domain registration", done: false },
      { title: "Links to DAST, Certificates and Vulnerabilities", done: false },
    ],
    upstream: [
      { name: "crt.sh", url: "https://crt.sh/", role: "names from certificate transparency logs" },
      { name: "SQLite", url: "https://sqlite.org/", role: "assets, exposures and changes" },
    ],
    note: "Attack Surface probes nothing outside the domains and ranges you have proven or added, and tries no exploits; DAST tests applications.",
  },
  profiling: {
    status: "Preview",
    version: "0.1.0",
    signIn: true,
    features: [
      { title: "Profiles pushed from Alloy, eBPF included, and the Pyroscope SDKs", done: true },
      { title: "pprof read from services on a schedule or on demand", done: true },
      { title: "Flame graphs per service, with top functions", done: true },
      { title: "Two periods or two versions compared", done: true },
      { title: "An eBPF agent of its own", done: false },
      { title: "Captures that start on a CPU spike", done: false },
    ],
    upstream: [
      { name: "Grafana Pyroscope", url: "https://grafana.com/oss/pyroscope/", role: "storage of profiles, inside the container" },
      { name: "Grafana Alloy", url: "https://grafana.com/oss/alloy/", role: "eBPF profiling on each host" },
    ],
  },
  waf: {
    status: "Preview",
    version: "0.1.0",
    signIn: true,
    features: [
      { title: "Coraza and the OWASP Core Rule Set in the request path", done: true },
      { title: "New sites start in detection only; blocking is an admin's choice", done: true },
      { title: "What was blocked and why, and an exclusion for a false positive in one click", done: true },
      { title: "Custom rules and virtual patches, checked before they are saved", done: true },
      { title: "Rate limits and temporary blocks", done: false },
      { title: "Rules made from DAST findings", done: false },
    ],
    upstream: [
      { name: "Coraza", url: "https://coraza.io/", role: "the rule engine in the request path" },
      { name: "OWASP Core Rule Set", url: "https://coreruleset.org/", role: "the rules" },
    ],
    note: "WAF does not terminate TLS yet: run it behind your proxy.",
  },
  "network-ids": {
    status: "Preview",
    version: "0.1.0",
    signIn: true,
    guides: [
      {
        title: "Add a sensor",
        text: "Run network-ids-agent next to Suricata on each sensor, with an enrolment token from Sensors. It reads Suricata's eve.json and writes the rules and suppressions you set into /etc/suricata/openasy; it never changes the traffic.",
        code: `openssl rand -hex 32 > openasy-agent-kek   # keep it with your backups
docker run -d --name network-ids-agent --restart unless-stopped --read-only \\
  --cap-drop ALL --security-opt no-new-privileges \\
  -v network-ids-agent-data:/data -v "$PWD/openasy-agent-kek:/run/secrets/openasy-agent-kek:ro" \\
  -v /var/log/suricata:/var/log/suricata:ro -v /etc/suricata/openasy:/rules \\
  -v /var/run/suricata:/var/run/suricata --group-add "$(getent group suricata | cut -d: -f3)" \\
  -e NETWORK_IDS_URL=https://network-ids.example.com -e NETWORK_IDS_ENROLL_TOKEN=oie_... \\
  ghcr.io/openasy/network-ids-agent:0.1.0`,
      },
    ],
    features: [
      { title: "Suricata alerts, flows and protocol logs from every sensor", done: true },
      { title: "Each alert with its flow and what was said in it", done: true },
      { title: "Sensor health from Suricata's own counters", done: true },
      { title: "Local rules and suppressions sent to every sensor", done: true },
      { title: "Zeek logs", done: false },
      { title: "Packet captures on demand", done: false },
    ],
    upstream: [
      { name: "Suricata", url: "https://suricata.io/", role: "the engine on each sensor" },
      { name: "SQLite", url: "https://sqlite.org/", role: "alerts, flows and rules" },
    ],
    note: "Detection only: Network IDS does not block traffic. network-ids-agent runs beside Suricata on each sensor.",
  },
  awareness: {
    status: "Preview",
    version: "0.1.0",
    signIn: true,
    features: [
      { title: "People from Identity or a CSV, only in domains proven by a TXT record", done: true },
      { title: "Campaigns from labelled training templates, sent through your own SMTP relay", done: true },
      { title: "Clicks and reports recorded, and nothing a person types ever kept", done: true },
      { title: "Short training with a quiz, assigned to whoever clicks", done: true },
      { title: "Risk per person and per group over time", done: true },
      { title: "Training completion and the last campaign at /metrics for Compliance", done: true },
      { title: "Recurring campaigns and reminders", done: false },
      { title: "Reports read from a report mailbox", done: false },
      { title: "Your own templates and modules in the UI", done: false },
    ],
    upstream: [{ name: "SQLite", url: "https://sqlite.org/", role: "people, campaigns and training" }],
    note: "Mail goes only to addresses in domains you have proven are yours.",
  },
  "attack-simulation": {
    status: "Preview",
    version: "0.1.0",
    signIn: true,
    guides: [
      {
        title: "Add a host",
        text: "Make an enrolment token under Hosts and start attack-simulation-agent on the host. It runs nothing until an admin allows the host for simulation, with a reason, and then only the tests built into it.",
        code: `curl -fsSLO https://raw.githubusercontent.com/openasy/attack-simulation-agent/v0.1.0/compose.yaml
openssl rand -hex 32 > openasy-agent-kek   # the agent's own key: keep it with the host
ATTACKSIM_URL=https://attack-simulation.example.com ATTACKSIM_ENROLL_TOKEN=aie_... docker compose up -d`,
      },
    ],
    features: [
      { title: "A fixed, reviewed pack of harmless MITRE ATT&CK tests", done: true },
      { title: "Runs only on hosts an admin allows, with a reason", done: true },
      { title: "Every step tagged with a run id, one run per host at a time", done: true },
      { title: "Detection checked by reading SIEM and Runtime", done: true },
      { title: "Coverage per technique and per tactic", done: true },
      { title: "Endpoints and Network IDS as detectors", done: false },
      { title: "Scheduled runs", done: false },
      { title: "More tests and chains of tests", done: false },
    ],
    upstream: [{ name: "MITRE ATT&CK", url: "https://attack.mitre.org/", role: "the techniques each test stands for" }],
    note: "attack-simulation-agent runs on each host and runs only the tests built into it.",
  },
  assistant: {
    status: "Preview",
    version: "0.1.0",
    signIn: true,
    features: [
      { title: "A model the install chooses: Ollama, vLLM, llama.cpp or Anthropic", done: true },
      { title: "Nothing leaves the install until an admin sets a model", done: true },
      { title: "Read-only tools over Logs, Metrics, Traces, SIEM, Alerts, Incidents and Vulnerabilities", done: true },
      { title: "Every call made with the asking person's own token", done: true },
      { title: "Every answer cites its calls, linked to the product's page", done: true },
      { title: "Conversations private to each person, kept as long as admins set", done: true },
      { title: "Tokens issued per person through Identity", done: false },
      { title: "Streaming answers and charts in answers", done: false },
      { title: "More products as tools", done: false },
    ],
    upstream: [
      { name: "Ollama", url: "https://ollama.com/", role: "a model on your own server" },
      { name: "SQLite", url: "https://sqlite.org/", role: "conversations and connections" },
    ],
    note: "Assistant can only read, and only what the person asking can see.",
  },
  dast: {
    status: "Preview",
    version: "0.8.0",
    signIn: true,
    features: [
      { title: "Targets, with the owner's proof that the address is theirs", done: true },
      { title: "Send ZAP or Nuclei reports from CI and get back whether the check passes", done: true },
      { title: "What an engine stops reporting is fixed; what it reports again reopens", done: true },
      { title: "Credentials in what a scanner saw are masked before they are stored", done: true },
      { title: "False positives and accepted risk, with a reason and an end date", done: true },
      { title: "dast-agent: ZAP and Nuclei inside your network, only active on verified targets", done: true },
      { title: "Scans by hand or on a daily or weekly schedule, in passive, standard and full profiles", done: true },
      { title: "Full scans refused on production unless an admin allows them", done: true },
      { title: "Targets on private addresses verified by the agent that reaches them", done: true },
      { title: "Logins: a header or a form, for scans behind a sign-in page", done: true },
    ],
    upstream: [
      { name: "ZAP", url: "https://www.zaproxy.org/", role: "crawl and active scan" },
      { name: "Nuclei", url: "https://github.com/projectdiscovery/nuclei", role: "template checks" },
    ],
  },
  identity: {
    status: "Preview",
    version: "0.5.0",
    signIn: true,
    note: "openasy-kek seals the signing keys, client secrets and sign-in secrets (ADR 0021). Keep it apart from the data volume and with your backups: identity does not start without it. Serve it over HTTPS and keep IDENTITY_PUBLIC_URL fixed once applications use it: it is the issuer they trust.",
    features: [
      { title: "OpenID Connect provider: discovery, PKCE for every application, refresh tokens, userinfo and logout", done: true },
      { title: "OpenAsy VPN, Infrastructure and Vulnerabilities from templates, and any OpenID Connect application", done: true },
      { title: "One sign-in: signing out of Identity signs out of the next application request", done: true },
      { title: "Groups decide who may use which application, and go to applications in the groups claim", done: true },
      { title: "A second factor required per group: authenticator app, passkey or identity provider", done: true },
      { title: "People from Keycloak, Microsoft Entra ID, Okta or Google, with groups that follow theirs", done: true },
      { title: "Audit log of sign-ins, refusals and changes, kept 400 days", done: true },
      { title: "Passkey-only groups", done: true },
      { title: "SAML 2.0 applications, with a template for AWS IAM Identity Center", done: true },
      { title: "LDAP and Active Directory: people, groups and their passwords", done: true },
      { title: "SCIM 2.0 provisioning from Okta and Microsoft Entra ID", done: true },
    ],
    upstream: [
      { name: "oidc-provider", url: "https://github.com/panva/node-oidc-provider", role: "OpenID Certified provider" },
      { name: "SimpleWebAuthn", url: "https://simplewebauthn.dev/", role: "passkeys" },
      { name: "openid-client", url: "https://github.com/panva/openid-client", role: "upstream providers" },
      { name: "samlify", url: "https://github.com/tngan/samlify", role: "SAML signing" },
      { name: "ldapts", url: "https://github.com/ldapts/ldapts", role: "LDAP and Active Directory" },
      { name: "SQLite", url: "https://sqlite.org/", role: "storage" },
    ],
  },
  vpn: {
    status: "Preview",
    version: "0.12.0",
    signIn: true,
    note: "openasy-kek seals the CA key, server keys and sign-in secrets (ADR 0021). Keep it apart from the data volume and with your backups: vpn does not start without it. Serve the UI over HTTPS.",
    features: [
      { title: "Add a device and download its .ovpn file", done: true },
      { title: "Groups and IP groups: each group reaches only the networks and ports it is allowed", done: true },
      { title: "Split tunnel by default, full tunnel per IP group", done: true },
      { title: "Revoke a device or suspend a person; they are disconnected within 15 seconds", done: true },
      { title: "Live sessions, and ending a session", done: true },
      { title: "Several servers, for example UDP 1194 and TCP 443 for networks that allow only HTTPS", done: true },
      { title: "Servers at several locations, added in the UI with their own identity; clients move to the next one when a server is down", done: true },
      { title: "Servers keep running with the last good config when vpn is down", done: true },
      { title: "REST API with an OpenAPI reference, and Prometheus metrics", done: true },
      { title: "Sign-in with passkeys, authenticator apps or your identity provider (OIDC), straight to it if you choose", done: true },
      { title: "Roles per member (owner, admin, editor, viewer), and API tokens with a role and an expiry", done: true },
      { title: "CA key, server keys and sign-in secrets sealed with a key kept outside the data volume", done: true },
      { title: "People, devices, access and live sessions in the UI", done: true },
      { title: "Command line tool, openasy-vpn, on the same API", done: true },
    ],
    deployments: [
      {
        id: "one-host",
        label: "One host",
        fits: "A small team with one office or one cloud network: everything on one machine, one file.",
        compose: true,
        steps: [
          {
            title: "Start the server",
            text: "Under Servers, add edge-1 with the address clients connect to, and start it with the one-time token the page shows, as the last line above does. For networks that allow only HTTPS, add a second server on TCP 443 the same way.",
          },
        ],
        since: "0.6.0",
      },
      {
        id: "edge",
        label: "Panel inside, server at the edge",
        fits: "When the panel must not be reachable from the internet: only the VPN port is open to the world.",
        steps: [
          {
            title: "Run the panel on an internal host",
            text: "Behind your TLS proxy. Only the people who manage it and the vpn-server hosts reach it.",
            code: VPN_PANEL,
          },
          { title: "Add the server", text: "Under Servers, add edge-1 with the public address clients connect to. You get a one-time token." },
          {
            title: "Start vpn-server on the edge host",
            text: "It connects out to the panel over HTTPS and needs nothing open towards it: the panel never connects to a server. Keep its volume, it holds the server's secret.",
            code: vpnServer("vpn.example.com"),
          },
        ],
        since: "0.6.0",
      },
      {
        id: "locations",
        label: "Several locations",
        fits: "Offices or regions, or a second server to fall back to: one panel, a vpn-server at each location.",
        steps: [
          { title: "Run the panel once", text: "On an internal host, as for one server at the edge.", code: VPN_PANEL },
          {
            title: "Add a server per location",
            text: "Under Servers, one per host, each with its own address, for example fra-1 at fra.vpn.example.com and ist-1 at ist.vpn.example.com. Each gets its own one-time token.",
          },
          {
            title: "Start vpn-server at each location",
            text: "With that location's token. Each server reaches the panel over HTTPS and gets its own secret.",
            code: vpnServer("fra.vpn.example.com, then the same on ist.vpn.example.com with its token"),
          },
          {
            title: "Then add devices",
            text: "Each device's file lists every server that has reported, so clients move to the next one when a server is down. Start the servers first: a file lists the servers there were when it was made. Access applies on every server, so each must reach the networks your IP groups allow.",
          },
        ],
        since: "0.6.0",
      },
    ],
    upstream: [
      { name: "OpenVPN", url: "https://openvpn.net/community/", role: "the tunnel" },
      { name: "iptables", url: "https://www.netfilter.org/projects/iptables/", role: "per-device firewall" },
      { name: "@peculiar/x509", url: "https://github.com/PeculiarVentures/x509", role: "certificates and revocation list" },
      { name: "SQLite", url: "https://sqlite.org/", role: "storage" },
      { name: "Swagger UI", url: "https://github.com/swagger-api/swagger-ui", role: "API reference" },
    ],
    connect: [
      "Your admin adds your device and sends you its .ovpn file. It holds your private key and can be downloaded only once, so keep it safe.",
      "Install an OpenVPN client from the list below.",
      "Import the .ovpn file into the client and connect.",
      "If the first try is refused, wait 15 seconds and connect again. Servers pick up new devices within one heartbeat.",
    ],
    clients: [
      { platform: "Windows", apps: [{ name: "OpenVPN Connect", url: "https://openvpn.net/client/" }] },
      {
        platform: "macOS",
        apps: [
          { name: "OpenVPN Connect", url: "https://openvpn.net/client/" },
          { name: "Tunnelblick", url: "https://tunnelblick.net/" },
        ],
      },
      { platform: "iOS", apps: [{ name: "OpenVPN Connect", url: "https://apps.apple.com/app/openvpn-connect/id590379981" }] },
      { platform: "Android", apps: [{ name: "OpenVPN Connect", url: "https://play.google.com/store/apps/details?id=net.openvpn.openvpn" }] },
      {
        platform: "Linux",
        apps: [
          { name: "NetworkManager OpenVPN", url: "https://gitlab.gnome.org/GNOME/NetworkManager-openvpn" },
          { name: "openvpn command", url: "https://openvpn.net/community-downloads/" },
        ],
      },
    ],
  },
};

export const statusFor = (id: string): ProductState => STATUS[id] ?? (PLANNED.has(id) ? PLANNED_STATE : DESIGNED);

export const isReleased = (id: string) => statusFor(id).status === "Preview";

/** Badge text: the version for a released product. */
export const statusLabel = (id: string) => {
  const s = statusFor(id);
  return s.version ? `${s.status} ${s.version}` : s.status;
};

/** A goal is ready when every product it needs is released, in progress when one of them is being built or released. */
export function readiness(required: string[]): Readiness {
  if (required.every(isReleased)) return "Ready to try";
  // Planned products count as not started, like designed ones.
  return required.some((id) => ["Preview", "In progress"].includes(statusFor(id).status)) ? "In progress" : "Designed";
}

/** Whether a plain x.y.z `version` is `min` or later. */
export function atLeast(version: string | undefined, min: string): boolean {
  if (!version) return false;
  const a = version.split(".").map(Number);
  const b = min.split(".").map(Number);
  for (let i = 0; i < 3; i++) if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0);
  return true;
}

/** The ways to deploy that the released version supports, with its version in the commands. */
export const deploymentsFor = (s: ProductState): Deployment[] =>
  (s.deployments ?? [])
    .filter((d) => atLeast(s.version, d.since))
    .map((d) => ({ ...d, steps: d.steps.map((g) => (g.code ? { ...g, code: g.code.replaceAll("{version}", s.version!) } : g)) }));

/** Product ids in a given status, in the order given. */
export const withStatus = (ids: readonly string[], status: ProductStatus) => ids.filter((id) => statusFor(id).status === status);
