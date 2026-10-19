# openasy.github.io

The OpenAsy website: what the products do, install guides by goal, the product catalog and the design principles.
Published at https://openasy.github.io/. The component library's Storybook stays at https://openasy.github.io/ui/.

## Pages

| Route | What it shows |
| --- | --- |
| `/` | Landing page |
| `/goals`, `/goals/:id` | Guides by goal ("I only need a VPN", "Pass an audit", "Notice data loss", …): the fewest products needed, optional add-ons and install steps |
| `/products`, `/products/:id` | Every product, the goals it serves and how to run it alone |
| `/products/:id/api` | API reference built from the product's `openapi.json` (VPN and Vulnerabilities today) |
| `/principles` | The design decisions in [`docs/decisions`](./docs/decisions/README.md), accepted and proposed, with how far each is built |

Content lives in `app/data/`. Product names, icons, images and summaries come from `@openasy/ui` (`PRODUCTS`), so the
catalog always matches the library.

## Develop

Requires Node 26.12+ and npm 11+. Until `@openasy/ui` is on npm, clone [openasy/ui](https://github.com/openasy/ui)
next to this repository and build it once:

```bash
git clone git@github.com:openasy/ui.git ../ui && (cd ../ui && npm ci && npm run build)
git clone git@github.com:openasy/vpn-manager.git ../vpn-manager   # API reference at /products/vpn/api
git clone git@github.com:openasy/vulns.git ../vulns               # API reference at /products/vulnerabilities/api
npm ci
npm run dev        # http://localhost:5173
npm test           # data checks and page tests
npm run typecheck
npm run build      # prerenders every route to build/client
```

Built with React 19, React Router 8 (framework mode, static prerender), Vite 8, Tailwind CSS 4 and TypeScript.

## Deploy

Every push to `main` runs `.github/workflows/pages.yml`: it builds `@openasy/ui`, tests and prerenders the site and
publishes `build/client` to GitHub Pages. For an organisation site the repository must be named `openasy.github.io`.

## Licence

[Apache-2.0](./LICENSE)
