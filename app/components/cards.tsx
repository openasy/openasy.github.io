import { Link } from "react-router";
import { Badge, PRODUCTS, cn, type ProductId } from "@openasy/ui";
import type { Goal } from "../data/goals";
import { READINESS_TONE, STATUS_TONE, atLeast, readiness, statusFor, statusLabel } from "../data/status";

export const product = (id: string) => PRODUCTS[id as ProductId];

/** Preview 0.2.0, In progress, Designed or Planned. */
export function ProductStatusBadge({ id }: { id: string }) {
  return <Badge tone={STATUS_TONE[statusFor(id).status]}>{statusLabel(id)}</Badge>;
}

export function GoalCard({ goal }: { goal: Goal }) {
  const ready = readiness(goal.required);
  return (
    <li className="flex">
      <Link
        to={`/goals/${goal.id}`}
        className="flex w-full flex-col gap-2 rounded-lg border border-line bg-surface p-5 text-fg no-underline hover:border-line-strong hover:shadow-raised"
      >
        <span className="text-base font-semibold">{goal.title}</span>
        <span className="text-sm text-fg-muted">“{goal.ask}”</span>
        <span className="mt-auto flex flex-col items-start gap-1.5 pt-2 text-xs text-fg-muted">
          <Badge tone={READINESS_TONE[ready]}>{ready}</Badge>
          <span>Needs {goal.required.map((id) => product(id).name).join(" and ")}</span>
          <span>{goal.timeToValue}</span>
        </span>
      </Link>
    </li>
  );
}

const CARD_BORDER = { Preview: "border-accent", "In progress": "border-dashed border-warning", Designed: "border-line", Planned: "border-line" } as const;

export function ProductCard({ id }: { id: string }) {
  const p = product(id);
  const { status } = statusFor(id);
  return (
    <li className="flex">
      <Link
        to={`/products/${id}`}
        className={cn("flex w-full items-start gap-3 rounded-lg border bg-surface p-4 text-fg no-underline hover:shadow-raised", CARD_BORDER[status])}
      >
        <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-md bg-accent-soft text-accent-text">
          <p.icon className="size-4" />
        </span>
        <span className="flex min-w-0 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold">{p.name}</span>
            {status !== "Designed" && status !== "Planned" && <ProductStatusBadge id={id} />}
          </span>
          <span className="text-sm text-fg-muted">{p.summary}</span>
        </span>
      </Link>
    </li>
  );
}

/** helm install commands for a product with a chart: the full install, and agents only when it has them. */
export function helmFor(id: string): { full: string; agentsOnly?: string } | undefined {
  const s = statusFor(id);
  if (!s.helm) return undefined;
  const version = s.version ?? "";
  const cmd = (release: string, set: string[]) =>
    [`helm install ${release} ${s.helm!.chart} --version ${version}`, "  --namespace openasy --create-namespace", ...set.map((x) => `  --set ${x}`)].join(
      " \\\n",
    );
  return {
    full: cmd(id === "vulnerabilities" ? "vulns" : id, s.helm.set ?? []),
    agentsOnly: s.helm.agentsOnly && cmd(`${id === "vulnerabilities" ? "vulns" : id}-agent`, s.helm.agentsOnly.set),
  };
}

/** vpn-server enrols with a one-time token from this release on, instead of sharing VPN_SERVER_TOKEN. */
const vpnEnrols = () => atLeast(statusFor("vpn").version, "0.6.0");

/** docker compose file for a set of products: one container and one SQLite volume each, plus host agents. */
/** Products that take data only from people and the API, so their compose has no ingest token. */
const NO_INGEST = ["logs", "incidents", "errors", "risk"];

