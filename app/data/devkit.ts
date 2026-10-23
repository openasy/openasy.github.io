// The dev setup (/install, "Try it locally"): every released product with every setting, wired together on
// *.localhost by a one-shot setup container, from released images only. Pure, like install.ts; the setup script and
// the code printer are real files in kit/dev, read here as text.
import SETUP from "../../kit/dev/setup.ts?raw";
import CODE from "../../kit/dev/code.ts?raw";
import { INSTALLABLE, PARTS, THIRD_PARTY, authFile, type Install, type InstallFile, type InstallStep, type Installable, type Secrets } from "./install";
import { statusFor } from "./status";

/** Images the dev setup adds to the ones in THIRD_PARTY, pinned the same way (ADR 0027). */
export const DEV_IMAGES = { node: "node:26.12.0-alpine", debian: "debian:13-slim" };
export const DEV_EMAIL = "dev@openasy.localhost";
export const DEV_PASSWORD = "openasy dev password";
export const DEV_FOLDER = "openasy-dev";

const PORT = 8443;
const ROLES = "openasy-admins=admin,openasy-editors=editor,openasy-viewers=viewer";
const url = (id: Installable) => `https://${PARTS[id].sub}.localhost:${PORT}`;
/** The products with a service of their own below; every other one is the same hardened container. */
const OWN = ["identity", "vpn", "infrastructure", "vulnerabilities"];

// A server as Infrastructure's Setup page prepares one: sshd trusts the CA of each agent that reads it, for the
// openasy account only. $$ is a $ that compose leaves alone.
const HOST_DOCKERFILE = `# syntax=docker/dockerfile:1
        FROM ${DEV_IMAGES.debian}
        RUN apt-get update && apt-get install -y --no-install-recommends openssh-server sudo procps iproute2 python3 docker-cli \\
          && rm -rf /var/lib/apt/lists/* && mkdir -p /run/sshd /etc/ssh/principals \\
          && useradd --create-home --shell /bin/sh openasy && passwd -l openasy && echo openasy > /etc/ssh/principals/openasy
        COPY <<EOF /etc/ssh/sshd_config.d/openasy.conf
        TrustedUserCAKeys /etc/ssh/openasy_ca.pub
        AuthorizedPrincipalsFile /etc/ssh/principals/%u
        Match User openasy
          PasswordAuthentication no
          AllowTcpForwarding no
          AllowAgentForwarding no
          X11Forwarding no
          PermitTTY no
        EOF
        COPY <<'EOF' /entrypoint.sh
        set -e
        ssh-keygen -A >/dev/null
        printf '%s\\n%s\\n' "$$OPENASY_CA" "$$OPENASY_CA_LOGS" > /etc/ssh/openasy_ca.pub
        if [ -n "$$OPENASY_SUDOERS" ]; then printf '%b\\n' "$$OPENASY_SUDOERS" > /etc/sudoers.d/openasy && chmod 440 /etc/sudoers.d/openasy && (visudo -cf /etc/sudoers.d/openasy || rm /etc/sudoers.d/openasy); fi
        if [ -n "$$OPENASY_DOCKER" ] && [ -S /var/run/docker.sock ]; then groupadd -g "$$(stat -c %g /var/run/docker.sock)" -o dockerhost && usermod -aG dockerhost openasy; fi
        python3 -m http.server 8088 >/dev/null 2>&1 &
        exec /usr/sbin/sshd -D -e
        EOF
        ENTRYPOINT ["/bin/sh", "/entrypoint.sh"]`;

