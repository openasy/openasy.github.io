import type { ProductStory } from "./types";

export const helpdesk: ProductStory = {
  problem: {
    title: "Customer requests as tickets, with queues, SLAs and the customer from CRM",
    headline: "Customers are answered from a shared inbox",
    text: "Support works from a shared inbox: two people answer the same email, another waits four days, and nobody sees that the customer has an open deal worth 300,000 TL. Helpdesk turns emails, forms and chats into tickets in queues, with owners, SLAs and replies from the support address, and shows the customer's profile and deals beside each ticket.",
    example:
      "A customer writes to support@ that invoices fail. Helpdesk opens a ticket in the Billing queue with a four-hour SLA; the agent sees the customer's plan and open deal, replies from support@, and the customer's answer lands in the same ticket.",
  },
  who: ["Support teams, who answer customers", "Support leads, who watch queues and SLAs"],
  glance: [
    {
      label: "From",
      value: "Email, forms, chat",
    },
    {
      label: "Queues",
      value: "Set in a file",
    },
    {
      label: "SLAs",
      value: "Per queue and plan",
    },
    {
      label: "Beside it",
      value: "The customer from CRM",
    },
  ],
  flow: [
    {
      label: "Arrive",
      detail: "Emails to support addresses, forms and chats become tickets.",
    },
    {
      label: "Route",
      detail: "Rules in the file send each ticket to a queue and set its SLA.",
    },
    {
      label: "Answer",
      detail: "Agents reply from the support address; the customer's replies thread into the ticket.",
    },
    {
      label: "Close",
      detail: "Solved tickets close, and the customer is asked how it went.",
    },
  ],
  checks: [
    {
      title: "Tickets",
      items: ["Queues, owners and priorities", "Replies, internal notes and saved answers", "SLAs for first reply and solution"],
    },
    {
      title: "Reports",
      items: ["Tickets by queue and time to answer", "SLAs met and missed", "Satisfaction after closing"],
    },
  ],
  decides: [
    {
      label: "Routing",
      text: "A ticket goes to the first queue whose rule matches its address, form or customer.",
    },
    {
      label: "SLA",
      text: "A ticket's clock runs in the queue's working hours and pauses while waiting for the customer.",
    },
    {
      label: "Customers",
      text: "A ticket is matched to a CRM contact by email; nothing is matched by guesswork.",
    },
  ],
  inputs: [
    {
      name: "Email",
      how: "Support addresses on Mail, or any mail server over IMAP.",
    },
    {
      name: "Forms and Live Chat",
      how: "Requests from the site.",
    },
  ],
  screens: [
    {
      page: "queue",
      title: "Queue",
      shows: "Open tickets with their SLAs.",
    },
    {
      page: "ticket",
      title: "Ticket",
      shows: "One ticket with its thread and the customer.",
    },
  ],
  worksWith: [
    {
      id: "mail",
      how: "Support addresses live on Mail.",
    },
    {
      id: "crm",
      how: "The customer and their deals beside each ticket.",
    },
    {
      id: "live-chat",
      how: "Chats become tickets.",
    },
    {
      id: "knowledge-base",
      how: "Articles are suggested before and while answering.",
    },
  ],
  limits: ["Planned: not built yet.", "Phone support and call recording are out of scope.", "Internal IT requests are tickets too, in their own queue."],
};
