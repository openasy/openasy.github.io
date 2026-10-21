import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("goals", "routes/goals.tsx"),
  route("goals/:id", "routes/goal.tsx"),
  route("products", "routes/products.tsx"),
  route("products/:id", "routes/product.tsx"),
  route("products/:id/api", "routes/product-api.tsx"),
  route("principles", "routes/principles.tsx"),
  route("sign-in", "routes/sign-in.tsx"),
  route("support", "routes/support.tsx"),
] satisfies RouteConfig;
