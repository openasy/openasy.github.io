# 0048. Backups: track the jobs that make backups, and count a restore nobody tested as a risk

- **Decision:** Proposed
- **Implementation:** Implemented
- **Where:** `backups` keeps backup jobs, the runs restic, Velero or a script report, and restore tests, and gives each job a state (`ghcr.io/openasy/backups`).
- **Priority:** High
- **Area:** Architecture

## Context

Most teams have backups. Fewer know whether last night's ran, and fewer still have restored one this year. The tools that make backups are good: restic for files and databases, Velero for Kubernetes. What is missing is one view of every job, how late it is, and whether a restore has been tried, which is what ISO 27001 (A.8.13) and SOC 2 (A1.2) ask for as evidence.

The options were:

- **A backup product** that runs restic and Velero itself, with credentials for every database and bucket. A large product, and one more place that holds the keys to everything.
- **Track what the existing tools report**, with a state per job and restore tests as part of it.

## Decision

- **backups makes no backups.** Jobs report each finished run: restic's JSON summary, a Velero Backup resource, or a small JSON from any script. Restore tests are reported the same way, or recorded by a person.
- **A job is defined first.** A report for a job nobody defined is refused, so that a typo does not become a job. An admin can let reports create jobs.
- **A job has a cadence and an RPO**, how often it should run and how many hours of data may be lost. Its state is the first that fits: failing (the last runs failed), at risk (the last backup is older than the RPO), late (older than one and a half cadences), untested (no restore test lately, or the last one failed), healthy, or waiting.
- **A restore nobody tested is not healthy.** Untested is a state of its own, after 30 days by default, because a backup nobody has restored is a hope.
- **The same snapshot reported twice is one run**, so a retry changes nothing. A Velero backup that partly failed is a run with a warning: a backup was made. Passwords and tokens in an error are masked.

## Consequences

- The product holds no storage credentials and needs no outbound access.
- A job that stops reporting becomes late and then at risk; a job nobody defined is invisible. The README tells teams to define every job.
- Running restore tests for teams, in an agent with access to a scratch environment, is the natural next step and needs its own decision.
