import type { ProductStory } from "./types";

export const messages: ProductStory = {
  problem: {
    title: "Email, SMS and WhatsApp campaigns and journeys, through your own providers, only to people who agreed",
    headline: "Your customer list should not live in someone else's mailing tool",
    text: "Sending a newsletter or a welcome series usually means uploading your customers to a hosted tool abroad, paying per contact, and hoping it respects İYS. Messages keeps the list in your install and sends through the providers you already pay for: your SMTP or Amazon SES for email, Netgsm or İleti Merkezi for SMS, the WhatsApp Business API. It checks consent before every message and reports what was delivered, opened and clicked.",
    example:
      "A new user signs up. Messages starts the welcome journey: a welcome email at once, a tips email a day later, and an SMS on day three only if the emails were not opened and the person agreed to SMS. Clicks show in Analytics under the journey's campaign, and replies of STOP remove the person through Consent.",
  },
  who: ["Marketing teams, who run campaigns", "Product teams, who send onboarding and lifecycle messages"],
  glance: [
    { label: "Channels", value: "Email, SMS, WhatsApp" },
    { label: "Sends through", value: "Your own providers" },
    { label: "Before sending", value: "Consent is checked" },
    { label: "Reports", value: "Delivered, opened, clicked" },
  ],
  flow: [
    { label: "Providers in a file", detail: "SMTP, Amazon SES, Netgsm, İleti Merkezi or WhatsApp, with their keys in environment variables." },
    { label: "Who receives", detail: "A segment from Audience, an imported list, or the people a journey's trigger picks." },
    { label: "Consent checked", detail: "Each person's consent for that channel is checked first, through Consent or the product's own list." },
    { label: "Results", detail: "Delivery, opens, clicks, bounces and unsubscribes per message, and clicks in Analytics." },
  ],
  checks: [
    {
      title: "Campaigns",
      items: ["One send to a segment or list", "Templates with personal fields", "A/B tests of subject and content"],
    },
    {
      title: "Journeys",
      items: ["Started by an event, such as a sign-up", "Waits, conditions and channel changes", "A person leaves when they convert or opt out"],
    },
  ],
  decides: [
    { label: "May send", text: "A message goes only to people whose consent for that channel holds when it is sent, not when it was scheduled." },
    { label: "Unsubscribe", text: "Every email carries an unsubscribe link, and every SMS a way to stop; both take effect at once." },
    { label: "Bounces", text: "An address that bounces hard is not sent to again until someone fixes it." },
  ],
  inputs: [
    { name: "Email", how: "Your SMTP server or Amazon SES." },
    { name: "SMS", how: "Netgsm or İleti Merkezi, with your sender name." },
    { name: "WhatsApp", how: "The WhatsApp Business API, with approved templates." },
  ],
  screens: [
    { page: "campaigns", title: "Campaigns", shows: "Every campaign with its audience, channel and results." },
    { page: "journeys", title: "Journeys", shows: "Each journey's steps and how many people are at each." },
  ],
  worksWith: [
    { id: "audience", how: "Segments are the audience of campaigns and journeys." },
    { id: "consent", how: "Consent is checked for every person on every channel." },
    { id: "analytics", how: "Clicks arrive with the campaign, so visits and goals count them." },
    { id: "campaigns", how: "Sends and results roll up into the marketing calendar." },
  ],
  limits: [
    "Planned: not built yet.",
    "It does not run a mail or SMS server; it sends through your providers.",
    "Push notifications come after email, SMS and WhatsApp.",
  ],
};
