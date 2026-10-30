import type { ProductStory } from "./types";

export const expenses: ProductStory = {
  problem: {
    title: "Receipts photographed, approved and paid back, with each expense's category",
    headline: "Expense claims are a shoebox of receipts",
    text: "People keep receipts in their wallets, fill in a spreadsheet at month's end, and wait weeks to be paid back. Expenses lets them photograph a receipt on the phone, reads its amount and date, sends it to their manager, and hands the approved total to Payroll or finance with each expense's category and project.",
    example:
      "After a customer visit, Ali photographs the taxi and lunch receipts. Expenses reads 640 TL in total, his manager approves them from the phone, and they are paid back with his salary under Travel for the Acme project.",
  },
  who: ["Everyone who spends for the company", "Managers and finance, who approve and pay"],
  glance: [
    {
      label: "Receipts",
      value: "Photographed on the phone",
    },
    {
      label: "Approval",
      value: "By the manager",
    },
    {
      label: "Paid",
      value: "With pay or by transfer",
    },
    {
      label: "Rules",
      value: "Set in a file",
    },
  ],
  flow: [
    {
      label: "Capture",
      detail: "A photo of the receipt; its amount, date and seller are read and checked.",
    },
    {
      label: "Claim",
      detail: "Each expense gets a category and, where it applies, a project.",
    },
    {
      label: "Approve",
      detail: "The manager approves; amounts over a limit also need finance.",
    },
    {
      label: "Pay back",
      detail: "Approved claims go to Payroll or a transfer list.",
    },
  ],
  checks: [
    {
      title: "Claims",
      items: ["Receipts with amount, date and seller", "Categories and projects", "Mileage and daily allowances"],
    },
    {
      title: "For finance",
      items: ["Spending by category, team and project", "Claims over policy", "An export for the accountant"],
    },
  ],
  decides: [
    {
      label: "Policy",
      text: "Limits by category and who approves above them are set in a file.",
    },
    {
      label: "Duplicates",
      text: "A receipt with the same seller, date and amount as an earlier one is flagged.",
    },
    {
      label: "Receipts",
      text: "A claim without a receipt image needs a reason and finance's approval.",
    },
  ],
  inputs: [
    {
      name: "Phone",
      how: "The browser on the phone, with its camera.",
    },
    {
      name: "Card statements",
      how: "Company card transactions, imported as files.",
    },
  ],
  screens: [
    {
      page: "claims",
      title: "Claims",
      shows: "Claims to approve and pay.",
    },
    {
      page: "spend",
      title: "Spend",
      shows: "Spending by category and team.",
    },
  ],
  worksWith: [
    {
      id: "payroll",
      how: "Approved claims are paid with pay.",
    },
    {
      id: "hr",
      how: "People and managers come from HR.",
    },
    {
      id: "time",
      how: "Expenses can be charged to a project.",
    },
  ],
  limits: [
    "Planned: not built yet.",
    "Company cards are not issued; their statements are imported.",
    "Reading receipts works on clear photos; anything unclear is typed in.",
  ],
};
