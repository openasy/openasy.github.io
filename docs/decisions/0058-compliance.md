# 0058. Compliance: controls judged on what the products serve at /metrics, with evidence by hand for the rest

- **Decision:** Proposed
- **Implementation:** In progress
- **Where:** `compliance` reads each product's `/metrics`, judges checks on the numbers, and maps them to the controls of ISO 27001, SOC 2, GDPR and PCI DSS, with owners, statements of applicability, evidence added by hand and a report per framework (`ghcr.io/openasy/compliance`). Audits with their own scope and policies are planned.
- **Priority:** Medium
- **Area:** Architecture

## Context

An audit asks for proof that controls work: backups are restored, vulnerabilities are fixed, logs are kept. The proof already exists in the products that do the work, and every OpenAsy product already serves its state as numbers at `/metrics` for Prometheus (ADR 0026). Reading each product's API instead would need a token per product and a client per API, and would break with each of them.

## Decision

- **Evidence is read from `/metrics`.** Compliance reads `<address>/metrics` of each product in `OPENASY_PRODUCTS`, or the address `COMPLIANCE_SOURCES` gives when a product serves metrics on a port of its own. Nothing is sent to compliance, and it holds no token of another product.
- **A check is a number and what it must be**: a metric, label matchers, a sum, minimum or maximum, and equal, at most, at least, or a time no older than. The checks ship with the product, so every install judges the same way and a report can say exactly what was checked.
- **Controls map to checks.** Each framework's controls name the checks that prove them. Checks of a product the install does not have are left out; a control no installed product proves needs evidence by hand. A control that software cannot prove asks for evidence by hand from the start.
- **A control passes** when every check of an installed product passes and its evidence by hand is there and has not ended; it fails when a check fails; otherwise it needs evidence. A check whose product could not be read keeps its last value but does not count as passing.
- **Evidence by hand** is a title, a link to where the document is, and the day it counts until, a year by default. Files are linked, not uploaded.
- **A control may not apply**, with a reason, as in a statement of applicability, and has an owner.
- **Each read keeps the day's tally** of each check and each framework, so the report and the screens show whether a control held over the last 90 days, not only today.

## Consequences

- A product adds evidence by serving a number; compliance adds a check for it. Products that serve none yet, such as Identity, leave their controls to evidence by hand.
- The proof is as fresh as the last read, 15 minutes by default.
- Compliance collects evidence and does not certify anything; the auditor does.
