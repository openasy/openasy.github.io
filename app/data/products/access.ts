import type { ProductStory } from "./types";

export const access: ProductStory = {
  problem: {
    title: "Access to servers and databases only when needed, approved and recorded",
    headline: "Standing access to production is the risk",
    text: "Standing access is the risk: every engineer with a permanent key to production is a way in for anyone who steals their laptop. Access will give SSH, RDP and database access just in time: someone asks, someone approves, access lasts an hour and the session is recorded. Nobody holds a key to production when they are not using it.",
    example:
      "An engineer needs to look at the production database to debug an order. They request read access for one hour with a reason; the team lead approves in Slack. The session is recorded, and after an hour the access ends by itself.",
  },
  who: ["Engineers, who ask for access", "Team leads, who approve", "Auditors, who review who had access and what they did"],
  glance: [
    {
      label: "Gives",
      value: "SSH, RDP, database access",
    },
    {
      label: "When",
      value: "Asked and approved",
    },
    {
      label: "For",
      value: "As long as needed",
    },
    {
      label: "Records",
      value: "Every session",
    },
  ],
  flow: [
    {
      label: "A request",
      detail: "For a server or database, a role, a duration and a reason.",
    },
    {
      label: "Approved",
      detail: "By the people a policy names, or automatically for low-risk access.",
    },
    {
      label: "A short-lived session",
      detail: "Through the product, with credentials that expire when the access does.",
    },
    {
      label: "Recorded",
      detail: "The session is kept for review, with who asked and who approved.",
    },
  ],
  checks: [
    {
      title: "Resources",
      items: ["SSH servers", "RDP desktops", "PostgreSQL and MySQL databases"],
    },
    {
      title: "Policies",
      items: ["Who may ask for what", "Who approves", "How long access may last"],
    },
  ],
  decides: [
    {
      label: "Expiry",
      text: "Access ends at its time, whether or not the session is still open.",
    },
    {
      label: "Records",
      text: "Every request, approval and session is recorded.",
    },
  ],
  inputs: [
    {
      name: "Identity",
      how: "People and groups, and the second factor at each request.",
    },
    {
      name: "Short-lived certificates",
      how: "SSH certificates and database credentials that expire with the access.",
    },
  ],
  screens: [
    {
      page: "requests",
      title: "Requests",
      shows: "Requests waiting for approval, and their reasons.",
      story: "requests",
    },
    {
      page: "sessions",
      title: "Sessions",
      shows: "Sessions open now, and who is in them.",
      story: "sessions",
    },
    {
      page: "recordings",
      title: "Recordings",
      shows: "Recorded sessions to review.",
      story: "recordings",
    },
    {
      page: "policies",
      title: "Policies",
      shows: "Who may reach what, who approves and for how long.",
      story: "policies",
    },
  ],
  worksWith: [
    {
      id: "identity",
      how: "People, groups and their second factor.",
    },
    {
      id: "compliance",
      how: "Access reviews and recordings as evidence for ISO 27001 A.5.18 and SOC 2 CC6.",
    },
    {
      id: "vpn",
      how: "VPN gives a network; Access gives a session on one server, for a while.",
    },
  ],
  limits: ["Recordings hold what was on screen: who may watch them is a policy too.", "It replaces standing keys only where people go through it."],
};
