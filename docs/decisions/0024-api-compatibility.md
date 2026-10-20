# 0024. API design and compatibility

- **Decision:** Accepted
- **Implementation:** In progress
- **Where:** `vpn`: OpenAPI 3.1 at `/api/openapi.json`, Swagger UI at `/api/docs/`, contract tests, Problem Details errors. Pagination and `Idempotency-Key` are not needed by its endpoints yet.
- **Area:** Architecture

## Context

ADR 0014 says every screen is backed by a public REST API. This record says how that API is shaped, versioned and changed, so other products and scripts can rely on it.

## Decision

- Each product publishes an OpenAPI 3.1 description at `/api/openapi.json`. It is the source for the CLI, the docs and contract tests; CI fails if the implementation and the description disagree.
- Each product serves an interactive reference (Swagger UI) at `/api/docs/`, bundled in the image so it works air-gapped (ADR 0015). The site publishes the same reference for every product, so people can read the API before installing anything.
- REST with OpenAPI is the only API. There is no GraphQL in products: it would double the surface to secure and keep in sync. A read-only graph across products may be proposed later as its own product.
- The URL carries the API's major version (`/api/v1`). Within a major, changes are additive only: new endpoints, new optional fields, new enum values that clients must tolerate.
- Removing or changing anything is a breaking change: it needs a new product MAJOR (ADR 0019) and a deprecation first. Deprecated fields and endpoints are marked in OpenAPI and send a `Deprecation` header for at least one MINOR release before they go.
- Errors use Problem Details (RFC 9457): `type`, `title`, `status`, `detail` and a stable `code`, plus `errors` for field validation.
- Lists are paginated with an opaque cursor and a limit. Times are RFC 3339 in UTC. IDs are opaque strings.
- Writes accept an `Idempotency-Key` (ADR 0023).

## Consequences

- Because upgrades are forward-only (ADR 0010), a product never serves two API majors at once; the compatibility manifest (ADR 0019) tells linked products which major to expect.
