# 0072. Attack Simulation: a fixed pack of harmless tests, run on hosts you allow, checked against the detectors

- **Decision:** Proposed
- **Implementation:** In progress
- **Where:** `attack-simulation` runs benign MITRE ATT&CK tests from a fixed, reviewed pack on hosts an admin has allowed, tags every step with a run id, and reads the detecting products (SIEM, Runtime) to see whether each was caught within a window, showing coverage per technique (`ghcr.io/openasy/attack-simulation`); `attack-simulation-agent` sits on a host, enrols with a one-time token, and runs each test only from its own built-in pack, refusing any id it does not have (`ghcr.io/openasy/attack-simulation-agent`). Endpoints and Network IDS as detectors, scheduled runs, and more tests are planned.
- **Priority:** Medium
- **Area:** Architecture

## Context

A detection rule that has never fired may be broken, and nobody knows until a real attacker proves it. The only way to be sure SIEM, Runtime and the rest would catch a technique is to perform it, safely, on a host you own, and check whether a signal was raised. This is breach and attack simulation. It is also the most dangerous idea in the suite: a product that runs attacker techniques on hosts is one misstep away from being the attacker. The scope is therefore fixed by safety, not by ambition.

## Decision

- **The agent never runs a command sent by the server.** The agent ships a fixed, reviewed pack of benign tests, in the spirit of Atomic Red Team's harmless atomics: read the host with `whoami`, `uname` or `id`; create and delete a marker file in a temp directory; make one outbound DNS lookup of a marker name under a reserved test domain; write and delete the EICAR anti-malware test string. The server can ask only for a test by its pack id; the agent looks the id up in its own built-in pack and refuses anything else. There is no credential dumping, no persistence that outlives the test, no privilege escalation, no network scanning and no real malware (the EICAR string is the most). Each test's action is fixed code in the agent, run with no shell; the only thing that crosses from the server is a pack id and a random hex marker, which the agent uses as a label (a file or DNS name) after checking it is plain hex.
- **A host is opt-in twice.** It enrols read-only with a one-time or fleet token and gets a per-host secret, as in `infra-agent`, `siem-agent` and `runtime-agent` (ADR 0023, 0032); the server keeps only hashes. Enrolling runs nothing. A host runs a test only after an admin marks it allowed for simulation, with a reason, which is written to the audit log (ADR 0013) and can be paused at any time.
- **Runs are an admin's, tagged and rate-limited.** An admin starts a run of chosen tests on one allowed host. Every step carries the run id so a detector's signal can be matched to it. One run per host at a time, and runs on a host are kept apart by a cooldown, so simulation never floods a host.
- **Each test cleans up and reports itself.** The agent reports what it did and whether it cleaned up; a test that creates a file deletes it, even on a mid-way failure. The server never learns a detection from the agent.
- **Detection is checked by reading the other products, never by the agent.** After a step's window passes, the server reads the detecting products' public APIs with a scoped, read-only token (ADR 0003, 0023): SIEM's events and Runtime's detections on that host since the step ran. A step is detected when a signal carries the step's marker or its MITRE technique; otherwise it is missed. Coverage is the roll-up of steps per technique and per tactic, by their latest outcome.

## Consequences

- The pack is small on purpose, and grows only by a reviewed code change in both the product and the agent. Coverage is for the techniques in the pack, run on the hosts allowed, not for every possible attack.
- The agent takes no inbound connection and holds no power to change a host beyond running its own benign tests; a compromised server cannot make it do more than ask for a pack id it already has.
- Detection depends on the detecting products being reachable and their tokens being valid; a detector that cannot be read is treated as no signal and said so, rather than guessed at.
- The EICAR test string is harmless but some scanners quarantine the file as it is written; that is the test working, and the agent deletes the file either way.
