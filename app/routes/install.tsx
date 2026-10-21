import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { Check, Copy, Download, RefreshCw } from "lucide-react";
import { Badge, Button, PRODUCT_IDS, PRODUCTS, SearchInput, SegmentedControl, Tabs, TextField, cn, type ProductGroup, type ProductId } from "@openasy/ui";
import { Section } from "../components/site";
import { DEFAULT_CHOICE, INSTALLABLE, buildInstall, cleanDomain, makeSecrets, type Installable, type InstallChoice, type Provider, type Proxy, type Secrets, type SignIn, type Upstream } from "../data/install";
import { statusFor } from "../data/status";
import { GROUPS } from "./home";

export function meta() {
  return [
    { title: "Install · OpenAsy" },
    { name: "description", content: "Pick OpenAsy products and how people sign in, and get one compose file, its .env and keys, in which the products already know each other." },
  ];
}

/** Until the page runs, so a prerendered page never shows a key someone else could copy. */
const PENDING = "made-when-the-page-loads";
const PLACEHOLDER: Secrets = { kek: PENDING, agentKek: PENDING, ingest: PENDING, keycloakDb: PENDING, keycloakAdmin: PENDING, clients: { identity: PENDING, vpn: PENDING, infrastructure: PENDING, vulnerabilities: PENDING } };

const KITS: Array<{ title: string; text: string; products: Installable[]; signIn: SignIn }> = [
  { title: "Remote access", text: "VPN with Identity", products: ["identity", "vpn"], signIn: "identity" },
  { title: "Know your servers", text: "Infrastructure and Vulnerabilities", products: ["infrastructure", "vulnerabilities"], signIn: "own" },
  { title: "Everything released", text: "All of them, one sign-in", products: [...INSTALLABLE], signIn: "identity" },
];

const SIGN_IN: Array<{ value: SignIn; title: string; text: string; badge?: string }> = [
  { value: "identity", title: "OpenAsy Identity", text: "One sign-in for every product, with MFA per group. Adds Identity if it is not picked.", badge: "Recommended" },
  { value: "keycloak", title: "Keycloak, ready for OpenAsy", text: "Keycloak and PostgreSQL, with a realm in which every product is already a client." },
  { value: "provider", title: "Your provider", text: "Microsoft Entra ID, Okta or Google, straight to each product." },
  { value: "own", title: "Each product on its own", text: "Passwords, passkeys and authenticator apps in each product." },
];
const UPSTREAMS: Array<{ value: Upstream; label: string }> = [
  { value: "none", label: "Identity itself" },
  { value: "keycloak", label: "Keycloak" },
  { value: "entra", label: "Entra ID" },
  { value: "okta", label: "Okta" },
  { value: "google", label: "Google" },
];
const UPSTREAM_HINT: Record<Upstream, string> = {
  none: "Passwords, passkeys and second factors kept in Identity. LDAP and Active Directory can be added later under Settings, Directories.",
  keycloak: "Adds the ready Keycloak. Identity signs people in through it and follows its groups.",
  entra: "Identity signs people in through Entra ID. SCIM can switch leavers off at once.",
  okta: "Identity signs people in through Okta. SCIM can switch leavers off at once.",
  google: "Identity signs people in through Google Workspace, for your domain only.",
};

const PROXIES: Array<{ value: Proxy; title: string; text: string; label: string }> = [
  { value: "caddy", label: "Caddy", title: "Caddy, in the compose file", text: "Adds Caddy on ports 80 and 443. It gets and renews the certificates from Let's Encrypt by itself." },
  { value: "nginx", label: "nginx", title: "nginx on this host", text: "Writes a site for each product. certbot adds HTTPS and renews it." },
  { value: "apache", label: "Apache", title: "Apache on this host", text: "Writes a virtual host for each product. certbot adds HTTPS and renews it." },
  { value: "own", label: "your proxy", title: "Another proxy", text: "Products listen on 127.0.0.1 only; point your proxy at the ports in Steps." },
];

const STEPS = ["Products", "Sign-in", "Options", "Addresses"] as const;
type Filter = "ready" | "all" | ProductGroup;

