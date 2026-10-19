# 0027. Build integrity and supply chain

- **Decision:** Proposed
- **Implementation:** In progress
- **Where:** Lock files, SHA-pinned actions, tag-only releases, cosign, SBOM and SLSA level 3 in `vpn-manager` and `vpn-server`. Base image digests, image scanning and reproducibility checks are not built yet.
- **Priority:** High
- **Area:** Engineering

## Context

ADR 0016 makes images signed and verifiable. This record covers how they are built, so a signature means the image is what the source says.

## Decision

- Dependencies are pinned: lock files for packages, digests for base images, commit SHAs for GitHub Actions (except reusable workflows that must be referenced by tag, such as the SLSA generator).
- Releases build only from a tag on `main` or an `lts/X.Y` branch, in GitHub Actions, never on a laptop. Jobs get the least permissions they need; only the release job can write packages or sign.
- Release artifacts are immutable: a version is never rebuilt or re-pushed. A fix is a new PATCH.
- Every image is published by digest with a cosign signature, an SPDX SBOM attestation and SLSA level 3 provenance. Docs show how to verify, and compose files and Helm charts can pin digests.
- Dependency security: Dependabot alerts and updates, a vulnerability scan of every image in CI, and a release is blocked by known critical vulnerabilities with a fix available.
- Builds aim to be reproducible: the same commit produces the same image digest. Differences are tracked as bugs.

## Consequences

- Anyone can check that an image came from this source and this workflow, and what is inside it.
