import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub } from "react-router";
import { describe, expect, it } from "vitest";
import { PRODUCT_IDS, PRODUCTS, type ProductId } from "@openasy/ui";
import { GOALS } from "./data/goals";
import { IN_FORCE, PRINCIPLES, RECORDS_ALL } from "./data/principles";
import { storyUrl } from "./data/storybook";
import { STATUS } from "./data/status";
import { composeFor } from "./components/cards";
import { SiteFooter, SiteHeader } from "./components/site";
import { BREACH_STORY, coverage } from "./components/breach";
import Home from "./routes/home";
import Goals from "./routes/goals";
import GoalPage from "./routes/goal";
import Products from "./routes/products";
import ProductPage from "./routes/product";
import ProductApi from "./routes/product-api";
import { APIS } from "./data/apis";
import Principles from "./routes/principles";
import Evidence from "./routes/evidence";
import { CLAIMS, JUDGMENT } from "./data/evidence";
import Support from "./routes/support";
import SignIn from "./routes/sign-in";
import Install from "./routes/install";
import { PLANS, SUPPORT_EMAIL } from "./data/support";
import { atLeast, readiness, withStatus } from "./data/status";
import { INSTALLABLE } from "./data/install";

const Stub = createRoutesStub([
  { path: "/", Component: Home },
  { path: "/goals", Component: Goals },
  { path: "/goals/:id", Component: GoalPage },
  { path: "/products", Component: Products },
  { path: "/products/:id", Component: ProductPage },
  { path: "/products/:id/api", Component: ProductApi },
  { path: "/principles", Component: Principles },
  { path: "/evidence", Component: Evidence },
  { path: "/support", Component: Support },
  { path: "/sign-in", Component: SignIn },
  { path: "/install", Component: Install },
]);

const open = (url: string) => render(<Stub initialEntries={[url]} />);
const h1 = () => screen.getByRole("heading", { level: 1 });

