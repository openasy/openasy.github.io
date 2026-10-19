import type { ReactNode } from "react";
import { Link, NavLink } from "react-router";
import { Code } from "lucide-react";
import { cn, ThemeToggle, type ThemePreference } from "@openasy/ui";
import { STORYBOOK } from "../data/storybook";

export const GITHUB = "https://github.com/openasy";

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

/** The OpenAsy mark: an open ring, and a product joining through the gap. Same drawing as public/logo-mark.svg. */
export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden>
      <rect width="32" height="32" rx="8" fill="#1f4fd8" />
      <path d="M24 16A8 8 0 1 1 16 8" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="21.66" cy="10.34" r="2.1" fill="#fff" />
    </svg>
  );
}

const NAV = [
  { to: "/goals", label: "Goals" },
  { to: "/products", label: "Products" },
  { to: "/principles", label: "Principles" },
  { to: "/support", label: "Support" },
];

export function SiteHeader({ theme, onThemeChange }: { theme: ThemePreference; onThemeChange: (next: ThemePreference) => void }) {
  return (
    <header className="z-20 border-b sm:sticky sm:top-0 border-line bg-surface/85 backdrop-blur supports-[not(backdrop-filter:blur(0))]:bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-base font-semibold text-fg no-underline">
          <LogoMark />
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
        <div className="flex items-center gap-4">
          <a href={GITHUB} className="inline-flex items-center gap-1.5 text-sm text-fg-muted no-underline hover:text-fg">
            <Code aria-hidden className="size-4" />
            GitHub
          </a>
          <ThemeToggle value={theme} onChange={onThemeChange} />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 px-4 py-6 text-xs text-fg-muted">
        <p className="m-0">OpenAsy is open source: products under AGPL-3.0, the component library under Apache-2.0. No telemetry, no lock-in. Support plans fund the work.</p>
        <nav aria-label="Footer" className="flex flex-wrap gap-4">
          <a href="/support" className="text-fg-muted">
            Support
          </a>
          <a href={GITHUB} className="text-fg-muted">
            Source code
          </a>
          <a href={STORYBOOK} className="text-fg-muted">
            Component library
          </a>
          <a href={`${GITHUB}/ui/blob/main/docs/decisions/0008-open-source.md`} className="text-fg-muted">
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

export function CodeBlock({ code, label, className }: { code: string; label: string; className?: string }) {
  return (
    <pre tabIndex={0} aria-label={label} className={cn("m-0 overflow-x-auto rounded-md border border-line bg-subtle p-3 font-mono text-xs leading-5 text-fg", className)}>
      <code>{code}</code>
    </pre>
  );
}
