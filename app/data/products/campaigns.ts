import type { ProductStory } from "./types";

export const campaigns: ProductStory = {
  problem: {
    title: "Plan every campaign in one calendar, with its budget, approvals, tagged links and results",
    headline: "Nobody knows which campaign paid for itself",
    text: "A campaign is planned in a spreadsheet, its links are tagged by hand and spelled three ways, its budget is in another file, and its results are in Analytics, the mailing tool and the CRM. Campaigns brings them together: a calendar with each campaign's brief, budget and tasks, approvals before anything goes out, links and QR codes tagged by rules, and one page of results from every channel.",
    example:
      "The autumn campaign is planned for October with a budget of 120,000 TL. Its links are made in Campaigns, so every one carries utm_campaign=autumn-2026. At the end of the month its page shows 6,400 visits from Analytics, 18% opens from Messages and 31 won deals from CRM, against the money spent.",
  },
  who: ["Marketing managers, who plan and answer for the budget", "Marketing teams, who make and launch the work"],
  glance: [
    { label: "Plans", value: "Calendar, budget, tasks" },
    { label: "Makes", value: "Tagged links and QR codes" },
    { label: "Approves", value: "Before anything goes out" },
    { label: "Results from", value: "Analytics, Messages, CRM" },
  ],
  flow: [
    { label: "Plan", detail: "A campaign with its dates, goal, brief, budget and owner in the calendar." },
    { label: "Prepare", detail: "Tasks and assets, and an approval from the people the campaign names." },
    { label: "Launch", detail: "Links and QR codes tagged by the install's naming rules, so every channel reports under one name." },
    { label: "Measure", detail: "Visits, goals, messages and deals for the campaign, against what it cost." },
  ],
  checks: [
    {
      title: "Planning",
      items: ["A calendar of campaigns and their channels", "Budget and spend by campaign and channel", "Tasks, briefs and approvals"],
    },
    {
      title: "Results",
      items: ["Visits and goals from Analytics", "Sends, opens and clicks from Messages", "Deals and revenue from CRM, first and last touch"],
    },
  ],
  decides: [
    { label: "Naming", text: "Campaign names and UTM values follow rules set in a file, so one campaign never reports under two names." },
    { label: "Approval", text: "A campaign that names approvers cannot be marked live until each of them has approved." },
    {
      label: "Attribution",
      text: "A deal counts for the first and the last campaign that touched it, both shown, never blended into a model nobody can explain.",
    },
  ],
  inputs: [
    { name: "Linked products", how: "Analytics, Messages and CRM send their results once linked." },
    { name: "Spend", how: "Entered by hand or imported per channel." },
  ],
  screens: [
    { page: "calendar", title: "Calendar", shows: "Every campaign over the months, by channel." },
    { page: "campaign", title: "Campaign", shows: "One campaign's brief, budget, links and results." },
  ],
  worksWith: [
    { id: "analytics", how: "Visits and goals arrive under the campaign's tagged links." },
    { id: "messages", how: "Sends and their results roll up into the campaign." },
    { id: "crm", how: "Won deals count toward the campaign that brought them." },
    { id: "automation", how: "A launch step can start other products' work." },
  ],
  limits: ["Planned: not built yet.", "It does not buy or manage ads; spend from ad platforms is imported.", "Attribution is first and last touch only."],
};
