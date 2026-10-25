import type { ProductStory } from "./types";

export const threatIntel: ProductStory = {
  problem: {
    title: "Is this address, domain or file known to be bad, and who says so",
    headline: "Is it bad? The answer is spread over feeds",
    text: "An address keeps trying to log in, a domain shows up in a proxy log, a file hash is found on a server. Is it known to be malicious? The answer is in feeds: your sector's ISAC, an OpenCTI or MISP instance, public blocklists. Each product looking them up on its own means keys everywhere and different answers. Threat Intel gathers the feeds in one place and gives every product one lookup: malicious, suspicious, unknown or allowed, with the feeds and confidence behind it.",
    example:
      "An analyst looks up 198.51.100.7 from a SIEM signal. Threat Intel answers malicious: two feeds list it, one as a botnet controller with confidence 80, TLP:AMBER, valid until next month. A partner's address that a blocklist lists by mistake is on the allow list with a reason, so it comes back as allowed.",
  },
  who: ["Security analysts, who check what they see against what others know", "Scripts and products that ask through the lookup API"],
  glance: [
    {
      label: "Gathers",
      value: "STIX, TAXII, CSV, text",
    },
    {
      label: "Looks up",
      value: "IPs, domains, URLs, hashes",
    },
    {
      label: "Answers",
      value: "Malicious to allowed",
    },
    {
      label: "Calls out",
      value: "Only to feeds you set",
    },
  ],
  flow: [
    {
      label: "Feeds",
      detail: "STIX bundles, CSV and text blocklists, pushed to the API or pulled on a schedule from TAXII 2.1 or a URL.",
    },
    {
      label: "Normalized",
      detail: "Values stored in one form: defanged values read, domains lowercased, IPv6 compressed.",
    },
    {
      label: "Lookup",
      detail: "One call answers for an address, domain, URL, email address or file hash.",
    },
    {
      label: "The verdict",
      detail: "Malicious, suspicious, unknown or allowed, with every match, its feed, confidence, severity and TLP.",
    },
  ],
  checks: [
    {
      title: "Indicator types",
      items: ["IPv4 and IPv6 addresses and blocks", "Domains, with or without subdomains", "URLs and email addresses", "File hashes: SHA-256, SHA-1 and MD5"],
    },
    {
      title: "Feeds",
      items: [
        "STIX 2.1 bundles, such as from OpenCTI or MISP",
        "TAXII 2.1 collections, pulled every 15 minutes to once a week",
        "CSV and text blocklists, pushed or read from a URL",
        "Indicators added by hand",
      ],
    },
  ],
  decides: [
    {
      label: "Verdict",
      text: "The verdict comes from the matches: their confidence and severity, and whether they are still valid.",
    },
    {
      label: "Allow list",
      text: "An allow list entry, with a reason and an end date, makes a value allowed whatever the feeds say.",
    },
    {
      label: "TLP:RED",
      text: "TLP:RED indicators are shown only to editors, admins and the ingest token.",
    },
    {
      label: "Defaults",
      text: "What a feed does not say comes from its defaults: valid for 30 days, confidence 50, TLP:AMBER, medium severity.",
    },
    {
      label: "Nothing dropped",
      text: "Nothing is dropped without a word: a pattern or row that cannot be read is named with its reason.",
    },
  ],
  inputs: [
    {
      name: "STIX 2.1 and TAXII 2.1",
      url: "https://oasis-open.github.io/cti-documentation/",
      how: "Bundles pushed to the API, or collections pulled on a schedule.",
    },
    {
      name: "CSV and text",
      how: "Blocklists with one value per line or row, pushed or read from a URL.",
    },
  ],
  screens: [
    {
      page: "overview",
      title: "Overview",
      shows: "Indicators by type, feeds and their last pull, and lookups that matched.",
    },
    {
      page: "lookup",
      title: "Lookup",
      shows: "Look up any value and see the verdict and every match behind it.",
      story: "matches",
    },
    {
      page: "indicators",
      title: "Indicators",
      shows: "Every indicator with its type, feed, confidence, TLP and validity.",
      story: "indicators",
    },
    {
      page: "feeds",
      title: "Feeds",
      shows: "Each feed, its kind, its pull schedule and its last result.",
      story: "feeds",
    },
  ],
  worksWith: [
    {
      id: "siem",
      how: "An analyst looks up the addresses and domains in a signal here. SIEM asking by itself is planned.",
    },
    {
      id: "identity",
      how: "People sign in with Identity or any OpenID Connect provider.",
    },
  ],
  limits: [
    "It knows what its feeds say; an unknown value is not a safe one.",
    "Pulling feeds is the only call it makes out, and only to the addresses an admin sets.",
    "It answers lookups; blocking is up to the product that asks.",
  ],
};
