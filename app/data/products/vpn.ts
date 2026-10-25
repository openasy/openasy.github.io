import type { ProductStory } from "./types";

export const vpn: ProductStory = {
  problem: {
    title: "Remote access where each person reaches only the networks they need",
    headline: "One stolen laptop should not open everything",
    text: "A VPN that lets every employee reach every server turns one stolen laptop into access to everything. OpenVPN can do much better, but its certificates, client files and firewall rules are hand work that drifts. VPN manages it for you: one certificate per device, groups that reach only the networks and ports you allow, who is connected right now, and a lost laptop cut off within seconds.",
    example:
      "Backend engineers may reach the production databases on port 5432 and nothing else. Dana joins, gets a laptop file that connects to the nearest of three locations and routes only that network. When her laptop is stolen, an admin revokes the device and it is disconnected within 15 seconds; her phone keeps working.",
  },
  who: [
    "IT and platform teams, who give and take access",
    "Everyone who connects, with a file for each device",
    "The security team, who see who is connected and to where",
  ],
  glance: [
    {
      label: "Runs",
      value: "OpenVPN, on your servers",
    },
    {
      label: "Access",
      value: "Per group, per network and port",
    },
    {
      label: "Revoked devices",
      value: "Cut off in 15 seconds",
    },
    {
      label: "Locations",
      value: "Several, with failover",
    },
  ],
  flow: [
    {
      label: "People and groups",
      detail: "Groups, IP groups with the networks and ports they may reach, people and their devices.",
    },
    {
      label: "A file per device",
      detail: "VPN issues one certificate and a fixed address per device; the .ovpn file downloads once.",
    },
    {
      label: "vpn-server applies it",
      detail: "Each OpenVPN server pulls its config over HTTPS and lets each device reach only its networks and ports.",
    },
    {
      label: "Who is connected",
      detail: "Servers report live sessions every 15 seconds; a revoked device is disconnected at the next one.",
    },
  ],
  checks: [
    {
      title: "Access",
      items: [
        "Only listed devices may connect",
        "Each device gets routes to the networks its groups may use, or all traffic for a full-tunnel group",
        "The server's firewall drops everything else, including other devices and the server itself",
      ],
    },
    {
      title: "Several locations",
      items: [
        "A vpn-server at each location, each reporting its sessions",
        "A client file lists every server, so when one location is down the client connects to the next",
      ],
    },
    {
      title: "What is shown",
      items: ["Who is connected now, from where, with how much traffic", "Sessions per hour, and servers online or offline", "Certificates about to end"],
    },
  ],
  decides: [
    {
      label: "Revoking",
      text: "Revoking a device puts it on the revocation list, which OpenVPN checks on every new connection.",
    },
    {
      label: "Suspending",
      text: "Suspending a person removes all their devices until they are active again.",
    },
    {
      label: "Disconnecting",
      text: "A device that is revoked, suspended or deleted is disconnected at the next heartbeat, within 15 seconds.",
    },
  ],
  inputs: [
    {
      name: "vpn-server",
      url: "https://github.com/openasy/vpn-server",
      how: "Runs OpenVPN on each host people connect to, and takes its config from VPN.",
    },
    {
      name: "Any OpenVPN client",
      how: "The official OpenVPN Connect, Tunnelblick, the network manager on Linux and others.",
    },
    {
      name: "The command line and API",
      how: "openasy-vpn and the API add groups, people and devices from scripts.",
    },
  ],
  screens: [
    {
      page: "overview",
      title: "Overview",
      shows: "Who is connected now, sessions per hour, servers by state and certificates ending.",
    },
    {
      page: "people",
      title: "People",
      shows: "Everyone with access, their groups and devices.",
      story: "people",
    },
    {
      page: "access",
      title: "Access",
      shows: "Groups and IP groups: who may reach which networks and ports.",
      story: "ip-groups",
    },
    {
      page: "sessions",
      title: "Sessions",
      shows: "Live sessions per server, with traffic, and a way to end one.",
      story: "connections",
    },
  ],
  worksWith: [
    {
      id: "identity",
      how: "People sign in with their company account and its second factor through Identity.",
    },
    {
      id: "logs",
      how: "Keep connection logs longer and search them with everything else.",
    },
    {
      id: "backups",
      how: "Follow the backups of the VPN database and its CA.",
    },
  ],
  limits: [
    "VPN never connects to the servers: each vpn-server asks it over HTTPS.",
    "The .ovpn file holds the device's private key and is shown once; VPN does not keep it.",
    "A server added later reaches only devices added after it, so start the servers first and give locations DNS names.",
    "It is OpenVPN; WireGuard is not supported.",
  ],
};
