import type { ProductStory } from "./types";

export const crm: ProductStory = {
  problem: {
    title: "Companies, contacts and deals through a pipeline you define, kept in your install",
    headline: "Your pipeline is your most sensitive list",
    text: "Who you are selling to, at what price and why you lost: a hosted CRM keeps all of it abroad and charges per seat for the privilege. CRM keeps companies, contacts and deals in your install, with pipeline stages set in a file, tasks and activities on every deal, quotes as PDF, and a meeting link people book from. Linked, a lead's profile shows what they did on the site before the first call.",
    example:
      "A lead books a demo through the meeting link. CRM creates the contact and a deal in the Demo stage, and the profile from Audience shows they read the pricing page three times. After the call the rep adds a quote; when it is accepted the deal moves to Won, and the month's forecast updates.",
  },
  who: ["Sales teams, who work deals every day", "Sales managers, who need the forecast and why deals are lost"],
  glance: [
    { label: "Keeps", value: "Companies, contacts, deals" },
    { label: "Pipeline", value: "Stages set in a file" },
    { label: "Adds", value: "Quotes and meeting links" },
    { label: "Priced", value: "Free, no seats" },
  ],
  flow: [
    { label: "Stages in a file", detail: "Each pipeline's stages and their probability, reviewed like code." },
    { label: "Leads come in", detail: "From forms, the meeting link, an import or by hand." },
    { label: "Work the deal", detail: "Tasks, calls, meetings and notes, and a quote from the deal's lines." },
    { label: "Forecast", detail: "Open deals by stage and close date, and the reasons deals were lost." },
  ],
  checks: [
    {
      title: "Deals",
      items: ["Value, stage, owner and expected close date", "Activities and tasks with reminders", "Quotes with line items, as PDF"],
    },
    {
      title: "Reports",
      items: ["Pipeline and forecast by owner", "Won and lost, with the reasons", "Time spent in each stage"],
    },
  ],
  decides: [
    { label: "Forecast", text: "A deal counts toward the forecast at its value times its stage's probability, in the month it is expected to close." },
    { label: "Stale", text: "A deal with no activity for longer than its stage allows is marked stale for its owner." },
    { label: "Ownership", text: "Each deal and contact has one owner; viewers see everything, editors change only what they own unless they are admins." },
  ],
  inputs: [
    { name: "Import", how: "CSV of companies, contacts and deals." },
    { name: "Calendars", how: "Google or Microsoft calendar for the meeting link." },
    { name: "The API", how: "Deals and activities from your own systems." },
  ],
  screens: [
    { page: "pipeline", title: "Pipeline", shows: "Deals by stage, with their value and owner." },
    { page: "deal", title: "Deal", shows: "One deal with its contacts, activities and quote." },
  ],
  worksWith: [
    { id: "audience", how: "Contacts are kept in step, and a lead's profile shows what they did." },
    { id: "forms", how: "A form can create a contact and a deal." },
    { id: "messages", how: "Sales sequences send through Messages." },
    { id: "campaigns", how: "Won deals count toward the campaign that brought them." },
  ],
  limits: ["Planned: not built yet.", "e-signature of quotes comes after the first release.", "It does not do accounting or invoicing."],
};
