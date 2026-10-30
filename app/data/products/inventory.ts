import type { ProductStory } from "./types";

export const inventory: ProductStory = {
  problem: {
    title: "Stock by product and warehouse, with counts and low-stock warnings",
    headline: "You sell what you do not have",
    text: "Stock is counted in a spreadsheet updated on Fridays, so sales promise goods that left on Wednesday. Inventory keeps stock by product and warehouse, moved by purchases received and sales invoiced, with counts, transfers and a warning before anything runs out.",
    example:
      "A product's stock falls under its minimum of 20 after an invoice. Inventory warns purchasing, who request 100 more; when they arrive, they are received into the Istanbul warehouse and the stock shows 112.",
  },
  who: ["Operations and warehouse teams", "Sales and purchasing, who need to know what is there"],
  glance: [
    {
      label: "Keeps",
      value: "Stock by warehouse",
    },
    {
      label: "Moved by",
      value: "Purchases and sales",
    },
    {
      label: "Warns",
      value: "Before it runs out",
    },
    {
      label: "Counts",
      value: "Done on the phone",
    },
  ],
  flow: [
    {
      label: "Products",
      detail: "Products, units and minimum stock, imported or added.",
    },
    {
      label: "Move",
      detail: "Receipts from Purchasing, issues from Invoices, transfers between warehouses.",
    },
    {
      label: "Count",
      detail: "Counts on the phone, with differences approved before they change the stock.",
    },
    {
      label: "Warn",
      detail: "Products under their minimum are listed for purchasing.",
    },
  ],
  checks: [
    {
      title: "Stock",
      items: ["Quantity by product and warehouse", "Every movement with its reason", "Batch and serial numbers where needed"],
    },
    {
      title: "Reports",
      items: ["Stock value", "Products under minimum", "Slow-moving stock"],
    },
  ],
  decides: [
    {
      label: "Movements",
      text: "Stock changes only through a movement with a reason; it is never edited directly.",
    },
    {
      label: "Counts",
      text: "A count's differences change the stock once a manager approves them.",
    },
    {
      label: "Value",
      text: "Stock is valued at average cost.",
    },
  ],
  inputs: [
    {
      name: "Import",
      how: "Products and opening stock from CSV.",
    },
    {
      name: "Barcodes",
      how: "Scanned with the phone's camera.",
    },
  ],
  screens: [
    {
      page: "stock",
      title: "Stock",
      shows: "Products by warehouse with what is low.",
    },
    {
      page: "movements",
      title: "Movements",
      shows: "Every change with its reason.",
    },
  ],
  worksWith: [
    {
      id: "purchasing",
      how: "Received goods enter the stock.",
    },
    {
      id: "invoices",
      how: "Sold goods leave it.",
    },
    {
      id: "assets",
      how: "Hardware for the company's own use goes to Assets instead.",
    },
  ],
  limits: ["Planned: not built yet.", "It is not a full ERP: production and manufacturing are out of scope.", "Shipping and carriers are out of scope."],
};
