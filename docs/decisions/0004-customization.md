# 0004. Customization: white-label and feature switches

- **Decision:** Accepted
- **Implementation:** In progress
- **Where:** White-label is implemented in `@openasy/ui` (`BrandProvider`). Feature switches are not started.
- **Area:** Product

## Context

Service providers resell the products under their own name, and teams want to hide features they do not use.

## Decision

- `BrandProvider` takes a name, organization, logo (light and dark), accent colour and font. Only the accent is needed; hover, soft and focus tones are derived from it.
- Each product will list its features in Settings with an on/off switch. A switched-off feature disappears from the navigation and its API returns 404.

## Consequences

- Features must be built so they can be removed without breaking the rest of the product.

## Where you can see it

- [Branding settings](https://openasy.github.io/ui/?path=/story/identity-branding--settings)
