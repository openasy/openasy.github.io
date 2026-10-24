# 0012. Backups, point-in-time restore and disaster recovery

- **Decision:** Accepted
- **Implementation:** Not started
- **Area:** Operations

## Context

Data loss must be recoverable, and people need to know the state of things at a moment in the past. Backups are only half of recovery: servers get lost, databases get corrupted, keys get lost and upgrades fail, and people need to know how far back they lose data and how long they are down.

## Decision

- Every product takes a daily snapshot of its SQLite file (`VACUUM INTO`).
- Retention is a setting. The default keeps 7 daily, 4 weekly and 12 monthly copies: about 23 snapshots, not 365. Each one is the size of the database, compressed.
- Settings and API show the space backups use and warn before the disk or bucket fills up. Large time series (logs, metrics, traces) have their own retention (ADR 0011) and are not in these snapshots.
- Optionally, every change is streamed continuously to S3-compatible storage (Litestream). This allows restoring to any second inside the retention window.
- Backups are encrypted, and restores are tested automatically once a week.

### Recovery, still proposed

This part came from ADR 0025 and is open for discussion, at Critical priority, until it is accepted.

- Default targets per product: RPO 24 hours with daily snapshots, under 1 minute with continuous replication; RTO under 30 minutes for a restore onto a new server. Products with larger data say their own targets.
- Each product documents and tests four runbooks: lost server (new host, restore the volume and the key-encryption key), corrupted database (integrity check on start, restore the last good snapshot), lost key (recovery key, ADR 0021), failed upgrade (restore the automatic pre-upgrade backup, ADR 0010).
- On start, a product runs `PRAGMA quick_check`. If it fails, the product starts read-only and shows how to restore instead of serving broken data.
- Besides the weekly test, a restore runs once in CI for every release, including a restore of the previous release's backup into the new one.
- Agents hold no state of their own (ADR 0018); after a disaster they re-enrol and pull their configuration again.

## Consequences

- "Can we go back in time?" Yes: to any day with snapshots, and to any second with continuous replication.
- Shorter retention costs less storage and reaches less far back; the setting says both.
- The Backups product reports when each product was last restored successfully and whether the targets were met.

This record took in ADR 0025, which described disaster recovery on its own.

## Where you can see it

- [Backups product](https://openasy.github.io/ui/?path=/story/products-backups--jobs)
- [Restore tests](https://openasy.github.io/ui/?path=/story/products-backups--restore-tests)
