// The install builder (/install): one setup for several products that already know each other. Pure functions, so the
// page and the tests use the same output. No React or @openasy/ui imports here, like goals.ts.
// Each product's part matches the compose.yaml in its repository; versions come from status.ts.
import { statusFor } from "./status";

/** Products the builder can set up: released, with their part written here. */
export const INSTALLABLE = ["identity", "vpn", "infrastructure", "vulnerabilities"] as const;
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
};

/** Made in the reader's browser; the names are the .env variables or files they end up in. */
export interface Secrets {
  kek: string;
  agentKek: string;
  ingest: string;
  keycloakDb: string;
  keycloakAdmin: string;
  clients: Record<Installable, string>;
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
    ingest: hex(24),
    keycloakDb: hex(16),
    keycloakAdmin: hex(16),
    clients: { identity: hex(24), vpn: hex(24), infrastructure: hex(24), vulnerabilities: hex(24) },
  };
}

/** Images that are not ours, pinned like everything else (ADR 0027). Keycloak and PostgreSQL as in auth/examples/keycloak. */
export const THIRD_PARTY = {
  keycloak: "quay.io/keycloak/keycloak:26.8.1",
  postgres: "postgres:17.6",
  caddy: "caddy:2.10.2",
  prometheus: "prom/prometheus:v3.5.0",
};
const REALM = "https://raw.githubusercontent.com/openasy/auth/v0.4.0/examples/keycloak/openasy-realm.json";

interface Part {
  name: string;
  /** Compose service, also the host it is reached at inside the network. */
  service: string;
  /** Environment prefix of its settings, and of its sign-in client's keys in .env. */
  prefix: string;
  /** Its name under the reader's domain. */
  sub: string;
  /** Its client in the ready Keycloak realm, and the variable holding that client's secret. */
  client: string;
  realmVar: string;
}

const PARTS: Record<Installable, Part> = {
  identity: { name: "Identity", service: "identity", prefix: "IDENTITY_", sub: "id", client: "openasy-identity", realmVar: "IDENTITY" },
  vpn: { name: "VPN", service: "vpn", prefix: "VPN_", sub: "vpn", client: "openasy-vpn", realmVar: "VPN" },
  infrastructure: { name: "Infrastructure", service: "infra", prefix: "INFRA_", sub: "infra", client: "openasy-infrastructure", realmVar: "INFRA" },
  vulnerabilities: { name: "Vulnerabilities", service: "vulns", prefix: "VULNS_", sub: "vulns", client: "openasy-vulnerabilities", realmVar: "VULNS" },
};
const ROLES = "openasy-admins=admin,openasy-editors=editor,openasy-viewers=viewer";
const PROVIDER_NAME: Record<Provider, string> = { entra: "Microsoft Entra ID", okta: "Okta", google: "Google" };

export interface InstallFile {
  /** The file name to save it as. */
  name: string;
  content: string;
}
export interface InstallStep {
  text: string;
  code?: string;
}
export interface Wire {
  title: string;
  text: string;
}
export interface Install {
  files: InstallFile[];
  steps: InstallStep[];
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

