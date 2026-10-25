import type { ProductStory } from "./types";

export const vulnerabilities: ProductStory = {
  problem: {
    title: "Which known vulnerabilities your servers and images have, and which to fix first",
    headline: "40,000 CVEs is a list nobody reads",
    text: "Every server and container image carries hundreds of packages, and new vulnerabilities in them are published every day. A scanner that lists 40,000 of them by CVSS score is a list nobody reads. What matters is which ones attackers actually use, which are likely to be used, and which have a fix you can install today. Vulnerabilities matches every host and image against the advisory data, puts known exploited vulnerabilities first, and matches again whenever the data changes, without scanning again.",
    example:
      "CISA adds an OpenSSH vulnerability to its Known Exploited Vulnerabilities catalogue. Within hours of the next data update, Vulnerabilities matches it against the package lists it already holds and the three hosts that have the vulnerable version go to the top of Fix first, with the version that fixes it. Nobody had to rescan anything.",
  },
  who: [
    "System and platform teams, who patch hosts and rebuild images",
    "The security team, who decide what to fix first and accept the rest",
    "Anyone reporting how many critical vulnerabilities are open",
  ],
  glance: [
    {
      label: "Reads",
      value: "Hosts and container images",
    },
    {
      label: "Engine",
      value: "Grype and Syft",
    },
    {
      label: "Ranks by",
      value: "CISA KEV, then EPSS",
    },
    {
      label: "On your hosts",
      value: "Nothing logs in",
    },
  ],
  flow: [
    {
      label: "Package lists",
      detail: "vulns-agent or Infrastructure reads each host's packages; CI runs Syft on each image. Both send an SBOM.",
    },
    {
      label: "Kept per asset",
      detail: "Vulnerabilities keeps the last SBOM of every host and image.",
    },
    {
      label: "Matched with Grype",
      detail: "Against distribution advisories, GitHub advisories and NVD, ranked with CISA KEV and EPSS.",
    },
    {
      label: "Fix first",
      detail: "Known exploited first, then by risk, grouped by package, with the version that fixes each.",
    },
  ],
  checks: [
    {
      title: "Operating system packages",
      items: [
        "Debian, Ubuntu, RHEL and its rebuilds, Alpine, Amazon Linux, SUSE and more",
        "Grouped by the source package, so glibc shows once rather than as libc6 and libc-bin",
      ],
    },
    {
      title: "Application packages in images",
      items: ["npm, Python, Java, Go, Ruby, Rust, PHP and other packages Syft finds in the image"],
    },
    {
      title: "Advisory data",
      items: [
        "Distribution security advisories, which know which versions each distribution fixed",
        "GitHub security advisories and NVD",
        "CISA's Known Exploited Vulnerabilities catalogue: attacked in the wild",
        "EPSS: the probability a vulnerability is exploited in the next 30 days",
      ],
    },
  ],
  decides: [
    {
      label: "Finding",
      text: "A finding is a vulnerability in one package version on one host or image.",
    },
    {
      label: "Severity and order",
      text: "Severity is the advisory's; the order is known exploited first, then Grype's risk score, which combines severity and EPSS.",
    },
    {
      label: "Matched again",
      text: "When the advisory data is updated, every asset is matched again from its last SBOM; what stops matching is resolved and kept as history.",
    },
    {
      label: "Exceptions",
      text: "An exception accepts a risk on one asset or on all of them, with a reason and an expiry within a year.",
    },
  ],
  inputs: [
    {
      name: "vulns-agent",
      how: "Reads a host's package databases through a read-only mount, as an unprivileged user, and sends only the SBOM.",
    },
    {
      name: "Infrastructure",
      how: "Sends the package lists it already collects over SSH, so those hosts need no agent.",
    },
    {
      name: "Syft",
      url: "https://github.com/anchore/syft",
      how: "Run in CI on an image; Syft, CycloneDX or SPDX JSON is accepted.",
    },
    {
      name: "Grype",
      url: "https://github.com/anchore/grype",
      how: "The matching engine and its daily vulnerability data, inside the product.",
    },
  ],
  screens: [
    {
      page: "overview",
      title: "Overview",
      shows: "Known exploited, critical and fixable counts, open findings over time, and the riskiest assets.",
    },
    {
      page: "findings",
      title: "Findings",
      shows: "Fix first: every vulnerability by package, with how many hosts and images have it and the fixed version.",
      story: "findings",
    },
    {
      page: "hosts",
      title: "Hosts",
      shows: "Each host, its operating system, when it last reported, and its findings by severity.",
      story: "hosts",
    },
    {
      page: "images",
      title: "Images",
      shows: "Each image and its findings, from the SBOMs CI sends.",
      story: "images",
    },
  ],
  worksWith: [
    {
      id: "infrastructure",
      how: "Sends each host's package list, so hosts it reads over SSH need no vulns-agent.",
    },
    {
      id: "audit",
      how: "Audit checks the dependencies in the code before it ships; Vulnerabilities checks what is installed and running.",
    },
    {
      id: "supply-chain",
      how: "Supply Chain keeps the same images' SBOMs and decides which may run.",
    },
    {
      id: "identity",
      how: "People sign in with Identity or any OpenID Connect provider.",
    },
  ],
  limits: [
    "It knows packages a package manager installed; a binary copied onto a host by hand is invisible to it.",
    "Nothing logs in to your hosts: the agent accepts no connections and holds no SSH keys.",
    "It does not patch anything; it tells you what to update and to which version.",
    "A host keeps findings for every package installed, so old kernels left on a host count until they are removed.",
  ],
};
