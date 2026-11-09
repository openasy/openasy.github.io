// The parts of the install builder that /install and each product's page share: the choices, the steps, the files and
// the zip. Keys are made in the reader's browser by makeSecrets, never on the server or in the prerendered HTML.
import { useMemo, useState, type ReactNode } from "react";
import { Check, Copy, Download, FileCode, FileCog, FileImage, FileKey, FileText, Folder, FolderOpen } from "lucide-react";
import { Badge, Button, cn } from "@openasy/ui";
import type { Certificates, Existing, Install, InstallFile, InstallStep, Proxy, Secrets, SignIn, Upstream } from "../data/install";
import { highlight, languageOf, type Kind } from "../data/highlight";
import { zip } from "../data/zip";

/** Until the page runs, so a prerendered page never shows a key someone else could copy. */
export const PENDING = "made-when-the-page-loads";
export const PLACEHOLDER: Secrets = {
  kek: PENDING,
  agentKek: PENDING,
  logsAgentKek: PENDING,
  siemAgentKek: PENDING,
  ingest: PENDING,
  tokens: {},
  keycloakDb: PENDING,
  keycloakAdmin: PENDING,
  stalwartAdmin: PENDING,
  stalwartPassword: PENDING,
  calendarStalwartPassword: PENDING,
  clients: { identity: PENDING, vpn: PENDING, infrastructure: PENDING, vulnerabilities: PENDING },
};

export const SIGN_IN: Array<{ value: SignIn; title: string; text: string; badge?: string }> = [
  {
    value: "identity",
    title: "OpenAsy Identity",
    text: "One sign-in for every product, with MFA per group. Adds Identity if it is not picked.",
    badge: "Recommended",
  },
  { value: "keycloak", title: "Keycloak, ready for OpenAsy", text: "Keycloak and PostgreSQL, with a realm in which every product is already a client." },
  { value: "provider", title: "Your provider", text: "Microsoft Entra ID, Okta or Google, straight to each product." },
  {
    value: "existing",
    title: "An Identity or Keycloak you already run",
    text: "The products sign in through it; give its address, and add each product there.",
  },
  { value: "own", title: "Each product on its own", text: "Passwords, passkeys and authenticator apps in each product." },
];
export const EXISTING: Array<{ value: Existing; label: string }> = [
  { value: "openasy-identity", label: "OpenAsy Identity" },
  { value: "keycloak", label: "Keycloak" },
];
export const UPSTREAMS: Array<{ value: Upstream; label: string }> = [
  { value: "none", label: "Identity itself" },
  { value: "keycloak", label: "Keycloak" },
  { value: "entra", label: "Entra ID" },
  { value: "okta", label: "Okta" },
  { value: "google", label: "Google" },
];
export const UPSTREAM_HINT: Record<Upstream, string> = {
  none: "Passwords, passkeys and second factors kept in Identity. LDAP and Active Directory can be added later under Settings, Directories.",
  keycloak: "Adds the ready Keycloak. Identity signs people in through it and follows its groups.",
  entra: "Identity signs people in through Entra ID. SCIM can switch leavers off at once.",
  okta: "Identity signs people in through Okta. SCIM can switch leavers off at once.",
  google: "Identity signs people in through Google Workspace, for your domain only.",
};

export const PROXIES: Array<{ value: Proxy; title: string; text: string }> = [
  { value: "caddy", title: "Caddy, in the compose file", text: "Gets and renews the certificates by itself, from Let's Encrypt or its own CA." },
  { value: "nginx", title: "nginx on this host", text: "A site for each product; certbot adds HTTPS." },
  { value: "apache", title: "Apache on this host", text: "A virtual host for each product; certbot adds HTTPS." },
  { value: "own", title: "Another proxy", text: "Products listen on 127.0.0.1; point your proxy at them." },
];

export const CERTIFICATES: Array<{ value: Certificates; title: string; text: string }> = [
  { value: "public", title: "Let's Encrypt", text: "The names are public and this host answers on ports 80 and 443." },
  {
    value: "internal",
    title: "Caddy's own CA",
    text: "A network the internet cannot reach, such as openasy.internal. Each computer that opens the products trusts its root once.",
  },
];

/** A picture picked for the brand: its file name in brand/, and its bytes, which stay in the page. */
export type Picture = { name: string; type: string; bytes: Uint8Array<ArrayBuffer>; url: string };
/** The pictures picked, by their path in the folder. */
export type Pictures = Record<string, Picture>;

