# 0014. API-first: one public REST API per product, and how it changes

- **Decision:** Accepted
- **Implementation:** In progress
- **Where:** Every product: OpenAPI 3.1 at `/api/openapi.json`, Swagger UI at `/api/docs/`, contract tests that call every operation, Problem Details errors. `vpn` ships `openasy-vpn`, a command line tool on the same API: one file with no dependencies, in the image and attached to each release. The other products have no CLI yet, and `Idempotency-Key` is not built yet.
- **Area:** Architecture

## Context

Everything you can click should be automatable, and other products and scripts must be able to rely on the API that does it: how it is shaped, versioned and changed.

## Decision

- Every screen is backed by a public REST API. The UI has no private endpoints.
- Each product ships a CLI that uses the same API.
- Each product publishes an OpenAPI 3.1 description at `/api/openapi.json`. It is the source for the CLI, the docs and contract tests; CI fails if the implementation and the description disagree.
- Each product serves an interactive reference (Swagger UI) at `/api/docs/`, bundled in the image so it works air-gapped (ADR 0015). The site publishes the same reference for every product, so people can read the API before installing anything.
- REST with OpenAPI is the only API. There is no GraphQL in products: it would double the surface to secure and keep in sync. A read-only graph across products may be proposed later as its own product.
- The URL carries the API's major version (`/api/v1`). Within a major, changes are additive only: new endpoints, new optional fields, new enum values that clients must tolerate.
- Removing or changing anything is a breaking change: it needs a new product MAJOR (ADR 0019) and a deprecation first. Deprecated fields and endpoints are marked in OpenAPI and send a `Deprecation` header for at least one MINOR release before they go.
- Errors use Problem Details (RFC 9457): `type`, `title`, `status`, `detail` and a stable `code`, plus `errors` for field validation.
- Lists are paginated with an opaque cursor and a limit. Times are RFC 3339 in UTC. IDs are opaque strings.
- Writes accept an `Idempotency-Key` (ADR 0023).

## Consequences

- The API is versioned with the product. Because upgrades are forward-only (ADR 0010), a product never serves two API majors at once; the compatibility manifest (ADR 0019) tells linked products which major to expect.

This record took in ADR 0024, which described the API's shape and compatibility on their own.

## Where you can see it

- [REST API section in Integrations](https://openasy.github.io/ui/?path=/story/products-vpn--integrations)
