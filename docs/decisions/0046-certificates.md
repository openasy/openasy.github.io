# 0046. Certificates: every certificate you send or that a public endpoint presents, and never a private key

- **Decision:** Proposed
- **Implementation:** In progress
- **Where:** `certificates` keeps an inventory of X.509 certificates sent as PEM or read from public endpoints with a TLS handshake, with their state, warnings, chain and where they were seen (github.com/openasy/certificates, to be released as `ghcr.io/openasy/certificates`). ACME renewal is planned.
- **Priority:** High
- **Area:** Architecture

## Context

An expired certificate takes a service down as surely as a crash, and it is always a surprise because nobody owns the date. Certificates live in load balancers, ingress controllers, appliances, mail servers and files on hosts, issued by Let's Encrypt, an internal CA and a vendor or two. The question is simple: which certificates do we have, where, and which end soon or are weak?

Two ways to find them are common. Scanners connect to addresses and read what they present; agents read files on hosts. Both have a cost. A scanner that reaches anything the server can reach is a way into the internal network for whoever can add an address. Reading files means handling the directories where private keys also live.

## Decision

- **Certificates arrive two ways.** Cron jobs, CI and collectors send PEM text, one certificate or a chain, with where it was found. And an admin can add a public endpoint, which the server reads with a TLS handshake every 6 hours.
- **A private key is never accepted.** A body that holds a private key of any kind is refused whole, before it is read and without repeating any of it. Only public certificates are kept.
- **Endpoints are public addresses only.** A name that resolves to a private, loopback or link-local address is refused when it is added and again at every probe, so a name that changes its address later cannot be used to reach inside. Certificates on private networks are sent by a collector there.
- **A certificate is its SHA-256 fingerprint.** The same certificate seen in many places is one entry with each place and its position in the chain. What signed it is shown as its chain, among the certificates seen here.
- **State** is expired, critical (under 7 days), expiring (under the largest threshold, 30 days by default), not yet valid or valid. **Warnings** are a weak key (RSA under 2048 bits), a weak signature (SHA-1 or MD5), a wildcard, a self-signed leaf and a leaf valid for more than 398 days.
- **Each crossing is reported once.** A certificate is reported for the tightest threshold it has crossed (30, 14, 7, 1 and 0 days by default), not again for the wider ones, so a scheduled alert that asks with `since` sends one message per step.
- For an endpoint, whether the system's roots trust the chain and it fits the name is reported apart from expiry.
- Endpoints can also come from the install's endpoints file, shared with Uptime, and the thresholds from `OPENASY_CERT_WARN_DAYS` (ADR 0052).

## Consequences

- The product reads X.509 itself and reaches endpoints with Node's TLS; it needs no scanner and no outbound access beyond the endpoints it is given.
- An inventory is as complete as what is sent. A collector per network is the way to see private certificates, and the README says so.
- Renewing certificates with ACME, and a collector that reads a host's certificate directories without touching keys, follow.
