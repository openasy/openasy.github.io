import type { ProductStory } from "./types";

export const dast: ProductStory = {
  problem: {
    title: "Your running web applications tested the way an attacker would, safely",
    headline: "Some flaws only show when the application runs",
    text: "Some flaws only show when the application runs: a missing security header, a session cookie without Secure, a page that echoes input back as HTML, an admin panel left open, an outdated server with a known flaw. Reading the code does not find them. DAST runs ZAP and Nuclei against your applications from inside your network, only against addresses you have proved are yours, and keeps each finding with the decisions made about it.",
    example:
      "A weekly standard scan of the staging shop finds that the search page reflects its query into the HTML. The finding names the page, the parameter and the evidence. The team fixes it; the next scan of the same profile no longer reports it, so it is marked fixed. A passive scan in between does not touch it, because it never tested for it.",
  },
  who: [
    "The security team, who decide what may be tested and how hard",
    "Developers, who fix what a scan of their application found",
    "Teams that must show regular testing of what they expose",
  ],
  glance: [
    {
      label: "Tests",
      value: "Running web applications",
    },
    {
      label: "Engines",
      value: "ZAP and Nuclei",
    },
    {
      label: "Profiles",
      value: "Passive, standard, full",
    },
    {
      label: "Attacks",
      value: "Only what you proved is yours",
    },
  ],
  flow: [
    {
      label: "Targets you own",
      detail: "Addresses listed in the install's endpoints file, each proved to be yours with a file served at a well-known path.",
    },
    {
      label: "dast-agent scans",
      detail: "Inside your network, it runs ZAP and Nuclei with the target's profile and login, on a schedule or when you start it.",
    },
    {
      label: "DAST compares",
      detail: "Each engine and profile's report replaces its last one: what it stops reporting is fixed, what it never reported before is new.",
    },
    {
      label: "The answer",
      detail: "New, fixed and blocking findings per target, and whether a pipeline's check passes.",
    },
  ],
  checks: [
    {
      title: "Passive (ZAP)",
      items: [
        "Crawls the application for 5 minutes and watches what it sends back, with no attacks",
        "Missing or weak security headers, such as Content-Security-Policy and Strict-Transport-Security",
        "Cookies without Secure, HttpOnly or SameSite",
        "Information leaks: server versions, stack traces, private addresses, comments",
      ],
    },
    {
      title: "Standard",
      items: [
        "ZAP's active rules at low strength, for 30 minutes at most: injection, cross-site scripting, path traversal and others",
        "Nuclei's HTTP and TLS templates of low severity and up: known CVEs, misconfigurations, exposed panels and files, weak TLS",
        "Never Nuclei's intrusive, fuzzing, brute force, default login or denial of service templates",
      ],
    },
    {
      title: "Full",
      items: [
        "ZAP's active rules at medium strength for up to 90 minutes, crawling with a headless browser too",
        "Every Nuclei HTTP and TLS template of low severity and up, except denial of service",
        "Only on a verified target, and on one marked production only with an admin",
      ],
    },
    {
      title: "Signed in",
      items: [
        "A header login, such as a bearer token, on every request",
        "A form login that ZAP fills in, then scans as that user and keeps away from sign-out links",
      ],
    },
  ],
  decides: [
    {
      label: "Finding",
      text: "A finding is a ZAP rule or a Nuclei template that matched: the rule, the page and the parameter, not the query string.",
    },
    {
      label: "Per engine",
      text: "Reports are kept per engine and profile, such as zap-standard, so a passive scan never marks what an active one found as fixed.",
    },
    {
      label: "First report",
      text: "The first report of an engine for a target adopts what is there and never fails. Later reports fail for new findings at or above the target's fail on severity, high unless the file says otherwise.",
    },
    {
      label: "Decisions",
      text: "False positive and accepted risk need a reason, accepted risk an end date, and stay with the finding.",
    },
    {
      label: "Masked",
      text: "Passwords, cookies and tokens in what an engine saw are masked before anything is stored.",
    },
  ],
  inputs: [
    {
      name: "ZAP",
      url: "https://www.zaproxy.org/",
      how: "Run by dast-agent, or in your CI with its SARIF report sent to DAST.",
    },
    {
      name: "Nuclei",
      url: "https://github.com/projectdiscovery/nuclei",
      how: "Run by dast-agent with the templates of a fixed release, or in your CI.",
    },
    {
      name: "The endpoints file",
      how: "Targets, their schedule, profile, fail on and login, the same file Uptime and Certificates read.",
    },
  ],
  screens: [
    {
      page: "overview",
      title: "Overview",
      shows: "Open findings by severity, new and fixed each week, and the targets and rules with the most.",
    },
    {
      page: "findings",
      title: "Findings",
      shows: "Every open finding with its rule, page, parameter and evidence.",
      story: "findings",
    },
    {
      page: "targets",
      title: "Targets",
      shows: "Each target, whether it is verified, its schedule, profile and last scan.",
      story: "targets",
    },
  ],
  worksWith: [
    {
      id: "uptime",
      how: "Reads the same endpoints file, so a target and a check are the same address.",
    },
    {
      id: "certificates",
      how: "Reads the same endpoints file and watches the certificate of each address.",
    },
    {
      id: "sast",
      how: "SAST reads the code before it runs; DAST tests it while it runs.",
    },
    {
      id: "identity",
      how: "People sign in with Identity or any OpenID Connect provider.",
    },
  ],
  limits: [
    "It attacks only addresses proved to be yours; an unverified target gets passive scans only.",
    "DAST itself holds no scanner: dast-agent runs the engines inside your network and nothing calls home.",
    "It finds what ZAP's rules and Nuclei's templates describe; business logic, such as one customer reading another's order, needs a review or a pen test.",
    "Nuclei cannot fill in a form, so with a form login it runs signed out.",
  ],
};
