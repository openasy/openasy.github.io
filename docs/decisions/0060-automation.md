# 0060. Automation: playbooks of steps through product APIs, calling only stored connections, with approvals

- **Decision:** Proposed
- **Implementation:** In progress
- **Where:** `automation` keeps playbooks started by a webhook, a schedule or a person, runs their steps against OpenAsy products and webhooks, waits for approvals, and records every run step by step (`ghcr.io/openasy/automation`). A drawn editor and approvals from Slack are planned.
- **Priority:** Medium
- **Area:** Architecture

## Context

A signal in SIEM, a detection in Malware or an outage in Uptime calls for the same few steps each time: end a VPN session, open an incident, tell a channel. Done by hand they are slow at night and done differently each time. Every product already has an API for these steps (ADR 0014), so what is missing is a place that starts them on an event, in order, with a person in the loop for the risky ones and a record of what happened.

A tool that can call any address with stored tokens is a target in itself: a template filled from an event could point a call somewhere else, and tokens of other products must not leak into logs or screens.

## Decision

- **A playbook is a trigger, conditions and a list of steps.** Triggers are a webhook with the playbook's own token, a schedule, or a person. Conditions compare fields of the event. Steps run in order; a failing step stops the run unless it says to go on.
- **Steps call connections and nothing else.** A connection is an OpenAsy product's address with an API token made in that product, or a webhook URL from Slack, Teams or another tool. Only admins add them. Tokens and webhook URLs are sealed with the install's key (ADR 0021), and only a product's address or a webhook's host is shown. A template fills a path or a body, never a host: a request that would leave the connection's address fails.
- **Built-in steps follow the products' APIs**: open an incident and add a note in Incidents, suspend a person, end a session and revoke a device in VPN, post a message. A generic `http` step reaches everything else. Opening an incident names the run and step as its external reference, so a retry never opens a second one.
- **Templates only look values up**: `{{event.…}}`, `{{steps.<id>.…}}`, `{{run.id}}`. Nothing is evaluated. A step may only read steps before it, checked when the playbook is saved.
- **Approvals are steps.** A run waits at one until an editor approves or refuses it; refused, the rest is skipped.
- **Every run is recorded** with its event, a copy of the playbook as it started, and per step the request without the token, the answer, the time it took and who approved it. A dry run records what would be sent and sends nothing.

## Consequences

- Playbooks are as safe as the tokens given to their connections; the role of each token limits what any playbook can do in that product.
- A webhook token starts one playbook and nothing else, so a product or tool that sends events never holds a token of automation itself.
- Playbooks are JSON for now. A drawn editor writes the same JSON, so the API does not change when it comes.
