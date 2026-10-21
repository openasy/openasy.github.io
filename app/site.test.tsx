import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub } from "react-router";
import { describe, expect, it } from "vitest";
import { PRODUCT_IDS, PRODUCTS, type ProductId } from "@openasy/ui";
import { GOALS } from "./data/goals";
import { PRINCIPLES } from "./data/principles";
import { storyUrl } from "./data/storybook";
import { STATUS } from "./data/status";
import { composeFor } from "./components/cards";
import { SiteFooter, SiteHeader } from "./components/site";
import { BREACH_STORY } from "./components/breach";
import Home from "./routes/home";
import Goals from "./routes/goals";
import GoalPage from "./routes/goal";
import Products from "./routes/products";
import ProductPage from "./routes/product";
import ProductApi from "./routes/product-api";
import { APIS } from "./data/apis";
import Principles from "./routes/principles";
import Support from "./routes/support";
import SignIn from "./routes/sign-in";
import { PLANS, SUPPORT_EMAIL } from "./data/support";
import { atLeast, readiness } from "./data/status";

const Stub = createRoutesStub([
  { path: "/", Component: Home },
  { path: "/goals", Component: Goals },
  { path: "/goals/:id", Component: GoalPage },
  { path: "/products", Component: Products },
  { path: "/products/:id", Component: ProductPage },
  { path: "/products/:id/api", Component: ProductApi },
  { path: "/principles", Component: Principles },
  { path: "/support", Component: Support },
  { path: "/sign-in", Component: SignIn },
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
    expect(yaml).toContain("image: ghcr.io/openasy/vpn:0.6.0");
    expect(yaml).toContain("image: ghcr.io/openasy/vpn-server:0.6.0");
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
    expect(list().children).toHaveLength(3);
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
    expect(h1()).toHaveTextContent("Backups");
    expect(screen.getByRole("link", { name: "Notice data loss" })).toHaveAttribute("href", "/goals/data-loss");
  });

  it("home shows which attack stages released products watch today", () => {
    open("/");
    expect(screen.getByRole("list", { name: "ATT&CK stages" }).children).toHaveLength(12);
    expect(screen.getByRole("listitem", { name: /Initial access: covered today by VPN/ })).toBeInTheDocument();
    expect(screen.getByRole("listitem", { name: /Execution: covered once/ })).toBeInTheDocument();
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
    expect(screen.getByText("Preview 0.6.0")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Features" })).toHaveTextContent("Command line tool, openasy-vpn");
    expect(screen.getByRole("list", { name: "Features" })).not.toHaveTextContent("(not yet)");
    expect(screen.getByRole("link", { name: "OpenVPN" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Connect a device" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "OpenVPN Connect" }).length).toBeGreaterThanOrEqual(4);
    expect(screen.getByLabelText("compose.yaml for VPN")).toHaveTextContent("vpn:0.6.0");
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
    expect(within(steps).getAllByRole("heading").map((h) => h.textContent)).toEqual(["Run the panel once", "Add a server per location", "Start vpn-server at each location", "Then add devices"]);
    expect(screen.getByLabelText("Start vpn-server at each location")).toHaveTextContent("ghcr.io/openasy/vpn-server:0.6.0");
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
    const tabs = within(screen.getByRole("tablist", { name: "Identity provider" })).getAllByRole("tab").map((t) => t.textContent);
    expect(tabs).toEqual(["Keycloak", "Microsoft Entra ID", "Okta", "Google", "authentik", "ZITADEL", "OpenAsy Identity", "Another OpenID Connect provider"]);
    expect(screen.getByText("https://vpn.example.com/api/v1/auth/oidc/keycloak/callback")).toBeInTheDocument();
    const address = screen.getByLabelText("Your product's address");
    await userEvent.clear(address);
    await userEvent.type(address, "https://infra.acme.io/");
    expect(screen.getByText("https://infra.acme.io/api/v1/auth/oidc/keycloak/callback")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: "Google" }));
    expect(screen.getByText(/Google sends no groups/)).toBeInTheDocument();
    expect(screen.getByLabelText("Environment for Google")).toHaveTextContent("VPN_OIDC_ALLOWED_DOMAINS=example.com");
    expect(screen.getByRole("link", { name: "OpenAsy Identity" })).toHaveAttribute("href", "/products/identity");
  });

  it("a product being built shows what it will build on", () => {
    open("/products/identity");
    expect(screen.getByRole("heading", { name: "Being built now" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "oidc-provider" })).toBeInTheDocument();
  });

  it("a planned product shows no install steps", () => {
    open("/products/dast");
    expect(screen.getByText("Designed")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Not built yet" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Run it" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Will build on" })).toBeInTheDocument();
    expect(screen.queryByText(/docker compose up/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See the design" })).toBeInTheDocument();
  });

  it("products page lists released products first", () => {
    open("/products");
    expect(screen.getByRole("list", { name: "Product list" }).children[0]).toHaveTextContent("VPN");
  });

  it("the header leaves Support to the footer", () => {
    const Stub = createRoutesStub([{ path: "/", Component: () => (<><SiteHeader theme="system" onThemeChange={() => {}} /><SiteFooter /></>) }]);
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

  it("every decision record has a valid decision and implementation status", () => {
    expect(PRINCIPLES.length).toBeGreaterThanOrEqual(30);
    expect(new Set(PRINCIPLES.map((p) => p.n)).size).toBe(PRINCIPLES.length);
    for (const p of PRINCIPLES) {
      expect(p.decision).toMatch(/^(Proposed|Accepted|Superseded by \d{4})$/);
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
