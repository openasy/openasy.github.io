import { Badge } from "@openasy/ui";
import { CLAIMS, GRADES, GRADE_TONE, JUDGMENT, type Claim, type Grade } from "../data/evidence";
import { IN_FORCE, adrUrl } from "../data/principles";
import { PageTitle, Section } from "../components/site";

export function meta() {
  return [
    { title: "Evidence · OpenAsy" },
    {
      name: "description",
      content: "The studies, standards and published practice behind OpenAsy's design decisions, and the decisions that are our own judgment.",
    },
  ];
}

const record = (n: string) => IN_FORCE.find((p) => p.n === n);

function ClaimItem({ c }: { c: Claim }) {
  return (
    <li id={c.id} className="scroll-mt-20 rounded-xl border border-line bg-surface p-5">
      <span className="flex flex-wrap items-center gap-2">
        <Badge tone={GRADE_TONE[c.grade]}>{c.grade}</Badge>
        {c.adrs.map((n) => {
          const p = record(n);
          return p ? (
            <a key={n} href={adrUrl(p.file)} className="font-mono text-xs" aria-label={`Decision ${n}: ${p.title}`}>
              {n}
            </a>
          ) : null;
        })}
      </span>
      <h3 className="mt-3 mb-0 text-base font-semibold">{c.claim}</h3>
      <p className="mt-2 mb-0 text-fg-muted">{c.shows}</p>
      <ul aria-label="Sources" className="mt-3 mb-0 list-none space-y-1 p-0 text-sm">
        {c.sources.map((s) => (
          <li key={s.url}>
            <a href={s.url}>{s.title}</a>
            <span className="text-fg-subtle">
              {" "}
              · {s.by}
              {s.year ? `, ${s.year}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </li>
  );
}

export default function Evidence() {
  const grades = Object.keys(GRADES) as Grade[];
  const judgment = JUDGMENT.map(record).filter((p) => p !== undefined);
  return (
    <Section className="py-12" labelledBy="title">
      <PageTitle title="Evidence">
        What the decisions rest on, and how strongly. Each claim names its sources and what they show; a decision with none is listed as our own judgment, not
        dressed up as more. Know a better source, or one that says otherwise? <a href="https://github.com/openasy/openasy.github.io/issues">Open an issue</a>.
      </PageTitle>

      <dl className="mt-8 grid gap-x-8 gap-y-3 rounded-xl border border-line bg-surface p-6 sm:grid-cols-2 lg:grid-cols-3">
        {grades.map((g) => (
          <div key={g} className="flex items-start gap-3">
            <dt className="shrink-0">
              <Badge tone={GRADE_TONE[g]}>{g}</Badge>
            </dt>
            <dd className="m-0 text-sm text-fg-muted">
              {GRADES[g]} <span className="text-fg-subtle">({CLAIMS.filter((c) => c.grade === g).length})</span>
            </dd>
          </div>
        ))}
      </dl>

      <h2 className="mt-10 mb-0 text-2xl font-semibold">
        Claims <span className="font-normal text-fg-subtle">{CLAIMS.length}</span>
      </h2>
      <ol aria-label="Claims and their sources" className="mt-4 grid list-none gap-3 p-0 lg:grid-cols-2">
        {CLAIMS.map((c) => (
          <ClaimItem key={c.id} c={c} />
        ))}
      </ol>

      <h2 id="judgment" className="mt-12 mb-0 text-2xl font-semibold">
        Our judgment <span className="font-normal text-fg-subtle">{judgment.length}</span>
      </h2>
      <p className="mt-2 max-w-2xl text-fg-muted">
        Decisions we have found no study or standard for. They are reasoned in their records, and they change if use shows they are wrong.
      </p>
      <ul aria-label="Decisions that are our judgment" className="mt-4 grid list-none gap-2 p-0 sm:grid-cols-2">
        {judgment.map((p) => (
          <li key={p.n} className="flex gap-3">
            <span className="font-mono text-xs leading-6 text-fg-subtle">{p.n}</span>
            <a href={adrUrl(p.file)}>{p.title}</a>
          </li>
        ))}
      </ul>
    </Section>
  );
}
