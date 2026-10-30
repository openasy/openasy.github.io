// Writes a demo install for the product screenshots: the dev setup of openasy.com/install, under its own compose
// project name and port, so it runs next to a dev setup without touching it. It holds only seed.ts's sample data:
// example.com names, documentation addresses and fake keys. Never take screenshots from an install with real data.
//   node kit/screens/demo.mjs ../openasy-demo
//   cd ../openasy-demo && docker compose up -d && docker compose logs -f setup
//   docker compose run --rm --no-deps setup node setup/seed.ts
import { webcrypto } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { createServer } from "vite";

export const DEMO_PORT = 9443;
const DEMO_NAME = "openasy-demo";

const folder = resolve(process.argv[2] ?? "../openasy-demo");
if (existsSync(join(folder, "compose.yaml"))) throw new Error(`${folder} already holds an install; remove it to start over`);

// The install builder imports files with ?raw, so Vite loads it.
const vite = await createServer({
  root: new URL("../..", import.meta.url).pathname,
  configFile: false,
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});
const { buildDevKit, DEV_FOLDER } = await vite.ssrLoadModule("/app/data/devkit.ts");
const { makeSecrets } = await vite.ssrLoadModule("/app/data/install.ts");
await vite.close();

const kit = buildDevKit(makeSecrets((b) => webcrypto.getRandomValues(b)));
for (const f of kit.files) {
  if (f.binary) continue;
  // The ports a dev setup already takes on this computer: HTTPS, Prometheus and OpenVPN.
  const content = f.content
    .replace(/\b8443\b/g, String(DEMO_PORT))
    .replaceAll(`name: ${DEV_FOLDER}`, `name: ${DEMO_NAME}`)
    .replaceAll('"127.0.0.1:9090:9090"', '"127.0.0.1:9091:9090"')
    .replaceAll('"1194:1194/udp"', '"127.0.0.1:1195:1194/udp"');
  const path = join(folder, f.name);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, f.secret ? { mode: 0o600 } : {});
}
console.log(`${folder}: ${kit.files.length} files, compose project ${DEMO_NAME}, on port ${DEMO_PORT}.`);
