/**
 * Short form of the design decisions in docs/decisions. Titles, statuses and areas are read from the
 * records themselves, so this file only holds the one-line summaries shown on the site.
 */

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
}

const SUMMARIES: Record<string, { title: string; text: string }> = {
  "0001": {
    title: "Alone, together or with your tools",
    text: "Every product is complete on its own, links to the others with one token, and speaks OIDC, SAML, SCIM, OpenTelemetry, Prometheus, Syslog, Sigma and STIX.",
  },
  "0002": { title: "Sign in your way", text: "Local accounts with MFA and passkeys, or OIDC, SAML and LDAP. Identity gives single sign-on across products." },
  "0003": { title: "Least privilege", text: "Roles per product, custom roles, scoped and expiring API tokens. New members start as Viewers." },
  "0004": { title: "Make it yours", text: "White-label name, logo, colour and font. Switch off the features you do not use." },
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
    text: "Daily snapshots with configurable retention (by default 7 daily, 4 weekly, 12 monthly), and optional continuous replication to restore to any second.",
  },
  "0013": { title: "Secure by default", text: "TLS everywhere, no default passwords, secrets encrypted at rest, every admin action audited." },
  "0014": { title: "API-first", text: "Every screen has a public REST API and a CLI. The UI has no private endpoints." },
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
  "0024": {
    title: "An API you can rely on",
    text: "OpenAPI for every product, additive changes within a major, deprecation before removal, standard error responses.",
  },
  "0025": {
    title: "Recover from the worst day",
    text: "Recovery targets, tested runbooks for lost servers, corrupted databases, lost keys and failed upgrades.",
  },
  "0026": {
    title: "Nothing exposed by accident",
    text: "HTTPS only, ports on localhost unless meant to be public, trusted proxies, management endpoints kept private.",
  },
  "0027": { title: "Builds you can verify", text: "Pinned dependencies, releases only from CI, immutable signed images with SBOM and provenance." },
  "0028": { title: "Runs on a small server", text: "Memory, CPU and image size budgets, amd64 and arm64, no required external services." },
  "0029": { title: "Proof, not percentages", text: "Tests for what matters: migrations, upgrades, restores, accessibility and the main flow of each product." },
  "0030": { title: "How the project is run", text: "Contributions, maintainers, licence checks, security reports, and what happens if the project ends." },
  "0031": {
    title: "Hosts stay clean",
    text: "One agent per network reads hosts over SSH with 5-minute certificates and keeps the keys; the product holds none. Nothing is installed on your hosts.",
  },
  "0032": {
    title: "VPN servers anywhere",
    text: "Add a VPN server per location from one place. Each enrols with a one-time token and gets its own secret; clients move to the next server when one is down.",
  },
  "0033": {
    title: "One sign-in for everything",
    text: "Identity is an OpenID provider on a certified library, in one container with SQLite. It also helps you connect Keycloak, Entra ID, Okta or Google.",
  },
  "0034": {
    title: "Bring your directory",
    text: "Identity signs in SAML applications such as AWS, reads LDAP and Active Directory, takes people from Okta or Entra ID over SCIM, and can ask a group for a passkey only.",
  },
  "0035": {
    title: "Logs without a shipper",
    text: "Logs keeps them in VictoriaLogs inside its one container. Send them over Syslog, OpenTelemetry or what Vector and Fluent Bit speak, or let one agent read journald over SSH.",
  },
  "0036": {
    title: "Static analysis on every pull request",
    text: "SAST runs Opengrep in a separate agent, so hostile code never reaches the product. A pull request is blocked only by what it adds.",
  },
  "0037": {
    title: "Scans only what is yours",
    text: "DAST runs ZAP and Nuclei in an agent inside your network, and attacks a target only after you prove you own it. Full scans never run on production by default.",
  },
  "0038": {
    title: "Leaks without a second leak",
    text: "Secrets keeps where a secret was found and never the secret: snippets are dropped, the fingerprint is salted, and rotating the key is a decision of its own.",
  },
  "0039": {
    title: "Leaks of files, never files",
    text: "Malware keeps where a detection was found and never the file: ClamAV and YARA reports are compared, quarantine is recorded, and every decision has a reason.",
  },
  "0040": {
    title: "Sigma rules, one signal per host",
    text: "SIEM runs Sigma rules over every event and groups matches into one signal per rule and host, so an analyst sees a story and not a thousand lines.",
  },
  "0041": {
    title: "A timeline nobody can rewrite",
    text: "Incidents keeps an append-only timeline, tasks, evidence links and a postmortem, and other products can open an incident over the API without duplicating it.",
  },
  "0042": {
    title: "Errors grouped by where they happen",
    text: "Errors groups events by the place they come from, counts who is affected, and reopens an issue as a regression when a fix did not hold.",
  },
  "0043": {
    title: "A judge, not a signer",
    text: "Supply Chain keeps the SBOM, the signature result and the provenance your CI reports, and answers allowed or not for an image against your policy. It says plainly that it records what CI says and does not verify signatures itself.",
  },
  "0044": {
    title: "Only what a change adds",
    text: "Audit reads the advisories your scanner reports for every lockfile, compares each branch with the default one, and fails a pull request only for what it adds. It holds no advisory database of its own.",
  },
  "0045": {
    title: "A score that moves",
    text: "Posture keeps the failed controls of each cloud account, cluster or group of hosts from the checkers you run, with decisions that last and a score over time. It needs no credentials for your infrastructure.",
  },
  "0046": {
    title: "Certificates, never keys",
    text: "Certificates keeps every certificate you send or a public endpoint presents, warns once per threshold before it ends, and refuses any body that holds a private key. It will not probe a private address.",
  },
  "0047": {
    title: "Checked from outside",
    text: "Uptime runs no probes itself: a runner you start from CI or another network checks HTTP, TCP, DNS and TLS. A check nobody has run lately is stale, never up, and a public status page shows only what you choose.",
  },
  "0048": {
    title: "A backup nobody restored is a hope",
    text: "Backups tracks the jobs restic, Velero or a script run, and gives each a state. A job with no recent restore test is untested, not healthy.",
  },
  "0049": {
    title: "Acceptance that ends",
    text: "Risk keeps the register and vendor reviews. Accepting a risk needs a reason, an approver and an end within a year, and every change goes into a history the database will not let anyone edit.",
  },
  "0050": {
    title: "Nothing dropped without a word",
    text: "Threat Intel imports STIX, CSV and text feeds, names whatever it cannot use, and answers one lookup for every product. TLP:RED stays with the people it was meant for.",
  },
  "0051": {
    title: "Spend with an owner",
    text: "Cost reads the bill a pipeline sends, gives every line an owner by tag or rule, forecasts the month and flags spikes for a person to explain. It holds no cloud credentials.",
  },
  "0052": {
    title: "One list, every product",
    text: "Endpoints and servers live in two files the install keeps, in git if it likes. Every product reads the same list, so Uptime and Certificates agree on an endpoint and on when its certificate is urgent.",
  },
  "0053": {
    title: "Your brand, set once",
    text: "Your organization, logo, tab icon and color in one file every product loads. The pictures are served by each product itself, so nothing is fetched from elsewhere.",
  },
};

