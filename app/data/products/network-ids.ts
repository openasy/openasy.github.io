import type { ProductStory } from "./types";

export const networkIds: ProductStory = {
  problem: {
    title: "Attacks seen on the wire: scans, command and control, and data leaving",
    headline: "Some attacks only show on the wire",
    text: "Some attacks leave no trace on a host you watch: a scan from a compromised printer, malware calling home every 60 seconds, a database dump sent out over DNS. They show in network traffic. Network IDS will run Suricata and Zeek on a copy of your traffic, raise alerts for known attack patterns, and keep flow and protocol logs to look back at.",
    example:
      "A workstation sends a small HTTPS request to the same unknown domain every minute, day and night. Suricata matches a known command and control pattern; the flow logs show it started two days ago, right after a phishing email.",
  },
  who: ["The security team, who investigate network alerts", "Network teams, who place the sensors"],
  glance: [
    {
      label: "Watches",
      value: "A copy of your traffic",
    },
    {
      label: "Engines",
      value: "Suricata and Zeek",
    },
    {
      label: "Finds",
      value: "Scans, C2, exfiltration",
    },
    {
      label: "Keeps",
      value: "Flows and protocol logs",
    },
  ],
  flow: [
    {
      label: "A copy of the traffic",
      detail: "From a mirror port or a tap, to a sensor.",
    },
    {
      label: "Suricata and Zeek",
      detail: "Signatures for known attacks, and logs of every flow and protocol.",
    },
    {
      label: "Alerts and logs",
      detail: "Kept and searchable, with the flows around each alert.",
    },
    {
      label: "Investigated",
      detail: "Alerts sent on as signals; packet captures on demand.",
    },
  ],
  checks: [
    {
      title: "Detection",
      items: ["Suricata signatures, such as Emerging Threats rules", "Scans, command and control beacons, exfiltration"],
    },
    {
      title: "Logs",
      items: ["Flows: who talked to whom, how much", "Protocols: DNS, HTTP, TLS and others, from Zeek", "Packet captures for an alert"],
    },
  ],
  decides: [
    {
      label: "Alert",
      text: "An alert is a signature that matched traffic.",
    },
    {
      label: "Retention",
      text: "Flows and protocol logs are kept for the retention you set.",
    },
  ],
  inputs: [
    {
      name: "Suricata",
      url: "https://suricata.io/",
      how: "Signature detection on the sensor.",
    },
    {
      name: "Zeek",
      url: "https://zeek.org/",
      how: "Flow and protocol logs.",
    },
  ],
  screens: [
    {
      page: "alerts",
      title: "Alerts",
      shows: "Every alert with its signature, hosts and flows.",
      story: "alerts",
    },
    {
      page: "flows",
      title: "Flows",
      shows: "Who talked to whom, when and how much.",
      story: "flows",
    },
    {
      page: "sensors",
      title: "Sensors",
      shows: "Each sensor, where it listens and its health.",
      story: "sensors",
    },
  ],
  worksWith: [
    {
      id: "siem",
      how: "Alerts become signals among the other security events.",
    },
    {
      id: "threat-intel",
      how: "Addresses and domains checked against known bad ones.",
    },
  ],
  limits: ["It needs a sensor that sees a copy of the traffic.", "Encrypted traffic shows its metadata, not its content."],
};
