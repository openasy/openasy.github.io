# 0064. Traces: VictoriaTraces inside, OTLP in, services and the map read from the spans themselves

- **Decision:** Proposed
- **Implementation:** In progress
- **Where:** `traces` runs VictoriaTraces inside its container, takes OpenTelemetry traces over OTLP/HTTP, and shows services, the service map, trace search with a waterfall, endpoints, two periods compared and per-service objectives, and answers Jaeger's query API at `/jaeger` for Grafana (`ghcr.io/openasy/traces`). OTLP over gRPC, sampling, latency by version and links from Errors and Metrics are planned.
- **Priority:** High
- **Area:** Architecture

## Context

One click in an application can touch a dozen services, queues and databases. When it is slow, each team's metrics look fine on their own; only a trace, every span of one request with the same trace id, shows where the time went. OpenTelemetry is how services are instrumented today, and its SDKs and collectors already send spans over OTLP. Logs and Metrics set the pattern of running an upstream store inside the product (ADR 0035, 0063), and ADR 0011 leaves large time series to such a store.

The options for storage were VictoriaTraces, one static binary under Apache-2.0 built on VictoriaLogs, which takes OTLP and answers LogsQL and Jaeger's query API; Jaeger, which needs a separate storage backend; Grafana Tempo, which is built for object storage and answers TraceQL; and a store of our own on SQLite, which would not hold the volume.

## Decision

- **Storage is VictoriaTraces, inside the product's container**, as VictoriaLogs is in Logs and VictoriaMetrics in Metrics. The application starts the single-node binary as a child process on `127.0.0.1`, restarts it when it stops and reports it in `/readyz`; its data is in `/data` next to the SQLite file that holds objectives and people. The binary is a pinned release, checked against its published checksum when the image is built (ADR 0027).
- **Spans come in over OTLP/HTTP**, protobuf or JSON, gzip allowed, at `/opentelemetry/v1/traces`, with `TRACES_INGEST_TOKEN`, which can push and nothing else, or an API token with the editor role. SDKs and collectors need no exporter of ours.
- **What a screen shows is read from the spans when it is asked for**, with LogsQL that Traces writes, for the window on screen; nothing is aggregated ahead of time. A service's requests are its server and consumer spans and the root spans of the traces it starts; rate, errors and the p50, p95 and p99 latency of services and endpoints come from them. An endpoint is the span name of a request. A request failed when its span has the status ERROR. Every value a request sends is quoted into the query, so it cannot change what the query does.
- **The service map** matches each client and producer span with the server or consumer span that answered it, in one query, and draws an edge to that span's service with the calls, errors and p95 the caller measured. A call nothing answered goes to the database, queue or host its attributes name, which appears on the map without spans of its own. The map's window is at most six hours, since the match holds its spans in memory.
- **Trace search** finds the latest traces with one span that matches every filter, as Jaeger does: service, operation, minimum and maximum duration, and errors. A trace opens as a waterfall, each span under its parent on the trace's time axis, with its attributes, events, resource and its own time; the span with the most time of its own is marked. With Logs in `OPENASY_PRODUCTS`, a trace links to its lines by trace id (ADR 0001).
- **Two periods compared**: each endpoint's p95, errors and rate in a period and in the one before, or the same time a day or a week earlier.
- **Objectives** are the p95 latency and the share of failed requests a service should stay under, kept in SQLite and set by editors. A service above either is marked on every screen and counted at `/metrics`. Traces does not alert; Prometheus or vmalert reads its `/metrics` and sends what fires to Alerts (ADR 0059).
- **Grafana reads Traces as Jaeger.** Jaeger's read API is served under `/jaeger`, passed through unchanged with a viewer's API token: services, operations, trace search, one trace and dependencies, which VictoriaTraces computes each minute. Nothing else of VictoriaTraces is reachable.
- **Retention** is 7 days by default (`TRACES_RETENTION_DAYS`), and the oldest days go first when the volume is fuller than `TRACES_MAX_DISK_PERCENT`, 90 by default, rather than VictoriaTraces stopping. No window reaches back further than the retention.
- **Roles** as in every product (ADR 0003): viewers see and search everything; editors also set objectives and push spans; admins also manage members and API tokens. Traces keeps no credentials of its own; sign-in secrets are sealed with the install's key by `@openasy/auth` (ADR 0021).
- **The first release** has services, one service over time, the service map, trace search and the waterfall, endpoints with a latency histogram, compare, objectives, OTLP/HTTP in, Jaeger's API out and a setup page. OTLP over gRPC, sampling and limits per service, latency by version or deployment, span attributes as search filters, saved searches, links from Errors and Metrics, and per-team access follow, each when it is built.

## Consequences

- One container still holds the product, but it runs two processes, and the image grows by one binary.
- Traces is a product with large data, so the default budget of ADR 0028 does not apply; its use at a given number of spans a second is to be measured in CI.
- Reading every screen from the spans keeps the numbers exact for any window and needs no pipeline, but a long window over a busy install reads many spans; precomputed latency per endpoint can follow if screens grow slow.
- Jaeger's query API and the LogsQL Traces writes are tied to VictoriaTraces: upgrades of the binary are tested against the real binary in CI, and a breaking change in Jaeger's answers is a breaking change for us (ADR 0014).
- Spans can hold personal data in their attributes, and anyone with the viewer role reads every span Traces keeps (ADR 0015). Per-team access can follow if teams need it.
