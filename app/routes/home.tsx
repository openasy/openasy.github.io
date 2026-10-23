import { Link } from "react-router";
import { ArrowRight, Check } from "lucide-react";
import { PRODUCT_IDS, PRODUCTS, cn, type ProductGroup } from "@openasy/ui";
import { GOALS } from "../data/goals";
import { PRINCIPLES } from "../data/principles";
import { statusFor, withStatus } from "../data/status";
import { storyUrl } from "../data/storybook";
import { ButtonLink, Section } from "../components/site";
import { GoalCard, ProductStatusBadge, product } from "../components/cards";
import { BreachToday } from "../components/breach";

export function meta() {
  return [
    { title: "OpenAsy · Open-source tools to run and secure your infrastructure" },
    {
      name: "description",
      content: "38 open-source products for operations and security. Run one, or all of them together. Self-hosted, SQLite by default, no telemetry.",
    },
  ];
}

export const GROUPS: Array<{ id: ProductGroup; name: string; text: string }> = [
  { id: "operations", name: "Operations", text: "Keep systems running and know why they are slow." },
  { id: "security", name: "Security", text: "Find weaknesses, detect attacks and respond." },
  { id: "identity", name: "Identity", text: "Who people are and what they may do." },
  { id: "platform", name: "Platform", text: "Automate and ask questions across all of it." },
];

const WHY = [
  { title: "Start with one", text: "Every product runs on its own in one container. Add others when you need them." },
  { title: "Work together", text: "Linked products share hosts, users and IPs, and open each other's screens." },
  { title: "Fit your tools", text: "OIDC, SAML, OpenTelemetry, Prometheus, Syslog, Sigma and webhooks, both ways." },
  { title: "Secure by default", text: "TLS, MFA, least privilege and an audit log of every admin action." },
  { title: "Simple to run", text: "SQLite by default, daily backups, restore to a point in time." },
  { title: "Open source", text: "AGPL-3.0, no telemetry, runs air-gapped. Read every line." },
];

/** "VPN", "VPN and Logs", "VPN, Logs and SIEM". */
const names = (ids: string[]) => {
  const n = ids.map((id) => product(id).name);
  return n.length < 2 ? (n[0] ?? "") : `${n.slice(0, -1).join(", ")} and ${n.at(-1)}`;
};

const released = withStatus(PRODUCT_IDS, "Preview");
const building = withStatus(PRODUCT_IDS, "In progress");
const designed = PRODUCT_IDS.length - released.length - building.length;
/** Released products that also install on Kubernetes. */
const withHelm = released.filter((id) => statusFor(id).helm);

/** "Docker Compose" or "Docker Compose or Helm on Kubernetes". */
const installWays = (id: string) => (statusFor(id).helm ? "Docker Compose, or Helm on Kubernetes" : "Docker Compose");

// Kept short for the hero; the full file is on the product page.
const vpnTag = statusFor("vpn").version;
const HERO_COMPOSE = `services:
  vpn:
    image: ghcr.io/openasy/vpn:${vpnTag}
    ports: ["8443:8080"]
    volumes: [vpn-data:/data]
  vpn-server:
    image: ghcr.io/openasy/vpn-server:${vpnTag}
    cap_add: [NET_ADMIN]
    devices: [/dev/net/tun]
    ports: ["1194:1194/udp"]
volumes:
  vpn-data:

$ docker compose up -d`;

const CHIP = {
  Preview: "border-accent bg-accent font-semibold text-accent-contrast",
  "In progress": "border-dashed border-warning bg-warning-soft font-medium text-warning-text",
  Designed: "border-line bg-surface text-fg",
} as const;

function Legend() {
  return (
    <div className="flex flex-wrap gap-4 text-sm text-fg-muted">
      <span className="flex items-center gap-2">
        <span aria-hidden className={cn("size-3.5 rounded border", CHIP.Preview)} />
        Ready to try
      </span>
      <span className="flex items-center gap-2">
        <span aria-hidden className={cn("size-3.5 rounded border", CHIP["In progress"])} />
        In progress
      </span>
      <span className="flex items-center gap-2">
        <span aria-hidden className={cn("size-3.5 rounded border", CHIP.Designed)} />
        Designed
      </span>
    </div>
  );
}