export function composeFor(ids: string[]): string {
  const lines = ["services:"];
  ids.forEach((id, i) => {
    const p = product(id);
    const tag = statusFor(id).version ?? "1";
    if (id === "vpn" && p.agentImage) {
      // Matches compose.yaml in vpn: vpn listens on 8080 and has no backup setting yet. From 0.6.0 each server enrols
      // with its own one-time token instead of sharing VPN_SERVER_TOKEN (ADR 0032).
      const enrol = vpnEnrols();
      lines.push(
        `  ${id}:`,
        `    image: ${p.image}:${tag}`,
        "    restart: unless-stopped",
        "    ports:",
        `      - "${8443 + i}:8080"   # UI and API`,
        "    volumes:",
        `      - ${id}-data:/data   # SQLite database, CA and settings`,
        "    secrets: [openasy-kek]   # seals the CA key and sign-in secrets (ADR 0021)",
        "    environment:",
        `      VPN_PUBLIC_URL: http://localhost:${8443 + i}   # the https:// address behind your TLS proxy`,
        ...(enrol ? [] : ["      VPN_SERVER_TOKEN: ${VPN_SERVER_TOKEN}"]),
        "      VPN_PUBLIC_HOST: vpn.example.com   # the name or IP clients connect to",
        "  vpn-server:",
        `    image: ${p.agentImage}:${tag}   # always the same version as ${id}`,
        "    restart: unless-stopped",
        "    cap_add: [NET_ADMIN]",
        "    devices: [/dev/net/tun]",
        "    sysctls:",
        "      net.ipv4.ip_forward: 1   # lets clients reach the networks behind this host",
        "    ports:",
        `      - "1194:1194/udp"   # add a second vpn-server with OPENVPN_PROTO: tcp and OPENVPN_PORT: "443" for TCP 443`,
        ...(enrol ? ["    volumes:", "      - vpn-server-data:/var/lib/openasy-vpn   # its secret: without it, it must enrol again"] : []),
        "    environment:",
        `      VPN_URL: http://${id}:8080`,
        enrol ? "      VPN_ENROLL_TOKEN: ${EDGE_1_TOKEN:-}   # one-time, from Servers in vpn" : "      VPN_SERVER_TOKEN: ${VPN_SERVER_TOKEN}",
      );
      return;
    }
    if (id === "vulnerabilities" && p.agentImage) {
      // Matches compose.yaml in vulns: the product on 8080, and vulns-agent for this host.
      lines.push(
        `  ${id}:`,
        `    image: ${p.image}:${tag}`,
        "    restart: unless-stopped",
        "    read_only: true",
        "    ports:",
        `      - "127.0.0.1:${8080 + i}:8080"   # UI and API; put a TLS proxy in front`,
        "    volumes:",
        `      - ${id}-data:/data   # SQLite, SBOMs and the vulnerability data (3 GB)`,
        "    secrets: [openasy-kek]   # encrypts sign-in secrets (ADR 0021)",
        "    environment:",
        `      VULNS_PUBLIC_URL: http://localhost:${8080 + i}   # the https:// address behind your TLS proxy`,
        "      VULNS_INGEST_TOKEN: ${VULNS_INGEST_TOKEN}",
        "  vulns-agent:",
        `    image: ${p.agentImage}:${tag}   # always the same version as ${id}`,
        "    restart: unless-stopped",
        "    read_only: true",
        "    tmpfs: [/tmp]",
        "    volumes:",
        "      - /:/host:ro   # read-only: it lists packages, it never changes the host",
        "    environment:",
        `      VULNS_URL: http://${id}:8080`,
        "      VULNS_INGEST_TOKEN: ${VULNS_INGEST_TOKEN}",
      );
      return;
    }
    if (id === "infrastructure") {
      // Matches compose.yaml in infra: nothing runs on the hosts it reads (ADR 0031).
      lines.push(
        `  ${id}:`,
        `    image: ${p.image}:${tag}`,
        "    restart: unless-stopped",
        "    read_only: true",
        "    tmpfs: [/tmp]   # SSH keys for one connection, never on the data volume",
        "    ports:",
        `      - "127.0.0.1:${8080 + i}:8080"   # UI and API; put a TLS proxy in front`,
        "    volumes:",
        `      - ${id}-data:/data   # hosts, clusters, collections and changes`,
        "    secrets: [openasy-kek]   # encrypts the SSH CA and cluster tokens (ADR 0021)",
        "    environment:",
        `      INFRA_PUBLIC_URL: http://localhost:${8080 + i}   # the https:// address behind your TLS proxy`,
        "  infra-agent:",
        `    image: ${p.agentImage}:${tag}   # always the same version as ${id}; reads hosts over SSH, nothing installed on them`,
        "    restart: unless-stopped",
        "    read_only: true",
        "    tmpfs: [/tmp]",
        "    volumes:",
        "      - infra-agent-data:/data   # its SSH CA and keys, sealed with its own key",
        "    secrets: [openasy-agent-kek]",
        "    environment:",
        `      INFRA_URL: http://${id}:8080`,
        "      INFRA_ENROLL_TOKEN: ${INFRA_ENROLL_TOKEN:-}   # one-time, from Settings, Agents",
      );
      return;
    }
    if (id === "identity") {
      // Matches compose.yaml in identity: the OpenID and SAML provider on 8080 (ADR 0033, 0034).
      lines.push(
        `  ${id}:`,
        `    image: ${p.image}:${tag}`,
        "    restart: unless-stopped",
        "    read_only: true",
        "    ports:",
        `      - "127.0.0.1:${8080 + i}:8080"   # UI, API and the providers; put a TLS proxy in front`,
        "    volumes:",
        `      - ${id}-data:/data   # SQLite database`,
        "    secrets: [openasy-kek]   # seals the signing keys, client secrets and sign-in secrets (ADR 0021)",
        "    environment:",
        `      IDENTITY_PUBLIC_URL: http://localhost:${8080 + i}   # the https:// address behind your TLS proxy; the issuer, keep it fixed`,
      );
      return;
    }
    // Matches compose.yaml in every other product: one hardened container on 8080, its key, and for most a token for
    // the scripts and CI jobs that send it data.
    const env = id.toUpperCase().replace(/-/g, "_");
    lines.push(
      `  ${id}:`,
      `    image: ${p.image}:${tag}`,
      "    restart: unless-stopped",
      "    read_only: true",
      "    cap_drop: [ALL]",
      '    security_opt: ["no-new-privileges:true"]',
      "    tmpfs: [/tmp]",
      "    ports:",
      `      - "127.0.0.1:${8080 + i}:8080"   # UI and API; put a TLS proxy in front`,
      ...(id === "logs" ? ['      - "6514:6514"   # Syslog over TLS; remove if no host sends Syslog'] : []),
      "    volumes:",
      `      - ${id}-data:/data   # SQLite database`,
      "    secrets: [openasy-kek]   # seals sign-in secrets (ADR 0021)",
      "    environment:",
      `      ${env}_PUBLIC_URL: http://localhost:${8080 + i}   # the https:// address behind your TLS proxy`,
      ...(NO_INGEST.includes(id) ? [] : [`      ${env}_INGEST_TOKEN: \${${env}_INGEST_TOKEN:-}   # for the scripts and CI jobs that send it data`]),
    );
    if (id === "logs")
      lines.push(
        "  logs-agent:",
        `    image: ghcr.io/openasy/logs-agent:${tag}   # always the same version as logs; reads hosts over SSH, nothing installed on them`,
        "    restart: unless-stopped",
        "    read_only: true",
        "    tmpfs: [/tmp]",
        "    volumes:",
        "      - logs-agent-data:/data   # its SSH CA and keys, sealed with its own key",
        "    secrets: [openasy-agent-kek]",
        "    environment:",
        "      LOGS_URL: http://logs:8080",
        "      LOGS_ENROLL_TOKEN: ${LOGS_ENROLL_TOKEN:-}   # one-time, from Settings, Agents",
      );
    if (id === "siem")
      lines.push(
        "  siem-agent:",
        `    image: ghcr.io/openasy/siem-agent:${tag}   # always the same version as siem; reads hosts' security events over SSH`,
        "    restart: unless-stopped",
        "    read_only: true",
        "    tmpfs: [/tmp]",
        "    volumes:",
        "      - siem-agent-data:/data   # its SSH CA and keys, sealed with its own key",
        "    secrets: [openasy-agent-kek]",
        "    environment:",
        "      SIEM_URL: http://siem:8080",
        "      SIEM_ENROLL_TOKEN: ${SIEM_ENROLL_TOKEN:-}   # one-time, from Agents",
      );
  });
  lines.push(
    "volumes:",
    ...ids.map((id) => `  ${id}-data:`),
    ...(ids.includes("vpn") && vpnEnrols() ? ["  vpn-server-data:"] : []),
    ...(ids.includes("infrastructure") ? ["  infra-agent-data:"] : []),
    ...(ids.includes("logs") ? ["  logs-agent-data:"] : []),
    ...(ids.includes("siem") ? ["  siem-agent-data:"] : []),
  );
  if (ids.some((id) => statusFor(id).signIn))
    lines.push(
      "secrets:",
      "  openasy-kek:",
      "    file: ./openasy-kek",
      ...(ids.some((id) => id === "infrastructure" || id === "logs") ? ["  openasy-agent-kek:", "    file: ./openasy-agent-kek"] : []),
    );
  return lines.join("\n");
}

