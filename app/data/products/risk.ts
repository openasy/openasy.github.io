import type { ProductStory } from "./types";

export const risk: ProductStory = {
  problem: {
    title: "A risk register and vendor reviews people actually keep up to date",
    headline: "A risk register nobody opens between audits",
    text: "Every company has risks it lives with: an old system that cannot be patched, a vendor that holds customer data, a control not yet in place. They usually live in a spreadsheet nobody opens between audits, with decisions nobody can trace. Risk keeps the register, scores each risk, records who accepted it and until when, reminds you when a review is due, and keeps a history nobody can edit.",
    example:
      "A legacy payment server cannot be upgraded this year. The risk is scored likelihood 3, impact 5: 15, high. The CTO accepts it until March with a reason, and it is linked to ISO 27001 control A.8.8. In March it turns review-due by itself. Every change to it, and who made it, is in its history.",
  },
  who: [
    "Security and compliance teams, who keep the register",
    "Risk owners, who treat or accept their risks",
    "Auditors, who ask what was decided and by whom",
  ],
  glance: [
    {
      label: "Keeps",
      value: "Risks and vendors",
    },
    {
      label: "Scores",
      value: "Likelihood times impact",
    },
    {
      label: "Links to",
      value: "ISO 27001 and SOC 2",
    },
    {
      label: "History",
      value: "Nobody can edit it",
    },
  ],
  flow: [
    {
      label: "Risks come in",
      detail: "Written by people, or opened by other products for a finding nobody fixes, without duplicates.",
    },
    {
      label: "Scored",
      detail: "Likelihood times impact, each 1 to 5, and a residual score after treatment.",
    },
    {
      label: "Treated or accepted",
      detail: "Mitigate, transfer, avoid, or accept with a reason, an approver and an end date.",
    },
    {
      label: "Reviewed",
      detail: "Reviews and acceptances come due by themselves; every change is kept in a history nobody edits.",
    },
  ],
  checks: [
    {
      title: "Risks",
      items: [
        "Category, owner, plan, tags and links to controls, findings, incidents and vendors",
        "Bands: low under 5, medium from 5, high from 10, critical from 17",
        "A heat map by likelihood and impact, before or after treatment",
      ],
    },
    {
      title: "Controls",
      items: ["ISO 27001 and SOC 2 controls linked to the risks they treat", "The controls that treat no risk yet"],
    },
    {
      title: "Vendors",
      items: [
        "What each does and the data classes it holds",
        "Criticality, questionnaire, rating and links to its documents",
        "Reviewed every 365 days by default",
      ],
    },
  ],
  decides: [
    {
      label: "Score",
      text: "The score is likelihood times impact; the band follows from it.",
    },
    {
      label: "Accepting",
      text: "Accepting a risk needs a reason, an approver and an end at most 366 days away, and only admins accept.",
    },
    {
      label: "Reviews",
      text: "When an acceptance ends, the risk is review-due until someone accepts it again or changes its status.",
    },
    {
      label: "History",
      text: "The database refuses to change or delete a history row.",
    },
  ],
  inputs: [
    {
      name: "People",
      how: "Write risks and vendors in the product.",
    },
    {
      name: "The API",
      how: "Other products open risks with a token of the editor role; the same reference never opens two.",
    },
  ],
  screens: [
    {
      page: "overview",
      title: "Overview",
      shows: "Open risks by band, reviews overdue, and the risks and vendors that need a look.",
    },
    {
      page: "risks",
      title: "Risks",
      shows: "The register, with score, band, status, owner and next review.",
      story: "register",
    },
    {
      page: "heatmap",
      title: "Heat map",
      shows: "Open risks by likelihood and impact, before or after treatment.",
      story: "reports",
    },
    {
      page: "vendors",
      title: "Vendors",
      shows: "Every vendor, the data it holds, its criticality and next review.",
      story: "vendors",
    },
  ],
  worksWith: [
    {
      id: "posture",
      how: "A failed control that cannot be fixed soon is recorded here as a risk.",
    },
    {
      id: "vulnerabilities",
      how: "A vulnerability that is accepted for long is a risk to keep here.",
    },
    {
      id: "incidents",
      how: "Risks link to the incidents that made them real.",
    },
    {
      id: "identity",
      how: "People sign in with Identity or any OpenID Connect provider.",
    },
  ],
  limits: [
    "Links to other products are references only: nothing is fetched from them.",
    "Vendor documents are links; nothing is stored or fetched.",
    "It is a register, not an audit tool: evidence collection is the planned Compliance product.",
  ],
};
