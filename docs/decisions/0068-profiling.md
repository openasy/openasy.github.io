# 0068. Profiling: Pyroscope inside, eBPF through Alloy, pprof read from services, flame graphs compared by share

- **Decision:** Proposed
- **Implementation:** In progress
- **Where:** `profiling` runs Grafana Pyroscope inside its container, takes the profiles Grafana Alloy (its eBPF profiler included) and the Pyroscope SDKs push, reads pprof from the pull targets people add, on a schedule or on demand, and shows them as flame graphs per service, with a comparison of two periods or two label values and Pyroscope's query API for Grafana (`ghcr.io/openasy/profiling`). Its own eBPF agent, the Services screen with per-service settings, captures on a CPU spike and links from Traces and Metrics are planned.
- **Priority:** Medium
- **Area:** Architecture

## Context

A trace says which service is slow; a metric says it uses more CPU than last week. Neither says which function. Profilers do, but they are usually run by hand on a laptop, far from production's load. Continuous profiling samples the stacks of every process all the time, at a cost of about one percent of CPU, and with eBPF it needs no change to the code. ADR 0011 leaves large time series to their own storage engine, and Logs and Metrics set the pattern of running it inside the product (ADR 0035, 0063).

The options for storage were:

- **Grafana Pyroscope** is one Go binary under AGPL-3.0, like OpenAsy, for amd64 and arm64. It stores profiles by series, merges them into flame graphs over any range, and already speaks the formats profilers send: pprof, JFR and the collapsed formats, through its push API (which Grafana Alloy's `pyroscope.write` uses) and its ingest API (which its SDKs use). Grafana reads it with a data source of its own.
- **Parca** is Apache-2.0 and has its own eBPF agent, but keeps recent profiles in an in-memory columnar database and wants a bucket to keep them longer, and few profilers push to it.
- **A store of our own** on SQLite would have no dependency, but merging millions of stacks per query, symbolisation and retention would all be ours to build.

## Decision

- **Storage is Pyroscope, inside the product's container**, as VictoriaMetrics is in Metrics. The application starts the single binary as a child process, restarts it when it stops and reports it in `/readyz`; its data is in `/data` next to the SQLite file that holds pull targets, captures and people. It runs as one node: its rings are kept in memory so no gossip port opens, every port it opens is on `127.0.0.1`, and its usage statistics and its profiling of itself are off. The binary is a pinned release, checked against its published checksum when the image is built (ADR 0027).
- **eBPF goes through Grafana Alloy for now.** Alloy's `pyroscope.ebpf` samples every process on a Linux host or Kubernetes node and sends through `pyroscope.write` to Profiling's address, which takes Pyroscope's push API at `/push.v1.PusherService/Push`. The Pyroscope SDKs send to `/ingest`. Both need `PROFILING_INGEST_TOKEN`, which can push and nothing else, or an API token with the editor role; a tenant header is not passed on. Pushed data is limited per second (`PROFILING_INGEST_MB_PER_SECOND`).
- **Pull targets** are services that serve pprof over HTTP, such as Go's `net/http/pprof`, which Profiling reads on a schedule or when an editor captures a profile now: `/profile?seconds=N` for CPU, `/heap`, `/goroutine`, `/mutex` and `/block`. Their labels, such as `version`, are added to every profile read. A bearer token or password is sealed with the install's key (ADR 0021) and never returned; a redirect is refused, so it is never sent to another address. Every read is kept as a capture with its result, and a target whose last capture failed is shown on every screen. Adding targets is for admins, as an address is a request the product makes from inside the network.
- **The screens read Pyroscope through Profiling's own API** (ADR 0014): services and their types, a flame graph as a tree of frames with the functions that take most self time, totals per service over time, and a comparison. Profiling does not invent a query language: a profile is a service, a type, a period and label matchers, and every value is quoted into Pyroscope's selector.
- **A comparison compares shares, not values.** Each function's self share of the whole in the baseline and in the comparison, and the change in percentage points, so a busier period or a longer one does not make every function look slower. The baseline is the period before, the same period a day or a week before, or another value of a label in the same period, such as the previous version.
- **Grafana reads Pyroscope's query API as it is**, under `/querier.v1.QuerierService/`, with an API token of the viewer role. Only the read methods are passed on; Pyroscope's other services and its own UI are not reachable.
- **Retention** is 14 days by default (`PROFILING_RETENTION_DAYS`), for profiles and captures alike.
- **The first release** has the Profiles screen with CPU by service, flame graphs with zoom and the top functions, Compare, pull targets with captures, the push APIs and the Grafana API, and a setup page for Alloy, the SDKs and Grafana. Profiling's own eBPF agent and its install on Kubernetes, the Services screen with agent versions and per-service switches, captures that start on a CPU spike, links from a slow span in Traces (ADR 0001) and from a CPU graph in Metrics, a two-coloured diff flame graph, saved comparisons, targets from the hosts file (ADR 0052) and a disk size limit follow, each when it is built.

## Consequences

- One container still holds the product, but it runs two processes, and the image grows by one binary of about 90 MB.
- Profiling is a product with large data, so the default budget of ADR 0028 does not apply; its use at a given number of services and pushes is to be measured in CI.
- Pyroscope's push, ingest and query APIs are part of our API (ADR 0014): a breaking change in them is a breaking change for us, and upgrades of the binary are tested against the real binary in CI.
- Function names and labels can reveal how a service is built. Anyone with the viewer role sees every service's profiles; per-team access can follow if teams need it.
- Until Profiling has its own agent, eBPF needs Alloy installed on each host or node, privileged, which ADR 0031's rule of installing nothing on hosts does not cover; teams that cannot install it use the SDKs or pull targets.
