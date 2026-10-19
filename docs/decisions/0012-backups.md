# 0012. Daily backups and point-in-time restore

- **Decision:** Accepted
- **Implementation:** Not started
- **Area:** Operations

## Context

Data loss must be recoverable, and people need to know the state of things at a moment in the past.

## Decision

- Every product takes a daily snapshot of its SQLite file (`VACUUM INTO`).
- Retention is a setting. The default keeps 7 daily, 4 weekly and 12 monthly copies: about 23 snapshots, not 365. Each one is the size of the database, compressed.
- Settings and API show the space backups use and warn before the disk or bucket fills up. Large time series (logs, metrics, traces) have their own retention (ADR 0011) and are not in these snapshots.
- Optionally, every change is streamed continuously to S3-compatible storage (Litestream). This allows restoring to any second inside the retention window.
- Backups are encrypted, and restores are tested automatically once a week.

## Consequences

- "Can we go back in time?" Yes: to any day with snapshots, and to any second with continuous replication.
- Shorter retention costs less storage and reaches less far back; the setting says both.

## Where you can see it

- [Backups product](https://openasy.github.io/ui/?path=/story/products-backups--jobs)
- [Restore tests](https://openasy.github.io/ui/?path=/story/products-backups--restore-tests)
