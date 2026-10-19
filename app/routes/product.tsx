import { Link, useParams } from "react-router";
import { PRODUCT_IDS, type ProductId } from "@openasy/ui";
import { goalsForProduct } from "../data/goals";
import { storyUrl } from "../data/storybook";
import { ButtonLink, CodeBlock, Section } from "../components/site";
import { composeFor, product } from "../components/cards";

export function meta({ params }: { params: { id?: string } }) {
  const p = PRODUCT_IDS.includes(params.id as ProductId) ? product(params.id!) : undefined;
  return p ? [{ title: `${p.name} · OpenAsy` }, { name: "description", content: p.summary }] : [{ title: "Product not found · OpenAsy" }];
}

export default function ProductPage() {
  const { id = "" } = useParams();
  if (!PRODUCT_IDS.includes(id as ProductId)) throw new Response("Not found", { status: 404 });
  const p = product(id);
  const goals = goalsForProduct(id);
  return (
    <Section className="py-10" labelledBy="title">
      <p className="m-0 text-sm">
        <Link to="/products">Products</Link> <span className="text-fg-muted">/</span>
      </p>
      <div className="mt-2 flex items-center gap-3">
        <span aria-hidden className="grid size-10 place-items-center rounded-lg bg-accent-soft text-accent-text">
          <p.icon className="size-5" />
        </span>
        <h1 id="title" className="m-0 text-3xl font-semibold">
          {p.name}
        </h1>
      </div>
      <p className="mt-3 max-w-2xl text-base">{p.summary}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <ButtonLink to={storyUrl(p.name)} variant="primary" external>
          See every screen
        </ButtonLink>
        <ButtonLink to={`https://github.com/openasy/${id}`} external>
          Source code
        </ButtonLink>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section aria-labelledby="run" className="min-w-0">
          <h2 id="run" className="m-0 text-xl font-semibold">
            Run it on its own
          </h2>
          <p className="mt-1 text-sm text-fg-muted">
            One container, one SQLite file, daily backups. Image <code className="font-mono">{p.image}</code>, signed with cosign.
          </p>
          <CodeBlock code={`${composeFor([id])}\n\n# then\ndocker compose up -d`} label={`compose.yaml for ${p.name}`} />
        </section>
        <section aria-labelledby="goals" className="min-w-0">
          <h2 id="goals" className="m-0 text-xl font-semibold">
            Used for
          </h2>
          {goals.length ? (
            <ul className="mt-2 flex list-none flex-col gap-1.5 p-0">
              {goals.map((g) => (
                <li key={g.id}>
                  <Link to={`/goals/${g.id}`}>{g.title}</Link>
                  <span className="text-xs text-fg-muted"> · {g.required.includes(id) ? "needed" : "optional"}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-fg-muted">Not part of a guide yet. It runs alone and links with any other product.</p>
          )}
        </section>
      </div>
    </Section>
  );
}
