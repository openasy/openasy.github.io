import type { ReactNode } from "react";
import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration, useRouteError } from "react-router";
import { BrandProvider, themeScript, useThemePreference } from "@openasy/ui";
import { SiteFooter, SiteHeader } from "./components/site";
import "./app.css";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        {/* Applies the remembered theme before the first paint, so dark pages never flash light. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript() }} />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useThemePreference();
  return (
    <BrandProvider theme={theme} root brand={{ name: "OpenAsy", hidePoweredBy: true }} className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-30 focus:top-2 focus:left-2 focus:rounded focus:bg-surface focus:px-3 focus:py-2">
        Skip to content
      </a>
      <SiteHeader theme={theme} onThemeChange={setTheme} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </BrandProvider>
  );
}

export default function App() {
  return (
    <Shell>
      <Outlet />
    </Shell>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="text-3xl font-semibold">{notFound ? "Page not found" : "Something went wrong"}</h1>
        <p className="text-fg-muted">
          <a href="/">Back to the home page</a>
        </p>
      </div>
    </Shell>
  );
}
