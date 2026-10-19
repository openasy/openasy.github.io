import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { PRODUCTS, type ProductId } from "@openasy/ui";
import type { Goal } from "../data/goals";

export const product = (id: string) => PRODUCTS[id as ProductId];

export function GoalCard({ goal }: { goal: Goal }) {
  return (
    <li className="flex">
      <Link to={`/goals/${goal.id}`} className="flex w-full flex-col gap-2 rounded-lg border border-line bg-surface p-4 text-fg no-underline hover:border-line-strong hover:shadow-raised">
        <span className="text-base font-semibold">{goal.title}</span>
        <span className="text-sm text-fg-muted">“{goal.ask}”</span>
        <span className="mt-auto flex flex-wrap items-center gap-1.5 pt-1 text-xs text-fg-muted">
          {goal.required.map((id) => (
            <span key={id} className="rounded border border-line px-1.5 py-0.5 font-medium text-fg">
              {product(id).name}
            </span>
          ))}
          <ArrowRight aria-hidden className="ml-auto size-4 text-accent-text" />
        </span>
      </Link>
    </li>
  );
}

export function ProductCard({ id }: { id: string }) {
  const p = product(id);
  return (
    <li className="flex">
      <Link to={`/products/${id}`} className="flex w-full items-start gap-3 rounded-lg border border-line bg-surface p-3 text-fg no-underline hover:border-line-strong">
        <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-md bg-accent-soft text-accent-text">
          <p.icon className="size-4" />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="font-semibold">{p.name}</span>
          <span className="text-xs text-fg-muted">{p.summary}</span>
        </span>
      </Link>
    </li>
  );
}

/** docker compose file for a set of products: one container and one SQLite volume each. */
export function composeFor(ids: string[]): string {
  const lines = ["services:"];
  ids.forEach((id, i) => {
    const p = product(id);
    lines.push(`  ${id}:`, `    image: ${p.image}:1`, "    restart: unless-stopped", "    ports:", `      - "${8443 + i}:8443"`);
    if (id === "vpn") lines.push(`      - "1194:1194/udp"`);
    lines.push("    volumes:", `      - ${id}-data:/data   # SQLite database and settings`, "    environment:", `      OPENASY_BACKUP: daily   # snapshot at 02:00, kept 7 daily / 4 weekly / 12 monthly`);
  });
  lines.push("volumes:", ...ids.map((id) => `  ${id}-data:`));
  return lines.join("\n");
}
