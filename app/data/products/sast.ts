import type { ProductStory } from "./types";

export const sast: ProductStory = {
  problem: {
    title: "Flaws in your own code, caught in the pull request that adds them",
    headline: "A scanner that blocks every old finding gets switched off",
    text: "Most breaches of a web application come through code the team wrote: a query built from user input, a shell command with a parameter in it, a certificate check switched off to make a test pass. A reviewer misses these because the code looks normal. Scanners find them, but a scanner that reports every old finding on every pull request is switched off within a week. SAST reads the code before it ships and fails a pull request only for what that pull request adds.",
    example:
      "A developer adds a search endpoint that builds its SQL from the query string. The pull request gets a failed OpenAsy SAST status and one comment naming the line, the rule and how to fix it. The 40 findings already in the repository do not block them; they stay on the repository's page for the team to work through.",
  },
  who: [
    "Developers, who see the result on their pull request",
    "The security team, who triage findings and set what fails a check",
    "Engineering leads, who follow how many findings each repository has",
  ],
  glance: [
    {
      label: "Reads",
      value: "Your own code",
    },
    {
      label: "Engine",
      value: "Opengrep, or any SARIF",
    },
    {
      label: "Fails on",
      value: "Only what a pull request adds",
    },
    {
      label: "Keeps",
      value: "No code, no clones",
    },
  ],
  flow: [
    {
      label: "Your code",
      detail: "Repositories of a GitHub account or a GitLab group, or any repository whose CI sends a report.",
    },
    {
      label: "sast-agent scans",
      detail: "Clones the commit into memory and runs Opengrep with OpenAsy's rules, your rule sources and your own rules.",
    },
    {
      label: "SAST compares",
      detail: "Reads the SARIF result and compares it with the default branch: only findings the baseline does not have are new.",
    },
    {
      label: "The answer",
      detail: "A commit status and one comment on the pull request, and every finding on the repository's page.",
    },
  ],
  checks: [
    {
      title: "Injection",
      items: [
        "SQL built from data, in JavaScript, Python, Java and Go (CWE-89)",
        "Shell commands built from data, and child processes run through a shell (CWE-78)",
        "Code run from data: eval, new Function or a string timer in JavaScript, eval or exec in Python (CWE-95)",
      ],
    },
    {
      title: "Web",
      items: ["HTML built from data, the way to cross-site scripting (CWE-79)"],
    },
    {
      title: "Cryptography and transport",
      items: ["TLS certificate checks switched off, in JavaScript, Python and Go (CWE-295)", "MD5 and SHA-1 used for security in Python (CWE-328)"],
    },
    {
      title: "Unsafe data handling",
      items: [
        "Turning data into objects in ways that can run code: pickle, marshal and yaml.load in Python, ObjectInputStream and XMLDecoder in Java (CWE-502)",
      ],
    },
    {
      title: "Beyond OpenAsy's rules",
      items: [
        "Public rule repositories an admin adds under Rule sources, such as the Opengrep or Semgrep community rules",
        "Rules your team writes under Rules, in Opengrep's format",
        "Any analyser that writes SARIF, run in your own CI: Semgrep, CodeQL and others",
      ],
    },
  ],
  decides: [
    {
      label: "Finding",
      text: "A finding is a rule that matched code: the rule, the file, the line and the code it matched.",
    },
    {
      label: "Severity",
      text: "Severity comes from the rule's security-severity score when it has one (9 and up critical, 7 high, 4 medium, below that low), otherwise from its level: error is high, warning medium, note low.",
    },
    {
      label: "Baseline",
      text: "The default branch is the baseline. It never fails; what it stops reporting is marked fixed.",
    },
    {
      label: "Pull requests",
      text: "Any other branch, and every pull request, reports only findings the baseline does not have and nobody has triaged. The check fails when one of them is at or above the repository's fail on severity, high unless you change it.",
    },
    {
      label: "Same finding",
      text: "A finding is recognised by its rule, file and the code it matched, not by its line, so moving code does not make it new.",
    },
    {
      label: "Decisions",
      text: "False positive and accepted risk are decided once, with a reason and, for accepted risk, an end date, and follow the finding to every branch.",
    },
  ],
  inputs: [
    {
      name: "Opengrep",
      url: "https://github.com/opengrep/opengrep",
      how: "Run by sast-agent for connected accounts, or in your CI.",
    },
    {
      name: "SARIF 2.1.0",
      url: "https://sarifweb.azurewebsites.net/",
      how: "From any analyser, sent from CI to POST /api/v1/scans.",
    },
    {
      name: "GitHub and GitLab",
      how: "An account or group named in the repositories file: SAST follows its repositories and pull or merge requests.",
    },
  ],
  screens: [
    {
      page: "overview",
      title: "Overview",
      shows: "Open findings by severity, new and fixed each day, and the repositories and rules with the most findings.",
    },
    {
      page: "repositories",
      title: "Repositories",
      shows: "Every repository, its open findings, its last scan and whether its default branch passes.",
      story: "repositories",
    },
    {
      page: "findings",
      title: "Findings",
      shows: "Every open finding with its rule, file and line, filtered by severity, repository and rule.",
      story: "findings",
    },
    {
      page: "scan",
      title: "A pull request's scan",
      shows: "What one pull request adds, which findings block it and the link its status points to.",
      story: "pull-request",
      path: "/scans/",
      from: "/scans",
    },
    {
      page: "rules",
      title: "Rules",
      shows: "The rules that run, your own rule files, and rules switched off by id.",
      story: "rules",
    },
  ],
  worksWith: [
    {
      id: "secrets",
      how: "Keys and tokens in code are Secrets' job; the two share the pull request and do not repeat each other.",
    },
    {
      id: "audit",
      how: "Known vulnerabilities in dependencies are Audit's; SAST reads only your own code.",
    },
    {
      id: "dast",
      how: "DAST tests the running application from outside; SAST reads its code before it runs.",
    },
    {
      id: "identity",
      how: "People sign in with Identity or any OpenID Connect provider.",
    },
  ],
  limits: [
    "It does not run your code and does not keep it: the agent deletes each clone, and SAST stores only the matched snippets of findings.",
    "It does not find secrets in code (Secrets does) or vulnerable dependencies (Audit does).",
    "It finds what its rules describe. A flaw no rule describes, such as broken business logic, needs a review or DAST.",
    "Scans sent from CI use CI's own rules; the rules set in SAST apply to the repositories sast-agent scans.",
  ],
};
