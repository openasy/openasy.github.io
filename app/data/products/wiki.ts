import type { ProductStory } from "./types";

export const wiki: ProductStory = {
  problem: {
    title: "The company's handbook and how-tos, written together and searchable",
    headline: "What the company knows is in people's heads",
    text: "How to request leave, how a deploy is done, what the travel policy says: the answers are in an old document, a chat thread or one person's memory. Wiki gives the company one place to write it down: pages by team, written together, searchable, with who may read and change each part set by group.",
    example:
      "A new engineer starts on Monday. Their onboarding page links the deploy guide, the on-call handbook and the leave policy; when the deploy changes, the team edits one page and everyone reads the new one.",
  },
  who: ["Everyone, who needs to find how things are done", "Team leads, who write it down once"],
  glance: [
    {
      label: "Pages",
      value: "By team and topic",
    },
    {
      label: "Writing",
      value: "Together, in the browser",
    },
    {
      label: "Access",
      value: "By Identity group",
    },
    {
      label: "History",
      value: "Every change kept",
    },
  ],
  flow: [
    {
      label: "Spaces",
      detail: "One per team or topic, with who may read and edit it.",
    },
    {
      label: "Write",
      detail: "Pages in a simple editor, with images, tables and links between pages.",
    },
    {
      label: "Find",
      detail: "Search across every page you may read.",
    },
    {
      label: "Keep current",
      detail: "Pages not touched for a long time are listed for their owner.",
    },
  ],
  checks: [
    {
      title: "Pages",
      items: ["Headings, tables, images and code", "Links between pages and to other products", "Templates for how-tos and policies"],
    },
    {
      title: "Upkeep",
      items: ["Every change with who made it", "Owners per page", "Pages not reviewed for months"],
    },
  ],
  decides: [
    {
      label: "Access",
      text: "A space's readers and editors come from Identity groups.",
    },
    {
      label: "Policies",
      text: "A page marked as a policy shows who has read its current version.",
    },
    {
      label: "Stale",
      text: "A page not reviewed within its space's period is marked stale for its owner.",
    },
  ],
  inputs: [
    {
      name: "Import",
      how: "Markdown and HTML from another wiki.",
    },
    {
      name: "The API",
      how: "Pages from your own tools, such as generated documentation.",
    },
  ],
  screens: [
    { page: "page", title: "Page", shows: "A page with the space's tree, its owner, review date and changes.", story: "page" },
    { page: "edit", title: "Editing", shows: "The editor with its toolbar, a note on what changed, and who else is editing.", story: "edit" },
    { page: "stale", title: "To review", shows: "Pages past their review period, the most read and longest overdue first.", story: "to-review" },
    { page: "policies", title: "Policies", shows: "Policies and who has not read their current version yet.", story: "policies" },
  ],
  worksWith: [
    {
      id: "identity",
      how: "Sign-in, and spaces by group.",
    },
    {
      id: "hr",
      how: "Onboarding pages for new people.",
    },
    {
      id: "knowledge-base",
      how: "Articles for customers live in the Knowledge Base, not here.",
    },
    {
      id: "awareness",
      how: "Security policies people must read.",
    },
  ],
  limits: [
    "Designed: the screens are in Storybook; it is not built yet.",
    "Writing together on the same page at the same time comes after the first release.",
    "It is for the company's own people; customer help lives in the Knowledge Base.",
  ],
};
