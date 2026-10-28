# 0062. Database: PostgreSQL's own statistics, read with a monitoring role, sampled and explained, changing nothing

- **Decision:** Proposed
- **Implementation:** In progress
- **Where:** `database` signs in to each PostgreSQL server, 14 or newer, as a role in `pg_monitor`, samples `pg_stat_statements`, `pg_stat_activity` and `pg_stat_database` every minute, and reads blocking chains, connections, replication and plans when asked (`ghcr.io/openasy/database`). MySQL and MariaDB, `EXPLAIN ANALYZE`, suggested indexes and links from Traces are planned.
- **Priority:** Medium
- **Area:** Architecture

## Context

Most slow applications are waiting on their database: a query without an index, a lock held by a forgotten transaction, a replica behind, connections running out. PostgreSQL already counts all of it, in `pg_stat_statements` and the `pg_stat_*` views, but those are counters since a reset and a picture of this moment: reading them well takes a DBA at the right time. A tool that reads them for people holds a password to every database, so it has to be one that can do no harm with it.

## Decision

- **PostgreSQL's own statistics, nothing installed beside it.** No agent and no extension beyond `pg_stat_statements`. Database connects directly, not through a pooler, as a role that is only in `pg_monitor`, and warns when the role is a superuser, is not in `pg_monitor` or cannot read `pg_stat_statements`.
- **Changes nothing.** Every session starts read-only, with a statement timeout of 5 seconds and a lock timeout of 1, so a migration holding a lock does not collect Database's statements behind it. Terminating sessions, dropping slots and creating indexes stay with the DBA; the screens say what to look at.
- **Queries are grouped by their normalized text** and database, as `pg_stat_statements` normalizes them, summed over the users that ran them. Each sample keeps what a statement did since the one before; the first sample is a baseline. Every entry is read each time, so a statement first seen after the baseline is new and counts whole. Database's own statements are left out.
- **A blocking chain names the session at its head.** Waiting sessions go under the first session `pg_blocking_pids()` names; one that waits on nobody heads its chain, so does a blocker the role cannot see, and a cycle starts at its oldest transaction. Locks, connections and replication are read when a screen asks and are not stored.
- **Explain plans, never runs.** `EXPLAIN` without `ANALYZE` of one statement of a kind `PREPARE` takes, over the extended protocol, which takes exactly one statement, inside a `READ ONLY` transaction that is rolled back. A statement from Queries keeps its `$1`, `$2`: it is prepared and planned as a generic plan, on every supported version. Planning needs the right to read the tables, which the role gets only for the schemas chosen, and only editors may explain.
- **Credentials sealed with the install's key** (ADR 0021): a password is sealed before it is saved, opened only to connect, and never returned by the API. Without a key Database refuses to keep one. TLS verifies the certificate and the host name unless an admin chooses otherwise (ADR 0013).
- **Samples are time series for other products.** `/metrics` has each instance's last sample with an `instance` label, for Metrics to keep and Alerts to fire on. Samples are kept 7 days in SQLite (ADR 0011).

## Consequences

- A team sees the slow query, the session at the head of a blocking chain and the lagging replica without giving anyone a database shell, and a leaked Database cannot change a database it watches.
- Statistics count from their last reset and samples from the minute: a query that ran only between two samples is counted in the next, and percentiles of query time are not known.
- Sessions' last statements are shown with their values, as `pg_stat_activity` has them, to everyone who may view Database.
- MySQL and MariaDB need their performance schema read the same way; the engine is one module, and adding them does not change the API.
