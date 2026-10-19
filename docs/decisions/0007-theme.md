# 0007. Theme: light, dark and follow the system

- **Decision:** Accepted
- **Implementation:** Implemented
- **Where:** `@openasy/ui` (`BrandProvider`, `ThemeToggle`) and this site.
- **Area:** Product

## Context

People work in bright offices and in dark NOCs.

## Decision

- Every colour is a token with a light and a dark value; components never use raw colours.
- Every product offers system, light and dark. System follows the operating system and is the default.
- The choice is remembered in the browser and applied before the first paint, so a dark screen never flashes light.
- How `@openasy/ui` implements this is recorded in its own decisions (UI 0002).

## Consequences

- Every story is checked in both themes from the Storybook toolbar.

## Where you can see it

- [Colour tokens (switch Theme in the toolbar)](https://openasy.github.io/ui/?path=/story/foundations-overview--colors)