export function buildDevKit(secrets: Secrets): Install {
  const ids = INSTALLABLE;
  const tag = (id: Installable) => statusFor(id).version!;
  const svc = (id: Installable) => PARTS[id].service;
  const env = (k: string, v: string) => `      ${k}: ${v}`;
  const hosts = ["      - ./config/hosts.yaml:/config/hosts.yaml:ro"];

  /** A product's service: its image, data, Caddy's CA to trust, its key, the brand and, but for Identity, the sign-in. */
  const product = (id: Installable, extra: { volumes?: string[]; env?: string[]; hardened?: boolean } = {}) => {
    const { prefix } = PARTS[id];
    const sso = id !== "identity";
    return [
      `  ${svc(id)}:`,
      `    image: ghcr.io/openasy/${svc(id)}:${tag(id)}`,
      "    restart: unless-stopped",
      "    profiles: [wired]   # started by setup, once Caddy's CA exists",
      ...(extra.hardened === false ? [] : ["    read_only: true", "    tmpfs: [/tmp]"]),
      "    volumes:",
      `      - ${svc(id)}-data:/data`,
      "      - caddy-data:/caddy:ro",
      ...(extra.volumes ?? []),
      "    secrets: [openasy-kek]",
      `    env_file: [config/brand.env${sso ? ", config/auth.env" : ""}]`,
      "    environment:",
      "      <<: [*trust, *products]",
      env(`${prefix}PUBLIC_URL`, url(id)),
      ...(extra.env ?? []),
      // Its own client; the issuer waits in .env until setup has made the clients.
      ...(sso
        ? [
            env("OPENASY_OIDC_ISSUER", "${OPENASY_OIDC_ISSUER:-}"),
            env("OPENASY_OIDC_CLIENT_ID", `\${${prefix}CLIENT_ID:-}`),
            env("OPENASY_OIDC_CLIENT_SECRET", `\${${prefix}CLIENT_SECRET:-}`),
          ]
        : []),
      "    depends_on: [caddy]",
      "",
    ];
  };
  const agent = (name: string, image: string, kek: string, body: string[]) => [
    `  ${name}:`,
    `    image: ${image}`,
    "    restart: unless-stopped",
    "    profiles: [wired]",
    "    read_only: true",
    "    tmpfs: [/tmp]",
    ...body.slice(0, body.indexOf("environment")),
    ...(kek ? ["    secrets:", `      - source: ${kek}`, "        target: openasy-agent-kek"] : []),
    ...body.slice(body.indexOf("environment") + 1),
    "",
  ];

  const compose = [
    "# OpenAsy on this machine: every released product, wired together, to try. Not for production: the dev account",
    "# has a fixed password and HTTPS comes from a local CA. Made at openasy.github.io/install.",
    "#",
    "#   docker compose up -d && docker compose logs -f setup",
    "#",
    "# setup starts the products in order and wires them; README.md says what to open.",
    `name: ${DEV_FOLDER}`,
    "",
    "x-trust: &trust",
    "  # Caddy's local CA, so the products trust Identity's https issuer.",
    "  NODE_EXTRA_CA_CERTS: /caddy/caddy/pki/authorities/local/root.crt",
    "x-products: &products",
    "  # The product switcher in every product's sidebar.",
    `  OPENASY_PRODUCTS: ${ids.map((id) => `${id}=${url(id)}`).join(",")}`,
    "",
    "services:",
    "  caddy:",
    `    image: ${THIRD_PARTY.caddy}`,
    "    restart: unless-stopped",
    "    ports:",
    `      - "127.0.0.1:${PORT}:${PORT}"`,
    "    volumes:",
    "      - ./config/Caddyfile:/etc/caddy/Caddyfile:ro",
    "      - caddy-data:/data",
    "    networks:",
    "      default:",
    "        # Inside the network the same names reach Caddy, so issuer and callback URLs are the same everywhere.",
    `        aliases: [${ids.map((id) => `${PARTS[id].sub}.localhost`).join(", ")}]`,
    "",
    "  # Runs once: starts the products after Caddy's CA exists, then makes the owners, Identity's applications and the",
    "  # agents' tokens (setup/setup.ts). It drives compose through the Docker socket, which is why this is for dev only.",
    "  setup:",
    `    image: ${DEV_IMAGES.node}`,
    '    command: ["sh", "-c", "apk add --no-cache docker-cli docker-cli-compose >/dev/null && exec node setup/setup.ts"]',
    "    working_dir: ${PWD}",
    "    volumes:",
    "      - /var/run/docker.sock:/var/run/docker.sock",
    "      - .:${PWD}   # the same path as on this machine, so compose finds ./config and ./secrets",
    "    depends_on: [caddy]",
    "",
    ...product("identity"),
    ...product("vpn", { hardened: false, env: [env("VPN_PUBLIC_HOST", "localhost")] }),
    "  vpn-server:",
    `    image: ghcr.io/openasy/vpn-server:${tag("vpn")}`,
    "    restart: unless-stopped",
    "    profiles: [wired]",
    "    cap_add: [NET_ADMIN]",
    "    devices: [/dev/net/tun]",
    "    sysctls:",
    "      net.ipv4.ip_forward: 1",
    "    ports:",
    '      - "1194:1194/udp"',
    "    volumes:",
    "      - vpn-server-data:/var/lib/openasy-vpn",
    "    environment:",
    env("VPN_URL", "http://vpn:8080"),
    env("VPN_ENROLL_TOKEN", "${VPN_ENROLL_TOKEN:-}"),
    env("OPENVPN_PROTO", "udp"),
    env("OPENVPN_PORT", '"1194"'),
    "    depends_on: [vpn]",
    "",
    ...product("infrastructure", { volumes: hosts, env: [env("OPENASY_HOSTS", "/config/hosts.yaml")] }),
    ...agent("infra-agent", `ghcr.io/openasy/infra-agent:${tag("infrastructure")}`, "openasy-agent-kek", [
      "    volumes:",
      "      - infra-agent-data:/data",
      "environment",
      "    environment:",
      env("INFRA_URL", "http://infra:8080"),
      env("INFRA_ENROLL_TOKEN", "${INFRA_ENROLL_TOKEN:-}"),
      "    depends_on: [infra]",
    ]),
    ...product("vulnerabilities", { volumes: hosts, env: [env("VULNS_INGEST_TOKEN", "${VULNS_INGEST_TOKEN}"), env("OPENASY_HOSTS", "/config/hosts.yaml")] }),
    ...agent("vulns-agent", `ghcr.io/openasy/vulns-agent:${tag("vulnerabilities")}`, "", [
      "    hostname: docker-vm   # the Linux machine Docker runs in",
      "    volumes:",
      '      - "/:/host:ro"',
      "environment",
      "    environment:",
      env("VULNS_URL", "http://vulns:8080"),
      env("VULNS_INGEST_TOKEN", "${VULNS_INGEST_TOKEN}"),
      "    depends_on: [vulns]",
    ]),
    ...ids
      .filter((id) => !OWN.includes(id))
      .flatMap((id) => {
        const { prefix, ingest, hosts: reads } = PARTS[id];
        return product(id, {
          volumes: reads ? hosts : [],
          env: [...(ingest ? [env(`${prefix}INGEST_TOKEN`, `\${${prefix}INGEST_TOKEN}`)] : []), ...(reads ? [env("OPENASY_HOSTS", "/config/hosts.yaml")] : [])],
        });
      }),
    ...agent("logs-agent", `ghcr.io/openasy/logs-agent:${tag("logs")}`, "openasy-logs-agent-kek", [
      "    volumes:",
      "      - logs-agent-data:/data",
      "environment",
      "    environment:",
      env("LOGS_URL", "http://logs:8080"),
      env("LOGS_ENROLL_TOKEN", "${LOGS_ENROLL_TOKEN:-}"),
      "    depends_on: [logs]",
    ]),
    "  # Two servers for Infrastructure and Logs to read, prepared as Infrastructure's Setup page says. web can also",
    "  # list this machine's containers through Docker.",
    "  host-web:",
    "    build:",
    "      context: .",
    "      dockerfile_inline: |",
    `        ${HOST_DOCKERFILE}`,
    `    image: ${DEV_FOLDER}-host`,
    "    hostname: web",
    "    restart: unless-stopped",
    "    profiles: [wired]",
    "    volumes:",
    "      - /var/run/docker.sock:/var/run/docker.sock",
    "    environment:",
    env("OPENASY_CA", "${INFRA_AGENT_CA:-}"),
    env("OPENASY_CA_LOGS", "${LOGS_AGENT_CA:-}"),
    env("OPENASY_SUDOERS", "${INFRA_AGENT_SUDOERS:-}"),
    env("OPENASY_DOCKER", '"1"'),
    "  host-db:",
    `    image: ${DEV_FOLDER}-host`,
    "    pull_policy: never   # built by host-web",
    "    hostname: db",
    "    restart: unless-stopped",
    "    profiles: [wired]",
    "    environment:",
    env("OPENASY_CA", "${INFRA_AGENT_CA:-}"),
    env("OPENASY_CA_LOGS", "${LOGS_AGENT_CA:-}"),
    "    depends_on: [host-web]",
    "",
    "  prometheus:",
    `    image: ${THIRD_PARTY.prometheus}`,
    "    restart: unless-stopped",
    "    ports:",
    '      - "127.0.0.1:9090:9090"',
    "    volumes:",
    "      - ./config/prometheus.yml:/etc/prometheus/prometheus.yml:ro",
    "      - prometheus-data:/prometheus",
    "",
    "volumes:",
    ...["caddy-data", ...ids.map((id) => `${svc(id)}-data`), "vpn-server-data", "infra-agent-data", "logs-agent-data", "prometheus-data"].map((v) => `  ${v}:`),
    "",
    "secrets:",
    "  openasy-kek:",
    "    file: ./secrets/openasy-kek",
    "  openasy-agent-kek:",
    "    file: ./secrets/openasy-agent-kek",
    "  openasy-logs-agent-kek:",
    "    file: ./secrets/openasy-logs-agent-kek",
  ].join("\n");

  const caddyfile = [
    "# HTTPS for every product with Caddy's own local CA. setup copies its root certificate to config/caddy-root.crt.",
    "{",
    "\tlocal_certs",
    "\tskip_install_trust",
    "\tauto_https disable_redirects",
    "\thttp_port 8080",
    `\thttps_port ${PORT}`,
    "}",
    ...ids.map((id) => `\n${url(id)} {\n\treverse_proxy ${svc(id)}:8080\n}`),
  ].join("\n");

  const hostsFile = [
    "# The servers Infrastructure and Logs read over SSH, and that Vulnerabilities, Posture and Malware check for scans",
    "# (ADR 0052). A change is picked up within a minute. setup accepts their host keys once it has compared them with",
    "# what the servers print.",
    "hosts:",
    "  - name: web",
    "    address: host-web",
    "    containers: true",
    "    tags: { env: dev }",
    "  - name: db",
    "    address: host-db",
    "    tags: { env: dev }",
  ].join("\n");

  const brand = [
    "# The brand every product shows, loaded by each of them (ADR 0053). After a change: docker compose up -d",
    "",
    "# Under each product's name, such as your company.",
    "OPENASY_ORGANIZATION='OpenAsy dev'",
    "# Buttons and links in your color.",
    "# OPENASY_ACCENT=#0a66c2",
    "# Your logo with no text in it: SVG, PNG or WebP. Mount it in each product, as the production setup does.",
    "# OPENASY_LOGO=/config/logo.svg",
  ].join("\n");

  // What setup.ts needs to know of each product: where it is, the prefix of its client in .env, its Identity template.
  const setupProducts = ids.map((id) => ({
    service: svc(id),
    url: url(id),
    prefix: PARTS[id].prefix,
    ...(PARTS[id].template && { template: PARTS[id].template }),
  }));

  const steps: InstallStep[] = [
    { title: "Download and unzip", text: "The folder holds its own keys, made in this browser and never sent." },
    {
      title: "Start it",
      text: "setup wires the products together and says when it is done.",
      code: "docker compose up -d && docker compose logs -f setup",
      note: "The first start pulls the images and takes a few minutes.",
    },
    {
      title: "Open Identity and sign in",
      text: `Go to ${url("identity")} as ${DEV_EMAIL} with the password "${DEV_PASSWORD}". Every other product then signs you in by itself.`,
      code: "docker compose run --rm --no-deps setup node setup/code.ts",
      note: "Prints the two-step code.",
    },
  ];
  const more: InstallStep[] = [
    {
      title: "Trust the local CA",
      text: "Once, so the browser accepts https://*.localhost without a warning. On macOS:",
      code: "security add-trusted-cert -r trustRoot -k ~/Library/Keychains/login.keychain-db config/caddy-root.crt",
    },
    {
      title: "Stop, or start over",
      text: "The first keeps the data. The second deletes it: unzip again to start from nothing.",
      code: "docker compose --profile wired down\ndocker compose --profile wired down -v",
    },
  ];

  const readme = [
    "# OpenAsy on this machine",
    "",
    "Every released OpenAsy product, wired together the way a real install is, to try. Not for production: the dev",
    "account has a fixed password, HTTPS comes from a local CA, and setup drives Docker through its socket.",
    "",
    ...[...steps, ...more].flatMap((s, i) => [
      `${i + 1}. **${s.title}.** ${s.text}`,
      ...(s.code ? ["", "   ```", ...s.code.split("\n").map((l) => `   ${l}`), "   ```"] : []),
      ...(s.note ? ["", `   ${s.note}`] : []),
      "",
    ]),
    "| Product | Address |",
    "| --- | --- |",
    ...ids.map((id) => `| ${PARTS[id].name} | ${url(id)} |`),
    "| Prometheus | http://localhost:9090/targets |",
    "",
    "What is set up: Identity signs everyone in, with groups that decide the role in each product. VPN has a server on",
    "UDP 1194. Infrastructure's and Logs' agents read the two servers in config/hosts.yaml over SSH; Vulnerabilities,",
    "Posture and Malware show which of them send no scan. Products that take data from CI have their ingest token in",
    ".env. config/brand.env holds the brand and config/auth.env the sign-in: change them and run docker compose up -d.",
  ].join("\n");

  const ingest = ids.filter((id) => PARTS[id].ingest);
  const files: InstallFile[] = [
    { name: "compose.yaml", content: compose },
    { name: "README.md", content: readme },
    {
      name: ".env",
      content: [
        "# The dev setup's tokens and clients; setup/setup.ts adds to it. Keep out of git.",
        ...ingest.map((id) => `${PARTS[id].prefix}INGEST_TOKEN=${id === "vulnerabilities" ? secrets.ingest : secrets.tokens[id]}`),
      ].join("\n"),
      secret: true,
    },
    { name: "config/brand.env", content: brand },
    {
      name: "config/auth.env",
      content: authFile(
        { OPENASY_OIDC_PROVIDER: "openasy-identity", OPENASY_OIDC_ROLE_MAPPING: ROLES, OPENASY_OIDC_AUTO_REDIRECT: "true" },
        "Every product but Identity signs in through Identity; Identity keeps its own people.",
      ),
    },
    { name: "config/hosts.yaml", content: hostsFile },
    { name: "config/Caddyfile", content: caddyfile },
    {
      name: "config/prometheus.yml",
      content: [
        "global:",
        "  scrape_interval: 15s",
        "scrape_configs:",
        ...ids.map((id) => `  - job_name: ${svc(id)}\n    static_configs: [{ targets: ["${svc(id)}:8080"] }]`),
      ].join("\n"),
    },
    { name: "setup/setup.ts", content: SETUP.trimEnd() },
    { name: "setup/products.json", content: JSON.stringify(setupProducts, null, 2) },
    { name: "setup/code.ts", content: CODE.trimEnd() },
    { name: "secrets/openasy-kek", content: secrets.kek, secret: true },
    { name: "secrets/openasy-agent-kek", content: secrets.agentKek, secret: true },
    { name: "secrets/openasy-logs-agent-kek", content: secrets.logsAgentKek, secret: true },
  ];
  const services = ["caddy", "setup", ...ids.map(svc), "vpn-server", "infra-agent", "vulns-agent", "logs-agent", "host-web", "host-db", "prometheus"];
  const wiring = [
    { title: "Identity signs everyone in", text: `as ${DEV_EMAIL}, an admin in every product through openasy-admins.` },
    { title: "setup wires it once", text: "owners, applications and the agents' tokens, then it exits. Running it again skips what is done." },
    {
      title: "Two servers in config/hosts.yaml",
      text: "read over SSH by Infrastructure and Logs; Vulnerabilities, Posture and Malware show they send no scan.",
    },
    { title: "Caddy serves HTTPS", text: `on *.localhost:${PORT}, with a local CA you trust once.` },
    { title: "Released images only", text: `${ids.map((id) => `${PARTS[id].name} ${tag(id)}`).join(", ")}.` },
  ];
  return { files, steps, more, wiring, addresses: ids.map(url), hosts: [], services };
}
