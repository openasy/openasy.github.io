# 0045. Posture: failed controls per target, with a score over time, from the checkers you run

- **Decision:** Proposed
- **Implementation:** In progress
- **Where:** `posture` reads SARIF from Trivy, kubescape, checkov, Prowler or any checker, keeps failed controls per target with decisions and a score over time (github.com/openasy/posture, to be released as `ghcr.io/openasy/posture`). Checkers that run for you are planned.
- **Priority:** High
- **Area:** Architecture

## Context

A cloud account, a Kubernetes cluster or a fleet of hosts drifts from its benchmark one setting at a time. Checkers for this exist for every kind of target: Prowler and Trivy for cloud accounts, kubescape and Trivy for clusters, checkov for infrastructure as code. Each writes a long list of passed and failed controls. Read once, the list is useful; read every week, what matters is what changed, whether the score is going the right way, and which failures somebody has already looked at.

The options were:

- **Run the checkers in the product**, with credentials for every account and cluster. That is the complete product, and it means holding cloud credentials before we have earned that trust.
- **Read the reports CI or a scheduled job already writes**, in SARIF, and keep them per target.
- **A dashboard over the checkers' own output**, with no history and no decisions.

## Decision

- **posture reads reports and nothing else.** It holds no checker and reads no cloud account or cluster. Checkers that run for you come later, in an agent, as for DAST (ADR 0037).
- **A target** is a name, a kind (cloud, kubernetes or host) and an optional benchmark label. Admins add them, and reports are accepted only for targets that exist, so a typo does not become a target.
- **Each engine's reports replace each other.** A control that stops failing is fixed and opens again if it fails again. Engines do not fix each other's findings.
- **The first report of an engine adopts what is there** and never fails a check. Later reports fail it for new failed controls at or above the target's fail-on severity (high by default) that nobody has decided about.
- **A failed control is found again by rule and resource.** Results without a resource are left out and counted; results of kind `pass` are passed controls, not findings.
- **The score is the share of checks that passed**, from the run's summary or from the results of kind `pass`. A report with neither adds no point, rather than a misleading one.
- **Decisions last:** false positive, accepted risk with an end date, and compensating control, each with a reason.
- Passwords, tokens and keys in resource names and messages are masked before anything is stored.

## Consequences

- posture needs no credentials for your infrastructure. The checker that runs where those credentials already are sends the report.
- The score is only as good as the checker's summary. Two engines on one target give two scores, and the page shows both rather than inventing a blend.
- Findings name resources of your infrastructure; anyone with the viewer role reads them.
- Running checkers in an agent, and benchmark reports per control, follow without changing the report format.
