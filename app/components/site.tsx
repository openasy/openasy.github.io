import { useSyncExternalStore, type ReactNode } from "react";
import { Link, NavLink } from "react-router";
import { Code } from "lucide-react";
import { cn } from "@openasy/ui";
import { STORYBOOK } from "../data/storybook";

export const GITHUB = "https://github.com/openasy";

const query = "(prefers-color-scheme: dark)";

/** Follows the operating system's light or dark setting. Prerendered HTML starts light. */
export function useSystemTheme(): "light" | "dark" {
  return useSyncExternalStore(
    (onChange) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", onChange);
      return () => m.removeEventListener("change", onChange);
    },
    () => (window.matchMedia(query).matches ? "dark" : "light"),
    () => "light",
  );
}

const btn = {
  base: "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border font-medium whitespace-nowrap no-underline transition-colors [&_svg]:size-4",
  size: { md: "h-8 px-3 text-sm", lg: "h-10 px-4 text-base" },
  variant: {
    primary: "bg-accent text-accent-contrast border-accent hover:bg-accent-hover hover:border-accent-hover",
    secondary: "bg-surface text-fg border-line-strong hover:bg-subtle",
  },
};

/** A link styled like the library's Button. */
export function ButtonLink({ to, children, variant = "secondary", size = "md", external }: { to: string; children: ReactNode; variant?: "primary" | "secondary"; size?: "md" | "lg"; external?: boolean }) {
  const className = cn(btn.base, btn.size[size], btn.variant[variant]);
  return external ? (
    <a href={to} className={className}>
      {children}
    </a>
  ) : (
    <Link to={to} className={className}>
      {children}
    </Link>
  );
}

const NAV = [
  { to: "/goals", label: "Goals" },
  { to: "/products", label: "Products" },
  { to: "/principles", label: "Principles" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-base font-semibold text-fg no-underline">
          <span aria-hidden className="grid size-6 place-items-center rounded-md bg-accent text-xs font-bold text-accent-contrast">
            O
          </span>
          OpenAsy
        </Link>
        <nav aria-label="Main" className="flex grow flex-wrap items-center gap-4 text-sm">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => cn("no-underline hover:text-fg", isActive ? "font-semibold text-fg" : "text-fg-muted")}>
              {n.label}
            </NavLink>
          ))}
          <a href={STORYBOOK} className="text-fg-muted no-underline hover:text-fg">
            Storybook
          </a>
        </nav>
        <a href={GITHUB} className="inline-flex items-center gap-1.5 text-sm text-fg-muted no-underline hover:text-fg">
          <Code aria-hidden className="size-4" />
          GitHub
        </a>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 px-4 py-6 text-xs text-fg-muted">
        <p className="m-0">OpenAsy is open source under the Apache-2.0 licence. No telemetry, no lock-in.</p>
        <nav aria-label="Footer" className="flex flex-wrap gap-4">
          <a href={GITHUB} className="text-fg-muted">
            Source code
          </a>
          <a href={STORYBOOK} className="text-fg-muted">
            Component library
          </a>
          <a href={`${GITHUB}/ui/blob/main/LICENSE`} className="text-fg-muted">
            Licence
          </a>
        </nav>
      </div>
    </footer>
  );
}

/** Page width container with the 16px phone gutter. */
export function Section({ children, className, labelledBy }: { children: ReactNode; className?: string; labelledBy?: string }) {
  return (
    <section aria-labelledby={labelledBy} className={cn("mx-auto max-w-6xl px-4", className)}>
      {children}
    </section>
  );
}

export function CodeBlock({ code, label }: { code: string; label: string }) {
  return (
    <pre tabIndex={0} aria-label={label} className="m-0 overflow-x-auto rounded-md border border-line bg-subtle p-3 font-mono text-xs leading-5 text-fg">
      <code>{code}</code>
    </pre>
  );
}
