// Takes the screenshots on each product's page, public/screens/<product>/<page>-{light,dark}.webp, from the screens
// its story in app/data/products lists. Released products are shot in the demo install demo.mjs writes, signed in as
// the dev account; designed ones in the @openasy/ui Storybook. Only the demo install: never one with real data.
//   node kit/screens/capture.mjs demo ../openasy-demo [product ...]        released products, from the demo install
//   node kit/screens/capture.mjs storybook http://localhost:6006 [product ...]   designed products, from Storybook
import { createHmac } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { chromium } from "playwright";
import { createServer } from "vite";

const PORT = 9443;
const SIZE = { width: 1440, height: 900 };
const QUALITY = 0.8;
const root = new URL("../..", import.meta.url).pathname;
const [mode, where, ...only] = process.argv.slice(2);
if (mode !== "demo" && mode !== "storybook") throw new Error("Say demo <folder> or storybook <address>; see the top of this file");
const demo = mode === "demo" ? where : "";

const vite = await createServer({ root, configFile: false, server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
const { STORIES } = await vite.ssrLoadModule("/app/data/products/index.ts");
const { PARTS, INSTALLABLE } = await vite.ssrLoadModule("/app/data/install.ts");
const { DEV_EMAIL, DEV_PASSWORD } = await vite.ssrLoadModule("/app/data/devkit.ts");
await vite.close();

/** The dev account's current two-step code in the demo install, as kit/dev/code.ts makes it. */
function code() {
  const state = JSON.parse(readFileSync(join(resolve(demo), "keys/setup-state.json"), "utf8"));
  const bits = [...state.totp.identity].map((c) => "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".indexOf(c).toString(2).padStart(5, "0")).join("");
  const key = Buffer.from(bits.match(/.{8}/g).map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30_000)));
  const mac = createHmac("sha1", key).update(counter).digest();
  return String((mac.readUInt32BE(mac[19] & 15) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: SIZE, ignoreHTTPSErrors: true, reducedMotion: "reduce" });
const page = await context.newPage();

/** Signs in to Identity once; the products then sign in through it by themselves. */
async function signIn() {
  await page.goto(`https://id.localhost:${PORT}/`);
  await page.getByLabel("Email").fill(DEV_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(DEV_PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByLabel("Digit 1").click();
  await page.keyboard.type(code());
  await page.getByRole("button", { name: "Verify" }).click();
  await page.getByRole("heading", { name: "Two-step verification" }).waitFor({ state: "detached" });
}

/** The screenshot as WebP, encoded by the browser so no other tool is needed. */
async function webp(png) {
  const encoder = await context.newPage();
  const data = await encoder.evaluate(
    async ([src, quality]) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const canvas = Object.assign(document.createElement("canvas"), { width: img.width, height: img.height });
      canvas.getContext("2d").drawImage(img, 0, 0);
      return canvas.toDataURL("image/webp", quality);
    },
    [`data:image/png;base64,${png.toString("base64")}`, QUALITY],
  );
  await encoder.close();
  return Buffer.from(data.split(",")[1], "base64");
}

async function settle() {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(800);
}

const shotsFile = join(root, "app/data/products/screens.json");
const shots = JSON.parse(readFileSync(shotsFile, "utf8"));
const sub = (id) => (INSTALLABLE.includes(id) ? PARTS[id].sub : null);

/** Where each screen is: in the demo install for a released product, in Storybook for a designed one. */
async function urlOf(id, screen) {
  if (mode === "storybook") return (theme) => `${where}/iframe.html?id=products-${id}--${screen.story}&viewMode=story&globals=theme:${theme}`;
  const base = `https://${sub(id)}.localhost:${PORT}`;
  let path = screen.path ?? `/${screen.page}`;
  if (screen.from) {
    await page.goto(`${base}${screen.from}`);
    await settle();
    path = await page.locator(`a[href^="${screen.path}"]`).first().getAttribute("href");
  }
  return () => `${base}${path}`;
}

if (mode === "demo") await signIn();
for (const [id, story] of Object.entries(STORIES)) {
  if (only.length && !only.includes(id)) continue;
  // The demo install runs the released products. Storybook has every product's screens: the designed ones exist only
  // there, and a released product's stand in until the demo install's are taken.
  if (mode === "demo" && !sub(id)) continue;
  const out = join(root, "public/screens", id);
  mkdirSync(out, { recursive: true });
  for (const screen of story.screens) {
    if (mode === "storybook" && !screen.story) continue;
    const url = await urlOf(id, screen);
    for (const theme of ["light", "dark"]) {
      await page.emulateMedia({ colorScheme: theme });
      await page.goto(url(theme));
      await settle();
      const file = join(out, `${screen.page}-${theme}.webp`);
      writeFileSync(file, await webp(await page.screenshot()));
      console.log(`${id}/${screen.page}-${theme}.webp`);
    }
    shots[id] = [...new Set([...(shots[id] ?? []), screen.page])].sort();
    writeFileSync(shotsFile, `${JSON.stringify(shots, null, 2)}\n`);
  }
}
await browser.close();
