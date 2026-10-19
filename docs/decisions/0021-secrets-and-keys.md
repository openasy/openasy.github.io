# 0021. Secrets and key management

- **Decision:** Proposed
- **Implementation:** In progress
- **Where:** Device private keys are returned once and never stored; the API never returns them again. The CA key is still stored unencrypted, and the key-encryption key is not built yet.
- **Priority:** Critical
- **Area:** Security

## Context

A VPN product holds the most sensitive material in the system: the CA private key can mint a valid identity for anyone. Products also hold API tokens, OIDC client secrets and webhook signing keys. ADR 0013 says secrets are encrypted at rest; this record says where they live, who can read them and how they are rotated and recovered.

## Decision

- Each product has one key-encryption key (KEK), generated on first start. It is read from a file outside the data volume (`/run/secrets/openasy-kek`, a Docker or Kubernetes secret) or from a KMS; it is never stored in the SQLite file.
- Every secret in the database is encrypted with its own data key (AES-256-GCM), and data keys are encrypted with the KEK (envelope encryption). Backups therefore contain only encrypted secrets.
- Private keys that sign things stay where they are used. The VPN CA key is held by `vpn-manager` only to issue certificates and can be moved to an offline CA or a PKCS#11 device; `vpn-server` receives only its own server key and certificate.
- The API never returns a secret after it is created. Screens show a fingerprint, the creation date and the last use. Tokens are shown once.
- Rotation: the KEK can be rotated without downtime (data keys are re-wrapped); tokens and certificates have an expiry and a one-click rotate with an overlap period; the CA can be rotated with a cross-signed transition.
- Recovery: on first start the product shows a one-time recovery key for the KEK. Losing both the KEK and the recovery key means the encrypted secrets are lost, and the product says so before you confirm.

## Consequences

- Restoring a backup on a new server needs the KEK or the recovery key; ADR 0025 describes the steps.
- Reading a secret, rotating a key and exporting a certificate are audit-logged (ADR 0013).
