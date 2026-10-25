import type { ProductStory } from "./types";

export const automation: ProductStory = {
  problem: {
    title: "Products that act together: when one sees something, another does something about it",
    headline: "The same steps, by hand, at 3 a.m.",
    text: "A brute force signal in SIEM, a malware detection on a host, an outage in Uptime: each calls for the same few steps, done by hand at 3 a.m. Automation will let you draw playbooks that connect the products: when this happens, end that VPN session, open an incident, isolate a host, ask someone to approve before anything risky runs.",
    example:
      "A SIEM signal shows a VPN account logging in from two countries within minutes. A playbook ends the account's VPN sessions, opens an incident, and asks the on-call engineer in Slack whether to suspend the person.",
  },
  who: ["The security team, who respond faster", "SREs, who automate routine fixes"],
  glance: [
    {
      label: "Triggers",
      value: "Signals, alerts, schedules",
    },
    {
      label: "Draws",
      value: "Visual playbooks",
    },
    {
      label: "Acts",
      value: "Through product APIs",
    },
    {
      label: "Asks",
      value: "Before risky steps",
    },
  ],
  flow: [
    {
      label: "A trigger",
      detail: "A signal, detection, alert or schedule.",
    },
    {
      label: "A playbook",
      detail: "Steps drawn visually, with conditions.",
    },
    {
      label: "Actions",
      detail: "In OpenAsy products and other tools, through their APIs.",
    },
    {
      label: "Approvals",
      detail: "A person approves before a step that changes something important.",
    },
  ],
  checks: [
    {
      title: "Actions",
      items: ["End a VPN session or suspend a person", "Open or update an incident", "Isolate a host", "Call any webhook"],
    },
    {
      title: "Control",
      items: ["Approvals before risky steps", "Every run recorded, step by step"],
    },
  ],
  decides: [
    {
      label: "Trigger",
      text: "A playbook runs when its trigger matches.",
    },
    {
      label: "Approvals",
      text: "A step that needs approval waits for it, and stops if refused.",
    },
  ],
  inputs: [
    {
      name: "OpenAsy APIs",
      how: "Triggers from products, actions through their APIs, each with its own token.",
    },
  ],
  screens: [
    {
      page: "playbooks",
      title: "Playbooks",
      shows: "Every playbook and its trigger.",
      story: "playbooks",
    },
    {
      page: "playbook",
      title: "A playbook",
      shows: "Its steps, drawn as a flow.",
      story: "playbook",
    },
    {
      page: "runs",
      title: "Runs",
      shows: "Every run and what each step did.",
      story: "runs",
    },
    {
      page: "approvals",
      title: "Approvals",
      shows: "Steps waiting for a person.",
      story: "approvals",
    },
  ],
  worksWith: [
    {
      id: "siem",
      how: "Signals trigger playbooks.",
    },
    {
      id: "vpn",
      how: "End sessions and suspend people.",
    },
    {
      id: "incidents",
      how: "Open and update incidents.",
    },
  ],
  limits: ["It acts only through products' APIs, with the roles its tokens have.", "What a playbook may change is decided by whoever writes it."],
};