function ReleasedCard({ id }: { id: string }) {
  const p = product(id);
  const s = statusFor(id);
  const done = s.features.filter((f) => f.done);
  const notYet = s.features.filter((f) => !f.done);
  return (
    <li className="flex flex-col rounded-xl border border-line bg-surface p-6">
      <div className="flex flex-wrap items-center gap-2.5">
        <h3 className="m-0 text-xl font-semibold">{p.name}</h3>
        <ProductStatusBadge id={id} />
      </div>
      <p className="mt-2 mb-0 text-fg-muted">{p.summary}</p>
      <ul aria-label={`What works in ${p.name}`} className="mt-4 flex list-none flex-col gap-2 p-0">
        {done.slice(0, 4).map((f) => (
          <li key={f.title} className="flex items-start gap-2.5">
            <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
            {f.title}
          </li>
        ))}
      </ul>
      {notYet.length > 0 && (
        <>
          <p className="mt-4 mb-2 text-xs font-semibold tracking-wide text-fg-subtle uppercase">Not yet</p>
          <ul aria-label={`Not yet in ${p.name}`} className="m-0 flex list-none flex-wrap gap-2 p-0">
            {notYet.map((f) => (
              <li key={f.title} className="rounded-md border border-dashed border-line-strong px-2 py-0.5 text-sm text-fg-muted">
                {f.title}
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="mt-5 mb-0 text-sm text-fg-muted">Installs with {installWays(id)}.</p>
      <div className="mt-auto flex flex-wrap gap-2 pt-6">
        <ButtonLink to={`/products/${id}`} variant="primary" size="lg">
          Install {p.name}
        </ButtonLink>
        <ButtonLink to={storyUrl(p.name)} size="lg" external>
          See every screen
        </ButtonLink>
      </div>
    </li>
  );
}

function BuildingCard({ id }: { id: string }) {
  const p = product(id);
  const done = statusFor(id).features.filter((f) => f.done);
  return (
    <li className="flex flex-col rounded-xl border border-dashed border-line-strong bg-canvas p-6">
      <div className="flex flex-wrap items-center gap-2.5">
        <h3 className="m-0 text-xl font-semibold">{p.name}</h3>
        <ProductStatusBadge id={id} />
      </div>
      <p className="mt-2 mb-0 text-fg-muted">{p.summary}</p>
      <p className="mt-4 mb-0">Being built now. The screens are already designed, so you can see where it is going.</p>
      {done.length > 0 && (
        <>
          <p className="mt-4 mb-2 text-xs font-semibold tracking-wide text-fg-subtle uppercase">Works in the first release</p>
          <ul aria-label={`Built in ${p.name}`} className="m-0 flex list-none flex-col gap-2 p-0">
            {done.slice(0, 3).map((f) => (
              <li key={f.title} className="flex items-start gap-2.5 text-fg-muted">
                <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                {f.title}
              </li>
            ))}
          </ul>
          <p className="mt-4 mb-0 text-sm text-fg-muted">Will install with {installWays(id)}.</p>
        </>
      )}
      <div className="mt-auto flex flex-wrap gap-2 pt-6">
        <ButtonLink to={storyUrl(p.name)} size="lg" external>
          See the design
        </ButtonLink>
        <ButtonLink to={`/products/${id}`} size="lg">
          Read more
        </ButtonLink>
      </div>
    </li>
  );
}

export default function Home() {
  const readyLine = released.length
    ? `${names(released)} ${released.length === 1 ? "is" : "are"} ready to try today${building.length ? `, and ${names(building)} ${building.length === 1 ? "is" : "are"} next` : ""}.`
    : "";
  return (
    <>
      {/* Fixed navy in both themes: the hero reads as the product's terminal. */}
      <div className="bg-[#0f1a2e] text-[#e8eef7]">
        <Section className="flex flex-wrap items-center gap-12 pt-14 pb-24 sm:pt-20" labelledBy="hero">
          <div className="min-w-0 flex-[1_1_520px]">
            <p className="m-0 font-mono text-xs tracking-wider text-[#9db5f0]">OPEN SOURCE · SELF-HOSTED · AGPL-3.0</p>
            <h1 id="hero" className="mt-4 mb-0 max-w-3xl text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
              Run and secure your infrastructure with tools you own.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#b0bdd3]">
              {PRODUCT_IDS.length} products for operations and security that work alone, together, or next to what you already run. {readyLine} Your data never
              leaves your network.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href="#available"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#1f4fd8] px-5 font-semibold text-white no-underline hover:bg-[#1a44bb]"
              >
                {released.length === 1 ? `Try the ${product(released[0]!).name}` : "Try what is ready"} <ArrowRight aria-hidden className="size-4" />
              </a>
              <Link
                to="/goals"
                className="inline-flex h-11 items-center justify-center rounded-md border border-[#3c4e72] px-5 font-medium text-[#e8eef7] no-underline hover:bg-[#16233b]"
              >
                Start from a goal
              </Link>
            </div>
          </div>
          <figure className="m-0 min-w-0 flex-[1_1_420px]">
            <div className="overflow-hidden rounded-xl border border-[#2b3b5a] bg-[#16233b] shadow-modal">
              <div className="flex items-center gap-2 border-b border-[#2b3b5a] px-4 py-3">
                <span aria-hidden className="size-2.5 rounded-full bg-[#3c4e72]" />
                <span aria-hidden className="size-2.5 rounded-full bg-[#3c4e72]" />
                <span aria-hidden className="size-2.5 rounded-full bg-[#3c4e72]" />
                <span className="ml-2 grow font-mono text-xs text-[#93a2bd]">compose.yaml</span>
                <span className="rounded bg-[#12301f] px-2 py-0.5 text-xs font-semibold text-[#4cc38a]">Preview {vpnTag}</span>
              </div>
              <pre
                tabIndex={0}
                aria-label="compose.yaml for the VPN"
                className="m-0 overflow-x-auto p-3.5 font-mono text-[12px] leading-relaxed text-[#e8eef7] sm:p-5 sm:text-[13px]"
              >
                <code>{HERO_COMPOSE}</code>
              </pre>
            </div>
            <figcaption className="mt-3 text-sm text-[#93a2bd]">
              The VPN in one file. Every product installs the same way{withHelm.length ? `, and ${names(withHelm)} also with Helm on Kubernetes` : ""}.{" "}
              <Link to="/products/vpn#run" className="text-[#9db5f0]">
                VPN servers at the edge or at several locations
              </Link>
            </figcaption>
          </figure>
        </Section>
      </div>

      <Section className="-mt-10" labelledBy="status">
        <h2 id="status" className="sr-only">
          Where OpenAsy is today
        </h2>
        <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line shadow-overlay sm:grid-cols-3">
          {[
            { n: released.length, label: "Ready to try", text: `${names(released)}, released for testing.`, tone: "text-success" },
            {
              n: building.length,
              label: "In progress",
              text: building.length ? `${names(building)}, being built now.` : "The next one starts soon.",
              tone: "text-warning-text",
            },
            { n: designed, label: "Designed", text: "Every screen is in Storybook. Click through them now.", tone: "" },
          ].map((c) => (
            <div key={c.label} className="bg-surface p-6">
              <p className={cn("m-0 text-4xl leading-none font-semibold", c.tone)}>{c.n}</p>
              <p className="mt-2 mb-0 font-semibold">{c.label}</p>
              <p className="mt-1 mb-0 text-sm text-fg-muted">{c.text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="pt-20" labelledBy="available">
        <p className="m-0 font-mono text-xs tracking-wider text-accent-text">AVAILABLE NOW</p>
        <h2 id="available" className="mt-2 mb-0 scroll-mt-20 text-3xl font-semibold tracking-tight">
          Ready to try, and what is next
        </h2>
        <p className="mt-3 max-w-2xl text-base text-fg-muted">
          A product ships when it works on its own. Each card says exactly what works today and what does not yet.
        </p>
        <ul aria-label="Released and in progress products" className="mt-8 grid list-none gap-5 p-0 lg:grid-cols-2">
          {released.map((id) => (
            <ReleasedCard key={id} id={id} />
          ))}
          {building.map((id) => (
            <BuildingCard key={id} id={id} />
          ))}
        </ul>
      </Section>

      <Section className="pt-20" labelledBy="goals">
        <h2 id="goals" className="m-0 text-3xl font-semibold tracking-tight">
          What do you need?
        </h2>
        <p className="mt-3 max-w-2xl text-base text-fg-muted">
          Start from the problem, not the product list. Each guide names the smallest set of products and how to install them.
        </p>
        <ul className="mt-8 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {GOALS.map((g) => (
            <GoalCard key={g.id} goal={g} />
          ))}
        </ul>
      </Section>

      <Section className="pt-20" labelledBy="breach">
        <div className="rounded-2xl border border-line bg-surface p-6 sm:p-10">
          <h2 id="breach" className="m-0 text-3xl font-semibold tracking-tight">
            Would you catch a breach?
          </h2>
          <div className="mt-3">
            <BreachToday released={released} />
          </div>
        </div>
      </Section>

      <Section className="pt-20" labelledBy="why">
        <h2 id="why" className="m-0 text-3xl font-semibold tracking-tight">
          Built to be adopted one piece at a time
        </h2>
        <ul className="mt-8 grid list-none gap-x-10 gap-y-8 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {WHY.map((w) => (
            <li key={w.title} className="border-t-2 border-fg pt-4">
              <p className="m-0 text-lg font-semibold">{w.title}</p>
              <p className="mt-2 mb-0 text-fg-muted">{w.text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 mb-0">
          <Link to="/principles" className="inline-flex min-h-11 items-center sm:min-h-0">
            All {PRINCIPLES.length} design decisions, and how far each is built
          </Link>
        </p>
      </Section>

      <Section className="pt-20" labelledBy="catalog">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h2 id="catalog" className="m-0 text-3xl font-semibold tracking-tight">
              All {PRODUCT_IDS.length} products
            </h2>
            <p className="mt-3 mb-4 text-base text-fg-muted">
              Each is its own container with its own users, data and API. Linked, they share hosts, people and alerts.
            </p>
            <Legend />
          </div>
          <ButtonLink to="/products" size="lg">
            Browse products
          </ButtonLink>
        </div>
        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {GROUPS.map((g) => {
            const ids = PRODUCT_IDS.filter((id) => PRODUCTS[id].group === g.id);
            return (
              <div key={g.id}>
                <h3 className="m-0 text-base font-semibold">
                  {g.name} <span className="font-normal text-fg-subtle">{ids.length}</span>
                </h3>
                <p className="mt-1 mb-3 text-sm text-fg-muted">{g.text}</p>
                <ul aria-label={`${g.name} products`} className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                  {ids.map((id) => (
                    <li key={id}>
                      <Link
                        to={`/products/${id}`}
                        className={cn("inline-block rounded-md border px-2.5 py-1 text-sm no-underline hover:shadow-raised", CHIP[statusFor(id).status])}
                      >
                        {PRODUCTS[id].name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </Section>
    </>
  );
}
