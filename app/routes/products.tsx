import { useState } from "react";
import { PRODUCT_IDS, PRODUCTS, SegmentedControl, type ProductGroup } from "@openasy/ui";
import { Section } from "../components/site";
import { ProductCard } from "../components/cards";
import { GROUPS } from "./home";

export function meta() {
  return [{ title: "Products · OpenAsy" }, { name: "description", content: "Every OpenAsy product for operations, security, identity and automation." }];
}

export default function Products() {
  const [group, setGroup] = useState<"all" | ProductGroup>("all");
  const ids = PRODUCT_IDS.filter((id) => group === "all" || PRODUCTS[id].group === group);
  return (
    <Section className="py-10" labelledBy="title">
      <h1 id="title" className="m-0 text-3xl font-semibold">
        Products
      </h1>
      <p className="mt-2 max-w-2xl text-fg-muted">Each one is a separate container with its own users, data and API. Link them to share hosts, people and alerts.</p>
      <SegmentedControl
        label="Product group"
        size="md"
        className="mt-4 max-w-full flex-wrap"
        value={group}
        onChange={setGroup}
        options={[{ value: "all", label: `All (${PRODUCT_IDS.length})` }, ...GROUPS.map((g) => ({ value: g.id, label: g.name }))]}
      />
      <ul aria-label="Product list" className="mt-4 grid list-none gap-2 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {ids.map((id) => (
          <ProductCard key={id} id={id} />
        ))}
      </ul>
    </Section>
  );
}
