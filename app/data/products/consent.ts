import type { ProductStory } from "./types";

export const consent: ProductStory = {
  problem: {
    title: "Who agreed to what, on which channel and to which text, with İYS kept in step",
    headline: "A message sent without consent is a fine waiting to happen",
    text: "KVKK asks for explicit consent for most marketing, and in Türkiye every commercial message also needs the person's consent recorded in İYS. Consent usually lives in a cookie banner, a checkbox in a form and a spreadsheet nobody trusts. Consent keeps one record per person of what they agreed to, for which purpose and channel, when, and to which version of the text, syncs it with İYS both ways, and gives sites a banner and a preference page.",
    example:
      "A customer replies STOP to an SMS. The provider reports it, İYS records the refusal, and Consent picks it up within minutes. Messages drops the person from tonight's campaign, and the record shows the refusal, its source and its time, next to the form where they had agreed a year before.",
  },
  who: ["Data protection officers, who answer for consent", "Marketing teams, who need to know who they may reach"],
  glance: [
    { label: "Records", value: "Purpose, channel, text, time" },
    { label: "Syncs with", value: "İYS, both ways" },
    { label: "Gives sites", value: "A banner and a preference page" },
    { label: "History", value: "Nobody can edit it" },
  ],
  flow: [
    { label: "Purposes in a file", detail: "Each purpose and its text, versioned, so a change of wording is a new version people agree to." },
    { label: "People agree", detail: "On the banner, a form, the preference page or the API; each answer is recorded with its source." },
    { label: "İYS in step", detail: "Consents and refusals for email, SMS and calls go to İYS and come back from it." },
    { label: "Products ask", detail: "Messages, Analytics and Forms check consent before they act." },
  ],
  checks: [
    {
      title: "A consent record",
      items: ["Purpose and channel", "The version of the text the person saw", "When, where and how it was given or withdrawn"],
    },
    {
      title: "For sites",
      items: [
        "A cookie banner from one script tag",
        "A preference page where people change their mind",
        "Analytics started only after consent, on sites that ask first",
      ],
    },
  ],
  decides: [
    { label: "May we", text: "A person may be reached on a channel for a purpose only while their latest answer for it is yes." },
    { label: "New text", text: "When the text of a purpose changes, earlier consents stay tied to the version they were given for." },
    { label: "Conflicts", text: "When İYS and a local record disagree, the later answer wins and both are kept." },
  ],
  inputs: [
    { name: "İYS", how: "Through your İYS account and brand code, set in the product's own file." },
    { name: "Banner and preference page", how: "One script tag on the site." },
    { name: "The API", how: "Consents from your own forms and applications." },
  ],
  screens: [
    { page: "people", title: "People", shows: "Each person's consents by purpose and channel, and their history." },
    { page: "purposes", title: "Purposes", shows: "Every purpose with its text versions and how many agreed." },
  ],
  worksWith: [
    { id: "messages", how: "Nobody is sent a message without consent for that channel." },
    { id: "analytics", how: "Sites that ask first start measuring when the banner says yes." },
    { id: "forms", how: "A form's consent checkbox is recorded here." },
    { id: "audience", how: "Profiles show what each person agreed to." },
  ],
  limits: [
    "Planned: not built yet.",
    "It records and enforces consent; whether a purpose needs consent is a legal question for you.",
    "İYS covers commercial electronic messages in Türkiye; other countries' registries are not included.",
  ],
};
