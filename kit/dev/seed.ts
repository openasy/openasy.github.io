// Sample data for the dev setup, so every page has something to show: events, findings, scans, runs and records sent
// through each product's own API, as a script or CI job would. setup.ts runs it at the end; run it again with
//   docker compose run --rm --no-deps setup node setup/seed.ts
// Each product is filled once and remembered in secrets/dev.json; a product that fails is said so and tried next time.
// Everything here is made up: example.com names, documentation addresses and fake keys.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const STATE = "secrets/dev.json";
const PRODUCTS: Array<{ service: string }> = JSON.parse(readFileSync("setup/products.json", "utf8"));
type State = { tokens: Record<string, string>; seeded?: string[] };
const load = (): State => JSON.parse(readFileSync(STATE, "utf8"));
if (!existsSync(STATE)) throw new Error(`No ${STATE}: run setup first (docker compose up -d && docker compose logs -f setup)`);

const NOW = Date.now();
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
/** An ISO time `ms` before now. */
const ago = (ms: number) => new Date(NOW - ms).toISOString();
const day = (n: number) => ago(n * DAY).slice(0, 10);
const pick = <T>(xs: T[], i: number) => xs[i % xs.length]!;
const sha = (s: string) => createHash("sha256").update(s).digest("hex");

type Call = <T = any>(path: string, body?: unknown, opts?: { method?: string; type?: string; auth?: string; again?: boolean }) => Promise<T>;
/** A client for one product inside the compose network, with the owner's API token that setup made. */
function client(service: string, token: string): Call {
  return async (path, body, opts = {}) => {
    const res = await fetch(`http://${service}:8080${path}`, {
      method: opts.method ?? (body === undefined ? "GET" : "POST"),
      headers: {
        authorization: opts.auth ?? `Bearer ${token}`,
        ...(body !== undefined && { "content-type": opts.type ?? "application/json" }),
      },
      body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
    });
    const text = await res.text();
    // again: made by an earlier run that stopped half way, so it is there already.
    if (res.status === 409 && opts.again) return undefined as never;
    if (!res.ok) throw new Error(`${res.status} ${path}: ${text.slice(0, 300)}`);
    return (text ? JSON.parse(text) : undefined) as never;
  };
}

/** SARIF 2.1.0, as opengrep, gitleaks, ZAP and Trivy write it. */
const sarif = (tool: string, results: unknown[]) => ({ version: "2.1.0", runs: [{ tool: { driver: { name: tool, rules: [] } }, results }] });
const at = (uri: string, line?: number, code?: string) => [
  { physicalLocation: { artifactLocation: { uri }, ...(line && { region: { startLine: line, ...(code && { snippet: { text: code } }) } }) } },
];
const cyclonedx = (components: Array<[string, string]>) => ({
  bomFormat: "CycloneDX",
  specVersion: "1.5",
  components: components.map(([name, version]) => ({ type: "library", name, version, purl: `pkg:npm/${name}@${version}` })),
});

