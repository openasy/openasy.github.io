import type { ProductStory } from "./types";

export const mail: ProductStory = {
  problem: {
    title: "Your company's email on your own server, with webmail, mailboxes and delivery reports",
    headline: "Every email your company sends is kept by someone else",
    text: "Contracts, offers, passwords that should not have been sent and every customer conversation live in a hosted mailbox abroad, priced per user. Mail runs your company's email in your install: Stalwart, a proven open-source mail server, receives and sends it, and Mail adds a webmail of our own, the administration of domains, mailboxes and aliases from a file, and reports on what was delivered and what was not.",
    example:
      "A new employee joins. Their mailbox is added to the file and is ready within a minute, with sign-in through Identity. They read mail in the webmail at work and in the iPhone's own Mail app at home. When an offer to a customer bounces, the delivery report shows the receiving server's answer and that the customer's domain rejected the message for its size.",
  },
  who: ["IT teams, who run the company's email", "Everyone in the company, who reads and writes it"],
  glance: [
    { label: "Server", value: "Stalwart, open source" },
    { label: "Webmail", value: "Written by OpenAsy" },
    { label: "Other clients", value: "IMAP and SMTP" },
    { label: "Priced", value: "Free, no per-user fee" },
  ],
  flow: [
    { label: "Domains in a file", detail: "Domains, mailboxes, aliases and quotas, reviewed like code and applied to the server." },
    { label: "DNS", detail: "Mail shows the MX, SPF, DKIM, DMARC and MTA-STS records each domain needs, and checks they are in place." },
    { label: "Mail flows", detail: "Stalwart receives and sends, filters spam and signs outgoing mail; a relay can be set for outgoing mail." },
    { label: "Read and report", detail: "People read in the webmail or their own client; IT sees the queue, bounces and delivery reports." },
  ],
  checks: [
    {
      title: "Webmail",
      items: ["Inbox, threads, search and folders", "Writing with attachments and signatures", "Filters and out-of-office replies"],
    },
    {
      title: "Administration",
      items: ["Domains, mailboxes, aliases and quotas", "DNS records checked for each domain", "Queue, bounces and DMARC reports"],
    },
  ],
  decides: [
    { label: "Sign-in", text: "People sign in to the webmail through Identity; other clients use a password made for that device, which can be revoked." },
    { label: "Outgoing", text: "Mail is sent directly, or through a relay set on the mail server when its address cannot send on its own." },
    { label: "Changes", text: "A mailbox removed from the file is disabled, not deleted; its mail is kept until an admin deletes it." },
  ],
  inputs: [
    { name: "Stalwart", url: "https://stalw.art", how: "The mail server, run next to Mail from its published image." },
    { name: "Mail clients", how: "Outlook, Thunderbird and phone mail apps, over IMAP and SMTP." },
    { name: "Migration", how: "Mail imported over IMAP from the old provider." },
  ],
  screens: [
    { page: "inbox", title: "Inbox", shows: "A person's mail by thread, with search and folders." },
    { page: "domains", title: "Domains", shows: "Each domain with its mailboxes and whether its DNS records are right." },
  ],
  worksWith: [
    { id: "identity", how: "People sign in to the webmail with their company account." },
    { id: "messages", how: "Messages can send campaign and transactional email through Mail's server." },
    { id: "logs", how: "Delivery and sign-in events are sent as logs." },
    { id: "alerts", how: "A growing queue or a domain on a blocklist raises an alert." },
  ],
  limits: [
    "Planned: not built yet.",
    "Calendars and contacts come after the first release.",
    "Delivery depends on your server's address and DNS; on networks that block outgoing mail, a relay is needed.",
  ],
};
