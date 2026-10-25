/** Support plans. Prices are agreed per customer, so the site only shows scope. */

/** Where "Contact us" goes. Replace with the real support address before launch. */
export const SUPPORT_EMAIL = "info@openasy.com";

export const contactUrl = (plan: string) => `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`OpenAsy ${plan} support`)}`;

export interface Plan {
  id: "community" | "enterprise";
  name: string;
  price: string;
  pitch: string;
  features: string[];
  cta: { label: string; href: string };
  highlight?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "community",
    name: "Community",
    price: "Free",
    pitch: "For trying things out and for teams that like to fix things themselves.",
    features: ["All products, all features", "GitHub issues and discussions", "Install guides and documentation", "Security fixes in the latest release"],
    cta: { label: "Go to GitHub", href: "https://github.com/openasy" },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Contact us",
    pitch: "For companies running OpenAsy in production, and teams where it is critical to operations or security.",
    features: [
      "Guaranteed response times, 24/7 for critical issues",
      "Help with installation, configuration and every upgrade",
      "Covers all products you run",
      "A named engineer and a private Slack or Teams channel",
      "Upgrade planning and assisted upgrades",
      "Long-term support lines with 12 months of security fixes",
      "Security advisories before public release",
      "Help preparing evidence for ISO 27001 and SOC 2 audits",
    ],
    cta: { label: "Contact us", href: contactUrl("Enterprise") },
    highlight: true,
  },
];

export const RESPONSE_TIMES: Array<{ severity: string; meaning: string; enterprise: string }> = [
  { severity: "Critical", meaning: "Production is down or a security incident is in progress", enterprise: "1 hour, 24/7" },
  { severity: "High", meaning: "A major feature does not work and there is no workaround", enterprise: "4 hours" },
  { severity: "Normal", meaning: "Questions, configuration help, minor problems", enterprise: "1 business day" },
];

export const FAQ: Array<{ q: string; a: string }> = [
  { q: "Do I need a support plan to use OpenAsy?", a: "No. Every product is free and open source under AGPL-3.0, and works the same with or without support." },
  {
    q: "Can I use OpenAsy in a commercial product or service?",
    a: "Yes. AGPL-3.0 allows commercial use; if you offer a changed version to others, you share your changes under the same licence. If you cannot, a commercial licence covers the same code without that obligation.",
  },
  { q: "Does paying unlock features?", a: "No. There is no enterprise edition and no licence key. You pay for people who know the products, not for code." },
  { q: "How much does it cost?", a: "It depends on how many products and hosts you run and the plan you need. Tell us what you run and we will send a quote." },
  { q: "Can you install it for us?", a: "Yes. Enterprise includes help with installation, and we can do the first setup together on a call." },
  { q: "Who answers?", a: "The engineers who build the products." },
];
