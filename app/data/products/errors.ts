import type { ProductStory } from "./types";

export const errors: ProductStory = {
  problem: {
    title: "Your application's errors grouped into issues, with who they hit and whether a fix held",
    headline: "Users hit errors you never see",
    text: "Users hit errors you never see: a TypeError in the checkout, a timeout on one endpoint, a crash on one browser. Logs show them as thousands of lines; nobody knows which matter, which are new in this release, or whether last week's fix worked. Errors groups every error into an issue, counts the events and the people it hit, ties it to the release it came with, and reopens it as a regression if it comes back after a fix.",
    example:
      "Release 2.4.0 goes out. Within the hour a new issue appears: TypeError in cart total, 214 events, 38 users, first seen in 2.4.0. The team fixes it in 2.4.1 and resolves the issue with that release. Two weeks later it happens again in 2.6.0, and the issue reopens as a regression: fix meant for 2.4.1, came back in 2.6.0.",
  },
  who: ["Developers, who fix what users hit", "Release managers, who see what each release brought"],
  glance: [
    {
      label: "Takes",
      value: "One HTTP request per error",
    },
    {
      label: "Groups by",
      value: "Exception and your own frames",
    },
    {
      label: "Tracks",
      value: "Releases and regressions",
    },
    {
      label: "Never keeps",
      value: "Bodies, headers, cookies",
    },
  ],
  flow: [
    {
      label: "Your application sends",
      detail: "One HTTP request per error with the exception, frames, release and user id. No SDK is needed.",
    },
    {
      label: "Grouped into issues",
      detail: "Same exception type and the same last three frames of your own code: one issue, even when lines move.",
    },
    {
      label: "Counted",
      detail: "Events, distinct users, releases and environments, with the latest 20 stack traces.",
    },
    {
      label: "Resolve and watch",
      detail: "Resolve with the release that fixes it; if it returns, it reopens as a regression.",
    },
  ],
  checks: [
    {
      title: "What an issue keeps",
      items: [
        "First and last time, event count and how many distinct users it hit",
        "The releases and environments it appeared in",
        "The latest 20 events with their stack traces",
      ],
    },
    {
      title: "Releases",
      items: ["When each release was first seen", "How many new issues it brought"],
    },
  ],
  decides: [
    {
      label: "Issue",
      text: "Events with the same exception type and the same last three frames of your own code (file and function, never line numbers) are one issue.",
    },
    {
      label: "No frames",
      text: "Without frames, messages are compared with numbers, hex values, UUIDs and quoted text ignored; send a fingerprint to decide yourself.",
    },
    {
      label: "Regressions",
      text: "A resolved issue that happens again, in any release, reopens as a regression. Ignored issues stay quiet.",
    },
  ],
  inputs: [
    {
      name: "The events API",
      how: "POST /api/v1/events with the project's key, from any language, with or without an SDK.",
    },
  ],
  screens: [
    {
      page: "overview",
      title: "Overview",
      shows: "Unresolved issues, events per hour, people affected, and the projects and issues with the most.",
    },
    {
      page: "issues",
      title: "Issues",
      shows: "Every issue with its events, users, releases and whether it regressed.",
      story: "issues",
    },
    {
      page: "projects",
      title: "Projects",
      shows: "Each application, its key and its open issues.",
    },
  ],
  worksWith: [
    {
      id: "logs",
      how: "Logs keeps the surrounding log lines; Errors keeps the error itself, grouped.",
    },
    {
      id: "incidents",
      how: "An error that takes production down is run as an incident there.",
    },
    {
      id: "identity",
      how: "People sign in with Identity or any OpenID Connect provider.",
    },
  ],
  limits: [
    "Request bodies, headers and cookies are refused, so a mistake in an SDK cannot start a leak; a user is only an id.",
    "Passwords, tokens and keys in messages and tags are masked before anything is stored.",
    "Only the latest 20 events of an issue are kept; older ones are counted and dropped.",
    "It does not trace requests across services; that is Traces.",
  ],
};
