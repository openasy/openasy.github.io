import { BREACH_STAGES, PRODUCTS, cn, type ProductId } from "@openasy/ui";
import { STORYBOOK } from "../data/storybook";

export function coverage(products: readonly ProductId[]) {
  const has = (p: ProductId) => products.includes(p);
  const stages = BREACH_STAGES.map((s) => ({ ...s, live: s.detectors.filter(has) }));
  return { stages, covered: stages.filter((s) => s.live.length).length };
}

export const BREACH_STORY = `${STORYBOOK}?path=/story/platform-breach-coverage--coverage`;

/** Every product that watches at least one stage. */
export const ALL_DETECTORS = [...new Set(BREACH_STAGES.flatMap((s) => s.detectors))];

/** The twelve ATT&CK stages: which ones released products watch today, and which wait for a product still to ship. */
export function BreachToday({ released }: { released: readonly string[] }) {
  const { stages, covered } = coverage(released as ProductId[]);
  const names = (ids: readonly ProductId[]) => ids.map((p) => PRODUCTS[p].name).join(", ");
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="m-0 max-w-2xl text-base text-fg-muted">
          An attack moves through {stages.length} stages. Each one needs a product that notices it. Today{" "}
          <strong className="text-fg">
            {covered} of {stages.length}
          </strong>{" "}
          are watched; together, the {ALL_DETECTORS.length} products that detect attacks watch all of them.
        </p>
        <div className="flex flex-wrap gap-4 text-sm text-fg-muted">
          <span className="flex items-center gap-2">
            <span aria-hidden className="size-3.5 rounded bg-accent" />
            Covered today
          </span>
          <span className="flex items-center gap-2">
            <span aria-hidden className="size-3.5 rounded bg-accent-soft" />
            Covered once released
          </span>
        </div>
      </div>
      <ol aria-label="ATT&CK stages" className="m-0 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-3 lg:grid-cols-6">
        {stages.map((s, i) => {
          const on = s.live.length > 0;
          return (
            <li
              key={s.id}
              aria-label={`${s.name}: ${on ? `covered today by ${names(s.live)}` : `covered once ${names(s.detectors.slice(0, 2))} ships`}`}
              className={cn("flex min-w-0 flex-col gap-1 rounded-lg p-3", on ? "bg-accent text-accent-contrast" : "bg-accent-soft text-accent-text")}
            >
              <span className="font-mono text-xs opacity-80">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-sm font-semibold">{s.name}</span>
              <span className="text-xs opacity-85">{on ? `Today: ${names(s.live)}` : names(s.detectors.slice(0, 2))}</span>
            </li>
          );
        })}
      </ol>
      <p className="m-0 text-sm text-fg-muted">
        <a href={BREACH_STORY}>Replay a phishing-to-crypto-miner breach step by step</a>
      </p>
    </div>
  );
}
