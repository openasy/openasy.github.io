import { ArrowRight, Boxes, DatabaseBackup, Eye, Lock, Plug, Unlock } from "lucide-react";
import { PRODUCT_IDS, PRODUCTS, type ProductGroup } from "@openasy/ui";
import { GOALS } from "../data/goals";
import { PRINCIPLES } from "../data/principles";
import { ButtonLink, Section } from "../components/site";
import { GoalCard, ProductCard } from "../components/cards";

export function meta() {
  return [
    { title: "OpenAsy · Open-source tools to run and secure your infrastructure" },
    { name: "description", content: "38 open-source products for operations and security. Run one, or all of them together. Self-hosted, SQLite by default, no telemetry." },
  ];
}

export const GROUPS: Array<{ id: ProductGroup; name: string; text: string }> = [
  { id: "operations", name: "Operations", text: "Keep systems running and know why they are slow." },
  { id: "security", name: "Security", text: "Find weaknesses, detect attacks and respond." },
  { id: "identity", name: "Identity", text: "Who people are and what they may do." },
  { id: "platform", name: "Platform", text: "Automate and ask questions across all of it." },
];

const WHY = [
  { icon: Boxes, title: "Start with one", text: "Every product runs on its own in one container. Add others when you need them." },
  { icon: Plug, title: "Work together", text: "Linked products share hosts, users and IPs, and open each other's screens." },
  { icon: Unlock, title: "Fit your tools", text: "OIDC, SAML, OpenTelemetry, Prometheus, Syslog, Sigma and webhooks, both ways." },
  { icon: Lock, title: "Secure by default", text: "TLS, MFA, least privilege and an audit log of every admin action." },
  { icon: DatabaseBackup, title: "Simple to run", text: "SQLite by default, daily backups, restore to a point in time." },
  { icon: Eye, title: "Open source", text: "Apache-2.0, no telemetry, runs air-gapped. Read every line." },
];

export default function Home() {
  return (
    <>
      <Section className="py-14 sm:py-20" labelledBy="hero">
        <p className="m-0 text-sm font-semibold text-accent-text">Open source · self-hosted</p>
        <h1 id="hero" className="mt-2 mb-0 max-w-3xl text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
          Run and secure your infrastructure with tools you own.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-fg-muted">
          {PRODUCT_IDS.length} products for operations and security that work alone, together, or next to the tools you already have. Operations get easier, security stays at its highest, and your data
          never leaves your network.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <ButtonLink to="/goals" variant="primary" size="lg">
            Start from a goal <ArrowRight aria-hidden />
          </ButtonLink>
          <ButtonLink to="/products" size="lg">
            See all products
          </ButtonLink>
        </div>
      </Section>

      <Section className="py-8" labelledBy="goals">
        <h2 id="goals" className="m-0 text-2xl font-semibold">
          What do you need?
        </h2>
        <p className="mt-1 text-fg-muted">Pick a goal. Each guide lists the smallest set of products and how to install them.</p>
        <ul className="mt-4 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {GOALS.map((g) => (
            <GoalCard key={g.id} goal={g} />
          ))}
        </ul>
      </Section>

      <Section className="py-8" labelledBy="why">
        <h2 id="why" className="m-0 text-2xl font-semibold">
          Built to be adopted one piece at a time
        </h2>
        <ul className="mt-4 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {WHY.map((w) => (
            <li key={w.title} className="flex gap-3 rounded-lg border border-line bg-surface p-4">
              <w.icon aria-hidden className="size-5 shrink-0 text-accent-text" />
              <span className="flex flex-col gap-1">
                <span className="font-semibold">{w.title}</span>
                <span className="text-sm text-fg-muted">{w.text}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm">
          <a href="/principles">All {PRINCIPLES.length} design principles →</a>
        </p>
      </Section>

      <Section className="py-8" labelledBy="together">
        <div className="rounded-lg border border-line bg-surface p-5">
          <h2 id="together" className="m-0 text-2xl font-semibold">
            Together, they cover a whole breach
          </h2>
          <p className="mt-2 max-w-3xl text-fg-muted">
            Every stage of an attack, from reconnaissance to impact, is watched by at least one product, and Attack Simulation replays safe tests every night to prove it. Switch products off in the
            breach coverage view to see what you would miss.
          </p>
          <div className="mt-3">
            <ButtonLink to="https://openasy.github.io/ui/?path=/story/platform-breach-coverage--coverage" external>
              Open breach coverage
            </ButtonLink>
          </div>
        </div>
      </Section>

      <Section className="py-8" labelledBy="support">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-accent bg-accent-soft p-5">
          <div className="max-w-2xl">
            <h2 id="support" className="m-0 text-2xl font-semibold">
              Free to use. Supported when you need it.
            </h2>
            <p className="mt-2 mb-0 text-fg-muted">
              The code is the same for everyone. If OpenAsy runs something you depend on, a support plan gives you guaranteed response times, help with installs and upgrades, and 24/7 cover for
              critical issues.
            </p>
          </div>
          <ButtonLink to="/support" variant="primary">
            See support plans
          </ButtonLink>
        </div>
      </Section>

      <Section className="py-8" labelledBy="catalog">
        <h2 id="catalog" className="m-0 text-2xl font-semibold">
          All products
        </h2>
        {GROUPS.map((g) => (
          <div key={g.id} className="mt-5">
            <h3 className="m-0 text-base font-semibold">{g.name}</h3>
            <p className="mt-0.5 mb-2 text-sm text-fg-muted">{g.text}</p>
            <ul className="grid list-none gap-2 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {PRODUCT_IDS.filter((id) => PRODUCTS[id].group === g.id).map((id) => (
                <ProductCard key={id} id={id} />
              ))}
            </ul>
          </div>
        ))}
      </Section>
    </>
  );
}
