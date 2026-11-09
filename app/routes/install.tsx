import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { AlertTriangle, FolderDown, RefreshCw, Upload, X } from "lucide-react";
import { Button, PRODUCTS, SegmentedControl, TextField, cn } from "@openasy/ui";
import { PageTitle, Section } from "../components/site";
import {
  CERTIFICATES,
  Choice,
  EXISTING,
  Files,
  Options,
  PENDING,
  PLACEHOLDER,
  PROXIES,
  Part,
  SIGN_IN,
  Steps,
  Toggle,
  UPSTREAMS,
  UPSTREAM_HINT,
  downloadZip,
  type Picture,
  type Pictures,
} from "../components/setup";
import {
  DEFAULT_CHOICE,
  INSTALLABLE,
  FAVICON_MAX_BYTES,
  FAVICON_TYPES,
  LOGO_MAX_BYTES,
  LOGO_TYPES,
  buildInstall,
  cleanAccent,
  cleanOrganization,
  makeSecrets,
  type Install,
  type Installable,
  type InstallChoice,
  type Provider,
  type Secrets,
  type SignIn,
} from "../data/install";
import { DEV_EMAIL, DEV_FOLDER, DEV_NETWORK_DOMAIN, DEV_PASSWORD, buildDevKit } from "../data/devkit";
import { statusFor } from "../data/status";

export function meta() {
  return [
    { title: "Install · OpenAsy" },
    {
      name: "description",
      content:
        "Try every released OpenAsy product on your machine, or pick the ones you need and how people sign in for production. You get one folder in which the products already know each other.",
    },
  ];
}

type Mode = "dev" | "prod";

const installable = (id: string): id is Installable => (INSTALLABLE as readonly string[]).includes(id);

const COUNT = ["Zero", "One", "Two", "Three", "Four", "Five"];

