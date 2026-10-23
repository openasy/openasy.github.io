import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { AlertTriangle, Check, Copy, Download, FileCode, FileCog, FileImage, FileKey, FileText, Folder, FolderDown, FolderOpen, RefreshCw, Upload, X } from "lucide-react";
import { Badge, Button, PRODUCTS, SegmentedControl, TextField, cn } from "@openasy/ui";
import { PageTitle, Section } from "../components/site";
import { DEFAULT_CHOICE, INSTALLABLE, LOGO_MAX_BYTES, PARTS, LOGO_TYPES, buildInstall, cleanAccent, cleanOrganization, makeSecrets, type Install, type InstallFile, type Installable, type InstallChoice, type InstallStep, type Provider, type Proxy, type Secrets, type SignIn, type Upstream } from "../data/install";
import { DEV_EMAIL, DEV_FOLDER, DEV_PASSWORD, buildDevKit } from "../data/devkit";
import { highlight, languageOf, type Kind } from "../data/highlight";
import { statusFor } from "../data/status";
import { zip } from "../data/zip";

export function meta() {
  return [
    { title: "Install · OpenAsy" },
    { name: "description", content: "Try every released OpenAsy product on your machine, or pick the ones you need and how people sign in for production. You get one folder in which the products already know each other." },
  ];
}

/** Until the page runs, so a prerendered page never shows a key someone else could copy. */
const PENDING = "made-when-the-page-loads";
const PLACEHOLDER: Secrets = { kek: PENDING, agentKek: PENDING, logsAgentKek: PENDING, ingest: PENDING, tokens: {}, keycloakDb: PENDING, keycloakAdmin: PENDING, clients: { identity: PENDING, vpn: PENDING, infrastructure: PENDING, vulnerabilities: PENDING } };

type Mode = "dev" | "prod";

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

const PROXIES: Array<{ value: Proxy; title: string; text: string }> = [
  { value: "caddy", title: "Caddy, in the compose file", text: "Gets and renews the certificates from Let's Encrypt by itself." },
  { value: "nginx", title: "nginx on this host", text: "A site for each product; certbot adds HTTPS." },
  { value: "apache", title: "Apache on this host", text: "A virtual host for each product; certbot adds HTTPS." },
  { value: "own", title: "Another proxy", text: "Products listen on 127.0.0.1; point your proxy at them." },
];

const installable = (id: string): id is Installable => (INSTALLABLE as readonly string[]).includes(id);

type Logo = { name: string; type: string; bytes: Uint8Array<ArrayBuffer>; url: string };

