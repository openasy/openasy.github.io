import type { ProductStory } from "./types";

export const attackSurface: ProductStory = {
  problem: {
    title: "Everything you expose to the internet, including what you forgot",
    headline: "You cannot protect what you forgot you expose",
    text: "Attackers start with what they can reach: a forgotten staging subdomain, a database port opened for a test, an old admin panel. Most companies do not have a complete list of what they expose, so they cannot protect it. Attack Surface will discover your domains, subdomains, open ports and services from the outside, as an attacker would, and tell you when something new appears.",
    example:
      "A new subdomain, test-payments.example.com, appears in certificate transparency logs and answers on port 8080 with a default admin page. Attack Surface lists it as a new exposure the day it shows up.",
  },
  who: ["The security team, who keep the list of what is exposed", "Platform teams, who close what should not be open"],
  glance: [
    {
      label: "Finds",
      value: "Domains, subdomains, ports",
    },
    {
      label: "From",
      value: "The outside, as an attacker",
    },
    {
      label: "Watches",
      value: "What appears or goes",
    },
    {
      label: "Scans",
      value: "Only what you own",
    },
  ],
  flow: [
    {
      label: "Your domains",
      detail: "The domains you own, as the starting point.",
    },
    {
      label: "Discovery",
      detail: "Subdomains from DNS and certificate transparency, then ports and services.",
    },
    {
      label: "Exposures",
      detail: "What answers, what it is, and what looks risky.",
    },
    {
      label: "Changes",
      detail: "What appeared or disappeared since the last scan.",
    },
  ],
  checks: [
    {
      title: "Discovery",
      items: ["Subdomains from DNS and certificate transparency", "Open ports and the services behind them", "Certificates and web technologies"],
    },
    {
      title: "Exposures",
      items: ["Admin panels and login pages", "Databases and remote access open to the internet", "Expired or weak certificates"],
    },
  ],
  decides: [
    {
      label: "Asset",
      text: "An asset is a host name or address that answers.",
    },
    {
      label: "Change",
      text: "A change is an asset or service that appeared or went since the last scan.",
    },
  ],
  inputs: [
    {
      name: "Certificate transparency",
      url: "https://certificate.transparency.dev/",
      how: "Logs of every public certificate, for subdomains.",
    },
    {
      name: "DNS and port scans",
      how: "Of the domains and addresses you own.",
    },
  ],
  screens: [
    {
      page: "assets",
      title: "Assets",
      shows: "Every exposed host and service.",
      story: "assets",
    },
    {
      page: "exposures",
      title: "Exposures",
      shows: "What looks risky, and why.",
      story: "exposures",
    },
    {
      page: "changes",
      title: "Changes",
      shows: "What appeared or went since the last scan.",
      story: "changes",
    },
  ],
  worksWith: [
    {
      id: "dast",
      how: "A discovered web application can become a DAST target.",
    },
    {
      id: "certificates",
      how: "Discovered certificates join the inventory.",
    },
    {
      id: "vulnerabilities",
      how: "Known vulnerabilities of an exposed service.",
    },
  ],
  limits: ["It scans only what you own.", "It sees from the outside; what runs inside is Infrastructure."],
};
