import type { ProductStory } from "./types";

export const analytics: ProductStory = {
  problem: {
    title: "How people use your websites, from one script tag, kept in your install",
    headline: "Your visitors' clicks end up on someone else's servers",
    text: "To learn which pages people read, where they come from and where they give up, most teams add a hosted analytics script. Every visit then goes to another company, often abroad, joined with other sites' visitors. Analytics gives the same picture from one script your install serves: visits with their source, the pages read and for how long, what was clicked, your own events and goals, and every visit in order. Sites are listed in a file, so the list is reviewed like code.",
    example:
      "A campaign email goes out. By noon the overview shows 840 visitors from utm_campaign=fall, most of them reading the pricing page to 40% and leaving. One visit, opened in order, shows the visitor clicking Start trial twice and leaving from the sign-up form. The team moves the plan table up; the next day the Signed up goal goes from 2% to 5% of visits.",
  },
  who: ["Product and marketing teams, who want to know what works on the site", "Developers, who need to see what a visitor did before a problem"],
  glance: [
    {
      label: "Added with",
      value: "One script tag per site",
    },
    {
      label: "Sites set in",
      value: "One YAML file",
    },
    {
      label: "Records",
      value: "Visits, pages, clicks, events",
    },
    {
      label: "Never keeps",
      value: "Form values, IP addresses",
    },
  ],
  flow: [
    {
      label: "List the site",
      detail: "Name it and its domains in analytics.yaml, with its goals; the file is read again within a minute.",
    },
    {
      label: "Add the script",
      detail: "One tag in the head of every page, served by your install, about 2 KB and loading nothing from elsewhere.",
    },
    {
      label: "Pages send",
      detail: "Page views, time and scroll on each page, clicks and your own events, only from the site's domains.",
    },
    {
      label: "Read the reports",
      detail: "Visitors, pages, sources, devices, goals, and any visit with everything it did, in order.",
    },
  ],
  checks: [
    {
      title: "What a visit keeps",
      items: [
        "Where it came from: the referring site and the utm_* parameters",
        "Its entry and exit pages, and each page with the time spent on it and how far it was read",
        "Clicks on links and buttons with what they say, and the site's own events",
        "Its browser, system and kind of device",
      ],
    },
    {
      title: "Reports",
      items: [
        "Visitors, visits, page views, bounce rate and visit length, each day",
        "Pages, entry and exit pages, sources and campaigns, browsers and systems",
        "Goals reached, events and clicks",
        "Every visit, and a visitor's data exported or deleted for a GDPR or KVKK request",
      ],
    },
  ],
  decides: [
    {
      label: "Visit",
      text: "A visit ends after 30 minutes without activity. The visitor and visit ids are random, made per site, and never shared between sites.",
    },
    {
      label: "Consent",
      text: "A site measures from the first page, or with consent: required only after its own banner calls openasy.consent(true); withdrawing it deletes what was kept.",
    },
    {
      label: "Accepted",
      text: "Events are taken only from the site's domains or with its server key. Crawlers, automated browsers and ignored paths are dropped, and each site has events a minute.",
    },
  ],
  inputs: [
    {
      name: "The site's script",
      how: '<script defer src=".../s/shop.js">, with openasy.track(), identify() and consent() on the page.',
    },
    {
      name: "The collect API",
      how: "POST /api/v1/collect with the key the site's serverKey names, for events from its servers such as a payment.",
    },
  ],
  screens: [
    {
      page: "overview",
      title: "Overview",
      shows: "Visitors, visits, page views, bounce rate and visit length over the period, with the top pages, sources, devices and goals.",
    },
    {
      page: "pages",
      title: "Pages",
      shows: "Every page with its views, visitors, time on page and how far it was read, and where visits started and ended.",
    },
    {
      page: "visits",
      title: "Visits",
      shows: "Every visit, and each one in order: what it viewed, clicked and sent.",
    },
  ],
  worksWith: [
    {
      id: "errors",
      how: "Errors keeps the application's errors; JavaScript errors of a visit are to be sent there.",
    },
    {
      id: "metrics",
      how: "Metrics scrapes /metrics: sites, events kept and whether the sites file is applied.",
    },
    {
      id: "identity",
      how: "People sign in with Identity or any OpenID Connect provider.",
    },
  ],
  limits: [
    "The value of a form field is never read, and query strings are dropped but for utm_* and the site's own list.",
    "The IP address and the user agent are not kept; only the browser, system and kind of device are.",
    "The script is public, so made-up events can still be sent from a copy of a page; the origin check and the rate limit keep that small.",
    "Funnels, heatmaps, form analysis and session replays are not built yet.",
  ],
};
