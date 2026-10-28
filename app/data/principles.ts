/**
 * Short form of the design decisions in docs/decisions. Titles, statuses and areas are read from the
 * records themselves, so this file only holds the one-line summaries shown on the site.
 * A record of one product ("Logs: ...") is not a principle: its product page says what it does, so it needs no summary.
 */
import { PRODUCT_LIST } from "@openasy/ui";

const REPO = "https://github.com/openasy/openasy.github.io/blob/main/docs/decisions/";
export const ADR_INDEX = "https://github.com/openasy/openasy.github.io/tree/main/docs/decisions";

export type DecisionStatus = "Proposed" | "Accepted" | `Superseded by ${string}`;
export type ImplementationStatus = "Not started" | "In progress" | "Implemented";
export type Priority = "Critical" | "High" | "Medium";

export interface Principle {
  n: string;
  /** Full title of the record. */
  record: string;
  /** Short title for cards. */
  title: string;
  text: string;
  decision: DecisionStatus;
  implementation: ImplementationStatus;
  where?: string;
  priority?: Priority;
  area: string;
  file: string;
  /** The product a record decides for, when its title starts with that product's name. */
  product?: string;
}

const SUMMARIES: Record<string, { title: string; text: string }> = {
  "0001": {
    title: "Alone, together or with your tools",
    text: "Every product is complete on its own, links to the others with one token, and speaks OIDC, SAML, SCIM, OpenTelemetry, Prometheus, Syslog, Sigma and STIX.",
  },
  "0002": { title: "Sign in your way", text: "Local accounts with MFA and passkeys, or OIDC, SAML and LDAP. Identity gives single sign-on across products." },
  "0003": { title: "Least privilege", text: "Roles per product, custom roles, scoped and expiring API tokens. New members start as Viewers." },
  "0004": {
    title: "Your brand, set once",
    text: "Your organization, logo, tab icon, color and support address in one file every product loads, each serving the pictures itself. Switch off the features you do not use.",
  },
  "0005": { title: "Accessible", text: "WCAG 2.2 AA, full keyboard use, levels readable without colour. Every screen is tested with axe in CI." },
  "0006": { title: "Ready for your language", text: "English first; ICU messages, locale-aware formats and right-to-left layouts for translations." },
  "0007": { title: "Light and dark", text: "Every colour has a light and a dark value. Follows the system setting unless you pick one." },
  "0008": {
    title: "Open source",
    text: "Products under AGPL-3.0, the component and sign-in libraries under Apache-2.0, developed in public. No closed enterprise edition: support plans and commercial licences fund the work.",
  },
  "0009": {
    title: "Current, supported libraries",
    text: "Supported versions only, Node LTS. New majors after their first patch release; updates gated by CI.",
  },
  "0010": { title: "Forward-only upgrades", text: "Migrations only go forward. To roll back, restore the backup taken before the upgrade." },
  "0011": { title: "SQLite by default", text: "One file per product, no database server to run." },
  "0012": {
    title: "Back in time",
    text: "Daily snapshots with configurable retention (by default 7 daily, 4 weekly, 12 monthly), optional continuous replication to restore to any second, and tested runbooks for the worst day.",
  },
  "0013": {
    title: "Secure by default",
    text: "TLS on every connection that leaves a host, no default passwords, secrets encrypted at rest, every admin action audited.",
  },
  "0014": {
    title: "An API you can rely on",
    text: "Every screen has a public REST API and a CLI, described with OpenAPI, additive within a major and deprecated before removal.",
  },
  "0015": { title: "Your data stays yours", text: "No telemetry, air-gapped installs, GDPR export and delete, retention you control." },
  "0016": { title: "One signed container", text: "docker compose up or Helm. Images are signed, ship an SBOM and carry SLSA provenance." },
  "0017": { title: "Observable", text: "/healthz, /readyz and /metrics on every product, structured logs on stdout." },
  "0018": {
    title: "One app per product",
    text: "API and web UI ship together in one container with one version. Agents that collect data and servers that carry traffic are separate, each named after the product.",
  },
  "0019": {
    title: "Versions you can trust",
    text: "Each product has its own SemVer and a monthly release. Products declare which versions they work with and refuse to link to an incompatible one.",
  },
  "0020": { title: "Long-term support", text: "For Enterprise customers: one long-term line per year with 12 months of high and critical security fixes." },
  "0021": {
    title: "Secrets and keys",
    text: "Envelope encryption with a key kept outside the database, keys that stay where they are used, rotation and a recovery key.",
  },
  "0022": {
    title: "Least privilege on the host",
    text: "Products run unprivileged; only small agents hold the powers they need, and they validate everything they apply.",
  },
  "0023": {
    title: "Products talk safely",
    text: "Scoped tokens, per-agent identities, timeouts, retries, idempotency keys, and agents that keep working when the product is down.",
  },
  "0026": {
    title: "Nothing exposed by accident",
    text: "HTTPS through a proxy in front of the products, only the proxy published, trusted proxies, management endpoints kept private.",
  },
  "0027": { title: "Builds you can verify", text: "Pinned dependencies, releases only from CI, immutable signed images with SBOM and provenance." },
  "0028": { title: "Runs on a small server", text: "Memory, CPU and image size budgets, amd64 and arm64, no required external services." },
  "0029": { title: "Proof, not percentages", text: "Tests for what matters: migrations, upgrades, restores, accessibility and the main flow of each product." },
  "0030": { title: "How the project is run", text: "Contributions, maintainers, licence checks, security reports, and what happens if the project ends." },
  "0052": {
    title: "One list, every product",
    text: "Endpoints, servers, DAST's targets and the repositories SAST reads live only in files the install keeps, in git if it likes, and no product has a form for them. Every product reads the same list, so Uptime, Certificates and DAST agree on an endpoint.",
  },
  "0054": {
    title: "One file per product",
    text: "Each product is one file in products/, with its containers, their settings and their secrets, and compose.yaml only includes them. A product's secrets reach only its containers, a change to it is one file, and leaving a line out of compose.yaml leaves it out.",
  },
};

