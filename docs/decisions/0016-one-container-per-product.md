# 0016. One container per product, signed

- **Decision:** Accepted
- **Implementation:** In progress
- **Where:** Every release of every product, agent and server is signed with cosign and has an SBOM and SLSA level 3 provenance. `vulns` has a Helm chart, published as a signed OCI artifact and tested on a kind cluster in CI; the other products have none yet.
- **Area:** Operations

## Context

Installing should take minutes, and you should be able to verify what you run.

## Decision

- Each product is one container image (`ghcr.io/openasy/<product>`), started with `docker compose up` or a Helm chart. Agents and servers (ADR 0018) have their own image, for example `ghcr.io/openasy/vpn` and `ghcr.io/openasy/vpn-server`.
- Images are built and pushed to GitHub Container Registry by GitHub Actions when a version tag is pushed, for `linux/amd64` and `linux/arm64`.
- Images are signed with cosign, ship an SBOM and carry SLSA level 3 provenance.

## Consequences

- You can verify an image before running it:

  ```bash
  cosign verify ghcr.io/openasy/vpn:0.4.0 \
    --certificate-identity-regexp '^https://github.com/openasy/vpn/' \
    --certificate-oidc-issuer https://token.actions.githubusercontent.com
  ```

## Where you can see it

- [Supply Chain → Images](https://openasy.github.io/ui/?path=/story/products-supply-chain--images)
