# 0071. Awareness: proven domains, your own relay, clicks and reports without capture, training and an evidence trail

- **Decision:** Proposed
- **Implementation:** In progress
- **Where:** `awareness` runs phishing simulations for an organisation's own people: recipients come from the Identity directory or a CSV import and must be in a domain proven by a TXT record, mail goes only through the admin's SMTP relay, the simulated landing page records a click or a submission without ever keeping what was typed, whoever clicks is assigned a short training module with a quiz, and training completion and the last campaign's numbers are served at `/metrics` for Compliance (`ghcr.io/openasy/awareness`). Recurring campaigns, report-mailbox ingestion, reminders and custom templates in the UI are planned.
- **Priority:** Medium
- **Area:** Architecture

## Context

Most breaches start with a person: a convincing email, a fake login page, a call that asks for a code. Technology catches much of it, not all. Organisations are expected to run their own internal security-awareness programme for their own employees (ISO 27001 A.6.3, PCI DSS 12.6.1, SOC 2 CC2.2), and to show evidence that they do. The established way to measure it is to send consented, simulated phishing to your own staff, train whoever clicks, and keep the records. The value of such a tool is its consent, tracking and evidence machinery, not the lure text; a tool that made realistic lures or impersonated real brands would be a weapon, and would fail the one job that makes it safe.

## Decision

- **Only the organisation's own people, in domains it has proven.** Recipients come only from a connected Identity directory (`GET <identity>/api/v1/people` with a sealed viewer token) or a CSV import, and every recipient address must be in a domain verified by a DNS TXT token, the same check Attack Surface uses for its scan roots, with the proof name `_openasy-awareness.<domain>`. A campaign's from address must be in a verified domain too. An address outside the verified domains is left out, and counted.
- **Mail only through the admin's relay.** Awareness runs no relay of its own and sends mail no other way. The relay's password is sealed with the install's key (ADR 0021). Every simulation message carries an `X-OpenAsy-Awareness: simulation` header. Tests and the smoke check send to a local SMTP catcher, so no real mail leaves the machine.
- **No credential capture, ever.** The simulated landing page records only that a link was clicked or a form submitted. The form's inputs have no name and the handler reads no request body, so nothing a person types is sent to or stored by the server; there is no column for it. The page then shows a short training debrief. Opens are tracked with an optional pixel, labelled unreliable.
- **Templates are plainly drills.** The built-in set shows a visible `SECURITY AWARENESS TEST` banner and a fictional `Example Corp` sender; none impersonates a real brand. They are useful only inside this consented programme. An organisation writes its own for a harder drill.
- **Consent, audit and reporting.** Every campaign names an admin, is written to an append-only audit log, and has a report-phish address; a reported mail counts for the campaign, so the behaviour the programme wants to grow is the one that scores well.
- **Training and risk.** Short modules with a quiz graded on the server record completion per person. A per-person and per-group risk score over time falls as people report and finish training, and rises on clicks and submissions. Completion and last-campaign numbers are at `/metrics` for Compliance (ADR 0058).

## Consequences

- An organisation cannot use Awareness to phish anyone but its own verified-domain people, by construction, which is also what keeps it a defensive tool.
- Because the server never receives a typed field, a "what did people enter" report is impossible on purpose; the metric is behaviour (clicked, submitted, reported), not stolen data.
- Ingesting a real report-phish mailbox needs mail parsing the product does not have yet; until then a report is recorded through the report link or the API. Recurring campaigns, reminders and custom templates in the UI are planned.