const RECORDS = import.meta.glob<string>("../../docs/decisions/00*.md", { query: "?raw", import: "default", eager: true });

const field = (md: string, name: string) => md.match(new RegExp(`^- \\*\\*${name}:\\*\\* (.+)$`, "m"))?.[1];

export function parseRecord(file: string, md: string): Principle {
  const head = md.match(/^# (\d{4})\. (.+)$/m);
  if (!head) throw new Error(`${file}: missing "# NNNN. Title"`);
  const [, n, record] = head as unknown as [string, string, string];
  const decision = (field(md, "Decision") ?? "Proposed") as DecisionStatus;
  const product = PRODUCT_LIST.find((p) => record.startsWith(`${p.name}: `))?.name;
  if (product && SUMMARIES[n]) throw new Error(`${file}: a record of ${product} needs no summary; its product page says what it does`);
  // Superseded and product records are not on the principles page, so they need no summary.
  const summary = SUMMARIES[n] ?? (product || decision.startsWith("Superseded") ? { title: record, text: "" } : undefined);
  if (!summary) throw new Error(`${file}: add a summary to SUMMARIES`);
  return {
    n,
    record,
    ...summary,
    decision,
    implementation: (field(md, "Implementation") ?? "Not started") as ImplementationStatus,
    where: field(md, "Where")?.replaceAll("`", ""),
    priority: field(md, "Priority") as Priority | undefined,
    area: field(md, "Area") ?? "",
    file,
    product,
  };
}

export const RECORDS_ALL: Principle[] = Object.entries(RECORDS)
  .map(([path, md]) => parseRecord(path.split("/").pop()!, md))
  .sort((a, b) => a.n.localeCompare(b.n));
/** The decisions in force. A superseded record stays in docs/decisions, so the commits and links that name it still lead to its successor. */
export const IN_FORCE = RECORDS_ALL.filter((p) => !p.decision.startsWith("Superseded"));
/** The decisions every product follows, on the principles page. */
export const PRINCIPLES = IN_FORCE.filter((p) => !p.product);

export const adrUrl = (file: string) => REPO + file;
