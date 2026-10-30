import type { ProductStory } from "./types";

export const purchasing: ProductStory = {
  problem: {
    title: "Purchase requests, approvals and orders, with suppliers and what arrived",
    headline: "Nobody approved it, but it was bought",
    text: "Someone needs ten laptops, emails a supplier, and finance learns of it from the invoice. Purchasing asks for a request first, sends it for approval by amount, turns it into an order to the supplier, and checks the invoice against what was ordered and what arrived.",
    example:
      "IT requests ten laptops for 450,000 TL. Over the limit, it needs the CFO's approval; then Purchasing sends the order to the supplier, the laptops are received into Inventory and Assets, and the supplier's invoice matches the order and the delivery.",
  },
  who: ["Anyone who needs to buy something", "Finance, who approve and pay"],
  glance: [
    {
      label: "Starts with",
      value: "A request",
    },
    {
      label: "Approval",
      value: "By amount, in a file",
    },
    {
      label: "Sends",
      value: "Orders to suppliers",
    },
    {
      label: "Checks",
      value: "Order, delivery, invoice",
    },
  ],
  flow: [
    {
      label: "Request",
      detail: "What, how many, why and for which budget.",
    },
    {
      label: "Approve",
      detail: "Approvers by amount and team, as the file sets.",
    },
    {
      label: "Order",
      detail: "An order to the supplier, by email as PDF.",
    },
    {
      label: "Receive",
      detail: "What arrived is counted; the invoice is checked against both.",
    },
  ],
  checks: [
    {
      title: "Buying",
      items: ["Requests and approvals", "Orders to suppliers", "Deliveries, in part or in full"],
    },
    {
      title: "Suppliers",
      items: ["Suppliers with their terms and contacts", "Prices paid over time", "Late deliveries"],
    },
  ],
  decides: [
    {
      label: "Approval",
      text: "A request is approved by everyone the file names for its amount and team before it becomes an order.",
    },
    {
      label: "Matching",
      text: "An invoice is paid only when it matches the order and what was received.",
    },
    {
      label: "Budget",
      text: "A request over its budget's remaining amount needs finance's approval too.",
    },
  ],
  inputs: [
    {
      name: "Suppliers",
      how: "Imported from CSV or added by hand.",
    },
    {
      name: "Email",
      how: "Orders are sent through Mail.",
    },
  ],
  screens: [
    {
      page: "requests",
      title: "Requests",
      shows: "Requests waiting for approval.",
    },
    {
      page: "order",
      title: "Order",
      shows: "One order with its deliveries and invoice.",
    },
  ],
  worksWith: [
    {
      id: "inventory",
      how: "Received goods enter the stock.",
    },
    {
      id: "assets",
      how: "Hardware becomes an asset on arrival.",
    },
    {
      id: "contracts",
      how: "Supplier contracts and their terms.",
    },
    {
      id: "invoices",
      how: "Supplier invoices are checked here before payment.",
    },
  ],
  limits: ["Planned: not built yet.", "Tenders and supplier bidding are out of scope.", "Payments are made from your bank; Purchasing prepares the list."],
};
