import { Link, useParams } from "react-router";
import { Badge, PRODUCT_IDS, type ProductId } from "@openasy/ui";
import { METHODS, apiFor, resolve, type OpenApi, type Operation, type Schema } from "../data/apis";
import { ButtonLink, Section } from "../components/site";
import { product } from "../components/cards";

export function meta({ params }: { params: { id?: string } }) {
  const api = params.id ? apiFor(params.id) : undefined;
  if (!api || !PRODUCT_IDS.includes(params.id as ProductId)) return [{ title: "API not found · OpenAsy" }];
  return [{ title: `${product(params.id!).name} API · OpenAsy` }, { name: "description", content: api.spec.info.summary ?? api.spec.info.title }];
}

/** OpenAPI descriptions use Markdown; render only `inline code`, the one part they use. */
function Text({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <>
      {children.split(/(`[^`]+`)/).map((part, i) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <code key={i} className="font-mono text-[0.92em]">
            {part.slice(1, -1)}
          </code>
        ) : (
          part
        ),
      )}
    </>
  );
}

const METHOD_TONE = { get: "info", post: "success", put: "warning", patch: "warning", delete: "danger" } as const;

const typeOf = (s: Schema): string => {
  if (s.oneOf) return s.oneOf.map((o) => (o.$ref ? o.$ref.split("/").pop() : typeOf(o))).join(" | ");
  if (s.const !== undefined) return JSON.stringify(s.const);
  if (s.enum) return s.enum.map((v) => JSON.stringify(v)).join(" | ");
  const t = Array.isArray(s.type) ? s.type.join(" | ") : (s.type ?? "any");
  if (t === "array" && s.items) return `array of ${s.items.$ref ? s.items.$ref.split("/").pop() : typeOf(s.items)}`;
  return s.format ? `${t} (${s.format})` : t;
};

/** A schema as a table of fields; nested objects and arrays of objects get their own rows. */
function SchemaView({ spec, schema, depth = 0 }: { spec: OpenApi; schema: Schema; depth?: number }) {
  const s = resolve(spec, schema);
  if (!s.properties) {
    return (
      <p className="m-0 font-mono text-xs">
        {typeOf(s)}
        {s.description && <span className="font-sans text-fg-muted"> · <Text>{s.description}</Text></span>}
      </p>
    );
  }
  return (
    <ul className={depth ? "mt-1 list-none border-l border-line pl-3" : "m-0 list-none p-0"}>
      {Object.entries(s.properties).map(([name, raw]) => {
        const prop = resolve(spec, raw);
        const nested = prop.properties
          ? prop
          : prop.items && resolve(spec, prop.items).properties
            ? resolve(spec, prop.items)
            : prop.oneOf?.map((o) => resolve(spec, o)).find((o) => o.properties);
        return (
          <li key={name} className="py-1 text-xs">
            <span className="font-mono font-semibold text-fg">{name}</span>
            {s.required?.includes(name) && <span className="text-danger-text"> *</span>}
            <span className="ml-2 font-mono text-fg-muted">{typeOf(prop)}</span>
            {prop.description && <span className="block text-fg-muted"><Text>{prop.description}</Text></span>}
            {prop.pattern && <span className="block font-mono text-fg-subtle">pattern {prop.pattern}</span>}
            {prop.examples && <span className="block text-fg-subtle">e.g. {prop.examples.map((e) => JSON.stringify(e)).join(", ")}</span>}
            {nested && depth < 3 && <SchemaView spec={spec} schema={nested} depth={depth + 1} />}
          </li>
        );
      })}
    </ul>
  );
}

function OperationCard({ spec, method, path, op }: { spec: OpenApi; method: string; path: string; op: Operation }) {
  const auth = op.security?.flatMap((s) => Object.keys(s)) ?? [];
  const body = op.requestBody && Object.entries(op.requestBody.content)[0];
  return (
    <li id={op.operationId} className="scroll-mt-24 rounded-lg border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
        <Badge tone={METHOD_TONE[method as keyof typeof METHOD_TONE] ?? "neutral"}>{method.toUpperCase()}</Badge>
        <code className="font-mono text-sm font-semibold">{path}</code>
        <span className="text-sm text-fg-muted">{op.summary}</span>
        {auth.length > 0 && <Badge tone="warning">Needs {auth.join(", ")}</Badge>}
      </div>
      <div className="flex flex-col gap-3 px-4 py-3">
        {op.description && <p className="m-0 text-sm"><Text>{op.description}</Text></p>}
        {body && (
          <section aria-label={`Request body for ${method.toUpperCase()} ${path}`}>
            <h4 className="m-0 mb-1 text-xs font-semibold tracking-wide text-fg-muted uppercase">Request body · {body[0]}</h4>
            <SchemaView spec={spec} schema={body[1].schema} />
          </section>
        )}
        <section aria-label={`Responses for ${method.toUpperCase()} ${path}`}>
          <h4 className="m-0 mb-1 text-xs font-semibold tracking-wide text-fg-muted uppercase">Responses</h4>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {Object.entries(op.responses).map(([status, raw]) => {
              const r = resolve(spec, raw);
              const media = r.content && Object.entries(r.content)[0];
              return (
                <li key={status} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-2 text-sm">
                  <span className={`font-mono font-semibold ${status.startsWith("2") ? "text-success" : "text-danger-text"}`}>{status}</span>
                  <span className="min-w-0">
                    <Text>{r.description}</Text>
                    {media && <span className="ml-1 font-mono text-xs text-fg-muted">{media[0]}</span>}
                    {media && status.startsWith("2") && <SchemaView spec={spec} schema={media[1].schema} depth={1} />}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </li>
  );
}

export default function ProductApi() {
  const { id = "" } = useParams();
  const api = apiFor(id);
  if (!api || !PRODUCT_IDS.includes(id as ProductId)) throw new Response("Not found", { status: 404 });
  const { spec, repo } = api;
  const p = product(id);
  const operations = Object.entries(spec.paths).flatMap(([path, ops]) =>
    METHODS.filter((m) => ops[m]).map((m) => ({ path, method: m, op: ops[m]!, tag: ops[m]!.tags?.[0] ?? "Other" })),
  );
  const tags = spec.tags ?? [...new Set(operations.map((o) => o.tag))].map((name) => ({ name, description: undefined }));
  const problem = spec.components.schemas.Problem;
  return (
    <Section className="py-10" labelledBy="title">
      <p className="m-0 text-sm">
        <Link to="/products">Products</Link> <span className="text-fg-muted">/</span> <Link to={`/products/${id}`}>{p.name}</Link>{" "}
        <span className="text-fg-muted">/</span>
      </p>
      <h1 id="title" className="mt-1 mb-0 text-3xl font-semibold">
        {p.name} API
      </h1>
      <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-fg-muted">
        <Badge tone="neutral">{spec.info.version}</Badge> OpenAPI {spec.openapi}
      </p>
      {spec.info.description && <p className="mt-3 max-w-3xl"><Text>{spec.info.description}</Text></p>}
      <p className="mt-2 max-w-3xl text-sm text-fg-muted">
        Every install serves this reference with <em>Try it out</em> at <code className="font-mono">/api/docs/</code>, and the description at{" "}
        <code className="font-mono">/api/openapi.json</code>.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <ButtonLink to={`https://github.com/${repo}/blob/main/openapi.json`} external>
          openapi.json
        </ButtonLink>
        <ButtonLink to={`https://github.com/${repo}`} external>
          Source code
        </ButtonLink>
      </div>

      <nav aria-label="Operations" className="mt-8 rounded-lg border border-line bg-surface p-4">
        <ul className="m-0 grid list-none gap-1 p-0 text-sm sm:grid-cols-2">
          {operations.map((o) => (
            <li key={o.op.operationId}>
              <a href={`#${o.op.operationId}`} className="no-underline">
                <span className="mr-2 inline-block w-12 font-mono text-xs font-semibold text-fg-muted">{o.method.toUpperCase()}</span>
                <span className="font-mono">{o.path}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {tags.map((t) => (
        <section key={t.name} aria-labelledby={`tag-${t.name}`} className="mt-8">
          <h2 id={`tag-${t.name}`} className="m-0 text-xl font-semibold">
            {t.name}
          </h2>
          {t.description && <p className="mt-1 text-sm text-fg-muted"><Text>{t.description}</Text></p>}
          <ul className="mt-3 flex list-none flex-col gap-3 p-0">
            {operations
              .filter((o) => o.tag === t.name)
              .map((o) => (
                <OperationCard key={o.op.operationId} spec={spec} method={o.method} path={o.path} op={o.op} />
              ))}
          </ul>
        </section>
      ))}

      {problem && (
        <section aria-labelledby="errors" className="mt-8">
          <h2 id="errors" className="m-0 text-xl font-semibold">
            Errors
          </h2>
          <p className="mt-1 text-sm text-fg-muted">Every error is <code className="font-mono">application/problem+json</code> (RFC 9457). Match on <code className="font-mono">code</code>; show <code className="font-mono">detail</code>.</p>
          <div className="mt-3 rounded-lg border border-line bg-surface p-4">
            <SchemaView spec={spec} schema={problem} />
          </div>
        </section>
      )}
    </Section>
  );
}
