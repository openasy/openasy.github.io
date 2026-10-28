# 0065. Endpoints: osquery is the agent, with a fixed pack on the device and no query from the server

- **Decision:** Proposed
- **Implementation:** In progress
- **Where:** `endpoints` takes enrolments and results from osquery's own TLS enroll and logger plugins, keeps the last answer of each query of its pack, checks disk encryption, the operating system version, the firewall and the screen lock against one policy with grace periods and exceptions, and lists hardware, local accounts and software (`ghcr.io/openasy/endpoints`). The pack is `osquery/osquery.conf`, installed on each device. There is no `endpoints-agent`. Live queries, the firewall and screen lock on Linux, owners from Identity and revoking a lost laptop's VPN device are planned.
- **Priority:** High
- **Area:** Architecture

## Context

Laptops leave the office and get lost. Whether a lost one is a breach depends on facts only the laptop knows: an encrypted disk, a recent operating system, a screen that locks. Servers are read over SSH (ADR 0031); a laptop is behind a home router or a café's network, so it has to report on its own, and something has to be installed on it.

osquery already runs on macOS, Windows and Linux, reads all of these as SQL tables, and speaks a TLS protocol for enrolment, configuration, results and live queries that fleet managers implement. Writing collectors of our own for three operating systems would repeat it worse. But that protocol also lets the server send any query to every device at any time, and a query can read any file the root account can. A product that can do that is a way into every laptop of the company for whoever controls it.

ADR 0052 calls the entries of `OPENASY_ENDPOINTS` endpoints: addresses that Uptime and Certificates check. The devices of this product are not those entries, and no file lists them: laptops enrol themselves, and a list of them kept by hand is out of date the day it is written.

## Decision

- **osquery is the agent.** A device runs osquery's own package with three files next to it: `osquery.flags`, the pack as `osquery.conf`, and `enroll_secret`. Nothing of OpenAsy is installed on it.
- **The pack is a file on the device, and the server never sends a query.** osquery reads its configuration from the file (`--config_plugin=filesystem`); distributed queries, file carving, extensions and events are off in the flags. Endpoints implements only osquery's enroll and logger endpoints, never its config or distributed ones. The pack's queries are `SELECT`s on tables that stay on the device, a test keeps them so, and the setup page shows each one with its SQL. A compromised Endpoints can refuse or forget a device; it cannot make one read anything else, run a command, lock or wipe it. A new pack reaches a device the way the files first did, and the product shows which devices run an older one.
- **Snapshots, not differences.** Every query sends its whole answer (`snapshot: true`) every 15 minutes for the checks and every hour for the inventory and software, with the pack's version as a decoration. Endpoints keeps the last answer of each query, never replaces it with an older one, and drops results of any query that is not in the pack.
- **Enrolment as in ADR 0032, for a fleet.** An admin makes an enrolment secret, shown once and stored as a hash, valid 90 days unless set and at most a year. Many devices enrol with one secret; each gets a node key of its own, also stored as a hash, so revoking the secret stops new devices only. A device is found again by its hardware UUID (`--host_identifier=uuid`); a UUID that is enrolled already does not enrol again until an admin allows it once, so a copied secret cannot take over another device's record. Refusals are answered as osquery expects and recorded once an hour per device.
- **Four checks, one policy.** Disk encryption (FileVault, BitLocker on C:, an encrypted disk under `/`), the operating system against a minimum for macOS, a Windows build and each Linux distribution the policy names, the firewall and the screen lock. A check that core osquery cannot read on a platform, the firewall and screen lock on Linux, is not checked there rather than guessed. A device is compliant when every enabled check that applies passes; a failing check blocks at once (disk encryption by default) or leaves the device at risk for a grace period, 7 days by default; it is pending until osquery has answered. A device that stops checking in is stale and keeps what it last reported. A change to the policy is applied to what devices already reported, and a check that starts failing then starts its grace period then.
- **Exceptions, with a reason and an end.** An admin lets a failing check on one device count as passing until a date within a year. It is kept with who and why.
- **Software as osquery lists it.** `apps`, `programs`, `deb_packages` and `rpm_packages`, by name across devices, with the newest version any device has. Not being on it is a sign, not an advisory; vulnerable versions come from Vulnerabilities once the products are linked (ADR 0001).
- **The same ways in as every product.** Sessions and API tokens with roles (ADR 0003): viewers read, editors set who uses a device, admins keep the policy, exceptions and secrets and remove devices. An append-only audit log of every enrolment, refusal, change and sign-in (ADR 0013), a public OpenAPI description (ADR 0014), metrics (ADR 0017), and sign-in secrets sealed with the install's key, without which it does not start (ADR 0021).
- **Not the endpoints file.** Endpoints reads neither `OPENASY_ENDPOINTS` nor `OPENASY_HOSTS` (ADR 0052), and its variables are `ENDPOINTS_*`. No form or API route adds a device.

## Consequences

- An install sees its laptops without trusting Endpoints with them: the worst a compromised Endpoints can do to a device is ignore it.
- There are no live queries. Asking the fleet a new question means a new pack on every device, which takes the device management that put the files there. This is the price of the decision above; a later record may add a separate, opt-in pack of saved queries that a device's own admin installs.
- osquery connects only over TLS, so devices reach Endpoints through the proxy at `ENDPOINTS_PUBLIC_URL` (ADR 0026), and a proxy with an internal CA needs `--tls_server_certs` on each device.
- osquery runs as root and could read more than the pack asks; the pack and the flags are what limit it, and they are files an admin of the device can read.
- A device's software, accounts and serial number name people. They are shown to everyone who can read the product and are removed with the device (ADR 0015).
- The Windows queries follow osquery's table schema and are tested against a fixture; the macOS and Linux ones were run on real devices and in the end-to-end test.
