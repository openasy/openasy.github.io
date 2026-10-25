import type { ProductStory } from "./types";

export const waf: ProductStory = {
  problem: {
    title: "Attacks on your web applications blocked at the door, until the code is fixed",
    headline: "Fixing takes weeks; attacks start the same day",
    text: "Fixing a flaw in an application can take weeks; attackers start the day it is found. A web application firewall stands in front of the application and blocks requests that look like attacks: SQL injection, cross-site scripting, path traversal. WAF will run Coraza with the OWASP Core Rule Set, and turn DAST findings into rules that block that exact flaw until the fix ships.",
    example:
      "DAST finds that the search page is open to SQL injection. WAF generates a rule for that page and parameter, and blocks the attempts within the hour; the developers fix the query the next week and the rule is retired.",
  },
  who: ["The security team, who tune the rules", "Developers, who get time to fix flaws properly"],
  glance: [
    {
      label: "Stands",
      value: "In front of your sites",
    },
    {
      label: "Engine",
      value: "Coraza with OWASP CRS",
    },
    {
      label: "Blocks",
      value: "Injection, XSS, traversal",
    },
    {
      label: "Patches",
      value: "DAST findings, virtually",
    },
  ],
  flow: [
    {
      label: "In front of the site",
      detail: "Requests pass through Coraza before they reach the application.",
    },
    {
      label: "Rules",
      detail: "The OWASP Core Rule Set, your own rules and rules made from DAST findings.",
    },
    {
      label: "Blocked or logged",
      detail: "A request that matches is blocked, or only logged while you tune.",
    },
    {
      label: "Reviewed",
      detail: "Blocked requests, false positives and exclusions.",
    },
  ],
  checks: [
    {
      title: "OWASP Core Rule Set",
      items: ["SQL injection and cross-site scripting", "Path traversal and remote file inclusion", "Protocol violations and scanners"],
    },
    {
      title: "Your rules",
      items: ["Custom rules", "Virtual patches made from DAST findings", "Exclusions for false positives"],
    },
  ],
  decides: [
    {
      label: "Blocking",
      text: "A request is blocked when its anomaly score passes the threshold you set.",
    },
    {
      label: "Detection only",
      text: "A site can run in detection only, logging without blocking.",
    },
  ],
  inputs: [
    {
      name: "Coraza",
      url: "https://coraza.io/",
      how: "The firewall engine, compatible with ModSecurity rules.",
    },
    {
      name: "OWASP CRS",
      url: "https://coreruleset.org/",
      how: "The rule set it starts with.",
    },
  ],
  screens: [
    {
      page: "traffic",
      title: "Traffic",
      shows: "Requests per site, allowed and blocked.",
      story: "traffic",
    },
    {
      page: "blocked",
      title: "Blocked requests",
      shows: "What was blocked, by which rule, and why.",
      story: "blocked-requests",
    },
    {
      page: "rules",
      title: "Rules",
      shows: "The rule set, its paranoia level and your own rules.",
      story: "rules",
    },
  ],
  worksWith: [
    {
      id: "dast",
      how: "A DAST finding becomes a rule that blocks that flaw.",
    },
    {
      id: "threat-intel",
      how: "Requests from known bad addresses.",
    },
    {
      id: "siem",
      how: "Blocked attacks become security events.",
    },
  ],
  limits: ["It blocks known attack patterns; it does not fix the application.", "Strict rules block real users until they are tuned."],
};
