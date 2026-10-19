import { GOALS } from "../data/goals";
import { Section } from "../components/site";
import { GoalCard } from "../components/cards";

export function meta() {
  return [{ title: "Goals · OpenAsy" }, { name: "description", content: "Install guides by goal: a VPN, an audit, data loss, who did what, breach detection, uptime, secure code and cloud cost." }];
}

export default function Goals() {
  return (
    <Section className="py-10" labelledBy="title">
      <h1 id="title" className="m-0 text-3xl font-semibold">
        Start from a goal
      </h1>
      <p className="mt-2 max-w-2xl text-fg-muted">You do not need all the products. Each guide starts with the fewest that reach the goal, then lists what would make it better.</p>
      <ul className="mt-6 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {GOALS.map((g) => (
          <GoalCard key={g.id} goal={g} />
        ))}
      </ul>
    </Section>
  );
}
