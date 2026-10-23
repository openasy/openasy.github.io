// The current two-step code of the dev account, Identity's by default:
//   docker compose run --rm --no-deps setup node setup/code.ts [product]
// Or add the secret it prints with --secret to an authenticator app.
import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";

const product = process.argv.find((a, i) => i > 1 && !a.startsWith("--")) ?? "identity";
const state = JSON.parse(readFileSync(new URL("../secrets/dev.json", import.meta.url), "utf8")) as { totp: Record<string, string> };
const secret = state.totp[product];
if (!secret) throw new Error(`No two-step secret for ${product}; wait for setup to finish: docker compose logs -f setup`);
if (process.argv.includes("--secret")) {
  console.log(secret);
  process.exit(0);
}
const bits = [...secret].map((c) => "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".indexOf(c).toString(2).padStart(5, "0")).join("");
const key = Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)));
const counter = Buffer.alloc(8);
counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30_000)));
const mac = createHmac("sha1", key).update(counter).digest();
const left = 30 - Math.floor((Date.now() / 1000) % 30);
console.log(`${String((mac.readUInt32BE(mac[19]! & 15) & 0x7fffffff) % 1_000_000).padStart(6, "0")}   (${left} s left)`);
