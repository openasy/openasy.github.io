# 0029. Testing and quality gates

- **Decision:** Proposed
- **Implementation:** In progress
- **Where:** Type checks, unit tests, accessibility tests (`@openasy/ui`) and container smoke tests run on every pull request. Migration, upgrade, restore and end-to-end tests are not built yet.
- **Priority:** High
- **Area:** Quality

## Context

A coverage percentage says little about whether the behaviour that matters works. What must be proven is that critical paths work, that upgrades and restores work, and that screens are usable.

## Decision

- Every pull request: type checks, unit tests, accessibility tests on every story (ADR 0005), a container build and a smoke test (`/healthz`, `/readyz`).
- Every change to an API: contract tests against the OpenAPI description (ADR 0024).
- Every change to the database: a migration test from the previous release's schema with real-looking data.
- Every release: an upgrade test from the previous release, a restore test of its backup (ADR 0025), an end-to-end test of the product's main flow (for the VPN: enrol an agent, connect a client, revoke it), and the resource checks (ADR 0028).
- Security-critical behaviour (authentication, authorisation, secrets, input from agents) has explicit tests for the failure cases, not only the happy path.
- Coverage is reported, not enforced. A bug fix comes with a test that fails without the fix.

## Consequences

- A release that cannot upgrade from the previous one or restore its backup does not ship.
