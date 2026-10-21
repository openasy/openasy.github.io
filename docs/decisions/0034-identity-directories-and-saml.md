# 0034. Identity meets the directories and applications teams already have: SAML, LDAP, SCIM and passkey-only groups

- **Decision:** Accepted
- **Implementation:** In progress
- **Where:** `identity` answers SAML 2.0 applications on samlify, reads LDAP and Active Directory on ldapts, takes people and groups over SCIM 2.0, and lets a group accept only a passkey; `@openasy/auth` 0.4.0 records which factor opened a session and lets another directory keep some people's passwords. CI reads a real lldap server. Released in identity 0.1.0, with `@openasy/auth` 0.4.0. Single sign-on for VPN connections is not started.
- **Area:** Architecture

## Context

ADR 0033 made Identity an OpenID provider and left four things for later, each with its own record. They are what teams ask for once Identity is in front of their applications:

- Some applications speak only SAML 2.0, among them AWS IAM Identity Center, older Jira and GitLab installations. Without SAML, these teams keep a second identity provider for them.
- Many teams keep their people in Active Directory or another LDAP directory, and their passwords there. Inviting each person again, with a new password, is not an option.
- Teams on Okta or Microsoft Entra ID want leavers switched off in every application when they leave there, not at their next sign-in. Both send people and groups over SCIM 2.0.
- Groups that hold the most access, such as people who administer production, should sign in with a passkey only, which cannot be phished. A second factor of any kind is not enough for them.

The rules from ADR 0033 still hold: one container, one SQLite file, secrets sealed with `openasy-kek`, small enough for a small server, and the protocol in a library rather than our own code where a good one exists.

## Decision

- **SAML 2.0:** Identity is a SAML identity provider with HTTP-Redirect and HTTP-POST sign-in, SP-initiated and from Identity. samlify signs; Identity writes the response, with an AuthnStatement and the attributes `email`, `name` and `groups`. It signs both the response and the assertion with RSA-SHA256, with a key and certificate made on first start and sealed with `openasy-kek`. Each application is registered with its entity ID and ACS address, and Identity answers only at the registered address, never at one a request names. Requests that carry a document type are refused. AWS IAM Identity Center has a template.
- **LDAP and Active Directory:** owners add a directory under Settings, Directories. Identity reads it on a schedule with ldapts: people found get the user role, people gone or disabled there are turned off and signed out, and groups that match a filter follow it. People sign in with the directory's password, checked by binding as them; it never reaches Identity's database and cannot be changed here. Plain `ldap://` must use StartTLS.
- **SCIM 2.0:** `/scim/v2` takes Users and Groups as Okta and Microsoft Entra ID send them, with a token made under Settings, Provisioning and shown once. Turning someone off ends their sessions, and with them their applications. Groups SCIM sends belong to it; their members cannot be changed by hand.
- **Passkey-only groups:** a group can require a second factor or a passkey. `@openasy/auth` records which factor opened each session, so Identity can tell a passkey from an authenticator app. Members without one add it and continue.
- **The people who manage Identity** (owners, admins, editors and viewers) are never changed by a directory or by SCIM. Neither can lock them out of Identity.
- Every SAML sign-in, refusal, directory read and SCIM change is in the audit log.

## Consequences

- Teams can move applications, directories and provisioning to Identity without a second identity provider beside it.
- Identity now holds a second signing key, for SAML. Applications pin its certificate, which is valid for ten years. Rotating it means each application takes the new certificate, so this is a manual step for now.
- Identity does not check signatures on SAML requests: it trusts only the registered ACS address and signs what it sends. Single logout over SAML is not offered; signing out of Identity does not sign anyone out of a SAML application.
- A directory that is unreachable stops its people's sign-in, because their passwords are checked there. People and groups already read stay as they are until the next successful read.
- Single sign-on for VPN connections stays for its own record.
