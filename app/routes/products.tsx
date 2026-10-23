import { useState } from "react";
import { PRODUCT_IDS, PRODUCTS, SegmentedControl, type ProductGroup } from "@openasy/ui";
import { PageTitle, Section } from "../components/site";
import { ProductCard } from "../components/cards";
import { statusFor, type ProductStatus } from "../data/status";
import { GROUPS } from "./home";

export function meta() {
  return [{ title: "Products · OpenAsy" }, { name: "description", content: "Every OpenAsy product for operations, security, identity and automation." }];
}

const RANK: Record<ProductStatus, number> = { Preview: 0, "In progress": 1, Designed: 2 };
const STATUSES: Array<{ value: ProductStatus; label: string }> = [
  { value: "Preview", label: "Ready to try" },
  { value: "In progress", label: "In progress" },
  { value: "Designed", label: "Designed" },
];

// Released first, then in progress; sort is stable, so each keeps its catalogue order.
const SORTED = PRODUCT_IDS.toSorted((a, b) => RANK[statusFor(a).status] - RANK[statusFor(b).status]);

export default function Products() {
  const [status, setStatus] = useState<"all" | ProductStatus>("all");
  const [group, setGroup] = useState<"all" | ProductGroup>("all");
  const count = (s: ProductStatus) => PRODUCT_IDS.filter((id) => statusFor(id).status === s).length;
  const ids = SORTED.filter((id) => (status === "all" || statusFor(id).status === status) && (group === "all" || PRODUCTS[id].group === group));
  return (
    <Section className="py-12" labelledBy="title">
      <PageTitle title="Products">
        Each one is its own container with its own users, data and API. Run one, or link them to share people and alerts. Products that work with the same
        servers or endpoints read them from one file you mount in each.
      </PageTitle>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <SegmentedControl
          label="Status"
          size="md"
          className="max-w-full flex-wrap"
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: `All (${PRODUCT_IDS.length})` },
            ...STATUSES.map((s) => ({ value: s.value, label: `${s.label} (${count(s.value)})` })),
          ]}
        />
        <SegmentedControl
          label="Product group"
          size="md"
          className="max-w-full flex-wrap"
          value={group}
          onChange={setGroup}
          options={[{ value: "all", label: "All groups" }, ...GROUPS.map((g) => ({ value: g.id, label: g.name }))]}
        />
      </div>
      {ids.length ? (
        <ul aria-label="Product list" className="mt-6 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {ids.map((id) => (
            <ProductCard key={id} id={id} />
          ))}
        </ul>
      ) : (
        <p className="mt-6 rounded-xl border border-dashed border-line-strong p-6 text-center text-fg-muted">No products in this group have that status yet.</p>
      )}
      <p className="mt-5 mb-0 text-sm text-fg-subtle">
        Showing {ids.length} of {PRODUCT_IDS.length}. Products without a label are designed: their screens are in Storybook, the code comes later.
      </p>
    </Section>
  );
}
