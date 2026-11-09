// A product's own setup on its page: how people sign in, where it runs, then the steps and the folder to download.
// The same builder as /install (buildInstall), for this one product and what it needs: Identity or Keycloak when
// people sign in through one that runs here. Keys are made in the reader's browser after the page loads.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { FolderDown, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button, SegmentedControl, TextField } from "@openasy/ui";
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
} from "./setup";
import {
  DEFAULT_CHOICE,
  PARTS,
  buildInstall,
  cleanDomain,
  makeSecrets,
  type InstallChoice,
  type Installable,
  type Provider,
  type Secrets,
  type VpnLayout,
  type VpnServer,
} from "../data/install";

/** The servers each VPN layout starts with: one at the edge, or two locations to show how a second one is added. */
const FIRST_SERVERS: Record<VpnLayout, VpnServer[]> = {
  "one-host": [],
  edge: [{ name: "edge-1", address: "" }],
  locations: [
    { name: "fra-1", address: "" },
    { name: "ist-1", address: "" },
  ],
};

/** VPN's servers on hosts of their own: a name and the address clients connect to, one per row. */
function Servers({ servers, many, domain, onChange }: { servers: VpnServer[]; many: boolean; domain: string; onChange: (s: VpnServer[]) => void }) {
  const at = (i: number, patch: Partial<VpnServer>) => onChange(servers.map((v, j) => (j === i ? { ...v, ...patch } : v)));
  return (
    <div className="flex flex-col gap-3">
      {servers.map((v, i) => (
        <div key={i} className="grid items-start gap-3 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_auto]">
          <TextField label="Name in VPN" mono value={v.name} onChange={(e) => at(i, { name: e.target.value })} spellCheck={false} autoComplete="off" />
          <TextField
            label="Address clients connect to"
            mono
            value={v.address}
            placeholder={`${v.name || "edge-1"}.${cleanDomain(domain)}`}
            onChange={(e) => at(i, { address: e.target.value })}
            spellCheck={false}
            autoComplete="off"
          />
          {many && servers.length > 1 && (
            <Button
              className="sm:mt-6"
              icon={<Trash2 />}
              aria-label={`Remove ${v.name || "this server"}`}
              onClick={() => onChange(servers.filter((_, j) => j !== i))}
            />
          )}
        </div>
      ))}
      {many && (
        <Button icon={<Plus />} className="self-start" onClick={() => onChange([...servers, { name: `site-${servers.length + 1}`, address: "" }])}>
          Add a location
        </Button>
      )}
    </div>
  );
}

/** What each way of signing in means for one product, said for that product. */
function signInText(value: InstallChoice["signIn"], name: string): string {
  switch (value) {
    case "identity":
      return `Identity comes along on this host: people sign in once, to ${name} and every product you add later, with MFA per group.`;
    case "keycloak":
      return `Keycloak and PostgreSQL come along, with a realm in which ${name} is already a client.`;
    case "provider":
      return `Microsoft Entra ID, Okta or Google, straight to ${name}.`;
    case "existing":
      return `${name} signs in through it: give its address, then add ${name} there.`;
    case "own":
      return `Passwords, passkeys and authenticator apps in ${name} itself. A provider can be added later.`;
  }
}

