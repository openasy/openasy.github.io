import type { ProductStory } from "./types";

export const chat: ProductStory = {
  problem: {
    title: "Team messaging with channels, threads and files, on your own server",
    headline: "Your team's conversations should not live in someone else's cloud",
    text: "Decisions, passwords pasted by mistake, customer names and plans: a hosted chat keeps every word abroad and prices it per seat. Chat runs team messaging in your install, built on a proven open-source messaging server, with channels by team and project, threads, direct messages, files and search, and sign-in through Identity.",
    example:
      "An alert fires at night. Alerts posts it to the on-call channel, the engineer answers in its thread, and the decision is still there in the morning, searchable, next to the incident it opened.",
  },
  who: ["Everyone in the company, who talks to each other all day", "Teams that work with alerts, deploys and incidents"],
  glance: [
    {
      label: "Runs on",
      value: "Your own server",
    },
    {
      label: "Sign-in",
      value: "Through Identity",
    },
    {
      label: "Apps",
      value: "Browser, desktop, phone",
    },
    {
      label: "Priced",
      value: "Free, no seats",
    },
  ],
  flow: [
    {
      label: "Channels in a file",
      detail: "Company-wide and team channels, and who joins them, set like everything else.",
    },
    {
      label: "Talk",
      detail: "Messages, threads, reactions, mentions and files, in channels or directly.",
    },
    {
      label: "Find",
      detail: "Search across everything you can see.",
    },
    {
      label: "Connect",
      detail: "Other products post into channels: alerts, incidents, deploys.",
    },
  ],
  checks: [
    {
      title: "Messaging",
      items: ["Channels, private channels and direct messages", "Threads, mentions and reactions", "Files and images, kept in your install"],
    },
    {
      title: "For the company",
      items: ["Channels by group from Identity", "Retention set per channel", "Export for a legal request"],
    },
  ],
  decides: [
    {
      label: "Who sees what",
      text: "People see public channels and the private ones they were added to; leaving the company removes them from all.",
    },
    {
      label: "Retention",
      text: "Messages are kept as long as the channel's retention says, then deleted.",
    },
    {
      label: "Guests",
      text: "People outside the company join only the channels they are invited to.",
    },
  ],
  inputs: [
    {
      name: "Identity",
      how: "Sign-in and groups.",
    },
    {
      name: "Webhooks",
      how: "Messages from your own tools.",
    },
  ],
  screens: [
    {
      page: "channel",
      title: "Channel",
      shows: "A channel's messages with their threads.",
    },
    {
      page: "search",
      title: "Search",
      shows: "Messages and files across channels.",
    },
  ],
  worksWith: [
    {
      id: "identity",
      how: "Sign-in, and channels by group.",
    },
    {
      id: "alerts",
      how: "Alerts post to a channel.",
    },
    {
      id: "incidents",
      how: "An incident gets its own channel.",
    },
    {
      id: "meet",
      how: "A call starts from a channel.",
    },
  ],
  limits: [
    "Planned: not built yet.",
    "Built on an existing open-source messaging server, chosen before work starts.",
    "Federation with other companies' servers comes after the first release.",
  ],
};
