import type { ProductStory } from "./types";

export const audience: ProductStory = {
  problem: {
    title: "One profile for every customer, and segments that stay up to date",
    headline: "Your customer is in five tools and complete in none",
    text: "A person signs up on the site, fills in a form, talks to sales and opens an email, and each of those lands in a different tool with a different copy of them. Nobody can ask who read the pricing page twice and never bought. Audience keeps one profile per person, fed by the events of Analytics, Forms, CRM and Messages, and segments defined by rules that update as people do things.",
    example:
      "Marketing wants to reach free users who came back to the pricing page this month. In Audience they write the rule once: plan is free, viewed /pricing in the last 30 days, no deal in CRM. The segment holds 412 people today and changes as they act; Messages sends to it with each person's consent checked.",
  },
  who: ["Marketing teams, who decide who to reach", "Sales teams, who see what a lead did before the first call"],
  glance: [
    { label: "Keeps", value: "One profile per person" },
    { label: "Fed by", value: "Analytics, Forms, CRM, imports" },
    { label: "Segments", value: "Rules that update live" },
    { label: "Data stays", value: "In your install" },
  ],
  flow: [
    { label: "People arrive", detail: "From a CSV, the API, Analytics' identify, a form or CRM; each is matched by email, phone or your own user id." },
    { label: "Events add up", detail: "Page views, form answers, deals and messages become one timeline per person." },
    { label: "Segments", detail: "Rules on traits and events, such as plan, city or a page seen, kept up to date as people act." },
    { label: "Used elsewhere", detail: "Messages and Campaigns send to a segment; CRM sees the profile of a lead." },
  ],
  checks: [
    {
      title: "A profile",
      items: [
        "Email, phone and your own user id, matched across sources",
        "Traits such as plan, city or sector",
        "Every event from every linked product, in order",
      ],
    },
    {
      title: "Segments",
      items: ["Rules on traits and on events in a period", "Size over time", "Export to CSV or use in Messages and Campaigns"],
    },
  ],
  decides: [
    { label: "Same person", text: "Two records are one person when they share an email, a phone number or your user id; nothing is matched by guesswork." },
    { label: "In a segment", text: "A person is in a segment while its rules hold, and leaves it as soon as they do not." },
    { label: "Deleting", text: "A person deleted on request is deleted in every linked product too, and the request is logged." },
  ],
  inputs: [
    { name: "CSV import", how: "Columns mapped to email, phone, user id and traits." },
    { name: "The API", how: "Profiles and events from your own application." },
    { name: "Linked products", how: "Analytics, Forms, CRM and Messages send their events once linked." },
  ],
  screens: [
    { page: "people", title: "People", shows: "Every profile with its traits and latest activity." },
    { page: "segments", title: "Segments", shows: "Each segment's rules, size and how it changed." },
  ],
  worksWith: [
    { id: "analytics", how: "Visitors identified on the site become profiles, with their visits." },
    { id: "messages", how: "Campaigns and journeys send to a segment." },
    { id: "crm", how: "Contacts are kept in step, and a lead's profile shows what they did." },
    { id: "consent", how: "Each profile shows what the person agreed to." },
  ],
  limits: [
    "Planned: not built yet.",
    "It does not send messages; that is Messages.",
    "People are matched only by email, phone or your user id, never by device fingerprints.",
  ],
};
