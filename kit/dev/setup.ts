// Wires the OpenAsy dev setup together, once, from inside its setup container: it starts the products after Caddy's
// local CA exists, makes an owner in each, Identity's groups and applications, a VPN server, Infrastructure's and Logs'
// agents and their two demo servers, then starts everything again with sign-in through Identity, and fills every
// product with sample data (seed.ts). Safe to run again: it skips what is done (docker compose up -d setup). It runs
// from the folder that holds compose.yaml. Written for the dev setup from openasy.github.io/install; not for production.
import { execFileSync } from "node:child_process";
import { createHmac } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const STATE = "secrets/dev.json";
const ENV = ".env";
const EMAIL = "dev@openasy.localhost";
const PASSWORD = "openasy dev password";
const ROLES = ["openasy-admins", "openasy-editors", "openasy-viewers"];

interface Product {
  service: string;
  url: string;
  clientFile: string;
  template?: string;
}
// Every product in compose.yaml, Identity first: written with this script by openasy.github.io/install.
const PRODUCTS: Product[] = JSON.parse(readFileSync("setup/products.json", "utf8"));
const byName = (s: string) => PRODUCTS.find((p) => p.service === s)!;

mkdirSync("secrets", { recursive: true });
type State = { totp: Record<string, string>; tokens: Record<string, string> };
const state: State = existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : { totp: {}, tokens: {} };
const save = () => writeFileSync(STATE, JSON.stringify(state, null, 2), { mode: 0o600 });

// .env keeps what the site made (the ingest tokens) and gains what is made here. It is read again before each write,
// so a line added while setup runs is kept.
const readEnv = () =>
  new Map<string, string>(
    existsSync(ENV)
      ? readFileSync(ENV, "utf8")
          .split("\n")
          .filter((l) => l.includes("=") && !l.startsWith("#"))
          .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])
      : [],
  );
const env = readEnv();
const setEnv = (k: string, v: string) => {
  for (const [a, b] of readEnv()) if (!env.has(a)) env.set(a, b);
  env.set(k, v.includes("\n") || v.includes(" ") ? `'${v.replace(/\n/g, "\\n")}'` : v);
  writeFileSync(ENV, `# The dev setup's tokens, written by setup/setup.ts. Keep out of git.\n${[...env].map(([a, b]) => `${a}=${b}`).join("\n")}\n`, {
    mode: 0o600,
  });
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
function client(p: Product) {
  const jar = new Map<string, string>();
  return async <T = any>(path: string, body?: unknown, method?: string): Promise<T> => {
    const token = state.tokens[p.service];
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
  if (apps.some((a) => a.name === p.service) && existsSync(p.clientFile)) continue;
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
  // compose loads this file into the product alone (env_file), so each product sees only its own secret.
  mkdirSync(dirname(p.clientFile), { recursive: true });
  writeFileSync(
    p.clientFile,
    `OPENASY_OIDC_ISSUER=${byName("identity").url}\nOPENASY_OIDC_CLIENT_ID=${r.application.id}\nOPENASY_OIDC_CLIENT_SECRET=${r.clientSecret}\n`,
    { mode: 0o600 },
  );
  console.log(`  ${p.service}: signs in through Identity`);
}

step("VPN: a server");
if (!env.get("VPN_ENROLL_TOKEN")) setEnv("VPN_ENROLL_TOKEN", (await api.vpn!<{ enrollToken: string }>("/api/v1/servers", { id: "local" })).enrollToken);

// Infrastructure and Logs each read the servers with an agent of their own, with its own CA.
const AGENTS = [
  { product: "infra", service: "infra-agent", token: "INFRA_ENROLL_TOKEN", ca: "INFRA_AGENT_CA" },
  { product: "logs", service: "logs-agent", token: "LOGS_ENROLL_TOKEN", ca: "LOGS_AGENT_CA" },
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

step("Sample data");
// A separate script, so it runs again by itself: docker compose run --rm --no-deps setup node setup/seed.ts
execFileSync("node", ["setup/seed.ts"], { stdio: "inherit" });

console.log(`
Ready. Open these in your browser; trust config/caddy-root.crt first (README.md says how), or accept the warning once per address.
Sign in to Identity as ${EMAIL} / ${PASSWORD}, with the code from:
  docker compose run --rm --no-deps setup node setup/code.ts
Every other product then goes straight to Identity.

${PRODUCTS.map((p) => `  ${p.service.padEnd(14)} ${p.url}`).join("\n")}
  ${"prometheus".padEnd(14)} http://localhost:9090/targets
`);
