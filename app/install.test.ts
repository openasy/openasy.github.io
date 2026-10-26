import { describe, expect, it } from "vitest";
import { DEFAULT_CHOICE, INSTALLABLE, PARTS, REALM_PRODUCTS, THIRD_PARTY, buildInstall, cleanDomain, makeSecrets, type InstallChoice } from "./data/install";
import { statusFor } from "./data/status";
import { DEV_IMAGES, buildDevKit } from "./data/devkit";
import SETUP from "../kit/dev/setup.ts?raw";
import SEED from "../kit/dev/seed.ts?raw";

// Counting bytes, so every secret is different and recognisable.
let n = 0;
const secrets = makeSecrets((b) => b.forEach((_, i) => (b[i] = n++ % 256)));
const build = (patch: Partial<InstallChoice> = {}) => buildInstall({ ...DEFAULT_CHOICE, ...patch }, secrets);
type Out = { files: Array<{ name: string; content: string }> };
const file = (out: Out, name: string) => out.files.find((f) => f.name === name)?.content ?? "";
/** compose.yaml with every product's file after it: everything compose runs (ADR 0054). */
const all = (out: Out) =>
  out.files
    .filter((f) => f.name === "compose.yaml" || f.name.startsWith("products/"))
    .map((f) => f.content)
    .join("\n");
