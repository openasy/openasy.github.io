import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub } from "react-router";
import { describe, expect, it } from "vitest";
import { PRODUCT_IDS, type ProductId } from "@openasy/ui";
import { GOALS } from "./data/goals";
import { PRINCIPLES } from "./data/principles";
import { storyUrl } from "./data/storybook";
import { composeFor } from "./components/cards";
import { SiteFooter, SiteHeader } from "./components/site";
import { BREACH_STORY, PRESETS, coverage } from "./components/breach";
import Home from "./routes/home";
import Goals from "./routes/goals";
import GoalPage from "./routes/goal";
import Products from "./routes/products";
import ProductPage from "./routes/product";
import ProductApi from "./routes/product-api";
import { APIS } from "./data/apis";
import Principles from "./routes/principles";
import Support from "./routes/support";
import { PLANS, SUPPORT_EMAIL } from "./data/support";

const Stub = createRoutesStub([
  { path: "/", Component: Home },
  { path: "/goals", Component: Goals },
  { path: "/goals/:id", Component: GoalPage },
  { path: "/products", Component: Products },
  { path: "/products/:id", Component: ProductPage },
  { path: "/products/:id/api", Component: ProductApi },
  { path: "/principles", Component: Principles },
  { path: "/support", Component: Support },
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

  it("links each product to its Storybook screens", () => {
    expect(storyUrl("Network IDS")).toBe("https://openasy.github.io/ui/?path=/story/products-network-ids--alerts");
    expect(storyUrl("SAST")).toContain("--pull-requests");
  });

  it("builds one service and one volume per product", () => {
    const yaml = composeFor(["vpn", "logs"]);
    expect(yaml).toContain("image: ghcr.io/openasy/vpn-manager:1");
    expect(yaml).toContain("image: ghcr.io/openasy/vpn-server:1");
    expect(yaml).toContain('"1194:1194/udp"');
    expect(yaml).toContain("logs-data:/data");
  });
});

describe("pages", () => {
  it("home lists every goal and every product", () => {
    open("/");
    expect(h1()).toHaveTextContent("Run and secure your infrastructure");
    for (const g of GOALS) expect(screen.getAllByRole("link", { name: new RegExp(g.title) }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /OpenVPN server/ })).toHaveLength(1);
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
    expect(screen.getByLabelText(/Code for step 1/)).toHaveTextContent("image: ghcr.io/openasy/vpn-manager:1");
    expect(screen.getByLabelText(/Code for step 1/)).not.toHaveTextContent("openasy/identity");
  });

  it("products page filters by group", async () => {
    open("/products");
    const list = () => screen.getByRole("list", { name: "Product list" });
    expect(list().children).toHaveLength(PRODUCT_IDS.length);
    await userEvent.click(screen.getByRole("radio", { name: "Identity" }));
    expect(list().children).toHaveLength(1);
  });

  it("product page shows its goals", () => {
    open("/products/backups");
    expect(h1()).toHaveTextContent("Backups");
    expect(screen.getByRole("link", { name: "Notice data loss" })).toHaveAttribute("href", "/goals/data-loss");
  });

  it("home shows breach coverage that follows what you run", async () => {
    open("/");
    const stages = screen.getByRole("list", { name: "ATT&CK stages" });
    expect(stages.children).toHaveLength(12);
    const count = (text: string) => screen.getByText((_, el) => el?.tagName === "P" && el.textContent?.startsWith(text) === true);
    expect(count(`${coverage(PRESETS.starter.products).covered} of 12`)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("radio", { name: "VPN only" }));
    expect(count("1 of 12")).toBeInTheDocument();
    expect(screen.getByRole("listitem", { name: /Initial access: covered by VPN/ })).toBeInTheDocument();
    expect(screen.getByRole("listitem", { name: "Execution: not covered" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("radio", { name: "Everything" }));
    expect(count("12 of 12")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Replay the attack step by step" })).toHaveAttribute("href", BREACH_STORY);
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

  it("the header leaves Support to the footer", () => {
    const Stub = createRoutesStub([{ path: "/", Component: () => (<><SiteHeader theme="system" onThemeChange={() => {}} /><SiteFooter /></>) }]);
    render(<Stub initialEntries={["/"]} />);
    expect(screen.getByRole("navigation", { name: "Main" })).not.toHaveTextContent("Support");
    expect(screen.getByRole("navigation", { name: "Footer" })).toHaveTextContent("Support");
  });

  it("principles link to their records, accepted and proposed apart", () => {
    open("/principles");
    expect(screen.getAllByRole("link", { name: /^Read the record:/ })).toHaveLength(PRINCIPLES.length);
    const accepted = PRINCIPLES.filter((p) => p.decision === "Accepted").length;
    expect(screen.getByRole("list", { name: "Accepted decisions" }).children).toHaveLength(accepted);
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

  it("home and every guide point to support", () => {
    open("/");
    expect(screen.getByRole("link", { name: "See support plans" })).toHaveAttribute("href", "/support");
  });
});
