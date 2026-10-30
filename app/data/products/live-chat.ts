import type { ProductStory } from "./types";

export const liveChat: ProductStory = {
  problem: {
    title: "Chat with visitors on your website from one script tag",
    headline: "Visitors leave with their question unanswered",
    text: "A visitor on the pricing page has one question and no one to ask, so they leave. Live Chat adds a chat window to your site with one script tag, answered by your team in the browser, with the visitor's pages from Analytics beside the conversation; outside working hours, the question becomes a ticket.",
    example:
      "At 15:20 a visitor on the pricing page asks whether invoices can be in Turkish. An agent answers in a minute, sees from Analytics that they came from a search for e-Fatura, and hands the lead to sales in CRM.",
  },
  who: ["Support and sales teams, who answer visitors", "Marketing, who sees what visitors ask"],
  glance: [
    {
      label: "Added with",
      value: "One script tag",
    },
    {
      label: "Answered from",
      value: "The browser",
    },
    {
      label: "After hours",
      value: "Becomes a ticket",
    },
    {
      label: "Data stays",
      value: "In your install",
    },
  ],
  flow: [
    {
      label: "Add",
      detail: "One script tag on the site, with its colours and hours from the file.",
    },
    {
      label: "Chat",
      detail: "Visitors write; agents answer in the browser, several chats at once.",
    },
    {
      label: "Context",
      detail: "The pages the visitor read, from Analytics, beside the chat.",
    },
    {
      label: "After",
      detail: "A chat outside hours or left open becomes a ticket in Helpdesk.",
    },
  ],
  checks: [
    {
      title: "Chat",
      items: ["A window on your site, on phones too", "Saved answers and files", "Handing a chat to a colleague"],
    },
    {
      title: "Reports",
      items: ["Chats by page and hour", "Time to first answer", "Chats that became tickets or leads"],
    },
  ],
  decides: [
    {
      label: "Hours",
      text: "The window offers chat in working hours and a form outside them, as the file sets.",
    },
    {
      label: "Consent",
      text: "Nothing is stored about a visitor until they start a chat; on sites that ask first, the script waits for Consent.",
    },
    {
      label: "Routing",
      text: "A chat goes to the team the page's rule names.",
    },
  ],
  inputs: [
    {
      name: "Your site",
      how: "One script tag.",
    },
    {
      name: "Analytics",
      how: "The visitor's pages, when linked.",
    },
  ],
  screens: [
    {
      page: "chats",
      title: "Chats",
      shows: "Open chats with the page each visitor is on.",
    },
    {
      page: "chat",
      title: "Chat",
      shows: "One conversation with the visitor's pages.",
    },
  ],
  worksWith: [
    {
      id: "helpdesk",
      how: "Chats become tickets.",
    },
    {
      id: "analytics",
      how: "The visitor's pages beside the chat.",
    },
    {
      id: "crm",
      how: "A chat can open a lead.",
    },
    {
      id: "knowledge-base",
      how: "Articles are suggested to the visitor.",
    },
  ],
  limits: [
    "Planned: not built yet.",
    "Chatbots that answer on their own are out of scope.",
    "WhatsApp and social messages are out of scope; Messages sends, it does not receive.",
  ],
};
