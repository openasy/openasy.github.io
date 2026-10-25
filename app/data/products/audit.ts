import type { ProductStory } from "./types";

export const audit: ProductStory = {
  problem: {
    title: "Known vulnerabilities in the libraries your code depends on, across every project",
    headline: "Most of your application is code someone else wrote",
    text: "Most of the code in an application is libraries: npm packages, Python wheels, Go modules, Composer packages. A known flaw in one of them, such as a prototype pollution in a JSON parser or a deserialization bug in a logging library, is a flaw in your application. npm audit, pip-audit and composer audit each answer for one project on one laptop. Audit answers for every project at once, keeps what was decided, and fails a pull request only for the vulnerable dependency it adds.",
    example:
      "A pull request bumps a date library to a version with a known high severity advisory. The check fails with that one advisory and the version that fixes it. The 12 advisories already on main do not block it; they stay on the project's page, and Packages shows every other project that uses the same library.",
  },
  who: [
    "Developers, who see on the pull request which dependency to update",
    "The security team, who decide what is not affected and follow the rest",
    "Anyone asking where a library is used when a new advisory comes out",
  ],
  glance: [
    {
      label: "Reads",
      value: "Lockfiles of every project",
    },
    {
      label: "Scanners",
      value: "osv-scanner, Trivy, Grype",
    },
    {
      label: "Ecosystems",
      value: "npm, pip, Go, Cargo, Composer",
    },
    {
      label: "Fails on",
      value: "Only what a pull request adds",
    },
  ],
  flow: [
    {
      label: "Your lockfiles",
      detail: "package-lock.json, yarn.lock, requirements.txt, poetry.lock, go.sum, Cargo.lock, composer.lock and others.",
    },
    {
      label: "Your CI scans",
      detail: "osv-scanner, Trivy or Grype reads the lockfiles and matches them with advisory databases.",
    },
    {
      label: "Audit compares",
      detail: "Reads the report and compares it with the default branch: only advisories the baseline does not have are new.",
    },
    {
      label: "The answer",
      detail: "Whether the check passes, every advisory on the project's page, and where each package is used.",
    },
  ],
  checks: [
    {
      title: "Ecosystems",
      items: ["npm, Yarn and pnpm", "pip, Poetry, Pipenv, PDM and uv", "Go modules", "Cargo", "Composer"],
    },
    {
      title: "Advisory data, through the scanner",
      items: ["OSV.dev, which gathers GitHub advisories, PyPA, RustSec, Go's vulnerability database and others", "The databases Trivy and Grype ship with"],
    },
  ],
  decides: [
    {
      label: "Finding",
      text: "A finding is an advisory for one package version in one ecosystem.",
    },
    {
      label: "Severity",
      text: "Severity is the CVSS v3 base score when the report has one, then the database's own label, then medium: an advisory nobody rated is not ignored.",
    },
    {
      label: "Baseline",
      text: "The default branch is the baseline. It never fails, its package list becomes the project's inventory, and what it stops reporting is marked fixed.",
    },
    {
      label: "Pull requests",
      text: "Any other branch and every pull request fails for a new advisory at or above the project's fail on severity, high unless you change it.",
    },
    {
      label: "Updates",
      text: "Updating a package clears its old advisories; adding a vulnerable version, or another vulnerable version of the same package, is new.",
    },
    {
      label: "Decisions",
      text: "Not affected, false positive and accepted risk each need a reason, accepted risk an end date, and they hold on every branch.",
    },
  ],
  inputs: [
    {
      name: "osv-scanner",
      url: "https://github.com/google/osv-scanner",
      how: "osv-scanner --format json, sent from CI to POST /api/v1/scans.",
    },
    {
      name: "Trivy and Grype",
      how: "Their SARIF output, sent the same way.",
    },
  ],
  screens: [
    {
      page: "overview",
      title: "Overview",
      shows: "Open advisories by severity, new and fixed each week, and the projects and packages with the most.",
    },
    {
      page: "findings",
      title: "Findings",
      shows: "Every open advisory with its package, version, the version that fixes it and the project.",
      story: "advisories",
    },
    {
      page: "projects",
      title: "Projects",
      shows: "Each project, its open advisories and whether its default branch passes.",
      story: "project",
    },
    {
      page: "packages",
      title: "Packages",
      shows: "Where each package is used, across the default branch of every project.",
      story: "sbom",
    },
  ],
  worksWith: [
    {
      id: "vulnerabilities",
      how: "Vulnerabilities checks the packages installed on hosts and in images, what is running; Audit checks the code before it ships.",
    },
    {
      id: "sast",
      how: "SAST reads your own code; Audit reads the libraries it uses.",
    },
    {
      id: "supply-chain",
      how: "Supply Chain keeps each image's SBOM and decides which images may run.",
    },
    {
      id: "identity",
      how: "People sign in with Identity or any OpenID Connect provider.",
    },
  ],
  limits: [
    "It holds no scanner and no advisory database: it knows what the scanner knew when it ran.",
    "It does not scan by itself yet: CI runs the scanner.",
    "osv-scanner lists only the packages that have advisories unless it is asked for all of them, so Packages shows what the reports list.",
    "It does not check licences; Supply Chain does, for images.",
  ],
};
