import { Link } from "react-router";
import { Shapes, SquareTerminal, type LucideIcon } from "lucide-react";
import { Badge, cn } from "@openasy/ui";
import { MAC_APPS, type MacApp, type MacAppId } from "../data/apps";

export const MAC_APP_ICON: Record<MacAppId, LucideIcon> = { "database-client": SquareTerminal, schema: Shapes };

export function MacAppBadge({ app }: { app: MacApp }) {
  return <Badge tone={app.status === "Preview" ? "success" : "warning"}>{app.version ? `${app.status} ${app.version}` : app.status}</Badge>;
}

export function MacAppCard({ app }: { app: MacApp }) {
  const Icon = MAC_APP_ICON[app.id];
  return (
    <li className="flex">
      <Link
        to={`/apps/${app.id}`}
        className={cn(
          "flex w-full items-start gap-3 rounded-lg border bg-surface p-4 text-fg no-underline hover:shadow-raised",
          app.status === "Preview" ? "border-accent" : "border-dashed border-warning",
        )}
      >
        <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-md bg-accent-soft text-accent-text">
          <Icon className="size-4" />
        </span>
        <span className="flex min-w-0 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold">{app.name}</span>
            <MacAppBadge app={app} />
          </span>
          <span className="text-sm text-fg-muted">{app.summary}</span>
        </span>
      </Link>
    </li>
  );
}

/** The Mac apps under the products, on the products page. */
export function MacAppList() {
  return (
    <ul aria-label="Mac apps" className="mt-4 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {MAC_APPS.map((a) => (
        <MacAppCard key={a.id} app={a} />
      ))}
    </ul>
  );
}
