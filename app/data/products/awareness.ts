import type { ProductStory } from "./types";

export const awareness: ProductStory = {
  problem: {
    title: "People who spot a phishing email, and the training records to prove it",
    headline: "Most breaches start with a person",
    text: "Most breaches start with a person: a convincing email, a fake login page, a call that asks for a code. Technology catches much of it, not all. Awareness will run phishing simulations, give short training to the people who click, and keep the records ISO 27001 and SOC 2 ask for.",
    example:
      "A simulated invoice email goes to the finance team. Eight people click, two enter a password on the fake page. They get a five-minute lesson on the spot; the next campaign a month later, one person clicks.",
  },
  who: ["The security team, who run campaigns", "Everyone, who gets the training", "Auditors, who ask for training records"],
  glance: [
    {
      label: "Runs",
      value: "Phishing simulations",
    },
    {
      label: "Trains",
      value: "Whoever clicked",
    },
    {
      label: "Measures",
      value: "Clicks and reports",
    },
    {
      label: "Records",
      value: "Training for audits",
    },
  ],
  flow: [
    {
      label: "A campaign",
      detail: "A simulated phishing email from a template, to chosen groups.",
    },
    {
      label: "Who clicked",
      detail: "Opens, clicks and passwords entered, without keeping the password.",
    },
    {
      label: "Training",
      detail: "A short lesson for those who clicked, and courses for everyone.",
    },
    {
      label: "Records",
      detail: "Who was trained and when, for audits.",
    },
  ],
  checks: [
    {
      title: "Measured",
      items: ["Click and report rates per campaign and group", "Training completion", "Progress over time"],
    },
  ],
  decides: [
    {
      label: "Scoring",
      text: "A click or an entered password counts against the campaign; a reported email counts for it.",
    },
  ],
  inputs: [
    {
      name: "Identity",
      how: "People and groups to send campaigns and training to.",
    },
  ],
  screens: [
    {
      page: "campaigns",
      title: "Campaigns",
      shows: "Each campaign and how many clicked or reported.",
      story: "campaigns",
    },
    {
      page: "training",
      title: "Training",
      shows: "Courses and who completed them.",
      story: "training",
    },
    {
      page: "people",
      title: "People",
      shows: "Each person's campaigns and training.",
      story: "people",
    },
  ],
  worksWith: [
    {
      id: "compliance",
      how: "Training records as evidence for ISO 27001 A.6.3 and SOC 2 CC2.2.",
    },
    {
      id: "identity",
      how: "People and groups.",
    },
  ],
  limits: ["A simulation measures behaviour; it does not block real phishing.", "Passwords entered on a simulated page are never kept."],
};
