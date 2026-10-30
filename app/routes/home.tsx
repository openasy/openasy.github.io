import { useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Check, KeyRound, Lock, Scale, Server, WifiOff } from "lucide-react";
import { Badge, PRODUCT_IDS, PRODUCTS, cn, type ProductGroup, type ProductId } from "@openasy/ui";
import { GOALS } from "../data/goals";
import { PRINCIPLES } from "../data/principles";
import { CLAIMS, GRADES, GRADE_TONE, JUDGMENT, type Grade } from "../data/evidence";
import { statusFor, withStatus } from "../data/status";
import { PLANS } from "../data/support";
import { hasScreenshot, screenshot, storyFor } from "../data/products";
import { ButtonLink, Section } from "../components/site";
import { GoalCard, product } from "../components/cards";
import { BreachToday } from "../components/breach";
import { Screenshot, heroScreen } from "../components/story";

export function meta() {
  return [
    { title: "OpenAsy · Open-source tools to run and secure your infrastructure" },
    {
      name: "description",
      content: `${PRODUCT_IDS.length} open-source products for operations and security. Run one, or all of them together. Self-hosted, SQLite by default, no telemetry.`,
    },
  ];
}

export const GROUPS: Array<{ id: ProductGroup; name: string; text: string }> = [
  { id: "operations", name: "Operations", text: "Keep systems running and know why they are slow." },
  { id: "security", name: "Security", text: "Find weaknesses, detect attacks and respond." },
  { id: "workplace", name: "Workplace", text: "The tools a company works in every day, on its own servers." },
  { id: "people", name: "People", text: "Hire, look after and pay the people who work here." },
  { id: "service", name: "Service", text: "Answer customers wherever they ask." },
  { id: "growth", name: "Growth", text: "Know your customers, reach them with their consent, and sell." },
  { id: "finance", name: "Finance", text: "Bill, buy, sign and count what the company owns." },
  { id: "platform", name: "Platform", text: "Automate and ask questions across all of it." },
];

// The claims shown on the home page; the rest are on /evidence.
const FEATURED = ["one-signal", "new-findings", "passkeys"];

const released = withStatus(PRODUCT_IDS, "Preview");
/** Released products that also install on Kubernetes. */
const withHelm = released.filter((id) => statusFor(id).helm);

/** "VPN", "VPN and Logs", "VPN, Logs and SIEM". */
const names = (ids: string[]) => {
  const n = ids.map((id) => product(id).name);
  return n.length < 2 ? (n[0] ?? "") : `${n.slice(0, -1).join(", ")} and ${n.at(-1)}`;
};

// The products the hero shows at work, each on the screen people open first. The hero is dark in both themes.
const HERO_SHOTS: Array<{ id: ProductId; page: string; caption: string }> = [
  { id: "siem", page: "signals", caption: "SIEM: a beacon to a known C2 address, found by a Sigma rule and opened as an incident." },
  { id: "metrics", page: "dashboard", caption: "Metrics: a payments API over its latency SLO, a minute after one host ran out of CPU." },
  { id: "vpn", page: "sessions", caption: "VPN: who is connected right now, from where, and a way to end any session." },
  { id: "logs", page: "explorer", caption: "Logs: every host's lines in one place, searched as they arrive." },
  { id: "uptime", page: "checks", caption: "Uptime: HTTP, TCP, DNS and TLS checks run from where your users are." },
  { id: "identity", page: "people", caption: "Identity: one sign-in for every product, with passkeys and the groups that give roles." },
];

const PROMISES = [
  { icon: Scale, title: "Every feature free", text: "AGPL-3.0, no enterprise edition, no licence key." },
  { icon: WifiOff, title: "Runs air-gapped", text: "No telemetry, no CDN, nothing leaves your network." },
  { icon: Server, title: "One container each", text: "SQLite by default; back up one volume per product." },
  { icon: KeyRound, title: "One sign-in", text: "Identity, Keycloak or Entra ID, with MFA and passkeys." },
  { icon: Lock, title: "Secure by default", text: "TLS, least privilege and an audit log of every change." },
];

const TOGETHER = [
  "Sign in once through Identity, or any OIDC provider, and move between products from one switcher.",
  "One list of servers, endpoints and repositories in files every product reads, kept in git if you like.",
  "Signals open incidents, failing checks page whoever is on call, and every product is scraped by Metrics.",
  "Each product keeps its own data and API, so leaving one out breaks nothing else.",
];

