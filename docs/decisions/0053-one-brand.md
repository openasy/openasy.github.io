# 0053. One brand for every product, from one env file

- **Decision:** Accepted
- **Implementation:** In progress
- **Where:** `auth` reads the settings at start (`brandFromEnv`), sends them with the sign-in methods and serves the pictures at `/api/v1/auth/brand/logo` and `/api/v1/auth/brand/favicon`; `useInstallBrand()` in `@openasy/auth/react` gives them to `ui`'s `BrandProvider` in every product and makes the favicon the tab icon. `ui` shows a logo at a fixed height in its own shape, without the name next to it. The install builder writes `config/brand.env` and puts the pictures in `config/brand`, which every product mounts, as the dev setup does.
- **Priority:** Medium
- **Area:** Architecture

## Context

The UI library already takes a brand: a name, an organization, a logo and an accent color. Each product hard-codes it, and the library's placeholder organization, Acme Corp, shows under the product name in products that do not override it. A team that runs several products wants its own name and mark in all of them, set once, without building images.

## Decision

- **Four settings, with the same names in every product.** `OPENASY_ORGANIZATION` is shown under the product's name, and the line is left out when it is not set. `OPENASY_LOGO` and `OPENASY_FAVICON` name pictures in `config/brand`, which every product mounts read-only, such as `/config/brand/logo.svg`; the folder rather than each file, so a picture saved again reaches the products. `OPENASY_ACCENT` is a `#rrggbb` color for buttons and links.
- **A file of their own.** The install keeps them in `config/brand.env`, apart from `.env`, which holds tokens and keys. It lists every setting with what it does, the unset ones commented out, so people see what they can change. Each product loads it with `env_file`: a change is made in one place and applied with `docker compose up -d`.
- **The logo keeps its own shape.** SVG, PNG or WebP, up to 512 KB, with or without text. It is shown at a fixed height and as wide as its shape needs, up to six times its height, in place of the OpenAsy mark and wordmark in the header and on the sign-in screen: it stands for the brand, so no name is written next to it. There is no separate dark logo: a transparent picture works on both themes.
- **The tab icon is a picture of its own.** A wide logo makes a poor icon, so `OPENASY_FAVICON` is a square SVG, PNG or ICO, up to 128 KB. Without it, each product keeps its own icon.
- **Each product serves the pictures itself.** They are read at start and served from the product's own address with a long cache, so the browser never fetches them from elsewhere and the content security policy stays `self`. An SVG is served as an image with `Content-Security-Policy: sandbox`, so a script in it never runs.
- **The OpenAsy name stays where there is no logo.** Without a logo, products keep the OpenAsy mark and name. A white label beyond the four settings, such as other product names, is not in scope.
- **The install builder writes the file.** It asks for the organization, the logo, the tab icon and the color, puts them in `config/brand.env`, mounts `config/brand` into every product and adds the pictures to `openasy.zip`. The pictures never leave the browser.

## Consequences

- One file brands every product, and products added later pick it up by loading the same file.
- The placeholder organization is gone from real installs.
- A product that does not support the settings yet ignores them, so the file can be written before every product reads it.