function save(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** A file as the person saves it: text with a trailing newline, the logo as its bytes. */
const bytesOf = (f: InstallFile, logo?: Logo | null) => (f.binary && logo ? logo.bytes : new TextEncoder().encode(`${f.content}\n`));
const downloadZip = (out: Install, folder: string, logo?: Logo | null) => save(new Blob([zip(out.files.map((f) => ({ name: f.name, content: bytesOf(f, logo) })), folder)], { type: "application/zip" }), `${folder}.zip`);

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // No clipboard (an insecure page or a denied permission): the text stays selectable.
    }
  };
  return (
    <Button icon={copied ? <Check /> : <Copy />} onClick={copy} aria-label={label}>
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

/** A command with its own copy button. */
function Command({ code }: { code: string }) {
  return (
    <div className="mt-2 flex items-start gap-2 rounded-lg border border-line bg-subtle p-1.5 pl-3">
      <pre className="m-0 min-w-0 grow overflow-x-auto py-2 font-mono text-xs leading-5 text-fg">
        <code>{code}</code>
      </pre>
      <CopyButton text={code} label="Copy the command" />
    </div>
  );
}

function Steps({ steps, empty, label = "Steps to start" }: { steps: InstallStep[]; empty?: string; label?: string }) {
  return (
    <ol aria-label={label} className="m-0 flex list-none flex-col gap-5 p-0">
      {steps.map((s, i) => (
        <li key={s.title ?? s.text} className="flex gap-3">
          <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
            {i + 1}
          </span>
          <div className="min-w-0 grow pt-0.5">
            {s.title && <p className="m-0 font-semibold">{s.title}</p>}
            <p className={cn("m-0", s.title && "text-fg-muted")}>{s.text}</p>
            {s.code && <Command code={s.code} />}
            {s.note && <p className="mt-1.5 mb-0 text-sm text-fg-subtle">{s.note}</p>}
          </div>
        </li>
      ))}
      {!steps.length && empty && <li className="text-fg-muted">{empty}</li>}
    </ol>
  );
}

/** An icon that says what kind of file it is: settings, keys, a picture or text. */
function FileIcon({ file }: { file: InstallFile }) {
  const Icon = file.binary ? FileImage : file.name.endsWith("-kek") ? FileKey : file.name.endsWith(".env") ? FileCog : /\.(ya?ml|conf|ts)$|^Caddyfile$/.test(file.name) ? FileCode : FileText;
  return <Icon aria-hidden className="size-4 shrink-0 text-fg-muted" />;
}

const TOKEN: Record<Kind, string> = {
  plain: "",
  comment: "text-fg-subtle italic",
  key: "text-accent",
  string: "text-success",
  literal: "text-warning-text",
  keyword: "font-semibold text-accent",
  punct: "text-fg-muted",
  heading: "font-semibold text-fg",
};

/** A file as code, coloured for its kind: YAML as YAML, an env file as one. */
function Code({ name, content }: { name: string; content: string }) {
  const lines = useMemo(() => highlight(content, languageOf(name)), [name, content]);
  return (
    <pre tabIndex={0} aria-label={name} className="m-0 max-h-[32rem] min-h-72 overflow-auto p-4 font-mono text-xs leading-5 text-fg">
      <code>
        {lines.map((tokens, i) => (
          <span key={i} className="block min-h-5">
            {tokens.map((t, j) => (t.kind === "plain" ? t.text : <span key={j} className={TOKEN[t.kind]}>{t.text}</span>))}
          </span>
        ))}
      </code>
    </pre>
  );
}

/** The folders first, each with its files, then the files at the top: as the zip unpacks. */
function tree(files: InstallFile[]) {
  const folders = new Map<string, InstallFile[]>();
  const top: InstallFile[] = [];
  for (const f of files) {
    const at = f.name.indexOf("/");
    if (at < 0) top.push(f);
    else folders.set(f.name.slice(0, at), [...(folders.get(f.name.slice(0, at)) ?? []), f]);
  }
  return { folders: [...folders], top };
}

/** Every file in the folder, to read, copy or download one by one. */
function Files({ out, folder, logo }: { out: Install; folder: string; logo?: Logo | null }) {
  const [file, setFile] = useState("compose.yaml");
  const current = out.files.find((f) => f.name === file) ?? out.files[0]!;
  const { folders, top } = tree(out.files);
  const item = (f: InstallFile, nested: boolean) => (
    <li key={f.name}>
      <button
        type="button"
        aria-current={f.name === current.name ? "true" : undefined}
        aria-label={`Open ${f.name}`}
        onClick={() => setFile(f.name)}
        className={cn("flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 text-left font-mono text-sm", nested && "pl-7", f.name === current.name ? "bg-accent-soft/60 font-semibold text-fg" : "text-fg-muted hover:bg-subtle hover:text-fg")}
      >
        <FileIcon file={f} />
        <span className="truncate">{f.name.slice(f.name.lastIndexOf("/") + 1)}</span>
        {f.secret && (
          <span className="ml-auto font-sans text-2xs font-normal text-fg-subtle" title="Keep it private and with your backups">
            secret
          </span>
        )}
      </button>
    </li>
  );
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="grid md:grid-cols-[minmax(12rem,16rem)_minmax(0,1fr)]">
        <div className="max-h-72 overflow-auto border-b border-line p-1.5 md:max-h-none md:border-r md:border-b-0">
          <p className="m-0 flex min-h-9 items-center gap-2 px-2.5 font-mono text-sm font-semibold">
            <FolderOpen aria-hidden className="size-4 shrink-0 text-fg-muted" />
            {folder}/
          </p>
          <ul aria-label="Files" className="m-0 flex list-none flex-col gap-0.5 p-0 pl-3">
            {folders.map(([name, files]) => (
              <li key={name}>
                <span className="flex min-h-9 items-center gap-2 px-2.5 font-mono text-sm text-fg">
                  <Folder aria-hidden className="size-4 shrink-0 text-fg-muted" />
                  {name}/
                </span>
                <ul aria-label={`${name} folder`} className="m-0 flex list-none flex-col gap-0.5 p-0">
                  {files.map((f) => item(f, true))}
                </ul>
              </li>
            ))}
            {top.map((f) => item(f, false))}
          </ul>
        </div>
        <div className="flex min-w-0 flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-1.5">
            <span className="truncate font-mono text-sm font-semibold">{current.name}</span>
            <div className="flex gap-2">
              {!current.binary && <CopyButton text={current.content} />}
              <Button icon={<Download />} onClick={() => save(new Blob([bytesOf(current, logo)], { type: current.binary ? logo!.type : "text/plain" }), current.name.slice(current.name.lastIndexOf("/") + 1))} aria-label={`Download ${current.name}`}>
                Download
              </Button>
            </div>
          </div>
          {current.binary && logo ? (
            <div className="grid min-h-48 place-items-center p-6">
              <img src={logo.url} alt={current.name} className="max-h-32 max-w-full object-contain" />
            </div>
          ) : (
            <Code name={current.name} content={current.content} />
          )}
        </div>
      </div>
    </div>
  );
}

