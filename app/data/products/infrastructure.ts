import type { ProductStory } from "./types";

export const infrastructure: ProductStory = {
  problem: {
    title: "What every server, container and cluster is running, and what changed",
    headline: "What runs where should not live in people's memory",
    text: "When something breaks or a host is compromised, the first questions are always the same: what runs there, who can log in, which ports are open, what changed since yesterday. The answers are spread over SSH sessions, spreadsheets and people's memory, and usually out of date. Infrastructure reads every host and cluster on a schedule, keeps a complete picture of each, and records every change with its time, without installing anything on the hosts.",
    example:
      "On Monday a port opens on a database server that never listened on it. Infrastructure's Changes shows it appeared at 03:12, with the process behind it and a new cron entry that started at the same time. Before anyone had to log in, the team knew which host, which process and when.",
  },
  who: [
    "System and platform teams, who run the hosts and clusters",
    "The security team, who check accounts, sudo rules, SSH keys and open ports",
    "Anyone answering an auditor's question about what runs where",
  ],
  glance: [
    {
      label: "Reads",
      value: "Hosts, BMCs, containers, clusters",
    },
    {
      label: "How",
      value: "SSH, Redfish and the Kubernetes API",
    },
    {
      label: "Keeps",
      value: "Every change, with its time",
    },
    {
      label: "On your hosts",
      value: "Nothing installed",
    },
  ],
  flow: [
    {
      label: "The hosts file",
      detail: "The install lists its servers and their BMCs in one file, shared with Logs and SIEM; clusters are added with a read-only token.",
    },
    {
      label: "infra-agent reads",
      detail:
        "One agent per network signs 5-minute SSH certificates for the openasy account and runs its built-in, read-only script, and reads BMCs over Redfish with GET only.",
    },
    {
      label: "Compared with last time",
      detail: "Every collection is compared with the last one; what was added, removed or changed is kept with its time.",
    },
    {
      label: "One picture per host",
      detail: "Each host and cluster in detail, a list of changes, and packages sent on to Vulnerabilities.",
    },
  ],
  checks: [
    {
      title: "System",
      items: ["Operating system, kernel, CPU, memory, uptime and reboots", "Virtualization or hardware, serial number"],
    },
    {
      title: "Running",
      items: ["Processes with their user and command", "Listening ports and the process behind each", "systemd services and timers, cron"],
    },
    {
      title: "Access",
      items: [
        "Accounts and groups, whether each has a password or is locked (never the hash)",
        "sudo rules, SSH keys that may log in and the SSH server's settings",
      ],
    },
    {
      title: "Software",
      items: ["Packages from dpkg, rpm or apk, with the source package", "Kernel modules, security sysctls and firewall rules"],
    },
    {
      title: "Storage and network",
      items: ["File systems and their usage, disks", "Interfaces, addresses, routes and DNS"],
    },
    {
      title: "Hardware, through the BMC",
      items: [
        "iDRAC, iLO, XClarity and other Redfish BMCs: model, serial and service tag, BIOS and every firmware version",
        "Health of power supplies, fans, temperatures, RAID controllers and drives, power state and the hardware event log",
        "Who may sign in to the BMC and with which role, and which services it opens, such as IPMI over LAN",
        "Each host matched with its BMC by SMBIOS UUID and serial, and its reboots next to what the BMC logged around them",
      ],
    },
    {
      title: "Containers and Kubernetes",
      items: [
        "Docker and Podman: image and digest, state, health, restarts, ports, mounts, limits, privileged",
        "Kubernetes: nodes, workloads, pods and restarts, services, ingresses, volumes, who is cluster-admin, recent warnings",
      ],
    },
  ],
  decides: [
    {
      label: "Change",
      text: "A change is something added, removed or changed between two collections: a package version, a new account, a port that opened, an image that changed.",
    },
    {
      label: "Noise",
      text: "Values that move all the time, such as CPU and free memory, are not changes; a collection that changed nothing stores nothing new.",
    },
    {
      label: "Masked",
      text: "Values that look like secrets are masked before they are stored: environment variables are kept by name only, passwords and tokens in command lines become ***.",
    },
    {
      label: "Host keys",
      text: "A host whose SSH host key changes is not read again until an admin accepts the new key.",
    },
    {
      label: "BMC certificates",
      text: "The agent sends a BMC's password only to the certificate an admin accepted or the hosts file names; a new certificate stops collection until it is checked.",
    },
  ],
  inputs: [
    {
      name: "SSH",
      how: "infra-agent reads each host as the unprivileged openasy account, with certificates that last 5 minutes.",
    },
    {
      name: "sudo rules",
      how: "Optional, for what only root can read, such as every account's SSH keys; the setup page writes them.",
    },
    {
      name: "Redfish",
      how: "infra-agent reads each BMC with a ReadOnly account, GET requests only; its password is a file in the agent's key folder.",
    },
    {
      name: "Kubernetes API",
      how: "A read-only service account token per cluster.",
    },
    {
      name: "The hosts file",
      how: "OPENASY_HOSTS: name, address, port, user and options for each host, and the BMCs under bmcs:.",
    },
  ],
  screens: [
    {
      page: "overview",
      title: "Overview",
      shows: "Hosts by status, recent changes, and the hosts and containers that need a look.",
    },
    {
      page: "hosts",
      title: "Hosts",
      shows: "Every host with its operating system, uptime, last collection and open ports.",
      story: "hosts",
    },
    {
      page: "containers",
      title: "Containers",
      shows: "Every container on every host, its image, state, health and restarts.",
      story: "containers",
    },
    {
      page: "changes",
      title: "Changes",
      shows: "What changed on which host and when: packages, accounts, ports, services, images.",
    },
  ],
  worksWith: [
    {
      id: "vulnerabilities",
      how: "Sends each host's packages as an SBOM, so the hosts it reads need no vulns-agent.",
    },
    {
      id: "logs",
      how: "Reads the same hosts file; a host in Logs links to its page here.",
    },
    {
      id: "siem",
      how: "Reads the same hosts file for the security events siem-agent collects.",
    },
    {
      id: "identity",
      how: "People sign in with Identity or any OpenID Connect provider.",
    },
  ],
  limits: [
    "Nothing is installed on the hosts, and Infrastructure holds no SSH key and sends no commands: a compromised product cannot run commands on them.",
    "Without the sudo rules it reads only what the openasy account may read, and the page says what was not readable.",
    "It reads; it does not change hosts or BMCs, or deploy anything. The agent has no way to send anything but GET to a BMC.",
    "Windows and cloud accounts are not read yet.",
  ],
};
