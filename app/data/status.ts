// How far each product is built, what it runs on, and how people connect to it.
// A product without an entry is Designed. When one ships, set its status, version and features here:
// the home page, the lists and every page follow.
// No React or @openasy/ui imports here, like goals.ts.

/** Preview: released for testing. In progress: being built now. Designed: screens in Storybook only. Add "Available" with the first stable release. */
export type ProductStatus = "Preview" | "In progress" | "Designed";

export const STATUS_TONE: Record<ProductStatus, "success" | "warning" | "neutral"> = {
  Preview: "success",
  "In progress": "warning",
  Designed: "neutral",
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
    version: "0.2.0",
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
  ghcr.io/openasy/vulns-agent:0.2.0`,
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
      { title: "Works without internet: import the vulnerability data", done: true },
      { title: "REST API with an OpenAPI reference, and Prometheus metrics", done: true },
      { title: "Sign-in with passkeys, authenticator apps or your identity provider (OIDC)", done: true },
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
    version: "0.1.0",
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
        text: "Add the host in the UI. The agent reports the fingerprint the host presents; compare it on the host before accepting. If the key changes later, collection stops until an admin accepts the new one.",
        code: "ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub",
      },
      {
        title: "Add a Kubernetes cluster",
        text: "Apply the read-only role from Setup (no Secrets, no ConfigMaps, nothing it can change), then add the cluster with its API server URL, CA and this token. Nothing runs in the cluster.",
        code: "kubectl -n openasy get secret openasy-infra-token -o jsonpath='{.data.token}' | base64 -d",
      },
    ],
    features: [
      { title: "One infra-agent per network reads hosts over SSH with 5-minute certificates, trusted for one unprivileged account only; nothing installed on hosts", done: true },
      { title: "The agent keeps the SSH keys and runs only its own script: a compromised Infrastructure cannot run commands on hosts", done: true },
      { title: "System, processes, listening ports, services, cron, accounts, sudo, SSH keys, packages, firewall, storage and network", done: true },
      { title: "Every change kept: a new account, an opened port, a package version, a reboot", done: true },
      { title: "Pinned host keys: collection stops when a host key changes", done: true },
      { title: "Docker and Podman containers, with environment variables by name only", done: true },
      { title: "Kubernetes through its API with a read-only token: nodes, workloads, pods, services, volumes, cluster admins", done: true },
      { title: "Hosts in other networks through jump hosts", done: true },
      { title: "Optional read-only sudo rules with fixed arguments, checked against every known way out", done: true },
      { title: "Cloud accounts (AWS, Hetzner and others) and hosts without SSH access", done: false },
      { title: "Package lists to Vulnerabilities, so hosts need no vulns-agent", done: false },
      { title: "Windows over SSH or WinRM", done: false },
    ],
    upstream: [
      { name: "OpenSSH", url: "https://www.openssh.com/", role: "the connection, certificates and host keys" },
      { name: "Kubernetes API", url: "https://kubernetes.io/docs/reference/kubernetes-api/", role: "clusters" },
      { name: "SQLite", url: "https://sqlite.org/", role: "storage" },
      { name: "Swagger UI", url: "https://github.com/swagger-api/swagger-ui", role: "API reference" },
    ],
  },
  dast: {
    status: "Designed",
    features: [],
    upstream: [
      { name: "ZAP", url: "https://www.zaproxy.org/", role: "crawl and active scan" },
      { name: "Nuclei", url: "https://github.com/projectdiscovery/nuclei", role: "template checks" },
    ],
  },
  identity: {
    status: "In progress",
    signIn: true,
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
    version: "0.6.0",
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
      { title: "Sign-in with passkeys, authenticator apps or your identity provider (OIDC)", done: true },
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
          { title: "Run the panel on an internal host", text: "Behind your TLS proxy. Only the people who manage it and the vpn-server hosts reach it.", code: VPN_PANEL },
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
          { title: "Add a server per location", text: "Under Servers, one per host, each with its own address, for example fra-1 at fra.vpn.example.com and ist-1 at ist.vpn.example.com. Each gets its own one-time token." },
          { title: "Start vpn-server at each location", text: "With that location's token. Each server reaches the panel over HTTPS and gets its own secret.", code: vpnServer("fra.vpn.example.com, then the same on ist.vpn.example.com with its token") },
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

export const statusFor = (id: string): ProductState => STATUS[id] ?? DESIGNED;

export const isReleased = (id: string) => statusFor(id).status === "Preview";

/** Badge text: the version for a released product. */
export const statusLabel = (id: string) => {
  const s = statusFor(id);
  return s.version ? `${s.status} ${s.version}` : s.status;
};

/** A goal is ready when every product it needs is released, in progress when one of them is being built or released. */
export function readiness(required: string[]): Readiness {
  if (required.every(isReleased)) return "Ready to try";
  return required.some((id) => statusFor(id).status !== "Designed") ? "In progress" : "Designed";
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
