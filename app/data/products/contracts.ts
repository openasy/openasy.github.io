import type { ProductStory } from "./types";

export const contracts: ProductStory = {
  problem: {
    title: "Every contract in one place, with renewal dates, reminders and signing",
    headline: "A contract renews because nobody remembered to cancel it",
    text: "Contracts sit in email attachments and drawers; a software licence renews for another year because its notice date passed unnoticed. Contracts keeps every contract with its parties, value, start, end and notice dates, reminds the owner before each date, and sends new ones for signature through a provider you choose.",
    example:
      "A hosting contract ends on 31 March with 60 days' notice. Contracts reminds its owner on 15 January and again on 25 January; the owner decides not to renew, and the notice is sent in time.",
  },
  who: ["Legal and finance, who answer for contracts", "Managers, who own a contract"],
  glance: [
    {
      label: "Keeps",
      value: "Every contract",
    },
    {
      label: "Reminds",
      value: "Before notice dates",
    },
    {
      label: "Signing",
      value: "Through a provider",
    },
    {
      label: "Access",
      value: "By owner and team",
    },
  ],
  flow: [
    {
      label: "File",
      detail: "Each contract with its parties, value, dates and owner.",
    },
    {
      label: "Remind",
      detail: "Before notice and end dates, by email and Chat.",
    },
    {
      label: "Sign",
      detail: "New contracts go out for e-signature through the provider set in the file.",
    },
    {
      label: "Find",
      detail: "Search by party, type, value and date.",
    },
  ],
  checks: [
    {
      title: "Contracts",
      items: ["Parties, value and dates", "Versions and related documents", "Owners and who may see them"],
    },
    {
      title: "Dates",
      items: ["Notice and end dates", "Renewals coming up", "Obligations with their own dates"],
    },
  ],
  decides: [
    {
      label: "Reminders",
      text: "Owners are reminded at the intervals the file sets before each notice and end date.",
    },
    {
      label: "Access",
      text: "A contract is seen by its owner, their team and legal; others only if shared.",
    },
    {
      label: "Signing",
      text: "Signing goes through the provider set in the file; Contracts is not a signature provider.",
    },
  ],
  inputs: [
    {
      name: "e-signature provider",
      how: "Through its API, with your account set in the file.",
    },
    {
      name: "Import",
      how: "PDFs with their dates, from a folder or CSV.",
    },
  ],
  screens: [
    {
      page: "contracts",
      title: "Contracts",
      shows: "Every contract with its next date.",
    },
    {
      page: "contract",
      title: "Contract",
      shows: "One contract with its versions and dates.",
    },
  ],
  worksWith: [
    {
      id: "purchasing",
      how: "Supplier terms come from contracts.",
    },
    {
      id: "crm",
      how: "Customer contracts sit beside their deals.",
    },
    {
      id: "files",
      how: "Signed copies are filed in a space.",
    },
    {
      id: "risk",
      how: "Contracts with vendors feed vendor risk.",
    },
  ],
  limits: ["Planned: not built yet.", "Legal advice is out of scope.", "Only e-signature providers with an API can be connected."],
};
