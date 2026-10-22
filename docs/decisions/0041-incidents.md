# 0041. Incidents: one place to run an incident, with a timeline nobody can rewrite

- **Decision:** Proposed
- **Implementation:** In progress
- **Where:** `incidents` keeps incidents with an append-only timeline, tasks, evidence links and a postmortem, and takes incidents from other products over its API (github.com/openasy/incidents, to be released as `ghcr.io/openasy/incidents`). Opening incidents from SIEM, Alerts and Uptime, and links back to them, are planned.
- **Priority:** High
- **Area:** Architecture

## Context

When something goes wrong, the work happens in a chat room, a document and several dashboards, and afterwards nobody can say what was decided, by whom and when. The products that notice trouble (SIEM, Alerts, Uptime, Vulnerabilities) each end with a notification that someone must turn into a record by hand. Incidents is that record: where an incident is opened, run and closed, and what it leaves behind. It must be useful on its own (ADR 0001), small (ADR 0028), and trustworthy as evidence, which the people reading it later include auditors and the incident's own authors.

## Decision

- **An incident is a record with a short life.** It has a number people say aloud (`INC-12`), a title, a severity, a status (open, investigating, mitigated, resolved), a commander, a summary and the products involved. Anywhere the API takes an id it takes the key too.
- **The timeline is append-only.** Notes and links are added; status and severity changes write themselves, with who made them. There is no way to edit or delete an entry through the API, and none in the interface. An incident is deleted whole, by an admin, and that is the one way history leaves.
- **The clock is part of the record.** Resolving an incident stops it and sets the time; opening it again clears the time and the timeline says so. The overview shows the mean time to resolve over 90 days and how many resolved incidents wait for a published postmortem.
- **Other products open incidents with an API token** that has the editor role (ADR 0023, 0003), so a product can be limited to opening and updating incidents and nothing else. A product names itself and its own id for the problem in `external`; the same pair is one incident. Asking again appends a note to its timeline and answers 200. This makes alert storms one incident rather than a hundred.
- **Evidence is a link.** An entry holds a title, an address and the product it lives in. Incidents never fetches the address and keeps no file, so it cannot become a second, unprotected copy of logs or captures, and the evidence stays under the access rules of the product that holds it. Addresses with credentials or schemes other than http and https are refused.
- **The postmortem comes after.** It is Markdown, draft or published, and can only be written once the incident is resolved, so it describes how it ended. Publishing needs a body and writes one timeline entry; editing a published postmortem keeps when it was first published.
- **Tasks are small.** A title, an owner as written, a due date and done. Finishing one writes it to the timeline once.
- **Roles follow ADR 0003:** viewers read, editors open and run incidents, admins delete them.
- **The first release** has the incident, timeline, tasks, evidence links, postmortem, the API for other products, metrics and the interface. Pages and notifications for the commander, a public status page, SLA targets, links from SIEM, Alerts and Uptime, and runbooks follow, each when it is built.

## Consequences

- Without notifications, nobody learns of an incident unless they look or another product tells them. Alerts is the intended source of that, and until it exists teams use their chat webhooks from the product that opens the incident.
- Owners and commanders are plain names, not links to Identity accounts. Matching them to people (and to who is on call) needs Identity and Alerts and is left to their records.
- An append-only timeline means a typo stays. People add a correction, as they would in a ship's log. The cost is accepted for the trust.
- An incident can name any product id, including one this install does not run. The interface shows the name and links nowhere.
- Retention is three years by default for resolved incidents, longer than other products, since postmortems are read in audits. It is a setting.
