import type { Config } from "@react-router/dev/config";
import { GOALS } from "./app/data/goals";
import { SITE_PRODUCT_IDS } from "./app/data/product-ids";

export default {
  // A static site for GitHub Pages: every route is rendered to HTML at build time.
  ssr: false,
  prerender: ["/", "/goals", "/products", "/principles", "/support", ...GOALS.map((g) => `/goals/${g.id}`), ...SITE_PRODUCT_IDS.map((id) => `/products/${id}`)],
} satisfies Config;
