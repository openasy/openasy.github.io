import type { ProductStory } from "./types";

export const payroll: ProductStory = {
  problem: {
    title: "Monthly pay from HR and Time, with payslips and the files your provider needs",
    headline: "Payroll is a spreadsheet nobody else understands",
    text: "Each month someone copies salaries, leave and overtime into a spreadsheet, sends it to the accountant, and emails payslips by hand. Payroll takes the month's records from HR and Time, calculates pay with the rules and rates you set, gives each person their payslip, and prepares the files your accountant or payroll provider files with the state.",
    example:
      "On 25 November Payroll takes the month from HR and Time: two people joined, one left, and eleven hours of overtime were approved. It calculates pay, the finance manager approves, payslips appear for each person, and the bank file and the provider's file are ready to send.",
  },
  who: ["Finance and HR, who run pay", "Employees, who read their payslips"],
  glance: [
    {
      label: "Takes",
      value: "HR and Time records",
    },
    {
      label: "Rules",
      value: "Rates set in a file",
    },
    {
      label: "Gives",
      value: "Payslips",
    },
    {
      label: "Filing",
      value: "Through your provider",
    },
  ],
  flow: [
    {
      label: "Collect",
      detail: "The month's people, salaries, leave and approved overtime.",
    },
    {
      label: "Calculate",
      detail: "Pay by the rules and rates in the file, with each line shown.",
    },
    {
      label: "Approve",
      detail: "Finance checks and approves the run; it is locked after.",
    },
    {
      label: "Pay",
      detail: "Payslips for each person, a bank file, and the files for your provider.",
    },
  ],
  checks: [
    {
      title: "A run",
      items: ["Gross and net pay with every line", "Joiners, leavers and overtime", "A comparison with last month"],
    },
    {
      title: "Out",
      items: ["Payslips each person can read", "A bank payment file", "Files for your accountant or provider"],
    },
  ],
  decides: [
    {
      label: "Rates",
      text: "Tax and social security rates are set in a file and checked by you each year; Payroll does not guess them.",
    },
    {
      label: "Approval",
      text: "A run is paid only after it is approved, and a locked run is changed only by a correction in the next one.",
    },
    {
      label: "Who sees what",
      text: "People see their own payslips; finance sees the run.",
    },
  ],
  inputs: [
    {
      name: "HR and Time",
      how: "People, salaries, leave and hours.",
    },
    {
      name: "Your provider",
      how: "Files in the format your accountant or payroll provider takes.",
    },
  ],
  screens: [
    {
      page: "run",
      title: "Run",
      shows: "This month's pay by person, to approve.",
    },
    {
      page: "payslip",
      title: "Payslip",
      shows: "One person's pay, line by line.",
    },
  ],
  worksWith: [
    {
      id: "hr",
      how: "People and salaries come from HR.",
    },
    {
      id: "time",
      how: "Approved hours and overtime are paid.",
    },
    {
      id: "expenses",
      how: "Approved expenses are paid back with pay.",
    },
  ],
  limits: [
    "Planned: not built yet.",
    "It does not file with SGK or the tax office itself; your accountant or provider does.",
    "Pay rules change often; keeping the rates in the file correct is yours.",
  ],
};
