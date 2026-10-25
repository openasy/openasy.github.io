import type { ProductStory } from "./types";

export const deception: ProductStory = {
  problem: {
    title: "Tripwires that only an attacker would touch, so an alert means a breach",
    headline: "Most alerts are noise; a canary never is",
    text: "Most security alerts are noise. A canary is different: a fake AWS key in a config file, a decoy database password, a document nobody should open. No real person or process ever uses them, so the moment one is used, someone is inside. Deception will make canaries and decoys, place them where attackers look, and raise one high-confidence alert when one is touched.",
    example:
      "A fake AWS key sits in a deployment script on a build server. Months later it is used from an unknown address. Nobody legitimate has that key, so the build server is compromised; the alert names the canary, the time and the address.",
  },
  who: ["The security team, who place canaries and respond", "Small teams, who need alerts they can trust"],
  glance: [
    {
      label: "Places",
      value: "Fake keys and credentials",
    },
    {
      label: "Touched by",
      value: "Only an attacker",
    },
    {
      label: "Raises",
      value: "One trusted alert",
    },
    {
      label: "Threshold",
      value: "None",
    },
  ],
  flow: [
    {
      label: "Canaries made",
      detail: "Fake keys, credentials, documents and decoy hosts.",
    },
    {
      label: "Placed",
      detail: "Where an attacker looks: configs, password stores, file shares.",
    },
    {
      label: "Touched",
      detail: "Using a canary calls home with when and from where.",
    },
    {
      label: "One alert",
      detail: "High confidence, because nobody legitimate ever touches it.",
    },
  ],
  checks: [
    {
      title: "Canaries",
      items: ["Cloud keys", "Database and service credentials", "Documents and links", "Decoy hosts that answer like real ones"],
    },
  ],
  decides: [
    {
      label: "Alert",
      text: "Any use of a canary is an alert: there is no threshold.",
    },
  ],
  inputs: [
    {
      name: "Canary tokens",
      how: "Made and tracked by the product.",
    },
  ],
  screens: [
    {
      page: "canaries",
      title: "Canaries",
      shows: "Every canary, where it is and whether it was touched.",
      story: "canaries",
    },
    {
      page: "triggers",
      title: "Triggers",
      shows: "Every time a canary was used, from where.",
      story: "triggers",
    },
    {
      page: "credentials",
      title: "Credentials",
      shows: "Decoy credentials and where they were placed.",
      story: "credentials",
    },
  ],
  worksWith: [
    {
      id: "siem",
      how: "A trigger is a signal of the highest confidence.",
    },
    {
      id: "incidents",
      how: "A trigger opens an incident.",
    },
  ],
  limits: ["It tells you someone is inside, not how they got in.", "A canary only works where an attacker would find it."],
};
