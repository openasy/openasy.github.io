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

function Card({ p }: { p: Principle }) {
  return (
    <li className="flex flex-col gap-1.5 rounded-lg border border-line bg-surface p-4">
      <span className="flex flex-wrap items-center gap-1.5">
        <span className="mr-auto font-mono text-xs text-fg-muted">{p.n}</span>
        {p.priority && <Badge tone={p.priority === "Critical" ? "danger" : p.priority === "High" ? "warning" : "neutral"}>{p.priority}</Badge>}
        <Badge tone={IMPLEMENTATION_TONE[p.implementation]}>{p.implementation}</Badge>
      </span>
      <h3 className="m-0 text-base font-semibold">{p.title}</h3>
      <p className="m-0 text-sm text-fg-muted">{p.text}</p>
      {p.where && <p className="m-0 text-xs text-fg-subtle">{p.where}</p>}
      <a href={adrUrl(p.file)} className="mt-auto pt-1 text-sm" aria-label={`Read the record: ${p.title}`}>
        Read the record
      </a>
    </li>
  );
}

export default function Principles() {
  const accepted = PRINCIPLES.filter((p) => p.decision === "Accepted");
  const proposed = PRINCIPLES.filter((p) => p.decision === "Proposed");
  return (
    <Section className="py-10" labelledBy="title">
      <h1 id="title" className="m-0 text-3xl font-semibold">
        Principles
      </h1>
      <p className="mt-2 max-w-2xl text-fg-muted">
        Every product follows these decisions. Each one is a public record with its reasons; change one with a pull request. <a href={ADR_INDEX}>Read all records</a>.
      </p>
      <p className="mt-2 max-w-2xl text-sm text-fg-muted">
        A decision tells you how we build. Its implementation status tells you how much of it ships today: <em>Implemented</em>, <em>In progress</em> or <em>Not started</em>.
      </p>

      <h2 className="mt-8 mb-0 text-xl font-semibold">Accepted</h2>
      <ol aria-label="Accepted decisions" className="mt-3 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {accepted.map((p) => (
          <Card key={p.n} p={p} />
        ))}
      </ol>

      {proposed.length > 0 && (
        <>
          <h2 className="mt-10 mb-0 text-xl font-semibold">Proposed</h2>
          <p className="mt-1 max-w-2xl text-sm text-fg-muted">Open for discussion. Comment on the record or open a pull request before it is accepted.</p>
          <ol aria-label="Proposed decisions" className="mt-3 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {proposed.map((p) => (
              <Card key={p.n} p={p} />
            ))}
          </ol>
        </>
      )}
    </Section>
  );
}
