import { Link, useParams } from "react-router";
import { Check, Laptop } from "lucide-react";
import { Callout } from "@openasy/ui";
import { MAC_APPS, MAC_REQUIRES, macApp } from "../data/apps";
import { ButtonLink, CodeBlock } from "../components/site";
import { MAC_APP_ICON, MacAppBadge } from "../components/mac-apps";

export function meta({ params }: { params: { id?: string } }) {
  const a = macApp(params.id ?? "");
  return a ? [{ title: `${a.name} for Mac · OpenAsy` }, { name: "description", content: a.summary }] : [{ title: "App not found · OpenAsy" }];
}

export default function MacAppPage() {
  const { id = "" } = useParams();
  const a = macApp(id);
  if (!a) {
    return (
      <section aria-labelledby="title" className="mx-auto max-w-6xl px-4 py-16">
        <h1 id="title" className="m-0 text-3xl font-semibold">
          App not found
        </h1>
        <p className="mt-3">
          See the <Link to="/products">products and Mac apps</Link>.
        </p>
      </section>
    );
  }
  const Icon = MAC_APP_ICON[a.id];
  // Other Mac apps not already linked under Works with.
  const others = MAC_APPS.filter((x) => x.id !== a.id && !a.worksWith.some((w) => w.to === `/apps/${x.id}`));
  return (
    <>
      <section aria-labelledby="title" className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-12 gap-y-8 px-4 pt-10 pb-10">
          <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-4">
            <p className="m-0 text-sm text-fg-subtle">
              <Link to="/products">Products</Link> / Mac apps
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span aria-hidden className="grid size-11 place-items-center rounded-xl bg-accent-soft text-accent-text">
                <Icon className="size-5" />
              </span>
              <span className="text-lg font-semibold">{a.name}</span>
              <MacAppBadge app={a} />
            </div>
            <h1 id="title" className="m-0 max-w-3xl text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
              {a.title}
            </h1>
            <p className="m-0 max-w-2xl text-lg text-fg-muted">{a.lead}</p>
            <p className="m-0 flex items-center gap-2 text-sm text-fg-muted">
              <Laptop aria-hidden className="size-4" /> {MAC_REQUIRES}. AGPL-3.0.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {a.status === "Preview" && a.version ? (
                <ButtonLink to={`https://github.com/${a.repo}/releases/tag/v${a.version}`} variant="primary" size="lg" external>
                  Download {a.version}
                </ButtonLink>
              ) : (
                <ButtonLink to="#get" variant="primary" size="lg" external>
                  Build it
                </ButtonLink>
              )}
              <ButtonLink to={`https://github.com/${a.repo}`} size="lg" external>
                Source code
              </ButtonLink>
            </div>
          </div>
          {a.shot && (
            <figure className="m-0 min-w-0 flex-[1_1_480px] overflow-hidden rounded-2xl border border-line bg-canvas shadow-overlay">
              {(["light", "dark"] as const).map((theme) => (
                <a
                  key={theme}
                  href={`/screens/${a.id}/${a.shot!.page}-${theme}.webp`}
                  aria-label="Screenshot, full size"
                  className={theme === "light" ? "block dark:hidden" : "hidden dark:block"}
                >
                  <img src={`/screens/${a.id}/${a.shot!.page}-${theme}.webp`} alt={a.shot!.alt} width={1440} height={870} className="block h-auto w-full" />
                </a>
              ))}
            </figure>
          )}
        </div>
      </section>

      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 pt-14 pb-20">
        <section aria-labelledby="works">
          <h2 id="works" className="m-0 scroll-mt-20 text-2xl font-semibold tracking-tight sm:text-3xl">
            {a.status === "Preview" ? "What it does" : "Built, not released yet"}
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {a.features.map((f) => (
              <section key={f.title} aria-labelledby={`f-${f.title}`} className="rounded-xl border border-line bg-surface p-5">
                <h3 id={`f-${f.title}`} className="m-0 text-base font-semibold">
                  {f.title}
                </h3>
                <ul className="mt-3 mb-0 flex list-none flex-col gap-2 p-0">
                  {f.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </section>

        <section aria-labelledby="privacy">
          <h2 id="privacy" className="m-0 scroll-mt-20 text-2xl font-semibold tracking-tight sm:text-3xl">
            Your data stays on your Mac
          </h2>
          <ul className="mt-4 mb-0 flex max-w-3xl flex-col gap-2 pl-5 text-fg-muted">
            {a.privacy.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="get">
          <h2 id="get" className="m-0 scroll-mt-20 text-2xl font-semibold tracking-tight sm:text-3xl">
            {a.status === "Preview" ? "Install it" : "Get it"}
          </h2>
          {a.status !== "Preview" && (
            <Callout tone="info" title="No download yet" className="mt-4">
              Signed, notarized DMGs will be on GitHub Releases, and this page will link to them.
            </Callout>
          )}
          <p className="mt-4 text-fg-muted">{a.build.text}</p>
          <CodeBlock code={a.build.code} label={`Build ${a.name}`} className="mt-3 p-4" />
        </section>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] items-start gap-4">
          <section aria-labelledby="with" className="rounded-xl border border-line bg-surface p-5">
            <h2 id="with" className="m-0 text-base font-semibold">
              Works with
            </h2>
            <ul className="mt-3 mb-0 flex list-none flex-col gap-2.5 p-0">
              {a.worksWith.map((w) => (
                <li key={w.name} className="text-sm">
                  <Link to={w.to}>{w.name}</Link>
                  <span className="text-fg-muted">: {w.how}</span>
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="limits" className="rounded-xl border border-line bg-surface p-5">
            <h2 id="limits" className="m-0 text-base font-semibold">
              Limits
            </h2>
            <ul className="mt-3 mb-0 flex flex-col gap-2 pl-5 text-sm text-fg-muted">
              {a.limits.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </section>
          {others.length > 0 && (
            <section aria-labelledby="more" className="rounded-xl border border-line bg-surface p-5">
              <h2 id="more" className="m-0 text-base font-semibold">
                More Mac apps
              </h2>
              <ul className="mt-3 mb-0 flex list-none flex-col gap-2 p-0">
                {others.map((o) => (
                  <li key={o.id} className="text-sm">
                    <Link to={`/apps/${o.id}`}>{o.name}</Link>
                    <span className="text-fg-muted"> · {o.summary}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
