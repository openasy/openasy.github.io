import type { ProductStory } from "./types";

export const compliance: ProductStory = {
  problem: {
    title: "ISO 27001, SOC 2, GDPR and PCI controls, with evidence collected from what already runs",
    headline: "The evidence already exists in the tools that do the work",
    text: "An audit is weeks of screenshots and spreadsheets proving that controls work: backups are tested, vulnerabilities are fixed, access is reviewed. The evidence already exists in the tools that do the work. Compliance will map each control to the OpenAsy products that prove it, collect their evidence continuously, and show which controls are met and which need attention before the auditor asks.",
    example:
      "An auditor asks for evidence that backups are restored. Compliance shows ISO 27001 control A.8.13 as met, with Backups' restore tests of the last 90 days attached. A control about access reviews shows a gap: no review in the last quarter.",
  },
  who: ["Compliance and security teams, who prepare audits", "Auditors, who read the evidence", "Control owners"],
  glance: [
    {
      label: "Frameworks",
      value: "ISO 27001, SOC 2, GDPR, PCI",
    },
    {
      label: "Evidence from",
      value: "Every OpenAsy product",
    },
    {
      label: "Collects",
      value: "Continuously",
    },
    {
      label: "Shows",
      value: "Controls met and gaps",
    },
  ],
  flow: [
    {
      label: "Frameworks",
      detail: "ISO 27001, SOC 2, GDPR and PCI DSS controls.",
    },
    {
      label: "Mapped to products",
      detail: "Each control names the products whose data proves it.",
    },
    {
      label: "Evidence collected",
      detail: "From those products continuously, with its date.",
    },
    {
      label: "Ready for an audit",
      detail: "Controls met, gaps, and reports to hand over.",
    },
  ],
  checks: [
    {
      title: "Frameworks",
      items: ["ISO 27001", "SOC 2", "GDPR", "PCI DSS"],
    },
    {
      title: "Evidence from",
      items: [
        "Backups' restore tests",
        "Vulnerabilities and Posture findings",
        "Identity's second-factor coverage and audit log",
        "Risk's register and Incidents' postmortems",
      ],
    },
  ],
  decides: [
    {
      label: "Met",
      text: "A control is met when its evidence is present and recent enough.",
    },
    {
      label: "Gaps",
      text: "A gap names what is missing and since when.",
    },
  ],
  inputs: [
    {
      name: "OpenAsy APIs",
      how: "Evidence read from each product's API.",
    },
  ],
  screens: [
    {
      page: "overview",
      title: "Overview",
      shows: "Each framework's controls met, partly met and open.",
      story: "overview",
    },
    {
      page: "controls",
      title: "Controls",
      shows: "Every control, its owner, its evidence and its state.",
      story: "controls",
    },
    {
      page: "evidence",
      title: "Evidence",
      shows: "What each product has proved, and when.",
      story: "evidence-library",
    },
    {
      page: "audits",
      title: "Audits",
      shows: "Audits, their scope and what to hand over.",
      story: "audits",
    },
  ],
  worksWith: [
    {
      id: "risk",
      how: "Risks link to the controls that treat them.",
    },
    {
      id: "backups",
      how: "Restore tests are backup evidence.",
    },
    {
      id: "identity",
      how: "Second-factor coverage and the audit log are access evidence.",
    },
  ],
  limits: [
    "It collects evidence; it does not certify anything. The auditor does.",
    "Controls outside software, such as HR processes, need evidence added by hand.",
  ],
};
