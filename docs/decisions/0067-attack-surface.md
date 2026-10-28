# 0067. Attack Surface: only proven roots, passive discovery, a light check and the changes since the last scan

- **Decision:** Proposed
- **Implementation:** In progress
- **Where:** `attack-surface` scans domains whose owner published a TXT record with its token, and address ranges an admin added with a reason: subdomains from DNS and certificate transparency, a TCP connect to 30 common ports, the certificate and protocols on TLS ports and one `GET /` on web ports, with the changes since the scan before as its first screen (`ghcr.io/openasy/attack-surface`). Links to DAST, Certificates and Vulnerabilities, domain registration, look-alike domains and the endpoints file are planned.
- **Priority:** High
- **Area:** Architecture

## Context

Attackers start with what they can reach: a forgotten staging subdomain, a database port opened for a test, an old admin panel, a certificate that ends on Sunday. Most organisations have no complete list of what they expose, and the list changes every week. Finding it means looking from the outside, as an attacker would.

That makes the tool dangerous in the wrong hands or with the wrong address. A scanner pointed at someone else's domain is an attack on them; one that follows every name it finds walks from a customer's certificate into a partner's network; one inside an install can be turned on the install's own network or a cloud's metadata service. Testing applications with payloads is DAST's work (ADR 0037), and needs a proof of ownership too.

## Decision

- **Only proven roots are scanned.** A domain is a root only while `_openasy-attack-surface.<domain>` has the TXT record `openasy-attack-surface-verification=<token>`, with a random token Attack Surface gives, as Let's Encrypt and Google ask. Every scan reads the record again first; a domain whose record has gone is lost and not scanned until it is back. Address ranges are added only by an admin, with a reason kept in the audit log, at most 256 addresses each and none overlapping.
- **Names outside the roots are shown and left alone.** A name on a certificate, a CNAME target, a mail or name server outside every verified domain is listed with where it was seen, and never resolved or connected to.
- **Every connection passes one check.** Right before it connects, the scanner asks whether the name is under a verified domain, or the address is in a range, and whether the address is refused. Loopback, link-local and multicast addresses are refused always; private ones unless the install allows them, for a lab. A public name on a private address is noted, not probed.
- **Discovery is passive.** The verified domains' DNS records and the names their certificates were issued for, from certificate transparency (crt.sh by default). No word lists, no brute force, no zone transfers. A name that resolves to nothing is not an asset, unless a CNAME still points away from it: that is a takeover candidate.
- **The check is light.** A TCP connect, never a SYN or stealth scan, to a short list of ports, with what the server sends first kept as its banner. On TLS ports a handshake reads the certificate, and one offering only TLS 1.0 and 1.1 tells whether they are taken; on web ports one `GET /` reads status, headers and title. No password is tried, no path guessed, no payload sent. A whole scan makes at most 10 new connections a second by default, connects to each address and port once, and names itself in its User-Agent.
- **Exposures are what was seen**, not guesses from a version: databases and remote access open, the Docker API in the clear, certificates expired, expiring, untrusted or for another name, weak keys and old protocols, plain HTTP, login pages, missing security headers, dangling CNAMEs, mail without SPF or DMARC. Each is the same exposure across scans, by its rule, asset and port.
- **Changes are the first screen.** Each scan is compared with the last one of the same roots: a host, a port or an exposure that appeared or went, addresses changed, a certificate replaced, or one that crossed a threshold of `OPENASY_CERT_WARN_DAYS` (ADR 0052), reported once per threshold. Editors acknowledge them. A root that was not scanned, because its record went, keeps what was last found, and nothing of it is reported as gone.
- **Roots stay in the product.** Domains and ranges are not endpoints: a domain needs a token only this install gives and a check before every scan, and a range needs a reason from an admin. They are added in the UI and the API, and every one added, verified, lost or deleted is written to an append-only audit log (ADR 0013).
- **SQLite holds it all** (ADR 0011). Attack Surface keeps no secret of its own: the token is published in DNS and no target needs a password.

## Consequences

- Nobody can point Attack Surface at a domain they do not control, and an admin who adds a range puts their name and reason to it.
- What is found is what anyone on the internet can find, no more: a service that answers only to a path or a password is not seen, which is where DAST and Vulnerabilities start.
- Certificate transparency is slow and sometimes down; a scan then goes on with DNS alone and says so.
- A name behind a CDN or a shared host is probed at that address as the name, on the short port list: the owner points the name there, and nothing more is touched.
- Assets are not yet matched with the endpoints file, and a discovered web application does not yet become a DAST target; both need links between products (ADR 0001).
