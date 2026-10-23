import { describe, expect, it } from "vitest";
import {
  DEFAULT_CHOICE,
  INSTALLABLE,
  PARTS,
  REALM_PRODUCTS,
  THIRD_PARTY,
  buildInstall,
  cleanDomain,
  makeSecrets,
  type InstallChoice,
  type Installable,
} from "./data/install";
import { statusFor } from "./data/status";
import { DEV_IMAGES, buildDevKit } from "./data/devkit";
import SETUP from "../kit/dev/setup.ts?raw";
import SEED from "../kit/dev/seed.ts?raw";

// Counting bytes, so every secret is different and recognisable.
let n = 0;
const secrets = makeSecrets((b) => b.forEach((_, i) => (b[i] = n++ % 256)));
const build = (patch: Partial<InstallChoice> = {}) => buildInstall({ ...DEFAULT_CHOICE, ...patch }, secrets);
const file = (out: ReturnType<typeof build>, name: string) => out.files.find((f) => f.name === name)?.content ?? "";
/** One service of compose.yaml, from its name to the next service. */
const service = (compose: string, name: string) => compose.split(/\n(?= {2}[a-z-]+:\n)/).find((b) => b.startsWith(`  ${name}:`)) ?? "";

describe("install builder", () => {
  it("only offers released products, at their released version", () => {
    for (const id of INSTALLABLE) expect(statusFor(id).status).toBe("Preview");
    const out = build({ products: [...INSTALLABLE], signIn: "own" });
    for (const [image, id] of [
      ["identity", "identity"],
      ["vpn", "vpn"],
      ["vpn-server", "vpn"],
      ["infra", "infrastructure"],
      ["infra-agent", "infrastructure"],
      ["vulns", "vulnerabilities"],
      ["vulns-agent", "vulnerabilities"],
    ] as const)
      expect(file(out, "compose.yaml")).toContain(`image: ghcr.io/openasy/${image}:${statusFor(id).version}`);
  });

  it("VPN signs in through Identity, behind Caddy, by default", () => {
    const out = build();
    const compose = file(out, "compose.yaml");
    expect(compose).toContain("IDENTITY_PUBLIC_URL: https://id.example.com");
    const vpn = service(compose, "vpn");
    // What every product shares is in config/auth.env; only the client is in each product's environment.
    expect(vpn).toContain("env_file: [config/brand.env, config/auth.env]");
    const auth = file(out, "config/auth.env");
    expect(auth).toMatch(/^OPENASY_OIDC_PROVIDER=openasy-identity$/m);
    // The issuer waits in .env with the client, so VPN starts before Identity has made it.
    expect(vpn).toContain("OPENASY_OIDC_ISSUER: ${VPN_ISSUER:-}");
    expect(vpn).toContain("OPENASY_OIDC_CLIENT_ID: ${VPN_CLIENT_ID:-}");
    expect(file(out, ".env")).toContain("# VPN_ISSUER=https://id.example.com");
    expect(auth).toMatch(/^OPENASY_OIDC_ROLE_MAPPING=openasy-admins=admin,/m);
    // Through Identity, the sign-in page goes straight there. Settings not used are listed to change later.
    expect(auth).toMatch(/^OPENASY_OIDC_AUTO_REDIRECT=true$/m);
    expect(auth).toMatch(/^# OPENASY_OIDC_ALLOWED_DOMAINS=/m);
    // Identity keeps its own people: it signs in through nobody, and does not load auth.env.
    expect(service(compose, "identity")).toContain("IDENTITY_PUBLIC_URL");
    expect(service(compose, "identity")).not.toContain("OIDC_");
    expect(service(compose, "identity")).toContain("env_file: [config/brand.env]");
    // Only Caddy is published, besides VPN's own port.
    expect(compose).not.toMatch(/127\.0\.0\.1:808\d/);
    expect(compose).toContain('"443:443"');
    expect(file(out, "config/Caddyfile")).toBe("id.example.com {\n  reverse_proxy identity:8080\n}\n\nvpn.example.com {\n  reverse_proxy vpn:8080\n}");
    expect(file(out, "config/prometheus.yml")).toContain('targets: ["vpn:8080"]');
    expect(file(out, ".env")).toContain("# VPN_CLIENT_SECRET=");
    // vpn-server waits for its token.
    expect(out.steps.find((s) => s.code?.startsWith("docker compose up -d "))?.code).toBe("docker compose up -d identity vpn prometheus caddy");
    expect(file(out, "secrets/openasy-kek")).toBe(secrets.kek);
    expect(secrets.kek).toMatch(/^[0-9a-f]{64}$/);
    expect(out.steps.map((s) => s.text).join("\n")).toContain("In Identity, Applications, add VPN");
    expect(out.hosts).toEqual(["id.example.com", "vpn.example.com"]);
  });

  it("every other released product is one hardened container with its own address, key and ingest token", () => {
    const out = build({ products: [...INSTALLABLE], signIn: "own" });
    const compose = file(out, "compose.yaml");
    const env = file(out, ".env");
    for (const id of INSTALLABLE.filter((id) => !(REALM_PRODUCTS as readonly string[]).includes(id))) {
      const { service: name, prefix, ingest, hosts } = PARTS[id];
      const svc = service(compose, name);
      expect(svc).toContain(`image: ghcr.io/openasy/${name}:${statusFor(id).version}`);
      expect(svc).toContain("read_only: true");
      expect(svc).toContain(`${prefix}PUBLIC_URL: https://${PARTS[id].sub}.example.com`);
      expect(svc).toContain("env_file: [config/brand.env, config/auth.env]");
      if (ingest) expect(env).toMatch(new RegExp(`^${prefix}INGEST_TOKEN=[0-9a-f]{48}$`, "m"));
      else expect(svc).not.toContain("INGEST_TOKEN");
      expect(svc.includes("OPENASY_HOSTS")).toBe(!!hosts);
    }
    // Logs reads hosts with its own agent and its own key, apart from Infrastructure's.
    expect(service(compose, "logs-agent")).toContain("source: openasy-logs-agent-kek");
    expect(file(out, "secrets/openasy-logs-agent-kek")).toBe(secrets.logsAgentKek);
    expect(out.steps.some((s) => s.code === "docker compose up -d logs-agent")).toBe(true);
    expect(file(out, "config/prometheus.yml")).toContain('targets: ["supply-chain:8080"]');
  });

  it("through Identity, products without a template are added as OpenID Connect applications", () => {
    const text = build({ products: ["identity", "vpn", "siem"] })
      .steps.map((s) => s.text)
      .join("\n");
    expect(text).toContain("add VPN from its template, and SIEM as OpenID Connect applications");
  });

  it("Infrastructure and Vulnerabilities read one hosts.yaml, mounted read-only, unless it is turned off", () => {
    const out = build({ products: ["infrastructure", "vulnerabilities"], signIn: "own" });
    const compose = file(out, "compose.yaml");
    for (const name of ["infra", "vulns"]) {
      // The folder, so a file saved by replacing it still reaches the product.
      expect(service(compose, name)).toContain("- ./config/inventory:/config/inventory:ro");
      expect(service(compose, name)).toContain("OPENASY_HOSTS: /config/inventory/hosts.yaml");
    }
    expect(service(compose, "infra-agent")).not.toContain("hosts.yaml");
    expect(file(out, "config/inventory/hosts.yaml")).toMatch(/^# Your servers, read by Infrastructure and Vulnerabilities[\s\S]*\nhosts: \[\]$/);
    expect(out.wiring.map((w) => w.title)).toContain("One list of servers");
    const off = build({ products: ["infrastructure", "vulnerabilities"], signIn: "own", hostsFile: false });
    expect(file(off, "compose.yaml")).not.toContain("hosts.yaml");
    expect(off.files.map((f) => f.name)).not.toContain("config/inventory/hosts.yaml");
    expect(build().files.map((f) => f.name)).not.toContain("config/inventory/hosts.yaml");
  });

  it("VPN serves internal names under the domain given, and none without one (ADR 0054)", () => {
    expect(service(file(build({ products: ["vpn"] }), "compose.yaml"), "vpn")).not.toContain("VPN_DNS_DOMAIN");
    expect(service(file(build({ products: ["vpn"], internalDomain: " Internal.YR. " }), "compose.yaml"), "vpn")).toContain("VPN_DNS_DOMAIN: internal.yr");
    expect(service(file(build({ products: ["vpn"], internalDomain: "not a domain" }), "compose.yaml"), "vpn")).not.toContain("VPN_DNS_DOMAIN");
    // Split-horizon by default; a domain only inside says so.
    expect(service(file(build({ products: ["vpn"], internalDomain: "youreply.com.tr" }), "compose.yaml"), "vpn")).not.toContain("VPN_DNS_FORWARD");
    expect(service(file(build({ products: ["vpn"], internalDomain: "internal.yr", internalForward: false }), "compose.yaml"), "vpn")).toContain(
      "VPN_DNS_FORWARD: false",
    );
  });

  it("puts the products only on the VPN, with VPN and Identity public, when asked and Caddy serves them (ADR 0054)", () => {
    const products: Installable[] = ["identity", "vpn", "logs", "errors"];
    const off = build({ products, onlyVpn: true, proxy: "nginx" });
    expect(file(off, "compose.yaml")).not.toContain("OPENASY_ACME_KID");
    const out = build({ products, onlyVpn: true, insideAddress: "10.20.0.5", domain: "youreply.com.tr" });
    const compose = file(out, "compose.yaml");
    // The VPN serves the inside view of the install's own domain, its public names unchanged.
    expect(service(compose, "vpn")).toContain("VPN_DNS_DOMAIN: youreply.com.tr");
    expect(service(compose, "vpn")).not.toContain("VPN_DNS_FORWARD");
    expect(service(compose, "caddy")).toContain("OPENASY_ACME_KID: ${OPENASY_ACME_KID:-pending}");
    expect(service(compose, "vpn")).toContain("aliases: [vpn.openasy.internal]");
    const caddyfile = file(out, "config/Caddyfile");
    expect(caddyfile).toContain("vpn.youreply.com.tr {\n  reverse_proxy vpn:8080\n}");
    expect(caddyfile).toContain("id.youreply.com.tr {\n  reverse_proxy identity:8080\n}");
    expect(caddyfile).toMatch(/logs\.youreply\.com\.tr \{\n  tls \{\n    issuer acme \{\n      dir http:\/\/vpn\.openasy\.internal:8080\/acme\/directory/);
    expect(caddyfile).toContain("  @outside not remote_ip private_ranges\n  abort @outside\n  reverse_proxy logs:8080");
    // Only VPN and Identity get a public name; the steps add the others as internal names at the inside address.
    expect(out.hosts).toEqual(["id.youreply.com.tr", "vpn.youreply.com.tr"]);
    expect(file(out, ".env")).toContain("OPENASY_ACME_KID=");
    const step = out.steps.find((s) => s.title === "Only on the VPN")!;
    expect(step.code).toContain('"name":"logs","type":"A","value":"10.20.0.5"');
    expect(step.code).toContain('"name":"errors"');
    expect(step.code).not.toContain('"name":"vpn"');
  });

  it("every product loads one brand from config/brand.env, and mounts the logo and tab icon when there are any", () => {
    const plain = build();
    expect(service(file(plain, "compose.yaml"), "vpn")).toContain("config/brand.env");
    expect(service(file(plain, "compose.yaml"), "vpn-server")).not.toContain("brand.env");
    // Nothing set: every line is there to fill in later, commented out.
    expect(file(plain, "config/brand.env")).toMatch(/^# OPENASY_ORGANIZATION='Acme Corp'$/m);
    expect(file(plain, "config/brand.env")).toMatch(/^# OPENASY_LOGO=\/config\/brand\/logo\.svg$/m);
    expect(file(plain, "config/brand.env")).toMatch(/^# OPENASY_FAVICON=\/config\/brand\/favicon\.png$/m);
    expect(file(plain, "compose.yaml")).not.toContain("/config/brand");

    const out = build({
      products: [...INSTALLABLE],
      signIn: "own",
      organization: " Acme's\nCorp ",
      accent: "#0A66C2",
      logo: "logo.png",
      favicon: "favicon.ico",
    });
    const env = file(out, "config/brand.env");
    expect(env).toContain("OPENASY_ORGANIZATION='AcmesCorp'");
    expect(env).toMatch(/^OPENASY_ACCENT=#0a66c2$/m);
    expect(env).toMatch(/^OPENASY_LOGO=\/config\/brand\/logo\.png$/m);
    expect(env).toMatch(/^OPENASY_FAVICON=\/config\/brand\/favicon\.ico$/m);
    for (const name of ["identity", "vpn", "infra", "vulns"]) expect(service(file(out, "compose.yaml"), name)).toContain("- ./config/brand:/config/brand:ro");
    for (const name of ["config/brand/logo.png", "config/brand/favicon.ico"]) expect(out.files.find((f) => f.name === name)).toMatchObject({ binary: true });
    expect(out.files.filter((f) => f.secret).map((f) => f.name)).toEqual([
      ".env",
      "secrets/openasy-kek",
      "secrets/openasy-agent-kek",
      "secrets/openasy-logs-agent-kek",
    ]);
    expect(file(build({ accent: "blue" }), "config/brand.env")).toMatch(/^# OPENASY_ACCENT=/m);
  });

  it("the ready Keycloak signs everyone in, with every client's secret made here", () => {
    const out = build({ products: [...INSTALLABLE], signIn: "keycloak" });
    const compose = file(out, "compose.yaml");
    const env = file(out, ".env");
    expect(compose).toContain(`image: ${THIRD_PARTY.keycloak}`);
    expect(compose).toContain(`image: ${THIRD_PARTY.postgres}`);
    expect(service(compose, "infra")).toContain("OPENASY_OIDC_CLIENT_ID: openasy-infrastructure");
    expect(service(compose, "identity")).toContain("OPENASY_OIDC_ISSUER: https://auth.example.com/realms/openasy");
    expect(file(out, "config/auth.env")).toMatch(/^OPENASY_OIDC_PROVIDER=keycloak$/m);
    expect(file(out, "config/auth.env")).toMatch(/^# OPENASY_OIDC_AUTO_REDIRECT=/m);
    expect(service(compose, "identity")).toContain("config/auth.env");
    for (const v of ["VPN", "INFRA", "VULNS", "IDENTITY"]) {
      expect(compose).toContain(`OPENASY_${v}_SECRET: \${OPENASY_${v}_SECRET}`);
      expect(env).toMatch(new RegExp(`^OPENASY_${v}_SECRET=[0-9a-f]{48}$`, "m"));
    }
    expect(env).toContain(`KEYCLOAK_DB_PASSWORD=${secrets.keycloakDb}`);
    expect(env).toContain(`VULNS_INGEST_TOKEN=${secrets.ingest}`);
    expect(file(out, "secrets/openasy-agent-kek")).toBe(secrets.agentKek);
    expect(file(out, "config/Caddyfile")).toContain("auth.example.com {\n  reverse_proxy keycloak:8080\n}");
    expect(out.steps.some((s) => s.code?.includes("openasy-realm.json"))).toBe(true);
  });

  it("Identity can sign its own people in through Keycloak while the products sign in through Identity", () => {
    const out = build({ upstream: "keycloak" });
    const compose = file(out, "compose.yaml");
    expect(service(compose, "identity")).toContain("OPENASY_OIDC_PROVIDER: keycloak");
    expect(service(compose, "identity")).toContain("OPENASY_OIDC_CLIENT_ID: openasy-identity");
    expect(service(compose, "identity")).toContain('OPENASY_OIDC_ROLE_MAPPING: "openasy-admins=admin');
    expect(service(compose, "identity")).not.toContain("config/auth.env");
    expect(file(out, "config/auth.env")).toMatch(/^OPENASY_OIDC_PROVIDER=openasy-identity$/m);
    expect(compose).toContain("  keycloak:");
  });

  it("Google lets in its domain only, since it sends no groups", () => {
    const out = build({ products: ["vpn"], signIn: "provider", provider: "google", domain: "acme.io" });
    const compose = file(out, "compose.yaml");
    expect(file(out, ".env")).toContain("# VPN_ISSUER=https://accounts.google.com");
    expect(compose).toContain("OPENASY_OIDC_ISSUER: ${VPN_ISSUER:-}");
    expect(file(out, "config/auth.env")).toMatch(/^OPENASY_OIDC_ALLOWED_DOMAINS=acme\.io$/m);
    expect(file(out, "config/auth.env")).toMatch(/^# OPENASY_OIDC_ROLE_MAPPING=/m);
  });

  it("without Identity nobody signs in through it", () => {
    const out = build({ products: ["vpn"], signIn: "identity" });
    expect(file(out, "compose.yaml")).not.toContain("OIDC_");
    expect(file(out, "config/auth.env")).not.toMatch(/^OPENASY/m);
  });

  it("with the reader's own proxy each product gets a local port, and TCP VPN takes 443", () => {
    const out = build({ proxy: "own", vpnTcp: true });
    const compose = file(out, "compose.yaml");
    expect(compose).toContain('"127.0.0.1:8081:8080"');
    expect(compose).toContain('"127.0.0.1:8082:8080"');
    expect(compose).toContain('"443:443/tcp"');
    expect(compose).not.toContain("caddy");
    expect(out.files.map((f) => f.name)).not.toContain("config/Caddyfile");
    // Behind Caddy, which holds 443, the TCP server moves.
    expect(file(build({ vpnTcp: true }), "compose.yaml")).toContain('"8443:8443/tcp"');
  });

  it("nginx and Apache on the host get a site per product, and certbot makes them HTTPS", () => {
    for (const proxy of ["nginx", "apache"] as const) {
      const out = build({ proxy, products: ["identity", "vpn"], upstream: "keycloak" });
      const compose = file(out, "compose.yaml");
      expect(compose).not.toContain("caddy");
      expect(compose).toContain('"127.0.0.1:8081:8080"');
      expect(compose).toContain('"127.0.0.1:8180:8080"');
      const conf = file(out, `config/openasy-${proxy}.conf`);
      for (const [name, port] of [
        ["id.example.com", 8081],
        ["vpn.example.com", 8082],
        ["auth.example.com", 8180],
      ] as const) {
        expect(conf).toContain(proxy === "nginx" ? `server_name ${name};` : `ServerName ${name}`);
        expect(conf).toContain(`http://127.0.0.1:${port}`);
      }
      // Identity builds its URLs from the scheme the proxy passes on.
      expect(conf).toContain(proxy === "nginx" ? "X-Forwarded-Proto $scheme" : 'X-Forwarded-Proto "expr=%{REQUEST_SCHEME}"');
      expect(out.steps.some((s) => s.code?.includes(`sudo certbot --${proxy} -d id.example.com -d vpn.example.com -d auth.example.com`))).toBe(true);
      expect(out.hosts).toEqual(["id.example.com", "vpn.example.com", "auth.example.com"]);
    }
  });

  it("lists every volume and secret a service uses", () => {
    const compose = file(build({ products: [...INSTALLABLE], signIn: "keycloak", vpnTcp: true }), "compose.yaml");
    const [services, rest] = compose.split("\nvolumes:\n");
    const declared = rest!
      .split("\nsecrets:\n")[0]!
      .split("\n")
      .map((l) => l.trim().replace(/:$/, ""));
    for (const [, v] of services!.matchAll(/^ {6}- ([a-z-]+):\//gm)) expect(declared).toContain(v);
    expect(compose).toContain("  openasy-agent-kek:\n    file: ./secrets/openasy-agent-kek");
  });

  it("an empty choice still writes a valid file", () => {
    const out = build({ products: [] });
    expect(file(out, "compose.yaml")).toContain("services: {}");
    expect(out.steps).toEqual([]);
    expect(out.files.map((f) => f.name)).toEqual(["compose.yaml", ".env"]);
  });

  it("takes a domain however it is pasted", () => {
    expect(cleanDomain("https://Acme.io/path")).toBe("acme.io");
    expect(cleanDomain("acme.io.")).toBe("acme.io");
    expect(cleanDomain("  ")).toBe("example.com");
  });

  it("the dev setup serves names on the VPN under dev.internal, or under your domain, split-horizon (ADR 0054)", () => {
    const plain = service(file(buildDevKit(secrets), "compose.yaml"), "vpn");
    expect(plain).toContain("VPN_DNS_DOMAIN: dev.internal");
    expect(plain).toContain("VPN_DNS_FORWARD: false");
    const yours = service(file(buildDevKit(secrets, { dnsDomain: " YouReply.com.tr ", dnsForward: true, overVpn: false }), "compose.yaml"), "vpn");
    expect(yours).toContain("VPN_DNS_DOMAIN: youreply.com.tr");
    expect(yours).not.toContain("VPN_DNS_FORWARD");
    // A name that is not a domain keeps the default.
    expect(service(file(buildDevKit(secrets, { dnsDomain: "not a domain", dnsForward: false, overVpn: false }), "compose.yaml"), "vpn")).toContain(
      "VPN_DNS_DOMAIN: dev.internal",
    );
  });

  it("the dev setup can open the products only over the VPN, at names under an inside-only domain (ADR 0054)", () => {
    const out = buildDevKit(secrets, { dnsDomain: "youreply", dnsForward: false, overVpn: true });
    const compose = file(out, "compose.yaml");
    // Nothing published for the products: Caddy has no port on this machine, only the VPN's server does.
    expect(service(compose, "caddy")).not.toContain("ports:");
    expect(service(compose, "caddy")).toContain("aliases: [id.youreply, vpn.youreply, infra.youreply");
    expect(service(compose, "logs")).toContain("LOGS_PUBLIC_URL: https://logs.youreply");
    expect(service(compose, "vpn")).toContain("VPN_DNS_DOMAIN: youreply");
    expect(service(compose, "vpn")).toContain("VPN_DNS_FORWARD: false");
    expect(file(out, "config/Caddyfile")).toContain("https_port 443");
    expect(file(out, "config/Caddyfile")).toContain("https://logs.youreply {");
    expect(JSON.parse(file(out, "setup/kit.json"))).toEqual({ overVpn: true, domain: "youreply" });
    expect(out.steps.find((s) => s.title === "Connect over the VPN")!.code).toBe(
      'sudo mkdir -p /etc/resolver && echo "nameserver 10.8.0.1" | sudo tee /etc/resolver/youreply',
    );
    expect(SETUP).toContain('writeFileSync("secrets/dev.ovpn"');
    // Off, as before: *.localhost:8443.
    expect(service(file(buildDevKit(secrets), "compose.yaml"), "caddy")).toContain('"127.0.0.1:8443:8443"');
  });

  it("the dev setup runs every released product from released images, and a setup container wires them", () => {
    const out = buildDevKit(secrets);
    const compose = file(out, "compose.yaml");
    for (const [image, id] of [
      ["identity", "identity"],
      ["vpn", "vpn"],
      ["vpn-server", "vpn"],
      ["infra", "infrastructure"],
      ["infra-agent", "infrastructure"],
      ["vulns", "vulnerabilities"],
      ["vulns-agent", "vulnerabilities"],
    ] as const)
      expect(compose).toContain(`image: ghcr.io/openasy/${image}:${statusFor(id).version}`);
    // Only the two demo servers are built, from plain Debian; everything else is a pinned image.
    expect(compose.match(/^ {4}build:/gm)).toHaveLength(1);
    expect(compose).toContain(`FROM ${DEV_IMAGES.debian}`);
    expect(compose).toContain(`image: ${DEV_IMAGES.node}`);
    expect(compose).toContain(`image: ${THIRD_PARTY.caddy}`);
    // The products wait for setup, which mounts this folder at the same path so compose finds its files.
    expect(service(compose, "identity")).toContain("profiles: [wired]");
    expect(service(compose, "setup")).toContain("- .:${PWD}");
    // The demo servers' inline Dockerfile needs BuildKit, which compose in setup's container builds with only through buildx.
    expect(service(compose, "setup")).toContain("docker-cli-buildx");
    // Each product loads its own client from the file setup writes, and none is in compose or .env.
    for (const name of ["vpn", "infra", "vulns"])
      expect(service(compose, name)).toContain(`env_file: [config/brand.env, config/auth.env, { path: secrets/oidc/${name}.env, required: false }]`);
    expect(service(compose, "identity")).toContain("env_file: [config/brand.env]");
    expect(compose).not.toContain("OIDC_");
    expect(file(out, ".env")).not.toContain("CLIENT");
    expect(file(out, "config/auth.env")).toContain("is in secrets/oidc, written by setup.");
    // The products are in the wired profile: a change to brand.env or auth.env is applied with it.
    for (const name of ["config/auth.env", "config/brand.env"]) expect(file(out, name)).toContain("# After a change: docker compose --profile wired up -d");
    expect(file(out, "config/auth.env")).toMatch(/^OPENASY_OIDC_AUTO_REDIRECT=true$/m);
    for (const name of ["infra", "vulns"]) expect(service(compose, name)).toContain("OPENASY_HOSTS: /config/inventory/hosts.yaml");
    // Every $ meant for the shell in the demo servers is escaped from compose.
    expect(compose).not.toMatch(/[^$]\$(OPENASY_|\()/);
    expect(file(out, "setup/setup.ts")).toBe(SETUP.trimEnd());
    expect(file(out, "setup/seed.ts")).toBe(SEED.trimEnd());
    expect(SETUP).toContain('execFileSync("node", ["setup/seed.ts"]');
    // The products read their client from the environment, where @openasy/auth calls the provider sso.
    expect(SETUP).toContain("/api/v1/auth/oidc/sso/callback");
    expect(SETUP).not.toMatch(/auth\/oidc\/(?!sso\/)[a-z-]+\/callback/);
    expect(file(out, ".env")).toContain(`VULNS_INGEST_TOKEN=${secrets.ingest}`);
    expect(file(out, "config/inventory/hosts.yaml")).toContain("address: host-web");
    expect(out.files.filter((f) => f.secret).map((f) => f.name)).toEqual([
      ".env",
      "secrets/openasy-kek",
      "secrets/openasy-agent-kek",
      "secrets/openasy-logs-agent-kek",
    ]);
    // Every released product runs, signs in through Identity, and setup knows where each one is.
    const products = JSON.parse(file(out, "setup/products.json")) as Array<{ service: string; clientFile: string; template?: string }>;
    expect(products.map((p) => p.service)).toEqual(INSTALLABLE.map((id) => PARTS[id].service));
    for (const p of products.filter((p) => p.service !== "identity"))
      expect(service(compose, p.service)).toContain(`config/auth.env, { path: ${p.clientFile}, required: false }]`);
    for (const id of INSTALLABLE.filter((id) => PARTS[id].ingest))
      expect(file(out, ".env")).toMatch(new RegExp(`^${PARTS[id].prefix}INGEST_TOKEN=[0-9a-f]{48}$`, "m"));
    // The agents read keys a host names with keyFile from secrets/ssh, and every product reads the logo from config/brand.
    for (const name of ["infra-agent", "logs-agent"]) expect(service(compose, name)).toContain("- ./secrets/ssh:/keys:ro");
    for (const id of INSTALLABLE) expect(service(compose, PARTS[id].service)).toContain("- ./config/brand:/config/brand:ro");
    expect(file(out, "config/brand.env")).toContain("# OPENASY_LOGO=/config/brand/logo.svg");
    expect(file(out, "config/brand.env")).toContain("# OPENASY_FAVICON=/config/brand/favicon.png");
    // The servers trust both agents' CAs, and Logs gets its agent.
    expect(service(compose, "host-db")).toContain("OPENASY_CA_LOGS: ${LOGS_AGENT_CA:-}");
    expect(service(compose, "logs-agent")).toContain("source: openasy-logs-agent-kek");
    // Only Docker's own files stay at the top; the rest is grouped.
    expect(out.files.filter((f) => !f.name.includes("/")).map((f) => f.name)).toEqual(["compose.yaml", "README.md", ".env"]);
    expect(out.steps[1]!.code).toBe("docker compose up -d && docker compose logs -f setup");
  });
});
