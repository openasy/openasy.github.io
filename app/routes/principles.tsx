import { Badge } from "@openasy/ui";
import { ADR_INDEX, PRINCIPLES, adrUrl } from "../data/principles";
import { Section } from "../components/site";

export function meta() {
  return [{ title: "Principles · OpenAsy" }, { name: "description", content: "The design decisions every OpenAsy product follows." }];
}

export default function Principles() {
  return (
    <Section className="py-10" labelledBy="title">
      <h1 id="title" className="m-0 text-3xl font-semibold">
        Principles
      </h1>
      <p className="mt-2 max-w-2xl text-fg-muted">
        Every product follows these decisions. Each one is a public record with its reasons; change one with a pull request. <a href={ADR_INDEX}>Read all records</a>.
      </p>
      <ol aria-label="Principles" className="mt-6 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {PRINCIPLES.map((p) => (
          <li key={p.n} className="flex flex-col gap-1.5 rounded-lg border border-line bg-surface p-4">
            <span className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-fg-muted">{p.n}</span>
              <Badge tone={p.status === "Accepted" ? "success" : p.status === "Planned" ? "info" : "warning"}>{p.status}</Badge>
            </span>
            <h2 className="m-0 text-base font-semibold">{p.title}</h2>
            <p className="m-0 text-sm text-fg-muted">{p.text}</p>
            <a href={adrUrl(p.file)} className="mt-auto text-sm" aria-label={`Read the record: ${p.title}`}>
              Read the record
            </a>
          </li>
        ))}
      </ol>
    </Section>
  );
}
