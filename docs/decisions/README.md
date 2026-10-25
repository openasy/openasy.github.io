# Design decisions

Architecture decision records for every OpenAsy product: what we decided, why, and what follows from it.
Decisions about how the component library is built are in [openasy/ui `docs/decisions`](https://github.com/openasy/ui/tree/main/docs/decisions).
The site shows these records at [openasy.github.io/principles](https://openasy.github.io/principles).

Each record has two statuses:

- **Decision:** `Proposed` (open for discussion), `Accepted` (this is how we build) or `Superseded by NNNN`.
  Proposed records also carry a priority: Critical, High or Medium.
- **Implementation:** `Not started`, `In progress` or `Implemented`, with **Where** naming what ships it.
  An accepted decision is a commitment, not a claim that the software already does it.

| # | Decision | Area | Decision status | Implementation |
| --- | --- | --- | --- | --- |
| 0001 | [Every product runs alone, with the others and with third-party tools](./0001-standalone-and-together.md) | Architecture | Accepted | In progress |
| 0002 | [Authentication: local accounts, MFA and single sign-on](./0002-authentication.md) | Security | Accepted | In progress |
| 0003 | [Authorization: per-product roles and scoped tokens](./0003-authorization.md) | Security | Accepted | In progress |
| 0004 | [Customization: one brand for every product, and feature switches](./0004-customization.md) | Product | Accepted | In progress |
| 0005 | [Accessibility: WCAG 2.2 AA, tested in CI](./0005-accessibility.md) | Quality | Accepted | In progress |
| 0006 | [Languages: English first, ready for translation](./0006-languages.md) | Product | Accepted | Not started |
| 0007 | [Theme: light, dark and follow the system](./0007-theme.md) | Product | Accepted | Implemented |
| 0008 | [Open source: AGPL-3.0 products, Apache-2.0 libraries, developed in public](./0008-open-source.md) | Project | Accepted | In progress |
| 0009 | [Current, supported libraries](./0009-latest-libraries.md) | Engineering | Accepted | In progress |
| 0010 | [Forward-only upgrades, no backward compatibility](./0010-forward-only-upgrades.md) | Engineering | Accepted | In progress |
| 0011 | [SQLite by default](./0011-sqlite-by-default.md) | Architecture | Accepted | Implemented |
| 0012 | [Backups, point-in-time restore and disaster recovery](./0012-backups.md) | Operations | Accepted | Not started |
| 0013 | [Secure by default](./0013-secure-by-default.md) | Security | Accepted | In progress |
| 0014 | [API-first: one public REST API per product, and how it changes](./0014-api-first.md) | Architecture | Accepted | In progress |
| 0015 | [Your data stays yours](./0015-data-ownership.md) | Privacy | Accepted | In progress |
| 0016 | [One container per product, signed](./0016-one-container-per-product.md) | Operations | Accepted | In progress |
| 0017 | [Every product can be monitored](./0017-self-observability.md) | Operations | Accepted | In progress |
| 0018 | [One application per product; agents are separate](./0018-one-application-per-product.md) | Architecture | Accepted | Implemented |
| 0019 | [Versioning: independent SemVer per product, monthly releases](./0019-versioning-and-releases.md) | Engineering | Accepted | In progress |
| 0020 | [Long-term support for Enterprise customers](./0020-long-term-support.md) | Engineering | Accepted | Not started |
| 0021 | [Secrets and key management](./0021-secrets-and-keys.md) | Security | Proposed · Critical | In progress |
| 0022 | [Privilege separation](./0022-privilege-separation.md) | Security | Accepted | In progress |
| 0023 | [Communication between products and agents](./0023-inter-product-communication.md) | Architecture | Accepted | In progress |
| 0024 | [API design and compatibility](./0024-api-compatibility.md) | Architecture | Superseded by 0014 | In progress |
| 0025 | [Disaster recovery](./0025-disaster-recovery.md) | Operations | Superseded by 0012 | Not started |
| 0026 | [Network exposure and TLS](./0026-network-exposure-and-tls.md) | Security | Proposed · Critical | In progress |
| 0027 | [Build integrity and supply chain](./0027-reproducible-builds.md) | Engineering | Proposed · High | In progress |
| 0028 | [Resource budgets](./0028-resource-budgets.md) | Operations | Proposed · Medium | In progress |
| 0029 | [Testing and quality gates](./0029-testing-and-quality-gates.md) | Quality | Accepted | In progress |
| 0030 | [Open-source governance](./0030-open-source-governance.md) | Project | Proposed · High | Not started |
| 0031 | [Nothing installed on hosts: one agent reads them](./0031-agentless-collection.md) | Architecture | Accepted | In progress |
| 0032 | [VPN servers at several locations, each with its own identity](./0032-vpn-server-enrolment.md) | Architecture | Proposed · High | In progress |
| 0033 | [Identity: an OpenID provider of our own, on node-oidc-provider](./0033-identity.md) | Architecture | Accepted | In progress |
| 0034 | [Identity meets the directories and applications teams already have: SAML, LDAP, SCIM and passkey-only groups](./0034-identity-directories-and-saml.md) | Architecture | Accepted | In progress |
| 0035 | [Logs: VictoriaLogs inside, logs sent to it or read over SSH](./0035-logs.md) | Architecture | Accepted | In progress |
| 0036 | [SAST: Opengrep scans every pull request, and only what is new blocks it](./0036-sast.md) | Architecture | Proposed · High | In progress |
| 0037 | [DAST: scanners run in an agent, and only on targets you have proven are yours](./0037-dast.md) | Architecture | Proposed · High | In progress |
| 0038 | [Secrets: a finding is where a secret was, and the secret itself is never kept](./0038-secrets.md) | Architecture | Proposed · High | In progress |
| 0039 | [Malware: scans report where a file was, and the file itself is never kept](./0039-malware.md) | Architecture | Proposed · High | In progress |
| 0040 | [SIEM: Sigma rules over events, and a signal is one rule on one host](./0040-siem.md) | Architecture | Proposed · High | In progress |
| 0041 | [Incidents: one place to run an incident, with a timeline nobody can rewrite](./0041-incidents.md) | Architecture | Proposed · High | In progress |
| 0042 | [Errors: events become issues by where they happen, and a fix that did not hold is a regression](./0042-errors.md) | Architecture | Proposed · High | In progress |
| 0043 | [Supply Chain: a store and a judge, and what it takes on trust](./0043-supply-chain.md) | Architecture | Proposed · High | In progress |
| 0044 | [Audit: dependency advisories from the scanner you run, and only what a change adds fails it](./0044-audit.md) | Architecture | Proposed · High | In progress |
| 0045 | [Posture: failed controls per target, with a score over time, from the checkers you run](./0045-posture.md) | Architecture | Proposed · High | In progress |
| 0046 | [Certificates: every certificate you send or that a public endpoint presents, and never a private key](./0046-certificates.md) | Architecture | Proposed · High | In progress |
| 0047 | [Uptime: runners check from where users are, and the server probes nothing](./0047-uptime.md) | Architecture | Proposed · High | In progress |
| 0048 | [Backups: track the jobs that make backups, and count a restore nobody tested as a risk](./0048-backups.md) | Architecture | Proposed · High | In progress |
| 0049 | [Risk: a register people keep, acceptance that ends, and a history nobody edits](./0049-risk.md) | Architecture | Proposed · High | In progress |
| 0050 | [Threat Intel: feeds in, one lookup out, and nothing dropped without a word](./0050-threat-intel.md) | Architecture | Proposed · High | In progress |
| 0051 | [Cost: spend sent by a pipeline, owners by tag or rule, and anomalies a person decides on](./0051-cost.md) | Architecture | Proposed · Medium | In progress |
| 0052 | [One list of endpoints, one of servers and one of repositories, in files every product can read](./0052-shared-inventory-files.md) | Architecture | Proposed · High | In progress |
| 0053 | [One brand for every product, from one env file](./0053-one-brand.md) | Product | Superseded by 0004 | In progress |
| 0054 | [Each product in one compose file of its own, with its settings and secrets](./0054-one-file-per-product.md) | Architecture | Proposed · High | In progress |

To propose a change, open a pull request that adds a record or changes the status of an existing one.
