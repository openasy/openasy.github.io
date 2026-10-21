import { describe, expect, it } from "vitest";
import { DEFAULT_CHOICE, INSTALLABLE, THIRD_PARTY, buildInstall, cleanDomain, makeSecrets, type InstallChoice } from "./data/install";
import { statusFor } from "./data/status";

// Counting bytes, so every secret is different and recognisable.
let n = 0;
const secrets = makeSecrets((b) => b.forEach((_, i) => (b[i] = n++ % 256)));
const build = (patch: Partial<InstallChoice> = {}) => buildInstall({ ...DEFAULT_CHOICE, ...patch }, secrets);
const file = (out: ReturnType<typeof build>, name: string) => out.files.find((f) => f.name === name)?.content ?? "";

describe("install builder", () => {
  it("only offers released products, at their released version", () => {
    for (const id of INSTALLABLE) expect(statusFor(id).status).toBe("Preview");
    const out = build({ products: [...INSTALLABLE], signIn: "own" });
    for (const [image, id] of [["identity", "identity"], ["vpn", "vpn"], ["vpn-server", "vpn"], ["infra", "infrastructure"], ["infra-agent", "infrastructure"], ["vulns", "vulnerabilities"], ["vulns-agent", "vulnerabilities"]] as const)
      expect(file(out, "compose.yaml")).toContain(`image: ghcr.io/openasy/${image}:${statusFor(id).version}`);
  });

  it("VPN signs in through Identity, behind Caddy, by default", () => {
    const out = build();
    const compose = file(out, "compose.yaml");
    expect(compose).toContain("IDENTITY_PUBLIC_URL: https://id.example.com");
    expect(compose).toContain("VPN_OIDC_PROVIDER: openasy-identity");
    // The issuer waits in .env with the client, so VPN starts before Identity has made it.
    expect(compose).toContain("VPN_OIDC_ISSUER: ${VPN_OIDC_ISSUER:-}");
    expect(file(out, ".env")).toContain("# VPN_OIDC_ISSUER=https://id.example.com");
    expect(compose).toContain('VPN_OIDC_ROLE_MAPPING: "openasy-admins=admin');
    // Identity keeps its own people: it signs in through nobody.
    expect(compose).not.toContain("IDENTITY_OIDC_");
    // Only Caddy is published, besides VPN's own port.
    expect(compose).not.toMatch(/127\.0\.0\.1:808\d/);
    expect(compose).toContain('"443:443"');
    expect(file(out, "Caddyfile")).toBe("id.example.com {\n  reverse_proxy identity:8080\n}\n\nvpn.example.com {\n  reverse_proxy vpn:8080\n}");
    expect(file(out, "prometheus.yml")).toContain('targets: ["vpn:8080"]');
    expect(file(out, ".env")).toContain("# VPN_CLIENT_SECRET=");
    // vpn-server waits for its token.
    expect(out.steps.find((s) => s.code?.startsWith("docker compose up -d "))?.code).toBe("docker compose up -d identity vpn prometheus caddy");
    expect(file(out, "openasy-kek")).toBe(secrets.kek);
    expect(secrets.kek).toMatch(/^[0-9a-f]{64}$/);
    expect(out.steps.map((s) => s.text).join("\n")).toContain("In Identity, Applications, add VPN");
    expect(out.hosts).toEqual(["id.example.com", "vpn.example.com"]);
  });

  it("the ready Keycloak signs everyone in, with every client's secret made here", () => {
    const out = build({ products: [...INSTALLABLE], signIn: "keycloak" });
    const compose = file(out, "compose.yaml");
    const env = file(out, ".env");
    expect(compose).toContain(`image: ${THIRD_PARTY.keycloak}`);
    expect(compose).toContain(`image: ${THIRD_PARTY.postgres}`);
    expect(compose).toContain("INFRA_OIDC_CLIENT_ID: openasy-infrastructure");
    expect(compose).toContain("IDENTITY_OIDC_ISSUER: https://auth.example.com/realms/openasy");
    for (const v of ["VPN", "INFRA", "VULNS", "IDENTITY"]) {
      expect(compose).toContain(`OPENASY_${v}_SECRET: \${OPENASY_${v}_SECRET}`);
      expect(env).toMatch(new RegExp(`^OPENASY_${v}_SECRET=[0-9a-f]{48}$`, "m"));
    }
    expect(env).toContain(`KEYCLOAK_DB_PASSWORD=${secrets.keycloakDb}`);
    expect(env).toContain(`VULNS_INGEST_TOKEN=${secrets.ingest}`);
    expect(file(out, "openasy-agent-kek")).toBe(secrets.agentKek);
    expect(file(out, "Caddyfile")).toContain("auth.example.com {\n  reverse_proxy keycloak:8080\n}");
    expect(out.steps.some((s) => s.code?.includes("openasy-realm.json"))).toBe(true);
  });

  it("Identity can sign its own people in through Keycloak while the products sign in through Identity", () => {
    const compose = file(build({ upstream: "keycloak" }), "compose.yaml");
    expect(compose).toContain("IDENTITY_OIDC_PROVIDER: keycloak");
    expect(compose).toContain("IDENTITY_OIDC_CLIENT_ID: openasy-identity");
    expect(compose).toContain("VPN_OIDC_PROVIDER: openasy-identity");
    expect(compose).toContain("  keycloak:");
  });

  it("Google lets in its domain only, since it sends no groups", () => {
    const out = build({ products: ["vpn"], signIn: "provider", provider: "google", domain: "acme.io" });
    const compose = file(out, "compose.yaml");
    expect(file(out, ".env")).toContain("# VPN_OIDC_ISSUER=https://accounts.google.com");
    expect(compose).toContain("VPN_OIDC_ALLOWED_DOMAINS: acme.io");
    expect(compose).not.toContain("ROLE_MAPPING");
  });

  it("without Identity nobody signs in through it", () => {
    const compose = file(build({ products: ["vpn"], signIn: "identity" }), "compose.yaml");
    expect(compose).not.toContain("OIDC_");
  });

  it("with the reader's own proxy each product gets a local port, and TCP VPN takes 443", () => {
    const out = build({ proxy: "own", vpnTcp: true });
    const compose = file(out, "compose.yaml");
    expect(compose).toContain('"127.0.0.1:8081:8080"');
    expect(compose).toContain('"127.0.0.1:8082:8080"');
    expect(compose).toContain('"443:443/tcp"');
    expect(compose).not.toContain("caddy");
    expect(out.files.map((f) => f.name)).not.toContain("Caddyfile");
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
      const conf = file(out, `openasy-${proxy}.conf`);
      for (const [name, port] of [["id.example.com", 8081], ["vpn.example.com", 8082], ["auth.example.com", 8180]] as const) {
        expect(conf).toContain(proxy === "nginx" ? `server_name ${name};` : `ServerName ${name}`);
        expect(conf).toContain(`http://127.0.0.1:${port}`);
      }
      // Identity builds its URLs from the scheme the proxy passes on.
      expect(conf).toContain(proxy === "nginx" ? "X-Forwarded-Proto $scheme" : "X-Forwarded-Proto \"expr=%{REQUEST_SCHEME}\"");
      expect(out.steps.some((s) => s.code?.includes(`sudo certbot --${proxy} -d id.example.com -d vpn.example.com -d auth.example.com`))).toBe(true);
      expect(out.hosts).toEqual(["id.example.com", "vpn.example.com", "auth.example.com"]);
    }
  });

  it("lists every volume and secret a service uses", () => {
    const compose = file(build({ products: [...INSTALLABLE], signIn: "keycloak", vpnTcp: true }), "compose.yaml");
    const [services, rest] = compose.split("\nvolumes:\n");
    const declared = rest!.split("\nsecrets:\n")[0]!.split("\n").map((l) => l.trim().replace(/:$/, ""));
    for (const [, v] of services!.matchAll(/^ {6}- ([a-z-]+):\//gm)) expect(declared).toContain(v);
    expect(compose).toContain("  openasy-agent-kek:\n    file: ./openasy-agent-kek");
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
});
