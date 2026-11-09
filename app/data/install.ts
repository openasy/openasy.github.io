// The install builder (/install): one setup for several products that already know each other. Pure functions, so the
// page and the tests use the same output. No React or @openasy/ui imports here, like goals.ts.
// Each product's part matches the compose.yaml in its repository; versions come from status.ts.
import { splitProducts } from "./productfiles";
import { CONFIGS } from "./configs";
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
  "certificates",
  "uptime",
  "backups",
  "risk",
  "threat-intel",
  "cost",
  "deception",
  "alerts",
  "access",
  "database",
  "endpoints",
  "attack-surface",
  "awareness",
  "runtime",
  "network-ids",
  "attack-simulation",
  "compliance",
  "automation",
  "metrics",
  "traces",
  "profiling",
  "waf",
  "assistant",
  "analytics",
  "consent",
  "audience",
  "messages",
  "campaigns",
  "forms",
  "crm",
  "helpdesk",
  "live-chat",
  "knowledge-base",
  "mail",
  "calendar",
  "files",
  "passwords",
  "wiki",
  "hr",
  "invoices",
] as const;
export type Installable = (typeof INSTALLABLE)[number];

export type SignIn = "identity" | "keycloak" | "provider" | "existing" | "own";
/** An Identity or a Keycloak that already runs elsewhere, which the products sign in through. */
export type Existing = "openasy-identity" | "keycloak";
export type Provider = "entra" | "okta" | "google";
/** Where Identity's own people come from when it signs everyone else in. */
export type Upstream = "none" | "keycloak" | Provider;
export type Proxy = "caddy" | "nginx" | "apache" | "own";
/**
 * Where VPN's servers run (ADR 0032): on the panel's host, or each on a host of its own (one at the edge, or one per
 * location) that reaches the panel over HTTPS. The panel never connects to a server.
 */
export type VpnLayout = "one-host" | "edge" | "locations";
/** A vpn-server on a host of its own: its name in VPN, and the address clients connect to (empty: <name>.<domain>). */
export interface VpnServer {
  name: string;
  address: string;
}
export type Certificates = "public" | "internal";

export interface InstallChoice {
  products: Installable[];
  signIn: SignIn;
  upstream: Upstream;
  provider: Provider;
  /** With signIn "existing": which kind it is, and its issuer, such as https://id.example.com. */
  existing: Existing;
  issuer: string;
  domain: string;
  /**
   * Caddy runs in the compose file and makes the certificates. nginx and Apache run on the host, as they usually do
   * already: the products listen on 127.0.0.1 and their site config is written here, with certbot for HTTPS. "own"
   * leaves the local ports for any other proxy.
   */
  proxy: Proxy;
  /** Where Caddy gets the certificates: Let's Encrypt for public names, or its own CA on a network the internet cannot reach. */
  certificates: Certificates;
  prometheus: boolean;
  /** A second vpn-server on TCP, for networks that allow only HTTPS. */
  vpnTcp: boolean;
  vpnLayout: VpnLayout;
  /** With the edge or locations layout: the servers, each on a host of its own. */
  vpnServers: VpnServer[];
  /** vulns-agent on this host too. */
  vulnsHost: boolean;
  /** Shown under each product's name; empty leaves the line out. */
  organization: string;
  /** #rrggbb for buttons and links; empty keeps OpenAsy's blue. */
  accent: string;
  /** The logo's file name in brand/, such as logo.svg, once one is picked; its bytes stay in the page. */
  logo: string | null;
  /** The tab icon's file name in brand/, such as favicon.png, the same way. */
  favicon: string | null;
}

export const DEFAULT_CHOICE: InstallChoice = {
  products: ["identity", "vpn"],
  signIn: "identity",
  upstream: "none",
  provider: "entra",
  existing: "openasy-identity",
  issuer: "",
  domain: "example.com",
  proxy: "caddy",
  certificates: "public",
  prometheus: true,
  vpnTcp: false,
  vpnLayout: "one-host",
  vpnServers: [],
  vulnsHost: true,
  organization: "",
  accent: "",
  logo: null,
  favicon: null,
};

/** Made in the reader's browser; the names are the variables or files they end up in. */
export interface Secrets {
  kek: string;
  /** infra-agent's, sast-agent's and dast-agent's own key; logs-agent and siem-agent each have one of their own. */
  agentKek: string;
  logsAgentKek: string;
  siemAgentKek: string;
  /** Vulnerabilities' ingest token, which its agents send. */
  ingest: string;
  /** The ingest token of every other product that takes data from scripts and CI. */
  tokens: Partial<Record<Installable, string>>;
  keycloakDb: string;
  keycloakAdmin: string;
  /** Stalwart's own administrator, and the service accounts Mail and Calendar sign in to it with. */
  stalwartAdmin: string;
  stalwartPassword: string;
  calendarStalwartPassword: string;
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
    siemAgentKek: hex(32),
    ingest: hex(24),
    tokens: Object.fromEntries(INSTALLABLE.filter((id) => PARTS[id].ingest && id !== "vulnerabilities").map((id) => [id, hex(24)])),
    keycloakDb: hex(16),
    keycloakAdmin: hex(16),
    stalwartAdmin: hex(16),
    stalwartPassword: hex(24),
    calendarStalwartPassword: hex(24),
    clients: { identity: hex(24), vpn: hex(24), infrastructure: hex(24), vulnerabilities: hex(24) },
  };
}

/** Images that are not ours, pinned like everything else (ADR 0027). Keycloak and PostgreSQL as in auth/examples/keycloak. */
export const THIRD_PARTY = {
  keycloak: "quay.io/keycloak/keycloak:26.8.1",
  postgres: "postgres:17.6",
  caddy: "caddy:2.11.7",
  prometheus: "prom/prometheus:v3.5.0",
  stalwart: "stalwartlabs/stalwart:v0.16",
  opencloud: "opencloudeu/opencloud:7.2.4",
  vaultwarden: "vaultwarden/server:1.37.4",
};
const REALM = "https://raw.githubusercontent.com/openasy/auth/v0.4.0/examples/keycloak/openasy-realm.json";

export interface Part {
  name: string;
  /** Compose service, also the host it is reached at inside the network. */
  service: string;
  /** Environment prefix of its settings. */
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
  /** Reads the endpoints in endpoints.yaml (ADR 0052). */
  endpoints?: boolean;
  /** Reads the forge accounts in repositories.yaml, and their tokens from products/sast.yaml (ADR 0052). */
  repositories?: boolean;
  /** Reads config/<service>.yaml, the example from its release (app/data/configs.ts). */
  config?: boolean;
  /** Everyone with an account signs in with the user role, as in Mail, Calendar, Files and Passwords. */
  userRole?: boolean;
  /** Signs in only through OpenAsy Identity: its server (OpenCloud, Vaultwarden) does too. */
  needsIdentity?: boolean;
  /** More lines of its environment, as compose.yaml in its repository has them. */
  extraEnv?: string[];
}

/** The products in the ready Keycloak realm (auth/examples/keycloak). */
export type RealmProduct = "identity" | "vpn" | "infrastructure" | "vulnerabilities";

