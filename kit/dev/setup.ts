// Wires the OpenAsy dev setup together, once, from inside its setup container: it starts the products after Caddy's
// local CA exists, makes an owner in each, Identity's groups and applications, a VPN server, Infrastructure's and Logs'
// agents and their two demo servers, then starts everything again with sign-in through Identity. Sample data is
// seed.ts, run only when asked. Safe to run again: it skips what is done (docker compose up -d setup). It runs
// from the folder that holds compose.yaml. Written for the dev setup from openasy.github.io/install; not for production.
import { execFileSync } from "node:child_process";
import { createHmac } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const STATE = "keys/setup-state.json";
const EMAIL = "dev@openasy.localhost";
const PASSWORD = "openasy dev password";
const ROLES = ["openasy-admins", "openasy-editors", "openasy-viewers"];

// Each product is a file in products/, with its containers, their settings and their secrets (ADR 0054). A container
// setup needs to know of says so on an x-openasy line: a product's address and Identity template, and which of its
// keys take a value setup makes, such as an agent's enrolment token, which setup then writes on that line.
interface Product {
  service: string;
  url: string;
  file: string;
  template?: string;
}
type Target = { file: string; service: string; key: string };
const SERVICE = /^ {2}([a-z0-9][a-z0-9-]*):\s*$/;
const FILES = [...readFileSync("compose.yaml", "utf8").matchAll(/^ {2}- \{ path: (products\/[a-z0-9-]+\.yaml)/gm)].map((m) => m[1]!);
const PRODUCTS: Product[] = [];
const TARGETS: Record<string, Target[]> = {};
for (const file of FILES) {
  let service = "";
  for (const line of readFileSync(file, "utf8").split("\n")) {
    service = SERVICE.exec(line)?.[1] ?? service;
    const x = /^ {4}x-openasy: (\{.*\})/.exec(line.replace(/\s{2,}#.*$/, ""));
    if (!x) continue;
    const meta = JSON.parse(x[1]!) as { url?: string; template?: string; fills?: Record<string, string> };
    if (meta.url) PRODUCTS.push({ service, url: meta.url, file, ...(meta.template && { template: meta.template }) });
    for (const [key, name] of Object.entries(meta.fills ?? {})) (TARGETS[name] ??= []).push({ file, service, key });
  }
}
// Identity first: every other product signs in through it.
PRODUCTS.sort((a, b) => Number(b.service === "identity") - Number(a.service === "identity"));
const byName = (s: string) => PRODUCTS.find((p) => p.service === s)!;

mkdirSync("keys", { recursive: true });
type State = { totp: Record<string, string>; tokens: Record<string, string> };
const state: State = existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : { totp: {}, tokens: {} };
const save = () => writeFileSync(STATE, JSON.stringify(state, null, 2), { mode: 0o600 });

/** A value as YAML reads it back as the same text, and compose leaves alone: anything unusual is quoted, $ doubled. */
const yamlValue = (v: string) =>
  /^[A-Za-z0-9_./@+=,~][A-Za-z0-9_./@+=,~:-]*( [A-Za-z0-9_./@+=,~:-]+)*$/.test(v) &&
  !/:( |$)/.test(v) &&
  !/^(true|false|yes|no|on|off|null|[-+]?[0-9][0-9._]*(e[0-9]+)?)$/i.test(v)
    ? v
    : JSON.stringify(v).replaceAll("$", () => "$$");
const yamlText = (v: string) =>
  v.startsWith('"') ? (JSON.parse(v) as string).replaceAll("$$", "$") : v.startsWith("'") ? v.slice(1, -1).replaceAll("''", "'") : v;
/** The lines of one service in its file: from its name to the next service or section. */
const block = (lines: string[], service: string) => {
  const start = lines.findIndex((l) => l === `  ${service}:`);
  if (start < 0) throw new Error(`no ${service} in its file`);
  let end = start + 1;
  while (end < lines.length && !/^ {0,2}[a-z]/.test(lines[end]!)) end++;
  return { start, end };
};
/** One key of a service's environment, or undefined when it is not set. */
const readKey = (t: Target) => {
  const lines = readFileSync(t.file, "utf8").split("\n");
  const { start, end } = block(lines, t.service);
  const line = lines.slice(start, end).find((l) => l.startsWith(`      ${t.key}: `));
  const v =
    line &&
    yamlText(
      line
        .slice(t.key.length + 8)
        .replace(/\s{2,}#.*$/, "")
        .trim(),
    );
  return v ? v : undefined;
};
/** Sets a key of a service's environment, in place of its line or its commented-out example, read again before each write. */
const writeKey = (t: Target, value: string) => {
  const lines = readFileSync(t.file, "utf8").replace(/\n$/, "").split("\n");
  const { start, end } = block(lines, t.service);
  const at = lines.findIndex((l, i) => i > start && i < end && (l.startsWith(`      ${t.key}:`) || l.startsWith(`      # ${t.key}:`)));
  const line = `      ${t.key}: ${yamlValue(value)}`;
  if (at >= 0) lines[at] = line;
  else {
    const env = lines.findIndex((l, i) => i > start && i < end && l === "    environment:");
    if (env < 0) lines.splice(end, 0, "    environment:", line);
    else {
      let last = env + 1;
      while (last < end && /^ {6}/.test(lines[last]!)) last++;
      lines.splice(last, 0, line);
    }
  }
  writeFileSync(t.file, `${lines.join("\n")}\n`, { mode: 0o600 });
};
const env = { get: (name: string) => (TARGETS[name]?.[0] ? readKey(TARGETS[name]![0]!) : undefined) };
const setEnv = (name: string, value: string) => {
  if (!TARGETS[name]) throw new Error(`No x-openasy line in products/ takes ${name}`);
  for (const t of TARGETS[name]!) writeKey(t, value);
};

const compose = (...args: string[]) =>
  execFileSync("docker", ["compose", "--profile", "wired", ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const step = (s: string) => console.log(`\n▸ ${s}`);

function totp(secret: string, at = Date.now()) {
  const bits = [...secret].map((c) => "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".indexOf(c).toString(2).padStart(5, "0")).join("");
  const key = Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(at / 30_000)));
  const mac = createHmac("sha1", key).update(counter).digest();
  return String((mac.readUInt32BE(mac[19]! & 15) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}

async function ready(p: Product) {
  for (let i = 0; i < 180; i++) {
    if (
      await fetch(`http://${p.service}:8080/healthz`).then(
        (r) => r.ok,
        () => false,
      )
    )
      return;
    await sleep(1000);
  }
  throw new Error(`${p.service} did not start: docker compose logs ${p.service}`);
}

/** A client for one product, inside the compose network: the owner's API token once it exists, a session before. */
/** Calls a product with its admin token, or, with session, signed in as the owner, for what a token may not do. */
function client(p: Product, session = false) {
  const jar = new Map<string, string>();
  return async <T = any>(path: string, body?: unknown, method?: string): Promise<T> => {
    const token = session ? undefined : state.tokens[p.service];
    const verb = method ?? (body === undefined ? "GET" : "POST");
    const send = () =>
      fetch(`http://${p.service}:8080${path}`, {
        method: verb,
        headers: {
          origin: p.url,
          ...(token ? { authorization: `Bearer ${token}` } : { cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; ") }),
          ...(body !== undefined && { "content-type": "application/json" }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    // A product that setup just started again may close the connection while it comes up: ask again, for a minute.
    let res: Response | undefined;
    for (let i = 0; !res; i++) {
      try {
        res = await send();
      } catch (err) {
        if (i >= 30) throw err;
        await sleep(2000);
      }
    }
    for (const c of res.headers.getSetCookie()) jar.set(c.slice(0, c.indexOf("=")), c.slice(c.indexOf("=") + 1, c.indexOf(";")));
    const text = await res.text();
    if (!res.ok) throw new Error(`${p.service} ${verb} ${path}: ${res.status} ${text}`);
    return (text ? JSON.parse(text) : undefined) as T;
  };
}

/** The owner, from the one-time link in the product's log, with an authenticator app and an API token for this script. */
async function owner(p: Product) {
  await ready(p);
  if (state.tokens[p.service]) return client(p);
  const call = client(p);
  const line = compose("logs", "--no-log-prefix", p.service)
    .split("\n")
    .find((l) => l.includes("no owner yet"));
  const link = line && /"url":"([^"]+)"/.exec(line)?.[1];
  if (!link)
    throw new Error(
      `${p.service}: no one-time owner link in its log, and no token in ${STATE}. Start over: docker compose --profile wired down -v, and unzip again`,
    );
  await call("/api/v1/auth/setup", { token: new URL(link).searchParams.get("setup"), name: "Dev", email: EMAIL, password: PASSWORD });
  const { secret } = await call<{ secret: string }>("/api/v1/auth/me/totp", {});
  await call("/api/v1/auth/me/totp/confirm", { code: totp(secret) });
  state.totp[p.service] = secret;
  state.tokens[p.service] = (await call<{ token: string }>("/api/v1/auth/tokens", { name: "dev setup", role: "admin" })).token;
  save();
  console.log(`  ${p.service}: owner ${EMAIL}`);
  return client(p);
}

step("Waiting for Caddy's local CA");
for (let i = 0; ; i++) {
  try {
    compose("exec", "-T", "caddy", "test", "-f", "/data/caddy/pki/authorities/local/root.crt");
    break;
  } catch {
    if (i > 60) throw new Error("Caddy made no local CA: docker compose logs caddy");
    await sleep(1000);
  }
}
// The products run as a non-root user: they may read the root certificate, never the CA's keys.
compose(
  "exec",
  "-T",
  "caddy",
  "sh",
  "-c",
  "cd /data/caddy/pki/authorities/local && chmod o+x /data/caddy/pki /data/caddy/pki/authorities . && chmod o+r root.crt",
);
compose("cp", "caddy:/data/caddy/pki/authorities/local/root.crt", "config/caddy-root.crt");

step("Starting the products");
compose("up", "-d", ...PRODUCTS.map((p) => p.service), "vulns-agent");

step("Owners");
const api: Record<string, ReturnType<typeof client>> = {};
for (const p of PRODUCTS) api[p.service] = await owner(p);

step("Identity: groups and applications");
const id = api.identity!;
const groups = (await id<{ groups: Array<{ id: string; name: string }> }>("/api/v1/groups")).groups;
const me = (await id<{ people: Array<{ id: string; email: string }> }>("/api/v1/people")).people.find((x) => x.email === EMAIL)!;
for (const name of ROLES) {
  const g = groups.find((x) => x.name === name) ?? (await id<{ id: string; name: string }>("/api/v1/groups", { name }));
  if (name === "openasy-admins") await id(`/api/v1/groups/${g.id}/members`, { userIds: [me.id] }, "PUT");
}
const apps = (await id<{ applications: Array<{ name: string }> }>("/api/v1/applications")).applications;
for (const p of PRODUCTS.filter((x) => x.service !== "identity")) {
  const own = (key: string) => ({ file: p.file, service: p.service, key });
  if (apps.some((a) => a.name === p.service) && readKey(own("OPENASY_OIDC_CLIENT_SECRET"))) continue;
  // A product with a template in Identity is added from it; any other as an OpenID Connect application.
  const body = p.template
    ? { name: p.service, template: p.template, url: p.url, everyone: true }
    : {
        name: p.service,
        template: "oidc",
        // A provider set in the environment has the id sso (@openasy/auth).
        redirectUris: [`${p.url}/api/v1/auth/oidc/sso/callback`],
        postLogoutRedirectUris: [p.url],
        everyone: true,
      };
  const r = await id<{ application: { id: string }; clientSecret: string }>("/api/v1/applications", body);
  // In the product's own environment, so each product sees only its own secret.
  writeKey(own("OPENASY_OIDC_ISSUER"), byName("identity").url);
  writeKey(own("OPENASY_OIDC_CLIENT_ID"), r.application.id);
  writeKey(own("OPENASY_OIDC_CLIENT_SECRET"), r.clientSecret);
  console.log(`  ${p.service}: signs in through Identity`);
}

step("VPN: a server");
if (!env.get("VPN_ENROLL_TOKEN")) setEnv("VPN_ENROLL_TOKEN", (await api.vpn!<{ enrollToken: string }>("/api/v1/servers", { id: "local" })).enrollToken);

// Infrastructure, Logs and SIEM each read the servers with an agent of their own, with its own CA.
const AGENTS = [
  { product: "infra", service: "infra-agent", token: "INFRA_ENROLL_TOKEN", ca: "INFRA_AGENT_CA" },
  { product: "logs", service: "logs-agent", token: "LOGS_ENROLL_TOKEN", ca: "LOGS_AGENT_CA" },
  { product: "siem", service: "siem-agent", token: "SIEM_ENROLL_TOKEN", ca: "SIEM_AGENT_CA" },
] as const;
for (const a of AGENTS) {
  step(`${a.product}: an agent`);
  if (!env.get(a.token)) setEnv(a.token, (await api[a.product]!<{ enrollToken: string }>("/api/v1/agents", { name: "local" })).enrollToken);
}

// SAST's agent scans repositories of a GitHub account connected under SAST, GitHub; it reads no servers.
step("sast: an agent");
if (!env.get("SAST_ENROLL_TOKEN")) setEnv("SAST_ENROLL_TOKEN", (await api.sast!<{ enrollToken: string }>("/api/v1/agents", { name: "local" })).enrollToken);

// DAST's agent runs ZAP and Nuclei against the targets added in DAST.
step("dast: an agent");
if (!env.get("DAST_ENROLL_TOKEN")) setEnv("DAST_ENROLL_TOKEN", (await api.dast!<{ enrollToken: string }>("/api/v1/agents", { name: "local" })).enrollToken);

// SIEM's severe signals and Uptime's outages open incidents, each with an editor token of its own in Incidents.
step("Incidents: SIEM and Uptime open incidents");
if (!env.get("SIEM_INCIDENTS_TOKEN") || !env.get("UPTIME_INCIDENTS_TOKEN")) {
  // Only a signed-in person makes tokens, not an API token.
  const owner = client(byName("incidents"), true);
  await owner("/api/v1/auth/login", { email: EMAIL, password: PASSWORD });
  // A code works once, and the owner step may have used this window's: then the next window's is asked for.
  await owner("/api/v1/auth/login/mfa", { code: totp(state.totp.incidents!) }).catch(async () => {
    await sleep(31_000 - (Date.now() % 30_000));
    return owner("/api/v1/auth/login/mfa", { code: totp(state.totp.incidents!) });
  });
  for (const from of ["siem", "uptime"]) {
    const key = `${from.toUpperCase()}_INCIDENTS_TOKEN`;
    if (!env.get(key)) setEnv(key, (await owner<{ token: string }>("/api/v1/auth/tokens", { name: from, role: "editor" })).token);
  }
}

step("Starting again with sign-in through Identity, and the agents");
compose(
  "up",
  "-d",
  ...PRODUCTS.filter((p) => p.service !== "identity").map((p) => p.service),
  "vpn-server",
  ...AGENTS.map((a) => a.service),
  "sast-agent",
  "dast-agent",
  "malware-agent",
);
// Each product is running again before anything asks it.
for (const p of PRODUCTS) await ready(p);

step("The two servers in hosts.yaml");
for (const a of AGENTS) {
  let agent: { id: string; status: string } | undefined;
  for (let i = 0; i < 90 && agent?.status !== "online"; i++) {
    await sleep(2000);
    agent = (await api[a.product]!<{ agents: Array<{ id: string; status: string }> }>("/api/v1/agents").catch(() => ({ agents: [] }))).agents[0];
  }
  if (agent?.status !== "online") throw new Error(`${a.service} did not come online (${agent?.status}): docker compose logs ${a.service}`);
  const setup = await api[a.product]!<{ caPublicKey: string; sudoers?: string }>(`/api/v1/agents/${agent.id}/setup`);
  setEnv(a.ca, setup.caPublicKey);
  if (setup.sudoers) setEnv("INFRA_AGENT_SUDOERS", setup.sudoers);
}
// malware-agent logs in with a key of its own, which the two servers put in authorized_keys.
for (let i = 0; i < 30 && !env.get("MALWARE_AGENT_KEY"); i++) {
  try {
    setEnv("MALWARE_AGENT_KEY", compose("exec", "-T", "malware-agent", "cat", "/data/agent_key.pub").trim());
  } catch {
    await sleep(2000);
  }
}
compose("up", "-d", "--build", "host-web", "host-db");
for (const [name, service] of [
  ["web", "host-web"],
  ["db", "host-db"],
] as const) {
  // The same check an admin makes: the key each agent saw is the one the server prints.
  const printed = compose("exec", "-T", service, "ssh-keygen", "-lf", "/etc/ssh/ssh_host_ed25519_key.pub").split(" ")[1];
  for (const a of AGENTS) {
    const call = api[a.product]!;
    for (let i = 0; i < 60; i++) {
      const host = (
        await call<{ hosts: Array<{ id: string; name: string; hostKeys: unknown[]; pendingHostKeys: Array<{ fingerprint: string }> }> }>("/api/v1/hosts")
      ).hosts.find((h) => h.name === name);
      if (host?.hostKeys.length) break;
      if (host && host.pendingHostKeys[0]?.fingerprint === printed) {
        await call(`/api/v1/hosts/${host.id}/host-key/accept`, { fingerprint: printed });
        console.log(`  ${a.product}, ${name}: key ${printed} accepted`);
        break;
      }
      await sleep(2000);
    }
  }
}

// Its first round ran before the servers had its key: a new round scans them too.
compose("restart", "malware-agent");

console.log(`
Ready. Open these in your browser; trust config/caddy-root.crt first (README.md says how), or accept the warning once per address.
Sign in to Identity as ${EMAIL} / ${PASSWORD}, with the code from:
  docker compose run --rm --no-deps setup node setup/code.ts
Every other product then goes straight to Identity.
For sample data in every product:
  docker compose run --rm --no-deps setup node setup/seed.ts

${PRODUCTS.map((p) => `  ${p.service.padEnd(14)} ${p.url}`).join("\n")}
  ${"prometheus".padEnd(14)} http://localhost:9090/targets
`);
