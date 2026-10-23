# 0053. One brand for every product, from one env file

- **Decision:** Accepted
- **Implementation:** In progress
- **Where:** `auth` reads the settings at start (`brandFromEnv`), sends them with the sign-in methods and serves the logo at `/api/v1/auth/brand/logo`; `useInstallBrand()` in `@openasy/auth/react` gives them to `ui`'s `BrandProvider` in every product and makes the logo the tab icon. The install builder writes `config/brand.env` and mounts the logo; the dev setup mounts `config/brand`.
- **Priority:** Medium
- **Area:** Architecture

## Context

The UI library already takes a brand: a name, an organization, a logo and an accent color. Each product hard-codes it, and the library's placeholder organization, Acme Corp, shows under the product name in products that do not override it. A team that runs several products wants its own name and mark in all of them, set once, without building images.

## Decision

- **Three settings, with the same names in every product.** `OPENASY_ORGANIZATION` is shown under the product's name, and the line is left out when it is not set. `OPENASY_LOGO` names a picture mounted read-only into the container, such as `/config/logo.svg`. `OPENASY_ACCENT` is a `#rrggbb` color for buttons and links.
- **A file of their own.** The install keeps them in `config/brand.env`, apart from `.env`, which holds tokens and keys. It lists every setting with what it does, the unset ones commented out, so people see what they can change. Each product loads it with `env_file`: a change is made in one place and applied with `docker compose up -d`.
- **The logo is one picture with no text in it.** SVG, PNG or WebP, up to 512 KB, square. It replaces the OpenAsy mark in the header and the browser tab icon; the product's name stays next to it as text. There is no separate dark logo: a transparent picture works on both themes.
- **Each product serves the logo itself.** It is read at start and served from the product's own address with a long cache, so the browser never fetches it from elsewhere and the content security policy stays `self`. An SVG is served as an image with `Content-Security-Policy: sandbox`, so a script in it never runs.
- **The OpenAsy name stays.** Products keep "OpenAsy" as the suite's name and the small "Powered by OpenAsy" line; a white label beyond this is not in scope.
- **The install builder writes the file.** It asks for the organization, the logo and the color, puts them in `config/brand.env`, mounts the logo into every product and adds the picture to `openasy.zip`. The picture never leaves the browser.

## Consequences

- One file brands every product, and products added later pick it up by loading the same file.
- The placeholder organization is gone from real installs.
- A product that does not support the settings yet ignores them, so the file can be written before every product reads it.
