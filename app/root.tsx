import type { ReactNode } from "react";
import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration, useRouteError } from "react-router";
import { BrandProvider } from "@openasy/ui";
import { SiteFooter, SiteHeader, useSystemTheme } from "./components/site";
import "./app.css";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
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
  const theme = useSystemTheme();
  return (
    <BrandProvider theme={theme} brand={{ name: "OpenAsy", hidePoweredBy: true }} style={{ minHeight: "100vh" }}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded focus:bg-surface focus:px-3 focus:py-2">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">{children}</main>
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
