// The install builder (/install): one setup for several products that already know each other. Pure functions, so the
// page and the tests use the same output. No React or @openasy/ui imports here, like goals.ts.
// Each product's part matches the compose.yaml in its repository; versions come from status.ts.
import { statusFor } from "./status";

/** Products the builder can set up: released, with their part written here. */
export const INSTALLABLE = [
  "identity",
  "vpn",
  "infrastructure",
  "vulnerabilities",
  "logs",
  "siem",
  "audit",
  "sast",
  "dast",
  "malware",
  "posture",
  "secrets",
  "incidents",
  "errors",
  "supply-chain",
] as const;
export type Installable = (typeof INSTALLABLE)[number];

export type SignIn = "identity" | "keycloak" | "provider" | "own";
export type Provider = "entra" | "okta" | "google";
/** Where Identity's own people come from when it signs everyone else in. */
export type Upstream = "none" | "keycloak" | Provider;
export type Proxy = "caddy" | "nginx" | "apache" | "own";

export interface InstallChoice {
  products: Installable[];
  signIn: SignIn;
  upstream: Upstream;
  provider: Provider;
  domain: string;
  /**
   * Caddy runs in the compose file and makes the certificates. nginx and Apache run on the host, as they usually do
   * already: the products listen on 127.0.0.1 and their site config is written here, with certbot for HTTPS. "own"
   * leaves the local ports for any other proxy.
   */
  proxy: Proxy;
  prometheus: boolean;
  /** A second vpn-server on TCP, for networks that allow only HTTPS. */
  vpnTcp: boolean;
  /** vulns-agent on this host too. */
  vulnsHost: boolean;
  /** One hosts.yaml that Infrastructure and Vulnerabilities both read (OPENASY_HOSTS, ADR 0052). */
  hostsFile: boolean;
  /** Shown under each product's name; empty leaves the line out. */
  organization: string;
  /** #rrggbb for buttons and links; empty keeps OpenAsy's blue. */
  accent: string;
  /** The logo's file name in the folder, such as logo.svg, once one is picked; its bytes stay in the page. */
  logo: string | null;
}

export const DEFAULT_CHOICE: InstallChoice = {
  products: ["identity", "vpn"],
  signIn: "identity",
  upstream: "none",
  provider: "entra",
  domain: "example.com",
  proxy: "caddy",
  prometheus: true,
  vpnTcp: false,
  vulnsHost: true,
  hostsFile: true,
  organization: "",
  accent: "",
  logo: null,
};

/** Made in the reader's browser; the names are the .env variables or files they end up in. */
export interface Secrets {
  kek: string;
  /** infra-agent's own key, and logs-agent's. */
  agentKek: string;
  logsAgentKek: string;
  /** Vulnerabilities' ingest token, which its agents send. */
  ingest: string;
  /** The ingest token of every other product that takes data from scripts and CI. */
  tokens: Partial<Record<Installable, string>>;
  keycloakDb: string;
  keycloakAdmin: string;
  /** The secret of each product that is a client in the ready Keycloak realm. */
  clients: Record<RealmProduct, string>;
}

/** Hex from a source of random bytes: crypto.getRandomValues in the page. */
export function makeSecrets(fill: (bytes: Uint8Array<ArrayBuffer>) => void): Secrets {
  const hex = (n: number) => {
    const b = new Uint8Array(n);
    fill(b);
    return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  };
  return {
    kek: hex(32),
    agentKek: hex(32),
    logsAgentKek: hex(32),
    ingest: hex(24),
    tokens: Object.fromEntries(INSTALLABLE.filter((id) => PARTS[id].ingest && id !== "vulnerabilities").map((id) => [id, hex(24)])),
    keycloakDb: hex(16),
    keycloakAdmin: hex(16),
    clients: { identity: hex(24), vpn: hex(24), infrastructure: hex(24), vulnerabilities: hex(24) },
  };
}

/** Images that are not ours, pinned like everything else (ADR 0027). Keycloak and PostgreSQL as in auth/examples/keycloak. */
export const THIRD_PARTY = {
  keycloak: "quay.io/keycloak/keycloak:26.8.1",
  postgres: "postgres:17.6",
  caddy: "caddy:2.11.7",
  prometheus: "prom/prometheus:v3.5.0",
};
const REALM = "https://raw.githubusercontent.com/openasy/auth/v0.4.0/examples/keycloak/openasy-realm.json";

export interface Part {
  name: string;
  /** Compose service, also the host it is reached at inside the network. */
  service: string;
  /** Environment prefix of its settings, and of its sign-in client's keys in .env. */
  prefix: string;
  /** Its name under the reader's domain. */
  sub: string;
  /** Its client in the ready Keycloak realm, and the variable holding that client's secret. */
  client?: string;
  realmVar?: string;
  /** Its application template in Identity; without one it is added as an OpenID Connect application. */
  template?: string;
  /** Takes data from scripts and CI with <PREFIX>INGEST_TOKEN. */
  ingest?: boolean;
  /** Reads the servers in hosts.yaml (ADR 0052). */
  hosts?: boolean;
}

/** The products in the ready Keycloak realm (auth/examples/keycloak). */
export type RealmProduct = "identity" | "vpn" | "infrastructure" | "vulnerabilities";

export const REALM_PRODUCTS: readonly RealmProduct[] = ["identity", "vpn", "infrastructure", "vulnerabilities"];

