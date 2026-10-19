# 0024. API design and compatibility

- **Decision:** Proposed
- **Implementation:** Not started
- **Priority:** High
- **Area:** Architecture

## Context

ADR 0014 says every screen is backed by a public REST API. This record says how that API is shaped, versioned and changed, so other products and scripts can rely on it.

## Decision

- Each product publishes an OpenAPI 3.1 description at `/api/openapi.json`. It is the source for the CLI, the docs and contract tests; CI fails if the implementation and the description disagree.
- The URL carries the API's major version (`/api/v1`). Within a major, changes are additive only: new endpoints, new optional fields, new enum values that clients must tolerate.
- Removing or changing anything is a breaking change: it needs a new product MAJOR (ADR 0019) and a deprecation first. Deprecated fields and endpoints are marked in OpenAPI and send a `Deprecation` header for at least one MINOR release before they go.
- Errors use Problem Details (RFC 9457): `type`, `title`, `status`, `detail` and a stable `code`, plus `errors` for field validation.
- Lists are paginated with an opaque cursor and a limit. Times are RFC 3339 in UTC. IDs are opaque strings.
- Writes accept an `Idempotency-Key` (ADR 0023).

## Consequences

- Because upgrades are forward-only (ADR 0010), a product never serves two API majors at once; the compatibility manifest (ADR 0019) tells linked products which major to expect.
