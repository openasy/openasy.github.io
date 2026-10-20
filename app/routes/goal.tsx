import { Link, useParams } from "react-router";
import { Badge, Callout } from "@openasy/ui";
import { apiFor } from "../data/apis";
import { goalById, type GoalStep } from "../data/goals";
import { READINESS_TONE, readiness, statusFor } from "../data/status";
import { storyUrl } from "../data/storybook";
import { CodeBlock, Section } from "../components/site";
import { ProductStatusBadge, composeRun, product } from "../components/cards";

export function meta({ params }: { params: { id?: string } }) {
  const g = goalById(params.id);
  return g ? [{ title: `${g.title} · OpenAsy` }, { name: "description", content: g.summary }] : [{ title: "Goal not found · OpenAsy" }];
}

export default function GoalPage() {
  const { id } = useParams();
  const g = goalById(id);
  if (!g) throw new Response("Not found", { status: 404 });
  const ready = readiness(g.required);
  const first = g.required[0]!;
  const steps: GoalStep[] = g.install ?? [
    { title: "Start the products", body: `Save this as compose.yaml on a host with Docker and run it. Each product is one container with its data in one SQLite file.`, code: composeRun(g.required) },
    { title: "Create the owner account", body: "There are no default passwords. Each product prints a one-time setup link on first start; open it to create the owner and turn on MFA.", code: `docker compose logs ${first} | grep "no owner yet"` },
    ...g.steps,
    { title: "Check backups", body: "Backups run daily from the first night. In Settings → Backups, add S3-compatible storage for off-site copies and continuous replication, which lets you restore to any point in time." },
  ];
  const notes = g.required.map((r) => statusFor(r).note).filter(Boolean);
  return (
    <Section className="flex flex-wrap items-start gap-10 pt-10 pb-4" labelledBy="title">
      <div className="flex min-w-0 flex-[999_1_600px] flex-col gap-10">
        <header>
          <p className="m-0">
            <Link to="/goals">Goals</Link> <span className="text-fg-muted">/</span>
          </p>
          <h1 id="title" className="mt-2 mb-0 text-4xl font-semibold tracking-tight">
            {g.title}
          </h1>
          <p className="mt-2 text-lg text-fg-muted">“{g.ask}”</p>
          <p className="mt-3 max-w-3xl text-base">{g.summary}</p>
          <p className="mt-3 flex flex-wrap items-center gap-3 text-fg-muted">
            <Badge tone={READINESS_TONE[ready]}>{ready}</Badge>
            {g.timeToValue}
          </p>
        </header>

        <section aria-labelledby="outcomes">
          <h2 id="outcomes" className="m-0 text-2xl font-semibold">
            What you get
          </h2>
          <ul className="mt-4 grid list-none gap-3 p-0 sm:grid-cols-2">
            {g.outcomes.map((o) => (
              <li key={o} className="rounded-lg border border-line bg-surface p-4">
                {o}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="install">
          <h2 id="install" className="m-0 text-2xl font-semibold">
            Install
          </h2>
          {ready === "Ready to try" ? (
            notes.length > 0 && (
              <Callout tone="warning" title="For testing" className="mt-3">
                {notes.join(" ")}
              </Callout>
            )
          ) : (
            <Callout tone="info" title="Not released yet" className="mt-3">
              The screens are designed and published in Storybook; the container images are not released yet. These steps describe how installation will work.
            </Callout>
          )}
          <ol aria-label="Install steps" className="mt-6 flex list-none flex-col gap-8 p-0">
            {steps.map((s, i) => (
              <li key={s.title} className="grid grid-cols-[32px_minmax(0,1fr)] gap-4">
                <span aria-hidden className="grid size-8 place-items-center rounded-full bg-accent-soft font-semibold text-accent-text">
                  {i + 1}
                </span>
                <div className="flex min-w-0 flex-col gap-2 pt-1">
                  <h3 className="m-0 text-lg font-semibold">{s.title}</h3>
                  <p className="m-0 text-fg-muted">{s.body}</p>
                  {s.code && <CodeBlock code={s.code} label={`Code for step ${i + 1}: ${s.title}`} />}
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-4" aria-label="Products for this goal">
        <section aria-labelledby="needed" className="rounded-xl border border-line bg-surface p-5">
          <h2 id="needed" className="m-0 text-base font-semibold">
            You need
          </h2>
          <ul className="mt-3 flex list-none flex-col gap-4 p-0">
            {g.required.map((pid) => {
              const p = product(pid);
              return (
                <li key={pid} className="flex flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <Link to={`/products/${pid}`} className="font-semibold">
                      {p.name}
                    </Link>
                    <ProductStatusBadge id={pid} />
                  </span>
                  <span className="text-sm text-fg-muted">{p.summary}</span>
                  <a href={storyUrl(p.name)} className="text-sm">
                    See the screens
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
        {g.recommended.length > 0 && (
          <section aria-labelledby="addons" className="rounded-xl border border-line bg-surface p-5">
            <h2 id="addons" className="m-0 text-base font-semibold">
              Works better with
            </h2>
            <p className="mt-1 mb-3 text-sm text-fg-muted">Optional. Each one links with a token and can be added later.</p>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {g.recommended.map((r) => (
                <li key={r.id} className="flex flex-col gap-0.5">
                  <span className="flex flex-wrap items-center gap-2">
                    <Link to={`/products/${r.id}`} className="font-semibold">
                      {product(r.id).name}
                    </Link>
                    <span className="text-xs text-fg-subtle">{statusFor(r.id).status}</span>
                  </span>
                  <span className="text-sm text-fg-muted">{r.why}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        {ready === "Ready to try" && (
          <p className="m-0 text-sm text-fg-muted">
            Stuck? <a href={`https://github.com/${apiFor(first)?.repo ?? `openasy/${first}`}/issues`}>Ask on GitHub</a>
          </p>
        )}
      </aside>
    </Section>
  );
}
