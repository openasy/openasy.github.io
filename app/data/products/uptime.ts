import type { ProductStory } from "./types";

export const uptime: ProductStory = {
  problem: {
    title: "Knowing your sites and services are down before your customers tell you",
    headline: "The first to notice an outage should not be a customer",
    text: "A website returns errors, an API stops answering on one port, a DNS record points nowhere, a certificate runs out on Sunday. The first to notice is usually a customer. Uptime checks every address you depend on from wherever you run its runner, opens an outage when a check fails in a row, measures uptime and latency over 90 days, and keeps a public status page your customers can look at.",
    example:
      "At 03:10 the checkout API stops answering. After two failed checks in a row, Uptime opens an outage, the status page shows the API as down, and an incident opens in Incidents. At 03:25 a check passes again: the outage ends, its 15 minutes count against the 30-day uptime, and its end is noted in the incident.",
  },
  who: ["SREs and on-call engineers", "Customers and colleagues, who read the status page", "Anyone reporting availability"],
  glance: [
    {
      label: "Checks",
      value: "HTTP, TCP, DNS, TLS",
    },
    {
      label: "Runs from",
      value: "Anywhere a runner runs",
    },
    {
      label: "Measures",
      value: "Uptime and latency, 90 days",
    },
    {
      label: "Shows",
      value: "A public status page",
    },
  ],
  flow: [
    {
      label: "The endpoints file",
      detail: "The addresses to check, how often and how many failures make one down, shared with Certificates and DAST.",
    },
    {
      label: "A runner checks",
      detail: "One script with no dependencies runs the checks from a CI cron, a server elsewhere, or several places.",
    },
    {
      label: "State and outages",
      detail: "One failure is degraded, failures in a row are down and open an outage, one pass ends it.",
    },
    {
      label: "Status and history",
      detail: "Uptime and latency over 24 hours to 90 days, a public status page, and incidents for outages.",
    },
  ],
  checks: [
    {
      title: "Check types",
      items: [
        "HTTP: the status is below 400, or the one you set, and the page has your text if you set one",
        "TCP: a connection opens to host and port",
        "DNS: the name resolves, to your record if you set one (A, AAAA, CNAME, TXT)",
        "TLS: the certificate is trusted and has more than 7 days left, or the days you set",
      ],
    },
    {
      title: "Measured",
      items: ["Uptime over 24 hours, 7, 30 and 90 days", "Latency percentiles", "Each outage, with its start, end and length"],
    },
  ],
  decides: [
    {
      label: "Down",
      text: "One failure makes a check degraded; the set number of failures in a row, 2 by default, make it down and open an outage. One pass makes it up again.",
    },
    {
      label: "Stale",
      text: "A check with no result for three intervals is stale: the page says the runner stopped rather than showing an old state as current.",
    },
    {
      label: "Unknown",
      text: "A check nobody has run is unknown, never up.",
    },
    {
      label: "Paused",
      text: "A paused check is skipped by runners and shown as maintenance on the status page.",
    },
  ],
  inputs: [
    {
      name: "uptime-runner",
      how: "One Node.js script with no dependencies; it asks which checks to run and sends what it saw.",
    },
    {
      name: "The endpoints file",
      how: "OPENASY_ENDPOINTS: each check's address, group, interval, failures and what to expect.",
    },
  ],
  screens: [
    {
      page: "overview",
      title: "Overview",
      shows: "Checks down and degraded, 30-day uptime, a 90-day strip per check, and latency.",
    },
    {
      page: "checks",
      title: "Checks",
      shows: "Every check with its state, uptime and latency.",
      story: "checks",
    },
    {
      page: "outages",
      title: "Outages",
      shows: "Every outage, how long it lasted and which check it was.",
      story: "incidents",
    },
    {
      page: "status",
      title: "Status page",
      shows: "The public page with the checks you choose, with no script.",
      story: "status-page",
    },
  ],
  worksWith: [
    {
      id: "incidents",
      how: "Each outage opens an incident, and its end is noted there.",
    },
    {
      id: "certificates",
      how: "Reads the same endpoints file; a TLS check fails at Certificates' critical threshold.",
    },
    {
      id: "dast",
      how: "Reads the same endpoints file, so a check and a scan target are the same address.",
    },
    {
      id: "identity",
      how: "People sign in with Identity or any OpenID Connect provider.",
    },
  ],
  limits: [
    "Uptime itself probes nothing: a runner does, from where you start it, so it can check private networks too.",
    "It does not notify people yet beyond Prometheus metrics and incidents.",
    "It checks from outside; why a service is slow is Logs, Traces or Infrastructure.",
  ],
};
