import { Link, useParams } from "react-router";
import { Callout, StatusBadge } from "@openasy/ui";
import { goalById, type GoalStep } from "../data/goals";
import { storyUrl } from "../data/storybook";
import { CodeBlock, Section } from "../components/site";
import { composeFor, product } from "../components/cards";

export function meta({ params }: { params: { id?: string } }) {
  const g = goalById(params.id);
  return g ? [{ title: `${g.title} · OpenAsy` }, { name: "description", content: g.summary }] : [{ title: "Goal not found · OpenAsy" }];
}

export default function GoalPage() {
  const { id } = useParams();
  const g = goalById(id);
  if (!g) throw new Response("Not found", { status: 404 });
  const first = g.required[0]!;
  const steps: GoalStep[] = [
    { title: "Start the products", body: `Save this as compose.yaml on a host with Docker and run it. Each product is one container with its data in one SQLite file.`, code: `${composeFor(g.required)}\n\n# then\ndocker compose up -d` },
    { title: "Create the owner account", body: "There are no default passwords. Each product prints a one-time setup link on first start; open it to create the owner and turn on MFA.", code: `docker compose logs ${first} | grep "setup link"` },
    ...g.steps,
    { title: "Check backups", body: "Backups run daily from the first night. In Settings → Backups, add S3-compatible storage for off-site copies and continuous replication, which lets you restore to any point in time." },
  ];
  return (
    <>
      {/* The side column starts level with the title and stays in view below the sticky header. */}
      <Section className="grid gap-6 pt-10 pb-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]" labelledBy="title">
        <div className="flex min-w-0 flex-col gap-6">
          <header>
            <p className="m-0 text-sm">
              <Link to="/goals">Goals</Link> <span className="text-fg-muted">/</span>
            </p>
            <h1 id="title" className="mt-1 mb-0 text-3xl font-semibold">
              {g.title}
            </h1>
            <p className="mt-1 text-base text-fg-muted">“{g.ask}”</p>
            <p className="mt-3 max-w-3xl">{g.summary}</p>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-fg-muted">
              <StatusBadge tone="info">Preview</StatusBadge>
              Time to first value: {g.timeToValue}
            </p>
          </header>

          <section aria-labelledby="outcomes">
            <h2 id="outcomes" className="m-0 text-xl font-semibold">
              What you get
            </h2>
            <ul className="mt-2 flex list-disc flex-col gap-1 pl-5">
              {g.outcomes.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="install">
            <h2 id="install" className="m-0 text-xl font-semibold">
              Install
            </h2>
            <Callout tone="info" title="Products are in preview" className="mt-2">
              The screens are designed and published in Storybook; container images are not released yet. These steps describe how installation will work.
            </Callout>
            <ol aria-label="Install steps" className="mt-3 flex list-none flex-col gap-4 p-0">
              {steps.map((s, i) => (
                <li key={s.title} className="grid grid-cols-[28px_minmax(0,1fr)] gap-3">
                  <span aria-hidden className="grid size-7 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent-text">
                    {i + 1}
                  </span>
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <h3 className="m-0 text-base font-semibold">{s.title}</h3>
                    <p className="m-0 text-sm text-fg-muted">{s.body}</p>
                    {s.code && <CodeBlock code={s.code} label={`Code for step ${i + 1}: ${s.title}`} />}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto" aria-label="Products for this goal">
          <section aria-labelledby="needed" className="rounded-lg border border-line bg-surface p-4">
            <h2 id="needed" className="m-0 text-base font-semibold">
              You need
            </h2>
            <ul className="mt-2 flex list-none flex-col gap-2 p-0">
              {g.required.map((id) => {
                const p = product(id);
                return (
                  <li key={id} className="flex flex-col">
                    <Link to={`/products/${id}`} className="font-medium">
                      {p.name}
                    </Link>
                    <span className="text-xs text-fg-muted">{p.summary}</span>
                    <a href={storyUrl(p.name)} className="text-xs">
                      See the screens
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
          <section aria-labelledby="help" className="rounded-lg border border-line bg-surface p-4">
            <h2 id="help" className="m-0 text-base font-semibold">
              Want help with this?
            </h2>
            <p className="mt-1 mb-2 text-xs text-fg-muted">Our engineers can set it up with you and stay on call afterwards.</p>
            <Link to="/support" className="text-sm font-medium">
              See support plans
            </Link>
          </section>
          {g.recommended.length > 0 && (
            <section aria-labelledby="addons" className="rounded-lg border border-line bg-surface p-4">
              <h2 id="addons" className="m-0 text-base font-semibold">
                Works better with
              </h2>
              <p className="mt-1 mb-2 text-xs text-fg-muted">Optional. Each one links with a token and can be added later.</p>
              <ul className="flex list-none flex-col gap-2 p-0">
                {g.recommended.map((r) => (
                  <li key={r.id} className="flex flex-col">
                    <Link to={`/products/${r.id}`} className="font-medium">
                      {product(r.id).name}
                    </Link>
                    <span className="text-xs text-fg-muted">{r.why}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </Section>
    </>
  );
}
