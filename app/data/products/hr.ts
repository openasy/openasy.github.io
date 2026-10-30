import type { ProductStory } from "./types";

export const hr: ProductStory = {
  problem: {
    title: "Employee records, leave and the org chart, with joining and leaving done once",
    headline: "Joining and leaving take a week of emails",
    text: "A new person starts and someone emails IT for a laptop, another for an email address, another for access; when they leave, half of it is forgotten. HR keeps each employee's record, contract dates, manager and team, their leave and the org chart, and tells Identity when someone joins, moves or leaves, so accounts follow.",
    example:
      "Ayşe joins Finance on 1 December. HR records her contract; on that morning Identity creates her account in the Finance group, Mail opens her mailbox, Passwords adds her to the Finance vault, and Assets lists the laptop waiting for her.",
  },
  who: ["HR teams, who keep people's records", "Managers, who approve leave and see their team"],
  glance: [
    {
      label: "Keeps",
      value: "Records, contracts, leave",
    },
    {
      label: "Shows",
      value: "The org chart",
    },
    {
      label: "Tells",
      value: "Identity, on join and leave",
    },
    {
      label: "Data stays",
      value: "In your install",
    },
  ],
  flow: [
    {
      label: "Records",
      detail: "Each employee's details, contract, manager, team and documents.",
    },
    {
      label: "Leave",
      detail: "People request leave; their manager approves; balances follow the rules in the file.",
    },
    {
      label: "Join and leave",
      detail: "On a start or end date, Identity is told, and accounts follow.",
    },
    {
      label: "See",
      detail: "The org chart and each team's people, leave and upcoming dates.",
    },
  ],
  checks: [
    {
      title: "Records",
      items: ["Personal and contract details", "Documents such as the contract and ID copy", "Manager, team and location"],
    },
    {
      title: "Leave",
      items: ["Annual, sick and other leave types", "Balances by the rules in the file", "A team calendar of who is away"],
    },
  ],
  decides: [
    {
      label: "Leave rules",
      text: "Leave types, yearly days and carry-over are set in a file, reviewed like code.",
    },
    {
      label: "Who sees what",
      text: "People see their own record; managers their team's; HR everyone's, and every look at a record is logged.",
    },
    {
      label: "Leaving",
      text: "On the end date, Identity disables the account; the record is kept as long as the law requires, then deleted.",
    },
  ],
  inputs: [
    {
      name: "Import",
      how: "CSV of employees from the old system.",
    },
    {
      name: "Identity",
      how: "Accounts and groups, kept in step.",
    },
  ],
  screens: [
    {
      page: "people",
      title: "People",
      shows: "Everyone, by team, with their manager.",
    },
    {
      page: "leave",
      title: "Leave",
      shows: "Requests to approve and who is away.",
    },
  ],
  worksWith: [
    {
      id: "identity",
      how: "Accounts follow joining, moving and leaving.",
    },
    {
      id: "payroll",
      how: "Pay is calculated from HR's records.",
    },
    {
      id: "time",
      how: "Hours and leave come together.",
    },
    {
      id: "calendar",
      how: "Leave shows as busy.",
    },
  ],
  limits: [
    "Planned: not built yet.",
    "Personal data is kept under KVKK; what you must keep and for how long is a legal question for you.",
    "Performance reviews come after the first release.",
  ],
};