const WHY = [
  { title: "Start with one", text: "Every product runs on its own in one container. Add others when you need them." },
  { title: "Fit your tools", text: "OIDC, SAML, OpenTelemetry, Prometheus, Syslog, Sigma and webhooks, both ways." },
  { title: "Simple to run", text: "SQLite by default, one volume per product, forward-only upgrades." },
];

// Kept short; the full file is on the product page.
const vpnTag = statusFor("vpn").version;
const VPN_COMPOSE = `services:
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

/** The hero's product window: real screens, one product at a time, picked from a row of tabs. */
function HeroScreens() {
  const [open, setOpen] = useState(0);
  const shot = HERO_SHOTS[open]!;
  return (
    <figure className="m-0">
      <div role="tablist" aria-label="Products at work" className="flex gap-1.5 overflow-x-auto pb-3">
        {HERO_SHOTS.map((s, i) => {
          const Icon = PRODUCTS[s.id].icon;
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              id={`hero-tab-${s.id}`}
              aria-selected={i === open}
              aria-controls="hero-screen"
              onClick={() => setOpen(i)}
              className={cn(
                "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm transition-colors sm:min-h-9",
                i === open ? "border-fg bg-fg font-semibold text-canvas" : "border-line bg-surface text-fg-muted hover:border-line-strong hover:text-fg",
              )}
            >
              <Icon aria-hidden className="size-4" />
              {PRODUCTS[s.id].name}
            </button>
          );
        })}
      </div>
      <div
        id="hero-screen"
        role="tabpanel"
        aria-labelledby={`hero-tab-${shot.id}`}
        className="overflow-hidden rounded-xl border border-line bg-surface shadow-[0_24px_60px_-24px_rgba(15,26,46,0.35)]"
      >
        <div className="flex items-center gap-2 border-b border-line bg-subtle px-4 py-2.5">
          <span aria-hidden className="size-2.5 rounded-full bg-line-strong" />
          <span aria-hidden className="size-2.5 rounded-full bg-line-strong" />
          <span aria-hidden className="size-2.5 rounded-full bg-line-strong" />
          <span className="ml-2 truncate font-mono text-xs text-fg-subtle">{shot.id}.example.com</span>
        </div>
        <Link to={`/products/${shot.id}`} className="block" aria-label={`${PRODUCTS[shot.id].name}: open the product page`}>
          {(["light", "dark"] as const).map((theme) => (
            <img
              key={theme}
              src={screenshot(shot.id, shot.page, theme)}
              alt={shot.caption}
              width={1440}
              height={900}
              fetchPriority={open === 0 && theme === "light" ? "high" : undefined}
              loading={theme === "dark" ? "lazy" : undefined}
              className={cn("h-auto w-full", theme === "light" ? "block dark:hidden" : "hidden dark:block")}
            />
          ))}
        </Link>
      </div>
      <figcaption className="mt-3 min-h-10 text-sm text-fg-muted">{shot.caption}</figcaption>
    </figure>
  );
}

/** Every product of a group: pick one on the left and see its first screen on the right. */
function Showcase() {
  const [group, setGroup] = useState<ProductGroup>("operations");
  const ids = PRODUCT_IDS.filter((id) => PRODUCTS[id].group === group);
  const [picked, setPicked] = useState<Record<ProductGroup, ProductId | undefined>>({
    operations: undefined,
    security: undefined,
    growth: undefined,
    workplace: undefined,
    people: undefined,
    service: undefined,
    finance: undefined,
    platform: undefined,
  });
  const id = picked[group] ?? ids[0]!;
  const story = storyFor(id);
  const screen = story && heroScreen(id, story);
  const p = product(id);
  const s = statusFor(id);
  return (
    <div className="mt-8">
      <div role="tablist" aria-label="Product groups" className="flex flex-wrap gap-2">
        {GROUPS.map((g) => {
          const n = PRODUCT_IDS.filter((x) => PRODUCTS[x].group === g.id).length;
          return (
            <button
              key={g.id}
              type="button"
              role="tab"
              aria-selected={g.id === group}
              onClick={() => setGroup(g.id)}
              className={cn(
                "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm sm:min-h-9",
                g.id === group ? "border-fg bg-fg font-semibold text-canvas" : "border-line bg-surface text-fg hover:border-line-strong",
              )}
            >
              {g.name}
              <span className={g.id === group ? "opacity-70" : "text-fg-subtle"}>{n}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 mb-0 text-fg-muted">{GROUPS.find((g) => g.id === group)!.text}</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,8fr)]">
        <ul aria-label={`${GROUPS.find((g) => g.id === group)!.name} products`} className="m-0 flex list-none flex-col gap-1 p-0">
          {ids.map((x) => {
            const Icon = PRODUCTS[x].icon;
            const on = x === id;
            return (
              <li key={x}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => setPicked((m) => ({ ...m, [group]: x }))}
                  className={cn(
                    "flex min-h-11 w-full items-start gap-3 rounded-lg border px-3 py-2 text-left",
                    on ? "border-accent bg-accent-soft" : "border-transparent hover:bg-subtle",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "mt-0.5 grid size-7 shrink-0 place-items-center rounded-md",
                      on ? "bg-accent text-accent-contrast" : "bg-subtle text-fg-muted",
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="font-semibold text-fg">{PRODUCTS[x].name}</span>
                    {on && <span className="text-sm text-fg-muted">{PRODUCTS[x].summary}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="order-first flex min-w-0 flex-col self-start overflow-hidden rounded-xl border border-line bg-surface shadow-raised lg:sticky lg:top-24 lg:order-none">
          {screen ? (
            <Screenshot id={id} screen={screen} className="border-b border-line" />
          ) : (
            <div className="grid aspect-[16/10] place-items-center border-b border-line bg-subtle p-8 text-center text-fg-muted">
              Screens of {p.name} follow its first release.
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-semibold">{p.name}</span>
                <Badge tone={s.status === "Preview" ? "success" : "warning"}>{s.status === "Preview" ? `Preview ${s.version}` : s.status}</Badge>
              </span>
              <span className="text-sm text-fg-muted">{story?.problem.title ?? p.summary}</span>
            </div>
            <ButtonLink to={`/products/${id}`} size="lg">
              {s.status === "Preview" ? `Install ${p.name}` : `About ${p.name}`}
            </ButtonLink>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kicker({ children }: { children: string }) {
  return <p className="m-0 font-mono text-xs tracking-wider text-accent-text">{children}</p>;
}

export default function Home() {
  return (
    <>
      <div className="border-b border-line bg-surface">
        <Section className="pt-14 pb-12 sm:pt-20" labelledBy="hero">
          <div className="grid items-end gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
            <div className="min-w-0">
              <p className="m-0 font-mono text-xs tracking-wider text-accent-text">OPEN SOURCE · SELF-HOSTED · AGPL-3.0</p>
              <h1 id="hero" className="mt-4 mb-0 text-4xl leading-[1.08] font-semibold tracking-tight sm:text-6xl">
                Run and secure your infrastructure with tools you own.
              </h1>
            </div>
            <div className="min-w-0">
              <p className="m-0 text-lg leading-relaxed text-fg-muted">
                {PRODUCT_IDS.length} products for operations and security, {released.length} of them released and free to run today. Start with one container,
                add the rest when you need them. Your data never leaves your network.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  to="/install"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-accent px-5 font-semibold text-accent-contrast no-underline hover:bg-accent-hover"
                >
                  Build your install <ArrowRight aria-hidden className="size-4" />
                </Link>
                <Link
                  to="/goals"
                  className="inline-flex h-11 items-center justify-center rounded-md border border-line-strong bg-surface px-5 font-medium text-fg no-underline hover:bg-subtle"
                >
                  Start from a goal
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-12">
            <HeroScreens />
          </div>
        </Section>
        <div className="border-t border-line">
          <Section labelledBy="promises">
            <h2 id="promises" className="sr-only">
              What every product promises
            </h2>
            <ul className="m-0 grid list-none grid-cols-1 gap-x-8 gap-y-5 px-0 py-8 sm:grid-cols-2 lg:grid-cols-5">
              {PROMISES.map((x) => (
                <li key={x.title} className="flex gap-3">
                  <x.icon aria-hidden className="mt-0.5 size-5 shrink-0 text-accent-text" />
                  <span className="flex flex-col gap-0.5">
                    <span className="font-semibold">{x.title}</span>
                    <span className="text-sm text-fg-muted">{x.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>

      <Section className="pt-24" labelledBy="goals">
        <Kicker>START FROM WHAT YOU NEED</Kicker>
        <h2 id="goals" className="mt-2 mb-0 text-3xl font-semibold tracking-tight sm:text-4xl">
          What do you need to do?
        </h2>
        <p className="mt-3 max-w-2xl text-base text-fg-muted">
          Start from the problem, not the product list. Each guide names the fewest products that do the job, and installs them step by step.
        </p>
        <ul className="mt-8 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {GOALS.map((g) => (
            <GoalCard key={g.id} goal={g} />
          ))}
        </ul>
      </Section>

      <Section className="pt-24" labelledBy="products">
        <Kicker>EVERY PRODUCT, AT WORK</Kicker>
        <h2 id="products" className="mt-2 mb-0 text-3xl font-semibold tracking-tight sm:text-4xl">
          {PRODUCT_IDS.length} products, one way of working
        </h2>
        <p className="mt-3 max-w-2xl text-base text-fg-muted">
          The same sign-in, the same screens and the same API style in each. These are the real products, with sample data.
        </p>
        <Showcase />
      </Section>

      <Section className="pt-24" labelledBy="together">
        <Kicker>ALONE OR TOGETHER</Kicker>
        <h2 id="together" className="mt-2 mb-0 text-3xl font-semibold tracking-tight sm:text-4xl">
          Install one in minutes. Link the rest when you are ready.
        </h2>
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <figure className="m-0 flex min-w-0 flex-col">
            <div className="overflow-hidden rounded-xl border border-line bg-surface">
              <div className="flex items-center justify-between gap-2 border-b border-line bg-subtle px-4 py-2.5">
                <span className="font-mono text-xs text-fg-subtle">compose.yaml</span>
                <span className="rounded bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">Preview {vpnTag}</span>
              </div>
              <pre
                tabIndex={0}
                aria-label="compose.yaml for the VPN"
                className="m-0 overflow-x-auto p-4 font-mono text-[12px] leading-relaxed text-fg sm:p-5 sm:text-[13px]"
              >
                <code>{VPN_COMPOSE}</code>
              </pre>
            </div>
            <figcaption className="mt-3 text-sm text-fg-muted">
              The VPN and its server in one file. Every product installs the same way
              {withHelm.length ? `, and ${names(withHelm)} also with Helm on Kubernetes` : ""}.
            </figcaption>
          </figure>
          <div className="flex min-w-0 flex-col">
            <h3 className="m-0 text-xl font-semibold">Linked, they work as one</h3>
            <ul className="mt-4 mb-0 flex list-none flex-col gap-3 p-0">
              {TOGETHER.map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-2">
              <ButtonLink to="/install" variant="primary" size="lg">
                Build your install
              </ButtonLink>
              <ButtonLink to="/products" size="lg">
                Browse products
              </ButtonLink>
            </div>
          </div>
        </div>
        <div className="mt-12 rounded-2xl border border-line bg-surface p-6 sm:p-10">
          <h3 id="breach" className="m-0 text-2xl font-semibold tracking-tight">
            Would you catch a breach?
          </h3>
          <div className="mt-3">
            <BreachToday released={released} />
          </div>
        </div>
      </Section>

      <Section className="pt-24" labelledBy="evidence">
        <Kicker>DECISIONS YOU CAN READ</Kicker>
        <h2 id="evidence" className="mt-2 mb-0 text-3xl font-semibold tracking-tight sm:text-4xl">
          Why it is built this way
        </h2>
        <p className="mt-3 max-w-2xl text-base text-fg-muted">
          Every design decision is written down, with how far it is built. Each says what it rests on: a study, a standard, published practice, or our own
          judgment, called that.
        </p>
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
          <div>
            <ul className="m-0 flex list-none flex-col gap-6 p-0">
              {WHY.map((w) => (
                <li key={w.title} className="border-t-2 border-fg pt-3">
                  <p className="m-0 text-lg font-semibold">{w.title}</p>
                  <p className="mt-1 mb-0 text-fg-muted">{w.text}</p>
                </li>
              ))}
            </ul>
            <p className="mt-6 mb-0">
              <Link to="/principles" className="inline-flex min-h-11 items-center sm:min-h-0">
                All {PRINCIPLES.length} design decisions, and how far each is built
              </Link>
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
            <ul aria-label="Evidence by grade" className="m-0 flex list-none flex-wrap gap-x-6 gap-y-2 p-0">
              {(Object.keys(GRADES) as Grade[]).map((g) => (
                <li key={g} className="flex items-center gap-2">
                  <Badge tone={GRADE_TONE[g]}>{g}</Badge>
                  <strong>{CLAIMS.filter((c) => c.grade === g).length}</strong>
                </li>
              ))}
              <li className="flex items-center gap-2">
                <Badge>Our judgment</Badge>
                <strong>{JUDGMENT.length}</strong>
              </li>
            </ul>
            <ul className="mt-6 mb-0 flex list-none flex-col gap-5 p-0">
              {CLAIMS.filter((c) => FEATURED.includes(c.id)).map((c) => (
                <li key={c.id} className="border-t border-line pt-4">
                  <p className="m-0 font-semibold">{c.claim}</p>
                  <p className="mt-1 mb-0 text-fg-muted">{c.shows}</p>
                  <p className="mt-1 mb-0 text-sm text-fg-subtle">{c.sources.map((src) => (src.year ? `${src.by}, ${src.year}` : src.by)).join("; ")}</p>
                </li>
              ))}
            </ul>
            <p className="mt-6 mb-0">
              <Link to="/evidence" className="inline-flex min-h-11 items-center sm:min-h-0">
                All {CLAIMS.length} claims and their sources
              </Link>
            </p>
          </div>
        </div>
      </Section>

      <div className="mt-24 border-y border-line bg-surface">
        <Section className="py-20" labelledBy="open-source">
          <p className="m-0 font-mono text-xs tracking-wider text-accent-text">SUPPORT, ONLY IF YOU WANT IT</p>
          <h2 id="open-source" className="mt-2 mb-0 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Free means complete. We sell help, never features.
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-fg-muted">
            Every product and every feature is free under AGPL-3.0, with no enterprise edition and no licence key. You never need a plan to use OpenAsy. Teams
            that want support buy a plan from the engineers who build it.
          </p>
          <ul aria-label="Support plans" className="mt-10 grid list-none gap-4 p-0 md:grid-cols-3">
            {PLANS.map((plan) => (
              <li
                key={plan.id}
                className={cn("flex flex-col rounded-xl border p-6", plan.id === "standard" ? "border-accent bg-accent-soft" : "border-line bg-canvas")}
              >
                <p className="m-0 text-lg font-semibold">{plan.name}</p>
                <p className="mt-1 mb-0 text-sm text-accent-text">{plan.price}</p>
                <p className="mt-3 mb-0 text-fg-muted">{plan.pitch}</p>
                <ul className="mt-4 mb-0 flex list-none flex-col gap-2 p-0 text-sm">
                  {plan.features.slice(0, 4).map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-6">
                  <a
                    href={plan.cta.href}
                    className={cn(
                      "inline-flex h-10 w-full items-center justify-center rounded-md px-4 font-semibold no-underline",
                      plan.id === "community"
                        ? "border border-line-strong bg-surface text-fg hover:bg-subtle"
                        : "bg-accent text-accent-contrast hover:bg-accent-hover",
                    )}
                  >
                    {plan.cta.label}
                  </a>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-6 mb-0">
            <Link to="/support">Compare plans and response times</Link>
          </p>
        </Section>
      </div>

      <Section className="py-24" labelledBy="catalog">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h2 id="catalog" className="m-0 text-3xl font-semibold tracking-tight sm:text-4xl">
              All {PRODUCT_IDS.length} products
            </h2>
            <p className="mt-3 mb-0 text-base text-fg-muted">
              Each is its own container with its own users, data and API. Linked, they share hosts, people and alerts.
            </p>
          </div>
          <ButtonLink to="/install" variant="primary" size="lg">
            Build your install
          </ButtonLink>
        </div>
        {/* Columns rather than a grid, so short groups fill the space under long ones. */}
        <div className="mt-8 columns-1 gap-8 sm:columns-2 lg:columns-4">
          {GROUPS.map((g) => {
            const ids = PRODUCT_IDS.filter((id) => PRODUCTS[id].group === g.id);
            return (
              <div key={g.id} className="mb-8 break-inside-avoid">
                <h3 className="m-0 text-base font-semibold">
                  {g.name} <span className="font-normal text-fg-subtle">{ids.length}</span>
                </h3>
                <ul aria-label={`All ${g.name} products`} className="mt-3 mb-0 flex list-none flex-col gap-1.5 p-0">
                  {ids.map((id) => (
                    <li key={id}>
                      <Link to={`/products/${id}`} className="text-fg no-underline hover:text-accent-text hover:underline">
                        {PRODUCTS[id].name}
                      </Link>
                      {statusFor(id).status !== "Preview" && <span className="ml-2 text-xs text-fg-subtle">{statusFor(id).status}</span>}
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

/** Whether a hero shot is still on disk under the name it is listed with; the test keeps the list honest. */
export const heroShotsExist = () => HERO_SHOTS.every((s) => hasScreenshot(s.id, s.page));
