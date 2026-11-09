import { Check, Info, Mail } from "lucide-react";
import { COMPARISON, FAQ, PLANS, contactUrl } from "../data/support";
import { ButtonLink, PageTitle, Section } from "../components/site";

export function meta() {
  return [
    { title: "Support · OpenAsy" },
    {
      name: "description",
      content:
        "OpenAsy is free and open source, with no limits on use. Paid help is optional: Guided Setup from $499, Standard Support at $199 a month, and Enterprise by agreement.",
    },
    { property: "og:title", content: "Support · OpenAsy" },
    {
      property: "og:description",
      content: "Free and unlimited to use. Paid help when you want it: Guided Setup from $499, Standard Support at $199 a month, Enterprise by agreement.",
    },
  ];
}

export default function Support() {
  return (
    <>
      <Section className="pt-12 pb-6" labelledBy="title">
        <PageTitle title="Support">
          Every product is free and open source, with no limits on how much you use it. If you want help, you pay for the help: a guided first setup, ongoing
          support for a few products, or terms agreed for a larger install. Scope and price are always agreed before anything starts.
        </PageTitle>
      </Section>

      <Section className="py-2" labelledBy="plans">
        <h2 id="plans" className="sr-only">
          Plans
        </h2>
        <ul aria-label="Support plans" className="grid list-none gap-3 p-0 md:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((p) => (
            <li
              key={p.id}
              className={
                p.id === "standard"
                  ? "flex flex-col gap-3 rounded-lg border border-accent bg-accent-soft/40 p-5"
                  : "flex flex-col gap-3 rounded-lg border border-line bg-surface p-5"
              }
            >
              <h3 className="m-0 text-lg font-semibold">{p.name}</h3>
              <p className="m-0 flex flex-wrap items-baseline gap-x-2">
                <span className="text-2xl font-semibold">{p.price}</span>
                {p.cadence && <span className="text-sm text-fg-muted">{p.cadence}</span>}
              </p>
              <p className="m-0 text-sm text-fg-muted">{p.pitch}</p>
              <ul aria-label={`${p.name} includes`} className="m-0 flex list-none flex-col gap-1.5 p-0 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                    {f}
                  </li>
                ))}
              </ul>
              {p.notes && (
                <ul aria-label={`${p.name}: good to know`} className="m-0 flex list-none flex-col gap-1.5 border-t border-line p-0 pt-3 text-xs text-fg-muted">
                  {p.notes.map((n) => (
                    <li key={n} className="flex gap-2">
                      <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                      {n}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-auto pt-2">
                <ButtonLink to={p.cta.href} variant={p.id === "standard" ? "primary" : "secondary"} external={p.cta.external}>
                  {p.cta.label}
                </ButtonLink>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-fg-muted">
          Every plan uses the same open-source code. Nothing is locked, there is no online checkout, and you can stop paying without losing anything.
        </p>
      </Section>

      <Section className="py-8" labelledBy="compare">
        <h2 id="compare" className="m-0 text-xl font-semibold">
          What each plan covers
        </h2>
        <p className="mt-1 text-sm text-fg-muted">Limits apply to the help we give, never to how you use the products.</p>
        <div className="relative mt-3 overflow-x-auto rounded-lg border border-line bg-surface" tabIndex={0} aria-label="Plan comparison table">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <caption className="sr-only">What each support plan covers</caption>
            <thead>
              <tr className="border-b border-line text-xs text-fg-muted">
                <th scope="col" className="px-3 py-2 font-medium">
                  <span className="sr-only">Topic</span>
                </th>
                {PLANS.map((p) => (
                  <th key={p.id} scope="col" className="px-3 py-2 font-medium">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((r) => (
                <tr key={r.topic} className="border-b border-line last:border-0">
                  <th scope="row" className="px-3 py-2 align-top font-semibold">
                    {r.topic}
                  </th>
                  {PLANS.map((p) => (
                    <td key={p.id} className="px-3 py-2 align-top">
                      {r.values[p.id]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section className="py-4" labelledBy="faq">
        <h2 id="faq" className="m-0 text-xl font-semibold">
          Questions
        </h2>
        <dl className="mt-3 grid gap-4 sm:grid-cols-2">
          {FAQ.map((f) => (
            <div key={f.q}>
              <dt className="font-semibold">{f.q}</dt>
              <dd className="m-0 mt-1 text-sm text-fg-muted">{f.a}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section className="py-8" labelledBy="talk">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-line bg-surface p-5">
          <div>
            <h2 id="talk" className="m-0 text-xl font-semibold">
              Tell us what you run
            </h2>
            <p className="m-0 mt-1 text-sm text-fg-muted">Which products, how many environments, and what you need help with. We reply by email.</p>
          </div>
          <ButtonLink to={contactUrl("OpenAsy support")} variant="primary" external>
            <Mail aria-hidden /> Contact us
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
