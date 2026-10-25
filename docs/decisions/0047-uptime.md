# 0047. Uptime: runners check from where users are, and the server probes nothing

- **Decision:** Proposed
- **Implementation:** In progress
- **Where:** `uptime` keeps HTTP, TCP, DNS and TLS checks, their state, outages and uptime, and serves a public status page; `uptime-runner.mjs`, served by the product, runs the checks from a CI cron or any machine (`ghcr.io/openasy/uptime`). Each outage opens an incident in Incidents and its end is noted on it (ADR 0041).
- **Priority:** High
- **Area:** Architecture

## Context

An uptime check from the same network as the service says little: the service can be up for the server next to it and down for every customer. Hosted monitors check from many places, but they hold your targets and answer to someone else. A team that already has CI has machines in other networks that run on a schedule, for free.

A product that probes targets itself also has a cost: it can be pointed at internal addresses, and its own outage hides everyone else's.

## Decision

- **The server probes nothing.** Checks are defined in the product and run by a runner: one script with no dependencies, served at `/uptime-runner.mjs`, that runs on Node 20 or later from a CI cron, a server in another network, or several places at once. It fetches the checks, runs them, sends what it saw, and exits with 0 even when checks failed, because a failing site is a result and not a runner error.
- **Four kinds of check:** HTTP (status below 400 or the one set, and optional text in the page), TCP (a connection opens), DNS (it resolves, to an expected record if set) and TLS (the certificate is trusted and not yet critical: 7 days left by default, ADR 0052).
- **State follows results.** One failure is degraded; the set number of failures in a row (2 by default) is down and opens an outage; one pass is up and ends it. A result older than the newest one of its check is kept but does not move its state.
- **Silence is not "up".** A check with no result for three intervals is stale, and the page says the runner stopped instead of showing the last state as current. A check nobody has run is unknown.
- **Uptime** for 24 hours, 7, 30 and 90 days is the time not spent in an outage, from the first result. Latency percentiles cover the passing results of the last day.
- **A public status page** at `/status`, plain HTML with no script, shows only the checks an admin marked public, by name, group and state, never their targets. A paused check shows as maintenance.
- Passwords in addresses are removed from what a runner sends.
- Checks can also come from the install's endpoints file, shared with Certificates. A TLS check fails when the certificate reaches the critical threshold from `OPENASY_CERT_WARN_DAYS`, which Certificates warns about earlier (ADR 0052).

## Consequences

- The product needs no outbound access, and cannot be used to probe your internal network.
- Checks run only as often as a runner does. A five-minute CI cron gives five-minute resolution; a runner on a server can run every minute.
- If every runner stops, every check goes stale and `/metrics` says so: the alert to have is on staleness, not only on down.
- Alerting to people (paging, escalation) is left to Prometheus and the tools a team already has, until a notifications product exists.