export function ProductSetup({ id, layout = "one-host" }: { id: Installable; layout?: VpnLayout }) {
  const name = PARTS[id].name;
  const folder = PARTS[id].service;
  const [choice, setChoice] = useState<InstallChoice>({
    ...DEFAULT_CHOICE,
    products: [id],
    prometheus: false,
    vulnsHost: true,
    vpnLayout: layout,
    vpnServers: FIRST_SERVERS[layout],
  });
  const [secrets, setSecrets] = useState<Secrets>(PLACEHOLDER);
  const set = (patch: Partial<InstallChoice>) => setChoice((c) => ({ ...c, ...patch }));
  const fresh = () => setSecrets(makeSecrets((b) => crypto.getRandomValues(b)));
  // Made here, after the page loads: a prerendered page never holds a key someone else could copy.
  useEffect(fresh, []);
  const ready = secrets.kek !== PENDING;

  // Identity runs next to the product when people sign in through it; the product alone otherwise.
  const withIdentity = choice.signIn === "identity" && id !== "identity";
  const out = useMemo(() => {
    const products: Installable[] = withIdentity ? [id, "identity"] : [id];
    return buildInstall({ ...choice, products }, secrets);
  }, [choice, secrets, id, withIdentity]);

  return (
    <div className="mt-4 flex flex-col gap-4">
      <Part n={1} title="How people sign in">
        <div role="radiogroup" aria-label="Sign-in" className="grid gap-3 sm:grid-cols-2">
          {SIGN_IN.filter((o) =>
            id === "identity"
              ? o.value !== "identity" && o.value !== "existing"
              : // OpenCloud and Vaultwarden sign people in through Identity, so these products do too.
                !PARTS[id].needsIdentity || o.value === "identity" || o.value === "existing",
          ).map((o) => (
            <Choice
              key={o.value}
              name={`sign-in-${id}`}
              checked={choice.signIn === o.value}
              onChange={() => set({ signIn: o.value })}
              title={o.value === "own" ? `${name} on its own` : o.title}
              text={signInText(o.value, name)}
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
            {!PARTS[id].needsIdentity && (
              <SegmentedControl label="Which one" value={choice.existing} onChange={(existing) => set({ existing })} options={EXISTING} />
            )}
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

      <Part n={2} title="Where it runs">
        <TextField
          label="Domain"
          mono
          value={choice.domain}
          onChange={(e) => set({ domain: e.target.value })}
          hint={`Opened at ${out.addresses.join(", ")}`}
          spellCheck={false}
          autoComplete="off"
        />
        <div role="radiogroup" aria-label="HTTPS" className="grid gap-3 sm:grid-cols-2">
          {PROXIES.map((o) => (
            <Choice
              key={o.value}
              name={`proxy-${id}`}
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
                name={`certificates-${id}`}
                checked={choice.certificates === o.value}
                onChange={() => set({ certificates: o.value })}
                title={o.title}
                text={o.text}
              />
            ))}
          </div>
        )}
        {id === "vpn" && (
          <Options title="VPN" summary={choice.vpnTcp ? "UDP 1194 and TCP" : "UDP 1194"}>
            <Toggle
              checked={choice.vpnTcp}
              onChange={(vpnTcp) => set({ vpnTcp })}
              title="Also on TCP"
              text="A second vpn-server on TCP 443, for networks that allow only HTTPS. It is slower than UDP."
            />
          </Options>
        )}
      </Part>

      {id === "vpn" && layout !== "one-host" && (
        <Part
          n={3}
          title={layout === "edge" ? "The server at the edge" : "A server per location"}
          hint={
            layout === "edge"
              ? "The panel stays inside; this host is the only one open to the internet. Each server gets a folder of its own."
              : "Each location gets a folder of its own. Clients move to the next server when one is down."
          }
        >
          <Servers servers={choice.vpnServers} many={layout === "locations"} domain={choice.domain} onChange={(vpnServers) => set({ vpnServers })} />
        </Part>
      )}

      <section aria-label="Your setup" className="flex flex-col gap-4 rounded-xl border border-accent/40 bg-accent-soft/30 p-5">
        <ul aria-label="How it fits together" className="m-0 flex list-none flex-col gap-2 p-0 text-sm">
          {out.wiring.map((w) => (
            <li key={w.title}>
              <span className="font-semibold">{w.title}</span> <span className="text-fg-muted">{w.text}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" icon={<FolderDown />} onClick={() => downloadZip(out, folder)} disabled={!ready}>
            Download {folder}.zip
          </Button>
          <button type="button" onClick={fresh} className="inline-flex items-center gap-1.5 text-xs text-fg-muted hover:text-fg">
            <RefreshCw aria-hidden className="size-3.5" />
            Make new keys
          </button>
        </div>
        <p className="m-0 text-xs text-fg-muted">The keys in it are made in this browser and never sent.</p>
      </section>

      <section aria-labelledby={`steps-${id}`} className="rounded-xl border border-line bg-surface p-5 sm:p-6">
        <h3 id={`steps-${id}`} className="mt-0 mb-5 text-lg font-semibold">
          Steps to start
        </h3>
        <Steps
          steps={out.steps.map((s, i) =>
            i === 0 ? { ...s, text: s.text.replaceAll("openasy.zip", `${folder}.zip`).replaceAll("its openasy folder", `its ${folder} folder`) } : s,
          )}
        />
      </section>

      <section aria-labelledby={`files-${id}`}>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
          <h3 id={`files-${id}`} className="m-0 text-lg font-semibold">
            What is in the folder
          </h3>
          <span className="text-sm text-fg-subtle">Read, copy or download any file</span>
        </div>
        <Files out={out} folder={folder} />
      </section>
    </div>
  );
}
