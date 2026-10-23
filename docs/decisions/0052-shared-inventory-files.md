# 0052. One list of endpoints and one of servers, in files every product can read

- **Decision:** Proposed
- **Implementation:** In progress
- **Where:** `uptime` and `certificates` read the endpoints file (`OPENASY_ENDPOINTS`) and share the certificate thresholds (`OPENASY_CERT_WARN_DAYS`). `infra` and `logs` read the hosts file (`OPENASY_HOSTS`) and reach its servers; `vulns`, `posture`, `malware` and `backups` read it to show the servers they have nothing for.
- **Priority:** High
- **Area:** Architecture

## Context

Several products watch the same things. Uptime checks an endpoint and Certificates reads the certificate on the same endpoint; Infrastructure and Logs both reach the same servers over SSH, and Vulnerabilities, Posture and Malware report on them too. Each kept its own list, so the same endpoint or server was typed into every product, the lists drifted apart, and two products could disagree about the same certificate and alert on it twice.

ADR 0001 says products link with a token and share nothing until linked, but no link is built yet, and an install that runs two products should not need one just to agree on what exists. Many teams already keep this list in git and want to review changes to it like code.

## Decision

- **Two files, each with one list, mounted read-only into the products that want them.** `OPENASY_ENDPOINTS` names a YAML file of endpoints (`name`, `url` with `https://`, `http://`, `tcp://`, `dns://` or `tls://`, and optional `group`, `server`, `public`, `every`, `expect`, `tags`). `OPENASY_HOSTS` will name a file of servers (VPS, dedicated or virtual). The variables have the same names in every product, like `OPENASY_PRODUCTS`. Without them a product works as before.
- **Each product takes what it needs.** Uptime checks every endpoint; Certificates reads the certificate of `https://` and `tls://` ones. Infrastructure and Logs reach every server over SSH. Vulnerabilities, Posture, Malware and Backups are sent what they know about servers by agents and CI, so they show which servers in the file they have nothing for: one nobody scans or backs up is the gap a list in one place makes visible. Fields one product does not use are left alone by the others.
- **A server's key can be vouched for in the file.** `hostKey` is a fingerprint as `ssh-keygen -lf` prints it: a host that presents that key is trusted without an admin, one that presents another waits and cannot be accepted in the UI until the file changes. Without it, an admin compares the key as for any host. Whoever can change the file can already change the install, so this adds no new trust.
- **A server may use a fixed key.** `auth: key` uses a fixed key instead of a certificate, and `keyFile` names a private key in the agent's key folder, never a path, so the key stays with the agent (ADR 0031). Products that do not reach servers accept both and leave them alone.
- **Each product names its own agents alike.** `agent: dc1` is the agent named dc1 in each product that reaches servers; with one agent it may be left out. A server whose agent is not there yet is added once it is.
- **The files refer to each other by name.** An endpoint's `server` is a server's `name` in the hosts file. With only the endpoints file, the name is shown as a label; with both, an unknown name is a warning, not an error, because the files change at different times.
- **The file owns its entries.** An entry is found again by its name. Entries from the file show where they came from and are changed there: the API answers 409 to a change or a delete, while operational actions such as pausing a check or probing an endpoint still work. Entries added in the UI stay as they are, so the file is one way of adding things, not the only one.
- **A file is applied whole or not at all.** It is read at start and again within a minute of a change. A file with a mistake leaves its last good version in place, and the product says which entry and field to fix in its log and on the page that lists the entries.
- **Certificate thresholds are shared too.** `OPENASY_CERT_WARN_DAYS` (30, 14, 7 and 1 days by default) sets when Certificates warns; Uptime's TLS checks fail at the critical one, 7 days or the largest value when it is less. Certificates warns early and Uptime marks the check as failing only when it is urgent, so the two do not alert on the same certificate at the same step.
- **The reader is copied, not shared as a library.** Each product that reads a file keeps the same reader and the same test file, so they cannot read one entry differently.

## Consequences

- An install keeps its endpoints and servers in one place, in git if it likes, and every product agrees on them without a link or a token between products.
- Removing an entry removes what the product built from it; in Uptime that includes the check's results. A renamed entry is a new one.
- The file can name an endpoint on a private address. Uptime's runners can reach it; Certificates' server still refuses to, at every probe, and shows why (ADR 0046).
- Links between products (ADR 0001) are still the way to share what the products find, such as a certificate a runner saw, once they are built.
