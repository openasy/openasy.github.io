# 0044. Audit: dependency advisories from the scanner you run, and only what a change adds fails it

- **Decision:** Proposed
- **Implementation:** Implemented
- **Where:** `audit` reads osv-scanner JSON and SARIF from Trivy, Grype or osv-scanner, compares each scan with the default branch, keeps decisions and a package inventory (`ghcr.io/openasy/audit`).
- **Priority:** High
- **Area:** Architecture

## Context

Every project depends on packages, and every week some of them get advisories. The scanners are good and free: osv-scanner reads lockfiles for npm, pip, Go, Cargo and Composer against OSV, and Trivy and Grype do the same from SBOMs and images. What a team lacks is not a scanner but the answer to two questions: does this pull request make things worse, and where else is this package used? A pipeline that fails on every known advisory is switched off within a week; one that fails on nothing is decoration.

The options were:

- **Run a scanner and keep an advisory database in the product.** It would know the latest advisories without waiting for a pipeline, at the cost of a feed to mirror, an index to keep and a second opinion that disagrees with the one in CI.
- **Read what the scanner in CI reports**, compare it with the default branch and keep decisions, as SAST does with SARIF (ADR 0036).
- **Leave it to Dependabot or Renovate.** They open update pull requests, which is useful, but they give no inventory across projects and no place to record why an advisory does not apply.

## Decision

- **audit reads reports and nothing else.** It holds no scanner and no advisory database. What it knows is what the scanner knew when it ran, and the README says so.
- **Two formats.** The JSON of `osv-scanner --format json`, and SARIF 2.1.0 from Trivy, Grype or osv-scanner, where the rule is the advisory and the package comes from the result.
- **Severity has an order.** The CVSS v3 base score when the report has one, computed from the vector; then the database's label; then medium. An advisory nobody rated is not ignored.
- **The default branch is the baseline.** Its scan adopts what is there, never fails a pipeline, and its package list becomes the project's inventory. What it stops reporting is fixed, and opens again if it returns.
- **Any other scan fails only for what it adds** at or above the project's fail-on severity (high by default), and only for advisories nobody has decided about. An advisory is found again by ecosystem, package, version and advisory id, so updating a package clears its old advisories and adding a vulnerable version is new.
- **Decisions last.** Not affected, false positive and accepted risk, each with a reason, and an end date for accepted risk. They stay with the advisory on every branch.
- **Packages answers "where is this used?"** from the default branch of every project.

## Consequences

- audit is small (ADR 0028): SQLite and a parser, no feed to download. It needs no outbound access.
- An advisory published after the last scan of a branch is unknown until the next one. Teams that need that should scan the default branch on a schedule.
- osv-scanner lists only the packages that have advisories unless asked for all of them, so the inventory is as complete as the report.
- Running a scanner for teams without CI, and an advisory feed of our own, can follow without changing the API.
