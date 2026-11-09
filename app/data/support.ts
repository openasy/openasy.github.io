/**
 * Support plans, shown on the home page and on /support from this one file. Using the products is free and unlimited;
 * these are prices for help. There is no checkout: every plan starts with an email, and its scope, price and terms are
 * agreed in writing before work or a subscription begins.
 */

/** Where "Contact us" goes. Replace with the real support address before launch. */
export const SUPPORT_EMAIL = "info@openasy.com";

export const contactUrl = (subject: string) => `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;

export interface Plan {
  id: "community" | "setup" | "standard" | "enterprise";
  name: string;
  price: string;
  /** Under the price: how often it is paid. */
  cadence?: string;
  pitch: string;
  features: string[];
  /** What the plan does not promise, said next to it. */
  notes?: string[];
  /** An address on this site, or a mailto link with the plan in the subject. */
  cta: { label: string; href: string; external?: boolean };
}

export const PLANS: Plan[] = [
  {
    id: "community",
    name: "Community",
    price: "Free",
    pitch: "For teams that run OpenAsy themselves.",
    features: ["All products and features", "Self-hosted on your infrastructure", "Documentation and community support", "No guaranteed response time"],
    cta: { label: "Get started", href: "/install" },
  },
  {
    id: "setup",
    name: "Guided Setup",
    price: "From $499",
    cadence: "one-time",
    pitch: "For a first install done with someone who knows the products.",
    features: [
      "One deployment environment",
      "Installation and initial configuration of up to three OpenAsy products",
      "Basic operational checks",
      "A handover session",
    ],
    notes: ["Final scope and price are agreed before work begins. Hosting costs, data migration, and custom integrations are quoted separately."],
    cta: { label: "Discuss your setup", href: contactUrl("OpenAsy Guided Setup"), external: true },
  },
  {
    id: "standard",
    name: "Standard Support",
    price: "$199",
    cadence: "per month",
    pitch: "For one organization running a few OpenAsy products in production.",
    features: [
      "One organization",
      "One production environment",
      "Support for up to three selected OpenAsy products",
      "Email support",
      "Initial response within one business day",
      "Up to two hours of hands-on technical assistance per month",
      "Configuration troubleshooting and upgrade guidance within that allowance",
      "Additional work scoped and quoted in advance",
    ],
    notes: [
      "Product usage remains unlimited; these limits apply only to paid support.",
      "Response time means the first response, not guaranteed resolution.",
      "Hosting, continuous monitoring, managed operations, and 24/7 incident response are not included.",
      "Business-hour coverage and time zone are agreed before the subscription starts.",
    ],
    cta: { label: "Request Standard support", href: contactUrl("OpenAsy Standard Support"), external: true },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom pricing",
    pitch: "For installs that need more than Standard covers.",
    features: [
      "Multiple environments or broader product coverage",
      "Custom integration requirements",
      "Support scope and response commitments defined by agreement",
    ],
    notes: [
      "Nothing beyond these is included by default. Requests such as round-the-clock cover or faster response commitments are assessed case by case and only apply once agreed in writing.",
    ],
    cta: { label: "Contact us", href: contactUrl("OpenAsy Enterprise"), external: true },
  },
];

/** The plans side by side: one row per question people ask before choosing. */
export const COMPARISON: Array<{ topic: string; values: Record<Plan["id"], string> }> = [
  {
    topic: "Price",
    values: { community: "Free", setup: "From $499, one-time", standard: "$199 per month", enterprise: "By agreement" },
  },
  {
    topic: "Products you can use",
    values: { community: "All, unlimited", setup: "All, unlimited", standard: "All, unlimited", enterprise: "All, unlimited" },
  },
  {
    topic: "Products we help with",
    values: { community: "None", setup: "Up to three, at installation", standard: "Up to three you select", enterprise: "By agreement" },
  },
  {
    topic: "Environments",
    values: { community: "Any, run by you", setup: "One", standard: "One production environment", enterprise: "By agreement" },
  },
  {
    topic: "How we answer",
    values: { community: "Documentation and community", setup: "Sessions scheduled with you", standard: "Email", enterprise: "By agreement" },
  },
  {
    topic: "First response",
    values: { community: "No guarantee", setup: "Agreed with the scope", standard: "Within one business day", enterprise: "By agreement" },
  },
  {
    topic: "Hands-on work",
    values: {
      community: "None",
      setup: "The agreed setup",
      standard: "Up to two hours a month; more is quoted first",
      enterprise: "By agreement",
    },
  },
  {
    topic: "Hosting, monitoring, 24/7 response",
    values: { community: "Not included", setup: "Not included", standard: "Not included", enterprise: "Only if agreed" },
  },
];

export const FAQ: Array<{ q: string; a: string }> = [
  { q: "Do I need a support plan to use OpenAsy?", a: "No. Every product is free and open source under AGPL-3.0, and works the same with or without support." },
  {
    q: "Are there limits on products or users without a plan?",
    a: "No. Product usage is unlimited on every plan, including Community. The limits on Standard Support apply only to the help we give.",
  },
  {
    q: "Can I use OpenAsy in a commercial product or service?",
    a: "Yes. AGPL-3.0 allows commercial use; if you offer a changed version to others, you share your changes under the same licence.",
  },
  { q: "Does paying unlock features?", a: "No. There is no enterprise edition and no licence key. You pay for help, not for code." },
  {
    q: "How much does it cost?",
    a: "Using OpenAsy is free. Guided Setup starts at $499, one-time; Standard Support is $199 a month; Enterprise is priced by agreement. Scope and price are confirmed in writing before any work or subscription starts.",
  },
  {
    q: "Can you install it for us?",
    a: "Yes, as Guided Setup: one environment and up to three products, with the scope and price agreed before we begin. Standard Support covers troubleshooting and upgrade guidance, not a new installation.",
  },
  {
    q: 'What does "within one business day" mean?',
    a: "The time to our first response, not to a fix. The business hours and time zone it counts in are agreed before the subscription starts.",
  },
  { q: "How do I sign up?", a: "There is no online checkout. Write to us with what you run; we agree the scope and terms by email before anything is billed." },
];
