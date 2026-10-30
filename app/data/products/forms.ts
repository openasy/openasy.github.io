import type { ProductStory } from "./types";

export const forms: ProductStory = {
  problem: {
    title: "Lead, contact and NPS forms that add people where they belong, with consent recorded",
    headline: "A form answer should not end in an inbox",
    text: "A contact form emails someone, a demo request is copied into the CRM by hand, and the consent checkbox is never stored anywhere. Forms gives every form one place: it is embedded with one tag, keeps its answers in your install, adds the person to Audience and, for a lead, a deal to CRM, and records the consent checkbox in Consent with the text the person saw.",
    example:
      "A visitor asks for a demo on the pricing page. Forms stores the answer, Audience adds the person with the visit history Analytics had, CRM opens a deal in the Demo stage for the sales owner of their region, and the box they ticked for marketing emails is recorded in Consent with its text version.",
  },
  who: ["Marketing teams, who collect leads", "Product and support teams, who ask for NPS and feedback"],
  glance: [
    { label: "Kinds", value: "Lead, contact, NPS" },
    { label: "Embedded with", value: "One script tag" },
    { label: "Sends answers to", value: "Audience and CRM" },
    { label: "Consent", value: "Recorded with its text" },
  ],
  flow: [
    { label: "Forms in a file", detail: "Fields, required ones, consent checkboxes and where answers go, reviewed like code." },
    { label: "Embed", detail: "One script tag, or a hosted page of its own." },
    { label: "Answer", detail: "Kept in your install; spam is filtered without a third-party CAPTCHA." },
    { label: "Route", detail: "To Audience as a person, to CRM as a lead, to Consent as a checkbox." },
  ],
  checks: [
    {
      title: "Forms",
      items: ["Lead and contact forms with your fields", "NPS and short satisfaction surveys", "Consent checkboxes tied to a purpose in Consent"],
    },
    {
      title: "Results",
      items: ["Answers, exported to CSV", "NPS over time", "Where each answer went"],
    },
  ],
  decides: [
    { label: "Spam", text: "Answers are filtered by a hidden field, timing and rate; no third-party CAPTCHA is loaded." },
    { label: "Consent", text: "An unticked box is no; only a ticked one is recorded as consent, with the text shown next to it." },
    { label: "Routing", text: "An answer goes where its form says; with a product not linked, it stays in Forms." },
  ],
  inputs: [
    { name: "Your site", how: "One script tag, or a link to the form's own page." },
    { name: "The API", how: "Answers from your own forms." },
  ],
  screens: [
    { page: "forms", title: "Forms", shows: "Every form with its answers this week and where they went." },
    { page: "answers", title: "Answers", shows: "One form's answers, and NPS over time." },
  ],
  worksWith: [
    { id: "audience", how: "Each answer adds or updates a profile." },
    { id: "crm", how: "Lead forms open a contact and a deal." },
    { id: "consent", how: "Checkboxes are recorded as consent, with their text." },
    { id: "analytics", how: "Form views and submissions count as events and goals." },
  ],
  limits: ["Planned: not built yet.", "Long surveys with branching are out of scope; it keeps to forms and short surveys.", "Payments are not taken in forms."],
};
