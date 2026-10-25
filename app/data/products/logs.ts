import type { ProductStory } from "./types";

export const logs: ProductStory = {
  problem: {
    title: "Every host's and service's logs in one place, searchable in seconds",
    headline: "Logs on the host that failed are logs you cannot read",
    text: "When a service fails at night, its logs are on the host that failed, in a container that restarted, or already rotated away. Logging in to ten machines to grep is slow, and impossible if the host is gone. Logs collects them all in one place, keeps them for as long as you choose, and lets you search across every host at once, with a record of who searched for what.",
    example:
      "Checkout errors spike at 02:40. In Logs, one search for the request id across every host shows the API timing out against the database, and the database host's journal shows it ran out of disk at 02:38. Nobody had to log in to a server.",
  },
  who: [
    "Developers and SREs, who debug from logs",
    "The security team, who look back at what happened on a host",
    "Anyone who needs logs kept for a set number of days",
  ],
  glance: [
    {
      label: "Collects",
      value: "Every host and service",
    },
    {
      label: "Sources",
      value: "Syslog, OTLP, Loki, journald",
    },
    {
      label: "Searches",
      value: "LogsQL, live tail",
    },
    {
      label: "Keeps",
      value: "30 days by default",
    },
  ],
  flow: [
    {
      label: "Logs arrive",
      detail: "Syslog over TLS, OpenTelemetry, Loki, Elasticsearch bulk and JSON lines from shippers you already run.",
    },
    {
      label: "Or are read",
      detail: "logs-agent reads the journal and Docker logs of hosts that send nothing, over SSH, about once a minute.",
    },
    {
      label: "Pipelines",
      detail: "Each source's lines are parsed into fields and masked for anything that looks like a secret.",
    },
    {
      label: "Search",
      detail: "Stored in VictoriaLogs inside the product, searched with LogsQL, live tail and saved views.",
    },
  ],
  checks: [
    {
      title: "Sources",
      items: [
        "Syslog over TLS (RFC 5424 and 3164), and plain Syslog when you switch it on",
        "OpenTelemetry logs over HTTP",
        "The Loki push, Elasticsearch bulk and JSON lines formats, from Vector, Fluent Bit, Promtail, Winlogbeat and others",
        "journald and docker logs, read by logs-agent over SSH",
      ],
    },
    {
      title: "Searching",
      items: [
        "LogsQL, across every host and service",
        "Live tail as lines arrive",
        "Saved views, with a threshold that calls a signed webhook",
        "A record of who searched for what",
      ],
    },
  ],
  decides: [
    {
      label: "Receivers",
      text: "Each receiver is off until you enable it, with its own ingest token.",
    },
    {
      label: "Masked",
      text: "Values that look like passwords, tokens or keys are masked before they are stored; with logs-agent, before they leave the hosts' network.",
    },
    {
      label: "Retention",
      text: "Retention is 30 days by default; when the disk is nearly full the oldest days go first.",
    },
    {
      label: "Searches",
      text: "Every search is recorded with who ran it.",
    },
  ],
  inputs: [
    {
      name: "Shippers",
      how: "Vector, Fluent Bit, Promtail, Winlogbeat and OpenTelemetry collectors, with their own outputs.",
    },
    {
      name: "logs-agent",
      how: "journalctl and, where you allow it, docker logs, as the unprivileged openasy account over SSH.",
    },
    {
      name: "VictoriaLogs",
      url: "https://docs.victoriametrics.com/victorialogs/",
      how: "The storage, started by Logs inside its container and reached only through it.",
    },
  ],
  screens: [
    {
      page: "overview",
      title: "Overview",
      shows: "Lines per hour by level, the busiest hosts and services, and sources that went quiet.",
    },
    {
      page: "explorer",
      title: "Explorer",
      shows: "Search with LogsQL across every host, with fields and a histogram.",
      story: "explorer",
    },
    {
      page: "tail",
      title: "Live tail",
      shows: "Lines as they arrive, filtered by host, service or text.",
      story: "live-tail",
    },
    {
      page: "hosts",
      title: "Hosts",
      shows: "The hosts logs-agent reads, from the shared hosts file, and when each was last read.",
    },
  ],
  worksWith: [
    {
      id: "infrastructure",
      how: "Reads the same hosts file; each host links to its page in Infrastructure.",
    },
    {
      id: "siem",
      how: "SIEM runs detection rules on security events; Logs keeps everything else to search.",
    },
    {
      id: "incidents",
      how: "A saved search is the evidence an incident links to.",
    },
    {
      id: "identity",
      how: "People sign in with Identity or any OpenID Connect provider.",
    },
  ],
  limits: [
    "Nothing is installed on the hosts: shippers you choose send, or logs-agent reads over SSH.",
    "It holds personal data and sometimes secrets: anyone with the viewer role reads every log it keeps.",
    "Detection rules over events are SIEM's job, not Logs'.",
    "Metrics and traces are other products.",
  ],
};