export const PARTS: Record<Installable, Part> = {
  identity: { name: "Identity", service: "identity", prefix: "IDENTITY_", sub: "id", client: "openasy-identity", realmVar: "IDENTITY" },
  vpn: { name: "VPN", service: "vpn", prefix: "VPN_", sub: "vpn", client: "openasy-vpn", realmVar: "VPN", template: "openasy-vpn" },
  infrastructure: {
    name: "Infrastructure",
    service: "infra",
    prefix: "INFRA_",
    sub: "infra",
    client: "openasy-infrastructure",
    realmVar: "INFRA",
    template: "openasy-infrastructure",
    hosts: true,
  },
  vulnerabilities: {
    name: "Vulnerabilities",
    service: "vulns",
    prefix: "VULNS_",
    sub: "vulns",
    client: "openasy-vulnerabilities",
    realmVar: "VULNS",
    template: "openasy-vulnerabilities",
    ingest: true,
    hosts: true,
  },
  logs: { name: "Logs", service: "logs", prefix: "LOGS_", sub: "logs", hosts: true },
  siem: { name: "SIEM", service: "siem", prefix: "SIEM_", sub: "siem", ingest: true },
  audit: { name: "Audit", service: "audit", prefix: "AUDIT_", sub: "audit", ingest: true },
  sast: { name: "SAST", service: "sast", prefix: "SAST_", sub: "sast", ingest: true },
  dast: { name: "DAST", service: "dast", prefix: "DAST_", sub: "dast", ingest: true },
  malware: { name: "Malware", service: "malware", prefix: "MALWARE_", sub: "malware", ingest: true, hosts: true },
  posture: { name: "Posture", service: "posture", prefix: "POSTURE_", sub: "posture", ingest: true, hosts: true },
  secrets: { name: "Secrets", service: "secrets", prefix: "SECRETS_", sub: "secrets", ingest: true },
  incidents: { name: "Incidents", service: "incidents", prefix: "INCIDENTS_", sub: "incidents" },
  errors: { name: "Errors", service: "errors", prefix: "ERRORS_", sub: "errors" },
  "supply-chain": { name: "Supply Chain", service: "supply-chain", prefix: "SUPPLY_CHAIN_", sub: "supply-chain", ingest: true },
};
const ROLES = "openasy-admins=admin,openasy-editors=editor,openasy-viewers=viewer";
const PROVIDER_NAME: Record<Provider, string> = { entra: "Microsoft Entra ID", okta: "Okta", google: "Google" };

export interface InstallFile {
  /** The file name to save it as. */
  name: string;
  content: string;
  /** A file the reader brings, such as the logo: the page holds its bytes, and content is empty. */
  binary?: boolean;
  /** Keys and secrets: kept out of git and with the backups. */
  secret?: boolean;
}
export interface InstallStep {
  /** A few words, when the step has a heading of its own. */
  title?: string;
  text: string;
  code?: string;
  /** A short line under the command. */
  note?: string;
}
export interface Wire {
  title: string;
  text: string;
}
export interface Install {
  files: InstallFile[];
  steps: InstallStep[];
  /** Steps few people need, shown when asked for. */
  more?: InstallStep[];
  wiring: Wire[];
  /** Where each product is opened, Keycloak included. */
  addresses: string[];
  /** The names to point at the host, when Caddy, nginx or Apache serves them. */
  hosts: string[];
  services: string[];
}

/** The domain without a scheme, path or trailing dot; example.com when nothing usable is left. */
export const cleanDomain = (d: string) =>
  d
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, "")
    .replace(/[/:].*$/, "")
    .replace(/\.$/, "") || "example.com";

/** Logos the products show: one picture, no text in it (ADR 0053). */
export const LOGO_TYPES = { "image/svg+xml": "svg", "image/png": "png", "image/webp": "webp" } as const;
export const LOGO_MAX_BYTES = 512 * 1024;