/** The compose file, then the commands that start it: the secrets key first, and the owner link afterwards. */
/**
 * Products that run next to a server of their own (OpenCloud, Vaultwarden, Stalwart) or with a file of their own:
 * their page gives the compose file and the example file from the repository at the released tag, tested there end to
 * end, rather than one written here.
 */
export const REPO_COMPOSE: Record<string, { config: string; first: string }> = {
  analytics: { config: "analytics.yaml", first: "List your sites in config/analytics.yaml, then start it." },
  files: { config: "files.yaml", first: "OpenCloud starts first; its app token goes in opencloud-token, as the header of compose.yaml says." },
  passwords: { config: "passwords.yaml", first: "Vaultwarden's organization and its two API keys come first, as the README's Run section says." },
  mail: { config: "mail.yaml", first: "Stalwart's first start is done through its API by Mail, as the header of compose.yaml says." },
  calendar: { config: "calendar.yaml", first: "Mail's first start comes first; then Calendar sets up its account on Stalwart, as the header of compose.yaml says." },
  consent: { config: "consent.yaml", first: "List your purposes and sites in config/consent.yaml, then start it; İYS needs its account in the environment." },
  audience: { config: "audience.yaml", first: "List the linked products in config/audience.yaml, then start it." },
  messages: { config: "messages.yaml", first: "Set your providers in config/messages.yaml and their keys in the environment, then start it." },
  crm: { config: "crm.yaml", first: "Set your pipelines in config/crm.yaml, then start it." },
  helpdesk: { config: "helpdesk.yaml", first: "Set your support mailboxes and queues in config/helpdesk.yaml, then start it." },
  "live-chat": { config: "live-chat.yaml", first: "List your sites and teams in config/live-chat.yaml, then start it." },
  "knowledge-base": { config: "knowledge-base.yaml", first: "Set your topics and languages in config/knowledge-base.yaml, then start it." },
  hr: { config: "hr.yaml", first: "Set your leave rules, who reads what and the link to Identity in config/hr.yaml, then start it." },
  wiki: { config: "wiki.yaml", first: "Set your spaces and who reads and writes them in config/wiki.yaml, then start it." },
  forms: { config: "forms.yaml", first: "Write your forms and where their answers go in config/forms.yaml, then start it." },
  invoices: { config: "invoices.yaml", first: "Set your company, your GİB integrator and your invoice series in config/invoices.yaml, then start it." },
  campaigns: { config: "campaigns.yaml", first: "Set your channels, naming rules and linked products in config/campaigns.yaml, then start it." },
};