const SEEDS: Record<string, (call: Call) => Promise<string>> = {
  async vpn(call) {
    for (const name of ["Backend engineers", "Support"]) await call("/api/v1/groups", { name }, { again: true });
    await call(
      "/api/v1/ip-groups",
      { name: "Internal services", networks: [{ cidr: "10.20.0.0/16", ports: "tcp/443, 5432" }], allowedGroups: ["Backend engineers"] },
      { again: true },
    );
    const people: Array<[string, string, string[]]> = [
      ["Dana Kim", "dana@example.com", ["Backend engineers"]],
      ["Ali Demir", "ali@example.com", ["Backend engineers"]],
      ["Sam Lee", "sam@example.com", ["Support"]],
    ];
    for (const [name, email, groups] of people) await call("/api/v1/people", { name, email, groups }, { again: true });
    return "3 people, 2 groups, an IP group";
  },

  async vulns(call) {
    const images: Array<[string, Array<[string, string]>]> = [
      [
        "ghcr.io/acme/shop:1.4.2",
        [
          ["lodash", "4.17.20"],
          ["minimist", "1.2.5"],
          ["express", "4.17.1"],
          ["axios", "0.21.1"],
        ],
      ],
      [
        "ghcr.io/acme/billing:2.0.1",
        [
          ["jsonwebtoken", "8.5.1"],
          ["express", "4.18.2"],
        ],
      ],
    ];
    for (const [name, deps] of images) await call(`/api/v1/sboms?kind=image&name=${encodeURIComponent(name)}`, cyclonedx(deps));
    return "SBOMs of 2 images, matched once the vulnerability data is in";
  },

  async logs(call) {
    // The token is shown once: a source from an earlier run gets a new one.
    let token = (await call<{ token: string } | undefined>("/api/v1/sources", { name: "shop-api", kind: "http" }, { again: true }))?.token;
    if (!token) {
      const { sources } = await call<{ sources: Array<{ id: string; name: string }> }>("/api/v1/sources");
      token = (await call<{ token: string }>(`/api/v1/sources/${sources.find((x) => x.name === "shop-api")!.id}/token`, {})).token;
    }
    const paths = ["/api/cart", "/api/checkout", "/api/products", "/api/login", "/healthz"];
    const lines = Array.from({ length: 300 }, (_, i) => {
      const status = i % 37 === 0 ? 500 : i % 11 === 0 ? 404 : 200;
      return JSON.stringify({
        time: ago(i * 4 * 60_000),
        level: status === 500 ? "error" : status === 404 ? "warn" : "info",
        message: status === 500 ? "payment provider timed out" : `${pick(["GET", "POST"], i)} ${pick(paths, i)} ${status}`,
        service: "shop-api",
        host: pick(["web-1", "web-2"], i),
        status,
        duration_ms: 20 + ((i * 37) % 400),
      });
    });
    await call("/api/v1/ingest/jsonline", lines.join("\n"), { type: "application/x-ndjson", auth: `Bearer ${token}` });
    return "300 lines from shop-api over 20 hours";
  },

  async siem(call) {
    await call(
      "/api/v1/rules",
      {
        source:
          "title: Failed SSH login\nlevel: medium\ndetection:\n  selection:\n    source: sshd\n    message|contains: 'Failed password'\n  condition: selection",
      },
      { again: true },
    );
    await call(
      "/api/v1/rules",
      {
        source: "title: Sudo to root\nlevel: high\ndetection:\n  selection:\n    source: sudo\n    message|contains: 'USER=root'\n  condition: selection",
      },
      { again: true },
    );
    const events = Array.from({ length: 120 }, (_, i) => {
      const kind = i % 10;
      const ip = `203.0.113.${(i * 7) % 50}`;
      return {
        time: ago(i * 12 * 60_000),
        host: pick(["web-1", "web-2", "db-1"], i),
        source: kind < 6 ? "sshd" : kind < 8 ? "sudo" : "nginx",
        message:
          kind < 5
            ? `Failed password for root from ${ip} port 51022 ssh2`
            : kind === 5
              ? `Accepted publickey for deploy from 198.51.100.4 port 40112 ssh2`
              : kind < 8
                ? "deploy : TTY=pts/0 ; PWD=/srv ; USER=root ; COMMAND=/usr/bin/systemctl restart shop"
                : `GET /wp-login.php 404 from ${ip}`,
        ip,
      };
    });
    await call("/api/v1/events", events);
    return "2 rules, 120 events over a day";
  },

  async audit(call) {
    const vuln = (id: string, summary: string, cvss: string, fixed: string) => ({
      id,
      summary,
      severity: [{ type: "CVSS_V3", score: cvss }],
      affected: [{ ranges: [{ type: "SEMVER", events: [{ introduced: "0" }, { fixed }] }] }],
    });
    const osv = {
      results: [
        {
          source: { path: "package-lock.json", type: "lockfile" },
          packages: [
            {
              package: { name: "lodash", version: "4.17.20", ecosystem: "npm" },
              vulnerabilities: [vuln("GHSA-35jh-r3h4-6jhm", "Command injection in lodash", "CVSS:3.1/AV:N/AC:L/PR:H/UI:N/S:U/C:H/I:H/A:H", "4.17.21")],
            },
            {
              package: { name: "minimist", version: "1.2.5", ecosystem: "npm" },
              vulnerabilities: [vuln("GHSA-xvch-5gv4-984h", "Prototype pollution in minimist", "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H", "1.2.6")],
            },
            { package: { name: "express", version: "4.18.2", ecosystem: "npm" }, vulnerabilities: [] },
          ],
        },
      ],
    };
    for (const branch of ["main", "feature/checkout"])
      await call(`/api/v1/scans?project=acme/shop&branch=${encodeURIComponent(branch)}&commit=${sha(branch).slice(0, 40)}&defaultBranch=main`, osv);
    return "scans of acme/shop on main and a branch";
  },

  async sast(call) {
    const log = sarif("opengrep", [
      {
        ruleId: "javascript.lang.security.audit.eval-detected",
        level: "error",
        message: { text: "eval() of input from the request" },
        locations: at("src/api/report.js", 42, "eval(req.query.expr)"),
      },
      {
        ruleId: "javascript.express.security.injection.tainted-sql-string",
        level: "error",
        message: { text: "SQL built from request input" },
        locations: at("src/api/orders.js", 18, "db.query(`SELECT * FROM orders WHERE id = ${req.params.id}`)"),
      },
      {
        ruleId: "javascript.lang.security.insecure-random",
        level: "warning",
        message: { text: "Math.random() used for a token" },
        locations: at("src/auth/reset.js", 9, "const token = Math.random().toString(36)"),
      },
      {
        ruleId: "javascript.express.security.audit.xss.direct-response-write",
        level: "note",
        message: { text: "Response written from input" },
        locations: at("src/api/search.js", 27),
      },
    ]);
    await call(`/api/v1/scans?repository=acme/shop&branch=main&commit=${sha("sast").slice(0, 40)}&defaultBranch=main`, log);
    return "an opengrep scan of acme/shop with 4 findings";
  },

  async secrets(call) {
    const log = sarif("gitleaks", [
      {
        ruleId: "aws-access-key",
        level: "error",
        message: { text: "AWS access key" },
        locations: at("config/dev.env", 3, "AWS_ACCESS_KEY_ID=AKIA****************"),
      },
      {
        ruleId: "generic-api-key",
        level: "warning",
        message: { text: "Generic API key" },
        locations: at("src/payments/client.js", 12, "apiKey: 'sk_test_****'"),
      },
      { ruleId: "private-key", level: "error", message: { text: "Private key" }, locations: at("deploy/old/id_rsa", 1, "-----BEGIN RSA PRIVATE KEY-----") },
    ]);
    await call(`/api/v1/scans?repository=acme/shop&branch=main&commit=${sha("secrets").slice(0, 40)}&defaultBranch=main`, log);
    return "a gitleaks scan of acme/shop with 3 findings";
  },

  async dast(call) {
    await call("/api/v1/targets", { name: "shop-staging", url: "https://shop-staging.example.com/" }, { again: true });
    const zap = (ruleId: string, level: string, text: string, path: string, score?: number) => ({
      ruleId,
      level,
      message: { text },
      properties: score ? { "security-severity": String(score) } : {},
      locations: [{ physicalLocation: { artifactLocation: { uri: `https://shop-staging.example.com${path}` } } }],
    });
    const log = sarif("ZAP", [
      zap("40012", "error", "Cross Site Scripting (Reflected)", "/search?q=test", 7.4),
      zap("10202", "warning", "Absence of Anti-CSRF Tokens", "/account/settings"),
      zap("10038", "warning", "Content Security Policy header not set", "/"),
      zap("10035", "note", "Strict-Transport-Security header not set", "/"),
    ]);
    await call("/api/v1/scans?target=shop-staging", log);
    return "a ZAP scan of shop-staging with 4 findings";
  },

  async posture(call) {
    await call("/api/v1/targets", { name: "prod-cluster", kind: "kubernetes" }, { again: true });
    const ksv = (ruleId: string, kind: string, text: string, resource: string, level = "error") => ({
      ruleId,
      kind,
      level,
      message: { text },
      properties: { resource },
      locations: [{ physicalLocation: { artifactLocation: { uri: "manifest.yaml" } } }],
    });
    const log = sarif("Trivy", [
      ksv("KSV017", "fail", "Container should not be privileged", "Deployment/shop/shop-api"),
      ksv("KSV001", "fail", "Process can elevate its own privileges", "Deployment/shop/shop-worker", "warning"),
      ksv("KSV012", "fail", "Runs as root user", "Deployment/billing/billing"),
      ksv("KSV003", "pass", "Default capabilities dropped", "Deployment/shop/shop-api", "note"),
      ksv("KSV014", "pass", "Root file system is read-only", "Deployment/billing/billing", "note"),
    ]);
    await call("/api/v1/scans?target=prod-cluster", log);
    return "a Trivy scan of prod-cluster: 3 failed, 2 passed";
  },

  async malware(call) {
    await call("/api/v1/reports", {
      scanner: "clamscan 1.4",
      engine: "clamav",
      source: { kind: "host", name: "web" },
      scannedFiles: 18240,
      detections: [
        { path: "/tmp/eicar.com", signature: "Eicar-Test-Signature", sha256: "275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f", size: 68 },
      ],
    });
    await call("/api/v1/reports", { scanner: "clamscan 1.4", engine: "clamav", source: { kind: "host", name: "db" }, scannedFiles: 9310, detections: [] });
    return "clamscan reports of web (the EICAR test file) and db";
  },

  async incidents(call) {
    const had = (await call<{ incidents: Array<{ title: string }> }>("/api/v1/incidents")).incidents;
    if (had.some((i) => i.title === "Checkout fails after the 1.4.2 deploy")) return "already there";
    const open = await call<{ id: string }>("/api/v1/incidents", {
      title: "Checkout fails after the 1.4.2 deploy",
      severity: "high",
      commander: "Dana Kim",
      summary: "About 4% of checkouts end with a 500 since 1.4.2; the payment provider times out.",
      products: ["errors", "logs"],
    });
    for (const text of ["Errors shows a new TypeError in checkout since 1.4.2.", "Rolled back web-2 to 1.4.1; errors there stopped."])
      await call(`/api/v1/incidents/${open.id}/timeline`, { text });
    await call(`/api/v1/incidents/${open.id}/tasks`, { title: "Roll back web-1", owner: "Ali Demir" });
    await call(`/api/v1/incidents/${open.id}/tasks`, { title: "Add a timeout test for the payment client", owner: "Dana Kim", due: day(-3) });
    await call("/api/v1/incidents", {
      title: "Failed SSH logins from one address",
      severity: "medium",
      summary: "SIEM matched Failed SSH login on web-1 many times from 203.0.113.0/24.",
      products: ["siem"],
    });
    return "2 incidents with a timeline and tasks";
  },

  async errors(call) {
    // The key is shown once: a project from an earlier run gets a new one.
    let key = (await call<{ key: string } | undefined>("/api/v1/projects", { name: "shop-web" }, { again: true }))?.key;
    if (!key) {
      const { projects } = await call<{ projects: Array<{ id: string; name: string }> }>("/api/v1/projects");
      key = (await call<{ key: string }>(`/api/v1/projects/${projects.find((x) => x.name === "shop-web")!.id}/key`, {})).key;
    }
    const frames = (file: string, fn: string, line: number) => [
      { filename: "node_modules/react-dom/cjs/react-dom.production.min.js", function: "commitRoot", lineno: 5321, in_app: false },
      { filename: file, function: fn, lineno: line, in_app: true },
    ];
    const kinds = [
      { type: "TypeError", value: "Cannot read properties of undefined (reading 'total')", frames: frames("src/checkout/Summary.tsx", "Summary", 48) },
      { type: "ReferenceError", value: "analytics is not defined", frames: frames("src/lib/track.ts", "track", 12) },
      { type: "Error", value: "Request failed with status code 502", frames: frames("src/api/client.ts", "request", 77) },
    ];
    for (let i = 0; i < 60; i++) {
      const e = kinds[i % 7 === 0 ? 2 : i % 3 === 0 ? 1 : 0]!;
      await call(
        "/api/v1/events",
        {
          timestamp: ago(i * 25 * 60_000),
          level: "error",
          exception: e,
          release: i < 40 ? "1.4.2" : "1.4.1",
          environment: "production",
          user: { id: `u-${(i * 13) % 23}` },
          request: { url: "https://shop.example.com/checkout", method: "POST" },
          tags: { browser: pick(["Chrome 141", "Firefox 144", "Safari 26"], i) },
        },
        { auth: `Bearer ${key}` },
      );
    }
    return "60 events in 3 issues of shop-web";
  },

  async "supply-chain"(call) {
    const digest = (s: string) => `sha256:${sha(s)}`;
    await call(`/api/v1/images?name=ghcr.io/acme/shop&digest=${digest("shop")}`, {
      sbom: cyclonedx([
        ["express", "4.18.2"],
        ["lodash", "4.17.21"],
      ]),
      signature: {
        verified: true,
        identity: "https://github.com/acme/shop/.github/workflows/release.yml@refs/tags/v1.4.2",
        issuer: "https://token.actions.githubusercontent.com",
      },
      provenance: { builder: "https://github.com/actions/runner", sourceRepo: "https://github.com/acme/shop", sourceCommit: sha("c1").slice(0, 40), level: 3 },
    });
    await call(`/api/v1/images?name=docker.io/library/redis&digest=${digest("redis")}`, { signature: { verified: false } });
    return "2 images: one signed with provenance, one not";
  },

  async certificates(call) {
    // Real certificates: Caddy's local CA, which setup copied, and, when Docker is at hand as it is during setup, the
    // intermediate and the certificate Caddy serves for each product, which end within hours.
    await call("/api/v1/certificates", { pem: readFileSync("config/caddy-root.crt", "utf8"), source: "caddy" });
    try {
      const pem = execFileSync(
        "docker",
        ["compose", "exec", "-T", "caddy", "sh", "-c", "cat /data/caddy/pki/authorities/local/intermediate.crt /data/caddy/certificates/local/*/*.crt"],
        { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
      );
      await call("/api/v1/certificates", { pem, source: "caddy" });
      return "Caddy's local CA and the certificates it serves";
    } catch {
      return "Caddy's local CA";
    }
  },

  async uptime(call) {
    // Checks from an earlier run that stopped half way are used again.
    const had = (await call<{ checks: Array<{ id: string; name: string }> }>("/api/v1/checks")).checks;
    const checks: Array<{ id: string }> = [];
    for (const [name, target, group] of [
      ["Shop", "https://shop.example.com", "Customer"],
      ["API", "https://api.example.com/healthz", "Customer"],
      ["Status page", "https://status.example.com", "Internal"],
    ])
      checks.push(
        had.find((c) => c.name === name) ??
          (await call("/api/v1/checks", { name, group, type: "http", target, expect: { status: 200 }, intervalSeconds: 300, public: group === "Customer" })),
      );
    // A day of results every 5 minutes, sent as a runner would; the API had an outage of half an hour this morning.
    const results = checks.flatMap((c, n) =>
      Array.from({ length: 288 }, (_, i) => {
        const down = n === 1 && i >= 60 && i < 66;
        return {
          checkId: c.id,
          ok: !down,
          time: ago(i * 5 * 60_000),
          latencyMs: 80 + ((i * 31 + n * 17) % 220),
          ...(down && { detail: "HTTP 503" }),
          location: "eu-1",
        };
      }),
    );
    for (let i = 0; i < results.length; i += 500) await call("/api/v1/results", { results: results.slice(i, i + 500) });
    return "3 checks with a day of results and a short outage";
  },

  async backups(call) {
    await call(
      "/api/v1/jobs",
      {
        name: "db",
        tool: "restic",
        source: "db:/var/lib/postgresql",
        location: "s3:backups/db",
        cadenceHours: 24,
        rpoHours: 26,
        retention: "7 daily, 4 weekly",
        owner: "Dana Kim",
      },
      { again: true },
    );
    await call(
      "/api/v1/jobs",
      { name: "files", tool: "restic", source: "web:/srv/uploads", location: "s3:backups/files", cadenceHours: 24, rpoHours: 26, owner: "Ali Demir" },
      { again: true },
    );
    await call(
      "/api/v1/jobs",
      { name: "cluster", tool: "velero", source: "prod-cluster", location: "s3:backups/velero", cadenceHours: 24, rpoHours: 48 },
      { again: true },
    );
    for (let d = 7; d >= 0; d--) {
      const start = NOW - d * DAY - 2 * HOUR;
      const run = (job: string, minutes: number, extra: object = {}) =>
        call("/api/v1/runs", {
          job,
          startedAt: new Date(start).toISOString(),
          endedAt: new Date(start + minutes * 60_000).toISOString(),
          status: "success",
          sizeBytes: 5_000_000_000 + d * 1_000_000,
          ...extra,
        });
      await run("db", 20);
      // files stopped two days ago: the job is late.
      if (d >= 2) await run("files", 8);
      await run("cluster", 12, d < 2 ? { status: "failed", error: "BackupStorageLocation is unavailable" } : {});
    }
    await call("/api/v1/restore-tests", { job: "db", testedAt: ago(3 * DAY), ok: true, durationSeconds: 340, verifiedBy: "automated" });
    return "3 jobs: db healthy, files late, cluster failing";
  },

  async risk(call) {
    // Risks and vendors from an earlier run that stopped half way are not added twice.
    const risks = new Set((await call<{ risks: Array<{ title: string }> }>("/api/v1/risks")).risks.map((r) => r.title));
    const vendors = new Set((await call<{ vendors: Array<{ name: string }> }>("/api/v1/vendors")).vendors.map((v) => v.name));
    const risk = (body: { title: string } & Record<string, unknown>) => (risks.has(body.title) ? undefined : call("/api/v1/risks", body));
    const vendor = (body: { name: string } & Record<string, unknown>) => (vendors.has(body.name) ? undefined : call("/api/v1/vendors", body));
    await risk({
      title: "Customer data in an unencrypted backup",
      category: "security",
      likelihood: 3,
      impact: 5,
      residualLikelihood: 2,
      residualImpact: 4,
      owner: "Dana Kim",
      treatment: "mitigate",
      plan: "Encrypt the files bucket and rotate its keys.",
    });
    await risk({ title: "Payment provider outage", category: "vendor", likelihood: 2, impact: 4, owner: "Ali Demir", treatment: "transfer" });
    await risk({ title: "Late KVKK data subject requests", category: "compliance", likelihood: 2, impact: 3, treatment: "accept" });
    await vendor({
      name: "Example Payments",
      service: "Card payments",
      dataClasses: ["personal", "financial"],
      criticality: "critical",
      status: "active",
      questionnaire: "reviewed",
      rating: "low",
    });
    await vendor({
      name: "Example Mail",
      service: "Transactional email",
      dataClasses: ["personal"],
      criticality: "medium",
      status: "onboarding",
      questionnaire: "sent",
    });
    return "3 risks and 2 vendors";
  },

  async "threat-intel"(call) {
    await call("/api/v1/feeds", { name: "Dev feed", kind: "manual", defaultSeverity: "high", defaultTlp: "amber" }, { again: true });
    const indicators: Array<[string, string, string]> = [
      ["203.0.113.66", "SSH brute force source", "high"],
      ["198.51.100.23", "Scanner seen on many installs", "medium"],
      ["login-acme-shop.example.net", "Phishing domain copying the shop", "critical"],
      ["275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f", "EICAR test file", "low"],
    ];
    for (const [value, description, severity] of indicators)
      await call("/api/v1/indicators", { feed: "Dev feed", value, description, severity }, { again: true });
    return "a feed with 4 indicators";
  },

  async cost(call) {
    const services: Array<[string, string, number]> = [
      ["Amazon EC2", "shop", 42],
      ["Amazon RDS", "shop", 18],
      ["Amazon S3", "data", 6],
      ["AWS Lambda", "billing", 3],
    ];
    const lines = [];
    for (let d = 30; d >= 1; d--)
      for (const [service, team, base] of services) {
        // EC2 jumped four days ago: an anomaly to explain.
        const amount = Math.round((base + ((d * 7) % 5) + (service === "Amazon EC2" && d <= 4 ? 35 : 0)) * 100) / 100;
        lines.push({ date: day(d), provider: "aws", account: "111122223333", service, region: "eu-central-1", amount, currency: "USD", tags: { team } });
      }
    await call("/api/v1/records", lines);
    await call("/api/v1/budgets", { name: "Shop", scope: "team", value: "shop", amount: 2000 }, { again: true });
    await call("/api/v1/budgets", { name: "Billing", scope: "team", value: "billing", amount: 150 }, { again: true });
    return "30 days of AWS spend for 3 teams, and 2 budgets";
  },
};

const state = load();
const done = new Set(state.seeded ?? []);
let failed = 0;
for (const { service } of PRODUCTS) {
  const seed = SEEDS[service];
  if (!seed || done.has(service)) continue;
  const token = state.tokens[service];
  if (!token) {
    console.log(`  ${service}: no API token yet; run setup first`);
    continue;
  }
  try {
    console.log(`  ${service}: ${await seed(client(service, token))}`);
    done.add(service);
    // Read again before writing: setup may have added to the file.
    writeFileSync(STATE, JSON.stringify({ ...load(), seeded: [...done] }, null, 2), { mode: 0o600 });
  } catch (err) {
    failed++;
    console.log(`  ${service}: not filled, tried again next time: ${(err as Error).message}`);
  }
}
if (failed) console.log(`  ${failed} product(s) not filled: run again with docker compose run --rm --no-deps setup node setup/seed.ts`);
