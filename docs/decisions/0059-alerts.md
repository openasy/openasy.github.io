# 0059. Alerts: Alertmanager's way in, routes and groups, silences, schedules and webhooks

- **Decision:** Proposed
- **Implementation:** In progress
- **Where:** `alerts` takes alerts at Alertmanager's `/api/v2/alerts` and its own `/api/v1/alerts`, routes them by labels, groups them, holds back silenced ones and tells whoever is on call by Slack, Teams or a webhook, with repeats, acknowledgement and escalation (`ghcr.io/openasy/alerts`). Incidents for severe groups and schedule overrides are planned.
- **Priority:** High
- **Area:** Architecture

## Context

Every product can tell when something is wrong. If each one sends its own messages, one outage becomes a hundred messages and people learn to ignore them. Teams that run Prometheus already write alerting rules in PromQL, and already send their alerts to an Alertmanager; what they lack is on-call schedules, acknowledgement and a screen that shows who was told.

## Decision

- **No rule engine of its own.** Alerting rules stay in Prometheus or vmalert, which take Alerts as their Alertmanager: it answers `POST /api/v2/alerts` with the same body. Products and scripts post the same shape to `/api/v1/alerts`, as can an Alertmanager webhook. The ingest token can send alerts and nothing else.
- **Alertmanager's meaning for alerts.** The same labels are the same alert; it resolves at its `endsAt`, or five minutes after it was last sent. Matchers are `=`, `!=`, `=~` and `!~`, with anchored regular expressions.
- **Routes in order**, the first that matches takes the alert; an alert none takes is shown as unrouted, never dropped silently. A route groups by labels, sends to one contact point, names a schedule, repeats until acknowledged and may escalate once to another contact point.
- **Waits as in Alertmanager**: 30 seconds before a group is first told of, five minutes between changes, and the route's repeat interval. A new alert in a group needs a new acknowledgement.
- **Silences stop notifications, never alerts.** They need matchers that do not cover everything, a reason, and an end within 30 days.
- **Schedules** are members taking turns of fixed shifts; the person on call is named in each notification and mentioned in Slack.
- **Contact points are webhooks**: Slack incoming webhooks, Teams workflows that post an Adaptive Card, or any URL with the group as JSON. Phone and SMS go through such a webhook to a provider. Their addresses are secrets, sealed with the install's key (ADR 0021). Every notification is kept with its result.

## Consequences

- Teams keep their rules and their Prometheus; moving from an Alertmanager is a change of address.
- A broken contact point is the one problem Alerts cannot report itself: its metrics expose failed notifications for another system to watch.
- Email needs an SMTP setting the products do not have yet; until then, a webhook covers it.