/** One service, from its name to the next service, in whichever file it is. */
const service = (compose: string, name: string) => compose.split(/\n(?= {2}[a-z-]+:\n)/).find((b) => b.startsWith(`  ${name}:`)) ?? "";
/** A container's settings and secrets, its environment in its product's file, as KEY=value lines. */
const envOf = (out: Out, name: string) =>
  (/\n {4}environment:\n((?: {6}.*(?:\n|$))*)/.exec(service(all(out), name))?.[1] ?? "")
    .split("\n")
    .map((l) =>
      l.replace(
        /^ {6}(# )?([A-Z_][A-Z0-9_]*):(?: (.*?))?(\s{2,}#.*)?$/,
        (_, c: string | undefined, k: string, v: string | undefined) => `${c ?? ""}${k}=${v === '""' ? "" : (v ?? "")}`,
      ),
    )
    .join("\n");

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
      expect(all(out)).toContain(`image: ghcr.io/openasy/${image}:${statusFor(id).version}`);
  });

  it("VPN signs in through Identity, behind Caddy, by default", () => {
    const out = build();
    const compose = all(out);
    // compose.yaml includes one file per product, which holds its containers, settings and secrets (ADR 0054).
    expect(file(out, "compose.yaml")).toContain(
      "include:\n  - { path: products/identity.yaml, project_directory: . }\n  - { path: products/vpn.yaml, project_directory: . }\n",
    );
    expect(file(out, "compose.yaml")).not.toContain("environment:");
    expect(service(file(out, "products/vpn.yaml"), "vpn-server")).toContain("image: ghcr.io/openasy/vpn-server:");
    expect(out.files.map((f) => f.name)).not.toContain(".env");
    expect(envOf(out, "identity")).toMatch(/^IDENTITY_PUBLIC_URL=https:\/\/id\.example\.com$/m);
    const vpn = service(compose, "vpn");
    // What every product shares is in sign-in.env; only the client is in each product's own file.
    expect(vpn).toContain("env_file: [openasy.env, sign-in.env]");
    const auth = file(out, "sign-in.env");
    expect(auth).toMatch(/^OPENASY_OIDC_PROVIDER=openasy-identity$/m);
    // The issuer waits commented out with the client, so VPN starts before Identity has made it.
    expect(envOf(out, "vpn")).toMatch(/^# OPENASY_OIDC_ISSUER=https:\/\/id\.example\.com$/m);
    expect(envOf(out, "vpn")).toMatch(/^# OPENASY_OIDC_CLIENT_ID=$/m);
    expect(auth).toMatch(/^OPENASY_OIDC_ROLE_MAPPING=openasy-admins=admin,/m);
    // Through Identity, the sign-in page goes straight there. Settings not used are listed to change later.
    expect(auth).toMatch(/^OPENASY_OIDC_AUTO_REDIRECT=true$/m);
    expect(auth).toMatch(/^# OPENASY_OIDC_ALLOWED_DOMAINS=/m);
    // Identity keeps its own people: it signs in through nobody, and does not load auth.env.
    expect(envOf(out, "identity")).not.toContain("OIDC_");
    expect(service(compose, "identity")).toContain("env_file: [openasy.env]");
    // Only Caddy is published, besides VPN's own port.
    expect(compose).not.toMatch(/127\.0\.0\.1:808\d/);
    expect(compose).toContain('"443:443"');
    expect(file(out, "config/Caddyfile")).toBe("id.example.com {\n  reverse_proxy identity:8080\n}\n\nvpn.example.com {\n  reverse_proxy vpn:8080\n}");
    expect(file(out, "config/prometheus.yml")).toContain('targets: ["vpn:8080"]');
    expect(envOf(out, "vpn")).toMatch(/^# OPENASY_OIDC_CLIENT_SECRET=$/m);
    // vpn-server's token comes after the first start, in its own secrets file.
    expect(envOf(out, "vpn-server")).toMatch(/^VPN_ENROLL_TOKEN=$/m);
    expect(envOf(out, "vpn-server")).toMatch(/^OPENVPN_PORT="1194"$/m);
    // vpn-server waits for its token.
    expect(out.steps.find((s) => s.code?.startsWith("docker compose up -d "))?.code).toBe("docker compose up -d identity vpn prometheus caddy");
    expect(file(out, "keys/openasy-kek")).toBe(secrets.kek);
    expect(secrets.kek).toMatch(/^[0-9a-f]{64}$/);
    expect(out.steps.map((s) => s.text).join("\n")).toContain("In Identity, Applications, add VPN");
    expect(out.hosts).toEqual(["id.example.com", "vpn.example.com"]);
  });

  it("on an internal network Caddy uses its own CA, and the products trust it", () => {
    const out = build({ domain: "openasy.internal", certificates: "internal", products: ["identity", "vpn", "sast"] });
    const compose = all(out);
    expect(file(out, "config/Caddyfile")).toMatch(/^\{\n {2}local_certs\n {2}skip_install_trust\n\}\n\nid\.openasy\.internal \{/);
    const caddy = service(compose, "caddy");
    // No ACME check, so port 80 stays closed, and inside the network the names reach Caddy.
    expect(caddy).not.toContain('"80:80"');
    expect(caddy).toContain('"443:443"');
    expect(caddy).toContain("aliases:\n          - id.openasy.internal\n          - vpn.openasy.internal\n          - sast.openasy.internal\n");
    for (const name of ["identity", "vpn", "sast"]) {
      expect(envOf(out, name)).toMatch(/^NODE_EXTRA_CA_CERTS=\/caddy\/caddy\/pki\/authorities\/local\/root\.crt$/m);
      expect(service(compose, name)).toContain("- caddy-data:/caddy:ro");
    }
    // The agent talks to its product over plain HTTP inside the network.
    expect(envOf(out, "sast-agent")).not.toContain("NODE_EXTRA_CA_CERTS");
    const steps = out.steps.map((s) => `${s.text}\n${s.code ?? ""}`).join("\n");
    expect(steps).toContain("<this host's address>  id.openasy.internal vpn.openasy.internal sast.openasy.internal");
    expect(steps).toContain("chmod o+r root.crt");
    expect(steps).toContain("docker compose cp caddy:/data/caddy/pki/authorities/local/root.crt config/caddy-root.crt");
    expect(steps).toContain("certutil -addstore -user Root caddy-root.crt");
    expect(steps).not.toContain("so Caddy can get their certificates");
    // Caddy starts before the products, so its CA is there when they read it.
    const order = out.steps.map((s) => s.code ?? "");
    expect(order.findIndex((c) => c.startsWith("docker compose up -d caddy"))).toBeLessThan(
      order.findIndex((c) => c.startsWith("docker compose up -d identity")),
    );
  });

  it("the certificates choice changes nothing without Caddy, or with Let's Encrypt", () => {
    expect(build({ certificates: "internal", proxy: "nginx" })).toEqual(build({ proxy: "nginx" }));
    expect(build({ certificates: "internal", proxy: "own" })).toEqual(build({ proxy: "own" }));
    expect(build({ certificates: "public" }).files.some((f) => f.content.includes("NODE_EXTRA_CA_CERTS"))).toBe(false);
  });

  it("every other released product is one hardened container with its own address, key and ingest token", () => {
    const out = build({ products: [...INSTALLABLE], signIn: "own" });
    const compose = all(out);
    for (const id of INSTALLABLE.filter((id) => !(REALM_PRODUCTS as readonly string[]).includes(id))) {
      const { service: name, prefix, ingest, hosts } = PARTS[id];
      const svc = service(compose, name);
      expect(svc).toContain(`image: ghcr.io/openasy/${name}:${statusFor(id).version}`);
      expect(svc).toContain("read_only: true");
      expect(envOf(out, name)).toMatch(new RegExp(`^${prefix}PUBLIC_URL=https://${PARTS[id].sub}\\.example\\.com$`, "m"));
      expect(svc).toContain("env_file: [openasy.env, sign-in.env]");
      // Its ingest token is in its own file, and nowhere else.
      if (ingest) expect(envOf(out, name)).toMatch(new RegExp(`^${prefix}INGEST_TOKEN=[0-9a-f]{48}$`, "m"));
      else expect(envOf(out, name)).not.toContain("INGEST_TOKEN");
      expect(envOf(out, name).includes("OPENASY_HOSTS")).toBe(!!hosts);
    }
    // Logs reads hosts with its own agent and its own key, apart from Infrastructure's.
    expect(service(compose, "logs-agent")).toContain("source: openasy-logs-agent-kek");
    expect(file(out, "keys/openasy-logs-agent-kek")).toBe(secrets.logsAgentKek);
    expect(out.steps.some((s) => s.code === "docker compose up -d logs-agent")).toBe(true);
    // So does SIEM, for the security events of the same hosts.
    expect(service(compose, "siem-agent")).toContain("source: openasy-siem-agent-kek");
    expect(file(out, "keys/openasy-siem-agent-kek")).toBe(secrets.siemAgentKek);
    expect(out.steps.some((s) => s.code === "docker compose up -d siem-agent")).toBe(true);
    expect(file(out, "config/prometheus.yml")).toContain('targets: ["supply-chain:8080"]');
  });

  it("through Identity, products without a template are added as OpenID Connect applications", () => {
    const text = build({ products: ["identity", "vpn", "siem"] })
      .steps.map((s) => s.text)
      .join("\n");
    expect(text).toContain("add VPN from its template, and SIEM as OpenID Connect applications");
  });

  it("Infrastructure and Vulnerabilities read one hosts.yaml, mounted read-only, the only way to add servers", () => {
    const out = build({ products: ["infrastructure", "vulnerabilities"], signIn: "own" });
    const compose = all(out);
    for (const name of ["infra", "vulns"]) {
      // The folder, so a file saved by replacing it still reaches the product.
      expect(service(compose, name)).toContain("- ./inventory:/config/inventory:ro");
      expect(envOf(out, name)).toMatch(/^OPENASY_HOSTS=\/config\/inventory\/hosts\.yaml$/m);
    }
    expect(service(compose, "infra-agent")).not.toContain("hosts.yaml");
    expect(envOf(out, "infra-agent")).not.toContain("hosts.yaml");
    expect(file(out, "inventory/hosts.yaml")).toMatch(/^# Your servers, read by Infrastructure and Vulnerabilities[\s\S]*\nhosts: \[\]$/);
    // Infrastructure also reads the servers' BMCs from it; their passwords stay in the agent's key folder (ADR 0055).
    expect(file(out, "inventory/hosts.yaml")).toMatch(/^# bmcs:\n[\s\S]*# {5}passwordFile: web-1-bmc {4}# the password, in a file in keys\/ssh/m);
    expect(out.wiring.map((w) => w.title)).toContain("One list of servers");
    expect(file(out, "inventory/hosts.yaml")).toContain("the only place servers are added");
    expect(build().files.map((f) => f.name)).not.toContain("inventory/hosts.yaml");
  });

  it("Uptime, Certificates and DAST read one endpoints.yaml, and DAST's logins take their secrets from a file of its own", () => {
    const out = build({ products: ["uptime", "certificates", "dast"], signIn: "own" });
    const compose = all(out);
    for (const name of ["uptime", "certificates", "dast"]) {
      expect(service(compose, name)).toContain("- ./inventory:/config/inventory:ro");
      expect(envOf(out, name)).toMatch(/^OPENASY_ENDPOINTS=\/config\/inventory\/endpoints\.yaml$/m);
      expect(envOf(out, name)).not.toContain("OPENASY_HOSTS");
    }
    // Only DAST gets the secrets its logins name.
    expect(envOf(out, "dast")).toContain("# DAST_SHOP_TOKEN=");
    for (const name of ["uptime", "certificates", "dast-agent"]) expect(envOf(out, name)).not.toContain("DAST_SHOP_TOKEN");
    expect(file(out, "inventory/endpoints.yaml")).toMatch(/^# Your endpoints, read by Certificates, Uptime and DAST|^# Your endpoints, read by/);
    expect(file(out, "inventory/endpoints.yaml")).toMatch(/#     dast:[\s\S]*\nendpoints: \[\]$/);
    expect(out.files.find((f) => f.name === "products/dast.yaml")).toMatchObject({ secret: true });
    expect(out.wiring.map((w) => w.title)).toContain("One list of endpoints");
    const uptime = build({ products: ["uptime"], signIn: "own" });
    expect(file(uptime, "inventory/endpoints.yaml")).not.toContain("dast:");
    expect(uptime.files.map((f) => f.name)).not.toContain("products/dast.yaml");
    expect(build().files.map((f) => f.name)).not.toContain("inventory/endpoints.yaml");
  });

  it("SAST reads its forge accounts from repositories.yaml, and their tokens from its own file", () => {
    const out = build({ products: ["sast"], signIn: "own" });
    const sast = service(all(out), "sast");
    expect(sast).toContain("- ./inventory:/config/inventory:ro");
    expect(out.files.find((f) => f.name === "products/sast.yaml")).toMatchObject({ secret: true });
    expect(envOf(out, "sast")).toMatch(/^OPENASY_REPOSITORIES=\/config\/inventory\/repositories\.yaml$/m);
    expect(envOf(out, "sast")).toMatch(/^SAST_INGEST_TOKEN=[0-9a-f]{48}$/m);
    expect(envOf(out, "sast")).toContain("# SAST_ACME_TOKEN=github_pat_...");
    expect(file(out, "inventory/repositories.yaml")).toMatch(/A token is never here[\s\S]*\nforges: \[\]$/);
    expect(out.steps.some((s) => s.text.includes("repositories.yaml"))).toBe(true);
    expect(build({ products: ["uptime"], signIn: "own" }).files.map((f) => f.name)).not.toContain("inventory/repositories.yaml");
  });

  it("every product loads one brand from openasy.env, and mounts the logo and tab icon when there are any", () => {
    const plain = build();
    expect(service(all(plain), "vpn")).toContain("openasy.env");
    expect(service(all(plain), "vpn-server")).not.toContain("openasy.env");
    // Nothing set: every line is there to fill in later, commented out.
    expect(file(plain, "openasy.env")).toMatch(/^# OPENASY_ORGANIZATION='Acme Corp'$/m);
    expect(file(plain, "openasy.env")).toMatch(/^# OPENASY_LOGO=\/config\/brand\/logo\.svg$/m);
    expect(file(plain, "openasy.env")).toMatch(/^# OPENASY_FAVICON=\/config\/brand\/favicon\.png$/m);
    expect(all(plain)).not.toContain("/config/brand");

    const out = build({
      products: [...INSTALLABLE],
      signIn: "own",
      organization: " Acme's\nCorp ",
      accent: "#0A66C2",
      logo: "logo.png",
      favicon: "favicon.ico",
    });
    const env = file(out, "openasy.env");
    expect(env).toContain("OPENASY_ORGANIZATION='AcmesCorp'");
    expect(env).toMatch(/^OPENASY_ACCENT=#0a66c2$/m);
    expect(env).toMatch(/^OPENASY_LOGO=\/config\/brand\/logo\.png$/m);
    expect(env).toMatch(/^OPENASY_FAVICON=\/config\/brand\/favicon\.ico$/m);
    for (const name of ["identity", "vpn", "infra", "vulns"]) expect(service(all(out), name)).toContain("- ./brand:/config/brand:ro");
    for (const name of ["brand/logo.png", "brand/favicon.ico"]) expect(out.files.find((f) => f.name === name)).toMatchObject({ binary: true });
    // Every secret is in keys/ or a product's file, and every file there is a secret.
    const secretFiles = out.files.filter((f) => f.secret).map((f) => f.name);
    expect(secretFiles.every((n) => n.startsWith("keys/") || n.startsWith("products/"))).toBe(true);
    expect(secretFiles).toEqual(
      expect.arrayContaining(["keys/openasy-kek", "keys/openasy-agent-kek", "products/sast.yaml", "products/dast.yaml", "products/vulns.yaml"]),
    );
    expect(out.files.filter((f) => /^(keys|products)\//.test(f.name) && !f.secret)).toEqual([]);
    expect(file(build({ accent: "blue" }), "openasy.env")).toMatch(/^# OPENASY_ACCENT=/m);
  });

  it("the ready Keycloak signs everyone in, with every client's secret made here", () => {
    const out = build({ products: [...INSTALLABLE], signIn: "keycloak" });
    const compose = all(out);
    expect(compose).toContain(`image: ${THIRD_PARTY.keycloak}`);
    expect(compose).toContain(`image: ${THIRD_PARTY.postgres}`);
    expect(envOf(out, "infra")).toMatch(/^OPENASY_OIDC_CLIENT_ID=openasy-infrastructure$/m);
    expect(envOf(out, "identity")).toMatch(/^OPENASY_OIDC_ISSUER=https:\/\/auth\.example\.com\/realms\/openasy$/m);
    expect(file(out, "sign-in.env")).toMatch(/^OPENASY_OIDC_PROVIDER=keycloak$/m);
    expect(file(out, "sign-in.env")).toMatch(/^# OPENASY_OIDC_AUTO_REDIRECT=/m);
    expect(service(compose, "identity")).toContain("sign-in.env");
    // Keycloak knows every client's secret, and each product its own, both made here.
    for (const [v, svc] of [
      ["VPN", "vpn"],
      ["INFRA", "infra"],
      ["VULNS", "vulns"],
      ["IDENTITY", "identity"],
    ] as const) {
      expect(envOf(out, "keycloak")).toMatch(new RegExp(`^OPENASY_${v}_SECRET=[0-9a-f]{48}$`, "m"));
      expect(envOf(out, svc)).toMatch(/^OPENASY_OIDC_CLIENT_SECRET=[0-9a-f]{48}$/m);
    }
    // A value two containers need is written to both.
    expect(envOf(out, "keycloak")).toContain(`KC_DB_PASSWORD=${secrets.keycloakDb}`);
    expect(envOf(out, "postgres")).toContain(`POSTGRES_PASSWORD=${secrets.keycloakDb}`);
    expect(envOf(out, "vulns")).toContain(`VULNS_INGEST_TOKEN=${secrets.ingest}`);
    // Infrastructure sends each host's packages to Vulnerabilities with its ingest token.
    expect(envOf(out, "infra")).toMatch(/^INFRA_VULNS_URL=http:\/\/vulns:8080$/m);
    expect(envOf(out, "infra")).toContain(`INFRA_VULNS_TOKEN=${secrets.ingest}`);
    expect(file(out, "keys/openasy-agent-kek")).toBe(secrets.agentKek);
    expect(file(out, "config/Caddyfile")).toContain("auth.example.com {\n  reverse_proxy keycloak:8080\n}");
    expect(out.steps.some((s) => s.code?.includes("openasy-realm.json"))).toBe(true);
  });

  it("Identity can sign its own people in through Keycloak while the products sign in through Identity", () => {
    const out = build({ upstream: "keycloak" });
    const compose = all(out);
    expect(envOf(out, "identity")).toMatch(/^OPENASY_OIDC_PROVIDER=keycloak$/m);
    expect(envOf(out, "identity")).toMatch(/^OPENASY_OIDC_CLIENT_ID=openasy-identity$/m);
    expect(envOf(out, "identity")).toContain('OPENASY_OIDC_ROLE_MAPPING="openasy-admins=admin');
    expect(service(compose, "identity")).not.toContain("sign-in.env");
    expect(file(out, "sign-in.env")).toMatch(/^OPENASY_OIDC_PROVIDER=openasy-identity$/m);
    expect(compose).toContain("  keycloak:");
  });

  it("Google lets in its domain only, since it sends no groups", () => {
    const out = build({ products: ["vpn"], signIn: "provider", provider: "google", domain: "acme.io" });
    expect(envOf(out, "vpn")).toMatch(/^# OPENASY_OIDC_ISSUER=https:\/\/accounts\.google\.com$/m);
    expect(file(out, "sign-in.env")).toMatch(/^OPENASY_OIDC_ALLOWED_DOMAINS=acme\.io$/m);
    expect(file(out, "sign-in.env")).toMatch(/^# OPENASY_OIDC_ROLE_MAPPING=/m);
  });

  it("without Identity nobody signs in through it", () => {
    const out = build({ products: ["vpn"], signIn: "identity" });
    expect(envOf(out, "vpn")).not.toContain("OIDC_");
    expect(file(out, "sign-in.env")).not.toMatch(/^OPENASY/m);
  });

  it("with the reader's own proxy each product gets a local port, and TCP VPN takes 443", () => {
    const out = build({ proxy: "own", vpnTcp: true });
    const compose = all(out);
    expect(compose).toContain('"127.0.0.1:8081:8080"');
    expect(compose).toContain('"127.0.0.1:8082:8080"');
    expect(compose).toContain('"443:443/tcp"');
    expect(compose).not.toContain("caddy");
    expect(out.files.map((f) => f.name)).not.toContain("config/Caddyfile");
    // Behind Caddy, which holds 443, the TCP server moves.
    expect(all(build({ vpnTcp: true }))).toContain('"8443:8443/tcp"');
  });

  it("nginx and Apache on the host get a site per product, and certbot makes them HTTPS", () => {
    for (const proxy of ["nginx", "apache"] as const) {
      const out = build({ proxy, products: ["identity", "vpn"], upstream: "keycloak" });
      const compose = all(out);
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

  it("each file lists every volume and secret its services use", () => {
    const out = build({ products: [...INSTALLABLE], signIn: "keycloak", vpnTcp: true });
    for (const f of out.files.filter((x) => x.name === "compose.yaml" || x.name.startsWith("products/"))) {
      const [services, rest = ""] = f.content.split("\nvolumes:\n");
      const declared = rest
        .split("\nsecrets:\n")[0]!
        .split("\n")
        .map((l) => l.trim().replace(/:$/, ""));
      for (const [, v] of services!.matchAll(/^ {6}- ([a-z-]+):\//gm)) expect(declared).toContain(v);
    }
    expect(file(out, "products/sast.yaml")).toContain("  openasy-agent-kek:\n    file: ./keys/openasy-agent-kek");
  });

  it("an empty choice still writes a valid file", () => {
    const out = build({ products: [] });
    expect(all(out)).toContain("services: {}");
    expect(out.steps).toEqual([]);
    expect(out.files.map((f) => f.name)).toEqual(["compose.yaml"]);
  });

  it("takes a domain however it is pasted", () => {
    expect(cleanDomain("https://Acme.io/path")).toBe("acme.io");
    expect(cleanDomain("acme.io.")).toBe("acme.io");
    expect(cleanDomain("  ")).toBe("example.com");
  });

  it("the dev setup runs every released product from released images, and a setup container wires them", () => {
    const out = buildDevKit(secrets);
    const compose = all(out);
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
    // Each product loads what every product shares; its own settings and secrets are in its file, where setup writes
    // its client (ADR 0054). Every value is written in: nothing is filled in from elsewhere.
    expect(file(out, "compose.yaml")).not.toContain("environment:");
    expect(compose).not.toMatch(/\$\{(?!PWD\})/);
    for (const name of ["vpn", "infra", "vulns"]) expect(service(compose, name)).toContain("env_file: [openasy.env, sign-in.env]");
    expect(service(compose, "identity")).toContain("env_file: [openasy.env]");
    expect(out.files.some((f) => f.name.endsWith(".env") && f.content.includes("OIDC_CLIENT"))).toBe(false);
    expect(file(out, "sign-in.env")).toContain("is in its file in products/, written there by setup.");
    expect(file(out, "openasy.env")).toMatch(/^OPENASY_PRODUCTS=identity=https:\/\/id\.localhost:8443,/m);
    // The products are in the wired profile: a change to brand.env or auth.env is applied with it.
    for (const name of ["sign-in.env", "openasy.env"]) expect(file(out, name)).toContain("After a change: docker compose --profile wired up -d");
    expect(file(out, "sign-in.env")).toMatch(/^OPENASY_OIDC_AUTO_REDIRECT=true$/m);
    for (const name of ["infra", "vulns"]) expect(envOf(out, name)).toMatch(/^OPENASY_HOSTS=\/config\/inventory\/hosts\.yaml$/m);
    // Every $ meant for the shell in the demo servers is escaped from compose.
    expect(compose).not.toMatch(/[^$]\$(OPENASY_|\()/);
    expect(file(out, "setup/setup.ts")).toBe(SETUP.trimEnd());
    expect(file(out, "setup/seed.ts")).toBe(SEED.trimEnd());
    // Sample data is asked for, never filled by setup.
    expect(SETUP).not.toContain('"setup/seed.ts"]');
    expect(SETUP).toContain("docker compose run --rm --no-deps setup node setup/seed.ts");
    // The products read their client from the environment, where @openasy/auth calls the provider sso.
    expect(SETUP).toContain("/api/v1/auth/oidc/sso/callback");
    expect(SETUP).not.toMatch(/auth\/oidc\/(?!sso\/)[a-z-]+\/callback/);
    expect(envOf(out, "vulns")).toContain(`VULNS_INGEST_TOKEN=${secrets.ingest}`);
    expect(envOf(out, "vulns-agent")).toContain(`VULNS_INGEST_TOKEN=${secrets.ingest}`);
    // setup writes what it makes into the lines each container's x-openasy names.
    expect(service(compose, "infra-agent")).toContain('x-openasy: {"fills":{"INFRA_ENROLL_TOKEN":"INFRA_ENROLL_TOKEN"}}');
    for (const name of ["host-web", "host-db"]) expect(service(compose, name)).toContain('"OPENASY_CA":"INFRA_AGENT_CA"');
    expect(service(compose, "host-db")).toContain('"OPENASY_CA_SIEM":"SIEM_AGENT_CA"');
    expect(service(compose, "siem")).toContain('"fills":{"SIEM_INCIDENTS_TOKEN":"SIEM_INCIDENTS_TOKEN"}');
    expect(SETUP).not.toMatch(/setup\/(env|products)\.json/);
    expect(file(out, "inventory/hosts.yaml")).toContain("address: host-web");
    // The sample endpoints: Uptime's checks and DAST's target come from the file, as nothing else adds them.
    expect(file(out, "inventory/endpoints.yaml")).toMatch(/- name: shop-staging\n {4}url: https:\/\/shop-staging\.example\.com\n[\s\S]*dast:/);
    for (const name of ["uptime", "certificates", "dast"]) expect(envOf(out, name)).toMatch(/^OPENASY_ENDPOINTS=\/config\/inventory\/endpoints\.yaml$/m);
    expect(envOf(out, "dast")).toContain("# DAST_SHOP_TOKEN=");
    expect(out.files.filter((f) => /^(keys|products)\//.test(f.name) && !f.secret)).toEqual([]);
    // Every released product runs, each in its own file, and setup knows where each one is.
    expect([...file(out, "compose.yaml").matchAll(/path: products\/([a-z-]+)\.yaml/g)].map((m) => m[1])).toEqual([
      ...INSTALLABLE.map((id) => PARTS[id].service),
      "demo",
    ]);
    for (const id of INSTALLABLE) expect(service(compose, PARTS[id].service)).toContain(`x-openasy: {"url":"https://${PARTS[id].sub}.localhost:8443"`);
    for (const id of INSTALLABLE.filter((id) => PARTS[id].ingest))
      expect(envOf(out, PARTS[id].service)).toMatch(new RegExp(`^${PARTS[id].prefix}INGEST_TOKEN=[0-9a-f]{48}$`, "m"));
    // The agents read keys a host names with keyFile from keys/ssh, and every product reads the logo from brand/.
    for (const name of ["infra-agent", "logs-agent", "siem-agent"]) expect(service(compose, name)).toContain("- ./keys/ssh:/keys:ro");
    for (const id of INSTALLABLE) expect(service(compose, PARTS[id].service)).toContain("- ./brand:/config/brand:ro");
    expect(file(out, "openasy.env")).toContain("# OPENASY_LOGO=/config/brand/logo.svg");
    expect(file(out, "openasy.env")).toContain("# OPENASY_FAVICON=/config/brand/favicon.png");
    // The servers trust the three agents' CAs, and Logs and SIEM get their agents.
    expect(envOf(out, "host-db")).toMatch(/^OPENASY_CA_LOGS=$/m);
    expect(service(compose, "logs-agent")).toContain("source: openasy-logs-agent-kek");
    expect(service(compose, "siem-agent")).toContain("source: openasy-siem-agent-kek");
    // At the top: compose.yaml, what every product shares, and the README; the rest is grouped.
    expect(out.files.filter((f) => !f.name.includes("/")).map((f) => f.name)).toEqual(["compose.yaml", "README.md", "openasy.env", "sign-in.env"]);
    expect(out.steps[1]!.code).toBe("docker compose up -d && docker compose logs -f setup");
  });

  it("the dev setup can be opened from the other computers on the network, under names of its own", () => {
    const out = buildDevKit(secrets, "openasy.internal");
    const compose = all(out);
    // Caddy answers on every address, under the same names inside the network and out.
    expect(service(compose, "caddy")).toContain('- "8443:8443"');
    expect(service(compose, "caddy")).not.toContain("127.0.0.1:8443");
    expect(service(compose, "caddy")).toContain("aliases:\n          - id.openasy.internal\n          - vpn.openasy.internal\n");
    expect(compose).not.toContain(".localhost");
    expect(envOf(out, "identity")).toMatch(/^IDENTITY_PUBLIC_URL=https:\/\/id\.openasy\.internal:8443$/m);
    expect(envOf(out, "vpn")).toMatch(/^VPN_PUBLIC_HOST=vpn\.openasy\.internal$/m);
    expect(file(out, "config/Caddyfile")).toContain("https://sast.openasy.internal:8443 {");
    expect(service(compose, "identity")).toContain('x-openasy: {"url":"https://id.openasy.internal:8443"');
    // Each computer names this one in its hosts file and trusts the CA.
    const steps = out.steps.map((s) => `${s.text}\n${s.code ?? ""}`).join("\n");
    expect(steps).toContain("<this computer's address>  id.openasy.internal vpn.openasy.internal");
    expect(steps).toContain("certutil -addstore -user Root caddy-root.crt");
    expect(out.steps).toHaveLength(4);
    expect(file(out, "README.md")).toContain("| SAST | https://sast.openasy.internal:8443 |");
    // Without a network it stays on this computer, as before.
    expect(service(all(buildDevKit(secrets)), "caddy")).toContain('- "127.0.0.1:8443:8443"');
    expect(buildDevKit(secrets).steps).toHaveLength(3);
  });
});
