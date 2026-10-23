import { useState } from "react";
import { Link } from "react-router";
import { Callout, Tabs, TextField } from "@openasy/ui";
import { PRESETS } from "@openasy/auth/presets";
import { CodeBlock, GITHUB, PageTitle, Section } from "../components/site";

export function meta() {
  return [
    { title: "Sign in with your identity provider · OpenAsy" },
    {
      name: "description",
      content: "Connect Keycloak, Microsoft Entra ID, Okta, Google, authentik, ZITADEL or OpenAsy Identity to any OpenAsy product: the steps at the provider and in the product.",
    },
  ];
}

/** "Microsoft" on a button reads as Microsoft Entra ID in a guide. */
const title = (id: string, name: string) => (id === "entra" ? "Microsoft Entra ID" : id === "generic" ? "Another OpenID Connect provider" : name);

/** The steps for one provider, with the redirect address of the product the reader is setting up. */
function Guide({ id }: { id: string }) {
  const p = PRESETS.find((x) => x.id === id)!;
  const [product, setProduct] = useState("https://vpn.example.com");
  const base = product.trim().replace(/\/$/, "") || "https://vpn.example.com";
  const redirect = `${base}/api/v1/auth/oidc/${p.id}/callback`;
  const name = title(p.id, p.name);
  const mapping = p.id === "google" ? undefined : p.id === "entra" ? "<group object id> = admin" : "ops-admins = admin";
  return (
    <div className="mt-6 flex flex-col gap-8">
      <TextField label="Your product's address" mono value={product} onChange={(e) => setProduct(e.target.value)} hint="The address people open it at; the redirect URI below follows it." className="max-w-md" />

      <section aria-labelledby="at-provider">
        <h2 id="at-provider" className="m-0 text-xl font-semibold">
          1. At {p.id === "generic" ? "your provider" : name}
        </h2>
        <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5">
          {p.steps.map((s) => (
            <li key={s}>
              {s.split("{redirectUri}").map((part, i) => (
                <span key={i}>
                  {i > 0 && <code className="rounded bg-subtle px-1 font-mono text-sm break-all">{redirect}</code>}
                  {part}
                </span>
              ))}
            </li>
          ))}
        </ol>
        {p.notes?.map((n) => (
          <Callout key={n} tone="info" title="Good to know" className="mt-3">
            {n}
          </Callout>
        ))}
        <p className="mt-3 mb-0 text-sm">
          <a href={p.docs}>{name} documentation</a>
        </p>
      </section>

      <section aria-labelledby="in-product">
        <h2 id="in-product" className="m-0 text-xl font-semibold">
          2. In the product
        </h2>
        <p className="mt-2 text-fg-muted">As an owner, open Settings, Sign-in, add a provider and choose {name}. The page shows the same steps and the redirect URI to copy.</p>
        <dl className="mt-3 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-fg-muted">Issuer</dt>
          <dd className="m-0 font-mono break-all">{p.issuerExample}</dd>
          <dt className="text-fg-muted">Client ID and secret</dt>
          <dd className="m-0">From the provider, step 1. The secret is kept encrypted and never shown again.</dd>
          <dt className="text-fg-muted">Groups claim</dt>
          <dd className="m-0">{p.groupsClaim ? <code className="font-mono">{p.groupsClaim}</code> : "None, see the note above."}</dd>
          {mapping && (
            <>
              <dt className="text-fg-muted">Roles from groups</dt>
              <dd className="m-0">
                One <code className="font-mono">group = role</code> per line, for example <code className="font-mono">{mapping}</code>. Groups then decide the role at every sign-in.
              </dd>
            </>
          )}
        </dl>
      </section>

      <section aria-labelledby="in-environment">
        <h2 id="in-environment" className="m-0 text-xl font-semibold">
          Or in the environment
        </h2>
        <p className="mt-2 text-fg-muted">
          For installs set up by scripts. The names are the same in every product, so an install sets them once; only the client is each product&apos;s. A provider set here has
          the id <code className="font-mono">sso</code>, so its redirect URI ends in <code className="font-mono">/api/v1/auth/oidc/sso/callback</code>. Add <code className="font-mono">OPENASY_OIDC_AUTO_REDIRECT=true</code> to
          open the provider straight from the sign-in page.
        </p>
        <CodeBlock
          label={`Environment for ${name}`}
          className="mt-3 p-4"
          code={[
            `OPENASY_OIDC_PROVIDER=${p.id}`,
            `OPENASY_OIDC_ISSUER=${p.issuerExample}`,
            "OPENASY_OIDC_CLIENT_ID=...",
            "OPENASY_OIDC_CLIENT_SECRET=...",
            ...(mapping ? [`OPENASY_OIDC_ROLE_MAPPING=${mapping.replace(/ = /, "=").replace(/[<>]/g, "")}`] : ["OPENASY_OIDC_ALLOWED_DOMAINS=example.com", "OPENASY_OIDC_DEFAULT_ROLE=viewer"]),
          ].join("\n")}
        />
      </section>
    </div>
  );
}

export default function SignIn() {
  const [provider, setProvider] = useState("keycloak");
  return (
    <Section className="py-12" labelledBy="title">
      <PageTitle title="Sign in with your identity provider">Every OpenAsy product signs people in with a password and an authenticator app or a passkey. To use the accounts you already have, connect your identity provider: people sign in with it, its MFA applies, and its groups can decide their role.</PageTitle>
      <Tabs label="Identity provider" value={provider} onChange={setProvider} className="mt-6" items={PRESETS.map((p) => ({ value: p.id, label: title(p.id, p.name) }))} />
      <Guide key={provider} id={provider} />

      <section aria-labelledby="none-yet" className="mt-12 rounded-xl border border-line bg-surface p-6">
        <h2 id="none-yet" className="m-0 text-xl font-semibold">
          No identity provider yet?
        </h2>
        <ul className="mt-3 flex list-disc flex-col gap-2 pl-5">
          <li>
            <Link to="/products/identity">OpenAsy Identity</Link>: single sign-on for every OpenAsy product and your other applications, with MFA per group, in one container.
          </li>
          <li>
            <a href={`${GITHUB}/auth/tree/main/examples/keycloak`}>A ready Keycloak</a>: a compose file with a realm in which every OpenAsy product is a client, with groups and a groups claim.
          </li>
        </ul>
      </section>
    </Section>
  );
}
