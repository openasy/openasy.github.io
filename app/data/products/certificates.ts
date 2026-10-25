import type { ProductStory } from "./types";

export const certificates: ProductStory = {
  problem: {
    title: "Every TLS certificate you have, and the ones about to expire",
    headline: "The certificate that expires is always the forgotten one",
    text: "An expired certificate takes a site or an API down as surely as a crashed server, and it always happens to the one nobody remembered: the internal mail server, the old load balancer, the certificate copied to five machines. Certificates keeps one inventory of every certificate, from the addresses it reads itself and the files you send, says when each expires and what is wrong with it, and warns at 30, 14, 7 and 1 days.",
    example:
      "The certificate of mail.example.com, bought by hand two years ago, has 12 days left. Certificates shows it as expiring, with the three servers it was seen on, and the weekly alert lists it once for the 14-day threshold. The team renews it; the next probe sees the new one.",
  },
  who: ["System teams, who renew and deploy certificates", "The security team, who look for weak keys and signatures"],
  glance: [
    {
      label: "Inventory",
      value: "Every TLS certificate",
    },
    {
      label: "Reads",
      value: "Endpoints and sent files",
    },
    {
      label: "Warns at",
      value: "30, 14, 7 and 1 days",
    },
    {
      label: "Never takes",
      value: "A private key",
    },
  ],
  flow: [
    {
      label: "Read or sent",
      detail: "The product reads public endpoints with a TLS handshake every 6 hours; a cron or CI sends certificate files from anywhere.",
    },
    {
      label: "One inventory",
      detail: "A certificate is known by its fingerprint, so one sent from many places is one certificate with each place it was seen.",
    },
    {
      label: "State and warnings",
      detail: "Expired, critical, expiring, not yet valid or valid, and weak keys, signatures and lifetimes.",
    },
    {
      label: "Alerts",
      detail: "Each certificate is reported once for the tightest threshold it crossed, for an alert to send.",
    },
  ],
  checks: [
    {
      title: "Expiry",
      items: ["Expired, past its end", "Critical, under 7 days left", "Expiring, under 30 days by default", "Not yet valid, before its start"],
    },
    {
      title: "Warnings",
      items: [
        "Weak key: RSA under 2048 bits",
        "Weak signature: SHA-1 or MD5",
        "Wildcard: one key for every subdomain",
        "Self-signed leaf",
        "Long lifetime: a leaf valid for over 398 days",
      ],
    },
    {
      title: "Trust",
      items: ["Whether the system's roots trust the chain", "Whether it fits the name it was read from", "The chain, among the certificates seen here"],
    },
  ],
  decides: [
    {
      label: "Identity",
      text: "A certificate is known by its SHA-256 fingerprint.",
    },
    {
      label: "Alerts",
      text: "Expiry alerts fire once per threshold crossed, 30, 14, 7, 1 and 0 days by default, not again for the wider ones.",
    },
    {
      label: "Public only",
      text: "Only public addresses are probed: a name that resolves to a private address is refused, so the product cannot be used to reach your network.",
    },
  ],
  inputs: [
    {
      name: "TLS handshakes",
      how: "Every 6 hours to the https:// and tls:// entries of the endpoints file.",
    },
    {
      name: "PEM files",
      how: "Sent to POST /api/v1/certificates by a cron, CI or a collector, with where each was seen.",
    },
  ],
  screens: [
    {
      page: "overview",
      title: "Overview",
      shows: "Expired, critical and expiring counts, when certificates run out, and their warnings.",
    },
    {
      page: "certificates",
      title: "Certificates",
      shows: "Every certificate with its subject, issuer, expiry, state and where it was seen.",
      story: "inventory",
    },
    {
      page: "endpoints",
      title: "Endpoints",
      shows: "The addresses read on a schedule, from the endpoints file, and what each presented.",
    },
  ],
  worksWith: [
    {
      id: "uptime",
      how: "Reads the same endpoints file; Uptime's TLS checks fail at the same critical threshold.",
    },
    {
      id: "dast",
      how: "Reads the same endpoints file.",
    },
    {
      id: "identity",
      how: "People sign in with Identity or any OpenID Connect provider.",
    },
  ],
  limits: [
    "A private key is never accepted: a body that holds one is refused whole.",
    "It does not renew or issue certificates; it tells you which to renew.",
    "Certificates on private networks are sent by a collector there, not probed.",
  ],
};
