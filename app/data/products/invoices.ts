import type { ProductStory } from "./types";

export const invoices: ProductStory = {
  problem: {
    title: "Invoices and payments due, with e-Fatura and e-Arşiv through your GİB integrator",
    headline: "Money owed is the number nobody can find",
    text: "Invoices are made in one program, sent by email from another, and checked against the bank by hand; nobody knows who is late until the month ends. Invoices makes invoices from deals, hours or by hand, sends e-Fatura and e-Arşiv through the GİB integrator you already use, and follows each one until it is paid.",
    example:
      "A deal is won in CRM. Invoices makes the invoice from its lines, sends it as e-Fatura through the integrator, and emails the customer a copy. Thirty days later it is unpaid, so a reminder goes out; when the bank statement shows the payment, the invoice is marked paid.",
  },
  who: ["Finance teams, who bill and collect", "Managers, who watch what is owed"],
  glance: [
    {
      label: "Makes",
      value: "Invoices from deals and hours",
    },
    {
      label: "e-Fatura",
      value: "Through your integrator",
    },
    {
      label: "Follows",
      value: "Until paid",
    },
    {
      label: "Reminds",
      value: "On the dates you set",
    },
  ],
  flow: [
    {
      label: "Make",
      detail: "From a won deal, approved hours, or by hand, with your products and prices.",
    },
    {
      label: "Send",
      detail: "e-Fatura or e-Arşiv through your GİB integrator; a PDF to the customer by email.",
    },
    {
      label: "Follow",
      detail: "Due dates, reminders and partial payments.",
    },
    {
      label: "Match",
      detail: "Payments from the bank statement are matched to invoices.",
    },
  ],
  checks: [
    {
      title: "Invoices",
      items: ["Products, prices and taxes", "e-Fatura and e-Arşiv through the integrator", "Credit notes and partial payments"],
    },
    {
      title: "Collection",
      items: ["What is owed and overdue, by customer", "Reminders on set dates", "Bank statements matched to invoices"],
    },
  ],
  decides: [
    {
      label: "Integrator",
      text: "e-Fatura and e-Arşiv go through the integrator set in the file; Invoices is not an integrator itself.",
    },
    {
      label: "Numbers",
      text: "Invoice numbers follow one series per year and never repeat or skip.",
    },
    {
      label: "Changes",
      text: "A sent invoice is never changed; a credit note corrects it.",
    },
  ],
  inputs: [
    {
      name: "Your GİB integrator",
      how: "Through its API, with your account set in the file.",
    },
    {
      name: "Bank statements",
      how: "Imported as files from your bank.",
    },
  ],
  screens: [
    {
      page: "invoices",
      title: "Invoices",
      shows: "Invoices with what is due and overdue.",
    },
    {
      page: "invoice",
      title: "Invoice",
      shows: "One invoice with its payments.",
    },
  ],
  worksWith: [
    {
      id: "crm",
      how: "Won deals become invoices.",
    },
    {
      id: "time",
      how: "Billable hours are invoiced.",
    },
    {
      id: "helpdesk",
      how: "A billing question opens with the invoice beside it.",
    },
    {
      id: "inventory",
      how: "Products sold leave the stock.",
    },
  ],
  limits: ["Planned: not built yet.", "It does not do bookkeeping; your accountant keeps the books.", "Only GİB integrators with an API can be connected."],
};