export const REALM_PRODUCTS: readonly RealmProduct[] = ["identity", "vpn", "infrastructure", "vulnerabilities"];
/** Products that run next to a server of their own, each written out in buildInstall rather than by the common block. */
const WITH_SERVER: readonly Installable[] = ["mail", "calendar", "files", "passwords"];

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
  siem: { name: "SIEM", service: "siem", prefix: "SIEM_", sub: "siem", ingest: true, hosts: true },
  audit: { name: "Audit", service: "audit", prefix: "AUDIT_", sub: "audit", ingest: true },
  sast: { name: "SAST", service: "sast", prefix: "SAST_", sub: "sast", ingest: true, repositories: true },
  dast: { name: "DAST", service: "dast", prefix: "DAST_", sub: "dast", ingest: true, endpoints: true },
  malware: { name: "Malware", service: "malware", prefix: "MALWARE_", sub: "malware", ingest: true, hosts: true },
  posture: { name: "Posture", service: "posture", prefix: "POSTURE_", sub: "posture", ingest: true, hosts: true },
  secrets: { name: "Secrets", service: "secrets", prefix: "SECRETS_", sub: "secrets", ingest: true },
  incidents: { name: "Incidents", service: "incidents", prefix: "INCIDENTS_", sub: "incidents" },
  errors: { name: "Errors", service: "errors", prefix: "ERRORS_", sub: "errors" },
  "supply-chain": { name: "Supply Chain", service: "supply-chain", prefix: "SUPPLY_CHAIN_", sub: "supply-chain", ingest: true },
  certificates: { name: "Certificates", service: "certificates", prefix: "CERTIFICATES_", sub: "certificates", ingest: true, endpoints: true },
  uptime: { name: "Uptime", service: "uptime", prefix: "UPTIME_", sub: "uptime", ingest: true, endpoints: true },
  backups: { name: "Backups", service: "backups", prefix: "BACKUPS_", sub: "backups", ingest: true, hosts: true },
  risk: { name: "Risk", service: "risk", prefix: "RISK_", sub: "risk" },
  "threat-intel": { name: "Threat Intelligence", service: "threat-intel", prefix: "THREAT_INTEL_", sub: "threat-intel", ingest: true },
  cost: { name: "Cost", service: "cost", prefix: "COST_", sub: "cost", ingest: true },
  deception: { name: "Deception", service: "deception", prefix: "DECEPTION_", sub: "deception", ingest: true },
  alerts: { name: "Alerts", service: "alerts", prefix: "ALERTS_", sub: "alerts", ingest: true },
  access: { name: "Access", service: "access", prefix: "ACCESS_", sub: "access" },
  database: { name: "Database", service: "database", prefix: "DATABASE_", sub: "database" },
  endpoints: { name: "Endpoints", service: "endpoints", prefix: "ENDPOINTS_", sub: "endpoints" },
  "attack-surface": { name: "Attack Surface", service: "attack-surface", prefix: "ATTACK_SURFACE_", sub: "attack-surface" },
  awareness: { name: "Awareness", service: "awareness", prefix: "AWARENESS_", sub: "awareness" },
  runtime: { name: "Runtime", service: "runtime", prefix: "RUNTIME_", sub: "runtime" },
  "network-ids": { name: "Network IDS", service: "network-ids", prefix: "NETWORK_IDS_", sub: "network-ids" },
  "attack-simulation": { name: "Attack Simulation", service: "attack-simulation", prefix: "ATTACKSIM_", sub: "attack-simulation" },
  compliance: { name: "Compliance", service: "compliance", prefix: "COMPLIANCE_", sub: "compliance" },
  automation: { name: "Automation", service: "automation", prefix: "AUTOMATION_", sub: "automation" },
  metrics: { name: "Metrics", service: "metrics", prefix: "METRICS_", sub: "metrics", ingest: true },
  traces: { name: "Traces", service: "traces", prefix: "TRACES_", sub: "traces", ingest: true },
  profiling: { name: "Profiling", service: "profiling", prefix: "PROFILING_", sub: "profiling", ingest: true },
  waf: { name: "WAF", service: "waf", prefix: "WAF_", sub: "waf" },
  assistant: { name: "Assistant", service: "assistant", prefix: "ASSISTANT_", sub: "assistant" },
  analytics: {
    name: "Analytics",
    service: "analytics",
    prefix: "ANALYTICS_",
    sub: "analytics",
    config: true,
    extraEnv: ["      # The key a site's serverKey names, for events from its servers:", "      # ANALYTICS_SHOP_KEY: <a long random value>"],
  },
  consent: { name: "Consent", service: "consent", prefix: "CONSENT_", sub: "consent", config: true },
  audience: { name: "Audience", service: "audience", prefix: "AUDIENCE_", sub: "audience", config: true },
  messages: {
    name: "Messages",
    service: "messages",
    prefix: "MESSAGES_",
    sub: "messages",
    config: true,
    extraEnv: [
      "      # The keys config/messages/messages.yaml names, each from your provider or the linked product, such as:",
      "      # MESSAGES_SMTP_USER: <user>",
      "      # MESSAGES_SMTP_PASSWORD: <password>",
      "      # MESSAGES_CONSENT_TOKEN: <a Consent token>",
    ],
  },
  campaigns: {
    name: "Campaigns",
    service: "campaigns",
    prefix: "CAMPAIGNS_",
    sub: "campaigns",
    config: true,
    extraEnv: [
      "      # The secrets config/campaigns/campaigns.yaml names, such as a viewer token of each linked product:",
      "      # CAMPAIGNS_ANALYTICS_TOKEN: <an Analytics token>",
      "      # CAMPAIGNS_MESSAGES_TOKEN: <a Messages token>",
    ],
  },
  forms: {
    name: "Forms",
    service: "forms",
    prefix: "FORMS_",
    sub: "forms",
    config: true,
    extraEnv: [
      '      FORMS_TRUST_PROXY: "true"   # behind the TLS proxy: rate limits by the visitor\'s address',
      "      # The secrets config/forms/forms.yaml names, such as:",
      "      # FORMS_CRM_TOKEN: <a CRM token of the editor role>",
    ],
  },
  crm: { name: "CRM", service: "crm", prefix: "CRM_", sub: "crm", config: true },
  helpdesk: {
    name: "Helpdesk",
    service: "helpdesk",
    prefix: "HELPDESK_",
    sub: "helpdesk",
    config: true,
    extraEnv: [
      "      # The secrets config/helpdesk/helpdesk.yaml names, never written in the file itself:",
      "      HELPDESK_MAIL_PASSWORD: ${HELPDESK_MAIL_PASSWORD:-}",
      "      # HELPDESK_LIVE_CHAT_KEY: <what Live Chat sends>",
    ],
  },
  "live-chat": {
    name: "Live Chat",
    service: "live-chat",
    prefix: "LIVE_CHAT_",
    sub: "live-chat",
    config: true,
    extraEnv: [
      '      LIVE_CHAT_TRUST_PROXY: "true"   # behind the TLS proxy: rate limits by the visitor\'s address',
      "      LIVE_CHAT_HELPDESK_KEY: ${LIVE_CHAT_HELPDESK_KEY:-}   # the same as Helpdesk's HELPDESK_LIVE_CHAT_KEY",
    ],
  },
  "knowledge-base": { name: "Knowledge Base", service: "knowledge-base", prefix: "KNOWLEDGE_BASE_", sub: "help", config: true },
  mail: { name: "Mail", service: "mail", prefix: "MAIL_", sub: "mail", config: true, userRole: true },
  calendar: { name: "Calendar", service: "calendar", prefix: "CALENDAR_", sub: "calendar", config: true, userRole: true },
  files: { name: "Files", service: "files", prefix: "FILES_", sub: "files", config: true, userRole: true, needsIdentity: true },
  passwords: { name: "Passwords", service: "passwords", prefix: "PASSWORDS_", sub: "passwords", config: true, userRole: true, needsIdentity: true },
  wiki: { name: "Wiki", service: "wiki", prefix: "WIKI_", sub: "wiki", config: true },
  hr: { name: "HR", service: "hr", prefix: "HR_", sub: "hr", config: true },
  invoices: { name: "Invoices", service: "invoices", prefix: "INVOICES_", sub: "invoices", config: true },
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
/** An issuer as the products compare it: https, with no trailing slash; empty when nothing usable is left. */
export const cleanIssuer = (i: string) => {
  const t = i.trim().replace(/\/+$/, "");
  if (!t) return "";
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
};

/** A server's name as VPN and the folder take it: lower case letters, digits and dashes. */
export const cleanServerName = (n: string) =>
  n
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);

export const cleanDomain = (d: string) =>
  d
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, "")
    .replace(/[/:].*$/, "")
    .replace(/\.$/, "") || "example.com";

/** Logos the products show, in their own shape at a fixed height (ADR 0004). */
export const LOGO_TYPES = { "image/svg+xml": "svg", "image/png": "png", "image/webp": "webp" } as const;
export const LOGO_MAX_BYTES = 512 * 1024;
export const FAVICON_TYPES = { "image/svg+xml": "svg", "image/png": "png", "image/x-icon": "ico", "image/vnd.microsoft.icon": "ico" } as const;
export const FAVICON_MAX_BYTES = 128 * 1024;

