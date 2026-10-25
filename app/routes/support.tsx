import { Check, Mail } from "lucide-react";
import { FAQ, PLANS, RESPONSE_TIMES, contactUrl } from "../data/support";
import { ButtonLink, PageTitle, Section } from "../components/site";

export function meta() {
  return [
    { title: "Support · OpenAsy" },
    {
      name: "description",
      content:
        "OpenAsy is free and open source. Support plans give you guaranteed response times, help with installs and upgrades, and 24/7 cover for critical issues.",
    },
  ];
}

export default function Support() {
  return (
    <>
      <Section className="pt-12 pb-6" labelledBy="title">
        <PageTitle title="Support">
          Every product is free and open source. When it runs something you depend on, we stand behind it with you: answers in a guaranteed time, help with
          installs and upgrades, and someone to call when it matters.
        </PageTitle>
      </Section>

      <Section className="py-2" labelledBy="plans">
        <h2 id="plans" className="sr-only">
          Plans
        </h2>
        <ul aria-label="Support plans" className="grid list-none gap-3 p-0 lg:grid-cols-3">
          {PLANS.map((p) => (
            <li key={p.id} className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5">
              <h3 className="m-0 text-lg font-semibold">{p.name}</h3>
              <span className="text-2xl font-semibold">{p.price}</span>
              <p className="m-0 text-sm text-fg-muted">{p.pitch}</p>
              <ul aria-label={`${p.name} includes`} className="m-0 flex list-none flex-col gap-1.5 p-0 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-2">
                <ButtonLink to={p.cta.href} variant="secondary" external>
                  {p.cta.label}
                </ButtonLink>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-fg-muted">
          Every plan uses the same open-source code. Nothing is locked, and you can stop paying at any time without losing anything.
        </p>
      </Section>

      <Section className="py-8" labelledBy="response">
        <h2 id="response" className="m-0 text-xl font-semibold">
          Response times
        </h2>
        <p className="mt-1 text-sm text-fg-muted">Time to the first answer from an engineer. Confirmed in your support agreement.</p>
        <div className="relative mt-3 overflow-x-auto rounded-lg border border-line bg-surface" tabIndex={0} aria-label="Response times table">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <caption className="sr-only">Response times by severity and plan</caption>
            <thead>
              <tr className="border-b border-line text-xs text-fg-muted">
                <th scope="col" className="px-3 py-2 font-medium">
                  Severity
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Standard
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Enterprise
                </th>
              </tr>
            </thead>
            <tbody>
              {RESPONSE_TIMES.map((r) => (
                <tr key={r.severity} className="border-b border-line last:border-0">
                  <th scope="row" className="px-3 py-2 align-top font-normal">
                    <span className="block font-semibold">{r.severity}</span>
                    <span className="text-xs text-fg-muted">{r.meaning}</span>
                  </th>
                  <td className="px-3 py-2 align-top">{r.standard}</td>
                  <td className="px-3 py-2 align-top">{r.enterprise}</td>
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
            <p className="m-0 mt-1 text-sm text-fg-muted">Which products, how many hosts, and what keeps you up at night. We reply within one business day.</p>
          </div>
          <ButtonLink to={contactUrl("support")} variant="primary" external>
            <Mail aria-hidden /> Contact us
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
