# 0043. Supply Chain: a store and a judge, and what it takes on trust

- **Decision:** Proposed
- **Implementation:** In progress
- **Where:** `supply-chain` keeps the SBOM, the signature result and the provenance summary CI reports for each image, judges every image against one policy and answers whether it may run (`ghcr.io/openasy/supply-chain`). Verifying signatures in the product, and admission control in the cluster, are planned.
- **Priority:** High
- **Area:** Architecture

## Context

Before an image runs, someone should be able to say where it came from, what is in it and who vouched for it. The tools exist and are good: Syft and Trivy write SBOMs, cosign signs and verifies, the SLSA generators write provenance. What teams lack is one place that keeps what those tools say about every image, applies one set of rules to all of them, and answers a deployment when it asks. Three goals recommend it. The product must not become a second CI: it builds nothing and signs nothing (ADR 0016, 0018). It must be useful before it is complete. And it must be honest about what it checked itself and what it was told.

The options for the first release were:

- **Verify everything in the product.** It would fetch signatures and attestations from the registry and check them against Fulcio and Rekor. That is the right end state, and also the largest piece of work, with a registry client for every registry, trust roots that change, and offline installs to think about.
- **Store and judge what CI reports.** CI already runs `cosign verify` with the identity it expects. The product keeps the result with the SBOM and provenance, and applies the policy.
- **Leave it to an admission controller** such as Kyverno or Sigstore's policy-controller, with no product behind it. That enforces at the door but keeps no inventory and answers no question about what is in the images already running.

## Decision

- **The first release is a store and a judge.** An image is a name and a digest. CI sends any of an SBOM (CycloneDX or SPDX JSON), the result of its own signature check (`verified`, the signer's identity and issuer) and a provenance summary (builder, source repository and commit, SLSA level). What is not sent stays as it was; a new SBOM replaces the old one.
- **It takes CI's word and says so.** The product does not verify signatures or provenance in this release. Whoever holds the ingest token is trusted like the pipeline that runs cosign, and the README, the API description and the UI say it in those words. A compromised pipeline can report that anything is signed; the answer is as good as the pipeline.
- **One policy for the installation.** Require a verified signature, optionally from identities that match your regular expressions and issuers you name. Require an SBOM, and provenance of at least a SLSA level. Allow and deny SPDX licences. Only admins change it, unknown fields are refused so a typo cannot loosen a rule, and it applies to all images at once.
- **Licence expressions mean what SPDX says.** An `OR` passes when one alternative does, an `AND` needs every part, `WITH` exceptions are set aside, and ids compare without case and without a trailing `+`. A package whose licence nobody named passes without an allow list and fails with one, because the list says what may be shipped. A CycloneDX entry that lists several licences is read as `AND`, the stricter reading.
- **The answer is a question anyone with a token can ask.** `GET /api/v1/images/check?name=&digest=` returns `allowed` and the reasons, for a Kubernetes admission webhook or a pipeline. An image nobody reported on is denied. The ingest token can ask, so a webhook needs no second secret.
- **Exceptions end.** An exception waives one rule, or all, for an image name or one digest, with a reason and an end within a year. The answer still lists what was waived, so an image allowed by exception is never confused with one that passes.
- **The SBOM store answers questions.** Every package of every SBOM is searchable, so the day a library is found to be vulnerable, "which images contain it, at which version" is one request. The SBOM is kept as it was sent, compressed, and can be downloaded again.
- **The first release** has Images with their state and reasons, the image page with evidence, licences and packages, Where used, the Policy, Exceptions, the API above and the ingest token. Verifying signatures and attestations against the transparency log, an admission controller for Kubernetes, signing keys and licence data for unnamed packages follow, each when it is built.

## Consequences

- The product is small and runs on a small server (ADR 0028): SQLite, no registry client, no scanner. Its cost is the SBOM: tens of megabytes for a large image, held compressed with the packages in a table.
- Until signatures are verified in the product, "allowed" means "the policy is met by what CI reported". The Policy page and the README say so, and a site that sells it as verification would be wrong.
- The policy is global. Teams that need different rules for different images wait for scoped policies; exceptions cover single images in the meantime.
- Judging is done when asked, with the policy of the moment. A change of policy changes every answer at once, and nothing is cached that could be stale.
- The state of an image depends on a free-text licence in some SBOMs. Names that are not SPDX ids are compared as written, so a list can still name them, and tools that write real SPDX ids give better answers.
- Evidence can be replaced by anyone with the ingest token. That is the price of trusting CI; the audit log (ADR 0013) records who changed what, and verification in the product ends the need to trust.
