# 0002. Authentication: local accounts, MFA and single sign-on

- **Decision:** Accepted
- **Implementation:** In progress
- **Where:** `@openasy/auth` 0.1.0 has the first wave: local accounts, TOTP, passkeys, recovery codes, OIDC, sessions, members and API tokens. `vulns` and `vpn` use it. The other methods are planned.
- **Area:** Security

## Context

Small teams want to start without an identity provider; larger ones require their own IdP and MFA everywhere.

## Decision

- Every product supports local accounts with MFA (TOTP and passkeys/WebAuthn). MFA is required for owners and admins.
- Every product can instead use an identity provider. The Identity product is one such provider and gives single sign-on across all OpenAsy products.
- Sessions are short-lived, bound to the device, and can be revoked from the product or from Identity.
- Sign-in is written once, in the `@openasy/auth` library (Apache-2.0, like `@openasy/ui`), and every product embeds it. Each method is a module that turns a sign-in into the same identity (provider, subject, email, groups), so MFA, sessions, role mapping and the audit log work the same whatever the method.
- Methods ship in waves:

  | Wave | Methods | Status |
  | --- | --- | --- |
  | 1 | Local accounts, TOTP, passkeys, recovery codes, OIDC | Built in `@openasy/auth` 0.1.0 |
  | 2 | Trusted proxy headers (oauth2-proxy, Authelia, Cloudflare Access), LDAP and Active Directory, SAML 2.0 | Planned |
  | 3 | GitHub and GitLab sign-in, email magic links, client certificates | Planned |

- Every method except local accounts is off until an admin turns it on. A trusted proxy header is accepted only from the proxy's configured addresses.

## Consequences

- The sign-in screen is shared by all products and adapts to the configured methods.
- People who sign in through an identity provider use its MFA; the product does not ask for a second factor of its own.
- A session is bound to the browser and operating system it was opened on (the User-Agent without version numbers): a cookie used from another one ends the session and is logged. Binding to a key held by the device (Device Bound Session Credentials) follows when browsers support it widely.
- `@openasy/auth` ships the OpenAPI description of its routes; every product's API reference includes it.
- A sign-in through an identity provider is linked to an existing person only by an email the provider has verified.
- Every method is tested against a real server of its kind (an OIDC provider, an LDAP directory, a SAML IdP), including the failure cases (ADR 0029).

## Where you can see it

- [Sign-in](https://openasy.github.io/ui/?path=/story/identity-sign-in--default)
- [MFA step](https://openasy.github.io/ui/?path=/story/identity-sign-in--mfa-step)
- [Identity providers](https://openasy.github.io/ui/?path=/story/products-identity--providers)
