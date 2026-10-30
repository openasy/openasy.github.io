import type { ProductStory } from "./types";

export const files: ProductStory = {
  problem: {
    title: "Files shared by team and project, synced to every device, kept in your install",
    headline: "Your company's files are spread over five clouds",
    text: "Contracts in one drive, designs in another, and a USB stick with last year's accounts: nobody knows where the latest version is or who it was shared with. Files keeps the company's files in your install, in folders by team and project, synced to laptops and phones, with links for people outside that expire.",
    example:
      "Finance shares the audit folder with the auditor through a link that needs a password and expires in 14 days. The auditor downloads what they need; the link stops working on day 15, and the folder shows who opened which file.",
  },
  who: ["Everyone who works with documents", "IT, who answer for where the company's files are"],
  glance: [
    {
      label: "Storage",
      value: "Your disks or S3",
    },
    {
      label: "Sync",
      value: "Desktop and phone",
    },
    {
      label: "Sharing",
      value: "Expiring links",
    },
    {
      label: "Access",
      value: "By Identity group",
    },
  ],
  flow: [
    {
      label: "Spaces in a file",
      detail: "Team and project spaces and who may read or change them, by Identity group.",
    },
    {
      label: "Work",
      detail: "Upload in the browser, or sync a folder on a laptop or phone.",
    },
    {
      label: "Share",
      detail: "Links for people outside, with a password and an expiry.",
    },
    {
      label: "Keep",
      detail: "Earlier versions and deleted files are kept for a set time.",
    },
  ],
  checks: [
    {
      title: "Files",
      items: ["Team, project and personal spaces", "Versions and a recycle bin", "Preview of documents, images and PDFs"],
    },
    {
      title: "Sharing",
      items: ["Links with a password and an expiry", "Who opened what through a link", "Upload-only links for collecting files"],
    },
  ],
  decides: [
    {
      label: "Access",
      text: "A space's members come from Identity groups; a person sees only the spaces they belong to.",
    },
    {
      label: "Links",
      text: "Every link to someone outside expires; the longest it may last is set in the file.",
    },
    {
      label: "Leaving",
      text: "Someone's personal files go to their manager when they leave, not to the recycle bin.",
    },
  ],
  inputs: [
    {
      name: "Sync apps",
      how: "A desktop and phone app, chosen before work starts.",
    },
    {
      name: "Import",
      how: "From another drive, over WebDAV or a folder.",
    },
  ],
  screens: [
    {
      page: "space",
      title: "Space",
      shows: "A team's folders and files.",
    },
    {
      page: "links",
      title: "Links",
      shows: "Every link to someone outside, and when it expires.",
    },
  ],
  worksWith: [
    {
      id: "identity",
      how: "Sign-in, and spaces by group.",
    },
    {
      id: "chat",
      how: "Files sent in Chat can be saved to a space.",
    },
    {
      id: "backups",
      how: "Spaces are backed up with the rest.",
    },
    {
      id: "contracts",
      how: "Signed contracts are filed in a space.",
    },
  ],
  limits: [
    "Planned: not built yet.",
    "Editing documents together in the browser comes after the first release.",
    "Storage is your own disks or an S3-compatible store you run.",
  ],
};
