import type { ProductStory } from "./types";

export const alerts: ProductStory = {
  problem: {
    title: "The right person told about the right problem, once, at any hour",
    headline: "A hundred messages for one outage get ignored",
    text: "Every product can tell when something is wrong, but if each sends its own emails, people get a hundred messages for one outage and learn to ignore them. Alerts will be the one place rules fire, alerts are grouped and routed to the team that owns them, silenced during maintenance, and sent to whoever is on call, by email, Slack, Teams or phone.",
    example:
      "A database host runs out of disk at 02:00. Four products notice: Metrics, Uptime, Logs and Backups. Alerts groups them into one alert for the database team, and pages the engineer on call this week. Planned maintenance on another host the same night is silenced and pages nobody.",
  },
  who: ["On-call engineers", "Team leads, who set routing and rotations"],
  glance: [
    {
      label: "Rules",
      value: "PromQL and any product",
    },
    {
      label: "Groups",
      value: "One alert per problem",
    },
    {
      label: "Routes to",
      value: "The team that owns it",
    },
    {
      label: "Tells",
      value: "Whoever is on call",
    },
  ],
  flow: [
    {
      label: "Rules fire",
      detail: "PromQL rules over Metrics, and alerts sent by other products and tools.",
    },
    {
      label: "Grouped",
      detail: "Alerts about the same problem become one.",
    },
    {
      label: "Routed",
      detail: "To the team that owns it, unless a silence covers it.",
    },
    {
      label: "Someone is told",
      detail: "The person on call, by email, Slack, Teams or a phone provider, until someone acknowledges.",
    },
  ],
  checks: [
    {
      title: "Rules",
      items: ["PromQL rules with thresholds and durations", "Alerts from any product or tool over the API"],
    },
    {
      title: "Routing",
      items: ["Routes by label to teams", "Silences for maintenance", "On-call rotations and escalation"],
    },
  ],
  decides: [
    {
      label: "Firing",
      text: "An alert fires when its rule holds for its duration.",
    },
    {
      label: "Grouping",
      text: "Alerts with the same group labels are one notification.",
    },
    {
      label: "Silences",
      text: "A silence stops notifications, never the alert itself.",
    },
  ],
  inputs: [
    {
      name: "Metrics",
      how: "PromQL rules over its series.",
    },
    {
      name: "The API",
      how: "Alerts from other products, scripts and tools such as Alertmanager webhooks.",
    },
  ],
  screens: [
    {
      page: "firing",
      title: "Firing",
      shows: "What is firing now, grouped, with who was told.",
      story: "firing",
    },
    {
      page: "rules",
      title: "Rules",
      shows: "Every rule, its query, threshold and state.",
      story: "rules",
    },
    {
      page: "on-call",
      title: "On-call",
      shows: "Rotations, who is on call now and the escalation steps.",
      story: "on-call",
    },
    {
      page: "silences",
      title: "Silences",
      shows: "Maintenance windows and what they silence.",
      story: "silences",
    },
  ],
  worksWith: [
    {
      id: "metrics",
      how: "Rules are PromQL over Metrics.",
    },
    {
      id: "incidents",
      how: "A severe alert opens an incident.",
    },
    {
      id: "uptime",
      how: "An outage is an alert to route to whoever is on call.",
    },
  ],
  limits: ["It routes and notifies; finding the cause is the other products' job.", "Phone calls and SMS go through a provider you choose."],
};