/** Every released product on this machine: only where it is opened from to choose, one folder and one command. */
function TryLocally({
  out,
  ready,
  network,
  onNetwork,
}: {
  out: Install;
  ready: boolean;
  /** The domain the products are named under for the other computers on the network; null keeps them on this one. */
  network: string | null;
  onNetwork: (network: string | null) => void;
}) {
  return (
    <>
      <section aria-labelledby="dev-title" className="mt-6 flex flex-wrap overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="flex min-w-0 flex-[999_1_32rem] flex-col gap-5 p-6 sm:p-9">
          <div>
            <p className="m-0 text-xs font-semibold tracking-wider text-accent uppercase">Five minutes, one command</p>
            <h2 id="dev-title" className="mt-2 mb-0 text-2xl font-semibold tracking-tight">
              Every released product, running on your machine
            </h2>
            <p className="mt-2 mb-0 max-w-xl text-fg-muted">
              Every product signs in through Identity. A VPN server, two agents reading demo servers, and every scanner ready for your CI, wired together for
              you. Docker is all it needs.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <SegmentedControl
              label="Opened from"
              className="max-w-full flex-wrap"
              value={network === null ? "here" : "network"}
              onChange={(v) => onNetwork(v === "here" ? null : DEV_NETWORK_DOMAIN)}
              options={[
                { value: "here", label: "This computer" },
                { value: "network", label: "Other computers too" },
              ]}
            />
            {network !== null && (
              <TextField
                label="Domain"
                mono
                value={network}
                onChange={(e) => onNetwork(e.target.value)}
                hint={`Names such as ${out.addresses[0]?.replace(/^https:\/\//, "")}, which each computer finds in its hosts file. Run it on a computer that stays on, and open it from your laptop.`}
                spellCheck={false}
                autoComplete="off"
              />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" icon={<FolderDown />} onClick={() => downloadZip(out, DEV_FOLDER)} disabled={!ready}>
              Download {DEV_FOLDER}.zip
            </Button>
            <span className="text-sm text-fg-subtle">{out.files.length} files, made in your browser</span>
          </div>
        </div>
        <div aria-hidden className="flex min-w-0 flex-[1_1_22rem] flex-col gap-3 bg-[#0f1724] p-7 font-mono text-[13px] leading-7 text-[#e8eef7]">
          <span className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-[#3c4e72]" />
            <span className="size-2.5 rounded-full bg-[#3c4e72]" />
            <span className="size-2.5 rounded-full bg-[#3c4e72]" />
          </span>
          <span>
            <span className="text-[#93a2bd]">$</span> cd {DEV_FOLDER}
            <br />
            <span className="text-[#93a2bd]">$</span> docker compose up -d
            <br />
            <span className="text-[#93a2bd]">$</span> docker compose logs -f setup
          </span>
          <span className="text-[#93a2bd]">
            ▸ Owners
            <br />▸ Identity: groups and applications
            <br />▸ Infrastructure: the two servers
          </span>
          <span className="text-[#4cc38a]">Ready. Open {out.addresses[0]}</span>
        </div>
      </section>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="dev-steps" className="rounded-xl border border-line bg-surface p-6 sm:p-8">
          <h2 id="dev-steps" className="mt-0 mb-5 text-lg font-semibold">
            {COUNT[out.steps.length]} steps
          </h2>
          <Steps steps={out.steps} />
          {out.more && (
            <details className="group mt-6 border-t border-line pt-4">
              <summary className="cursor-pointer text-sm font-semibold text-fg-muted">More: trust the local CA, stop, start over</summary>
              <div className="mt-5">
                <Steps steps={out.more} label="More steps" />
              </div>
            </details>
          )}
        </section>

        <aside className="flex flex-col gap-4">
          <section aria-labelledby="dev-sign-in" className="rounded-xl border border-line bg-surface p-5">
            <h2 id="dev-sign-in" className="m-0 text-base font-semibold">
              Sign in with
            </h2>
            <dl className="mt-3 mb-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              <dt className="text-fg-subtle">Email</dt>
              <dd className="m-0 font-mono text-[13px]">{DEV_EMAIL}</dd>
              <dt className="text-fg-subtle">Password</dt>
              <dd className="m-0 font-mono text-[13px]">{DEV_PASSWORD}</dd>
            </dl>
          </section>
          <section aria-labelledby="dev-included" className="rounded-xl border border-line bg-surface p-5">
            <h2 id="dev-included" className="m-0 text-base font-semibold">
              Included
            </h2>
            <ul aria-label="Products in the dev setup" className="mt-3 mb-0 flex list-none flex-col gap-2 p-0 text-sm">
              {INSTALLABLE.map((id) => (
                <li key={id} className="flex items-center justify-between gap-3">
                  <span>{PRODUCTS[id].name}</span>
                  <span className="font-mono text-xs text-fg-subtle">{statusFor(id).version}</span>
                </li>
              ))}
              <li className="border-t border-subtle pt-2 text-fg-subtle">Two demo servers, Caddy, Prometheus</li>
            </ul>
            <p className="mt-3 mb-0 text-sm text-fg-subtle">
              Other products join once released. <Link to="/products">See every product</Link>
            </p>
          </section>
          <p className="m-0 flex gap-2.5 rounded-xl bg-warning-soft p-4 text-sm text-fg">
            <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" />
            <span>For trying only: one shared password and a local certificate. For a server, use Production.</span>
          </p>
        </aside>
      </div>

      <section aria-labelledby="dev-files" className="mt-10">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="dev-files" className="m-0 text-lg font-semibold">
            What is in the folder
          </h2>
          <span className="text-sm text-fg-subtle">Read, copy or download any file</span>
        </div>
        <Files out={out} folder={DEV_FOLDER} />
      </section>
    </>
  );
}

/** Picks one picture for the brand; it stays in this browser until it goes into the zip. */
function PicturePicker({
  label,
  base,
  types,
  max,
  kinds,
  hint,
  value,
  onChange,
}: {
  label: string;
  base: string;
  types: Record<string, string>;
  max: number;
  kinds: string;
  hint: string;
  value: Picture | null;
  onChange: (p: Picture | null) => void;
}) {
  const [error, setError] = useState("");
  const pick = async (f: File | undefined) => {
    setError("");
    if (!f) return;
    const ext = types[f.type];
    if (!ext) return setError(`Pick ${kinds}.`);
    if (f.size > max) return setError(`Pick a file of ${max / 1024} KB or less.`);
    const bytes = new Uint8Array(await f.arrayBuffer());
    if (value) URL.revokeObjectURL(value.url);
    onChange({ name: `${base}.${ext}`, type: f.type, bytes, url: URL.createObjectURL(new Blob([bytes], { type: f.type })) });
  };
  const remove = () => {
    if (value) URL.revokeObjectURL(value.url);
    onChange(null);
  };
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid h-12 min-w-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-subtle px-2">
          {value ? (
            <img src={value.url} alt={`Your ${label.toLowerCase()}`} className="h-8 w-auto max-w-40 object-contain" />
          ) : (
            <span className="text-2xs text-fg-subtle">None</span>
          )}
        </span>
        <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md border border-line bg-surface px-3 text-sm font-medium focus-within:ring-2 focus-within:ring-accent hover:border-line-strong">
          <Upload aria-hidden className="size-4" />
          {value ? "Pick another" : "Pick a file"}
          <input
            type="file"
            accept={Object.keys(types).join(",")}
            aria-label={`${label}: pick a file`}
            className="sr-only"
            onChange={(e) => {
              void pick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        {value && (
          <Button icon={<X />} onClick={remove} aria-label={`Remove the ${label.toLowerCase()}`}>
            Remove
          </Button>
        )}
      </div>
      <span className={cn("text-xs", error ? "text-danger" : "text-fg-muted")} role={error ? "alert" : undefined}>
        {error || `${hint} It stays in this browser until it goes into the zip.`}
      </span>
    </div>
  );
}

export default function InstallPage() {
  const [mode, setMode] = useState<Mode>("dev");
  const [choice, setChoice] = useState<InstallChoice>(DEFAULT_CHOICE);
  const [secrets, setSecrets] = useState<Secrets>(PLACEHOLDER);
  // The pictures stay in this page: they go into the zip and nowhere else.
  const [logo, setLogo] = useState<Picture | null>(null);
  const [favicon, setFavicon] = useState<Picture | null>(null);
  const set = (patch: Partial<InstallChoice>) => setChoice((c) => ({ ...c, ...patch }));
  const fresh = () => setSecrets(makeSecrets((b) => crypto.getRandomValues(b)));

  useEffect(() => {
    // Made here, after the page loads: secrets never come from the server or the prerendered HTML.
    fresh();
    // A link from a product or goal page picks its products: /install?products=vpn,identity
    const asked = new URLSearchParams(location.search).get("products")?.split(",").filter(installable);
    if (asked?.length) {
      setMode("prod");
      setChoice((c) => ({ ...c, products: asked, signIn: asked.includes("identity") ? "identity" : c.signIn === "identity" ? "own" : c.signIn }));
    }
  }, []);

  const out = useMemo(() => buildInstall(choice, secrets), [choice, secrets]);
  const [network, setNetwork] = useState<string | null>(null);
  const dev = useMemo(() => buildDevKit(secrets, network ?? undefined), [secrets, network]);
  const ready = secrets.kek !== PENDING;
  const has = (id: Installable) => choice.products.includes(id);

  const toggle = (id: Installable, on: boolean) => {
    const products = on ? [...choice.products, id] : choice.products.filter((p) => p !== id);
    // Without Identity, nobody can sign in through it.
    set({ products, ...(id === "identity" && !on && choice.signIn === "identity" ? { signIn: "own" as SignIn } : {}) });
  };
  const brandSummary = [cleanOrganization(choice.organization), choice.logo && "logo", choice.favicon && "tab icon", cleanAccent(choice.accent) && "color"]
    .filter(Boolean)
    .join(", ");
  const pictures: Pictures = Object.fromEntries([logo, favicon].filter((p) => p !== null).map((p) => [`brand/${p.name}`, p]));

  return (
    <Section className="py-12" labelledBy="title">
      <PageTitle title="Install">
        Try every released product on your machine, or set up the ones you need for production, from released images only. Either way you get one folder in
        which the products already know each other, and its keys are made in your browser and never sent.
      </PageTitle>

      <SegmentedControl
        label="Where it runs"
        size="md"
        className="mt-6"
        value={mode}
        onChange={setMode}
        options={[
          { value: "dev", label: "Try it locally" },
          { value: "prod", label: "Production" },
        ]}
      />

      {mode === "dev" ? (
        <TryLocally out={dev} ready={ready} network={network} onNetwork={setNetwork} />
      ) : (
        <>
          <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="flex min-w-0 flex-col gap-6">
              <Part
                n={1}
                title="Products"
                hint={
                  <>
                    Only released products can be installed. <Link to="/products">See what is coming</Link>.
                  </>
                }
              >
                <div role="group" aria-label="Products" className="grid gap-3 sm:grid-cols-2">
                  {INSTALLABLE.map((id) => (
                    <Choice
                      key={id}
                      type="checkbox"
                      name="product"
                      checked={has(id)}
                      onChange={(on) => toggle(id, on)}
                      title={
                        <>
                          {PRODUCTS[id].name} <span className="font-mono text-xs font-normal text-fg-muted">{statusFor(id).version}</span>
                        </>
                      }
                      text={PRODUCTS[id].summary}
                    />
                  ))}
                </div>
              </Part>

              <Part n={2} title="Sign-in" hint="How people sign in to the products you picked.">
                <div role="radiogroup" aria-label="Sign-in" className="grid gap-3 sm:grid-cols-2">
                  {SIGN_IN.map((o) => (
                    <Choice
                      key={o.value}
                      name="sign-in"
                      checked={choice.signIn === o.value}
                      onChange={() =>
                        set(
                          o.value === "identity"
                            ? { signIn: o.value, products: has("identity") ? choice.products : [...choice.products, "identity"] }
                            : { signIn: o.value },
                        )
                      }
                      title={o.title}
                      text={o.text}
                      badge={o.badge}
                    />
                  ))}
                </div>
                {choice.signIn === "identity" && (
                  <div className="flex flex-col gap-2 rounded-lg bg-subtle p-4">
                    <SegmentedControl
                      label="Where Identity's people come from"
                      className="max-w-full flex-wrap"
                      value={choice.upstream}
                      onChange={(upstream) => set({ upstream })}
                      options={UPSTREAMS}
                    />
                    <span className="text-xs text-fg-muted">{UPSTREAM_HINT[choice.upstream]}</span>
                  </div>
                )}
                {choice.signIn === "provider" && (
                  <div className="flex flex-col gap-2 rounded-lg bg-subtle p-4">
                    <SegmentedControl<Provider>
                      label="Your provider"
                      className="max-w-full flex-wrap"
                      value={choice.provider}
                      onChange={(provider) => set({ provider })}
                      options={UPSTREAMS.slice(2) as Array<{ value: Provider; label: string }>}
                    />
                    <span className="text-xs text-fg-muted">
                      The <Link to="/sign-in">sign-in guide</Link> shows what to register at {UPSTREAMS.find((u) => u.value === choice.provider)!.label}.
                    </span>
                  </div>
                )}
                {choice.signIn === "existing" && (
                  <div className="flex flex-col gap-3 rounded-lg bg-subtle p-4">
                    <SegmentedControl label="Which one" value={choice.existing} onChange={(existing) => set({ existing })} options={EXISTING} />
                    <TextField
                      label={choice.existing === "keycloak" ? "Its realm's address" : "Its address"}
                      mono
                      value={choice.issuer}
                      onChange={(e) => set({ issuer: e.target.value })}
                      placeholder={choice.existing === "keycloak" ? "https://auth.example.com/realms/openasy" : "https://id.example.com"}
                      hint="The issuer: the address people sign in at, as the products will reach it."
                      spellCheck={false}
                      autoComplete="off"
                    />
                  </div>
                )}
              </Part>

              <Part n={3} title="Address and HTTPS">
                <TextField
                  label="Domain"
                  mono
                  value={choice.domain}
                  onChange={(e) => set({ domain: e.target.value })}
                  hint={out.addresses.length ? `Addresses: ${out.addresses.join(", ")}` : "Each product gets a name under it."}
                  spellCheck={false}
                  autoComplete="off"
                />
                <div role="radiogroup" aria-label="HTTPS" className="grid gap-3 sm:grid-cols-2">
                  {PROXIES.map((o) => (
                    <Choice
                      key={o.value}
                      name="proxy"
                      checked={choice.proxy === o.value}
                      onChange={() => set({ proxy: o.value })}
                      title={o.title}
                      text={o.text}
                    />
                  ))}
                </div>
                {choice.proxy === "caddy" && (
                  <div role="radiogroup" aria-label="Certificates" className="grid gap-3 sm:grid-cols-2">
                    {CERTIFICATES.map((o) => (
                      <Choice
                        key={o.value}
                        name="certificates"
                        checked={choice.certificates === o.value}
                        onChange={() => set({ certificates: o.value })}
                        title={o.title}
                        text={o.text}
                      />
                    ))}
                  </div>
                )}
              </Part>

              <Part n={4} title="Options" hint="Each is set up well already: change only what you need.">
                <Options title="Your brand" summary={brandSummary || "OpenAsy's own"}>
                  <div className="flex flex-col gap-4">
                    <p className="m-0 text-sm text-fg-muted">
                      Every product loads it from openasy.env, a file every product shares, so you see and change it in one place.
                    </p>
                    <TextField
                      label="Organization"
                      value={choice.organization}
                      onChange={(e) => set({ organization: e.target.value })}
                      hint="Under each product's name, such as your company. Empty leaves the line out."
                      maxLength={64}
                      autoComplete="organization"
                    />
                    <PicturePicker
                      label="Logo"
                      base="logo"
                      types={LOGO_TYPES}
                      max={LOGO_MAX_BYTES}
                      kinds="an SVG, PNG or WebP file"
                      hint="In its own shape: SVG, PNG or WebP, up to 512 KB. Shown at a fixed height in place of the OpenAsy mark."
                      value={logo}
                      onChange={(p) => {
                        setLogo(p);
                        set({ logo: p?.name ?? null });
                      }}
                    />
                    <PicturePicker
                      label="Tab icon"
                      base="favicon"
                      types={FAVICON_TYPES}
                      max={FAVICON_MAX_BYTES}
                      kinds="an SVG, PNG or ICO file"
                      hint="The browser tab's icon: a square SVG, PNG or ICO, up to 128 KB. Without one, each product keeps its own."
                      value={favicon}
                      onChange={(p) => {
                        setFavicon(p);
                        set({ favicon: p?.name ?? null });
                      }}
                    />
                    <div className="flex flex-wrap items-end gap-3">
                      <TextField
                        label="Color"
                        mono
                        value={choice.accent}
                        onChange={(e) => set({ accent: e.target.value })}
                        placeholder="#0a66c2"
                        hint={choice.accent && !cleanAccent(choice.accent) ? "A color as #rrggbb." : "Buttons and links. Empty keeps OpenAsy's blue."}
                        className="w-40"
                        spellCheck={false}
                        autoComplete="off"
                      />
                      <input
                        type="color"
                        aria-label="Pick a color"
                        value={cleanAccent(choice.accent) || "#2f5bd3"}
                        onChange={(e) => set({ accent: e.target.value })}
                        className="mb-6 h-10 w-12 cursor-pointer rounded-md border border-line bg-surface p-1"
                      />
                    </div>
                  </div>
                </Options>
                {has("vpn") && (
                  <Options title="VPN" summary={choice.vpnTcp ? "UDP 1194 and TCP" : "UDP 1194"}>
                    <Toggle
                      checked={choice.vpnTcp}
                      onChange={(vpnTcp) => set({ vpnTcp })}
                      title="Also on TCP"
                      text="A second vpn-server on TCP 443, for networks that allow only HTTPS. It is slower than UDP."
                    />
                  </Options>
                )}
                {has("vulnerabilities") && (
                  <Options title="Vulnerabilities" summary={choice.vulnsHost ? "Scans this host too" : "Only other hosts"}>
                    <Toggle
                      checked={choice.vulnsHost}
                      onChange={(vulnsHost) => set({ vulnsHost })}
                      title="Scan this host"
                      text="Adds vulns-agent here. Other hosts and clusters get their own agent later."
                    />
                  </Options>
                )}
                <Options title="Metrics" summary={choice.prometheus ? "Prometheus" : "None"}>
                  <Toggle
                    checked={choice.prometheus}
                    onChange={(prometheus) => set({ prometheus })}
                    title="Prometheus for metrics"
                    text="Scrapes /metrics of every product you picked, until OpenAsy Metrics ships."
                  />
                </Options>
              </Part>
            </div>

            <aside aria-label="Your setup" className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5 lg:sticky lg:top-20">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="m-0 text-lg font-semibold">Your setup</h2>
                <span className="text-sm text-fg-muted">{out.services.length} services</span>
              </div>
              <ul aria-label="How it fits together" className="m-0 flex list-none flex-col gap-2 p-0 text-sm">
                {out.wiring.length ? (
                  out.wiring.map((w) => (
                    <li key={w.title}>
                      <span className="font-semibold">{w.title}</span> <span className="text-fg-muted">{w.text}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-fg-muted">Pick a product to begin.</li>
                )}
              </ul>
              <Button
                variant="primary"
                icon={<FolderDown />}
                onClick={() => downloadZip(out, "openasy", pictures)}
                disabled={!choice.products.length || !ready}
              >
                Download openasy.zip
              </Button>
              <button type="button" onClick={fresh} className="inline-flex items-center gap-1.5 self-start text-xs text-fg-muted hover:text-fg">
                <RefreshCw aria-hidden className="size-3.5" />
                Make new secrets
              </button>
            </aside>
          </div>

          <section aria-labelledby="prod-steps" className="mt-10 rounded-xl border border-line bg-surface p-6 sm:p-8">
            <h2 id="prod-steps" className="mt-0 mb-5 text-lg font-semibold">
              Steps to start
            </h2>
            <Steps steps={out.steps} empty="Pick a product first." />
          </section>
          <section aria-labelledby="prod-files" className="mt-10">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
              <h2 id="prod-files" className="m-0 text-lg font-semibold">
                What is in the folder
              </h2>
              <span className="text-sm text-fg-subtle">Read, copy or download any file</span>
            </div>
            <Files out={out} folder="openasy" pictures={pictures} />
          </section>
        </>
      )}

      <p className="mt-8 mb-0 text-xs text-fg-muted">
        Keys and secrets are made in this browser with crypto.getRandomValues and never sent. Nothing is kept after you leave.
      </p>
    </Section>
  );
}
