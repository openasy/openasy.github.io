# 0014. API-first

- **Decision:** Accepted
- **Implementation:** In progress
- **Where:** Every product has a REST API described with OpenAPI, with a reference at `/api/docs/`. `vpn` ships `openasy-vpn`, a command line tool on the same API: one file with no dependencies, in the image and attached to each release. The other products have no CLI yet.
- **Area:** Architecture

## Context

Everything you can click should be automatable.

## Decision

- Every screen is backed by a public REST API described with OpenAPI.
- Each product ships a CLI that uses the same API.
- The UI has no private endpoints.

## Consequences

- The API is versioned with the product and follows the same forward-only rule (ADR 0010).

## Where you can see it

- [REST API section in Integrations](https://openasy.github.io/ui/?path=/story/products-vpn--integrations)
