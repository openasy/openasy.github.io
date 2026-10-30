import type { ProductStory } from "./types";

export const knowledgeBase: ProductStory = {
  problem: {
    title: "A public help center of articles, suggested before customers open a ticket",
    headline: "Support answers the same question every day",
    text: "Half of support's tickets ask how to do something already explained in an email somebody wrote last year. Knowledge Base gives customers a help center of articles by topic, searchable, in your languages, and suggests the right article in the ticket form and the chat window before a ticket is opened.",
    example:
      'A customer starts a ticket titled "reset password". Before they send it, the form shows the article on resetting a password; they read it and close the form. Support sees that the article answered 140 questions this month.',
  },
  who: ["Customers, who want an answer now", "Support teams, who write it once"],
  glance: [
    {
      label: "Articles",
      value: "By topic and language",
    },
    {
      label: "Suggested in",
      value: "Forms and chat",
    },
    {
      label: "Search",
      value: "Across all articles",
    },
    {
      label: "Measures",
      value: "Questions it answered",
    },
  ],
  flow: [
    {
      label: "Write",
      detail: "Articles by topic, with images and steps, in each language you support.",
    },
    {
      label: "Publish",
      detail: "On a help center of its own, or under your site's address.",
    },
    {
      label: "Suggest",
      detail: "The ticket form and the chat window suggest articles as people type.",
    },
    {
      label: "Improve",
      detail: "Searches with no answer and articles that did not help are listed.",
    },
  ],
  checks: [
    {
      title: "Articles",
      items: ["Topics, articles and their languages", "Drafts, review and publishing", "Articles for customers of a given plan only"],
    },
    {
      title: "Reports",
      items: ["Views and searches", "Searches that found nothing", "Tickets avoided after an article"],
    },
  ],
  decides: [
    {
      label: "Publishing",
      text: "An article is public once reviewed; drafts are seen only by the team.",
    },
    {
      label: "Languages",
      text: "An article in a language is shown to readers of that language, and the default one otherwise.",
    },
    {
      label: "Helpful",
      text: "Each article asks whether it helped; ones that often do not are listed for their owner.",
    },
  ],
  inputs: [
    {
      name: "Import",
      how: "Markdown and HTML from another help center.",
    },
  ],
  screens: [
    {
      page: "articles",
      title: "Articles",
      shows: "Topics and articles with their views.",
    },
    {
      page: "gaps",
      title: "Gaps",
      shows: "Searches that found nothing.",
    },
  ],
  worksWith: [
    {
      id: "helpdesk",
      how: "Articles are suggested before and while answering.",
    },
    {
      id: "live-chat",
      how: "Articles are suggested in the chat window.",
    },
    {
      id: "analytics",
      how: "Help center visits are measured.",
    },
  ],
  limits: ["Planned: not built yet.", "It is for customers; the company's own handbook lives in Wiki.", "Community forums are out of scope."],
};
