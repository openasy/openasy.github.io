// Copies each product's example config file, as its latest release tag has it, into app/data/configs.ts, so the
// install builder puts the same file in the folder it makes. Run it after a release of one of these products; a test
// fails while a copy is older than the version status.ts names.
//   node kit/configs/sync.mjs            the product repositories are next to this one, as in the OpenAsy folder
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const PRODUCTS = [
  "analytics",
  "mail",
  "calendar",
  "files",
  "passwords",
  "consent",
  "audience",
  "messages",
  "crm",
  "helpdesk",
  "live-chat",
  "knowledge-base",
  "hr",
  "wiki",
  "forms",
  "invoices",
  "campaigns",
];

const site = resolve(import.meta.dirname, "../..");
const git = (repo, ...args) => execFileSync("git", ["-C", join(site, "..", repo), ...args], { encoding: "utf8" });

const entries = PRODUCTS.map((id) => {
  const tag = git(id, "describe", "--tags", "--abbrev=0", "--match", "v*").trim();
  const content = git(id, "show", `${tag}:config/${id}.yaml`).trimEnd();
  return `  ${JSON.stringify(id)}: { version: ${JSON.stringify(tag.slice(1))}, content: ${JSON.stringify(content)} },`;
});

writeFileSync(
  join(site, "app/data/configs.ts"),
  [
    "// Written by kit/configs/sync.mjs: each product's example config file at its release tag. Do not edit by hand.",
    "export const CONFIGS: Record<string, { version: string; content: string }> = {",
    ...entries,
    "};",
    "",
  ].join("\n"),
);
console.log(`app/data/configs.ts: ${PRODUCTS.length} config files`);