export function repoCompose(id: string): string {
  const { config, first } = REPO_COMPOSE[id]!;
  const raw = `https://raw.githubusercontent.com/openasy/${id}/v${statusFor(id).version}`;
  return [
    `mkdir ${id} && cd ${id}`,
    `curl -fsSLO ${raw}/compose.yaml`,
    `curl -fsSL --create-dirs -o config/${config} ${raw}/config/${config}`,
    "openssl rand -hex 32 > openasy-kek   # keep it with your backups",
    `# ${first}`,
    `# The steps: https://github.com/openasy/${id}/tree/v${statusFor(id).version}#run`,
  ].join("\n");
}

export function composeRun(ids: string[]): string {
  const signIn = ids.filter((id) => statusFor(id).signIn);
  return [
    composeFor(ids),
    "",
    "# then",
    ...(signIn.length ? ["openssl rand -hex 32 > openasy-kek   # keep it with your backups"] : []),
    ...(ids.some((id) => id === "infrastructure" || id === "logs") ? ["openssl rand -hex 32 > openasy-agent-kek   # the agent's own key"] : []),
    "docker compose up -d",
    ...signIn.map((id) => `docker compose logs ${id} | grep "no owner yet"   # one-time link that creates the owner`),
    ...(ids.includes("vpn") && vpnEnrols()
      ? ["# add edge-1 under Servers in vpn, then start it with its one-time token:", "EDGE_1_TOKEN=ove_... docker compose up -d vpn-server"]
      : []),
  ].join("\n");
}
