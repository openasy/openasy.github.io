# 0030. Open-source governance

- **Decision:** Proposed
- **Implementation:** Not started
- **Priority:** High
- **Area:** Project

## Context

ADR 0008 sets the licences. People who depend on OpenAsy also need to know how decisions are made, how contributions are handled and what happens if the maintainers stop.

## Decision

- Contributions arrive as pull requests. A maintainer reviews each one; changes to security-critical code need a second review once there is more than one maintainer. Contributors sign the CLA (ADR 0008).
- Maintainers are listed in each repository with what they own. New maintainers are invited after sustained contributions; access is removed after a year of inactivity.
- Dependencies must have licences compatible with AGPL-3.0 and Apache-2.0; CI checks the licences of every dependency.
- Security reports go to the private address in SECURITY.md (ADR 0008). Reports are acknowledged within 3 business days; critical fixes ship within 72 hours (ADR 0019).
- Support scope is public (the Support page): what Community, Standard and Enterprise cover.
- If the project is handed over or abandoned, it is announced at least 6 months ahead, the repositories stay public and archived, and the trademark policy allows a successor project to continue under a new name.

## Consequences

- Anyone can see who decides, how to get a change in and what happens to their installation if the project ends.
