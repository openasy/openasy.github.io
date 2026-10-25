import type { ProductStory } from "./types";

export const siem: ProductStory = {
  problem: {
    title: "Attacks spotted in your security events, as a few signals instead of a flood",
    headline: "An attack is a handful of events among millions",
    text: "Every host writes security events all day: logins, sudo, new accounts, failed passwords. An attack is a handful of them in the middle of millions: twenty failed logins from one address, then a success, then a new sudo rule. Nobody reads all of it. SIEM runs every event through detection rules written in Sigma, the open format the security community shares, and turns what matches into signals, one per rule and host, to investigate and close.",
    example:
      "An address tries 300 passwords against SSH on a web server in five minutes, then logs in. A correlation rule for many failed logins followed by a success makes one high signal with the count and the first events. Because it is high, an incident opens in Incidents with a link back to the signal.",
  },
  who: ["The security team, who write rules and work through signals", "On-call engineers, who get an incident when a severe signal opens"],
  glance: [
    {
      label: "Reads",
      value: "Security events",
    },
    {
      label: "Rules",
      value: "Sigma and correlations",
    },
    {
      label: "Turns into",
      value: "One signal per rule and host",
    },
    {
      label: "Severe ones",
      value: "Open an incident",
    },
  ],
  flow: [
    {
      label: "Security events",
      detail: "siem-agent reads each host's journal over SSH; shippers and scripts send events to the API.",
    },
    {
      label: "Every rule, every event",
      detail: "Each event runs through every Sigma rule that is on, as it arrives.",
    },
    {
      label: "Signals",
      detail: "One rule on one host within a window is one signal, with a count and the first events.",
    },
    {
      label: "Investigate and act",
      detail: "Close or mark false positive; a severe signal opens an incident in Incidents.",
    },
  ],
  checks: [
    {
      title: "What siem-agent reads",
      items: [
        "Logins over SSH and at a console, with user, address, method and outcome",
        "sudo and su, with the user, target user and command",
        "Account and group changes, polkit, cron",
        "The kernel's audit records, where journald collects them",
      ],
    },
    {
      title: "Sigma rules",
      items: [
        "Selections, keyword lists and conditions with and, or, not and 1 of, all of",
        "The modifiers contains, startswith, endswith, re and all, and wildcards",
        "Test a rule against recent events before it goes live",
      ],
    },
    {
      title: "Correlations",
      items: [
        "event_count and value_count, per group within a timespan, such as failed logins by source address",
        "temporal and temporal_ordered: several rules matching within a timespan, in any order or in order",
      ],
    },
  ],
  decides: [
    {
      label: "Signal",
      text: "A signal is one rule on one host within a window, 60 minutes by default: a thousand failed logins are one thing to look at.",
    },
    {
      label: "Severity",
      text: "Severity is the rule's level: critical, high, medium or low.",
    },
    {
      label: "Closing",
      text: "A signal closed or marked false positive stops collecting matches; the next match is a new signal.",
    },
    {
      label: "Incidents",
      text: "A new signal at high or above, or the severity you set, opens an incident in Incidents, once per signal.",
    },
    {
      label: "Broken rules",
      text: "A rule that fails on an event is noted on the rule and skipped; events are always kept.",
    },
  ],
  inputs: [
    {
      name: "siem-agent",
      how: "Reads the security events of the journal over SSH, from the hosts in the shared hosts file, with nothing installed on them.",
    },
    {
      name: "The events API",
      how: "Flat JSON events from shippers and scripts, one or up to 1000 at a time.",
    },
    {
      name: "Sigma",
      url: "https://sigmahq.io/",
      how: "Rules in YAML or JSON; the community's rules work where they use what is supported.",
    },
  ],
  screens: [
    {
      page: "overview",
      title: "Overview",
      shows: "Open signals by severity, events per hour, and the rules and hosts with the most signals.",
    },
    {
      page: "signals",
      title: "Signals",
      shows: "Each signal with its rule, host, count and first events, to investigate and close.",
      story: "signals",
    },
    {
      page: "events",
      title: "Events",
      shows: "Search the events of the last 30 days by host, source and text.",
      story: "event-search",
    },
    {
      page: "rules",
      title: "Rules",
      shows: "Every rule, whether it is on, its level and its last error, with a test against recent events.",
      story: "rules",
    },
  ],
  worksWith: [
    {
      id: "incidents",
      how: "A severe signal opens an incident with a link back to the signal; the signal shows its incident's key.",
    },
    {
      id: "infrastructure",
      how: "Reads the same hosts file; siem-agent prepares hosts the same way.",
    },
    {
      id: "logs",
      how: "Logs keeps all logs to search; SIEM keeps security events and runs rules on them.",
    },
    {
      id: "identity",
      how: "People sign in with Identity or any OpenID Connect provider.",
    },
  ],
  limits: [
    "Sigma aggregations with | count() and timeframe are not supported; correlations replace them. Modifiers such as base64 and cidr are not yet.",
    "Events are kept for 30 days; keep logs longer in Logs.",
    "It detects and records; it does not block an address or lock an account.",
  ],
};
