import type { ProductStory } from "./types";

export const endpoints: ProductStory = {
  problem: {
    title: "Every laptop and workstation: encrypted, updated and running what it should",
    headline: "A lost laptop should not be a breach",
    text: "Laptops leave the office, sit in cafés and get lost. An unencrypted disk or a year-old operating system turns a lost laptop into a breach. Endpoints will keep an inventory of every laptop and workstation with osquery, check that disks are encrypted, updates installed and a screen lock set, and list the software on each.",
    example:
      "A laptop is reported stolen. Endpoints shows its disk was encrypted with FileVault and its last check-in was two hours earlier, so the data is safe; its VPN device is revoked as well.",
  },
  who: ["IT, who manage the fleet", "The security team, who check posture before granting access"],
  glance: [
    {
      label: "Reads",
      value: "Laptops and workstations",
    },
    {
      label: "With",
      value: "osquery",
    },
    {
      label: "Checks",
      value: "Encryption, updates, lock",
    },
    {
      label: "Lists",
      value: "Installed software",
    },
  ],
  flow: [
    {
      label: "osquery on each device",
      detail: "A small agent on macOS, Windows and Linux answers queries about the device.",
    },
    {
      label: "Inventory",
      detail: "Hardware, operating system, users and installed software.",
    },
    {
      label: "Compliance",
      detail: "Encryption, updates, firewall and screen lock against your policies.",
    },
    {
      label: "Shown",
      detail: "Which devices comply, which do not, and why.",
    },
  ],
  checks: [
    {
      title: "Posture",
      items: ["Disk encryption: FileVault, BitLocker, LUKS", "Operating system updates", "Firewall and screen lock"],
    },
    {
      title: "Inventory",
      items: ["Hardware and serial numbers", "Installed software and versions", "Users"],
    },
  ],
  decides: [
    {
      label: "Compliant",
      text: "A device complies when every policy it falls under passes.",
    },
    {
      label: "Stale",
      text: "A device that stops checking in is stale.",
    },
  ],
  inputs: [
    {
      name: "osquery",
      url: "https://osquery.io/",
      how: "An agent on each device, the one thing installed on laptops.",
    },
  ],
  screens: [
    {
      page: "devices",
      title: "Devices",
      shows: "Every device, its owner, operating system and compliance.",
      story: "devices",
    },
    {
      page: "compliance",
      title: "Compliance",
      shows: "Which policies each device fails.",
      story: "compliance",
    },
    {
      page: "software",
      title: "Software",
      shows: "Every application installed, and where.",
      story: "software-inventory",
    },
  ],
  worksWith: [
    {
      id: "vpn",
      how: "Revoke the VPN device of a lost laptop.",
    },
    {
      id: "identity",
      how: "Who uses each device.",
    },
    {
      id: "incidents",
      how: "Which laptop someone used, during an incident.",
    },
  ],
  limits: ["Laptops need the osquery agent: unlike servers, they cannot be read over SSH.", "It reports; it does not manage or wipe devices."],
};
