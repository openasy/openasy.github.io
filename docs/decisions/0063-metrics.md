# 0063. Metrics: VictoriaMetrics inside, every product scraped, PromQL for Grafana as it is

- **Decision:** Proposed
- **Implementation:** In progress
- **Where:** `metrics` runs VictoriaMetrics inside its container, scrapes every product of `OPENASY_PRODUCTS` at its `/metrics` and the jobs people add, takes OpenTelemetry metrics and Prometheus remote write, and answers PromQL for its dashboards, Explore, the metric list and the targets screen, and at `/prometheus` for Grafana and vmalert (`ghcr.io/openasy/metrics`). Recording rules, targets from the hosts file and dashboard variables are planned.
- **Priority:** High
- **Area:** Architecture

## Context

Logs say what happened; metrics say how much and how fast. Every OpenAsy product already serves its state at `/metrics` (ADR 0026), Compliance reads them (ADR 0058), and Alerts takes the alerts Prometheus and vmalert raise over them (ADR 0059), but nothing in OpenAsy keeps those numbers over time. Teams that run Prometheus or Grafana already have rules, dashboards and habits in PromQL; a product that asked them to learn another language, or to replace Grafana, would not be used. ADR 0011 leaves large time series to their own storage engine, and Logs set the pattern of running it inside the product (ADR 0035).

## Decision

- **Storage is VictoriaMetrics, inside the product's container**, as VictoriaLogs is in Logs. The application starts the single-node binary as a child process on `127.0.0.1`, restarts it when it stops and reports it in `/readyz`; its data is in `/data` next to the SQLite file that holds jobs, dashboards and people. The binary is a pinned release, checked against its published checksum when the image is built (ADR 0027). It is one static binary under Apache-2.0, it scrapes Prometheus targets itself, takes OpenTelemetry and remote write, and answers the Prometheus HTTP API; a time-series engine of our own would have none of that.
- **Scraping is VictoriaMetrics' own**, from a Prometheus scrape config Metrics writes. Every product of `OPENASY_PRODUCTS` is scraped at its address with `/metrics` after it, as the job `openasy` with a `product` label; `METRICS_SOURCES` names another address for a product that serves `/metrics` on a port of its own, as in Compliance. Metrics scrapes itself. People add jobs: addresses, an interval, labels, and a bearer token or a user and password. The secret is sealed with the install's key (ADR 0021), never returned, and written for VictoriaMetrics only to a file on a tmpfs that only Metrics can read; an address may not hold a password, since every viewer sees it.
- **PromQL as it is.** Explore, dashboards and the API take PromQL (VictoriaMetrics' MetricsQL, which accepts it). The read part of the Prometheus HTTP API is served under `/prometheus`, passed through unchanged, so Grafana, vmalert and any Prometheus client take `https://metrics.example.com/prometheus` as a Prometheus data source with an API token of the viewer role. Only query, query_range, series, labels, label values, metadata and buildinfo are passed on; VictoriaMetrics' admin paths are not reachable.
- **Samples pushed in** over OTLP/HTTP (protobuf) at `/opentelemetry/v1/metrics` and Prometheus remote write at `/prometheus/api/v1/write` need `METRICS_INGEST_TOKEN`, which can push and nothing else, or an API token with the editor role. OpenTelemetry names become Prometheus names.
- **Targets show their health**: each address scraped, up, down or not yet scraped, with the time, duration and samples of its last scrape and its error. A target that stops answering is shown as down on every screen until it answers.
- **Retention and limits**: series are kept 30 days by default (`METRICS_RETENTION_DAYS`); at most a million new series an hour are taken (`METRICS_MAX_SERIES`), and those refused are counted and shown, so one label with a request id cannot fill the disk. When the volume is nearly full VictoriaMetrics stops taking samples instead of stopping.
- **Dashboards** are panels of PromQL with a unit, a legend and stacking, kept in SQLite. Three come with the product, for the OpenAsy products, the scrapes and the storage; they cannot be changed, only copied. Viewers read everything; editors keep dashboards; admins keep scrape jobs (ADR 0003).
- **No alerting rules.** vmalert or Prometheus evaluates them over these series and sends what fires to Alerts (ADR 0059).
- **The first release** has dashboards, Explore with a query history in the browser, the metric list, targets and jobs, OpenTelemetry and remote write in, the Prometheus API out, and a setup page for Grafana, vmalert and collectors. Recording rules, starred dashboards, targets from the hosts file (ADR 0052) and Kubernetes discovery, dashboard variables, downsampling and a disk size limit follow, each when it is built.

## Consequences

- One container still holds the product, but it runs two processes, and the image grows by one binary.
- Metrics is a product with large data, so the default budget of ADR 0028 does not apply; its use at a given number of series is to be measured in CI.
- PromQL and the Prometheus HTTP API are part of our API (ADR 0014): a breaking change in VictoriaMetrics' answers is a breaking change for us, and upgrades of the binary are tested against the real binary in CI.
- Anyone with the viewer role reads every series Metrics keeps; per-team access can follow if teams need it.
- Grafana stays the place for teams that already have it; Metrics' own dashboards are for those that do not, and for what every install shares.