const installable = (id: string): id is Installable => (INSTALLABLE as readonly string[]).includes(id);

/** A radio drawn as a card; the native input keeps keyboard and screen reader behaviour. */
function Choice({ name, checked, onSelect, title, text, badge }: { name: string; checked: boolean; onSelect: () => void; title: string; text: string; badge?: string }) {
  return (
    <label className={cn("flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border bg-surface p-3", checked ? "border-accent bg-accent-soft/40 ring-1 ring-accent" : "border-line hover:border-line-strong")}>
      <input type="radio" name={name} checked={checked} onChange={onSelect} className="mt-1 size-4 accent-[var(--oa-accent)]" />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="flex flex-wrap items-center gap-2 font-semibold">
          {title}
          {badge && <Badge tone="success">{badge}</Badge>}
        </span>
        <span className="text-sm text-fg-muted">{text}</span>
      </span>
    </label>
  );
}

function Toggle({ checked, onChange, title, text }: { checked: boolean; onChange: (v: boolean) => void; title: string; text: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 py-1">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 size-4 accent-[var(--oa-accent)]" />
      <span className="flex flex-col">
        <span className="font-medium">{title}</span>
        <span className="text-sm text-fg-muted">{text}</span>
      </span>
    </label>
  );
}

function Options({ title, summary, children }: { title: string; summary: string; children: ReactNode }) {
  return (
    <details className="group rounded-lg border border-line bg-surface">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2 [&::-webkit-details-marker]:hidden">
        <span className="flex flex-col">
          <span className="font-semibold">{title}</span>
          <span className="text-xs text-fg-muted">{summary}</span>
        </span>
        <span aria-hidden className="text-fg-muted transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="border-t border-line px-4 py-3">{children}</div>
    </details>
  );
}

