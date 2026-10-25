import type { ProductStory } from "./types";

export const posture: ProductStory = {
  problem: {
    title: "Which security controls fail in your clouds, clusters and hosts, and a score over time",
    headline: "Misconfigurations cause more breaches than exploits",
    text: "A public storage bucket, a Kubernetes pod running privileged, a security group open to the internet, an account without MFA: misconfigurations cause more breaches than clever exploits. Benchmarks such as CIS list hundreds of controls, and checkers such as Trivy and Prowler test them, but their reports pile up in CI logs. Posture keeps every failed control per target, with a score that shows whether things are getting better.",
    example:
      "A kubescape run against the production cluster fails 12 controls, 3 of them high. The score is 82. The team fixes the privileged pods; the next run passes those controls, they are marked fixed and the score goes to 91. A control covered by a network policy elsewhere is marked as a compensating control, with a reason.",
  },
  who: [
    "Platform and cloud teams, who fix the configuration",
    "The security team, who track the score and decide about exceptions",
    "Auditors, who ask how a benchmark is met",
  ],
  glance: [
    {
      label: "Checks",
      value: "Clouds, clusters, hosts",
    },
    {
      label: "Checkers",
      value: "Trivy, kubescape, Prowler",
    },
    {
      label: "Against",
      value: "CIS and other benchmarks",
    },
    {
      label: "Shows",
      value: "A score over time",
    },
  ],
  flow: [
    {
      label: "Your CI checks",
      detail: "Trivy, kubescape, checkov, Prowler or another checker runs against a cloud account, cluster or hosts.",
    },
    {
      label: "The report is sent",
      detail: "SARIF, to a target with its kind and benchmark.",
    },
    {
      label: "Compared",
      detail: "Each engine's report replaces its last: a control that stops failing is fixed, a new failure is new.",
    },
    {
      label: "Score and findings",
      detail: "Failed controls by benchmark and section, and the share of checks that passed, over time.",
    },
  ],
  checks: [
    {
      title: "Targets",
      items: ["Cloud accounts: AWS, Azure, Google Cloud", "Kubernetes clusters", "Groups of hosts"],
    },
    {
      title: "Benchmarks, through the checker",
      items: [
        "CIS benchmarks for clouds, Kubernetes and operating systems",
        "NSA and CISA Kubernetes hardening",
        "Infrastructure as code: Terraform, Helm, Dockerfiles",
      ],
    },
  ],
  decides: [
    {
      label: "Finding",
      text: "A finding is a control that failed on one resource; results without a resource are left out and counted.",
    },
    {
      label: "Severity",
      text: "Severity is the result's security-severity; the target fails a check for new failures at or above its fail on severity, high by default.",
    },
    {
      label: "Score",
      text: "The score is the share of checks that passed, 0 to 100, from the report's summary or its passed results.",
    },
    {
      label: "Decisions",
      text: "False positive, accepted risk with an end date, and compensating control each need a reason.",
    },
  ],
  inputs: [
    {
      name: "Trivy",
      url: "https://github.com/aquasecurity/trivy",
      how: "trivy config or trivy k8s, with SARIF output.",
    },
    {
      name: "kubescape",
      url: "https://github.com/kubescape/kubescape",
      how: "Kubernetes controls, as SARIF.",
    },
    {
      name: "checkov",
      url: "https://github.com/bridgecrewio/checkov",
      how: "Infrastructure as code, as SARIF.",
    },
    {
      name: "Prowler",
      url: "https://github.com/prowler-cloud/prowler",
      how: "Cloud accounts, as SARIF.",
    },
  ],
  screens: [
    {
      page: "overview",
      title: "Overview",
      shows: "Failed controls by severity, each target's score and its trend.",
    },
    {
      page: "findings",
      title: "Findings",
      shows: "Every failed control with its resource, benchmark, section and decision.",
      story: "misconfigurations",
    },
    {
      page: "targets",
      title: "Targets",
      shows: "Each cloud account, cluster and host group, its benchmark and score.",
      story: "accounts",
    },
  ],
  worksWith: [
    {
      id: "infrastructure",
      how: "Infrastructure shows what runs on the hosts and clusters Posture checks.",
    },
    {
      id: "risk",
      how: "A control that cannot be fixed soon is recorded as a risk there.",
    },
    {
      id: "identity",
      how: "People sign in with Identity or any OpenID Connect provider.",
    },
  ],
  limits: [
    "It holds no checker and reads no cloud account or cluster itself: your CI runs the checker. Checkers that run for you are planned.",
    "It knows the controls the checker tested; a benchmark is as complete as the checker's coverage of it.",
    "It does not change any configuration.",
  ],
};
