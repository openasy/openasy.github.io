import { useState, type ReactNode } from "react";
import { Link, useParams } from "react-router";
import { ArrowRight, Check, Circle } from "lucide-react";
import { Callout, PRODUCT_IDS, Tabs, cn, type ProductId } from "@openasy/ui";
import { apiFor } from "../data/apis";
import { goalsForProduct } from "../data/goals";
import { deploymentsFor, statusFor, withStatus, type Deployment, type Guide } from "../data/status";
import { storyUrl } from "../data/storybook";
import { ButtonLink, CodeBlock, GITHUB, Section } from "../components/site";
import { ProductStatusBadge, composeRun, helmFor, product } from "../components/cards";

export function meta({ params }: { params: { id?: string } }) {
  const p = PRODUCT_IDS.includes(params.id as ProductId) ? product(params.id!) : undefined;
  return p ? [{ title: `${p.name} · OpenAsy` }, { name: "description", content: p.summary }] : [{ title: "Product not found · OpenAsy" }];
}

function SideCard({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="rounded-xl border border-line bg-surface p-5">
      <h2 id={id} className="m-0 text-base font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Numbered steps, each with its command. */
function Steps({ items, label }: { items: Guide[]; label?: string }) {
  return (
    <ol aria-label={label} className="mt-4 flex list-none flex-col gap-6 p-0">
      {items.map((g, i) => (
        <li key={g.title} className="flex items-start gap-3">
          <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent-text">
            {i + 1}
          </span>
          <div className="min-w-0 grow">
            <h3 className="m-0 text-base font-semibold">{g.title}</h3>
            <p className="mt-1 mb-0 text-fg-muted">{g.text}</p>
            {g.code && <CodeBlock code={g.code} label={g.title} className="mt-3 p-4" />}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** For a product whose layout depends on the team: one tab per way to deploy it. */
function Deployments({ id, ways }: { id: string; ways: Deployment[] }) {
  const p = product(id);
  const [way, setWay] = useState(ways[0]!.id);
  const d = ways.find((w) => w.id === way) ?? ways[0]!;
  return (
    <>
      <Tabs<string> label="How to deploy" value={d.id} onChange={setWay} className="mt-4" items={ways.map((w) => ({ value: w.id, label: w.label }))} />
      <p className="mt-3 mb-0 text-fg-muted">{d.fits}</p>
      {d.compose && <CodeBlock code={composeRun([id])} label={`compose.yaml for ${p.name}`} className="mt-3 p-4" />}
      <Steps items={d.steps} label={`Steps: ${d.label}`} />
    </>
  );
}

type InstallWay = "compose" | "kubernetes";

/** Docker Compose for everyone, and Helm for products that have a chart. */
function RunIt({ id }: { id: string }) {
  const p = product(id);
  const s = statusFor(id);
  const helm = helmFor(id);
  const [way, setWay] = useState<InstallWay>("compose");
  const ways = deploymentsFor(s);
  if (ways.length > 1) return <Deployments id={id} ways={ways} />;
  const compose = <CodeBlock code={composeRun([id])} label={`compose.yaml for ${p.name}`} className="mt-3 p-4" />;
  if (!helm || !s.helm) return compose;
  return (
    <>
      <Tabs<InstallWay>
        label="How to install"
        value={way}
        onChange={setWay}
        className="mt-4"
        items={[
          { value: "compose", label: "Docker Compose" },
          { value: "kubernetes", label: "Kubernetes (Helm)" },
        ]}
      />
      {way === "compose" ? (
        <>
          <p className="mt-3 mb-0 text-fg-muted">One host, one file. The agent in the file covers this host; add it to others with the command under Add a host.</p>
          {compose}
        </>
      ) : (
        <>
          <p className="mt-3 mb-0 text-fg-muted">{s.helm.summary}</p>
          <CodeBlock code={helm.full} label={`helm install for ${p.name}`} className="mt-3 p-4" />
          {helm.agentsOnly && s.helm.agentsOnly && (
            <>
              <p className="mt-5 mb-0 text-fg-muted">{s.helm.agentsOnly.summary}</p>
              <CodeBlock code={helm.agentsOnly} label={`helm install for ${p.name} agents only`} className="mt-3 p-4" />
            </>
          )}
          {s.helm.note && (
            <Callout tone="info" title="Before you install" className="mt-4">
              {s.helm.note}
            </Callout>
          )}
        </>
      )}
    </>
  );
}

export default function ProductPage() {
  const { id = "" } = useParams();
  if (!PRODUCT_IDS.includes(id as ProductId)) throw new Response("Not found", { status: 404 });
  const p = product(id);
  const s = statusFor(id);
  const released = s.status === "Preview";
  const goals = goalsForProduct(id);
  const api = apiFor(id);
  const repo = api?.repo ?? `openasy/${id}`;
  const guide = goals.find((g) => g.install && g.required.includes(id));
  return (
    <Section className="py-10" labelledBy="title">
      <p className="m-0">
        <Link to="/products">Products</Link> <span className="text-fg-muted">/</span>
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3.5">
        <span aria-hidden className={cn("grid size-12 place-items-center rounded-xl", released ? "bg-accent-soft text-accent-text" : "bg-subtle text-fg-muted")}>
          <p.icon className="size-6" />
        </span>
        <h1 id="title" className="m-0 text-4xl font-semibold tracking-tight">
          {p.name}
        </h1>
        <ProductStatusBadge id={id} />
      </div>
      <p className="mt-3 max-w-2xl text-lg">{p.summary}</p>
      {s.note && (
        <Callout tone="warning" title="Before you install" className="mt-4 max-w-2xl">
          {s.note}
        </Callout>
      )}
      {released && (
        <div className="mt-5 flex flex-wrap gap-2">
          <ButtonLink to={storyUrl(p.name)} variant="primary" size="lg" external>
            See every screen
          </ButtonLink>
          {api && (
            <ButtonLink to={`/products/${id}/api`} size="lg">
              API reference
            </ButtonLink>
          )}
          <ButtonLink to={`https://github.com/${repo}`} size="lg" external>
            Source code
          </ButtonLink>
        </div>
      )}

      <div className="mt-10 flex flex-wrap items-start gap-10">
        <div className="flex min-w-0 flex-[999_1_600px] flex-col gap-12">
          {released ? (
            <section aria-labelledby="works">
              <h2 id="works" className="m-0 text-2xl font-semibold">
                What works today
              </h2>
              <ul aria-label="Features" className="mt-4 flex list-none flex-col overflow-hidden rounded-xl border border-line bg-surface p-0">
                {s.features.map((f) => (
                  <li key={f.title} className={cn("flex items-start gap-3 border-line px-4 py-3 not-first:border-t", !f.done && "bg-canvas text-fg-muted")}>
                    {f.done ? <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" /> : <Circle aria-hidden className="mt-0.5 size-4 shrink-0 text-fg-subtle" />}
                    <span className="grow">
                      {f.title}
                      {!f.done && <span className="sr-only"> (not yet)</span>}
                    </span>
                    {!f.done && (
                      <span aria-hidden className="shrink-0 rounded border border-line px-1.5 text-xs">
                        Not yet
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <section aria-labelledby="works" className="rounded-2xl border border-dashed border-line-strong bg-surface p-6 sm:p-8">
              <h2 id="works" className="m-0 text-2xl font-semibold">
                {s.status === "In progress" ? "Being built now" : "Not built yet"}
              </h2>
              <p className="mt-3 mb-0 max-w-xl text-base text-fg-muted">
                The screens are designed, so you can click through how it will work today. There is no image to install yet; this page will show what works once there is.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <ButtonLink to={storyUrl(p.name)} variant="primary" size="lg" external>
                  See the design <ArrowRight aria-hidden />
                </ButtonLink>
                <ButtonLink to={GITHUB} size="lg" external>
                  Follow on GitHub
                </ButtonLink>
              </div>
            </section>
          )}

          {released && (
            <section aria-labelledby="run">
              <h2 id="run" className="m-0 text-2xl font-semibold">
                Run it
              </h2>
              <p className="mt-2 text-fg-muted">
                Image <code className="font-mono">{p.image}</code>, signed with cosign.
              </p>
              <RunIt id={id} />
              {guide && (
                <p className="mt-3 mb-0">
                  Step by step, with the first device: <Link to={`/goals/${guide.id}`}>{guide.title} guide</Link>
                </p>
              )}
            </section>
          )}

          {released && s.guides && s.guides.length > 0 && (
            <section aria-labelledby="guides">
              <h2 id="guides" className="m-0 text-2xl font-semibold">
                After installing
              </h2>
              <Steps items={s.guides} />
            </section>
          )}

          {s.connect && s.clients && (
            <section aria-labelledby="connect">
              <h2 id="connect" className="m-0 text-2xl font-semibold">
                Connect a device
              </h2>
              <p className="mt-2 text-fg-muted">For the people on your team. Send them this section.</p>
              <ol className="mt-4 flex list-none flex-col gap-3 p-0">
                {s.connect.map((step, i) => (
                  <li key={step} className="flex items-start gap-3">
                    <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent-text">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <ul aria-label="OpenVPN clients" className="mt-5 grid list-none gap-2.5 p-0 sm:grid-cols-3 lg:grid-cols-5">
                {s.clients.map((c) => (
                  <li key={c.platform} className="rounded-lg border border-line bg-surface p-3.5">
                    <p className="m-0 text-xs text-fg-subtle">{c.platform}</p>
                    {c.apps.map((a, i) => (
                      <p key={a.name} className={cn("m-0", i ? "mt-0.5 text-sm text-fg-muted" : "mt-1")}>
                        {i > 0 && "or "}
                        <a href={a.url}>{a.name}</a>
                      </p>
                    ))}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!released && withStatus(PRODUCT_IDS, "Preview").length > 0 && (
            <section aria-labelledby="today" className="rounded-xl border border-line bg-surface p-6">
              <h2 id="today" className="m-0 text-lg font-semibold">
                What you can run today
              </h2>
              <p className="mt-2 text-fg-muted">These products are released. Each runs on its own, and {p.name} will link with them when it ships.</p>
              <ul className="mt-4 flex list-none flex-wrap gap-2 p-0">
                {withStatus(PRODUCT_IDS, "Preview").map((rid) => (
                  <li key={rid}>
                    <Link to={`/products/${rid}`} className="inline-flex h-10 items-center gap-2 rounded-md border border-accent px-3.5 font-semibold text-fg no-underline hover:shadow-raised">
                      {product(rid).name} <ProductStatusBadge id={rid} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
          <SideCard id="goals" title="Used for">
            {goals.length ? (
              <ul className="mt-3 flex list-none flex-col gap-2 p-0">
                {goals.map((g) => (
                  <li key={g.id}>
                    <Link to={`/goals/${g.id}`}>{g.title}</Link>
                    <span className="text-xs text-fg-muted"> · {g.required.includes(id) ? "needed" : "optional"}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 mb-0 text-sm text-fg-muted">Not part of a guide yet. It runs alone and links with any other product.</p>
            )}
          </SideCard>
          {s.upstream.length > 0 && (
            <SideCard id="built-on" title={released ? "Built on" : "Will build on"}>
              {!released && <p className="mt-1 mb-0 text-sm text-fg-muted">The plan, open to change.</p>}
              <ul aria-label="Open source projects" className="mt-3 flex list-none flex-col gap-2.5 p-0">
                {s.upstream.map((u) => (
                  <li key={u.name} className="flex justify-between gap-3">
                    <a href={u.url}>{u.name}</a>
                    <span className="text-right text-xs text-fg-subtle">{u.role}</span>
                  </li>
                ))}
              </ul>
            </SideCard>
          )}
          {released && (
            <SideCard id="release" title="Release">
              <dl className="mt-3 mb-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="text-fg-subtle">Version</dt>
                <dd className="m-0">{s.version}</dd>
                <dt className="text-fg-subtle">Image</dt>
                <dd className="m-0 font-mono text-xs break-all">
                  {p.image.replace("ghcr.io/", "")}
                  {p.agentImage && (
                    <>
                      <br />
                      {p.agentImage.replace("ghcr.io/", "")}
                    </>
                  )}
                </dd>
                <dt className="text-fg-subtle">Licence</dt>
                <dd className="m-0">AGPL-3.0</dd>
                <dt className="text-fg-subtle">Signed</dt>
                <dd className="m-0">cosign, keyless</dd>
              </dl>
            </SideCard>
          )}
        </aside>
      </div>
    </Section>
  );
}
