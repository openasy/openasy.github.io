import { useEffect, useRef, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { Code, Menu, X } from "lucide-react";
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
];

export function SiteHeader({ theme, onThemeChange }: { theme: ThemePreference; onThemeChange: (next: ThemePreference) => void }) {
  const menu = useRef<HTMLDetailsElement>(null);
  const { pathname } = useLocation();
  const close = () => menu.current?.removeAttribute("open");
  // A link in the menu changes the page without reloading it; close the menu when that happens.
  useEffect(close, [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && menu.current?.open) {
        close();
        menu.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/85 backdrop-blur supports-[not(backdrop-filter:blur(0))]:bg-surface">
      <div className="mx-auto flex max-w-6xl items-center gap-x-6 px-4 py-2 md:py-3">
        <Link to="/" className="flex min-h-11 items-center gap-2 text-base font-semibold text-fg no-underline md:min-h-0">
          <LogoMark />
          OpenAsy
        </Link>

        {/* Wide screens: everything in one row. */}
        <nav aria-label="Main" className="hidden grow items-center gap-4 text-sm md:flex">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => cn("py-1 no-underline hover:text-fg", isActive ? "font-semibold text-fg" : "text-fg-muted")}>
              {n.label}
            </NavLink>
          ))}
          <a href={STORYBOOK} className="py-1 text-fg-muted no-underline hover:text-fg">
            Storybook
          </a>
        </nav>
        <div className="hidden items-center gap-4 md:flex">
          <a href={GITHUB} className="inline-flex items-center gap-1.5 py-1 text-sm text-fg-muted no-underline hover:text-fg">
            <Code aria-hidden className="size-4" />
            GitHub
          </a>
          <ThemeToggle value={theme} onChange={onThemeChange} />
        </div>

        {/*
          Phones: one button. <details> opens without JavaScript too, since pages are prerendered. The panel slides
          down from under the header inside a box that starts at the header's bottom edge and clips what is above it;
          the page behind dims, and a tap on it closes the menu (site-menu in app.css).
        */}
        <details ref={menu} className="site-menu group ml-auto md:hidden">
          <summary className="flex size-11 cursor-pointer list-none items-center justify-center rounded-md border border-line-strong text-fg [&::-webkit-details-marker]:hidden">
            <Menu aria-hidden className="size-5 group-open:hidden" />
            <X aria-hidden className="hidden size-5 group-open:block" />
            <span className="sr-only">Menu</span>
          </summary>
          <div className="pointer-events-none absolute inset-x-0 top-full h-dvh overflow-hidden">
          <div aria-hidden className="site-menu-backdrop pointer-events-auto absolute inset-0 bg-black/40" onClick={close} />
          <div className="site-menu-panel pointer-events-auto relative max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-line bg-surface px-4 pt-2 pb-4 shadow-overlay">
            <nav aria-label="Menu" className="flex flex-col">
              {NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  onClick={close}
                  className={({ isActive }) => cn("flex min-h-12 items-center border-b border-line text-base no-underline", isActive ? "font-semibold text-fg" : "text-fg")}
                >
                  {n.label}
                </NavLink>
              ))}
              <a href={STORYBOOK} className="flex min-h-12 items-center border-b border-line text-base text-fg no-underline">
                Storybook
              </a>
              <a href={GITHUB} className="flex min-h-12 items-center gap-2 border-b border-line text-base text-fg no-underline">
                <Code aria-hidden className="size-4" />
                GitHub
              </a>
            </nav>
            <div className="flex min-h-12 items-center justify-between pt-3">
              <span className="text-sm text-fg-muted">Theme</span>
              <ThemeToggle value={theme} onChange={onThemeChange} />
            </div>
          </div>
          </div>
        </details>
      </div>
    </header>
  );
}

export function SiteFooter() {
  // On phones each link is a 44 px tall target; on wider screens they sit in one line.
  const link = "inline-flex min-h-11 items-center text-fg-muted sm:min-h-0";
  return (
    <footer className="mt-12 border-t border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 px-4 py-6 text-xs text-fg-muted">
        <p className="m-0">OpenAsy is open source: products under AGPL-3.0, the component library under Apache-2.0. No telemetry, no lock-in. Support plans fund the work.</p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-0 text-sm sm:gap-4 sm:text-xs">
          <a href="/support" className={link}>
            Support
          </a>
          <a href={GITHUB} className={link}>
            Source code
          </a>
          <a href={STORYBOOK} className={link}>
            Component library
          </a>
          <a href={`${GITHUB}/openasy.github.io/blob/main/docs/decisions/0008-open-source.md`} className={link}>
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