export default function InstallPage() {
  const [choice, setChoice] = useState<InstallChoice>(DEFAULT_CHOICE);
  const [secrets, setSecrets] = useState<Secrets>(PLACEHOLDER);
  const [step, setStep] = useState(0);
  const [filter, setFilter] = useState<Filter>("ready");
  const [query, setQuery] = useState("");
  const [file, setFile] = useState("compose.yaml");
  const [copied, setCopied] = useState(false);
  const set = (patch: Partial<InstallChoice>) => setChoice((c) => ({ ...c, ...patch }));
  const fresh = () => setSecrets(makeSecrets((b) => crypto.getRandomValues(b)));

  useEffect(() => {
    // Made here, after the page loads: secrets never come from the server or the prerendered HTML.
    fresh();
    // A link from a product or goal page picks its products: /install?products=vpn,identity
    const asked = new URLSearchParams(location.search).get("products")?.split(",").filter(installable);
    if (asked?.length) setChoice((c) => ({ ...c, products: asked, signIn: asked.includes("identity") ? "identity" : c.signIn === "identity" ? "own" : c.signIn }));
  }, []);

  const out = useMemo(() => buildInstall(choice, secrets), [choice, secrets]);
  const current = out.files.find((f) => f.name === file) ?? out.files[0]!;
  const picked = INSTALLABLE.filter((id) => choice.products.includes(id));
  const name = (id: string) => PRODUCTS[id as ProductId].name;

  const toggle = (id: Installable, on: boolean) => {
    const products = on ? [...choice.products, id] : choice.products.filter((p) => p !== id);
    // Without Identity, nobody can sign in through it.
    set({ products, ...(id === "identity" && !on && choice.signIn === "identity" ? { signIn: "own" as SignIn } : {}) });
  };
  const matches = (id: ProductId) => {
    const q = query.trim().toLowerCase();
    return !q || `${PRODUCTS[id].name} ${PRODUCTS[id].summary}`.toLowerCase().includes(q);
  };
  const inFilter = (id: ProductId, f: Filter) => (f === "all" ? true : f === "ready" ? installable(id) : PRODUCTS[id].group === f);
  const catalog = PRODUCT_IDS.filter((id) => inFilter(id, filter) && matches(id)).toSorted((a, b) => Number(installable(b)) - Number(installable(a)));
  const count = (f: Filter) => PRODUCT_IDS.filter((id) => inFilter(id, f)).length;

  const signInSummary =
    choice.signIn === "identity" ? `Identity${choice.upstream === "none" ? "" : ` with ${UPSTREAMS.find((u) => u.value === choice.upstream)!.label}`}` : choice.signIn === "keycloak" ? "Keycloak" : choice.signIn === "provider" ? UPSTREAMS.find((u) => u.value === choice.provider)!.label : "Each on its own";
  const summaries = [picked.length ? picked.map(name).join(", ") : "None yet", signInSummary, choice.prometheus ? "Prometheus" : "Defaults", `${cleanDomain(choice.domain)}, ${PROXIES.find((p) => p.value === choice.proxy)!.label}`];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(current.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // No clipboard (an insecure page or a denied permission): the text stays selectable.
    }
  };
  const download = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([`${current.content}\n`], { type: "text/plain" }));
    a.download = current.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <Section className="py-10" labelledBy="title">
      <h1 id="title" className="m-0 text-3xl font-semibold tracking-tight">
        Install
      </h1>
      <p className="mt-2 max-w-2xl text-base text-fg-muted">
        Pick your products and how people sign in. You get one compose file in which they already know each other: VPN signs in through Identity, Prometheus finds every product, and one key seals them all.
        Keys and secrets are made in your browser and never sent.
      </p>

      <div className="mt-8 flex flex-wrap items-start gap-6">
        <section aria-label="Your choices" className="min-w-0 flex-[1_1_28rem] overflow-hidden rounded-xl border border-line bg-surface">
          <ol aria-label="Steps" className="m-0 grid list-none grid-cols-2 border-b border-line p-0 sm:grid-cols-4">
            {STEPS.map((label, i) => (
              <li key={label} className="flex min-w-0">
                <button
                  type="button"
                  aria-current={step === i ? "step" : undefined}
                  onClick={() => setStep(i)}
                  className={cn("flex min-h-14 w-full min-w-0 items-center gap-2 px-3 py-2 text-left", step === i ? "bg-surface shadow-[inset_0_-2px_0_var(--oa-accent)]" : "bg-subtle hover:bg-surface")}
                >
                  <span aria-hidden className={cn("grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold", step === i ? "bg-accent text-accent-contrast" : i < step ? "bg-success-soft text-success" : "bg-line text-fg-muted")}>
                    {i < step ? <Check className="size-3.5" /> : i + 1}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-sm font-semibold">{label}</span>
                    <span className="truncate text-xs text-fg-muted">{summaries[i]}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>

          <div className="flex min-h-[30rem] flex-col gap-4 p-5">
            {step === 0 && (
              <>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-semibold">Start from a kit</span>
                  <div className="flex flex-wrap gap-2">
                    {KITS.map((k) => {
                      const on = k.products.length === picked.length && k.products.every((p) => picked.includes(p));
                      return (
                        <button
                          key={k.title}
                          type="button"
                          aria-pressed={on}
                          onClick={() => set({ products: k.products, signIn: k.signIn })}
                          className={cn("flex min-h-11 flex-col items-start rounded-lg border px-3 py-1.5 text-left", on ? "border-accent bg-accent-soft/40" : "border-line hover:border-line-strong")}
                        >
                          <span className="text-sm font-semibold">{k.title}</span>
                          <span className="text-xs text-fg-muted">{k.text}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <SearchInput label="Find a product" value={query} onChange={(e) => setQuery(e.target.value)} className="h-10" />
                  <SegmentedControl
                    label="Show"
                    className="max-w-full flex-wrap"
                    value={filter}
                    onChange={setFilter}
                    options={[
                      { value: "ready", label: `Ready to try (${count("ready")})` },
                      { value: "all", label: `All (${count("all")})` },
                      ...GROUPS.map((g) => ({ value: g.id as Filter, label: `${g.name} (${count(g.id)})` })),
                    ]}
                  />
                </div>
                <ul aria-label="Products" className="m-0 max-h-[22rem] list-none overflow-auto rounded-lg border border-line p-0">
                  {catalog.map((id) => {
                    const p = PRODUCTS[id];
                    if (!installable(id))
                      return (
                        <li key={id} className="flex min-h-12 items-center gap-3 border-b border-line px-4 py-2 last:border-b-0">
                          <span className="flex min-w-0 grow flex-col">
                            <span className="font-medium text-fg-muted">{p.name}</span>
                            <span className="truncate text-sm text-fg-subtle">{p.summary}</span>
                          </span>
                          <Badge>{statusFor(id).status === "In progress" ? "In progress" : "Coming"}</Badge>
                        </li>
                      );
                    const on = choice.products.includes(id);
                    return (
                      <li key={id} className="border-b border-line last:border-b-0">
                        <label className={cn("flex min-h-14 cursor-pointer items-center gap-3 px-4 py-2", on && "bg-accent-soft/40")}>
                          <input type="checkbox" checked={on} onChange={(e) => toggle(id, e.target.checked)} className="size-4 shrink-0 accent-[var(--oa-accent)]" />
                          <span className="flex min-w-0 grow flex-col">
                            <span className="font-semibold">
                              {p.name} <span className="font-mono text-xs font-normal text-fg-muted">{statusFor(id).version}</span>
                            </span>
                            <span className="truncate text-sm text-fg-muted">{p.summary}</span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
                {!catalog.length && <p className="m-0 text-sm text-fg-muted">No product matches. Try another word, or show all.</p>}
              </>
            )}

            {step === 1 && (
              <>
                <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
                  <legend className="mb-2 text-sm text-fg-muted">How people sign in to {picked.length ? picked.map(name).join(", ") : "your products"}.</legend>
                  {SIGN_IN.map((o) => (
                    <Choice
                      key={o.value}
                      name="sign-in"
                      checked={choice.signIn === o.value}
                      onSelect={() => set(o.value === "identity" ? { signIn: o.value, products: choice.products.includes("identity") ? choice.products : [...choice.products, "identity"] } : { signIn: o.value })}
                      title={o.title}
                      text={o.text}
                      badge={o.badge}
                    />
                  ))}
                </fieldset>
                {choice.signIn === "identity" && (
                  <div className="flex flex-col gap-2 rounded-lg bg-subtle p-4">
                    <SegmentedControl label="Where Identity's people come from" className="max-w-full flex-wrap" value={choice.upstream} onChange={(upstream) => set({ upstream })} options={UPSTREAMS} />
                    <span className="text-xs text-fg-muted">{UPSTREAM_HINT[choice.upstream]}</span>
                  </div>
                )}
                {choice.signIn === "provider" && (
                  <div className="flex flex-col gap-2 rounded-lg bg-subtle p-4">
                    <SegmentedControl<Provider> label="Your provider" className="max-w-full flex-wrap" value={choice.provider} onChange={(provider) => set({ provider })} options={UPSTREAMS.slice(2) as Array<{ value: Provider; label: string }>} />
                    <span className="text-xs text-fg-muted">
                      The <Link to="/sign-in">sign-in guide</Link> shows what to register at {UPSTREAMS.find((u) => u.value === choice.provider)!.label}.
                    </span>
                  </div>
                )}
              </>
            )}

            {step === 2 && (
              <>
                <p className="m-0 text-sm text-fg-muted">Only the products you picked. Each is set up well already: change only what you need.</p>
                {choice.products.includes("vpn") && (
                  <Options title="VPN" summary={choice.vpnTcp ? "UDP 1194 and TCP" : "UDP 1194"}>
                    <Toggle checked={choice.vpnTcp} onChange={(vpnTcp) => set({ vpnTcp })} title="Also on TCP" text="A second vpn-server on TCP 443, for networks that allow only HTTPS. It is slower than UDP." />
                  </Options>
                )}
                {choice.products.includes("vulnerabilities") && (
                  <Options title="Vulnerabilities" summary={choice.vulnsHost ? "Scans this host too" : "Only other hosts"}>
                    <Toggle checked={choice.vulnsHost} onChange={(vulnsHost) => set({ vulnsHost })} title="Scan this host" text="Adds vulns-agent here. Other hosts and clusters get their own agent later." />
                  </Options>
                )}
                <Options title="Extras" summary={choice.prometheus ? "Prometheus" : "None"}>
                  <Toggle checked={choice.prometheus} onChange={(prometheus) => set({ prometheus })} title="Prometheus for metrics" text="Scrapes /metrics of every product you picked, until OpenAsy Metrics ships." />
                </Options>
              </>
            )}

            {step === 3 && (
              <>
                <TextField label="Domain" mono value={choice.domain} onChange={(e) => set({ domain: e.target.value })} hint={out.addresses.length ? `Addresses: ${out.addresses.join(", ")}` : "Each product gets a name under it."} spellCheck={false} autoComplete="off" />
                <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
                  <legend className="mb-2 text-sm font-semibold">HTTPS</legend>
                  {PROXIES.map((o) => (
                    <Choice key={o.value} name="proxy" checked={choice.proxy === o.value} onSelect={() => set({ proxy: o.value })} title={o.title} text={o.text} />
                  ))}
                </fieldset>
              </>
            )}

            <div className="mt-auto flex gap-2 pt-2">
              {step > 0 && (
                <Button onClick={() => setStep(step - 1)}>
                  Back
                </Button>
              )}
              {step < STEPS.length - 1 && (
                <Button variant="primary" className="ml-auto" onClick={() => setStep(step + 1)}>
                  Next: {STEPS[step + 1]!.toLowerCase()}
                </Button>
              )}
            </div>
          </div>
        </section>

        <section aria-label="Your setup" className="flex min-w-0 flex-[1.25_1_34rem] flex-col gap-4">
          <div className="rounded-xl border border-line bg-surface p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="m-0 text-lg font-semibold">How it fits together</h2>
              <span className="text-sm text-fg-muted">{out.services.length} services</span>
            </div>
            <ul aria-label="How it fits together" className="mt-3 mb-0 flex list-none flex-col gap-2 p-0 text-sm">
              {out.wiring.length ? (
                out.wiring.map((w) => (
                  <li key={w.title}>
                    <span className="font-semibold">{w.title}</span> <span className="text-fg-muted">{w.text}</span>
                  </li>
                ))
              ) : (
                <li className="text-fg-muted">Pick a product or a kit to begin.</li>
              )}
            </ul>
          </div>

          <div className="overflow-hidden rounded-xl border border-line bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 pt-1">
              <Tabs label="Files" value={file === "steps" ? "steps" : current.name} onChange={setFile} items={[...out.files.map((f) => ({ value: f.name, label: f.name })), { value: "steps", label: "Steps" }]} />
              {file !== "steps" && (
                <div className="flex gap-2 pb-1">
                  <Button icon={copied ? <Check /> : <Copy />} onClick={copy}>
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button variant="primary" icon={<Download />} onClick={download}>
                    Download {current.name}
                  </Button>
                </div>
              )}
            </div>
            {file === "steps" ? (
              <ol aria-label="Steps to start" className="m-0 flex flex-col gap-4 p-5 pl-10">
                {out.steps.map((s) => (
                  <li key={s.text}>
                    {s.text}
                    {s.code && (
                      <pre className="mt-2 mb-0 overflow-x-auto rounded-md bg-subtle p-3 font-mono text-xs leading-5">
                        <code>{s.code}</code>
                      </pre>
                    )}
                  </li>
                ))}
                {!out.steps.length && <li className="text-fg-muted">Pick a product first.</li>}
              </ol>
            ) : (
              <pre tabIndex={0} aria-label={current.name} className="m-0 max-h-[36rem] overflow-auto p-4 font-mono text-xs leading-5 text-fg">
                <code>{current.content}</code>
              </pre>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="m-0 flex-[1_1_18rem] text-xs text-fg-muted">Keys and secrets are made in this browser with crypto.getRandomValues and never sent. Nothing is kept after you leave.</p>
            <Button icon={<RefreshCw />} onClick={fresh}>
              Make new secrets
            </Button>
          </div>
        </section>
      </div>
    </Section>
  );
}