const RECORDS = import.meta.glob<string>("../../docs/decisions/00*.md", { query: "?raw", import: "default", eager: true });

const field = (md: string, name: string) => md.match(new RegExp(`^- \\*\\*${name}:\\*\\* (.+)$`, "m"))?.[1];

export function parseRecord(file: string, md: string): Principle {
  const head = md.match(/^# (\d{4})\. (.+)$/m);
  if (!head) throw new Error(`${file}: missing "# NNNN. Title"`);
  const [, n, record] = head as unknown as [string, string, string];
  const summary = SUMMARIES[n];
  if (!summary) throw new Error(`${file}: add a summary to SUMMARIES`);
  return {
    n,
    record,
    ...summary,
    decision: (field(md, "Decision") ?? "Proposed") as DecisionStatus,
    implementation: (field(md, "Implementation") ?? "Not started") as ImplementationStatus,
    where: field(md, "Where")?.replaceAll("`", ""),
    priority: field(md, "Priority") as Priority | undefined,
    area: field(md, "Area") ?? "",
    file,
  };
}

export const PRINCIPLES: Principle[] = Object.entries(RECORDS)
  .map(([path, md]) => parseRecord(path.split("/").pop()!, md))
  .sort((a, b) => a.n.localeCompare(b.n));

export const adrUrl = (file: string) => REPO + file;
