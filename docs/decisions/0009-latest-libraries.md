# 0009. Current, supported libraries

- **Decision:** Accepted
- **Implementation:** In progress
- **Where:** Dependabot runs on every product, agent and server, and on `@openasy/auth`.
- **Area:** Engineering

## Context

Old dependencies are the most common source of vulnerabilities, and upgrades get harder the longer they wait. A brand-new major, on the other hand, often has bugs and is not yet supported by the libraries around it.

## Decision

- We use versions that are current and supported by their maintainers (today: React 19, Vite 8, Tailwind CSS 4, TypeScript 7, Storybook 10, Vitest 5). Nothing past its end of life.
- Node.js: only LTS releases (today: Node 26).
- A new major is adopted once it has had its first patch release and the libraries we depend on support it, not on the day it ships.
- An update bot opens pull requests for every new version. Patch and minor updates merge when CI passes; a new major is reviewed by a maintainer first.
- We do not add a dependency for something a few lines of code can do.

## Consequences

- Users on old browsers or runtimes are not supported.
- We are usually a few weeks behind a new major, never years.
