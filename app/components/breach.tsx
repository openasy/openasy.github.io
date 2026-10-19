import { useState } from "react";
import { CircleCheck, CircleX } from "lucide-react";
import { BREACH_SCENARIO, BREACH_STAGES, PRODUCTS, SegmentedControl, cn, type ProductId } from "@openasy/ui";
import { STORYBOOK } from "../data/storybook";

/** What a visitor might run, from one product to all of them. */
export const PRESETS = {
  vpn: { label: "VPN only", products: ["vpn"] },
  starter: { label: "Starter", products: ["identity", "vpn", "logs", "siem", "alerts"] },
  security: {
    label: "Security",
    products: ["identity", "vpn", "logs", "siem", "alerts", "runtime", "network-ids", "deception", "secrets", "threat-intel", "vulnerabilities"],
  },
  all: { label: "Everything", products: [...new Set(BREACH_STAGES.flatMap((s) => s.detectors))] },
} as const satisfies Record<string, { label: string; products: readonly ProductId[] }>;

export type Preset = keyof typeof PRESETS;

export function coverage(products: readonly ProductId[]) {
  const has = (p: ProductId) => products.includes(p);
  const stages = BREACH_STAGES.map((s) => ({ ...s, live: s.detectors.filter(has) }));
  const first = BREACH_SCENARIO.find((step) => step.detectors.some(has));
  return { stages, covered: stages.filter((s) => s.live.length).length, first: first && { step: first, by: first.detectors.find(has)! } };
}

const clock = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;

export const BREACH_STORY = `${STORYBOOK}?path=/story/platform-breach-coverage--coverage`;

/** Would you catch a breach? Pick what you run and see which ATT&CK stages are covered. */
export function BreachCoverage({ initial = "starter" }: { initial?: Preset }) {
  const [preset, setPreset] = useState<Preset>(initial);
  const { stages, covered, first } = coverage(PRESETS[preset].products);
  const total = stages.length;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          label="What you run"
          size="md"
          value={preset}
          onChange={setPreset}
          options={(Object.keys(PRESETS) as Preset[]).map((value) => ({ value, label: PRESETS[value].label }))}
        />
        <p className="m-0 text-sm" aria-live="polite">
          <strong className={cn("text-base", covered === total ? "text-success" : "text-danger-text")}>
            {covered} of {total}
          </strong>{" "}
          attack stages covered
        </p>
      </div>

      <ol aria-label="ATT&CK stages" className="m-0 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-3 lg:grid-cols-6">
        {stages.map((s) => {
          const on = s.live.length > 0;
          const Icon = on ? CircleCheck : CircleX;
          return (
            <li
              key={s.id}
              className={cn("flex min-w-0 flex-col gap-1 rounded-md border p-2.5", on ? "border-line bg-surface" : "border-dashed border-danger/50 bg-danger-soft")}
              aria-label={`${s.name}: ${on ? `covered by ${s.live.map((p) => PRODUCTS[p].name).join(", ")}` : "not covered"}`}
            >
              <span className="flex items-start gap-1.5">
                <Icon aria-hidden className={cn("mt-px size-4 shrink-0", on ? "text-success" : "text-danger-text")} />
                <span className="text-xs leading-4 font-semibold">{s.name}</span>
              </span>
              <span className="truncate text-2xs text-fg-muted">{on ? s.live.map((p) => PRODUCTS[p].name).join(" · ") : "No detector"}</span>
            </li>
          );
        })}
      </ol>

      <p className="m-0 text-sm text-fg-muted">
        {first ? (
          <>
            In a phishing-to-crypto-miner breach, the first alert comes at <strong className="text-fg">T+{clock(first.step.at)}</strong> from{" "}
            <strong className="text-fg">{PRODUCTS[first.by].name}</strong>: {first.step.signal.charAt(0).toLowerCase() + first.step.signal.slice(1)}.
          </>
        ) : (
          <>In a phishing-to-crypto-miner breach, nothing would raise an alert.</>
        )}{" "}
        <a href={BREACH_STORY}>Replay the attack step by step</a>
      </p>
    </div>
  );
}