describe("data", () => {
  it("every goal names real products", () => {
    for (const g of GOALS) for (const id of [...g.required, ...g.recommended.map((r) => r.id)]) expect(PRODUCT_IDS).toContain(id as ProductId);
  });

  it("goal ids are unique and every goal needs at least one product", () => {
    expect(new Set(GOALS.map((g) => g.id)).size).toBe(GOALS.length);
    for (const g of GOALS) expect(g.required.length).toBeGreaterThan(0);
  });

  it("status entries name real products, and released ones have a version", () => {
    for (const [id, s] of Object.entries(STATUS)) {
      expect(PRODUCT_IDS).toContain(id as ProductId);
      if (s!.status === "Preview") expect(s!.version).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });

  it("links each product to its Storybook screens", () => {
    expect(storyUrl("Network IDS")).toBe("https://openasy.github.io/ui/?path=/story/products-network-ids--alerts");
    expect(storyUrl("SAST")).toContain("--pull-requests");
  });

  it("builds one service and one volume per product", () => {
    const yaml = composeFor(["vpn", "logs"]);
    expect(yaml).toContain("image: ghcr.io/openasy/vpn:0.12.0");
    expect(yaml).toContain("image: ghcr.io/openasy/vpn-server:0.12.0");
    // Sign-in: no admin token, a secrets key, and the address cookies and passkeys are bound to.
    expect(yaml).not.toContain("ADMIN_TOKEN");
    expect(yaml).toContain("VPN_PUBLIC_URL: http://localhost:8443");
    expect(yaml).toContain("secrets:\n  openasy-kek:\n    file: ./openasy-kek");
    expect(yaml).toContain("net.ipv4.ip_forward: 1");
    expect(yaml).toContain('"1194:1194/udp"');
    expect(yaml).toContain("logs-data:/data");
  });
});

describe("pages", () => {
  it("home lists every goal and every product", () => {
    open("/");
    expect(h1()).toHaveTextContent("Run and secure your infrastructure");
    for (const g of GOALS) expect(screen.getAllByRole("link", { name: new RegExp(g.title) }).length).toBeGreaterThan(0);
    for (const id of PRODUCT_IDS) expect(screen.getAllByRole("link", { name: PRODUCTS[id].name }).length).toBeGreaterThan(0);
    expect(screen.getByRole("list", { name: "Released and in progress products" })).toHaveTextContent("Vulnerabilities");
  });

  it("goals page links to each guide", () => {
    open("/goals");
    expect(h1()).toHaveTextContent("Start from a goal");
    expect(screen.getByRole("link", { name: /Secure remote access/ })).toHaveAttribute("href", "/goals/vpn");
  });

  it.each(GOALS.map((g) => [g.id, g.title]))("guide %s has install steps", (id, title) => {
    open(`/goals/${id}`);
    expect(h1()).toHaveTextContent(title);
    expect(screen.getByRole("list", { name: "Install steps" }).children.length).toBeGreaterThanOrEqual(4);
  });

  it("the VPN guide needs only the VPN", () => {
    open("/goals/vpn");
    expect(screen.getByLabelText(/Code for step 1/)).toHaveTextContent("VPN_PUBLIC_HOST");
    expect(screen.getByLabelText(/Code for step 1/)).toHaveTextContent("docker compose up -d");
    expect(screen.getByText("Ready to try")).toBeInTheDocument();
    // Sign-in: the owner account comes from the one-time link in the log, not an admin token.
    expect(screen.getByText("Create the owner account")).toBeInTheDocument();
    expect(screen.getByLabelText(/Code for step 1/)).not.toHaveTextContent("ADMIN_TOKEN");
  });

  it("products page filters by group", async () => {
    open("/products");
    const list = () => screen.getByRole("list", { name: "Product list" });
    expect(list().children).toHaveLength(PRODUCT_IDS.length);
    await userEvent.click(screen.getByRole("radio", { name: "Identity" }));
    expect(list().children).toHaveLength(1);
    await userEvent.click(screen.getByRole("radio", { name: "All groups" }));
    await userEvent.click(screen.getByRole("radio", { name: /^Ready to try/ }));
    expect(list().children).toHaveLength(withStatus(PRODUCT_IDS, "Preview").length);
    expect(list()).toHaveTextContent("Identity");
    expect(list()).toHaveTextContent("VPN");
    expect(list()).toHaveTextContent("Vulnerabilities");
    expect(list()).toHaveTextContent("Infrastructure");
  });

  it("goals page puts the goals you can run today on top", () => {
    open("/goals");
    const ready = GOALS.filter((g) => readiness(g.required) === "Ready to try");
    expect(screen.getByRole("list", { name: "Goals you can run today" }).children).toHaveLength(ready.length);
    expect(screen.getByRole("list", { name: "More goals" }).children).toHaveLength(GOALS.length - ready.length);
  });

  it("product page shows its goals", () => {
    open("/products/backups");
    // The heading is the problem it solves; the product's name is above it.
    expect(h1()).toHaveTextContent("Whether your backups ran");
    expect(screen.getByRole("link", { name: "Notice data loss" })).toHaveAttribute("href", "/goals/data-loss");
  });

  it("home shows which attack stages released products watch today", () => {
    open("/");
    expect(screen.getByRole("list", { name: "ATT&CK stages" }).children).toHaveLength(12);
    expect(screen.getByRole("listitem", { name: /Initial access: covered today by (.*, )?VPN/ })).toBeInTheDocument();
    // Every stage says which released products watch it, or which coming product will.
    const { stages } = coverage(withStatus(PRODUCT_IDS, "Preview") as ProductId[]);
    for (const s of stages)
      expect(screen.getByRole("listitem", { name: new RegExp(`^${s.name}: covered ${s.live.length ? "today" : "once"}`) })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Replay a phishing/ })).toHaveAttribute("href", BREACH_STORY);
  });

  it("the VPN API reference lists every operation from openapi.json", () => {
    open("/products/vpn/api");
    expect(h1()).toHaveTextContent("VPN API");
    const spec = APIS.vpn!.spec;
    const count = Object.values(spec.paths).reduce((n, ops) => n + Object.keys(ops).length, 0);
    expect(screen.getByRole("navigation", { name: "Operations" }).querySelectorAll("li")).toHaveLength(count);
    expect(screen.getByText("/api/v1/servers/heartbeat", { selector: "code" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Errors" })).toBeInTheDocument();
  });

  it("the VPN product page links to its API reference", () => {
    open("/products/vpn");
    expect(screen.getByRole("link", { name: "API reference" })).toHaveAttribute("href", "/products/vpn/api");
  });

  it("the VPN product page shows what works, what it is built on and how to connect", () => {
    open("/products/vpn");
    expect(screen.getByText("Preview 0.12.0")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Features" })).toHaveTextContent("Command line tool, openasy-vpn");
    expect(screen.getByRole("list", { name: "Features" })).not.toHaveTextContent("(not yet)");
    expect(screen.getByRole("link", { name: "OpenVPN" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Connect a device" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "OpenVPN Connect" }).length).toBeGreaterThanOrEqual(4);
    expect(screen.getByLabelText("compose.yaml for VPN")).toHaveTextContent("vpn:0.12.0");
  });

  it("the VPN product page offers ways to deploy", async () => {
    open("/products/vpn");
    const tabs = within(screen.getByRole("tablist", { name: "How to deploy" })).getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["One host", "Panel inside, server at the edge", "Several locations"]);
    const compose = screen.getByLabelText("compose.yaml for VPN");
    expect(compose).toHaveTextContent("VPN_ENROLL_TOKEN: ${EDGE_1_TOKEN:-}");
    expect(compose).toHaveTextContent("vpn-server-data:/var/lib/openasy-vpn");
    expect(compose).not.toHaveTextContent("VPN_SERVER_TOKEN");

    await userEvent.click(screen.getByRole("tab", { name: "Several locations" }));
    const steps = screen.getByRole("list", { name: "Steps: Several locations" });
    expect(
      within(steps)
        .getAllByRole("heading")
        .map((h) => h.textContent),
    ).toEqual(["Run the panel once", "Add a server per location", "Start vpn-server at each location", "Then add devices"]);
    expect(screen.getByLabelText("Start vpn-server at each location")).toHaveTextContent("ghcr.io/openasy/vpn-server:0.12.0");
    expect(screen.queryByLabelText("compose.yaml for VPN")).not.toBeInTheDocument();
  });

  it("hides ways to deploy that the released version does not support", () => {
    const vpn = STATUS.vpn!;
    const was = vpn.version;
    vpn.version = "0.5.0";
    try {
      open("/products/vpn");
      expect(screen.queryByRole("tablist", { name: "How to deploy" })).not.toBeInTheDocument();
      expect(screen.getByLabelText("compose.yaml for VPN")).toHaveTextContent("VPN_SERVER_TOKEN");
    } finally {
      vpn.version = was;
    }
  });

  it("compares versions", () => {
    expect(atLeast("0.6.0", "0.6.0")).toBe(true);
    expect(atLeast("0.10.0", "0.6.0")).toBe(true);
    expect(atLeast("0.5.9", "0.6.0")).toBe(false);
    expect(atLeast(undefined, "0.6.0")).toBe(false);
  });

  it("the sign-in guides follow the presets and the reader's product address", async () => {
    open("/sign-in");
    const tabs = within(screen.getByRole("tablist", { name: "Identity provider" }))
      .getAllByRole("tab")
      .map((t) => t.textContent);
    expect(tabs).toEqual(["Keycloak", "Microsoft Entra ID", "Okta", "Google", "authentik", "ZITADEL", "OpenAsy Identity", "Another OpenID Connect provider"]);
    expect(screen.getByText("https://vpn.example.com/api/v1/auth/oidc/keycloak/callback")).toBeInTheDocument();
    const address = screen.getByLabelText("Your product's address");
    await userEvent.clear(address);
    await userEvent.type(address, "https://infra.acme.io/");
    expect(screen.getByText("https://infra.acme.io/api/v1/auth/oidc/keycloak/callback")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: "Google" }));
    expect(screen.getByText(/Google sends no groups/)).toBeInTheDocument();
    expect(screen.getByLabelText("Environment for Google")).toHaveTextContent("OPENASY_OIDC_ALLOWED_DOMAINS=example.com");
    expect(screen.getByRole("link", { name: "OpenAsy Identity" })).toHaveAttribute("href", "/products/identity");
  });

  it("Identity is released: its compose file and what it builds on", () => {
    open("/products/identity");
    expect(screen.getByText("Preview 0.5.0")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Run it" })).toBeInTheDocument();
    expect(screen.getByText(/image: ghcr.io\/openasy\/identity:0.5.0/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "samlify" })).toBeInTheDocument();
  });

  it("the install page offers the dev setup first, then a setup for production", async () => {
    open("/install");
    const compose = () => screen.getByLabelText("compose.yaml").textContent ?? "";
    // It opens on the dev setup: everything released, wired by its setup container.
    expect(screen.getByRole("radio", { name: "Try it locally" })).toBeChecked();
    expect(compose()).toContain("name: openasy-dev");
    expect(within(screen.getByRole("list", { name: "Files" })).getByRole("button", { name: "Open setup/setup.ts" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download openasy-dev.zip" })).toBeEnabled();
    expect(screen.getByRole("list", { name: "Steps to start" })).toHaveTextContent("docker compose up -d && docker compose logs -f setup");
    // Opened from the other computers on the network, the products get names under a domain of its own.
    await userEvent.click(screen.getByRole("radio", { name: "Other computers too" }));
    expect(screen.getByLabelText("Domain")).toHaveValue("openasy.internal");
    expect(compose()).toContain("- id.openasy.internal");
    expect(screen.getByRole("heading", { name: "Four steps" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("radio", { name: "This computer" }));
    expect(compose()).toContain("- id.localhost");

    await userEvent.click(screen.getByRole("radio", { name: "Production" }));
    expect(compose()).toContain("- { path: products/vpn.yaml, project_directory: . }");
    // Only released products can be picked.
    const products = within(screen.getByRole("group", { name: "Products" }));
    expect(products.getAllByRole("checkbox")).toHaveLength(INSTALLABLE.length);
    await userEvent.click(products.getByRole("checkbox", { name: /Infrastructure/ }));
    expect(compose()).toContain("- { path: products/infra.yaml, project_directory: . }");
    await userEvent.click(screen.getByRole("radio", { name: /Keycloak, ready for OpenAsy/ }));
    expect(compose()).toContain("- { path: products/keycloak.yaml, project_directory: . }");
    // Every file is in one folder: pick one to read, copy or download it. Secrets are made once the page runs.
    const files = within(screen.getByRole("list", { name: "Files" }));
    // Each product is a file of its own, with its containers, settings and secrets (ADR 0054).
    await userEvent.click(files.getByRole("button", { name: "Open products/vpn.yaml" }));
    expect(screen.getByLabelText("products/vpn.yaml")).toHaveTextContent("OPENASY_OIDC_ISSUER: https://auth.example.com/realms/openasy");
    await userEvent.click(files.getByRole("button", { name: "Open keys/openasy-kek" }));
    expect(screen.getByLabelText("keys/openasy-kek")).toHaveTextContent(/^[0-9a-f]{64}$/);
    expect(screen.getByRole("button", { name: "Download keys/openasy-kek" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Steps to start" })).toHaveTextContent("openasy-realm.json");
    // The brand goes into openasy.env, which every product loads.
    await userEvent.click(screen.getByText("Your brand"));
    await userEvent.type(screen.getByLabelText("Organization"), "Acme Corp");
    await userEvent.click(files.getByRole("button", { name: "Open openasy.env" }));
    expect(screen.getByLabelText("openasy.env")).toHaveTextContent("OPENASY_ORGANIZATION='Acme Corp'");
  });

  it("a product's page says what problem it solves, how it works, what it checks and where it shows it", async () => {
    open("/products/sast");
    const menu = within(screen.getByRole("navigation", { name: "On this page" }));
    for (const title of [
      "The problem",
      "How it works",
      "What it checks",
      "How it decides",
      "Where you see it",
      "Works with",
      "What it does not do",
      "What works today",
      "Run it",
    ])
      expect(menu.getByRole("link", { name: title })).toHaveAttribute("href", expect.stringMatching(/^#/));
    // The heading is the problem it solves, and four facts at a glance sit under it.
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Flaws in your own code");
    expect(screen.getByText("Reads").closest("dl")).toHaveTextContent("Your own code");
    expect(screen.getByRole("heading", { name: "A scanner that blocks every old finding gets switched off" })).toBeInTheDocument();
    expect(within(screen.getByRole("list", { name: "How it works, step by step" })).getAllByRole("listitem")).toHaveLength(4);
    // What it checks: a tab per group down the side.
    const checks = within(screen.getByRole("tablist", { name: "What it checks" }));
    expect(checks.getByRole("tab", { name: /^Injection/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "Injection" })).toHaveTextContent("CWE-89");
    await userEvent.click(checks.getByRole("tab", { name: /^Web/ }));
    expect(screen.getByRole("tabpanel", { name: "Web" })).toHaveTextContent("CWE-79");
    // How it decides: a rule under each label.
    expect(within(screen.getByLabelText("How it decides", { selector: "dl" })).getByText("Severity")).toBeInTheDocument();
    // Where you see it: one screen at a time, each with its Storybook link.
    await userEvent.click(within(screen.getByRole("tablist", { name: "Screens" })).getByRole("tab", { name: "Findings" }));
    expect(within(screen.getByRole("tabpanel", { name: "Findings" })).getByRole("link", { name: "Open in Storybook" })).toHaveAttribute(
      "href",
      expect.stringContaining("products-sast--findings"),
    );
    expect(within(screen.getByRole("list", { name: "Works with" })).getByRole("link", { name: "Secrets" })).toHaveAttribute("href", "/products/secrets");
  });

  it("a product being built shows no install steps", () => {
    open("/products/awareness");
    expect(screen.queryByRole("heading", { name: "Run it" })).not.toBeInTheDocument();
    expect(screen.queryByText(/docker compose up/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See the design" })).toBeInTheDocument();
  });

  it("Uptime is released: its compose file and what it builds on", () => {
    open("/products/uptime");
    expect(screen.getByText("Preview 0.5.0")).toBeInTheDocument();
    expect(screen.getByText(/image: ghcr.io\/openasy\/uptime:0.5.0/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Built on" })).toBeInTheDocument();
  });

  it("products page lists released products first", () => {
    open("/products");
    expect(screen.getByRole("list", { name: "Product list" }).children[0]).toHaveTextContent("VPN");
  });

  it("the header leaves Support to the footer", () => {
    const Stub = createRoutesStub([
      {
        path: "/",
        Component: () => (
          <>
            <SiteHeader theme="system" onThemeChange={() => {}} />
            <SiteFooter />
          </>
        ),
      },
    ]);
    render(<Stub initialEntries={["/"]} />);
    expect(screen.getByRole("navigation", { name: "Main" })).not.toHaveTextContent("Support");
    expect(screen.getByRole("navigation", { name: "Footer" })).toHaveTextContent("Support");
  });

  it("phones get the same links behind one Menu button", async () => {
    const Stub = createRoutesStub([{ path: "/", Component: () => <SiteHeader theme="system" onThemeChange={() => {}} /> }]);
    render(<Stub initialEntries={["/"]} />);
    const details = screen.getByText("Menu", { selector: "span" }).closest("details")!;
    expect(details.open).toBe(false);
    await userEvent.click(screen.getByText("Menu", { selector: "span" }));
    expect(details.open).toBe(true);
    const menu = screen.getByRole("navigation", { name: "Menu" });
    for (const name of ["Goals", "Products", "Principles", "Storybook", "GitHub"]) expect(menu).toHaveTextContent(name);
    expect(menu).not.toHaveTextContent("Support");
    // Storybook is another site: it opens in a new tab, and says so.
    for (const link of screen.getAllByRole("link", { name: /^Storybook ?\(opens in a new tab\)$/ })) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
    expect(screen.getAllByRole("link", { name: /^Storybook ?\(opens in a new tab\)$/ })).toHaveLength(2);
    await userEvent.keyboard("{Escape}");
    expect(details.open).toBe(false);
  });

  it("principles link to their records, accepted and proposed apart", () => {
    open("/principles");
    expect(screen.getAllByRole("link", { name: /^Read the record:/ })).toHaveLength(PRINCIPLES.length);
    const accepted = PRINCIPLES.filter((p) => p.decision === "Accepted").length;
    const table = screen.getByRole("table", { name: /Accepted decisions/ });
    expect(within(table).getAllByRole("row")).toHaveLength(accepted + 1);
    expect(screen.getByRole("list", { name: "Proposed decisions" }).children).toHaveLength(PRINCIPLES.length - accepted);
  });

  it("evidence names decisions in force, and every claim has a source", () => {
    const inForce = new Set(IN_FORCE.map((p) => p.n));
    expect(new Set(CLAIMS.map((c) => c.id)).size).toBe(CLAIMS.length);
    for (const c of CLAIMS) {
      for (const n of c.adrs) expect(inForce).toContain(n);
      expect(c.sources.length).toBeGreaterThan(0);
      for (const s of c.sources) expect(s.url).toMatch(/^https:\/\//);
    }
    // A decision is either backed by a claim or said to be our judgment, never both.
    for (const n of JUDGMENT) {
      expect(inForce).toContain(n);
      expect(CLAIMS.flatMap((c) => c.adrs)).not.toContain(n);
    }
  });

  it("the evidence page lists every claim with its sources, and the decisions that are our judgment", () => {
    open("/evidence");
    expect(h1()).toHaveTextContent("Evidence");
    expect(screen.getByRole("list", { name: "Claims and their sources" }).children).toHaveLength(CLAIMS.length);
    expect(screen.getByRole("link", { name: "99% False Positives: A Qualitative Study of SOC Analysts' Perspectives on Security Alarms" })).toHaveAttribute(
      "href",
      "https://www.usenix.org/conference/usenixsecurity22/presentation/alahmadi",
    );
    expect(screen.getByRole("list", { name: "Decisions that are our judgment" }).children).toHaveLength(JUDGMENT.length);
  });

  it("the home page says what the decisions rest on and leads to the evidence", () => {
    open("/");
    expect(screen.getByRole("heading", { name: "Why it is built this way" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: `All ${CLAIMS.length} claims and their sources` })).toHaveAttribute("href", "/evidence");
  });

  it("every decision record has a valid decision and implementation status", () => {
    expect(PRINCIPLES.length).toBeGreaterThanOrEqual(30);
    expect(new Set(RECORDS_ALL.map((p) => p.n)).size).toBe(RECORDS_ALL.length);
    for (const p of RECORDS_ALL) {
      expect(p.decision).toMatch(/^(Proposed|Accepted|Superseded by \d{4})$/);
      // A superseded record leads to one in force, and only those are on the site.
      const successor = /^Superseded by (\d{4})$/.exec(p.decision)?.[1];
      if (successor) expect(IN_FORCE.map((q) => q.n)).toContain(successor);
      expect(IN_FORCE.includes(p)).toBe(!successor);
      // A record of one product is described on its product page, not among the principles.
      expect(PRINCIPLES.includes(p)).toBe(!successor && !p.product);
      expect(["Not started", "In progress", "Implemented"]).toContain(p.implementation);
      if (p.decision === "Proposed") expect(["Critical", "High", "Medium"]).toContain(p.priority);
      expect(p.file.startsWith(p.n)).toBe(true);
    }
  });

  it("support page shows the plans and a way to buy them", () => {
    open("/support");
    expect(h1()).toHaveTextContent("Support");
    expect(screen.getByRole("list", { name: "Support plans" }).children).toHaveLength(PLANS.length);
    for (const link of screen.getAllByRole("link", { name: /Contact us/ })) expect(link.getAttribute("href")).toMatch(new RegExp(`^mailto:${SUPPORT_EMAIL}`));
    expect(screen.getByRole("table", { name: "Response times by severity and plan" })).toBeInTheDocument();
  });

  it("home leaves support to the footer", () => {
    open("/");
    expect(screen.queryByRole("link", { name: "See support plans" })).not.toBeInTheDocument();
  });
});
