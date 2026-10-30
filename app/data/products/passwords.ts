import type { ProductStory } from "./types";

export const passwords: ProductStory = {
  problem: {
    title: "A password manager for the team, with shared vaults, kept in your install",
    headline: "Shared passwords end up in a spreadsheet",
    text: "The router's password, the bank's login and the social media accounts are shared by chat, kept in a spreadsheet, and never changed when someone leaves. Passwords gives each person a vault and each team shared ones, on a server compatible with the Bitwarden apps and browser extensions, with sign-in through Identity and access that follows people's groups.",
    example:
      "Ali leaves the company. HR ends Ali's contract, Identity disables the account, and Passwords removes Ali from the Finance vault and lists the twelve passwords Ali could see, so they can be changed that afternoon.",
  },
  who: ["Everyone, who has too many passwords", "IT and security teams, who answer for shared accounts"],
  glance: [
    {
      label: "Apps",
      value: "Bitwarden apps and extensions",
    },
    {
      label: "Vaults",
      value: "Personal and shared",
    },
    {
      label: "Access",
      value: "By Identity group",
    },
    {
      label: "Data stays",
      value: "In your install",
    },
  ],
  flow: [
    {
      label: "Vaults by group",
      detail: "Each team's vault and who may see or change it, set in a file by Identity group.",
    },
    {
      label: "Use",
      detail: "The browser extension fills in logins; phones and desktops use the same apps.",
    },
    {
      label: "Share",
      detail: "Items are shared by moving them into a team vault, never by sending them.",
    },
    {
      label: "Leave",
      detail: "Someone who leaves loses access at once, with a list of what they could see.",
    },
  ],
  checks: [
    {
      title: "For people",
      items: ["A personal vault, encrypted on their device", "Logins, cards, notes and two-step codes", "Password health: reused, weak or leaked"],
    },
    {
      title: "For the company",
      items: ["Shared vaults by team", "Who opened or changed a shared item", "What to change when someone leaves"],
    },
  ],
  decides: [
    {
      label: "Encryption",
      text: "Items are encrypted on the device; the server keeps only what it cannot read.",
    },
    {
      label: "Access",
      text: "Shared vault access follows Identity groups on every sign-in.",
    },
    {
      label: "Recovery",
      text: "An admin can recover a company vault, never a person's personal one.",
    },
  ],
  inputs: [
    {
      name: "Bitwarden apps",
      how: "The official apps and browser extensions, pointed at your server.",
    },
    {
      name: "Import",
      how: "From other password managers and browsers.",
    },
  ],
  screens: [
    {
      page: "vaults",
      title: "Vaults",
      shows: "A person's vaults with one open: its items, a login with its two-step code, and members from Identity groups.",
      story: "vaults",
    },
    { page: "health", title: "Health", shows: "Leaked, weak, reused and old passwords in the shared vaults, by team.", story: "health" },
    { page: "leavers", title: "Leavers", shows: "The shared passwords someone who leaves could see, the recently opened ones first.", story: "leavers" },
    { page: "activity", title: "Activity", shows: "Who opened, copied or changed which shared item, and from where.", story: "activity" },
  ],
  worksWith: [
    {
      id: "identity",
      how: "Sign-in, and vault access by group.",
    },
    {
      id: "secrets",
      how: "Secrets keeps machines' credentials; Passwords keeps people's.",
    },
    {
      id: "audit",
      how: "Opening and changing shared items is audited.",
    },
  ],
  limits: [
    "Designed: the screens are in Storybook; it is not built yet.",
    "Built on a Bitwarden-compatible open-source server, chosen before work starts.",
    "Passkeys stored in vaults depend on what the apps support.",
  ],
};
