# 0050. Threat Intel: feeds in, one lookup out, and nothing dropped without a word

- **Decision:** Proposed
- **Implementation:** In progress
- **Where:** `threat-intel` keeps indicators from STIX 2.1, CSV and text feeds, answers lookups from the other products, and keeps an allow list with reasons (github.com/openasy/threat-intel, to be released as `ghcr.io/openasy/threat-intel`). Pulling TAXII feeds itself is planned.
- **Priority:** High
- **Area:** Architecture

## Context

SIEM wants to know whether an address in a log is a known command-and-control server; VPN, WAF and DAST want the same about the addresses and domains they see. Indicator feeds exist, from OpenCTI and MISP exports to plain blocklists, and they come in STIX 2.1, CSV or one value per line. What each product should not do is fetch and parse its own copy of every feed.

STIX patterns can say far more than a list of values: AND across objects, sequences in time, ports and processes. An importer that keeps what it understands and silently drops the rest gives an analyst a false sense of coverage.

## Decision

- **Feeds are sent, not fetched.** A job sends each feed with the ingest token, in the feed's kind: a STIX 2.1 bundle, a CSV with a value column, or one value per line. Manual feeds take indicators one at a time. The product needs no outbound access.
- **From STIX, patterns of `=`, `IN` and `ISSUBSET` on addresses, domains, URLs, email addresses and file hashes, joined by OR**, become indicators, with their confidence, validity, TLP marking, labels and revocation. Everything else is named in the import's answer with its reason, and never dropped without a word.
- **Values are stored in one form**: defanged values are read, domains lowercased and converted to punycode, IPv6 compressed, the host bits of a block cleared, credentials dropped from URLs. An address with leading zeros, which software reads differently, is refused, and an address given as a domain is refused rather than stored where it would never match.
- **One lookup for every product.** An address also matches the blocks that hold it, and a domain its parents added with their subdomains. Only active indicators count. The verdict is malicious at confidence 60 or more, suspicious below, unknown when nothing matches (which is not the same as safe), and allowed when the allow list has it.
- **The allow list needs a reason and an end** within a year, because a decision without a reason is lost the day its author leaves.
- **TLP:RED is for named recipients.** Editors, admins and the ingest token see it; for viewers it does not exist, in lists, pages and lookups alike.

## Consequences

- The other products call one API and get the same answer for the same value.
- STIX patterns with AND or across objects need a correlation engine, which is SIEM's job, not an indicator store's.
- A feed is only as fresh as the job that sends it. Pulling TAXII collections on a schedule, and enrichment such as ASN and geolocation, follow.
