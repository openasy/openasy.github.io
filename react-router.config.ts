import type { Config } from "@react-router/dev/config";
import { GOALS } from "./app/data/goals";
import { SITE_PRODUCT_IDS } from "./app/data/product-ids";
import { APIS } from "./app/data/apis";

export default {
  // A static site for GitHub Pages: every route is rendered to HTML at build time.
  ssr: false,
  prerender: [
    "/",
    "/goals",
    "/products",
    "/principles",
    "/evidence",
    "/install",
    "/sign-in",
    "/support",
    ...GOALS.map((g) => `/goals/${g.id}`),
    ...SITE_PRODUCT_IDS.map((id) => `/products/${id}`),
    ...Object.keys(APIS).map((id) => `/products/${id}/api`),
  ],
} satisfies Config;