  // How one product signs people in: through Identity, the ready Keycloak, the reader's provider, or on its own. The
  // variables have the same names in every product (@openasy/auth 0.5.0); only the client is each product's.
  const keycloakEnv = (id: Installable) => {
    const { client, realmVar } = PARTS[id];
    return [env("OPENASY_OIDC_PROVIDER", "keycloak"), env("OPENASY_OIDC_ISSUER", `${url("keycloak")}/realms/openasy`), env("OPENASY_OIDC_CLIENT_ID", client), env("OPENASY_OIDC_CLIENT_SECRET", `\${OPENASY_${realmVar}_SECRET}`), env("OPENASY_OIDC_ROLE_MAPPING", `"${ROLES}"`)];
  };
  // A client made after the first start: the issuer comes from .env with it. Until both are there the issuer is empty,
  // which leaves sign-in through it off (@openasy/auth), so the product starts with its own sign-in.
  const laterEnv = (id: Installable, provider: string, extra: string[]) => {
    const P = PARTS[id].prefix;
    return [
      "      # Off until .env has the issuer and the client: until then the product signs people in on its own",
      env("OPENASY_OIDC_PROVIDER", provider),
      env("OPENASY_OIDC_ISSUER", `\${${P}ISSUER:-}`),
      env("OPENASY_OIDC_CLIENT_ID", `\${${P}CLIENT_ID:-}`),
      env("OPENASY_OIDC_CLIENT_SECRET", `\${${P}CLIENT_SECRET:-}`),
      ...extra,
    ];
  };
  // Google sends no groups: people from the domain join with the default role.
  const providerEnv = (id: Installable, p: Provider) =>
    laterEnv(id, p, p === "google" ? [env("OPENASY_OIDC_ALLOWED_DOMAINS", d), env("OPENASY_OIDC_DEFAULT_ROLE", "viewer")] : [env("OPENASY_OIDC_ROLE_MAPPING", `"${ROLES}"`)]);
  // Through Identity the sign-in page goes straight there, so one sign-in opens every product.
  const identityEnv = (id: Installable) => laterEnv(id, "openasy-identity", [env("OPENASY_OIDC_ROLE_MAPPING", `"${ROLES}"`), env("OPENASY_OIDC_AUTO_REDIRECT", '"true"')]);
  const issuerOf = (p: Provider) => (p === "entra" ? "https://login.microsoftonline.com/<tenant id>/v2.0" : p === "okta" ? "https://<your org>.okta.com" : "https://accounts.google.com");
  // The three lines a client made later needs, commented out until it exists.
  const later = (id: Installable, issuer: string) => [`# ${PARTS[id].prefix}ISSUER=${issuer}`, `# ${PARTS[id].prefix}CLIENT_ID=`, `# ${PARTS[id].prefix}CLIENT_SECRET=`];
  const oidc = (id: Installable): string[] => {
    if (signIn === "own") return [];
    if (id === "identity" && signIn === "identity") return choice.upstream === "none" ? [] : choice.upstream === "keycloak" ? keycloakEnv(id) : providerEnv(id, choice.upstream);
    if (signIn === "identity") return identityEnv(id);
    return signIn === "keycloak" ? keycloakEnv(id) : providerEnv(id, choice.provider);
  };
  // Behind Caddy nothing but Caddy is published; with a proxy on the host, each product on its own local port.
  const portOf = (id: Installable | "keycloak") => (id === "keycloak" ? 8180 : 8081 + picked.indexOf(id));
  const proxyName = choice.proxy === "nginx" ? "nginx" : choice.proxy === "apache" ? "Apache" : "your TLS proxy";
  const ports = (i: number) => (caddy ? [] : ["    ports:", `      - "127.0.0.1:${8081 + i}:8080"   # ${proxyName} forwards here`]);
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
      add("identity", [`    image: ghcr.io/openasy/identity:${tag(id)}`, "    restart: unless-stopped", "    read_only: true", ...ports(i), "    volumes:", "      - identity-data:/data", ...kek, "    environment:", env("IDENTITY_PUBLIC_URL", `${url(id)}   # the issuer: keep it fixed once applications use it`), ...oidc(id)], ["identity-data"]);
    if (id === "vpn") {
      add("vpn", [`    image: ghcr.io/openasy/vpn:${tag(id)}`, "    restart: unless-stopped", ...ports(i), "    volumes:", "      - vpn-data:/data   # SQLite database, CA and settings", ...kek, "    environment:", env("VPN_PUBLIC_URL", url(id)), env("VPN_PUBLIC_HOST", `${host(id)}   # the name clients connect to`), ...oidc(id)], ["vpn-data"]);
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
      add("infra", [`    image: ghcr.io/openasy/infra:${tag(id)}`, "    restart: unless-stopped", ...hardened, "    tmpfs: [/tmp]", ...ports(i), "    volumes:", "      - infra-data:/data   # agents, hosts, clusters, collections and changes", ...kek, "    environment:", env("INFRA_PUBLIC_URL", url(id)), ...oidc(id)], ["infra-data"]);
      add(
        "infra-agent",
        [`    image: ghcr.io/openasy/infra-agent:${tag(id)}   # reads hosts over SSH; nothing is installed on them`, "    restart: unless-stopped", ...hardened, "    tmpfs: [/tmp]", "    volumes:", "      - infra-agent-data:/data   # its CA and keys, sealed with its own key", "    secrets: [openasy-agent-kek]", "    environment:", env("INFRA_URL", "http://infra:8080"), env("INFRA_ENROLL_TOKEN", "${INFRA_ENROLL_TOKEN:-}   # one-time, from Settings, Agents"), "    depends_on: [infra]"],
        ["infra-agent-data"],
      );
    }
    if (id === "vulnerabilities") {
      add("vulns", [`    image: ghcr.io/openasy/vulns:${tag(id)}`, "    restart: unless-stopped", ...hardened, ...ports(i), "    volumes:", "      - vulns-data:/data   # SQLite, SBOMs and the vulnerability data (3 GB)", ...kek, "    environment:", env("VULNS_PUBLIC_URL", url(id)), env("VULNS_INGEST_TOKEN", "${VULNS_INGEST_TOKEN}"), ...oidc(id)], ["vulns-data"]);
      if (choice.vulnsHost)
        add("vulns-agent", [`    image: ghcr.io/openasy/vulns-agent:${tag(id)}`, "    restart: unless-stopped", ...hardened, "    tmpfs: [/tmp]", "    hostname: ${HOSTNAME:-host}   # the name this host gets in vulns", "    volumes:", "      - /:/host:ro   # read-only: it lists packages, it never changes the host", "    environment:", env("VULNS_URL", "http://vulns:8080"), env("VULNS_INGEST_TOKEN", "${VULNS_INGEST_TOKEN}"), "    depends_on: [vulns]"]);
    }
  });

  if (keycloak) {
    // The realm names every product's client, so each gets its address and secret, run here or not.
    const realm = INSTALLABLE.flatMap((id) => [env(`OPENASY_${PARTS[id].realmVar}_URL`, url(id)), env(`OPENASY_${PARTS[id].realmVar}_SECRET`, `\${OPENASY_${PARTS[id].realmVar}_SECRET}`)]);
    add(
      "keycloak",
      [
        `    image: ${THIRD_PARTY.keycloak}`,
        "    restart: unless-stopped",
        "    command: start --import-realm",
        ...(caddy ? [] : ["    ports:", `      - "127.0.0.1:8180:8080"   # ${proxyName} forwards here`]),
        "    volumes:",
        "      - ./openasy-realm.json:/opt/keycloak/data/import/openasy-realm.json:ro",
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
      ],
    );
    add("postgres", [`    image: ${THIRD_PARTY.postgres}`, "    restart: unless-stopped", "    volumes:", "      - keycloak-db:/var/lib/postgresql/data", "    environment:", env("POSTGRES_DB", "keycloak"), env("POSTGRES_USER", "keycloak"), env("POSTGRES_PASSWORD", "${KEYCLOAK_DB_PASSWORD}")], ["keycloak-db"]);
  }
  const prometheus = choice.prometheus && picked.length > 0;
  if (prometheus) add("prometheus", [`    image: ${THIRD_PARTY.prometheus}`, "    restart: unless-stopped", "    ports:", '      - "127.0.0.1:9090:9090"', "    volumes:", "      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro", "      - prometheus-data:/prometheus"], ["prometheus-data"]);
  const fronted: Array<Installable | "keycloak"> = [...picked, ...(keycloak ? (["keycloak"] as const) : [])];
  const withCaddy = caddy && fronted.length > 0;
  if (withCaddy) add("caddy", [`    image: ${THIRD_PARTY.caddy}   # makes and renews the HTTPS certificates`, "    restart: unless-stopped", "    ports:", '      - "80:80"', '      - "443:443"', "    volumes:", "      - ./Caddyfile:/etc/caddy/Caddyfile:ro", "      - caddy-data:/data"], ["caddy-data"]);
  if (!picked.length) lines[1] = "services: {}   # pick a product to begin";
  if (volumes.length) lines.push("volumes:", ...volumes.map((v) => `  ${v}:`));
  if (picked.length) lines.push("secrets:", "  openasy-kek:", "    file: ./openasy-kek", ...(has("infrastructure") ? ["  openasy-agent-kek:", "    file: ./openasy-agent-kek"] : []));

  // .env: what the compose file reads. Secrets made here are filled in; what only exists after the first start is left empty.
  const e = ["# Keep this file with your backups and out of git."];
  const block = (title: string, rows: string[]) => rows.length && e.push("", `# ${title}`, ...rows);
  if (has("vulnerabilities")) block("Vulnerabilities and its agents", [`VULNS_INGEST_TOKEN=${secrets.ingest}`]);
  if (viaIdentity) block("From Identity, Applications, after the first start: remove the # and fill them in", apps.flatMap((id) => later(id, url("identity"))));
  if (keycloak) block("Keycloak", [`KEYCLOAK_DB_PASSWORD=${secrets.keycloakDb}`, `KEYCLOAK_ADMIN_PASSWORD=${secrets.keycloakAdmin}`, ...INSTALLABLE.map((id) => `OPENASY_${PARTS[id].realmVar}_SECRET=${secrets.clients[id]}`)]);
  const provider = signIn === "provider" ? choice.provider : viaIdentity && choice.upstream !== "none" && choice.upstream !== "keycloak" ? choice.upstream : undefined;
  if (provider && picked.length) {
    const who = signIn === "provider" ? picked : (["identity"] as Installable[]);
    block(`From ${PROVIDER_NAME[provider]}, once each is registered there: remove the # and fill them in`, who.flatMap((id) => later(id, issuerOf(provider))));
  }
  block("One-time tokens, after the first start", [...(has("vpn") ? ["VPN_ENROLL_TOKEN="] : []), ...(has("vpn") && choice.vpnTcp ? ["VPN_TCP_ENROLL_TOKEN="] : []), ...(has("infrastructure") ? ["INFRA_ENROLL_TOKEN="] : [])]);

  const files: InstallFile[] = [{ name: "compose.yaml", content: lines.join("\n") }, { name: ".env", content: e.join("\n") }];
  if (picked.length) files.push({ name: "openasy-kek", content: secrets.kek });
  if (has("infrastructure")) files.push({ name: "openasy-agent-kek", content: secrets.agentKek });
  if (withCaddy) files.push({ name: "Caddyfile", content: fronted.map((id) => `${host(id)} {\n  reverse_proxy ${id === "keycloak" ? "keycloak" : PARTS[id].service}:8080\n}`).join("\n\n") });
  // Plain HTTP sites that certbot then turns into HTTPS with a redirect. The scheme is passed on as it is, so after
  // certbot the products see https: Identity builds its issuer URLs from it.
  const onHost = (choice.proxy === "nginx" || choice.proxy === "apache") && fronted.length > 0;
  if (onHost && choice.proxy === "nginx")
    files.push({
      name: "openasy-nginx.conf",
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
      name: "openasy-apache.conf",
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
  if (prometheus) files.push({ name: "prometheus.yml", content: ["global:", "  scrape_interval: 30s", "scrape_configs:", ...picked.map((id) => `  - job_name: ${PARTS[id].service}\n    static_configs:\n      - targets: ["${PARTS[id].service}:8080"]`)].join("\n") });

  const steps: InstallStep[] = [];
  if (picked.length) {
    steps.push({ text: `On a host with Docker, unzip openasy.zip and work in its openasy folder, or save ${files.map((f) => f.name).join(", ")} in one folder yourself. Keep openasy-kek${has("infrastructure") ? " and openasy-agent-kek" : ""} with your backups: without them the products cannot open their secrets.` });
    if (keycloak) steps.push({ text: "Fetch the Keycloak realm in which every product is already a client:", code: `curl -fsSLO ${REALM}` });
    if (withCaddy || onHost) steps.push({ text: `Point ${fronted.map(host).join(", ")} at this host, so ${withCaddy ? "Caddy" : "certbot"} can get their certificates.` });
    // Agents that enrol with a one-time token start once they have it.
    const waiting = ["vpn-server", "vpn-server-tcp", "infra-agent"];
    const first = services.filter((sv) => !waiting.includes(sv));
    steps.push({ text: first.length < services.length ? "Start everything but the agents that wait for a token:" : "Start everything:", code: first.length < services.length ? `docker compose up -d ${first.join(" ")}` : "docker compose up -d" });
    const certbot = `sudo certbot --${choice.proxy} ${fronted.map((id) => `-d ${host(id)}`).join(" ")}`;
    if (onHost && choice.proxy === "nginx") steps.push({ text: "Give nginx the sites, then let certbot add HTTPS and the redirect from HTTP:", code: `sudo cp openasy-nginx.conf /etc/nginx/conf.d/openasy.conf\nsudo nginx -t && sudo systemctl reload nginx\n${certbot}` });
    if (onHost && choice.proxy === "apache") steps.push({ text: "Give Apache the sites, then let certbot add HTTPS and the redirect from HTTP:", code: `sudo a2enmod proxy proxy_http headers\nsudo cp openasy-apache.conf /etc/apache2/sites-available/openasy.conf\nsudo a2ensite openasy && sudo apachectl configtest && sudo systemctl reload apache2\n${certbot}` });
    if (choice.proxy === "own" && fronted.length) steps.push({ text: `Point your TLS proxy at the products: ${fronted.map((id) => `${host(id)} to 127.0.0.1:${portOf(id)}`).join(", ")}. Pass on Host and X-Forwarded-Proto.` });
    steps.push({ text: "Open each product's one-time link, which creates its owner account:", code: picked.map((id) => `docker compose logs ${PARTS[id].service} | grep "no owner yet"`).join("\n") });
    if (keycloak) steps.push({ text: `In Keycloak, at ${url("keycloak")}/admin, add people and put them in openasy-admins, openasy-editors or openasy-viewers.` });
    if (viaIdentity && apps.length) steps.push({ text: `In Identity, Applications, add ${apps.map((id) => PARTS[id].name).join(", ")} from their templates. Put the issuer, client ID and secret of each in .env, then start them again:`, code: `docker compose up -d ${apps.map((id) => PARTS[id].service).join(" ")}` });
    if (provider) steps.push({ text: `At ${PROVIDER_NAME[provider]}, register ${(signIn === "provider" ? picked : ["identity" as const]).map((id) => PARTS[id].name).join(", ")} with the redirect URIs from the sign-in guide, and fill in .env.` });
    if (has("vpn")) steps.push({ text: `In VPN, Servers, add ${host("vpn")}${choice.vpnTcp ? " twice, for UDP and for TCP" : ""}. Put the token in .env, then:`, code: `docker compose up -d vpn-server${choice.vpnTcp ? " vpn-server-tcp" : ""}` });
    if (has("infrastructure")) steps.push({ text: "In Infrastructure, Settings, Agents, make a token. Put it in INFRA_ENROLL_TOKEN, then:", code: "docker compose up -d infra-agent" });
  }

  const names = (ids: readonly Installable[]) => ids.map((id) => PARTS[id].name).join(", ");
  const wiring: Wire[] = [];
  if (picked.length) wiring.push({ title: "One key seals them", text: `openasy-kek, made in your browser, seals the keys and sign-in secrets of ${names(picked)}.` });
  if (viaIdentity) {
    if (apps.length) wiring.push({ title: `${names(apps)} sign in through Identity`, text: `People sign in once at ${host("identity")}, and their groups decide their role: openasy-admins become admins. Until you add the clients, each product signs people in on its own.` });
    wiring.push({ title: "Identity's people", text: choice.upstream === "none" ? "are kept in Identity, with passwords, passkeys and second factors." : choice.upstream === "keycloak" ? `come from Keycloak at ${host("keycloak")}, with its groups.` : choice.upstream === "google" ? `come from Google, for ${d} only.` : `come from ${PROVIDER_NAME[choice.upstream]}, with its groups.` });
  } else if (signIn === "keycloak" && picked.length) wiring.push({ title: `${names(picked)} sign in through Keycloak`, text: "Each is already a client in the openasy realm, with its secret made here." });
  else if (signIn === "provider" && picked.length) wiring.push({ title: `${names(picked)} sign in through ${PROVIDER_NAME[choice.provider]}`, text: "Register each product there, then fill in .env." });
  else if (picked.length) wiring.push({ title: "Each product signs people in on its own", text: "with passwords, passkeys and authenticator apps. Add a provider later under Settings, Sign-in." });
  if (has("vpn")) wiring.push({ title: "vpn-server enrols with VPN", text: choice.vpnTcp ? `Clients connect on UDP 1194, or TCP ${caddy ? "8443, since Caddy holds 443," : "443"} where only HTTPS gets through.` : "Clients connect on UDP 1194." });
  if (has("infrastructure")) wiring.push({ title: "infra-agent reads your hosts", text: "over SSH with 5-minute certificates from its own CA. Nothing is installed on them." });
  if (has("vulnerabilities")) wiring.push({ title: "Vulnerabilities", text: choice.vulnsHost ? "vulns-agent reports this host with the ingest token made here." : "waits for agents on your hosts, with the ingest token made here." });
  if (prometheus) wiring.push({ title: "Prometheus scrapes every product", text: "inside the compose network, on 127.0.0.1:9090. Nothing is exposed for it." });
  if (withCaddy) wiring.push({ title: "Caddy serves HTTPS", text: `for ${fronted.map(host).join(", ")}. The products are reached only through it.` });
  if (onHost) wiring.push({ title: `${proxyName} on this host serves HTTPS`, text: `for ${fronted.map(host).join(", ")}, with certificates from certbot. The products listen on 127.0.0.1 only.` });

  return { files, steps, wiring, addresses: fronted.map(host), hosts: withCaddy || onHost ? fronted.map(host) : [], services };
}
