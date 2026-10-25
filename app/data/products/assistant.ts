import type { ProductStory } from "./types";

export const assistant: ProductStory = {
  problem: {
    title: "Questions across every product in plain language, with answers that cite their sources",
    headline: "The answer is spread over five products",
    text: 'The answer to "why did checkout fail last night?" is spread over Logs, Metrics, Uptime, SIEM and Incidents. Finding it means knowing each product\'s query language and where to look. Assistant will take the question in plain language, ask the products through their own APIs with your permissions, and answer with links to the exact log lines, graphs and signals it used, so every claim can be checked.',
    example:
      "Someone asks: did anything unusual happen on web-2 yesterday? Assistant answers that a new cron entry and an outbound connection appeared at 03:12, cites the change in Infrastructure and the SIEM signal, and links to both.",
  },
  who: ["Anyone who needs an answer without learning every query language", "On-call engineers, at 3 a.m."],
  glance: [
    {
      label: "Asks",
      value: "Every product's API",
    },
    {
      label: "Answers",
      value: "In plain language",
    },
    {
      label: "Cites",
      value: "Every source it used",
    },
    {
      label: "Sees",
      value: "Only what you may see",
    },
  ],
  flow: [
    {
      label: "A question",
      detail: "In plain language, in the product or from another product.",
    },
    {
      label: "The products are asked",
      detail: "Through their APIs, with the asking person's role, so nobody sees more than they may.",
    },
    {
      label: "An answer",
      detail: "Written from what the products returned.",
    },
    {
      label: "With sources",
      detail: "Every claim links to the log lines, graphs, findings or signals it rests on.",
    },
  ],
  checks: [
    {
      title: "What it can ask",
      items: ["Logs, Metrics and Traces", "Findings in the security products", "Signals, incidents and changes"],
    },
  ],
  decides: [
    {
      label: "Sources",
      text: "An answer cites its sources; a claim with no source is not made.",
    },
    {
      label: "Permissions",
      text: "It sees only what the person asking may see.",
    },
  ],
  inputs: [
    {
      name: "OpenAsy APIs",
      how: "Every product's API, with the asking person's permissions.",
    },
    {
      name: "A language model",
      how: "One you choose, run where you decide.",
    },
  ],
  screens: [
    {
      page: "ask",
      title: "Ask",
      shows: "A question and its answer, with the sources it cites.",
      story: "ask",
    },
    {
      page: "history",
      title: "History",
      shows: "Past questions and answers.",
      story: "history-list",
    },
    {
      page: "sources",
      title: "Sources",
      shows: "Which products it may ask.",
      story: "sources",
    },
  ],
  worksWith: [
    {
      id: "logs",
      how: "Searches logs for the answer and links to the lines.",
    },
    {
      id: "siem",
      how: "Reads signals and links to them.",
    },
    {
      id: "incidents",
      how: "Summarizes an incident's timeline.",
    },
  ],
  limits: ["It answers from what the products hold; it does not change anything.", "Which language model runs, and where, is the install's choice."],
};
