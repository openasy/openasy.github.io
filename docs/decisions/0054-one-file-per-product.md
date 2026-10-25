# 0054. Each product in one compose file of its own, with its settings and secrets

- **Decision:** Proposed
- **Implementation:** In progress
- **Where:** The install builder and the dev setup at openasy.github.io/install write `products/<product>.yaml` for every product they run, and a compose.yaml that includes them.
- **Priority:** High
- **Area:** Architecture

## Context

An install ran its products from one compose.yaml and one `.env`. The settings were spread over both: addresses and file paths in each service's `environment:`, every secret in `.env`, and compose put them together. Changing how one product behaves meant finding its lines in a long compose.yaml, and every container could be handed any secret in `.env` by a line someone added.

Splitting each container's settings and secrets into env files of their own, `config/<service>.env` and `secrets/<service>.env`, put them where their name said, but gave the dev setup more than 60 files, and setup two files of its own to know which of them to write to. A product with an agent was four files, and its containers' definitions were still somewhere else.

The products themselves read their settings from environment variables only, and never from a file of settings (ADR 0004, 0021). That does not change; what changes is where an install keeps them.

## Decision

- **One file per product.** `products/<product>.yaml` is a compose file with the product's containers, such as `sast` and `sast-agent`: their images, volumes and limits, and their settings and secrets in `environment:`. `<product>` is its main container's name, such as `sast`, `infra` or `vulns`. Each repository's own compose.yaml, for running the product alone, already has this shape.
- **compose.yaml includes them.** It holds one `include` line per product, and the containers no product owns, such as Caddy and Prometheus. Leaving a line out leaves the product out. A change is made in the product's file, then `docker compose up -d <its containers>` applies it.
- **What every product shares is in two files.** `openasy.env` holds the brand (ADR 0004) and, in the dev setup, what is the same everywhere, such as the product switcher's list. `sign-in.env` holds how people sign in (ADR 0002). Every product loads them with `env_file`, except that Identity does not load `sign-in.env` when it signs its own people in another way. A product's own client, its issuer, ID and secret, is in its own file.
- **A value two products need is written to both.** Vulnerabilities' ingest token is in `products/vulns.yaml`, for `vulns` and `vulns-agent`, and, as `INFRA_VULNS_TOKEN`, in `products/infra.yaml`. Each line says where the others are; replacing the token means replacing it in each.
- **What exists only after the first start is written to the same file.** An agent's enrolment token, an application's client in Identity and a token one product makes in another go into the product's file. The dev setup writes them itself, into the lines each container's `x-openasy` names; an install's steps say which file and which container.
- **Keys stay files.** The key-encryption keys (`keys/openasy-kek` and the agents' keys) are mounted as compose secrets, never written in a product's file (ADR 0021). The private keys a host names in the hosts file are in `keys/ssh`.
- **Next to them:** the inventory files in `inventory/` (ADR 0052), the logo and tab icon in `brand/`, and the proxy's and Prometheus' files in `config/`.

## Consequences

- What a product runs and is told is one file named after it, and a review of a change to it reads one diff.
- compose.yaml changes only when products are added or left out.
- A product's file holds its secrets, so `products/` and `keys/` stay out of git and go with the backups. The inventory files hold no secret and may be kept in git.
- A shared secret is written in more than one file. A forgotten copy shows at once, as the product that has the old value is refused; the comment beside each copy names the others.
