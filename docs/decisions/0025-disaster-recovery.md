# 0025. Disaster recovery

- **Decision:** Proposed
- **Implementation:** Not started
- **Priority:** Critical
- **Area:** Operations

## Context

Backups (ADR 0012) are only half of recovery. Servers get lost, databases get corrupted, keys get lost and upgrades fail, and people need to know how far back they lose data and how long they are down.

## Decision

- Default targets per product: RPO 24 hours with daily snapshots, under 1 minute with continuous replication; RTO under 30 minutes for a restore onto a new server. Products with larger data say their own targets.
- Each product documents and tests four runbooks: lost server (new host, restore the volume and the key-encryption key), corrupted database (integrity check on start, restore the last good snapshot), lost key (recovery key, ADR 0021), failed upgrade (restore the automatic pre-upgrade backup, ADR 0010).
- On start, a product runs `PRAGMA quick_check`. If it fails, the product starts read-only and shows how to restore instead of serving broken data.
- Restore tests run automatically every week (ADR 0012) and once in CI for every release, including a restore of the previous release's backup into the new one.
- Agents hold no state of their own (ADR 0018); after a disaster they re-enrol and pull their configuration again.

## Consequences

- The Backups product reports when each product was last restored successfully and whether the targets were met.
