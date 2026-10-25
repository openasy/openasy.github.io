import type { ProductStory } from "./types";

export const incidents: ProductStory = {
  problem: {
    title: "Running an incident from the first report to the postmortem, in one place",
    headline: "A week later, nobody remembers what was decided",
    text: "When production is down or an attack is under way, the work happens in a chat channel: who leads, what was tried, what is left, where the evidence is. A week later nobody can say when it started, what was decided or what was learned. Incidents keeps one record per incident with a timeline nobody can edit, tasks with owners, links to the evidence and a postmortem, and measures how long each took to resolve.",
    example:
      "A SIEM signal for a brute force on the VPN opens INC-31 automatically. The commander sets it to investigating; that change writes itself to the timeline. Two tasks go to the network team, a saved search in Logs is linked as evidence. Once resolved, the clock stops and the postmortem is written and published on the same page.",
  },
  who: ["Incident commanders and on-call engineers", "Teams that must show how incidents were handled", "Managers following time to resolve"],
  glance: [
    {
      label: "Keeps",
      value: "Timeline, tasks, evidence",
    },
    {
      label: "Opened by",
      value: "People, SIEM, Uptime",
    },
    {
      label: "Measures",
      value: "Mean time to resolve",
    },
    {
      label: "Ends with",
      value: "A postmortem",
    },
  ],
  flow: [
    {
      label: "An incident opens",
      detail: "Someone opens it, or another product does through the API: SIEM for a severe signal, Uptime for an outage.",
    },
    {
      label: "The timeline grows",
      detail: "Status and severity changes write themselves with who made them; notes and links are added by hand.",
    },
    {
      label: "Work is shared",
      detail: "Tasks with an owner and a due date, evidence as links to where it lives.",
    },
    {
      label: "Learn",
      detail: "Resolving stops the clock; a postmortem is written once the incident is resolved.",
    },
  ],
  checks: [
    {
      title: "What an incident holds",
      items: [
        "A number such as INC-12, title, severity, status, commander, summary and the products involved",
        "A timeline that only grows: nothing is edited or deleted",
        "Tasks with an owner and a due date",
        "Evidence as links, such as a saved search in Logs or a signal in SIEM",
        "A postmortem in Markdown, draft or published",
      ],
    },
    {
      title: "Measured",
      items: ["Mean time to resolve over the last 90 days", "Resolved incidents still without a published postmortem"],
    },
  ],
  decides: [
    {
      label: "Severity and status",
      text: "Severity is critical, high, medium or low; status is open, investigating, mitigated or resolved.",
    },
    {
      label: "The clock",
      text: "Resolving stops the clock; opening the incident again starts it.",
    },
    {
      label: "No duplicates",
      text: "A product reporting the same problem again adds a note to the first incident instead of opening a second.",
    },
  ],
  inputs: [
    {
      name: "People",
      how: "Open and run incidents in the product.",
    },
    {
      name: "The API",
      how: "Other products, and your scripts, open incidents with a token of the editor role.",
    },
  ],
  screens: [
    {
      page: "overview",
      title: "Overview",
      shows: "Open incidents by severity, mean time to resolve, and postmortems still to write.",
    },
    {
      page: "incidents",
      title: "Incidents",
      shows: "Every incident with its severity, status, commander and age.",
      story: "list-view",
    },
  ],
  worksWith: [
    {
      id: "siem",
      how: "A severe signal opens an incident, linked both ways.",
    },
    {
      id: "uptime",
      how: "An outage opens an incident and notes its end there.",
    },
    {
      id: "logs",
      how: "Saved searches are the evidence incidents link to.",
    },
    {
      id: "identity",
      how: "People sign in with Identity or any OpenID Connect provider.",
    },
  ],
  limits: [
    "Evidence is kept as links; no files are stored.",
    "It does not page anyone yet: notifications and incidents from Alerts are planned.",
    "A public status page is Uptime's.",
  ],
};
