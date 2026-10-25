import type { ProductStory } from "./types";

export const attackSimulation: ProductStory = {
  problem: {
    title: "Proof, every night, that your other products detect real attack techniques",
    headline: "A rule that never fired may be broken",
    text: "A rule that has never fired may be broken. The only way to know SIEM, Runtime and Network IDS would catch an attacker is to act like one, safely, and check. Attack Simulation will run MITRE ATT&CK techniques on chosen hosts, in the style of Atomic Red Team, and check whether each was detected, so gaps show before an attacker finds them.",
    example:
      "The nightly run tries credential dumping, a new cron entry and a reverse shell on a test host. SIEM and Runtime catch the first two; nothing catches the reverse shell. The gap shows on the coverage map the next morning, with the technique to write a rule for.",
  },
  who: ["The security team, who prove and improve detection", "Auditors, who ask how detection is tested"],
  glance: [
    {
      label: "Runs",
      value: "MITRE ATT&CK techniques",
    },
    {
      label: "Safely",
      value: "Harmless and cleaned up",
    },
    {
      label: "Checks",
      value: "SIEM, Runtime, Network IDS",
    },
    {
      label: "Shows",
      value: "Coverage and gaps",
    },
  ],
  flow: [
    {
      label: "Techniques chosen",
      detail: "From MITRE ATT&CK, for the hosts you allow.",
    },
    {
      label: "Run safely",
      detail: "Harmless versions of each technique, then cleaned up.",
    },
    {
      label: "Checked",
      detail: "Did SIEM, Runtime or Network IDS detect it?",
    },
    {
      label: "Coverage",
      detail: "A map of techniques detected and missed, over time.",
    },
  ],
  checks: [
    {
      title: "Techniques",
      items: ["Persistence, such as cron entries and new accounts", "Credential access", "Execution and command and control", "Discovery and lateral movement"],
    },
  ],
  decides: [
    {
      label: "Covered",
      text: "A technique is covered when a product raised a detection for it within the time allowed.",
    },
  ],
  inputs: [
    {
      name: "MITRE ATT&CK",
      url: "https://attack.mitre.org/",
      how: "The catalogue of techniques.",
    },
    {
      name: "Atomic Red Team",
      url: "https://github.com/redcanaryco/atomic-red-team",
      how: "The style of small, safe tests.",
    },
  ],
  screens: [
    {
      page: "coverage",
      title: "Coverage",
      shows: "Techniques detected and missed, on the ATT&CK matrix.",
      story: "coverage",
    },
    {
      page: "campaigns",
      title: "Campaigns",
      shows: "Each run, its hosts and techniques.",
      story: "campaigns",
    },
    {
      page: "gaps",
      title: "Gaps",
      shows: "Techniques nothing detected, with what to add.",
      story: "gaps",
    },
  ],
  worksWith: [
    {
      id: "siem",
      how: "Checks whether its rules fired.",
    },
    {
      id: "runtime",
      how: "Checks whether it detected the technique on the host.",
    },
    {
      id: "network-ids",
      how: "Checks whether it saw the traffic.",
    },
  ],
  limits: ["It runs only on hosts you choose, and only harmless versions of techniques.", "Coverage is for the techniques run, not every possible attack."],
};
