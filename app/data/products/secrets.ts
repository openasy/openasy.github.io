import type { ProductStory } from "./types";

export const secrets: ProductStory = {
  problem: {
    title: "Keys and passwords committed to git, found before someone else finds them",
    headline: "A key in git history is a key everyone has",
    text: "A cloud key pasted into a config file, a database password in a test, a token in a script: once it is in a repository's history, everyone who can clone it has it, and attackers scan public and leaked repositories for exactly this within minutes. Deleting the line does not help; the key has to be revoked. Secrets shows where each one leaked, fails the pull request that adds a new one, and keeps track of which were revoked, without ever storing the secret itself.",
    example:
      "A developer commits an AWS access key in a deployment script on a branch. The pull request fails with one new finding naming the file and line. The security team rotates the key in AWS and marks the finding revoked, with a reason. The same key in an old commit on another branch is recognised as the same secret and carries the same decision.",
  },
  who: ["Developers, whose pull request stops a new secret", "The security team, who see every leak and track that each key was rotated"],
  glance: [
    {
      label: "Reads",
      value: "Repositories and their history",
    },
    {
      label: "Scanners",
      value: "gitleaks, TruffleHog",
    },
    {
      label: "Fails on",
      value: "Any new secret",
    },
    {
      label: "Keeps",
      value: "Never the secret",
    },
  ],
  flow: [
    {
      label: "Your CI scans",
      detail: "gitleaks, TruffleHog or another scanner that writes SARIF runs on the repository.",
    },
    {
      label: "The report is sent",
      detail: "CI posts the SARIF to Secrets with the repository, branch and commit.",
    },
    {
      label: "The secret is dropped",
      detail: "Snippets and matches are thrown away in memory; only the rule, file, line and a salted fingerprint are kept.",
    },
    {
      label: "Compared and answered",
      detail: "Only secrets the default branch does not have are new; the answer says whether the check passes.",
    },
  ],
  checks: [
    {
      title: "What the scanners look for",
      items: [
        "Cloud keys: AWS, Google Cloud, Azure and others",
        "Tokens of GitHub, GitLab, Slack, Stripe and hundreds of other services, by their known formats",
        "Private keys, such as RSA, SSH and PGP keys",
        "Passwords and connection strings in configuration files",
        "High-entropy strings that look like secrets, depending on the scanner's rules",
      ],
    },
    {
      title: "Where",
      items: ["Every file of the commit the scanner reads", "The full git history, when the scanner is run on it", "Any branch and every pull request"],
    },
  ],
  decides: [
    {
      label: "Finding",
      text: "A finding is a rule that matched: the rule, the file and the line, and a fingerprint of the rule, file and match.",
    },
    {
      label: "Fingerprint",
      text: "The fingerprint is salted with a value made on first start, so it cannot be turned back into the key and means nothing to another install.",
    },
    {
      label: "Pull requests",
      text: "The default branch is the baseline and never fails. Any other branch and every pull request fails for any new secret, unless the repository's fail on is set higher.",
    },
    {
      label: "Same finding",
      text: "A finding keeps its identity when its line moves; a different secret in the same place is new.",
    },
    {
      label: "Decisions",
      text: "Revoked (the key was rotated), false positive and accepted risk each need a reason, accepted risk an end date, and they follow the fingerprint to every branch.",
    },
  ],
  inputs: [
    {
      name: "gitleaks",
      url: "https://github.com/gitleaks/gitleaks",
      how: "gitleaks detect --report-format sarif, sent from CI.",
    },
    {
      name: "TruffleHog",
      url: "https://github.com/trufflesecurity/trufflehog",
      how: "Its report, converted to SARIF, sent from CI.",
    },
    {
      name: "SARIF 2.1.0",
      url: "https://sarifweb.azurewebsites.net/",
      how: "From any other secret scanner, to POST /api/v1/scans.",
    },
  ],
  screens: [
    {
      page: "overview",
      title: "Overview",
      shows: "Open secrets, new and revoked each week, and the repositories and rules with the most.",
    },
    {
      page: "findings",
      title: "Findings",
      shows: "Every leaked secret by rule, file and line, never its value, with what was decided.",
      story: "findings",
    },
    {
      page: "repositories",
      title: "Repositories",
      shows: "Each repository, its open secrets and whether its default branch passes.",
      story: "repositories",
    },
  ],
  worksWith: [
    {
      id: "sast",
      how: "SAST reads the same pull requests for flaws in the code; secrets are left to this product.",
    },
    {
      id: "audit",
      how: "Audit checks the same repositories' dependencies.",
    },
    {
      id: "identity",
      how: "People sign in with Identity or any OpenID Connect provider.",
    },
  ],
  limits: [
    "It never stores a secret: no snippet, no match, and the tests check that none reaches the database or an answer.",
    "It does not scan by itself yet: CI runs the scanner. Scanning repositories, images and CI logs with an agent is planned.",
    "It cannot tell whether a key still works or revoke it; that is done where the key was issued.",
    "Masking in messages works by pattern, so treat scanner output as sensitive until it is sent.",
  ],
};
