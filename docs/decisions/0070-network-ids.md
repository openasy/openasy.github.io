# 0070. Network IDS: Suricata on the sensors, its EVE events in, local rules and suppressions out

- **Decision:** Proposed
- **Implementation:** In progress
- **Where:** `network-ids` keeps the alerts, flows, DNS, HTTP, TLS and SSH logs and counters Suricata writes on each sensor, links each alert to its flow, and keeps local rules and suppressions that every sensor writes (`ghcr.io/openasy/network-ids`); `network-ids-agent` runs next to Suricata, sends its EVE events and writes and reloads the rules it is given (`ghcr.io/openasy/network-ids-agent`). Zeek's logs, packet captures on demand, choosing rulesets here, signals to SIEM and Threat Intel lookups are planned.
- **Priority:** Medium
- **Area:** Architecture

## Context

Some attacks leave no trace on a host anyone watches: a scan from a printer, malware calling home every minute, a database dump sent out over DNS. They show only in network traffic. Suricata already reads a copy of the traffic at line rate, matches the Emerging Threats rules and writes what it saw as EVE JSON; teams that run it lack a place where the alerts of all their sensors are seen with their flows, where local rules and suppressions are kept once for every sensor, and where a sensor that drops packets is noticed.

## Decision

- **No packet engine of its own.** Suricata runs on each sensor, on a mirror port or a tap, as it does now. Network IDS takes its EVE events: alerts, flows, the DNS, HTTP, TLS and SSH logs, and its stats counters. Detection only: rules are `alert` or `pass`; `drop` and `reject` are refused, and Network IDS never blocks traffic.
- **An agent next to each Suricata,** as Infrastructure, Logs and SIEM have theirs (ADR 0023). A sensor is added by an admin and gets a one-time enrolment token for 7 days; the agent enrols with it and from then on calls with its own secret, sealed on its volume with its own key-encryption key (ADR 0021). Network IDS keeps only hashes of both. The agent connects out and never listens; it must be the same version as Network IDS (ADR 0019).
- **The agent sends what Suricata wrote,** from where it stopped in `eve.json`, across rotation, without packet payloads. Network IDS checks every event again, since a sensor is only trusted to say what it saw. A batch sent twice counts once. Alerts are kept 90 days; flows, protocol logs and counters 30.
- **Severity** is ET's `signature_severity` metadata where a rule has it, else Suricata's severity: 1 high, 2 medium, 3 and more low. Each alert links to its flow and that flow's protocol logs by Suricata's flow id; the Community ID is kept for other tools.
- **Local rules and suppressions are data, never commands.** They are kept here, checked when saved (one line, a sid from 9,000,000 to 9,999,999, no `lua`, `luajit`, `dataset` or `datarep`, which read or write files on the sensor), and every agent asks for them, checks every line again, writes them to its own two files only and asks Suricata to reload its rules over the command socket. A compromised Network IDS can change what alerts, not what runs on a sensor. Suricata is the last check; rules it fails to load show on the sensor.
- **Suppressions** are Suricata's `suppress` lines: a signature for every address, or from or to one network, with a reason and an end within a year. Alerts a suppression covers that still arrive are kept and marked, never dropped.
- **Sensor health** comes from Suricata's own counters: traffic, packets dropped, rules loaded and failed. From 1% dropped a sensor is degraded, since rules then miss traffic.
- **Rulesets stay with `suricata-update` on each sensor** for now; Network IDS counts what each sensor loaded.

## Consequences

- Teams keep their Suricata, its rulesets and its configuration; a sensor needs the agent, two lines in `suricata.yaml` for its files, and the command socket.
- Flows are kept in SQLite (ADR 0011): a busy link brings millions a day, so 0.1.0 suits small and medium networks, and a larger store is a later decision.
- A sensor that stops sending shows as offline; its own metrics and Network IDS's `openasy_network_ids_sensors` are for another system to watch.
- Zeek adds flow and protocol logs Suricata does not write; packet captures for an alert, alerts sent to SIEM as signals, and addresses and domains checked against Threat Intel follow.