/** A numbered part of the production form. */
function Part({ n, title, hint, children }: { n: number; title: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={`part-${n}`} className="rounded-xl border border-line bg-surface p-5">
      <h2 id={`part-${n}`} className="m-0 flex items-center gap-3 text-lg font-semibold">
        <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-accent-soft text-sm text-accent">
          {n}
        </span>
        {title}
      </h2>
      {hint && <p className="mt-1 mb-0 pl-10 text-sm text-fg-muted">{hint}</p>}
      <div className="mt-4 flex flex-col gap-3">{children}</div>
    </section>
  );
}

/** A radio or checkbox drawn as a card; the native input keeps keyboard and screen reader behaviour. */
function Choice({ type = "radio", name, checked, onChange, title, text, badge }: { type?: "radio" | "checkbox"; name: string; checked: boolean; onChange: (on: boolean) => void; title: ReactNode; text: string; badge?: string }) {
  return (
    <label className={cn("flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border bg-surface p-3", checked ? "border-accent bg-accent-soft/40 ring-1 ring-accent" : "border-line hover:border-line-strong")}>
      <input type={type} name={name} checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 size-4 shrink-0 accent-[var(--oa-accent)]" />
      <span className="flex min-w-0 grow flex-col gap-0.5">
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

/** Every released product on this machine: nothing to choose, one folder and one command. */
function TryLocally({ out, ready }: { out: Install; ready: boolean }) {
  return (
    <>
      <section aria-labelledby="dev-title" className="mt-6 flex flex-wrap overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="flex min-w-0 flex-[999_1_32rem] flex-col gap-5 p-6 sm:p-9">
          <div>
            <p className="m-0 text-xs font-semibold tracking-wider text-accent uppercase">Five minutes, one command</p>
            <h2 id="dev-title" className="mt-2 mb-0 text-2xl font-semibold tracking-tight">
              Every released product, running on your machine
            </h2>
            <p className="mt-2 mb-0 max-w-xl text-fg-muted">Every product signs in through Identity. A VPN server, two agents reading demo servers, and every scanner ready for your CI, wired together for you. Docker is all it needs.</p>
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
          <span className="text-[#4cc38a]">Ready. Open https://id.localhost:8443</span>
        </div>
      </section>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="dev-steps" className="rounded-xl border border-line bg-surface p-6 sm:p-8">
          <h2 id="dev-steps" className="mt-0 mb-5 text-lg font-semibold">
            Three steps
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

export default function InstallPage() {
  const [mode, setMode] = useState<Mode>("dev");
  const [choice, setChoice] = useState<InstallChoice>(DEFAULT_CHOICE);
  const [secrets, setSecrets] = useState<Secrets>(PLACEHOLDER);
  // The logo stays in this page: it goes into the zip and nowhere else.
  const [logo, setLogo] = useState<Logo | null>(null);
  const [logoError, setLogoError] = useState("");
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
  const dev = useMemo(() => buildDevKit(secrets), [secrets]);
  const ready = secrets.kek !== PENDING;
  const has = (id: Installable) => choice.products.includes(id);

  const toggle = (id: Installable, on: boolean) => {
    const products = on ? [...choice.products, id] : choice.products.filter((p) => p !== id);
    // Without Identity, nobody can sign in through it.
    set({ products, ...(id === "identity" && !on && choice.signIn === "identity" ? { signIn: "own" as SignIn } : {}) });
  };
  const pickLogo = async (f: File | undefined) => {
    setLogoError("");
    if (!f) return;
    const ext = LOGO_TYPES[f.type as keyof typeof LOGO_TYPES];
    if (!ext) return setLogoError("Pick an SVG, PNG or WebP file.");
    if (f.size > LOGO_MAX_BYTES) return setLogoError("Pick a file of 512 KB or less.");
    const bytes = new Uint8Array(await f.arrayBuffer());
    if (logo) URL.revokeObjectURL(logo.url);
    setLogo({ name: `logo.${ext}`, type: f.type, bytes, url: URL.createObjectURL(new Blob([bytes], { type: f.type })) });
    set({ logo: `logo.${ext}` });
  };
  const removeLogo = () => {
    if (logo) URL.revokeObjectURL(logo.url);
    setLogo(null);
    set({ logo: null });
  };
  const brandSummary = [cleanOrganization(choice.organization), choice.logo && "logo", cleanAccent(choice.accent) && "color"].filter(Boolean).join(", ");

  return (
    <Section className="py-12" labelledBy="title">
      <PageTitle title="Install">Try every released product on your machine, or set up the ones you need for production, from released images only. Either way you get one folder in which the products already know each other, and its keys are made in your browser and never sent.</PageTitle>

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
        <TryLocally out={dev} ready={ready} />
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
                      onChange={() => set(o.value === "identity" ? { signIn: o.value, products: has("identity") ? choice.products : [...choice.products, "identity"] } : { signIn: o.value })}
                      title={o.title}
                      text={o.text}
                      badge={o.badge}
                    />
                  ))}
                </div>
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
              </Part>

              <Part n={3} title="Address and HTTPS">
                <TextField label="Domain" mono value={choice.domain} onChange={(e) => set({ domain: e.target.value })} hint={out.addresses.length ? `Addresses: ${out.addresses.join(", ")}` : "Each product gets a name under it."} spellCheck={false} autoComplete="off" />
                <div role="radiogroup" aria-label="HTTPS" className="grid gap-3 sm:grid-cols-2">
                  {PROXIES.map((o) => (
                    <Choice key={o.value} name="proxy" checked={choice.proxy === o.value} onChange={() => set({ proxy: o.value })} title={o.title} text={o.text} />
                  ))}
                </div>
              </Part>

              <Part n={4} title="Options" hint="Each is set up well already: change only what you need.">
                <Options title="Your brand" summary={brandSummary || "OpenAsy's own"}>
                  <div className="flex flex-col gap-4">
                    <p className="m-0 text-sm text-fg-muted">Every product loads it from config/brand.env, a file of its own, so you see and change it in one place.</p>
                    <TextField label="Organization" value={choice.organization} onChange={(e) => set({ organization: e.target.value })} hint="Under each product's name, such as your company. Empty leaves the line out." maxLength={64} autoComplete="organization" />
                    <div className="flex flex-col gap-2">
                      <span className="text-sm font-medium">Logo</span>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-subtle">
                          {logo ? <img src={logo.url} alt="Your logo" className="size-8 object-contain" /> : <span className="text-2xs text-fg-subtle">None</span>}
                        </span>
                        <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md border border-line bg-surface px-3 text-sm font-medium focus-within:ring-2 focus-within:ring-accent hover:border-line-strong">
                          <Upload aria-hidden className="size-4" />
                          {logo ? "Pick another" : "Pick a file"}
                          <input type="file" accept={Object.keys(LOGO_TYPES).join(",")} className="sr-only" onChange={(e) => (void pickLogo(e.target.files?.[0]), (e.target.value = ""))} />
                        </label>
                        {logo && (
                          <Button icon={<X />} onClick={removeLogo}>
                            Remove
                          </Button>
                        )}
                      </div>
                      <span className={cn("text-xs", logoError ? "text-danger" : "text-fg-muted")} role={logoError ? "alert" : undefined}>
                        {logoError || "One square picture with no text in it: SVG, PNG or WebP, up to 512 KB. It replaces the OpenAsy mark and the tab icon, and stays in this browser until it goes into the zip."}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                      <TextField label="Color" mono value={choice.accent} onChange={(e) => set({ accent: e.target.value })} placeholder="#0a66c2" hint={choice.accent && !cleanAccent(choice.accent) ? "A color as #rrggbb." : "Buttons and links. Empty keeps OpenAsy's blue."} className="w-40" spellCheck={false} autoComplete="off" />
                      <input type="color" aria-label="Pick a color" value={cleanAccent(choice.accent) || "#2f5bd3"} onChange={(e) => set({ accent: e.target.value })} className="mb-6 h-10 w-12 cursor-pointer rounded-md border border-line bg-surface p-1" />
                    </div>
                  </div>
                </Options>
                {INSTALLABLE.some((id) => has(id) && PARTS[id].hosts) && (
                  <Options title="Servers" summary={choice.hostsFile ? "From hosts.yaml" : "Added in each product"}>
                    <Toggle checked={choice.hostsFile} onChange={(hostsFile) => set({ hostsFile })} title="One file for your servers" text="Adds config/hosts.yaml, which every product you picked that works with servers reads. You can still add servers in their UI." />
                  </Options>
                )}
                {has("vpn") && (
                  <Options title="VPN" summary={choice.vpnTcp ? "UDP 1194 and TCP" : "UDP 1194"}>
                    <Toggle checked={choice.vpnTcp} onChange={(vpnTcp) => set({ vpnTcp })} title="Also on TCP" text="A second vpn-server on TCP 443, for networks that allow only HTTPS. It is slower than UDP." />
                  </Options>
                )}
                {has("vulnerabilities") && (
                  <Options title="Vulnerabilities" summary={choice.vulnsHost ? "Scans this host too" : "Only other hosts"}>
                    <Toggle checked={choice.vulnsHost} onChange={(vulnsHost) => set({ vulnsHost })} title="Scan this host" text="Adds vulns-agent here. Other hosts and clusters get their own agent later." />
                  </Options>
                )}
                <Options title="Metrics" summary={choice.prometheus ? "Prometheus" : "None"}>
                  <Toggle checked={choice.prometheus} onChange={(prometheus) => set({ prometheus })} title="Prometheus for metrics" text="Scrapes /metrics of every product you picked, until OpenAsy Metrics ships." />
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
              <Button variant="primary" icon={<FolderDown />} onClick={() => downloadZip(out, "openasy", logo)} disabled={!choice.products.length || !ready}>
                Download openasy.zip
              </Button>
              <button type="button" onClick={fresh} className="inline-flex items-center gap-1.5 self-start text-xs text-fg-muted hover:text-fg">
                <RefreshCw aria-hidden className="size-3.5" />
                Make new secrets
              </button>
            </aside>
          </div>

          <div className="mt-10 grid items-start gap-6 lg:grid-cols-2">
            <section aria-labelledby="prod-steps" className="rounded-xl border border-line bg-surface p-6">
              <h2 id="prod-steps" className="mt-0 mb-4 text-lg font-semibold">
                Steps to start
              </h2>
              <Steps steps={out.steps} empty="Pick a product first." />
            </section>
            <section aria-labelledby="prod-files" className="min-w-0">
              <h2 id="prod-files" className="mt-0 mb-3 text-lg font-semibold">
                What is in the folder
              </h2>
              <Files out={out} folder="openasy" logo={logo} />
            </section>
          </div>
        </>
      )}

      <p className="mt-8 mb-0 text-xs text-fg-muted">Keys and secrets are made in this browser with crypto.getRandomValues and never sent. Nothing is kept after you leave.</p>
    </Section>
  );
}