/** One line of text, as the products show it; quotes would end the value in the env file. */
export const cleanOrganization = (o: string) =>
  o
    .replace(/[\u0000-\u001f\u007f']/g, "")
    .trim()
    .slice(0, 64);
export const cleanAccent = (a: string) => (/^#[0-9a-f]{6}$/i.test(a.trim()) ? a.trim().toLowerCase() : "");

/** The product file a container goes in (ADR 0054): a product's agents and servers go with it. */
export function productFileOf(service: string): string | undefined {
  const WITH: Record<string, string> = { stalwart: "mail", opencloud: "files", vaultwarden: "passwords" };
  if (WITH[service]) return WITH[service];
  const base = service.replace(/-(agent|server|server-tcp)$/, "");
  if (INSTALLABLE.some((id) => PARTS[id].service === base)) return base;
  if (service === "keycloak" || service === "postgres") return "keycloak";
  if (service === "host-web" || service === "host-db") return "demo";
  return undefined;
}
export function productFileTitle(file: string): string {
  const id = INSTALLABLE.find((i) => PARTS[i].service === file);
  return id ? `OpenAsy ${PARTS[id].name}` : file === "keycloak" ? "Keycloak and its database" : "Two demo servers for the agents to read";
}

/** One line of sign-in.env: the setting with what it does, commented out while it is not set. */
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

/** sign-in.env: how people sign in, the same in every product that loads it (ADR 0002). Each product's client is in `clients`. */
export function authFile(values: Record<string, string>, intro?: string, clients = "its file in products/", apply = "docker compose up -d"): string {
  return [
    "# How people sign in, the same in every product that loads this file (ADR 0002). Each product's own client, its",
    `# issuer, ID and secret, is in ${clients}.`,
    `# After a change: ${apply}`,
    ...(intro ? ["#", `# ${intro}`] : []),
    ...AUTH_SETTINGS.flatMap(([k, what, example]) => ["", `# ${what}`, k in values ? `${k}=${values[k]}` : `# ${k}=${example}`]),
  ].join("\n");
}

export function buildInstall(choice: InstallChoice, secrets: Secrets): Install {
  const d = cleanDomain(choice.domain);
  // Calendar runs on Mail's Stalwart, with Mail's mailboxes: it brings Mail along.
  const wanted: readonly string[] = choice.products.includes("calendar") ? [...choice.products, "mail"] : choice.products;
  const picked = INSTALLABLE.filter((id) => wanted.includes(id));
  const has = (id: Installable) => picked.includes(id);
  const caddy = choice.proxy === "caddy";
  const internal = caddy && choice.certificates === "internal";
  const viaIdentity = choice.signIn === "identity" && has("identity");
  const signIn: SignIn = choice.signIn === "identity" && !has("identity") ? "own" : choice.signIn;
  const keycloak = picked.length > 0 && (signIn === "keycloak" || (viaIdentity && choice.upstream === "keycloak"));
  const apps = picked.filter((id) => id !== "identity");
  const host = (id: Installable | "keycloak") => (id === "keycloak" ? `auth.${d}` : `${PARTS[id].sub}.${d}`);
  const url = (id: Installable | "keycloak") => `https://${host(id)}`;
  const tag = (id: Installable) => statusFor(id).version!;
  const env = (k: string, v: string) => `      ${k}: ${v}`;
  // VPN's servers: here on the panel's host, or each in a folder of its own for its host (ADR 0032).
  const apart = has("vpn") && choice.vpnLayout !== "one-host";
  const remote = (() => {
    if (!apart) return [];
    const given = choice.vpnServers.map((v) => ({ name: cleanServerName(v.name), address: v.address.trim() })).filter((v) => v.name);
    const list = given.length ? given : [{ name: "edge-1", address: "" }];
    const unique = list.filter((v, i) => list.findIndex((o) => o.name === v.name) === i);
    return (choice.vpnLayout === "edge" ? unique.slice(0, 1) : unique).map((v) => ({ name: v.name, address: cleanDomain(v.address || `${v.name}.${d}`) }));
  })();

  // How people sign in. What every product shares (the provider, roles, going straight to it) is in sign-in.env;
  // each product's own client (issuer, ID and secret) is in its own file (@openasy/auth 0.5.0, ADR 0054).
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
  // A client made after the first start: the issuer goes in its config file with it. Until both are there it is empty,
  // which leaves sign-in through it off (@openasy/auth), so the product starts with its own sign-in.
  const laterClient = (id: Installable) => {
    const P = PARTS[id].prefix;
    return [
      "      # Off until the issuer and the client are filled in: until then the product signs people in on its own",
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
          : signIn === "existing"
            ? sharedOf(choice.existing)
            : {};
  // Identity signs its own people in through another provider than the one the products use: its settings stay in
  // its environment, and it does not load sign-in.env.
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
  // The issuer of an Identity or Keycloak that runs elsewhere; an example until one is typed in.
  const issuer = cleanIssuer(choice.issuer) || (choice.existing === "keycloak" ? `https://auth.${d}/realms/openasy` : `https://id.${d}`);
  const existingName = choice.existing === "keycloak" ? "Keycloak" : "Identity";
  const oidc = (id: Installable): string[] => {
    if (signIn === "own") return [];
    if (ownAuthFile(id)) return choice.upstream === "none" ? [] : identityUpstream();
    return signIn === "keycloak" ? keycloakClient(id) : laterClient(id);
  };
  // Behind Caddy nothing but Caddy is published; with a proxy on the host, each product on its own local port.
  const portOf = (id: Installable | "keycloak") => (id === "keycloak" ? 8180 : 8081 + picked.indexOf(id));
  const proxyName = choice.proxy === "nginx" ? "nginx" : choice.proxy === "apache" ? "Apache" : "your TLS proxy";
  const ports = (i: number) => (caddy ? [] : ["    ports:", `      - "127.0.0.1:${8081 + i}:8080"   # ${proxyName} forwards here`]);
  // The servers and the endpoints in two files, mounted read-only in each product that reads them, and the only way
  // to give a product either (ADR 0052).
  const readers = picked.filter((id) => PARTS[id].hosts);
  const hostsFile = readers.length > 0;
  const endpointReaders = picked.filter((id) => PARTS[id].endpoints);
  const endpointsFile = endpointReaders.length > 0;
  // A folder, not the file: an editor that saves by replacing the file would leave the product with the old one.
  const inventoryMount = ["      - ./inventory:/config/inventory:ro   # your servers and endpoints, shared with the other products"];
  const hostsMount = hostsFile ? inventoryMount : [];
  const hostsEnv = hostsFile ? [env("OPENASY_HOSTS", "/config/inventory/hosts.yaml")] : [];
  const endpointsEnv = [env("OPENASY_ENDPOINTS", "/config/inventory/endpoints.yaml")];
  // With Caddy's own CA the products trust it, so they reach Identity's https issuer through Caddy like a browser does.
  const caMount = internal ? ["      - caddy-data:/caddy:ro   # Caddy's CA, to trust the other products' https names"] : [];
  const caEnv = internal ? [env("NODE_EXTRA_CA_CERTS", "/caddy/caddy/pki/authorities/local/root.crt")] : [];
  // The brand every product shows (ADR 0004) and how people sign in, each in a file of its own that every product loads.
  const envFiles = (id: Installable) => [
    `    env_file: [openasy.env${ownAuthFile(id) ? "" : ", sign-in.env"}]   # your brand${ownAuthFile(id) ? "" : " and sign-in"}, the same in every product`,
  ];
  const brandMount = choice.logo || choice.favicon ? ["      - ./brand:/config/brand:ro   # your logo and tab icon, in every product"] : [];
  const hardened = ["    read_only: true", "    cap_drop: [ALL]", '    security_opt: ["no-new-privileges:true"]'];
  // A product's own config folder: the folder, so an editor that saves by replacing the file still reaches it.
  const configMount = (id: Installable) => [`      - ./config/${PARTS[id].service}:/config:ro   # ${PARTS[id].service}.yaml, your settings for it`];
  // Names that are not a product's own page: Stalwart's CalDAV and CardDAV, OpenCloud's sync, the Bitwarden apps' server.
  const extraSites: Array<{ host: string; upstream: string; port: number }> = [];
  // Files and Passwords sign in through Identity, and so do OpenCloud and Vaultwarden behind them.
  const identityIssuer = signIn === "existing" && choice.existing === "openasy-identity" ? issuer : url("identity");
  const stalwartSetup = `docker compose exec -e "$(cat keys/stalwart.env)"${internal ? " -e STALWART_REQUEST_CERTIFICATE=false" : ""}`;

  const lines = [`# OpenAsy for ${d}, made at openasy.com/install`, "services:"];
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
          ...brandMount,
          ...caMount,
          ...kek,
          ...envFiles(id),
          "    environment:",
          env("IDENTITY_PUBLIC_URL", `${url(id)}   # the issuer: keep it fixed once applications use it`),
          ...caEnv,
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
          ...brandMount,
          ...caMount,
          ...kek,
          ...envFiles(id),
          "    environment:",
          env("VPN_PUBLIC_URL", url(id)),
          ...caEnv,
          env("VPN_PUBLIC_HOST", `${apart ? remote[0]!.address : host(id)}   # the name clients connect to`),
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
      if (!apart) add("vpn-server", server("vpn-server", "udp", 1194, "VPN_ENROLL_TOKEN"), ["vpn-server-data"]);
      // Caddy holds TCP 443, so the TCP server takes 8443 behind it.
      if (choice.vpnTcp && !apart) add("vpn-server-tcp", server("vpn-server-tcp", "tcp", caddy ? 8443 : 443, "VPN_TCP_ENROLL_TOKEN"), ["vpn-server-tcp-data"]);
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
          ...brandMount,
          ...caMount,
          ...kek,
          ...envFiles(id),
          "    environment:",
          env("INFRA_PUBLIC_URL", url(id)),
          ...caEnv,
          ...hostsEnv,
          // Each host's packages to Vulnerabilities, so the hosts Infrastructure reads need no vulns-agent (ADR 0031).
          ...(has("vulnerabilities") ? [env("INFRA_VULNS_URL", "http://vulns:8080"), env("INFRA_VULNS_TOKEN", "${VULNS_INGEST_TOKEN}")] : []),
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
          "      - ./keys/ssh:/keys:ro   # private keys a host names with keyFile, and BMC password files",
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
          ...brandMount,
          ...caMount,
          ...kek,
          ...envFiles(id),
          "    environment:",
          env("VULNS_PUBLIC_URL", url(id)),
          ...caEnv,
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
    if (!(REALM_PRODUCTS as readonly string[]).includes(id) && !(WITH_SERVER as readonly string[]).includes(id)) {
      const { service, prefix, ingest, hosts, endpoints, repositories, config, extraEnv, userRole } = PARTS[id];
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
          ...(config ? configMount(id) : []),
          ...(hosts || endpoints || repositories ? inventoryMount : []),
          ...brandMount,
          ...caMount,
          ...kek,
          ...envFiles(id),
          "    environment:",
          env(`${prefix}PUBLIC_URL`, url(id)),
          ...caEnv,
          ...(ingest ? [env(`${prefix}INGEST_TOKEN`, `\${${prefix}INGEST_TOKEN}   # for the scripts and CI jobs that send it data`)] : []),
          ...(hosts ? hostsEnv : []),
          ...(endpoints ? endpointsEnv : []),
          ...(repositories ? [env("OPENASY_REPOSITORIES", "/config/inventory/repositories.yaml")] : []),
          ...(config ? [env(`${prefix}CONFIG`, `/config/${service}.yaml`)] : []),
          ...(extraEnv ?? []),
          ...(userRole && signIn !== "own" ? [env("OPENASY_OIDC_DEFAULT_ROLE", "user   # everyone with an account signs in as a user")] : []),
          // Inside the network, as Prometheus scrapes them: no proxy in between, and no local CA VictoriaMetrics would not trust.
          ...(id === "metrics"
            ? [
                env(
                  "METRICS_SOURCES",
                  picked
                    .filter((o) => o !== "metrics")
                    .map((o) => `${o}=http://${PARTS[o].service}:8080/metrics`)
                    .join(","),
                ),
              ]
            : []),
          ...oidc(id),
        ],
        [`${service}-data`],
      );
    }
    if (id === "mail") {
      add(
        "stalwart",
        [
          `    image: ${THIRD_PARTY.stalwart}   # the mail server: every mailbox, calendar and address book`,
          "    restart: unless-stopped",
          "    ports:",
          '      - "25:25"   # mail from other servers',
          '      - "465:465"   # SMTP for mail apps, TLS',
          '      - "587:587"   # SMTP for mail apps, STARTTLS',
          '      - "993:993"   # IMAP for mail apps, TLS',
          '      - "127.0.0.1:8443:443"   # Stalwart\'s own admin, for its first setup only',
          ...(has("calendar") && !caddy ? ['      - "127.0.0.1:8190:8080"   # CalDAV and CardDAV, which your proxy serves at ' + `dav.${d}`] : []),
          "    volumes:",
          "      - stalwart-data:/opt/stalwart   # every mailbox: keep it in your backups",
          "    env_file: [keys/stalwart.env]   # STALWART_RECOVERY_ADMIN, Stalwart's own administrator",
        ],
        ["stalwart-data"],
      );
      if (has("calendar")) extraSites.push({ host: `dav.${d}`, upstream: "stalwart:8080", port: 8190 });
      add(
        "mail",
        [
          `    image: ghcr.io/openasy/mail:${tag(id)}`,
          "    restart: unless-stopped",
          "    depends_on: [stalwart]",
          ...hardened,
          "    tmpfs: [/tmp]",
          ...ports(i),
          "    volumes:",
          "      - mail-data:/data",
          ...configMount(id),
          ...brandMount,
          ...caMount,
          "    secrets: [openasy-kek, stalwart-password]   # its key, and the password of its account on Stalwart",
          ...envFiles(id),
          "    environment:",
          env("MAIL_PUBLIC_URL", url(id)),
          ...caEnv,
          env("MAIL_HOSTNAME", `mail.${d}   # the mail server's name, in your MX record`),
          env("MAIL_CONFIG", "/config/mail.yaml"),
          env("MAIL_STALWART_URL", "http://stalwart:8080"),
          env("MAIL_STALWART_USER", "openasy"),
          ...(signIn !== "own" ? [env("OPENASY_OIDC_DEFAULT_ROLE", "user   # everyone with a mailbox signs in as a user")] : []),
          ...oidc(id),
        ],
        ["mail-data"],
      );
    }
    if (id === "calendar")
      add(
        "calendar",
        [
          `    image: ghcr.io/openasy/calendar:${tag(id)}`,
          "    restart: unless-stopped",
          "    depends_on: [stalwart]",
          ...hardened,
          "    tmpfs: [/tmp]",
          ...ports(i),
          "    volumes:",
          "      - calendar-data:/data   # sign-in, syncs and subscription links; the calendars are in Stalwart",
          ...configMount(id),
          ...brandMount,
          ...caMount,
          "    secrets: [openasy-kek, calendar-stalwart-password]",
          ...envFiles(id),
          "    environment:",
          env("CALENDAR_PUBLIC_URL", url(id)),
          ...caEnv,
          env("CALENDAR_DAV_URL", `https://dav.${d}   # where calendar apps reach CalDAV and CardDAV`),
          env("CALENDAR_CONFIG", "/config/calendar.yaml"),
          env("CALENDAR_STALWART_URL", "http://stalwart:8080"),
          env("CALENDAR_STALWART_USER", "openasy-calendar"),
          ...(has("identity") || signIn === "existing"
            ? [
                "      # The company directory from Identity, with an API token of the viewer role in keys/identity-token:",
                `      # CALENDAR_IDENTITY_URL: ${identityIssuer}`,
              ]
            : []),
          ...(signIn !== "own" ? [env("OPENASY_OIDC_DEFAULT_ROLE", "user   # everyone with a mailbox signs in as a user")] : []),
          ...oidc(id),
        ],
        ["calendar-data"],
      );
    if (id === "files") {
      add(
        "opencloud",
        [
          `    image: ${THIRD_PARTY.opencloud}   # keeps the files and syncs them with its desktop and phone apps`,
          "    restart: unless-stopped",
          '    entrypoint: ["/bin/sh", "-c", "opencloud init || true; opencloud server"]   # the first start writes its own secrets',
          ...(caddy ? [] : ["    ports:", `      - "127.0.0.1:9200:9200"   # ${proxyName} serves it at cloud.${d}`]),
          "    volumes:",
          "      - opencloud-config:/etc/opencloud",
          "      - opencloud-data:/var/lib/opencloud   # every file: keep it in your backups",
          "      - opencloud-audit:/var/lib/opencloud-audit   # the audit log Files reads link openings from",
          "    environment:",
          env("OC_URL", `https://cloud.${d}`),
          env("PROXY_TLS", '"false"'),
          env("STORAGE_USERS_DRIVER", "posix"),
          env("OC_EXCLUDE_RUN_SERVICES", "idp   # people sign in through Identity"),
          env("OC_OIDC_ISSUER", identityIssuer),
          env("IDP_DOMAIN", identityIssuer.replace(/^https?:\/\//, "").replace(/\/.*$/, "")),
          env("PROXY_OIDC_REWRITE_WELLKNOWN", '"true"'),
          env("PROXY_OIDC_ACCESS_TOKEN_VERIFY_METHOD", "none"),
          env("PROXY_AUTOPROVISION_ACCOUNTS", '"true"'),
          env("PROXY_USER_OIDC_CLAIM", "email"),
          env("PROXY_USER_CS3_CLAIM", "username"),
          env("PROXY_AUTOPROVISION_CLAIM_USERNAME", "email"),
          env("PROXY_AUTOPROVISION_CLAIM_GROUPS", "groups"),
          env("GRAPH_USERNAME_MATCH", "none"),
          env("GRAPH_ASSIGN_DEFAULT_USER_ROLE", '"true"'),
          env("PROXY_ENABLE_APP_AUTH", '"true"'),
          env("AUTH_APP_ENABLE_IMPERSONATION", '"true"'),
          env("OC_ADD_RUN_SERVICES", "audit"),
          env("AUDIT_LOG_TO_FILE", '"true"'),
          env("AUDIT_LOG_TO_CONSOLE", '"false"'),
          env("AUDIT_FORMAT", "json"),
          env("AUDIT_FILEPATH", "/var/lib/opencloud-audit/audit.log"),
          env("OC_SHARING_PUBLIC_SHARE_MUST_HAVE_PASSWORD", '"true"'),
        ],
        ["opencloud-config", "opencloud-data", "opencloud-audit"],
      );
      extraSites.push({ host: `cloud.${d}`, upstream: "opencloud:9200", port: 9200 });
      add(
        "files",
        [
          `    image: ghcr.io/openasy/files:${tag(id)}`,
          "    restart: unless-stopped",
          "    depends_on: [opencloud]",
          ...hardened,
          "    tmpfs: [/tmp]",
          ...ports(i),
          "    volumes:",
          "      - files-data:/data   # sign-in, links and handovers; the files are in OpenCloud",
          ...configMount(id),
          "      - opencloud-audit:/audit:ro",
          ...brandMount,
          ...caMount,
          "    secrets: [openasy-kek, opencloud-token]   # its key, and the app token it signs in to OpenCloud with",
          ...envFiles(id),
          "    environment:",
          env("FILES_PUBLIC_URL", url(id)),
          ...caEnv,
          env("FILES_CONFIG", "/config/files.yaml"),
          env("FILES_OPENCLOUD_URL", "http://opencloud:9200"),
          env("FILES_OPENCLOUD_PUBLIC_URL", `https://cloud.${d}`),
          env("FILES_OPENCLOUD_USER", "admin"),
          env("FILES_AUDIT_LOG", "/audit/audit.log"),
          ...(signIn !== "own" ? [env("OPENASY_OIDC_DEFAULT_ROLE", "user   # everyone with files signs in as a user")] : []),
          ...oidc(id),
        ],
        ["files-data"],
      );
    }
    if (id === "passwords") {
      add(
        "vaultwarden",
        [
          `    image: ${THIRD_PARTY.vaultwarden}   # the password server the Bitwarden apps use`,
          "    restart: unless-stopped",
          ...(caddy ? [] : ["    ports:", `      - "127.0.0.1:8191:80"   # ${proxyName} serves it at vault.${d}`]),
          "    volumes:",
          "      - vaultwarden-data:/data   # every vault, encrypted: keep it in your backups",
          "    secrets: [vaultwarden-sso-secret]",
          "    environment:",
          env("DOMAIN", `https://vault.${d}`),
          env("SIGNUPS_ALLOWED", '"false"'),
          env("INVITATIONS_ALLOWED", '"true"'),
          env("ORG_CREATION_USERS", `admin@${d}   # who sets up the company's organization`),
          env("ORG_GROUPS_ENABLED", '"true"'),
          env("ORG_EVENTS_ENABLED", '"true"'),
          env("EVENTS_DAYS_RETAIN", '"400"'),
          env("SSO_ENABLED", '"true"'),
          env("SSO_ONLY", '"false"   # the master password still encrypts the vault'),
          env("SSO_SIGNUPS_MATCH_EMAIL", '"true"'),
          env("SSO_AUTHORITY", identityIssuer),
          env("SSO_CLIENT_ID", "vaultwarden"),
          env("SSO_CLIENT_SECRET_FILE", "/run/secrets/vaultwarden-sso-secret"),
          env("SSO_SCOPES", '"email profile"'),
          env("IP_HEADER", "X-Real-IP"),
          env("IP_HEADER_TRUSTED_PROXIES", "local"),
        ],
        ["vaultwarden-data"],
      );
      extraSites.push({ host: `vault.${d}`, upstream: "vaultwarden:80", port: 8191 });
      add(
        "passwords",
        [
          `    image: ghcr.io/openasy/passwords:${tag(id)}`,
          "    restart: unless-stopped",
          "    depends_on: [vaultwarden]",
          ...hardened,
          "    tmpfs: [/tmp]",
          ...ports(i),
          "    volumes:",
          "      - passwords-data:/data   # sign-in, syncs and the event log; never an item or a key",
          ...configMount(id),
          ...brandMount,
          ...caMount,
          "    secrets: [openasy-kek, vaultwarden-org-key, vaultwarden-service-key, identity-token]",
          ...envFiles(id),
          "    environment:",
          env("PASSWORDS_PUBLIC_URL", url(id)),
          ...caEnv,
          env("PASSWORDS_CONFIG", "/config/passwords.yaml"),
          env("PASSWORDS_VAULTWARDEN_URL", "http://vaultwarden:80"),
          env("PASSWORDS_VAULTWARDEN_PUBLIC_URL", `https://vault.${d}`),
          env("PASSWORDS_ORGANIZATION_ID", "${PASSWORDS_ORGANIZATION_ID:-}   # from Vaultwarden, after its first start"),
          env("PASSWORDS_SERVICE_CLIENT_ID", "${PASSWORDS_SERVICE_CLIENT_ID:-}   # the service account API key's client_id"),
          env("PASSWORDS_IDENTITY_URL", identityIssuer),
          ...(signIn !== "own" ? [env("OPENASY_OIDC_DEFAULT_ROLE", "user   # everyone with a vault signs in as a user")] : []),
          ...oidc(id),
        ],
        ["passwords-data"],
      );
    }
    if (id === "dast")
      add(
        "dast-agent",
        [
          `    image: ghcr.io/openasy/dast-agent:${tag(id)}   # runs ZAP and Nuclei, only against targets proven to be yours`,
          "    restart: unless-stopped",
          ...hardened,
          "    tmpfs: [/tmp:size=1g]   # ZAP's and Nuclei's home for one scan",
          "    mem_limit: 3g",
          "    volumes:",
          "      - dast-agent-data:/data   # its secret, sealed with its own key",
          "    secrets: [openasy-agent-kek]",
          "    environment:",
          env("DAST_URL", "http://dast:8080"),
          env("DAST_ENROLL_TOKEN", "${DAST_ENROLL_TOKEN:-}   # one-time, from Agents"),
          "    depends_on: [dast]",
        ],
        ["dast-agent-data"],
      );
    if (id === "malware")
      add(
        "malware-agent",
        [
          `    image: ghcr.io/openasy/malware-agent:${tag(id)}   # ClamAV and YARA over this host and the servers in the hosts file, read-only`,
          "    restart: unless-stopped",
          ...hardened,
          "    tmpfs: [/tmp:size=2g]   # one server's files at a time, deleted after its scan",
          "    hostname: ${HOSTNAME:-host}   # this host's name in malware",
          "    mem_limit: 2g",
          "    volumes:",
          "      - malware-agent-data:/data   # its SSH key, trusted host keys and ClamAV's signatures",
          "      - /:/host:ro   # this host, read-only",
          "      - ./keys/ssh:/keys:ro   # private keys a host names with keyFile",
          "    environment:",
          env("MALWARE_URL", "http://malware:8080"),
          env("MALWARE_INGEST_TOKEN", "${MALWARE_INGEST_TOKEN}"),
          "    depends_on: [malware]",
        ],
        ["malware-agent-data"],
      );
    if (id === "sast")
      add(
        "sast-agent",
        [
          `    image: ghcr.io/openasy/sast-agent:${tag(id)}   # clones and scans repositories from GitHub; sast holds no code`,
          "    restart: unless-stopped",
          ...hardened,
          '    tmpfs: ["/scan:exec,size=2g,uid=1000,gid=1000"]   # the clone of one repository, deleted after its scan, and Opengrep, which unpacks itself here to run',
          "    mem_limit: 3g",
          "    volumes:",
          "      - sast-agent-data:/data   # its secret, sealed with its own key",
          "    secrets: [openasy-agent-kek]",
          "    environment:",
          env("SAST_URL", "http://sast:8080"),
          env("SAST_ENROLL_TOKEN", "${SAST_ENROLL_TOKEN:-}   # one-time, from GitHub, Agents"),
          "    depends_on: [sast]",
        ],
        ["sast-agent-data"],
      );
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
          "      - ./keys/ssh:/keys:ro   # private keys a host names with keyFile",
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
    if (id === "siem")
      add(
        "siem-agent",
        [
          `    image: ghcr.io/openasy/siem-agent:${tag(id)}   # reads the security events of the journal over SSH; nothing is installed on hosts`,
          "    restart: unless-stopped",
          ...hardened,
          "    tmpfs: [/tmp]",
          "    volumes:",
          "      - siem-agent-data:/data   # its CA and keys, sealed with its own key",
          "      - ./keys/ssh:/keys:ro   # private keys a host names with keyFile",
          "    secrets:",
          "      - source: openasy-siem-agent-kek",
          "        target: openasy-agent-kek",
          "    environment:",
          env("SIEM_URL", "http://siem:8080"),
          env("SIEM_ENROLL_TOKEN", "${SIEM_ENROLL_TOKEN:-}   # one-time, from Agents"),
          "    depends_on: [siem]",
        ],
        ["siem-agent-data"],
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
  const sites = [
    ...fronted.map((id) => ({ host: host(id), upstream: `${id === "keycloak" ? "keycloak" : PARTS[id].service}:8080`, port: portOf(id) })),
    ...extraSites,
  ];
  const siteHosts = sites.map((x) => x.host);
  const withCaddy = caddy && fronted.length > 0;
  if (withCaddy)
    add(
      "caddy",
      [
        `    image: ${THIRD_PARTY.caddy}   # makes and renews the HTTPS certificates${internal ? " with its own CA" : ""}`,
        "    restart: unless-stopped",
        "    ports:",
        // Let's Encrypt checks a name over port 80; Caddy's own CA needs no such check.
        ...(internal ? [] : ['      - "80:80"']),
        '      - "443:443"',
        "    volumes:",
        "      - ./config/Caddyfile:/etc/caddy/Caddyfile:ro",
        "      - caddy-data:/data",
        ...(internal
          ? [
              "    networks:",
              "      default:",
              "        # Inside the network the same names reach Caddy, whatever this host's DNS says.",
              "        aliases:",
              ...siteHosts.map((h) => `          - ${h}`),
            ]
          : []),
      ],
      ["caddy-data"],
    );
  if (!picked.length) lines[1] = "services: {}   # pick a product to begin";
  if (volumes.length) lines.push("volumes:", ...volumes.map((v) => `  ${v}:`));
  if (picked.length)
    lines.push(
      "secrets:",
      "  openasy-kek:",
      "    file: ./keys/openasy-kek",
      ...(has("infrastructure") || has("sast") || has("dast") ? ["  openasy-agent-kek:", "    file: ./keys/openasy-agent-kek"] : []),
      ...(has("logs") ? ["  openasy-logs-agent-kek:", "    file: ./keys/openasy-logs-agent-kek"] : []),
      ...(has("siem") ? ["  openasy-siem-agent-kek:", "    file: ./keys/openasy-siem-agent-kek"] : []),
      ...(has("mail") ? ["  stalwart-password:", "    file: ./keys/stalwart-password"] : []),
      ...(has("calendar") ? ["  calendar-stalwart-password:", "    file: ./keys/calendar-stalwart-password"] : []),
      ...(has("files") ? ["  opencloud-token:", "    file: ./keys/opencloud-token"] : []),
      ...(has("passwords")
        ? [
            "  vaultwarden-sso-secret:",
            "    file: ./keys/vaultwarden-sso-secret",
            "  vaultwarden-org-key:",
            "    file: ./keys/vaultwarden-org-key",
            "  vaultwarden-service-key:",
            "    file: ./keys/vaultwarden-service-key",
            "  identity-token:",
            "    file: ./keys/identity-token",
          ]
        : []),
    );

  // The values compose.yaml names as ${NAME}: secrets made here, and what only exists after the first start, commented
  // out with an example. splitProducts writes each into the files of the products that use it (ADR 0054).
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
  if (signIn === "existing" && picked.length)
    block(
      `From your ${existingName}, once each is added there: remove the # and fill them in`,
      picked.flatMap((id) => later(id, issuer)),
    );
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
  if (has("passwords"))
    block("From Vaultwarden, once its organization and service account exist: remove the # and fill them in", [
      "# PASSWORDS_ORGANIZATION_ID=",
      "# PASSWORDS_SERVICE_CLIENT_ID=user.",
    ]);
  block("One-time tokens, after the first start", [
    ...(has("vpn") && !apart ? ["VPN_ENROLL_TOKEN="] : []),
    ...(has("vpn") && choice.vpnTcp && !apart ? ["VPN_TCP_ENROLL_TOKEN="] : []),
    ...(has("infrastructure") ? ["INFRA_ENROLL_TOKEN="] : []),
    ...(has("sast") ? ["SAST_ENROLL_TOKEN="] : []),
    ...(has("dast") ? ["DAST_ENROLL_TOKEN="] : []),
    ...(has("logs") ? ["LOGS_ENROLL_TOKEN="] : []),
    ...(has("siem") ? ["SIEM_ENROLL_TOKEN="] : []),
  ]);

  const names = (ids: readonly Installable[]) => ids.map((id) => PARTS[id].name).join(", ");
  const values: Record<string, string> = {};
  const examples: Record<string, string> = {};
  for (const l of e) {
    const m = /^(# )?([A-Z_][A-Z0-9_]*)=(.*)$/.exec(l);
    if (m) (m[1] ? examples : values)[m[2]!] = m[3]!;
  }
  // A product's own file also holds what its inventory entries name: SAST's forge tokens, DAST's logins.
  const extra: Record<string, string[]> = {};
  if (has("sast"))
    extra.sast = [
      "      # The tokens of the accounts inventory/repositories.yaml names (ADR 0052). GitHub: a fine-grained token with read",
      "      # access to Contents and Metadata, and read and write access to Pull requests and Commit statuses. GitLab: a",
      "      # token with the api scope, for a Developer or more.",
      "      # SAST_ACME_TOKEN: github_pat_...",
    ];
  if (has("dast"))
    extra.dast = ["      # The secrets the logins of DAST's targets name in inventory/endpoints.yaml (ADR 0052).", '      # DAST_SHOP_TOKEN: "Bearer ..."'];
  const split = splitProducts(lines.join("\n"), {
    productOf: productFileOf,
    title: productFileTitle,
    values,
    examples,
    apply: "docker compose up -d",
    extra,
  });
  const files: InstallFile[] = [{ name: "compose.yaml", content: split.compose }];
  if (picked.length) {
    // Single quotes: compose reads the value as it is, with no $ expansion.
    const org = cleanOrganization(choice.organization);
    const accent = cleanAccent(choice.accent);
    const line = (on: boolean, k: string, v: string) => `${on ? "" : "# "}${k}=${v}`;
    files.push({
      name: "openasy.env",
      content: [
        "# The brand every product shows, loaded by each of them (ADR 0004, 0054). After a change: docker compose up -d",
        "",
        "# Under each product's name, such as your company.",
        line(!!org, "OPENASY_ORGANIZATION", org ? `'${org}'` : "'Acme Corp'"),
        "# Buttons and links in your color.",
        line(!!accent, "OPENASY_ACCENT", accent || "#0a66c2"),
        "# Your logo, in its own shape: SVG, PNG or WebP, up to 512 KB, shown at a fixed height in place of the OpenAsy mark.",
        "# Files go in brand/, which every product mounts as /config/brand; an address is not read.",
        line(!!choice.logo, "OPENASY_LOGO", `/config/brand/${choice.logo ?? "logo.svg"}`),
        "# The browser tab's icon: a square SVG, PNG or ICO, up to 128 KB.",
        line(!!choice.favicon, "OPENASY_FAVICON", `/config/brand/${choice.favicon ?? "favicon.png"}`),
        "# Where people get help, in the help menu and on About: an email address or an https address. OpenAsy's own when unset.",
        "# OPENASY_SUPPORT=help@example.com",
        "",
        "# The products of this install: the product switcher, and where Metrics, Compliance, Automation and Assistant find them.",
        `OPENASY_PRODUCTS=${picked.map((id) => `${id}=${url(id)}`).join(",")}`,
      ].join("\n"),
    });
    files.push({
      name: "sign-in.env",
      content: authFile(
        shared,
        signIn === "own"
          ? "Each product signs people in on its own. To use a provider, set it here and give each product its client in its own files (openasy.com/sign-in)."
          : undefined,
      ),
    });
    for (const picture of [choice.logo, choice.favicon]) if (picture) files.push({ name: `brand/${picture}`, content: "", binary: true });
  }
  files.push(...split.files.map((f) => ({ name: f.name, content: f.content, secret: true })));
  if (picked.length) files.push({ name: "keys/openasy-kek", content: secrets.kek, secret: true });
  if (has("infrastructure") || has("sast") || has("dast")) files.push({ name: "keys/openasy-agent-kek", content: secrets.agentKek, secret: true });
  if (has("logs")) files.push({ name: "keys/openasy-logs-agent-kek", content: secrets.logsAgentKek, secret: true });
  if (has("siem")) files.push({ name: "keys/openasy-siem-agent-kek", content: secrets.siemAgentKek, secret: true });
  if (has("mail")) {
    files.push({ name: "keys/stalwart.env", content: `STALWART_RECOVERY_ADMIN=admin:${secrets.stalwartAdmin}`, secret: true });
    files.push({ name: "keys/stalwart-password", content: secrets.stalwartPassword, secret: true });
  }
  if (has("calendar")) files.push({ name: "keys/calendar-stalwart-password", content: secrets.calendarStalwartPassword, secret: true });
  // Made after the first start, as the steps say: empty until then.
  const emptyKey = (name: string) => files.push({ name: `keys/${name}`, content: "", secret: true });
  if (has("files")) emptyKey("opencloud-token");
  if (has("passwords")) ["vaultwarden-sso-secret", "vaultwarden-org-key", "vaultwarden-service-key", "identity-token"].forEach(emptyKey);
  for (const id of picked)
    if (PARTS[id].config && CONFIGS[id]) files.push({ name: `config/${PARTS[id].service}/${PARTS[id].service}.yaml`, content: CONFIGS[id].content });
  // Each server's folder, copied to its host: it reaches the panel over HTTPS and needs nothing open towards it.
  for (const v of remote) {
    const tcpPort = 443;
    const server = (service: string, proto: "udp" | "tcp", port: number, token: string) => [
      `  ${service}:`,
      `    image: ghcr.io/openasy/vpn-server:${tag("vpn")}   # always the same version as vpn`,
      "    restart: unless-stopped",
      "    cap_add: [NET_ADMIN]",
      "    devices: [/dev/net/tun]",
      "    sysctls:",
      "      net.ipv4.ip_forward: 1   # lets clients reach the networks behind this host",
      "    ports:",
      `      - "${port}:${port}/${proto}"`,
      "    volumes:",
      `      - ${service}-data:/var/lib/openasy-vpn   # its secret: without it, it must enrol again`,
      // With Caddy's own CA the server trusts its root, copied here from the panel's config/caddy-root.crt.
      ...(internal ? ["      - ./caddy-root.crt:/run/caddy-root.crt:ro   # the panel's CA, copied from its config/"] : []),
      "    environment:",
      env("VPN_URL", `${url("vpn")}   # the panel, over HTTPS`),
      ...(internal ? [env("NODE_EXTRA_CA_CERTS", "/run/caddy-root.crt")] : []),
      env("VPN_ENROLL_TOKEN", `${"$"}{${token}:-}   # one-time, from Servers in vpn`),
      env("OPENVPN_PROTO", proto),
      env("OPENVPN_PORT", `"${port}"`),
    ];
    files.push({
      name: `servers/${v.name}/compose.yaml`,
      content: [
        `# vpn-server ${v.name}, which clients reach at ${v.address}. Copy this folder to that host, put its one-time token in .env,`,
        "# then: docker compose up -d. It connects out to the panel over HTTPS; nothing needs to be open towards it.",
        "services:",
        ...server("vpn-server", "udp", 1194, "VPN_ENROLL_TOKEN"),
        ...(choice.vpnTcp ? server("vpn-server-tcp", "tcp", tcpPort, "VPN_TCP_ENROLL_TOKEN") : []),
        "volumes:",
        "  vpn-server-data:",
        ...(choice.vpnTcp ? ["  vpn-server-tcp-data:"] : []),
      ].join("\n"),
    });
    files.push({
      name: `servers/${v.name}/.env`,
      content: [
        `# ${v.name}'s one-time token${choice.vpnTcp ? "s" : ""}: in VPN, Servers, add ${v.name} with the address ${v.address}${choice.vpnTcp ? " twice, for UDP and for TCP" : ""}.`,
        "VPN_ENROLL_TOKEN=",
        ...(choice.vpnTcp ? ["VPN_TCP_ENROLL_TOKEN="] : []),
      ].join("\n"),
      secret: true,
    });
  }
  if (hostsFile)
    files.push({
      name: "inventory/hosts.yaml",
      content: [
        `# Your servers, read by ${readers.map((id) => PARTS[id].name).join(" and ")} (ADR 0052). A change is picked up within a minute.`,
        "# This file is the only place servers are added: no product has a form for them.",
        ...(readers.includes("infrastructure")
          ? ["# Infrastructure reads each one over SSH through infra-agent: prepare it first, as Setup in Infrastructure shows."]
          : []),
        ...(readers.includes("logs") ? ["# Logs reads their journal and container logs over SSH through logs-agent, prepared the same way."] : []),
        ...(readers.includes("siem") ? ["# SIEM reads the security events of their journal over SSH through siem-agent, prepared the same way."] : []),
        ...(readers.some((id) => id === "vulnerabilities" || id === "posture" || id === "malware")
          ? [`# ${names(readers.filter((id) => id === "vulnerabilities" || id === "posture" || id === "malware"))} list the ones they have no scan for.`]
          : []),
        "#",
        "# hosts:",
        "#   - name: web-1                # unique: how every product knows it",
        "#     address: 10.0.0.5",
        "#     port: 22                   # 22 when left out",
        "#     user: openasy              # openasy when left out",
        "#     auth: key                  # certificate when left out: the agent's own CA, as Setup shows",
        "#     keyFile: web-1.key         # with auth: key, a private key in keys/ssh; the agent's own key when left out",
        "#     hostKey: SHA256:...        # ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub: trusted without an admin when it matches;",
        "#                                # first: the first key it presents is trusted; left out: an admin accepts it",
        "#     tags: { env: prod }",
        ...(readers.includes("infrastructure")
          ? [
              "#",
              "# Their BMCs (iDRAC, iLO, XClarity), read by Infrastructure over Redfish with a ReadOnly account (ADR 0055).",
              "# bmcs:",
              "#   - name: web-1-idrac",
              "#     address: 10.0.9.5",
              "#     server: web-1              # its server above, whose page then links to it",
              "#     user: openasy              # openasy when left out",
              "#     passwordFile: web-1-bmc    # the password, in a file in keys/ssh; never in this file",
              "#     certificate: first         # AB:CD:... as openssl x509 -fingerprint -sha256 prints it; left out: an admin accepts it",
            ]
          : []),
        "hosts: []",
      ].join("\n"),
    });
  if (endpointsFile)
    files.push({
      name: "inventory/endpoints.yaml",
      content: [
        `# Your endpoints, read by ${names(endpointReaders)} (ADR 0052). A change is picked up within a minute.`,
        "# This file is the only place endpoints are added: no product has a form for them.",
        ...(endpointReaders.includes("uptime") ? ["# Uptime checks every entry, from the runners you start."] : []),
        ...(endpointReaders.includes("certificates") ? ["# Certificates reads the certificate of each https:// and tls:// entry on a public address."] : []),
        ...(endpointReaders.includes("dast")
          ? ["# DAST tests each entry with a dast block, once you prove the address is yours. A login's secret is in products/dast.yaml."]
          : []),
        "#",
        "# endpoints:",
        "#   - name: Shop                 # unique: how every product knows it",
        "#     url: https://shop.example.com   # or http://, tcp://host:port, dns://name, tls://host:port",
        "#     server: web-1              # the server it runs on, by its name in hosts.yaml",
        "#     group: Customer",
        "#     public: true               # on Uptime's status page",
        "#     every: 1m                  # how often Uptime checks it; 5m when left out",
        "#     expect: { status: 200 }",
        ...(endpointReaders.includes("dast")
          ? [
              "#     dast:                      # a DAST target",
              "#       schedule: weekly         # none, daily or weekly",
              "#       login: { kind: header, header: Authorization, secret: DAST_SHOP_TOKEN }",
            ]
          : []),
        "endpoints: []",
      ].join("\n"),
    });
  if (has("sast"))
    files.push({
      name: "inventory/repositories.yaml",
      content: [
        "# The GitHub organizations and GitLab groups SAST reads (ADR 0052). A change is picked up within a minute.",
        "# This file is the only place they are added: SAST has no form for them. A token is never here: token names the",
        "# variable that holds it, in products/sast.yaml.",
        "#",
        "# forges:",
        "#   - name: acme                 # unique: how SAST knows the entry",
        "#     forge: github              # or gitlab",
        "#     account: acme              # a GitHub organization or user, or a GitLab group path such as acme/platform",
        "#     url: https://gitlab.acme.com   # GitLab only, for a GitLab of your own",
        "#     token: SAST_ACME_TOKEN     # its value in products/sast.yaml",
        "# repositories:",
        "#   - name: acme/legacy",
        "#     scan: false                # listed, never scanned",
        "forges: []",
      ].join("\n"),
    });
  if (withCaddy)
    files.push({
      name: "config/Caddyfile",
      content: [
        // Certificates from Caddy's own CA; computers trust its root, which the steps copy to config/caddy-root.crt.
        ...(internal ? ["{\n  local_certs\n  skip_install_trust\n}"] : []),
        ...sites.map((x) => `${x.host} {\n  reverse_proxy ${x.upstream}\n}`),
      ].join("\n\n"),
    });
  // Plain HTTP sites that certbot then turns into HTTPS with a redirect. The scheme is passed on as it is, so after
  // certbot the products see https: Identity builds its issuer URLs from it.
  const onHost = (choice.proxy === "nginx" || choice.proxy === "apache") && fronted.length > 0;
  if (onHost && choice.proxy === "nginx")
    files.push({
      name: "config/openasy-nginx.conf",
      content: [
        `# OpenAsy for ${d}: copy to /etc/nginx/conf.d/openasy.conf, then run certbot --nginx (Steps).`,
        ...sites.map((x) =>
          [
            "server {",
            "    listen 80;",
            `    server_name ${x.host};`,
            "    client_max_body_size 50m;",
            "    location / {",
            `        proxy_pass http://127.0.0.1:${x.port};`,
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
        ...sites.map((x) =>
          [
            "<VirtualHost *:80>",
            `    ServerName ${x.host}`,
            "    ProxyPreserveHost On",
            `    ProxyPass / http://127.0.0.1:${x.port}/`,
            `    ProxyPassReverse / http://127.0.0.1:${x.port}/`,
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
      text: `On a host with Docker, unzip openasy.zip and work in its openasy folder: compose.yaml at the top, and each product in a file of its own in products/, with its containers, settings and secrets (ADR 0054). Keep products/ and keys/ with your backups: without them the products cannot open their secrets.`,
    });
    if (keycloak)
      steps.push({ text: "Fetch the Keycloak realm in which every product is already a client:", code: `curl -fsSL -o config/openasy-realm.json ${REALM}` });
    if (internal) {
      steps.push({
        text: "Give these names this host's address on your network, in your DNS or in the hosts file of each computer that opens them:",
        code: `<this host's address>  ${siteHosts.join(" ")}`,
      });
      // The products read the CA when they start, so it must exist first. They run as a non-root user: they may read
      // the root certificate, never the CA's keys.
      steps.push({
        text: "Start Caddy first, so its CA exists before the products start, let the products read its root certificate, and copy it out:",
        code: [
          "docker compose up -d caddy && sleep 5",
          `docker compose exec caddy sh -c "cd /data/caddy/pki/authorities/local && chmod o+x /data/caddy/pki /data/caddy/pki/authorities . && chmod o+r root.crt"`,
          "docker compose cp caddy:/data/caddy/pki/authorities/local/root.crt config/caddy-root.crt",
        ].join("\n"),
      });
    } else if (withCaddy || onHost)
      steps.push({ text: `Point ${siteHosts.join(", ")} at this host, so ${withCaddy ? "Caddy" : "certbot"} can get their certificates.` });
    // Agents that enrol with a one-time token start once they have it.
    const waiting = ["vpn-server", "vpn-server-tcp", "infra-agent", "sast-agent", "dast-agent", "logs-agent", "siem-agent", "calendar", "files", "passwords"];
    const first = services.filter((sv) => !waiting.includes(sv));
    steps.push({
      text: first.length < services.length ? "Start everything but the agents that wait for a token:" : "Start everything:",
      code: first.length < services.length ? `docker compose up -d ${first.join(" ")}` : "docker compose up -d",
    });
    if (internal)
      steps.push({
        text: "On each computer that opens the products, trust config/caddy-root.crt once. macOS, Windows and Linux, one line each. Firefox on macOS and Windows reads it once security.enterprise_roots.enabled is true in about:config:",
        code: [
          "security add-trusted-cert -r trustRoot -k ~/Library/Keychains/login.keychain-db caddy-root.crt",
          "certutil -addstore -user Root caddy-root.crt",
          "sudo cp caddy-root.crt /usr/local/share/ca-certificates/openasy.crt && sudo update-ca-certificates",
        ].join("\n"),
      });
    const certbot = `sudo certbot --${choice.proxy} ${sites.map((x) => `-d ${x.host}`).join(" ")}`;
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
        text: `Point your TLS proxy at the products: ${sites.map((x) => `${x.host} to 127.0.0.1:${x.port}`).join(", ")}. Pass on Host and X-Forwarded-Proto.`,
      });
    const configured = picked.filter((id) => PARTS[id].config);
    if (configured.length)
      steps.push({
        text: `Your settings for ${names(configured)} are in config/, each in a folder of its own, with the example from its release. Change ${configured.length > 1 ? "them" : "it"} to yours; a product picks up its file within a minute, or at: docker compose restart <name>`,
      });
    if (has("mail"))
      steps.push({
        text: `Stalwart's first start, done by Mail: it sets the name mail.${d} and the first domain of config/mail/mail.yaml${internal ? "" : ", asks Let's Encrypt for the certificate"}, then asks for one restart. Add the DNS records Mail shows for each domain afterwards.`,
        code: [
          `${stalwartSetup} mail node server/stalwart-setup.ts`,
          "docker compose restart stalwart",
          `${stalwartSetup} mail node server/stalwart-setup.ts`,
        ].join("\n"),
      });
    const early = picked.filter((id) => !waiting.includes(PARTS[id].service));
    if (early.length)
      steps.push({
        text: "Open each product's one-time link, which creates its owner account:",
        code: early.map((id) => `docker compose logs ${PARTS[id].service} | grep "no owner yet"`).join("\n"),
      });
    if (has("calendar"))
      steps.push({
        text: "Start Calendar, make its own account on Stalwart, and open its one-time link:",
        code: [
          "docker compose up -d calendar",
          `${stalwartSetup} calendar node server/stalwart-setup.ts`,
          'docker compose logs calendar | grep "no owner yet"',
        ].join("\n"),
      });
    if (has("files"))
      steps.push({
        text: `OpenCloud signs people in through Identity at ${identityIssuer}: add it there as Files' README says (Run). Make the app token Files signs in to OpenCloud with, put it in keys/opencloud-token, then start Files:`,
        code: [
          "docker compose exec opencloud opencloud auth-app create --user-name=admin --expiration=8760h",
          "docker compose up -d files",
          'docker compose logs files | grep "no owner yet"',
        ].join("\n"),
        note: `The steps in full: https://github.com/openasy/files/tree/v${tag("files")}#run`,
      });
    if (has("passwords"))
      steps.push({
        text: `In Identity at ${identityIssuer}, add Vaultwarden as an application and put its client secret in keys/vaultwarden-sso-secret. At https://vault.${d}, sign in as admin@${d} and make the company's organization and a service account; put their API keys in keys/vaultwarden-org-key and keys/vaultwarden-service-key, an Identity API token of the viewer role in keys/identity-token, and the organization ID and the service account's client_id in products/passwords.yaml. Then:`,
        code: ["docker compose restart vaultwarden", "docker compose up -d passwords", 'docker compose logs passwords | grep "no owner yet"'].join("\n"),
        note: `The steps in full: https://github.com/openasy/passwords/tree/v${tag("passwords")}#run`,
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
        text: `In Identity, Applications, add ${how}. Put the issuer, client ID and secret of each in its file in products/, then start them again:`,
        code: `docker compose up -d ${apps.map((id) => PARTS[id].service).join(" ")}`,
      });
    }
    if (unrealmed.length)
      steps.push({
        text: `In Keycloak, add ${names(unrealmed)} as clients of the openasy realm, with the redirect URI https://<its address>/api/v1/auth/oidc/sso/callback. Put each one's issuer, client ID and secret in its file in products/.`,
      });
    if (signIn === "existing") {
      const templated = choice.existing === "openasy-identity" ? picked.filter((id) => PARTS[id].template) : [];
      const plain = picked.filter((id) => !templated.includes(id));
      const how = [
        templated.length && `${names(templated)} from ${templated.length > 1 ? "their templates" : "its template"}`,
        plain.length &&
          `${names(plain)} as ${choice.existing === "keycloak" ? "clients of the realm" : "OpenID Connect applications"} with the redirect URI https://<its address>/api/v1/auth/oidc/sso/callback`,
      ]
        .filter(Boolean)
        .join(", and ");
      steps.push({
        text: `In your ${existingName} at ${issuer}, ${choice.existing === "keycloak" ? "Clients" : "Applications"}, add ${how}. Put the issuer, client ID and secret of each in its file in products/, then start them again:`,
        code: `docker compose up -d ${picked.map((id) => PARTS[id].service).join(" ")}`,
      });
    }
    if (provider)
      steps.push({
        text: `At ${PROVIDER_NAME[provider]}, register ${(signIn === "provider" ? picked : ["identity" as const]).map((id) => PARTS[id].name).join(", ")} with the redirect URIs from the sign-in guide, and fill in each one's file in products/.`,
      });
    if (apart) {
      steps.push({
        text: `In VPN, Servers, add ${remote.map((v) => `${v.name} at ${v.address}`).join(", ")}${choice.vpnTcp ? ", each twice, for UDP and for TCP" : ""}. Each gets a one-time token.`,
      });
      steps.push({
        text: `Copy ${remote.length > 1 ? "each folder in servers/ to its host" : `servers/${remote[0]!.name} to ${remote[0]!.address}`}${internal ? ", with config/caddy-root.crt next to its compose.yaml," : ""} put the token in its .env, and start it there. It reaches ${url("vpn")} over HTTPS:`,
        code: `cd ${remote.length > 1 ? "servers/<name>" : `servers/${remote[0]!.name}`} && docker compose up -d`,
      });
      if (remote.length > 1)
        steps.push({
          text: "Then add devices. Each device's file lists every server that has reported, so clients move to the next one when a server is down: start the servers first. Each server must reach the networks your IP groups allow.",
        });
    } else if (has("vpn"))
      steps.push({
        text: `In VPN, Servers, add ${host("vpn")}${choice.vpnTcp ? " twice, for UDP and for TCP" : ""}. Put the token in products/vpn.yaml, under vpn-server${choice.vpnTcp ? " and vpn-server-tcp" : ""}, then:`,
        code: `docker compose up -d vpn-server${choice.vpnTcp ? " vpn-server-tcp" : ""}`,
      });
    if (has("infrastructure"))
      steps.push({
        text: "In Infrastructure, Settings, Agents, make a token. Put it in products/infra.yaml, under infra-agent, then:",
        code: "docker compose up -d infra-agent",
      });
    if (has("sast"))
      steps.push({
        text: "In SAST, GitHub and GitLab, add an agent. Put its token in products/sast.yaml, under sast-agent, then:",
        code: "docker compose up -d sast-agent",
      });
    if (has("dast"))
      steps.push({
        text: "In DAST, Agents, add an agent. Put its token in products/dast.yaml, under dast-agent, then:",
        code: "docker compose up -d dast-agent",
      });
    if (has("malware"))
      steps.push({
        text: "malware-agent scans this host right away. For the servers in the hosts file, put the key it logs in ~openasy/.ssh/authorized_keys on each:",
        code: "docker compose logs malware-agent | grep authorizedKey",
      });
    if (has("logs"))
      steps.push({
        text: "In Logs, Settings, Agents, make a token. Put it in products/logs.yaml, under logs-agent, then:",
        code: "docker compose up -d logs-agent",
      });
    if (has("siem"))
      steps.push({ text: "In SIEM, Agents, make a token. Put it in products/siem.yaml, under siem-agent, then:", code: "docker compose up -d siem-agent" });
    if (hostsFile)
      steps.push({
        text: `List your servers in inventory/hosts.yaml. ${readers.map((id) => PARTS[id].name).join(" and ")} pick them up within a minute, with no restart.`,
      });
    if (has("sast"))
      steps.push({
        text: "List your GitHub organizations and GitLab groups in inventory/repositories.yaml, and each token in products/sast.yaml under the name the file gives it. SAST picks up the file within a minute; after a new token: docker compose up -d sast",
      });
    if (endpointsFile)
      steps.push({
        text: `List your endpoints in inventory/endpoints.yaml. ${names(endpointReaders)} pick them up within a minute, with no restart.${has("dast") ? " Put the secrets of DAST's logins in products/dast.yaml." : ""}`,
      });
  }

  const wiring: Wire[] = [];
  if (picked.length)
    wiring.push({ title: "One key seals them", text: `openasy-kek, made in your browser, seals the keys and sign-in secrets of ${names(picked)}.` });
  if (viaIdentity) {
    if (apps.length)
      wiring.push({
        title: `${names(apps)} sign${apps.length > 1 ? "" : "s"} in through Identity`,
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
    wiring.push({
      title: `${names(picked)} sign${picked.length > 1 ? "" : "s"} in through Keycloak`,
      text: "Each is already a client in the openasy realm, with its secret made here.",
    });
  else if (signIn === "existing" && picked.length)
    wiring.push({
      title: `${names(picked)} sign${picked.length > 1 ? "" : "s"} in through your ${existingName}`,
      text: `at ${issuer.replace(/^https?:\/\//, "")}. Until you add the client, each product signs people in on its own.`,
    });
  else if (signIn === "provider" && picked.length)
    wiring.push({
      title: `${names(picked)} sign${picked.length > 1 ? "" : "s"} in through ${PROVIDER_NAME[choice.provider]}`,
      text: "Register each product there, then fill in each one's config and secrets files.",
    });
  else if (picked.length)
    wiring.push({
      title: "Each product signs people in on its own",
      text: "with passwords, passkeys and authenticator apps. Add a provider later under Settings, Sign-in.",
    });
  if (apart)
    wiring.push({
      title: remote.length > 1 ? `${remote.length} servers, one per location` : "The server at the edge",
      text: `${remote.map((v) => v.address).join(", ")} reach${remote.length > 1 ? "" : "es"} the panel at ${host("vpn")} over HTTPS; the panel never connects to them. Clients connect on UDP 1194${choice.vpnTcp ? " or TCP 443" : ""}.`,
    });
  else if (has("vpn"))
    wiring.push({
      title: "vpn-server enrols with VPN",
      text: choice.vpnTcp
        ? `Clients connect on UDP 1194, or TCP ${caddy ? "8443, since Caddy holds 443," : "443"} where only HTTPS gets through.`
        : "Clients connect on UDP 1194.",
    });
  if (has("mail"))
    wiring.push({
      title: has("calendar") ? "Mail and Calendar share Stalwart" : "Mail runs on Stalwart",
      text: `the mail server, at mail.${d} for mail apps${has("calendar") ? `, and dav.${d} for calendar apps` : ""}. Its first start is done by Mail.`,
    });
  if (has("files"))
    wiring.push({ title: "Files runs on OpenCloud", text: `at cloud.${d}, for its desktop and phone apps, signing people in through Identity.` });
  if (has("passwords"))
    wiring.push({ title: "Passwords runs on Vaultwarden", text: `at vault.${d}, for the Bitwarden apps, signing people in through Identity.` });
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
  if (has("siem"))
    wiring.push({
      title: "siem-agent reads your hosts' security events",
      text: "logins, sudo and account changes from the journal, over SSH with its own CA and key. Shippers can send events to SIEM too.",
    });
  const fed = picked.filter((id) => id !== "vulnerabilities" && PARTS[id].ingest);
  if (fed.length)
    wiring.push({
      title: `${names(fed)} take${fed.length > 1 ? "" : "s"} data from CI and scripts`,
      text: "each with its own ingest token, made here and kept in its secrets file.",
    });
  if (picked.length) {
    const org = cleanOrganization(choice.organization);
    const parts = [
      org && `${org} under each product's name`,
      choice.logo && "your logo",
      choice.favicon && "your tab icon",
      cleanAccent(choice.accent) && "your color",
    ].filter(Boolean);
    wiring.push({
      title: "One brand",
      text: parts.length
        ? `in openasy.env: ${parts.join(", ")}, in every product.`
        : "in openasy.env, which every product loads. Set your name, logo and color there, now or later.",
    });
  }
  if (endpointsFile)
    wiring.push({
      title: "One list of endpoints",
      text:
        endpointReaders.length > 1
          ? `in endpoints.yaml, read by ${names(endpointReaders)}, so they agree on every endpoint.`
          : `in endpoints.yaml, read by ${PARTS[endpointReaders[0]!].name}. The other products that watch endpoints read the same file.`,
    });
  if (hostsFile)
    wiring.push({
      title: "One list of servers",
      text:
        readers.length > 1
          ? "in hosts.yaml: Infrastructure reads each one, and Vulnerabilities shows the ones that send no scan."
          : `in hosts.yaml, read by ${PARTS[readers[0]!].name}. Other products that work with servers can read the same file.`,
    });
  if (prometheus) wiring.push({ title: "Prometheus scrapes every product", text: "inside the compose network, on 127.0.0.1:9090. Nothing is exposed for it." });
  if (withCaddy) wiring.push({ title: "Caddy serves HTTPS", text: `for ${siteHosts.join(", ")}. The products are reached only through it.` });
  if (onHost)
    wiring.push({
      title: `${proxyName} on this host serves HTTPS`,
      text: `for ${siteHosts.join(", ")}, with certificates from certbot. The products listen on 127.0.0.1 only.`,
    });

  return { files, steps, wiring, addresses: siteHosts, hosts: withCaddy || onHost ? siteHosts : [], services };
}
