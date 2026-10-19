import { Badge } from "@openasy/ui";
import { ADR_INDEX, PRINCIPLES, adrUrl, type ImplementationStatus, type Principle } from "../data/principles";
import { Section } from "../components/site";

export function meta() {
  return [{ title: "Principles · OpenAsy" }, { name: "description", content: "The design decisions every OpenAsy product follows, and how far each one is built." }];
}

const IMPLEMENTATION_TONE: Record<ImplementationStatus, "success" | "warning" | "neutral"> = {
  Implemented: "success",
  "In progress": "warning",
  "Not started": "neutral",
};

const BAR: Record<ImplementationStatus, string> = { Implemented: "bg-success", "In progress": "bg-warning", "Not started": "bg-subtle border border-line-strong" };

const PRIORITY_TONE = { Critical: "danger", High: "warning", Medium: "neutral" } as const;

function Progress() {
  const order: ImplementationStatus[] = ["Implemented", "In progress", "Not started"];
  const count = (s: ImplementationStatus) => PRINCIPLES.filter((p) => p.implementation === s).length;
  return (
    <section aria-labelledby="progress" className="mt-8 rounded-xl border border-line bg-surface p-6">
      <h2 id="progress" className="m-0 text-base font-semibold">
        How far it is built
      </h2>
      <div aria-hidden className="mt-4 flex h-3 overflow-hidden rounded-full bg-subtle">
        {order.slice(0, 2).map((s) => (
          <span key={s} className={BAR[s]} style={{ width: `${(count(s) / PRINCIPLES.length) * 100}%` }} />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-7 gap-y-2">
        {order.map((s) => (
          <span key={s} className="flex items-center gap-2">
            <span aria-hidden className={`size-3 rounded-sm ${BAR[s]}`} />
            <strong>{count(s)}</strong> {s.toLowerCase()}
          </span>
        ))}
        <a href={ADR_INDEX} className="sm:ml-auto">
          All records on GitHub
        </a>
      </div>
    </section>
  );
}

function Proposed({ p }: { p: Principle }) {
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-5">
      <span className="flex flex-wrap items-center gap-2">
        <span className="mr-auto font-mono text-xs text-fg-subtle">{p.n}</span>
        {p.priority && <Badge tone={PRIORITY_TONE[p.priority as keyof typeof PRIORITY_TONE] ?? "neutral"}>{p.priority}</Badge>}
        <Badge tone={IMPLEMENTATION_TONE[p.implementation]}>{p.implementation}</Badge>
      </span>
      <h3 className="m-0 text-base font-semibold">{p.title}</h3>
      <p className="m-0 text-sm text-fg-muted">{p.text}</p>
      <a href={adrUrl(p.file)} className="mt-auto pt-1 text-sm" aria-label={`Read the record: ${p.title}`}>
        Read and comment
      </a>
    </li>
  );
}

export default function Principles() {
  const accepted = PRINCIPLES.filter((p) => p.decision === "Accepted");
  const proposed = PRINCIPLES.filter((p) => p.decision === "Proposed");
  return (
    <Section className="py-12" labelledBy="title">
      <h1 id="title" className="m-0 text-4xl font-semibold tracking-tight">
        Principles
      </h1>
      <p className="mt-3 max-w-2xl text-base text-fg-muted">
        The decisions every product follows, each a public record with its reasons. A decision says how we build; its status says how much of it ships today. Change one with a pull request.
      </p>

      <Progress />

      <h2 className="mt-10 mb-0 text-2xl font-semibold">
        Accepted <span className="font-normal text-fg-subtle">{accepted.length}</span>
      </h2>
      <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-surface" tabIndex={0} aria-label="Accepted decisions table">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <caption className="sr-only">Accepted decisions and how far each is built</caption>
          <thead>
            <tr className="border-b border-line text-xs text-fg-subtle">
              <th scope="col" className="w-16 px-4 py-2.5 font-medium">
                No.
              </th>
              <th scope="col" className="px-4 py-2.5 font-medium">
                Decision
              </th>
              <th scope="col" className="w-36 px-4 py-2.5 font-medium">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {accepted.map((p) => (
              <tr key={p.n} className="border-t border-line align-top">
                <td className="px-4 py-3 font-mono text-xs text-fg-subtle">{p.n}</td>
                <th scope="row" className="px-4 py-3 font-normal">
                  <a href={adrUrl(p.file)} aria-label={`Read the record: ${p.title}`} className="font-medium text-fg">
                    {p.title}
                  </a>
                  <span className="mt-0.5 block text-sm text-fg-muted">{p.text}</span>
                </th>
                <td className="px-4 py-3">
                  <Badge tone={IMPLEMENTATION_TONE[p.implementation]}>{p.implementation}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {proposed.length > 0 && (
        <>
          <h2 className="mt-12 mb-0 text-2xl font-semibold">
            Proposed <span className="font-normal text-fg-subtle">{proposed.length}</span>
          </h2>
          <p className="mt-2 max-w-2xl text-fg-muted">Open for discussion. Comment on the record or open a pull request before it is accepted.</p>
          <ol aria-label="Proposed decisions" className="mt-4 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {proposed.map((p) => (
              <Proposed key={p.n} p={p} />
            ))}
          </ol>
        </>
      )}
    </Section>
  );
}
