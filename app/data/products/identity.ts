import type { ProductStory } from "./types";

export const identity: ProductStory = {
  problem: {
    title: "One sign-in with a second factor for every OpenAsy product and your other applications",
    headline: "Every tool with its own password is a way in",
    text: "Each tool with its own passwords means people reuse them, nobody enforces a second factor everywhere, and someone who leaves keeps access to the tools nobody remembered. Identity is the one place people sign in, with a passkey or a password and a second factor, and every application trusts it over OpenID Connect or SAML. Turn a person off once and they are out of all of them.",
    example:
      "A new engineer is added to the Engineering group, which requires a passkey. They sign in to Identity once and open VPN, Logs and Jira without signing in again. When they leave, the directory sync turns them off: their sessions end and every application refuses them at the next request.",
  },
  who: ["IT, who manage people, groups and applications", "Everyone, who signs in once", "The security team, who set the second factor and read the audit log"],
  glance: [
    {
      label: "Protocols",
      value: "OpenID Connect, SAML 2.0",
    },
    {
      label: "Second factor",
      value: "Passkeys, authenticator apps",
    },
    {
      label: "People from",
      value: "LDAP, AD, SCIM",
    },
    {
      label: "Keeps",
      value: "400 days of audit log",
    },
  ],
  flow: [
    {
      label: "People and groups",
      detail: "Invited, synced from LDAP or Active Directory, provisioned over SCIM, or from another identity provider.",
    },
    {
      label: "One sign-in",
      detail: "A passkey, or a password and an authenticator app, or an upstream provider such as Microsoft Entra ID.",
    },
    {
      label: "Applications trust it",
      detail: "OpenAsy products and any OpenID Connect or SAML 2.0 application, each open to everyone or chosen groups.",
    },
    {
      label: "Recorded",
      detail: "Every sign-in, refusal and change, with who made it, kept 400 days.",
    },
  ],
  checks: [
    {
      title: "Protocols",
      items: [
        "OpenID Connect provider, OpenID Certified, with PKCE for every application",
        "SAML 2.0 for applications such as AWS IAM Identity Center, Jira and GitLab",
      ],
    },
    {
      title: "Second factor",
      items: ["Authenticator apps and passkeys", "Required per group, or a passkey only", "People without one are asked to add it, then continue"],
    },
    {
      title: "Where people come from",
      items: [
        "Invitations",
        "LDAP and Active Directory, read on a schedule",
        "SCIM 2.0 from Okta and Microsoft Entra ID",
        "Groups that follow a group at an upstream identity provider",
      ],
    },
  ],
  decides: [
    {
      label: "Applications",
      text: "An application is open to everyone or only to chosen groups.",
    },
    {
      label: "Second factor",
      text: "A group can require a second factor, or accept only a passkey, for its members' sign-ins to applications.",
    },
    {
      label: "Leavers",
      text: "Someone turned off in the directory or over SCIM is turned off here, and their sessions end.",
    },
    {
      label: "Sign-out",
      text: "Signing out of Identity signs people out of the next application request too.",
    },
  ],
  inputs: [
    {
      name: "oidc-provider",
      url: "https://github.com/panva/node-oidc-provider",
      how: "The OpenID Connect implementation Identity is built on.",
    },
    {
      name: "LDAP and Active Directory",
      how: "Read on a schedule; passwords are checked by binding as the person and never stored.",
    },
    {
      name: "SCIM 2.0",
      how: "Okta and Microsoft Entra ID create, change and remove people and groups.",
    },
  ],
  screens: [
    {
      page: "overview",
      title: "Overview",
      shows: "Sign-ins over time, how many people use a second factor, and recent refusals.",
    },
    {
      page: "applications",
      title: "Applications",
      shows: "Every OpenID Connect and SAML application and who may use it.",
      story: "applications",
    },
    {
      page: "people",
      title: "People",
      shows: "Everyone, their groups, second factor and last sign-in.",
      story: "users-list",
    },
    {
      page: "audit",
      title: "Audit",
      shows: "Sign-ins, refusals and changes with who made them.",
      story: "audit-log",
    },
  ],
  worksWith: [
    {
      id: "vpn",
      how: "VPN has a template under Applications that fills in its callback address; so do Infrastructure and Vulnerabilities.",
    },
    {
      id: "vulnerabilities",
      how: "Every OpenAsy product signs people in through Identity, with the groups it sends.",
    },
    {
      id: "logs",
      how: "The audit log is also written as JSON lines a shipper can send to Logs.",
    },
  ],
  limits: [
    "It is not a directory of its own for your whole company: it reads LDAP or Active Directory, or takes SCIM.",
    "Directory passwords never reach its database.",
    "There is no email yet: invitations and password resets are links an admin sends.",
  ],
};
