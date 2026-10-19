/** Short form of the design decisions in openasy/ui docs/decisions. */

const ADR = "https://github.com/openasy/ui/blob/main/docs/decisions/";

export interface Principle {
  n: string;
  title: string;
  text: string;
  status: "Accepted" | "Planned" | "Partly planned";
  file: string;
}

export const PRINCIPLES: Principle[] = [
  { n: "0001", title: "Alone, together or with your tools", text: "Every product is complete on its own, links to the others with one token, and speaks OIDC, SAML, SCIM, OpenTelemetry, Prometheus, Syslog, Sigma and STIX.", status: "Accepted", file: "0001-standalone-and-together.md" },
  { n: "0002", title: "Sign in your way", text: "Local accounts with MFA and passkeys, or OIDC, SAML and LDAP. Identity gives single sign-on across products.", status: "Accepted", file: "0002-authentication.md" },
  { n: "0003", title: "Least privilege", text: "Roles per product, custom roles, scoped and expiring API tokens. New members start as Viewers.", status: "Accepted", file: "0003-authorization.md" },
  { n: "0004", title: "Make it yours", text: "White-label name, logo, colour and font. Switch off the features you do not use.", status: "Partly planned", file: "0004-customization.md" },
  { n: "0005", title: "Accessible", text: "WCAG 2.2 AA, full keyboard use, levels readable without colour. Every screen is tested with axe in CI.", status: "Accepted", file: "0005-accessibility.md" },
  { n: "0006", title: "Ready for your language", text: "English first; ICU messages, locale-aware formats and right-to-left layouts for translations.", status: "Planned", file: "0006-languages.md" },
  { n: "0007", title: "Light and dark", text: "Every colour has a light and a dark value. Follows the system setting unless you pick one.", status: "Accepted", file: "0007-theme.md" },
  { n: "0008", title: "Open source", text: "Products under AGPL-3.0, the component library under Apache-2.0, developed in public. No closed enterprise edition: support plans and commercial licences fund the work.", status: "Accepted", file: "0008-open-source.md" },
  { n: "0009", title: "Latest libraries", text: "Current major versions only, updated automatically and gated by CI.", status: "Accepted", file: "0009-latest-libraries.md" },
  { n: "0010", title: "Forward-only upgrades", text: "Migrations only go forward. To roll back, restore the backup taken before the upgrade.", status: "Accepted", file: "0010-forward-only-upgrades.md" },
  { n: "0011", title: "SQLite by default", text: "One file per product, no database server to run.", status: "Accepted", file: "0011-sqlite-by-default.md" },
  { n: "0012", title: "Back in time", text: "Daily snapshots kept for a year, and optional continuous replication to restore to any second.", status: "Planned", file: "0012-backups.md" },
  { n: "0013", title: "Secure by default", text: "TLS everywhere, no default passwords, secrets encrypted at rest, every admin action audited.", status: "Accepted", file: "0013-secure-by-default.md" },
  { n: "0014", title: "API-first", text: "Every screen has a public REST API and a CLI. The UI has no private endpoints.", status: "Accepted", file: "0014-api-first.md" },
  { n: "0015", title: "Your data stays yours", text: "No telemetry, air-gapped installs, GDPR export and delete, retention you control.", status: "Accepted", file: "0015-data-ownership.md" },
  { n: "0016", title: "One signed container", text: "docker compose up or Helm. Images are signed, ship an SBOM and carry SLSA provenance.", status: "Accepted", file: "0016-one-container-per-product.md" },
  { n: "0017", title: "Observable", text: "/healthz, /readyz and /metrics on every product, structured logs on stdout.", status: "Accepted", file: "0017-self-observability.md" },
  { n: "0018", title: "One app per product", text: "API and web UI ship together in one container with one version. Only host agents such as the VPN server and sensors are separate.", status: "Accepted", file: "0018-one-application-per-product.md" },
  { n: "0019", title: "Versions you can trust", text: "Each product has its own SemVer and a monthly release. Products declare which versions they work with and refuse to link to an incompatible one.", status: "Accepted", file: "0019-versioning-and-releases.md" },
  { n: "0020", title: "Long-term support", text: "One LTS line per year with 12 months of security and critical fixes, for teams that cannot upgrade every month.", status: "Accepted", file: "0020-long-term-support.md" },
];

export const adrUrl = (file: string) => ADR + file;
export const ADR_INDEX = ADR.replace("blob/main/docs/decisions/", "tree/main/docs/decisions");
