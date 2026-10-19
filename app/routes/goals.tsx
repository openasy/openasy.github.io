import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { Badge } from "@openasy/ui";
import { GOALS, type Goal } from "../data/goals";
import { READINESS_TONE, readiness, type Readiness } from "../data/status";
import { Section } from "../components/site";
import { GoalCard, product } from "../components/cards";

export function meta() {
  return [{ title: "Goals · OpenAsy" }, { name: "description", content: "Install guides by goal: a VPN, an audit, data loss, who did what, breach detection, uptime, secure code and cloud cost." }];
}

const LEGEND: Array<[Readiness, string]> = [
  ["Ready to try", "every product it needs is released"],
  ["In progress", "one of them is being built"],
  ["Designed", "screens only, for now"],
];

/** A goal you can run today, shown wide above the rest. */
function ReadyGoal({ goal }: { goal: Goal }) {
  return (
    <li>
      <Link
        to={`/goals/${goal.id}`}
        className="flex flex-wrap items-center gap-x-10 gap-y-6 rounded-2xl border border-line bg-surface p-6 text-fg no-underline hover:border-line-strong hover:shadow-raised sm:p-8"
      >
        <span className="min-w-0 flex-[1_1_420px]">
          <Badge tone="success">Ready to try</Badge>
          <span className="mt-3 block text-2xl font-semibold">{goal.title}</span>
          <span className="mt-2 block text-base text-fg-muted">“{goal.ask}”</span>
        </span>
        <span className="flex flex-[0_1_340px] flex-col gap-2">
          <span className="flex justify-between gap-4 border-b border-line pb-2">
            <span className="text-fg-muted">You need</span>
            <span className="font-medium">{goal.required.map((id) => product(id).name).join(", ")}</span>
          </span>
          <span className="flex justify-between gap-4 border-b border-line pb-2">
            <span className="text-fg-muted">Time</span>
            <span className="font-medium">{goal.timeToValue}</span>
          </span>
          <span className="mt-2 inline-flex items-center gap-2 font-semibold text-accent-text">
            Read the guide <ArrowRight aria-hidden className="size-4" />
          </span>
        </span>
      </Link>
    </li>
  );
}

export default function Goals() {
  const ready = GOALS.filter((g) => readiness(g.required) === "Ready to try");
  const rest = GOALS.filter((g) => !ready.includes(g));
  return (
    <Section className="py-12" labelledBy="title">
      <h1 id="title" className="m-0 text-4xl font-semibold tracking-tight">
        Start from a goal
      </h1>
      <p className="mt-3 max-w-2xl text-base text-fg-muted">Pick what you need done. Each guide names the smallest set of products, how long it takes, and whether you can run it today.</p>
      <ul aria-label="What the labels mean" className="mt-5 flex list-none flex-wrap gap-x-5 gap-y-2 p-0 text-sm text-fg-muted">
        {LEGEND.map(([r, text]) => (
          <li key={r} className="flex items-center gap-2">
            <Badge tone={READINESS_TONE[r]}>{r}</Badge>
            {text}
          </li>
        ))}
      </ul>
      {ready.length > 0 && (
        <ul aria-label="Goals you can run today" className="mt-8 flex list-none flex-col gap-4 p-0">
          {ready.map((g) => (
            <ReadyGoal key={g.id} goal={g} />
          ))}
        </ul>
      )}
      <ul aria-label="More goals" className="mt-4 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((g) => (
          <GoalCard key={g.id} goal={g} />
        ))}
      </ul>
      <p className="mt-6 mb-0 text-fg-muted">
        Not here? Every product also runs on its own. <Link to="/products">Browse all products</Link>
      </p>
    </Section>
  );
}
