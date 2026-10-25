import type { ProductStory } from "./types";

export const metrics: ProductStory = {
  problem: {
    title: "The numbers behind your systems, kept and graphed, so you see the cause and not only the symptom",
    headline: "A slow service without numbers is a guess",
    text: "Logs say what happened; metrics say how much and how fast: CPU, memory, request rates, queue lengths, error ratios. Without them, a slow service is a guess. Every OpenAsy product already exposes Prometheus metrics, and so do most servers and databases. Metrics will keep these time series, draw dashboards and answer PromQL, so Grafana and any Prometheus-speaking tool can read it as it is.",
    example:
      "Checkout gets slow every day at noon. A dashboard shows the database's connection pool at its limit at the same minutes, while CPU stays low. The cause is the pool size, not the hardware.",
  },
  who: ["SREs and platform teams", "Developers, who watch their own services", "Anyone who builds a dashboard"],
  glance: [
    {
      label: "Keeps",
      value: "Time series",
    },
    {
      label: "Speaks",
      value: "PromQL",
    },
    {
      label: "Reads",
      value: "Every product's /metrics",
    },
    {
      label: "Works with",
      value: "Grafana as it is",
    },
  ],
  flow: [
    {
      label: "Targets",
      detail: "Prometheus endpoints of OpenAsy products, exporters on hosts and databases, and pushed OpenTelemetry metrics.",
    },
    {
      label: "Scraped and kept",
      detail: "Time series stored with their labels for the retention you choose.",
    },
    {
      label: "Queried",
      detail: "PromQL, recording rules for the queries used often.",
    },
    {
      label: "Dashboards",
      detail: "Built in the product, or in Grafana pointed at it as a Prometheus data source.",
    },
  ],
  checks: [
    {
      title: "Sources",
      items: ["Prometheus endpoints, including every OpenAsy product's /metrics", "node_exporter and other exporters", "OpenTelemetry metrics"],
    },
    {
      title: "Use",
      items: ["Dashboards and panels", "Explore with PromQL", "Recording rules", "The list of every metric and target"],
    },
  ],
  decides: [
    {
      label: "Targets",
      text: "A target that stops answering is shown as down, with its last scrape error.",
    },
    {
      label: "Retention",
      text: "Retention and disk limits decide how long series are kept.",
    },
  ],
  inputs: [
    {
      name: "Prometheus exposition format",
      url: "https://prometheus.io/docs/instrumenting/exposition_formats/",
      how: "Scraped from targets.",
    },
    {
      name: "OpenTelemetry",
      url: "https://opentelemetry.io/",
      how: "Metrics pushed over OTLP.",
    },
    {
      name: "Grafana",
      url: "https://grafana.com/",
      how: "Reads Metrics as a Prometheus data source.",
    },
  ],
  screens: [
    {
      page: "dashboards",
      title: "Dashboards",
      shows: "Your dashboards, and the ones every product comes with.",
      story: "dashboards",
    },
    {
      page: "dashboard",
      title: "A dashboard",
      shows: "Panels of time series for one service or host.",
      story: "dashboard",
    },
    {
      page: "explore",
      title: "Explore",
      shows: "Ask anything in PromQL and graph the answer.",
      story: "explore",
    },
    {
      page: "targets",
      title: "Targets",
      shows: "Everything scraped, whether it answers and its last error.",
      story: "targets",
    },
  ],
  worksWith: [
    {
      id: "alerts",
      how: "Alert rules are PromQL over these series.",
    },
    {
      id: "infrastructure",
      how: "Infrastructure says what runs on a host; Metrics says how hard it works.",
    },
    {
      id: "traces",
      how: "From a slow moment in a graph to the requests behind it.",
    },
  ],
  limits: ["Logs, traces and profiles are other products.", "It is not a replacement for long-term analytics or billing data."],
};