/** One line of text, as the products show it; quotes would end the value in the env file. */
export const cleanOrganization = (o: string) =>
  o
    .replace(/[\u0000-\u001f\u007f']/g, "")
    .trim()
    .slice(0, 64);
export const cleanAccent = (a: string) => (/^#[0-9a-f]{6}$/i.test(a.trim()) ? a.trim().toLowerCase() : "");

/** One line of auth.env: the setting with what it does, commented out while it is not set. */
const AUTH_SETTINGS: Array<[string, string, string]> = [
  ["OPENASY_OIDC_PROVIDER", "Which provider: openasy-identity, keycloak, entra, okta, google, authentik or zitadel.", "openasy-identity"],
  ["OPENASY_OIDC_NAME", "The label on the sign-in button.", "SSO"],
  ["OPENASY_OIDC_ROLE_MAPPING", "Group to role, the same in every product.", ROLES],
  ["OPENASY_OIDC_DEFAULT_ROLE", "The role of someone no group maps; unset refuses them.", "viewer"],
  ["OPENASY_OIDC_ALLOWED_DOMAINS", "Only people with an email address in these domains, comma-separated.", "example.com"],
  ["OPENASY_OIDC_AUTO_REDIRECT", "true: the sign-in page goes straight to the provider; ?local=1 still shows the product's own form.", "true"],
  ["OPENASY_OIDC_SCOPES", "Space-separated; the provider's defaults when unset.", "openid email profile"],
  ["OPENASY_OIDC_GROUPS_CLAIM", "Where the groups are in the token; a dotted path reads a nested claim.", "groups"],
];

/** auth.env: how people sign in, the same in every product that loads it (ADR 0002). Each product's client is in `clients`. */
export function authFile(values: Record<string, string>, intro?: string, clients = ".env"): string {
  return [
    "# How people sign in, the same in every product that loads this file (ADR 0002). Each product's own client, its",
    `# issuer, ID and secret, is in ${clients}. After a change: docker compose up -d`,
    ...(intro ? ["#", `# ${intro}`] : []),
    ...AUTH_SETTINGS.flatMap(([k, what, example]) => ["", `# ${what}`, k in values ? `${k}=${values[k]}` : `# ${k}=${example}`]),
  ].join("\n");
}

export function buildInstall(choice: InstallChoice, secrets: Secrets): Install {
  const d = cleanDomain(choice.domain);
  const picked = INSTALLABLE.filter((id) => choice.products.includes(id));
  const has = (id: Installable) => picked.includes(id);
  const caddy = choice.proxy === "caddy";
  const viaIdentity = choice.signIn === "identity" && has("identity");
  const signIn: SignIn = choice.signIn === "identity" && !has("identity") ? "own" : choice.signIn;
  const keycloak = picked.length > 0 && (signIn === "keycloak" || (viaIdentity && choice.upstream === "keycloak"));
  const apps = picked.filter((id) => id !== "identity");
  const host = (id: Installable | "keycloak") => (id === "keycloak" ? `auth.${d}` : `${PARTS[id].sub}.${d}`);
  const url = (id: Installable | "keycloak") => `https://${host(id)}`;
  const tag = (id: Installable) => statusFor(id).version!;
  const env = (k: string, v: string) => `      ${k}: ${v}`;

  // How people sign in. What every product shares (the provider, roles, going straight to it) is in config/auth.env;
  // each product's own client (issuer, ID and secret) is in its environment, from .env (@openasy/auth 0.5.0).
  // A product with no client in the ready realm is added to it by hand, like a client made later.
  const keycloakClient = (id: Installable) => {
    const { client, realmVar } = PARTS[id];
    return client
      ? [
          env("OPENASY_OIDC_ISSUER", `${url("keycloak")}/realms/openasy`),
          env("OPENASY_OIDC_CLIENT_ID", client),
          env("OPENASY_OIDC_CLIENT_SECRET", `\${OPENASY_${realmVar}_SECRET}`),
        ]
      : laterClient(id);
  };
  // A client made after the first start: the issuer comes from .env with it. Until both are there the issuer is empty,
  // which leaves sign-in through it off (@openasy/auth), so the product starts with its own sign-in.
  const laterClient = (id: Installable) => {
    const P = PARTS[id].prefix;
    return [
      "      # Off until .env has the issuer and the client: until then the product signs people in on its own",
      env("OPENASY_OIDC_ISSUER", `\${${P}ISSUER:-}`),
      env("OPENASY_OIDC_CLIENT_ID", `\${${P}CLIENT_ID:-}`),
      env("OPENASY_OIDC_CLIENT_SECRET", `\${${P}CLIENT_SECRET:-}`),
    ];
  };
  // Google sends no groups: people from the domain join with the default role. Through Identity the sign-in page goes
  // straight there, so one sign-in opens every product.
  const sharedOf = (provider: string): Record<string, string> => ({
    OPENASY_OIDC_PROVIDER: provider,
    ...(provider === "google" ? { OPENASY_OIDC_ALLOWED_DOMAINS: d, OPENASY_OIDC_DEFAULT_ROLE: "viewer" } : { OPENASY_OIDC_ROLE_MAPPING: ROLES }),
    ...(provider === "openasy-identity" && { OPENASY_OIDC_AUTO_REDIRECT: "true" }),
  });
  const shared: Record<string, string> =
    signIn === "identity"
      ? sharedOf("openasy-identity")
      : signIn === "keycloak"
        ? sharedOf("keycloak")
        : signIn === "provider"
          ? sharedOf(choice.provider)
          : {};
  // Identity signs its own people in through another provider than the one the products use: its settings stay in
  // its environment, and it does not load auth.env.
  const ownAuthFile = (id: Installable) => id === "identity" && signIn === "identity";
  const identityUpstream = () => {
    const up = sharedOf(choice.upstream);
    const rest = Object.entries(up)
      .filter(([k]) => k !== "OPENASY_OIDC_PROVIDER")
      .map(([k, v]) => env(k, k === "OPENASY_OIDC_ROLE_MAPPING" ? `"${v}"` : v));
    return [env("OPENASY_OIDC_PROVIDER", choice.upstream), ...(choice.upstream === "keycloak" ? keycloakClient("identity") : laterClient("identity")), ...rest];
  };
  const issuerOf = (p: Provider) =>
    p === "entra" ? "https://login.microsoftonline.com/<tenant id>/v2.0" : p === "okta" ? "https://<your org>.okta.com" : "https://accounts.google.com";
  // The three lines a client made later needs, commented out until it exists.
  const later = (id: Installable, issuer: string) => [
    `# ${PARTS[id].prefix}ISSUER=${issuer}`,
    `# ${PARTS[id].prefix}CLIENT_ID=`,
    `# ${PARTS[id].prefix}CLIENT_SECRET=`,
  ];
  const oidc = (id: Installable): string[] => {
    if (signIn === "own") return [];
    if (ownAuthFile(id)) return choice.upstream === "none" ? [] : identityUpstream();
    return signIn === "keycloak" ? keycloakClient(id) : laterClient(id);
  };
  // Behind Caddy nothing but Caddy is published; with a proxy on the host, each product on its own local port.
  const portOf = (id: Installable | "keycloak") => (id === "keycloak" ? 8180 : 8081 + picked.indexOf(id));
  const proxyName = choice.proxy === "nginx" ? "nginx" : choice.proxy === "apache" ? "Apache" : "your TLS proxy";
  const ports = (i: number) => (caddy ? [] : ["    ports:", `      - "127.0.0.1:${8081 + i}:8080"   # ${proxyName} forwards here`]);
  // The servers in one file, mounted read-only in each product that reads it (ADR 0052).
  const readers = picked.filter((id) => PARTS[id].hosts);
  const hostsFile = choice.hostsFile && readers.length > 0;
  const hostsMount = hostsFile ? ["      - ./config/hosts.yaml:/config/hosts.yaml:ro   # your servers, shared with the other products"] : [];
  const hostsEnv = hostsFile ? [env("OPENASY_HOSTS", "/config/hosts.yaml")] : [];
  // The brand every product shows (ADR 0053) and how people sign in, each in a file of its own that every product loads.
  const envFiles = (id: Installable) => [
    `    env_file: [config/brand.env${ownAuthFile(id) ? "" : ", config/auth.env"}]   # your brand${ownAuthFile(id) ? "" : " and sign-in"}, the same in every product`,
  ];
  const logoMount = choice.logo ? [`      - ./config/${choice.logo}:/config/${choice.logo}:ro   # your logo, in every product`] : [];
  const hardened = ["    read_only: true", "    cap_drop: [ALL]", '    security_opt: ["no-new-privileges:true"]'];

  const lines = [`# OpenAsy for ${d}, made at openasy.github.io/install`, "services:"];
  const services: string[] = [];
  const volumes: string[] = [];
  const add = (service: string, body: string[], vols: string[] = []) => {
    services.push(service);
    volumes.push(...vols);
    lines.push(`  ${service}:`, ...body);
  };

  picked.forEach((id, i) => {
    const kek = ["    secrets: [openasy-kek]   # seals its keys and sign-in secrets (ADR 0021)"];
    if (id === "identity")
      add(
        "identity",
        [
          `    image: ghcr.io/openasy/identity:${tag(id)}`,
          "    restart: unless-stopped",
          "    read_only: true",
          ...ports(i),
          "    volumes:",
          "      - identity-data:/data",
          ...logoMount,
          ...kek,
          ...envFiles(id),
          "    environment:",
          env("IDENTITY_PUBLIC_URL", `${url(id)}   # the issuer: keep it fixed once applications use it`),
          ...oidc(id),
        ],
        ["identity-data"],
      );
    if (id === "vpn") {
      add(
        "vpn",
        [
          `    image: ghcr.io/openasy/vpn:${tag(id)}`,
          "    restart: unless-stopped",
          ...ports(i),
          "    volumes:",
          "      - vpn-data:/data   # SQLite database, CA and settings",
          ...logoMount,
          ...kek,
          ...envFiles(id),
          "    environment:",
          env("VPN_PUBLIC_URL", url(id)),
          env("VPN_PUBLIC_HOST", `${host(id)}   # the name clients connect to`),
          ...oidc(id),
        ],
        ["vpn-data"],
      );
      const server = (service: string, proto: "udp" | "tcp", port: number, token: string) => [
        `    image: ghcr.io/openasy/vpn-server:${tag(id)}   # always the same version as vpn`,
        "    restart: unless-stopped",
        "    cap_add: [NET_ADMIN]",
        "    devices: [/dev/net/tun]",
        "    sysctls:",
        "      net.ipv4.ip_forward: 1   # lets clients reach the networks behind this host",
        "    ports:",
        `      - "${port}:${port}/${proto}"`,
        "    volumes:",
        `      - ${service}-data:/var/lib/openasy-vpn   # its secret: without it, it must enrol again`,
        "    environment:",
        env("VPN_URL", "http://vpn:8080"),
        env("VPN_ENROLL_TOKEN", `\${${token}:-}   # one-time, from Servers in vpn`),
        env("OPENVPN_PROTO", proto),
        env("OPENVPN_PORT", `"${port}"`),
        "    depends_on: [vpn]",
      ];
      add("vpn-server", server("vpn-server", "udp", 1194, "VPN_ENROLL_TOKEN"), ["vpn-server-data"]);
      // Caddy holds TCP 443, so the TCP server takes 8443 behind it.
      if (choice.vpnTcp) add("vpn-server-tcp", server("vpn-server-tcp", "tcp", caddy ? 8443 : 443, "VPN_TCP_ENROLL_TOKEN"), ["vpn-server-tcp-data"]);
    }
    if (id === "infrastructure") {
      add(
        "infra",
        [
          `    image: ghcr.io/openasy/infra:${tag(id)}`,
          "    restart: unless-stopped",
          ...hardened,
          "    tmpfs: [/tmp]",
          ...ports(i),
          "    volumes:",
          "      - infra-data:/data   # agents, hosts, clusters, collections and changes",
          ...hostsMount,
          ...logoMount,
          ...kek,
          ...envFiles(id),
          "    environment:",
          env("INFRA_PUBLIC_URL", url(id)),
          ...hostsEnv,
          ...oidc(id),
        ],
        ["infra-data"],
      );
      add(
        "infra-agent",
        [
          `    image: ghcr.io/openasy/infra-agent:${tag(id)}   # reads hosts over SSH; nothing is installed on them`,
          "    restart: unless-stopped",
          ...hardened,
          "    tmpfs: [/tmp]",
          "    volumes:",
          "      - infra-agent-data:/data   # its CA and keys, sealed with its own key",
          "    secrets: [openasy-agent-kek]",
          "    environment:",
          env("INFRA_URL", "http://infra:8080"),
          env("INFRA_ENROLL_TOKEN", "${INFRA_ENROLL_TOKEN:-}   # one-time, from Settings, Agents"),
          "    depends_on: [infra]",
        ],
        ["infra-agent-data"],
      );
    }
    if (id === "vulnerabilities") {
      add(
        "vulns",
        [
          `    image: ghcr.io/openasy/vulns:${tag(id)}`,
          "    restart: unless-stopped",
          ...hardened,
          ...ports(i),
          "    volumes:",
          "      - vulns-data:/data   # SQLite, SBOMs and the vulnerability data (3 GB)",
          ...hostsMount,
          ...logoMount,
          ...kek,
          ...envFiles(id),
          "    environment:",
          env("VULNS_PUBLIC_URL", url(id)),
          env("VULNS_INGEST_TOKEN", "${VULNS_INGEST_TOKEN}"),
          ...hostsEnv,
          ...oidc(id),
        ],
        ["vulns-data"],
      );
      if (choice.vulnsHost)
        add("vulns-agent", [
          `    image: ghcr.io/openasy/vulns-agent:${tag(id)}`,
          "    restart: unless-stopped",
          ...hardened,
          "    tmpfs: [/tmp]",
          "    hostname: ${HOSTNAME:-host}   # the name this host gets in vulns",
          "    volumes:",
          "      - /:/host:ro   # read-only: it lists packages, it never changes the host",
          "    environment:",
          env("VULNS_URL", "http://vulns:8080"),
          env("VULNS_INGEST_TOKEN", "${VULNS_INGEST_TOKEN}"),
          "    depends_on: [vulns]",
        ]);
    }
    // Every other product is one hardened container like these, as compose.yaml in its repository has it.
    if (!(REALM_PRODUCTS as readonly string[]).includes(id)) {
      const { service, prefix, ingest, hosts } = PARTS[id];
      add(
        service,
        [
          `    image: ghcr.io/openasy/${service}:${tag(id)}`,
          "    restart: unless-stopped",
          ...hardened,
          "    tmpfs: [/tmp]",
          ...ports(i),
          "    volumes:",
          `      - ${service}-data:/data   # SQLite database`,
          ...(hosts ? hostsMount : []),
          ...logoMount,
          ...kek,
          ...envFiles(id),
          "    environment:",
          env(`${prefix}PUBLIC_URL`, url(id)),
          ...(ingest ? [env(`${prefix}INGEST_TOKEN`, `\${${prefix}INGEST_TOKEN}   # for the scripts and CI jobs that send it data`)] : []),
          ...(hosts ? hostsEnv : []),
          ...oidc(id),
        ],
        [`${service}-data`],
      );
    }
    if (id === "logs")
      add(
        "logs-agent",
        [
          `    image: ghcr.io/openasy/logs-agent:${tag(id)}   # reads the journal and container logs over SSH; nothing is installed on hosts`,
          "    restart: unless-stopped",
          ...hardened,
          "    tmpfs: [/tmp]",
          "    volumes:",
          "      - logs-agent-data:/data   # its CA and keys, sealed with its own key",
          "    secrets:",
          "      - source: openasy-logs-agent-kek",
          "        target: openasy-agent-kek",
          "    environment:",
          env("LOGS_URL", "http://logs:8080"),
          env("LOGS_ENROLL_TOKEN", "${LOGS_ENROLL_TOKEN:-}   # one-time, from Settings, Agents"),
          "    depends_on: [logs]",
        ],
        ["logs-agent-data"],
      );
  });

  if (keycloak) {
    // The realm names every product's client, so each gets its address and secret, run here or not.
    const realm = REALM_PRODUCTS.flatMap((id) => [
      env(`OPENASY_${PARTS[id].realmVar}_URL`, url(id)),
      env(`OPENASY_${PARTS[id].realmVar}_SECRET`, `\${OPENASY_${PARTS[id].realmVar}_SECRET}`),
    ]);
    add("keycloak", [
      `    image: ${THIRD_PARTY.keycloak}`,
      "    restart: unless-stopped",
      "    command: start --import-realm",
      ...(caddy ? [] : ["    ports:", `      - "127.0.0.1:8180:8080"   # ${proxyName} forwards here`]),
      "    volumes:",
      "      - ./config/openasy-realm.json:/opt/keycloak/data/import/openasy-realm.json:ro",
      "    environment:",
      env("KC_HOSTNAME", url("keycloak")),
      env("KC_HTTP_ENABLED", '"true"   # TLS ends at the proxy'),
      env("KC_PROXY_HEADERS", "xforwarded"),
      env("KC_DB", "postgres"),
      env("KC_DB_URL", "jdbc:postgresql://postgres:5432/keycloak"),
      env("KC_DB_USERNAME", "keycloak"),
      env("KC_DB_PASSWORD", "${KEYCLOAK_DB_PASSWORD}"),
      env("KC_BOOTSTRAP_ADMIN_USERNAME", "admin"),
      env("KC_BOOTSTRAP_ADMIN_PASSWORD", "${KEYCLOAK_ADMIN_PASSWORD}"),
      ...realm,
      "    depends_on: [postgres]",
    ]);
    add(
      "postgres",
      [
        `    image: ${THIRD_PARTY.postgres}`,
        "    restart: unless-stopped",
        "    volumes:",
        "      - keycloak-db:/var/lib/postgresql/data",
        "    environment:",
        env("POSTGRES_DB", "keycloak"),
        env("POSTGRES_USER", "keycloak"),
        env("POSTGRES_PASSWORD", "${KEYCLOAK_DB_PASSWORD}"),
      ],
      ["keycloak-db"],
    );
  }
  const prometheus = choice.prometheus && picked.length > 0;
  if (prometheus)
    add(
      "prometheus",
      [
        `    image: ${THIRD_PARTY.prometheus}`,
        "    restart: unless-stopped",
        "    ports:",
        '      - "127.0.0.1:9090:9090"',
        "    volumes:",
        "      - ./config/prometheus.yml:/etc/prometheus/prometheus.yml:ro",
        "      - prometheus-data:/prometheus",
      ],
      ["prometheus-data"],
    );
  const fronted: Array<Installable | "keycloak"> = [...picked, ...(keycloak ? (["keycloak"] as const) : [])];
  const withCaddy = caddy && fronted.length > 0;
  if (withCaddy)
    add(
      "caddy",
      [
        `    image: ${THIRD_PARTY.caddy}   # makes and renews the HTTPS certificates`,
        "    restart: unless-stopped",
        "    ports:",
        '      - "80:80"',
        '      - "443:443"',
        "    volumes:",
        "      - ./config/Caddyfile:/etc/caddy/Caddyfile:ro",
        "      - caddy-data:/data",
      ],
      ["caddy-data"],
    );
  if (!picked.length) lines[1] = "services: {}   # pick a product to begin";
  if (volumes.length) lines.push("volumes:", ...volumes.map((v) => `  ${v}:`));
  if (picked.length)
    lines.push(
      "secrets:",
      "  openasy-kek:",
      "    file: ./secrets/openasy-kek",
      ...(has("infrastructure") ? ["  openasy-agent-kek:", "    file: ./secrets/openasy-agent-kek"] : []),
      ...(has("logs") ? ["  openasy-logs-agent-kek:", "    file: ./secrets/openasy-logs-agent-kek"] : []),
    );

  // .env: what the compose file reads. Secrets made here are filled in; what only exists after the first start is left empty.
  const e = ["# Keep this file with your backups and out of git."];
  const block = (title: string, rows: string[]) => rows.length && e.push("", `# ${title}`, ...rows);
  if (has("vulnerabilities")) block("Vulnerabilities and its agents", [`VULNS_INGEST_TOKEN=${secrets.ingest}`]);
  block(
    "For the scripts and CI jobs that send each product data",
    picked.filter((id) => id !== "vulnerabilities" && PARTS[id].ingest).map((id) => `${PARTS[id].prefix}INGEST_TOKEN=${secrets.tokens[id]}`),
  );
  if (viaIdentity)
    block(
      "From Identity, Applications, after the first start: remove the # and fill them in",
      apps.flatMap((id) => later(id, url("identity"))),
    );
  if (keycloak)
    block("Keycloak", [
      `KEYCLOAK_DB_PASSWORD=${secrets.keycloakDb}`,
      `KEYCLOAK_ADMIN_PASSWORD=${secrets.keycloakAdmin}`,
      ...REALM_PRODUCTS.map((id) => `OPENASY_${PARTS[id].realmVar}_SECRET=${secrets.clients[id]}`),
    ]);
  const unrealmed = signIn === "keycloak" ? picked.filter((id) => !PARTS[id].client) : [];
  if (unrealmed.length)
    block(
      "From Keycloak, once each is added as a client to the openasy realm: remove the # and fill them in",
      unrealmed.flatMap((id) => later(id, `${url("keycloak")}/realms/openasy`)),
    );
  const provider =
    signIn === "provider" ? choice.provider : viaIdentity && choice.upstream !== "none" && choice.upstream !== "keycloak" ? choice.upstream : undefined;
  if (provider && picked.length) {
    const who = signIn === "provider" ? picked : (["identity"] as Installable[]);
    block(
      `From ${PROVIDER_NAME[provider]}, once each is registered there: remove the # and fill them in`,
      who.flatMap((id) => later(id, issuerOf(provider))),
    );
  }
  block("One-time tokens, after the first start", [
    ...(has("vpn") ? ["VPN_ENROLL_TOKEN="] : []),
    ...(has("vpn") && choice.vpnTcp ? ["VPN_TCP_ENROLL_TOKEN="] : []),
    ...(has("infrastructure") ? ["INFRA_ENROLL_TOKEN="] : []),
    ...(has("logs") ? ["LOGS_ENROLL_TOKEN="] : []),
  ]);

  const names = (ids: readonly Installable[]) => ids.map((id) => PARTS[id].name).join(", ");
  const files: InstallFile[] = [
    { name: "compose.yaml", content: lines.join("\n") },
    { name: ".env", content: e.join("\n"), secret: true },
  ];
  if (picked.length) {
    // Single quotes: compose reads the value as it is, with no $ expansion.
    const org = cleanOrganization(choice.organization);
    const accent = cleanAccent(choice.accent);
    const line = (on: boolean, k: string, v: string) => `${on ? "" : "# "}${k}=${v}`;
    files.push({
      name: "config/brand.env",
      content: [
        "# The brand every product shows, loaded by each of them (ADR 0053). After a change: docker compose up -d",
        "",
        "# Under each product's name, such as your company.",
        line(!!org, "OPENASY_ORGANIZATION", org ? `'${org}'` : "'Acme Corp'"),
        "# Buttons and links in your color.",
        line(!!accent, "OPENASY_ACCENT", accent || "#0a66c2"),
        "# Your logo with no text in it: SVG, PNG or WebP. It replaces the OpenAsy mark and the tab icon.",
        "# Put the file in this config folder and mount it in each product, as compose.yaml shows.",
        line(!!choice.logo, "OPENASY_LOGO", `/config/${choice.logo ?? "logo.svg"}`),
      ].join("\n"),
    });
    files.push({
      name: "config/auth.env",
      content: authFile(
        shared,
        signIn === "own"
          ? "Each product signs people in on its own. To use a provider, set it here and give each product its client in .env (openasy.github.io/sign-in)."
          : undefined,
      ),
    });
    if (choice.logo) files.push({ name: `config/${choice.logo}`, content: "", binary: true });
    files.push({ name: "secrets/openasy-kek", content: secrets.kek, secret: true });
  }
  if (has("infrastructure")) files.push({ name: "secrets/openasy-agent-kek", content: secrets.agentKek, secret: true });
  if (has("logs")) files.push({ name: "secrets/openasy-logs-agent-kek", content: secrets.logsAgentKek, secret: true });
  if (hostsFile)
    files.push({
      name: "config/hosts.yaml",
      content: [
        `# Your servers, read by ${readers.map((id) => PARTS[id].name).join(" and ")} (ADR 0052). A change is picked up within a minute.`,
        ...(readers.includes("infrastructure")
          ? ["# Infrastructure reads each one over SSH through infra-agent: prepare it first, as Setup in Infrastructure shows."]
          : []),
        ...(readers.includes("logs") ? ["# Logs reads their journal and container logs over SSH through logs-agent, prepared the same way."] : []),
        ...(readers.some((id) => id === "vulnerabilities" || id === "posture" || id === "malware")
          ? [`# ${names(readers.filter((id) => id === "vulnerabilities" || id === "posture" || id === "malware"))} list the ones they have no scan for.`]
          : []),
        "#",
        "# hosts:",
        "#   - name: web-1                # unique: how every product knows it",
        "#     address: 10.0.0.5",
        "#     port: 22                   # 22 when left out",
        "#     user: openasy              # openasy when left out",
        "#     hostKey: SHA256:...        # ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub: trusted without an admin when it matches",
        "#     tags: { env: prod }",
        "hosts: []",
      ].join("\n"),
    });
  if (withCaddy)
    files.push({
      name: "config/Caddyfile",
      content: fronted.map((id) => `${host(id)} {\n  reverse_proxy ${id === "keycloak" ? "keycloak" : PARTS[id].service}:8080\n}`).join("\n\n"),
    });
  // Plain HTTP sites that certbot then turns into HTTPS with a redirect. The scheme is passed on as it is, so after
  // certbot the products see https: Identity builds its issuer URLs from it.
  const onHost = (choice.proxy === "nginx" || choice.proxy === "apache") && fronted.length > 0;
  if (onHost && choice.proxy === "nginx")
    files.push({
      name: "config/openasy-nginx.conf",
      content: [
        `# OpenAsy for ${d}: copy to /etc/nginx/conf.d/openasy.conf, then run certbot --nginx (Steps).`,
        ...fronted.map((id) =>
          [
            "server {",
            "    listen 80;",
            `    server_name ${host(id)};`,
            "    client_max_body_size 50m;",
            "    location / {",
            `        proxy_pass http://127.0.0.1:${portOf(id)};`,
            "        proxy_http_version 1.1;",
            "        proxy_set_header Host $host;",
            "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;",
            "        proxy_set_header X-Forwarded-Proto $scheme;",
            "        proxy_set_header X-Forwarded-Host $host;",
            "    }",
            "}",
          ].join("\n"),
        ),
      ].join("\n\n"),
    });
  if (onHost && choice.proxy === "apache")
    files.push({
      name: "config/openasy-apache.conf",
      content: [
        `# OpenAsy for ${d}: needs mod_proxy, mod_proxy_http and mod_headers. Copy to /etc/apache2/sites-available/openasy.conf, then run certbot --apache (Steps).`,
        ...fronted.map((id) =>
          [
            "<VirtualHost *:80>",
            `    ServerName ${host(id)}`,
            "    ProxyPreserveHost On",
            `    ProxyPass / http://127.0.0.1:${portOf(id)}/`,
            `    ProxyPassReverse / http://127.0.0.1:${portOf(id)}/`,
            '    RequestHeader set X-Forwarded-Proto "expr=%{REQUEST_SCHEME}"',
            "</VirtualHost>",
          ].join("\n"),
        ),
      ].join("\n\n"),
    });
  if (prometheus)
    files.push({
      name: "config/prometheus.yml",
      content: [
        "global:",
        "  scrape_interval: 30s",
        "scrape_configs:",
        ...picked.map((id) => `  - job_name: ${PARTS[id].service}\n    static_configs:\n      - targets: ["${PARTS[id].service}:8080"]`),
      ].join("\n"),
    });

  const steps: InstallStep[] = [];
  if (picked.length) {
    steps.push({
      text: `On a host with Docker, unzip openasy.zip and work in its openasy folder: compose.yaml and .env at the top, settings in config and keys in secrets. Keep the secrets folder with your backups: without it the products cannot open their secrets.`,
    });
    if (keycloak)
      steps.push({ text: "Fetch the Keycloak realm in which every product is already a client:", code: `curl -fsSL -o config/openasy-realm.json ${REALM}` });
    if (withCaddy || onHost)
      steps.push({ text: `Point ${fronted.map(host).join(", ")} at this host, so ${withCaddy ? "Caddy" : "certbot"} can get their certificates.` });
    // Agents that enrol with a one-time token start once they have it.
    const waiting = ["vpn-server", "vpn-server-tcp", "infra-agent", "logs-agent"];
    const first = services.filter((sv) => !waiting.includes(sv));
    steps.push({
      text: first.length < services.length ? "Start everything but the agents that wait for a token:" : "Start everything:",
      code: first.length < services.length ? `docker compose up -d ${first.join(" ")}` : "docker compose up -d",
    });
    const certbot = `sudo certbot --${choice.proxy} ${fronted.map((id) => `-d ${host(id)}`).join(" ")}`;
    if (onHost && choice.proxy === "nginx")
      steps.push({
        text: "Give nginx the sites, then let certbot add HTTPS and the redirect from HTTP:",
        code: `sudo cp config/openasy-nginx.conf /etc/nginx/conf.d/openasy.conf\nsudo nginx -t && sudo systemctl reload nginx\n${certbot}`,
      });
    if (onHost && choice.proxy === "apache")
      steps.push({
        text: "Give Apache the sites, then let certbot add HTTPS and the redirect from HTTP:",
        code: `sudo a2enmod proxy proxy_http headers\nsudo cp config/openasy-apache.conf /etc/apache2/sites-available/openasy.conf\nsudo a2ensite openasy && sudo apachectl configtest && sudo systemctl reload apache2\n${certbot}`,
      });
    if (choice.proxy === "own" && fronted.length)
      steps.push({
        text: `Point your TLS proxy at the products: ${fronted.map((id) => `${host(id)} to 127.0.0.1:${portOf(id)}`).join(", ")}. Pass on Host and X-Forwarded-Proto.`,
      });
    steps.push({
      text: "Open each product's one-time link, which creates its owner account:",
      code: picked.map((id) => `docker compose logs ${PARTS[id].service} | grep "no owner yet"`).join("\n"),
    });
    if (keycloak)
      steps.push({ text: `In Keycloak, at ${url("keycloak")}/admin, add people and put them in openasy-admins, openasy-editors or openasy-viewers.` });
    if (viaIdentity && apps.length) {
      const templated = apps.filter((id) => PARTS[id].template);
      const plain = apps.filter((id) => !PARTS[id].template);
      const how = [
        templated.length && `${names(templated)} from ${templated.length > 1 ? "their templates" : "its template"}`,
        plain.length && `${names(plain)} as OpenID Connect applications with the redirect URI https://<its address>/api/v1/auth/oidc/sso/callback`,
      ]
        .filter(Boolean)
        .join(", and ");
      steps.push({
        text: `In Identity, Applications, add ${how}. Put the issuer, client ID and secret of each in .env, then start them again:`,
        code: `docker compose up -d ${apps.map((id) => PARTS[id].service).join(" ")}`,
      });
    }
    if (unrealmed.length)
      steps.push({
        text: `In Keycloak, add ${names(unrealmed)} as clients of the openasy realm, with the redirect URI https://<its address>/api/v1/auth/oidc/sso/callback. Put each one's issuer, client ID and secret in .env.`,
      });
    if (provider)
      steps.push({
        text: `At ${PROVIDER_NAME[provider]}, register ${(signIn === "provider" ? picked : ["identity" as const]).map((id) => PARTS[id].name).join(", ")} with the redirect URIs from the sign-in guide, and fill in .env.`,
      });
    if (has("vpn"))
      steps.push({
        text: `In VPN, Servers, add ${host("vpn")}${choice.vpnTcp ? " twice, for UDP and for TCP" : ""}. Put the token in .env, then:`,
        code: `docker compose up -d vpn-server${choice.vpnTcp ? " vpn-server-tcp" : ""}`,
      });
    if (has("infrastructure"))
      steps.push({ text: "In Infrastructure, Settings, Agents, make a token. Put it in INFRA_ENROLL_TOKEN, then:", code: "docker compose up -d infra-agent" });
    if (has("logs"))
      steps.push({ text: "In Logs, Settings, Agents, make a token. Put it in LOGS_ENROLL_TOKEN, then:", code: "docker compose up -d logs-agent" });
    if (hostsFile)
      steps.push({
        text: `List your servers in config/hosts.yaml. ${readers.map((id) => PARTS[id].name).join(" and ")} pick them up within a minute, with no restart.`,
      });
  }

  const wiring: Wire[] = [];
  if (picked.length)
    wiring.push({ title: "One key seals them", text: `openasy-kek, made in your browser, seals the keys and sign-in secrets of ${names(picked)}.` });
  if (viaIdentity) {
    if (apps.length)
      wiring.push({
        title: `${names(apps)} sign in through Identity`,
        text: `People sign in once at ${host("identity")}, and their groups decide their role: openasy-admins become admins. Until you add the clients, each product signs people in on its own.`,
      });
    wiring.push({
      title: "Identity's people",
      text:
        choice.upstream === "none"
          ? "are kept in Identity, with passwords, passkeys and second factors."
          : choice.upstream === "keycloak"
            ? `come from Keycloak at ${host("keycloak")}, with its groups.`
            : choice.upstream === "google"
              ? `come from Google, for ${d} only.`
              : `come from ${PROVIDER_NAME[choice.upstream]}, with its groups.`,
    });
  } else if (signIn === "keycloak" && picked.length)
    wiring.push({ title: `${names(picked)} sign in through Keycloak`, text: "Each is already a client in the openasy realm, with its secret made here." });
  else if (signIn === "provider" && picked.length)
    wiring.push({ title: `${names(picked)} sign in through ${PROVIDER_NAME[choice.provider]}`, text: "Register each product there, then fill in .env." });
  else if (picked.length)
    wiring.push({
      title: "Each product signs people in on its own",
      text: "with passwords, passkeys and authenticator apps. Add a provider later under Settings, Sign-in.",
    });
  if (has("vpn"))
    wiring.push({
      title: "vpn-server enrols with VPN",
      text: choice.vpnTcp
        ? `Clients connect on UDP 1194, or TCP ${caddy ? "8443, since Caddy holds 443," : "443"} where only HTTPS gets through.`
        : "Clients connect on UDP 1194.",
    });
  if (has("infrastructure"))
    wiring.push({ title: "infra-agent reads your hosts", text: "over SSH with 5-minute certificates from its own CA. Nothing is installed on them." });
  if (has("vulnerabilities"))
    wiring.push({
      title: "Vulnerabilities",
      text: choice.vulnsHost
        ? "vulns-agent reports this host with the ingest token made here."
        : "waits for agents on your hosts, with the ingest token made here.",
    });
  if (has("logs"))
    wiring.push({
      title: "logs-agent reads your hosts' logs",
      text: "over SSH with its own CA and key, kept apart from infra-agent's. Hosts that already ship logs send them to Logs instead.",
    });
  const fed = picked.filter((id) => id !== "vulnerabilities" && PARTS[id].ingest);
  if (fed.length) wiring.push({ title: `${names(fed)} take data from CI and scripts`, text: "each with its own ingest token, made here and kept in .env." });
  if (picked.length) {
    const org = cleanOrganization(choice.organization);
    const parts = [org && `${org} under each product's name`, choice.logo && "your logo", cleanAccent(choice.accent) && "your color"].filter(Boolean);
    wiring.push({
      title: "One brand",
      text: parts.length
        ? `in config/brand.env: ${parts.join(", ")}, in every product.`
        : "in config/brand.env, which every product loads. Set your name, logo and color there, now or later.",
    });
  }
  if (hostsFile)
    wiring.push({
      title: "One list of servers",
      text:
        readers.length > 1
          ? "in hosts.yaml: Infrastructure reads each one, and Vulnerabilities shows the ones that send no scan."
          : `in hosts.yaml, read by ${PARTS[readers[0]!].name}. Other products that work with servers can read the same file.`,
    });
  if (prometheus) wiring.push({ title: "Prometheus scrapes every product", text: "inside the compose network, on 127.0.0.1:9090. Nothing is exposed for it." });
  if (withCaddy) wiring.push({ title: "Caddy serves HTTPS", text: `for ${fronted.map(host).join(", ")}. The products are reached only through it.` });
  if (onHost)
    wiring.push({
      title: `${proxyName} on this host serves HTTPS`,
      text: `for ${fronted.map(host).join(", ")}, with certificates from certbot. The products listen on 127.0.0.1 only.`,
    });

  return { files, steps, wiring, addresses: fronted.map(host), hosts: withCaddy || onHost ? fronted.map(host) : [], services };
}
