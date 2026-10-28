# 0066. Runtime: Falco as the sensor, detections with their process tree, a learned process inventory and file integrity

- **Decision:** Proposed
- **Implementation:** In progress
- **Where:** `runtime` keeps Falco's alerts as events, raises detections with their process tree by a policy per rule, learns what each host and image runs, compares the watched files of each host with the read before, and sends new detections and file changes to SIEM (`ghcr.io/openasy/runtime`); `runtime-agent` runs next to Falco on each host, takes its alerts on 127.0.0.1, counts program starts and reads the watched files read-only (`ghcr.io/openasy/runtime-agent`). Response (killing a process, isolating a host), exceptions per workload, change windows and a Kubernetes manifest are planned.
- **Priority:** High
- **Area:** Architecture

## Context

Scanners say what could be exploited; they do not see an attacker who is already in. A shell started by a web
server, a binary written to `/tmp` and run, a container reading `/etc/shadow`, a new line in `authorized_keys`: these
happen in the kernel of one host, and can only be seen there. eBPF can watch them without a kernel module, but a
sensor that reads the kernel is hard to write, harder to trust, and has to keep up with every kernel release.

Falco already does this. It is a CNCF graduated project with a modern eBPF probe, a rule language, and a maintained
set of rules for the attacks teams worry about, tagged with MITRE ATT&CK. Teams that run Falco lack what happens after
a rule matches: where the alerts are kept, which of them are one problem, what the process tree was, what is normal
for a host, and who looked at it.

Unlike the other products, Runtime cannot read a host from outside, as Infrastructure, Logs and SIEM do over SSH: the
kernel's events exist only on the host. Something has to run on each one.

## Decision

- **Falco is the sensor; Runtime has none of its own.** Falco watches each host with its modern eBPF probe and
  matches its rules, which stay Falco's files, deployed with Falco. Runtime reads Falco's JSON alerts as Falco writes
  them and refuses what is not, naming the reason; it never guesses at a field.
- **An agent next to Falco on each host.** `runtime-agent` takes the place of Falcosidekick: Falco's `http_output`
  posts each alert to it on 127.0.0.1, and only there. The agent masks secrets in every text field (command lines
  carry them), holds alerts in a buffer of fixed size while Runtime is out of reach and reports how many it dropped,
  and sends them in batches. It also asks Falco's web server whether it is up, so a host whose sensor stopped is
  shown as such rather than as quiet.
- **The agent only reads and never runs what it is sent.** It connects out; Runtime never calls it, and answers only
  with what it took (ADR 0023). There are no commands, no response actions and no policy pushed to hosts in this
  release: a compromised Runtime can make up detections, but cannot act on any host.
- **Enrolment as for the other agents, for fleets too.** An admin makes an enrolment token, valid up to 30 days, for
  one host or with more uses for a fleet such as a DaemonSet. Each host trades it once for its own secret, which
  speaks for that host only; Runtime keeps hashes of both (ADR 0021, 0032). A name enrols once: taking over a host
  that is enrolled, for a lost volume or a leaked secret, means an admin removes it first, which ends its secret. An
  agent whose secret is refused stops and never enrols again by itself.
- **A policy per rule.** Every Falco rule seen gets a policy, in alert mode at first: an event opens a detection, or
  joins the open one for the same rule, host, container and program. Off keeps the events and raises nothing. A policy
  may set the severity; otherwise it follows Falco's priority. Changing a policy is for admins.
- **A detection carries its process tree.** Falco is asked, with `append_output`, for the process and its parent with
  their command lines and four older ancestors by name and pid. Processes with the same pid in one detection are the
  same process, so the trees of its events join: the shell and what it ran are parent and child. A tree stops growing
  at 64 processes; the events keep counting.
- **Detections are worked as SIEM's signals are** (ADR 0040): open, investigating, resolved or a false positive, which
  needs a reason. A closed detection stops collecting, so the next match is a new decision.
- **A learned process inventory.** The agent's own Falco rule sees every program start; the agent counts them by
  program, parent, user and container and sends the counts, not each start. A host learns for its first days, and so
  does each container image, by repository, from the first time the host runs it. Afterwards a program never seen
  there is new, and a known program with a parent or user never seen with it is drift. A new program in a container
  raises Runtime's one rule of its own, New process in container; an editor accepts a program as known.
- **File integrity read by the agent, compared by Runtime.** The agent reads the watched paths every five minutes
  through a read-only mount: SHA-256, mode, owner and size, links by their target and never followed. Runtime compares
  each read with the one before and records what was created, modified, changed permissions or deleted, for review.
  The first read of a host and paths watched only now are a baseline. Which process made a change comes from Falco:
  the newest event about that file on that host since the read before. A read cut short by the agent's limit takes
  nothing missing as deleted.
- **Detections and file changes go on to SIEM** as flat events with `source: runtime`, through an outbox in the
  database, so that SIEM's rules correlate them with logins and network events and open incidents (ADR 0040, 0041).
- **Storage as everywhere** (ADR 0011): events for 30 days in the product's SQLite file, closed detections and
  reviewed changes for a year.

## Consequences

- Runtime needs Falco on each host, and Falco needs a recent kernel (5.8 or newer for its modern probe) and runs
  privileged. Falco 0.45.1 is tested; 0.41's probe does not load on Linux 7. Teams without Falco see nothing here.
- Detection content is Falco's. Its rules are maintained upstream and Runtime gains each improvement; a rule Falco
  does not have needs writing in Falco's language, deployed with Falco. Runtime says which rules fired and lets their
  effect be changed, not their condition.
- The agent receives alerts on a loopback port. A process on the host can post made-up alerts there, as it could
  write to Falco's own output; it cannot read anything back. On Kubernetes the agent belongs in Falco's pod, so the
  two share 127.0.0.1; a manifest for that is not built yet.
- Without response, Runtime tells and does not stop. Killing a process, isolating a host and enforce-mode policies
  need an agent that acts on what Runtime says, and so a decision of their own on how that is authorised.
- The learned inventory is as good as the learning window: anything an attacker runs in those days is learned as
  known. A host's first week deserves the same attention as Falco's rules give it.
- Events hold command lines, paths and user names: personal data, and despite masking possibly secrets. Viewers read
  them, retention deletes them, and the documentation says so (ADR 0015).