export function save(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** A file as the person saves it: text with a trailing newline, a picture as its bytes. */
export const bytesOf = (f: InstallFile, pictures: Pictures = {}) =>
  f.binary && pictures[f.name] ? pictures[f.name]!.bytes : new TextEncoder().encode(`${f.content}\n`);
export const downloadZip = (out: Install, folder: string, pictures?: Pictures) =>
  save(
    new Blob(
      [
        zip(
          out.files.map((f) => ({ name: f.name, content: bytesOf(f, pictures) })),
          folder,
        ),
      ],
      { type: "application/zip" },
    ),
    `${folder}.zip`,
  );

export function CopyButton({ text, label }: { text: string; label?: string }) {
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
export function Command({ code }: { code: string }) {
  return (
    <div className="mt-2 flex items-start gap-2 rounded-lg border border-line bg-subtle p-1.5 pl-3">
      <pre className="m-0 min-w-0 grow overflow-x-auto py-2 font-mono text-xs leading-5 text-fg">
        <code>{code}</code>
      </pre>
      <CopyButton text={code} label="Copy the command" />
    </div>
  );
}

export function Steps({ steps, empty, label = "Steps to start" }: { steps: InstallStep[]; empty?: string; label?: string }) {
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
export function FileIcon({ file }: { file: InstallFile }) {
  const Icon = file.binary
    ? FileImage
    : file.name.endsWith("-kek")
      ? FileKey
      : file.name.endsWith(".env")
        ? FileCog
        : /\.(ya?ml|conf|ts)$|^Caddyfile$/.test(file.name)
          ? FileCode
          : FileText;
  return <Icon aria-hidden className="size-4 shrink-0 text-fg-muted" />;
}

export const TOKEN: Record<Kind, string> = {
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
export function Code({ name, content }: { name: string; content: string }) {
  const lines = useMemo(() => highlight(content, languageOf(name)), [name, content]);
  return (
    <pre
      tabIndex={0}
      aria-label={name}
      className="m-0 max-h-[32rem] min-h-72 overflow-auto p-4 font-mono text-xs leading-5 text-fg md:max-h-none md:min-h-0 md:flex-1"
    >
      <code>
        {lines.map((tokens, i) => (
          <span key={i} className="block min-h-5">
            {tokens.map((t, j) =>
              t.kind === "plain" ? (
                t.text
              ) : (
                <span key={j} className={TOKEN[t.kind]}>
                  {t.text}
                </span>
              ),
            )}
          </span>
        ))}
      </code>
    </pre>
  );
}

/** The folders first, each with its files, then the files at the top: as the zip unpacks. */
export function tree(files: InstallFile[]) {
  const folders = new Map<string, InstallFile[]>();
  const top: InstallFile[] = [];
  for (const f of files) {
    const at = f.name.lastIndexOf("/");
    if (at < 0) top.push(f);
    else folders.set(f.name.slice(0, at), [...(folders.get(f.name.slice(0, at)) ?? []), f]);
  }
  return { folders: [...folders], top };
}

/** Every file in the folder, to read, copy or download one by one. */
export function Files({ out, folder, pictures = {} }: { out: Install; folder: string; pictures?: Pictures }) {
  const [file, setFile] = useState("compose.yaml");
  const current = out.files.find((f) => f.name === file) ?? out.files[0]!;
  const picture = current.binary ? pictures[current.name] : undefined;
  const { folders, top } = tree(out.files);
  const item = (f: InstallFile, nested: boolean) => (
    <li key={f.name}>
      <button
        type="button"
        aria-current={f.name === current.name ? "true" : undefined}
        aria-label={`Open ${f.name}`}
        onClick={() => setFile(f.name)}
        className={cn(
          "flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 text-left font-mono text-sm",
          nested && "pl-7",
          f.name === current.name ? "bg-accent-soft/60 font-semibold text-fg" : "text-fg-muted hover:bg-subtle hover:text-fg",
        )}
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
      {/* On wide screens both columns have the box's height and scroll on their own, so neither ends early. */}
      <div className="grid md:h-[36rem] md:grid-cols-[minmax(12rem,16rem)_minmax(0,1fr)] md:grid-rows-[minmax(0,1fr)]">
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
        <div className="flex min-h-0 min-w-0 flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-1.5">
            <span className="truncate font-mono text-sm font-semibold">{current.name}</span>
            <div className="flex gap-2">
              {!current.binary && <CopyButton text={current.content} />}
              <Button
                icon={<Download />}
                onClick={() =>
                  save(new Blob([bytesOf(current, pictures)], { type: picture?.type ?? "text/plain" }), current.name.slice(current.name.lastIndexOf("/") + 1))
                }
                aria-label={`Download ${current.name}`}
              >
                Download
              </Button>
            </div>
          </div>
          {picture ? (
            <div className="grid min-h-48 place-items-center p-6">
              <img src={picture.url} alt={current.name} className="max-h-32 max-w-full object-contain" />
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
export function Part({ n, title, hint, children }: { n: number; title: string; hint?: ReactNode; children: ReactNode }) {
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
export function Choice({
  type = "radio",
  name,
  checked,
  onChange,
  title,
  text,
  badge,
}: {
  type?: "radio" | "checkbox";
  name: string;
  checked: boolean;
  onChange: (on: boolean) => void;
  title: ReactNode;
  text: string;
  badge?: string;
}) {
  return (
    <label
      className={cn(
        "flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border bg-surface p-3",
        checked ? "border-accent bg-accent-soft/40 ring-1 ring-accent" : "border-line hover:border-line-strong",
      )}
    >
      <input
        type={type}
        name={name}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 size-4 shrink-0 accent-[var(--oa-accent)]"
      />
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

export function Toggle({ checked, onChange, title, text }: { checked: boolean; onChange: (v: boolean) => void; title: string; text: string }) {
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

export function Options({ title, summary, children }: { title: string; summary: string; children: ReactNode }) {
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
