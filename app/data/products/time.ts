import type { ProductStory } from "./types";

export const time: ProductStory = {
  problem: {
    title: "Working hours and time by project, approved and ready for pay and invoices",
    headline: "Nobody knows where the hours went",
    text: "Projects run over and nobody can say by how much; overtime is paid from a spreadsheet; customers are billed by guesswork. Time records working hours and time by project and customer, from a timer or a weekly sheet, approved by managers, and hands them to Payroll and Invoices.",
    example:
      "A consultant logs 32 hours on the Acme project this week. Their manager approves the sheet on Friday; at month's end Invoices bills Acme for the approved hours, and Payroll pays the 4 hours of overtime.",
  },
  who: ["Everyone who works by the hour or on projects", "Managers and finance, who approve and bill"],
  glance: [
    {
      label: "Records",
      value: "Hours, by project",
    },
    {
      label: "Approval",
      value: "By the manager",
    },
    {
      label: "Feeds",
      value: "Payroll and Invoices",
    },
    {
      label: "Rules",
      value: "Set in a file",
    },
  ],
  flow: [
    {
      label: "Projects",
      detail: "Projects and customers, from CRM or set by hand.",
    },
    {
      label: "Record",
      detail: "A timer, or a weekly sheet filled in by day.",
    },
    {
      label: "Approve",
      detail: "Managers approve or send back each week.",
    },
    {
      label: "Use",
      detail: "Approved hours go to Payroll for pay and to Invoices for billing.",
    },
  ],
  checks: [
    {
      title: "Time",
      items: ["Working hours and overtime", "Time by project, customer and task", "Leave from HR on the sheet"],
    },
    {
      title: "Reports",
      items: ["Hours by project against its budget", "Billable and non-billable time", "Overtime by person and month"],
    },
  ],
  decides: [
    {
      label: "Overtime",
      text: "Hours beyond the weekly limit in the file count as overtime.",
    },
    {
      label: "Approval",
      text: "Only approved weeks go to Payroll and Invoices; a change after approval needs approving again.",
    },
    {
      label: "Locking",
      text: "A month is locked once Payroll has run it.",
    },
  ],
  inputs: [
    {
      name: "Timer",
      how: "In the browser and on the phone.",
    },
    {
      name: "Import",
      how: "CSV from another tool.",
    },
  ],
  screens: [
    {
      page: "week",
      title: "Week",
      shows: "A person's week by day and project.",
    },
    {
      page: "projects",
      title: "Projects",
      shows: "Hours against each project's budget.",
    },
  ],
  worksWith: [
    {
      id: "hr",
      how: "People, managers and leave come from HR.",
    },
    {
      id: "payroll",
      how: "Approved hours and overtime are paid.",
    },
    {
      id: "invoices",
      how: "Billable hours are invoiced.",
    },
    {
      id: "crm",
      how: "Projects and customers come from CRM.",
    },
  ],
  limits: [
    "Planned: not built yet.",
    "Clocking in at a door or terminal is out of scope.",
    "Working-time law decides overtime; the rules in the file are yours to set.",
  ],
};
