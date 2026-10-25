# 0033. Identity: an OpenID provider of our own, on node-oidc-provider

- **Decision:** Accepted
- **Implementation:** Implemented
- **Where:** `identity` has the OpenID provider on oidc-provider, applications with templates for OpenAsy products, people with the user role of `@openasy/auth` 0.3.0, groups that can follow a provider's groups, a second factor per group and the audit log, released in 0.1.0. `@openasy/auth` 0.2.0 added the provider presets and Settings, Sign-in, which every product now has. `auth/examples/keycloak` is the ready Keycloak, signed in through in CI. Passkey-only groups, SAML, LDAP and SCIM followed in ADR 0034.
- **Area:** Architecture

## Context

Every OpenAsy product signs people in on its own and can use an identity provider over OIDC (ADR 0002). Teams without one have no single sign-on across products, no single place to turn MFA on, and no single place to switch a leaver off. Teams with one, often Keycloak, Entra ID, Okta or Google, need help connecting it: today each product takes one provider from environment variables, and the steps differ per provider.

Identity fills both needs. It is a provider for OpenAsy products and any other application, and it can sit in front of the provider a team already has. It must follow the rules every product follows: one container, its data in one SQLite file (ADR 0011), secrets sealed with a key kept outside the volume (ADR 0021), and small enough to run on a small server (ADR 0028).

The options were to wrap an existing identity server or to build on a library:

- **Keycloak** is the most complete, with SAML, LDAP and federation built in. It needs Java, half a gigabyte of memory or more, and PostgreSQL, and its own administration model would sit under ours.
- **Zitadel** and **Authentik** are lighter or more modern, but both need PostgreSQL, and Authentik also Redis.
- **node-oidc-provider** is an OpenID Certified implementation of the provider side of OpenID Connect, for Node, under the MIT licence. It has no storage and no user interface of its own: both are ours to supply.

## Decision

- Identity is built on node-oidc-provider, in the same stack as the other products: Node, SQLite, one container, `ghcr.io/openasy/identity`.
- People, passwords, authenticator apps, passkeys and recovery codes come from `@openasy/auth`, so every product signs people in the same way. The provider's signing keys and client secrets are sealed with `openasy-kek` and rotate without breaking sessions.
- The first release offers OpenID Connect with discovery, authorization code with PKCE, refresh tokens and RP-initiated logout. Its screens follow the design in Storybook:
  - applications, with a template for each OpenAsy product that fills in the redirect address and the groups claim;
  - users, and groups that decide who may sign in to which application;
  - MFA policies, for everyone or per group, including passkeys only;
  - upstream providers (Keycloak, Entra ID, Okta, Google, Authentik, Zitadel), with sign-in creating the person the first time and groups read from nested claims;
  - an audit log of sign-ins and changes.
- The provider settings for Keycloak, Entra ID, Okta, Google, Authentik and Zitadel live in `@openasy/auth`. Identity's upstream providers and the sign-in settings of every product use the same ones, so a team that keeps its provider gets the same help as one that uses Identity.
- OpenAsy also ships a ready Keycloak for teams that want one: a compose file with a realm in which every OpenAsy product is a client, with groups and role mappings set. CI signs in to each product through it, which is the real-server test ADR 0002 requires.
- SAML 2.0, LDAP and Active Directory, SCIM and single sign-on for VPN connections come after the first release, each with its own record.
- When the products sign in through Identity (`OPENASY_OIDC_PROVIDER=openasy-identity`), Identity keeps the person and the products show what it keeps:
  - Account and Members in a product send the browser to Identity's Account and People pages. Who has which role follows Identity's groups.
  - The theme and the language are kept with the person in Identity. A product's pages read them when they open and whenever the person comes back to them, and send a choice made in the product to Identity, so a change made anywhere shows everywhere. The name shown is Identity's too.
  - The pages call Identity with its own session cookie: Identity allows the origins of its applications (CORS), and each product's content security policy names Identity in `connect-src`.
- Without Identity, each product keeps the theme and the language with the person itself, so they follow the person from browser to browser.

## Consequences

- Identity holds the keys every application trusts. The keys are sealed and rotated, the provider follows the certified library's defaults, and changes to applications and providers are in the audit log.
- We own the user interface and the storage, so they follow our design and our backup and upgrade rules; we also own their bugs. The protocol itself stays in a certified library.
- Each product keeps signing people in on its own (ADR 0001): Identity is one provider among others, never a requirement.
- Applications that need SAML wait for its record, or use Keycloak in front of Identity meanwhile.
- The theme and the language reach a product only when it shares a site with Identity, such as `id.example.com` and `vpn.example.com`: browsers send Identity's cookie only then. Elsewhere each browser keeps its own, and Account and Members still lead to Identity.
- A role changed through Identity's groups takes effect at the person's next sign-in to the product, as before; the theme, the language and the name do not wait for it.
