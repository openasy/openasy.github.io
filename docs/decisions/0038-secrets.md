# 0038. Secrets: a finding is where a secret was, and the secret itself is never kept

- **Decision:** Proposed
- **Implementation:** In progress
- **Where:** `secrets` takes SARIF from gitleaks, TruffleHog and other scanners, compares it with the default branch and keeps triage (`ghcr.io/openasy/secrets`). Scanning of repositories, images and CI logs by an agent is planned.
- **Priority:** High
- **Area:** Architecture

## Context

A leaked key is the one finding whose evidence is itself dangerous. A scanner's report can hold the secret in a code snippet, in a message or in a match; a product that keeps those has become the best place to steal secrets from, and a copy of the leak that survives the day the key is rotated. At the same time the people who read findings need enough to act: which kind of secret, where, since when, and whether it was ever in a commit that is still reachable.

The same questions as in SAST apply: a pull request must fail only for what it adds, and a decision must last. They are answered the same way (ADR 0036), so the two products behave alike and share a pull request check.

## Decision

- **The secret is never stored, logged or returned.** Reports are read in memory. Snippets, matches and anything else the report holds next to a finding are dropped, and the message is masked for values that look like keys, tokens or passwords before it is kept. What is stored is the rule (the kind of secret), the file, the line and a fingerprint.
- **The fingerprint cannot be turned back into the secret.** It is a hash of the rule, the file and the matched text, salted with a random value made when the installation starts. The salt stays in the database, so the same secret has the same fingerprint on every branch of this installation and on no other. A moved line is the same finding; a changed secret in the same place is a new one.
- **Compared with the default branch, as in SAST.** The default branch is the baseline and adopts what is there. Other branches report only what the baseline does not have and nobody has decided about. Because a new secret is always a reason to stop, a repository fails a check for any new finding by default.
- **The decisions fit secrets.** A finding is a false positive (with a reason), accepted risk (with a reason and an end date) or **revoked**: the key was rotated, with a reason. Revoked is the real fix. It stays with the fingerprint, so a pull request that brings the old key back does not fail twice, and the finding is shown as handled and not as open.
- **SARIF in, from any scanner.** Gitleaks and TruffleHog write it, and so do others. The API is the same as SAST's apart from the name of the repository parameter, so pipelines change one URL.
- **Scanning history is the scanner's job and the answer is its finding.** A secret that was removed from the code but is still in a commit is still a leak. The product shows what the scanner reports for the history it was given; it does not clone or walk repositories itself until the agent exists.
- **The first release** has Repositories, Findings with the three decisions, a policy per repository, SARIF import and the comparison above. An agent that scans repositories, images and CI logs, and links from a finding to the product that issued the key, follow.

## Consequences

- Nobody can read a leaked key in Secrets, including its owner. This is intended: the key is in the repository, where it must be removed and then rotated.
- Without the snippet, telling a real secret from a test value is harder. The file, the line and the rule are shown and the person opens the repository; this costs a click and keeps the product out of the breach.
- A fingerprint with a per-installation salt does not match fingerprints from other tools. Decisions made elsewhere are not imported.
- Masking by pattern can miss a secret in a message. The product therefore keeps messages short (at most 300 characters) and the documentation tells teams to treat scanner output as sensitive until it is sent.
