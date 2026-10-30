import type { ProductStory } from "./types";

export const assets: ProductStory = {
  problem: {
    title: "Hardware, licences and who has what, with warranties and renewals",
    headline: "Nobody knows which laptop Ali has",
    text: "Laptops, phones, monitors and software licences are bought, handed out and forgotten; when someone leaves, the company does not know what to ask back. Assets keeps every item with who has it, its warranty and its cost, and every licence with its seats and renewal date; computers come from Endpoints, the rest is added by hand or on arrival from Purchasing.",
    example:
      "Ali leaves on Friday. HR's end date tells Assets, which lists his laptop, phone and two software seats; IT collects the hardware, frees the seats, and the laptop goes back into the pool for Ayşe, who starts on Monday.",
  },
  who: ["IT, who hand out and collect equipment", "Finance, who pay for licences"],
  glance: [
    {
      label: "Keeps",
      value: "Hardware and licences",
    },
    {
      label: "Shows",
      value: "Who has what",
    },
    {
      label: "Computers",
      value: "From Endpoints",
    },
    {
      label: "Reminds",
      value: "Warranties and renewals",
    },
  ],
  flow: [
    {
      label: "Add",
      detail: "From Endpoints, from Purchasing on arrival, or by hand.",
    },
    {
      label: "Assign",
      detail: "Each item is handed to a person, with their acknowledgement.",
    },
    {
      label: "Track",
      detail: "Warranties, licence seats in use and renewal dates.",
    },
    {
      label: "Return",
      detail: "When someone leaves, what they have is listed to collect.",
    },
  ],
  checks: [
    {
      title: "Hardware",
      items: ["Every item with its owner and location", "Purchase date, cost and warranty", "Handed out and returned, with dates"],
    },
    {
      title: "Licences",
      items: ["Seats bought and in use", "Renewal dates and cost", "Seats held by people who left"],
    },
  ],
  decides: [
    {
      label: "Owner",
      text: "Each item has one person or one location; handing it over is recorded.",
    },
    {
      label: "Leaving",
      text: "On an employee's end date, their items and seats are listed for IT.",
    },
    {
      label: "Renewals",
      text: "Licences are reminded before renewal, with seats not used for 90 days.",
    },
  ],
  inputs: [
    {
      name: "Endpoints",
      how: "Computers with their hardware and software.",
    },
    {
      name: "Import",
      how: "CSV of items and licences.",
    },
  ],
  screens: [
    {
      page: "assets",
      title: "Assets",
      shows: "Every item and who has it.",
    },
    {
      page: "licences",
      title: "Licences",
      shows: "Seats bought, used and idle.",
    },
  ],
  worksWith: [
    {
      id: "endpoints",
      how: "Computers and their software come from Endpoints.",
    },
    {
      id: "hr",
      how: "Joining and leaving list what to hand out and collect.",
    },
    {
      id: "purchasing",
      how: "Bought hardware is added on arrival.",
    },
    {
      id: "cost",
      how: "Licence spend joins the rest of IT's cost.",
    },
  ],
  limits: [
    "Planned: not built yet.",
    "Endpoints keeps computers' health and security; Assets keeps who has them and what they cost.",
    "Depreciation for the books is your accountant's.",
  ],
};
