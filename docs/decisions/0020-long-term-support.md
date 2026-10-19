# 0020. Long-term support for Enterprise customers

- **Decision:** Accepted
- **Implementation:** Not started
- **Where:** No product has reached 1.0.
- **Area:** Engineering

## Context

Monthly releases (ADR 0019) suit most teams, but some cannot upgrade every month: change windows, audits and certified environments ask for a version that stays put and still gets security fixes. Maintaining old versions for everyone is a heavy promise for a small team, so it is offered where it is paid for.

## Decision

- There is no public LTS. The public supports only the latest release (ADR 0010, 0019).
- Enterprise support customers (ADR 0008) can ask for a long-term line of a product, from 1.0 on: one `MAJOR.MINOR` per year, for example `1.4`.
- A long-term line gets fixes for high and critical security issues for 12 months. Other bugs are fixed only in the latest release.
- A fix lands on `main` first and is then cherry-picked to the `lts/X.Y` branch and released as a PATCH (`1.4.7`). A long-term patch never adds a database migration; a fix that needs one ships only in the latest release, and the release notes say so.
- Long-term patches are public releases like any other, so the code stays the same for everyone. What Enterprise customers pay for is the promise to make them.
- Upgrades stay forward-only (ADR 0010). From a long-term line you can upgrade to the next long-term line or to the latest release in one step.
- An agent follows its product's line: `vpn-server 1.4.x` runs with `vpn-manager 1.4.x` (ADR 0018).
- Image tags do not change: the `X.Y` tag (`1.4`) follows the line and there is still no `latest` tag. Long-term images carry the labels `org.openasy.lts=true` and `org.openasy.lts.eol=<date>`.

## Consequences

- The release workflow accepts tags only from `main` or an `lts/X.Y` branch, and an LTS branch records its end-of-life date in `.github/lts-eol`.
- A long-term line starts only when an Enterprise customer needs it, so the work grows with paying customers, not with the number of products.
