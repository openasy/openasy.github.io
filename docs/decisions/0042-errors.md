# 0042. Errors: events become issues by where they happen, and a fix that did not hold is a regression

- **Decision:** Proposed
- **Implementation:** In progress
- **Where:** `errors` takes events from applications with a project key, groups them into issues and keeps resolution and regressions (github.com/openasy/errors, to be released as `ghcr.io/openasy/errors`). SDKs, source maps and alerts are planned.
- **Priority:** High
- **Area:** Architecture

## Context

An application that fails in production fails many times in the same way. People need the failure once, with how often, how many people it hit, where it started and whether it came back, not a list of ten thousand stack traces. Services that do this today are mostly hosted, and ask applications to send request bodies, headers, cookies and user details, which makes the error tracker a second store of personal data and secrets.

Sentry's event format is widely implemented, but it is large, changes between SDK versions, and its licence limits how a competing service may be run. We want a small, documented schema that a developer can send with one HTTP request, and the choice of what is kept to be ours.

## Decision

- **One endpoint, one schema, no SDK needed.** `POST /api/v1/events` takes `message`, `exception` (type, value, frames with the most recent call last), `level`, `timestamp`, `release`, `environment`, `user.id`, `tags`, `request` (address and method) and an optional `fingerprint`. It is described in `openapi.json` and tested against it (ADR 0024). SDKs for languages come later and are thin wrappers; Sentry's envelope format is not copied.
- **A project is an application, and its key is all an application holds.** Projects are made by an admin. The key is shown once, kept only as a hash, and can send events and nothing else (ADR 0003, 0021). A new key stops the old one at once.
- **Events are grouped by where they happen.** An issue is the exception type plus the last three frames of the application's own code (file and function, never line numbers, so a deploy that moves code keeps its issues). Without frames it is the message with numbers, hex values, UUIDs and quoted text ignored. A client may send its own `fingerprint`, and then that alone decides.
- **An issue keeps counts, not every event.** First and last time, number of events, distinct users, the releases and environments it appeared in, and the latest 20 events with their stack traces. Older events are counted and dropped; the whole issue goes after the retention period (90 days without an event by default).
- **A fix that did not hold is a regression.** Resolving an issue records the release it ships in, if given. An event for a resolved issue, in any release, reopens it and marks it a regression with the release it came back in; the release the fix was meant for is kept, so the page says "fix meant for 2.1.0, came back in 2.2.0". Ignored issues stay ignored.
- **What is sent is limited by the schema, not by trust.** Request bodies, headers, cookies, and any user detail but an id are not part of an event, and one that holds them is refused, so a mistake in an SDK cannot start a leak. Passwords, tokens and keys in messages, exception values and tags are masked before storage.
- **A project cannot flood the product.** Each project has events a minute (600 by default, set per project). Over it the answer is 429 with `Retry-After`, and the event is not parsed or stored. The count lives in memory and starts again on a restart.
- **The first release** has the endpoint, projects and keys, issues with resolve, ignore and reopen, regressions, releases, the rate limit, retention and the screens above. Alerts on new issues and regressions go through Alerts (ADR 0023); source maps, SDKs and linking an issue to a trace or a deployment follow.

## Consequences

- Grouping by the last three frames of the application's own code needs `in_app` to be right. Clients that cannot mark it get every frame, and group more finely. The documentation says how to mark it and how to send a `fingerprint`.
- Counting users by id is exact in SQLite and cheap at the scale of one installation. A very busy installation will want an approximate counter; that changes numbers, not the API.
- A regression is a signal, not proof. An old client that was never updated can reopen a fixed issue; the release it came back in tells the reader which.
- Events carry less than hosted services keep. Debugging sometimes needs the request body; teams that want it send it to their own logs, linked by the event id, and keep the personal data out of this product.
- The rate limit protects the database from one noisy application; it does not protect the network. The product stays behind TLS and a proxy that limits requests (ADR 0026).
