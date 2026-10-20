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
}

const DESIGNED: ProductState = { status: "Designed", features: [], upstream: [] };

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
  dast: {
    status: "Designed",
    features: [],
    upstream: [
      { name: "ZAP", url: "https://www.zaproxy.org/", role: "crawl and active scan" },
      { name: "Nuclei", url: "https://github.com/projectdiscovery/nuclei", role: "template checks" },
    ],
  },
  vpn: {
    status: "Preview",
    version: "0.3.0",
    signIn: true,
    note: "For testing only: the CA key is stored unencrypted in the database, so protect the data volume and its backups. Encrypting it is planned (ADR 0021).",
    features: [
      { title: "Add a device and download its .ovpn file", done: true },
      { title: "Groups and IP groups: each group reaches only the networks and ports it is allowed", done: true },
      { title: "Split tunnel by default, full tunnel per IP group", done: true },
      { title: "Revoke a device or suspend a person; they are disconnected within 15 seconds", done: true },
      { title: "Live sessions, and ending a session", done: true },
      { title: "Several servers, for example UDP 1194 and TCP 443 for networks that allow only HTTPS", done: true },
      { title: "Servers keep running with the last good config when the manager is down", done: true },
      { title: "REST API with an OpenAPI reference, and Prometheus metrics", done: true },
      { title: "Sign-in with passkeys, authenticator apps or your identity provider (OIDC)", done: true },
      { title: "Roles per member (owner, admin, editor, viewer), and API tokens with a role and an expiry", done: true },
      { title: "Encrypted CA key", done: false },
      { title: "People, access and sessions screens in the UI", done: false },
      { title: "Command line tool", done: false },
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

/** Product ids in a given status, in the order given. */
export const withStatus = (ids: readonly string[], status: ProductStatus) => ids.filter((id) => statusFor(id).status === status);
