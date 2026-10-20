/**
 * Goal-based guides. Product ids match `PRODUCT_IDS` in @openasy/ui; a test keeps them in sync.
 * This file must not import React or @openasy/ui: react-router.config.ts reads it at build time.
 */

export interface GoalStep {
  title: string;
  body: string;
  /** Shell commands or config shown as a code block. */
  code?: string;
}

export interface Goal {
  id: string;
  title: string;
  /** How a person would say it. */
  ask: string;
  summary: string;
  /** What you can do once it is running. */
  outcomes: string[];
  /** The smallest set of products that reaches the goal. */
  required: string[];
  /** Products that make it better; each works without them. */
  recommended: Array<{ id: string; why: string }>;
  /** Goal-specific steps after the products are running and the owner has signed in. */
  steps: GoalStep[];
  /** The whole install, for a goal whose products are released: replaces the generic steps around `steps`. */
  install?: GoalStep[];
  timeToValue: string;
}

export const GOALS: Goal[] = [
  {
    id: "vpn",
    title: "Secure remote access",
    ask: "I only need a VPN for my team.",
    summary: "A manager and an OpenVPN server in two containers: each device gets its own file, and each group reaches only the networks you allow.",
    outcomes: [
      "One .ovpn file per device, with its own certificate and fixed address.",
      "Groups that reach only the networks and ports you allow. Everything else is dropped.",
      "Who is connected right now, and a way to end any session.",
      "Revoke a lost laptop and it is disconnected within 15 seconds.",
    ],
    required: ["vpn"],
    recommended: [
      { id: "identity", why: "Sign in with your company accounts and require MFA." },
      { id: "logs", why: "Keep connection logs longer and search them with everything else." },
      { id: "backups", why: "Off-site copies of the VPN database and certificates." },
    ],
    steps: [],
    install: [
      {
        title: "Start the VPN",
        body: "On a host with Docker, create the token the OpenVPN servers use and the key that encrypts sign-in secrets, and set the name or IP people connect to. Then start the manager and one OpenVPN server.",
        code: [
          "export VPN_SERVER_TOKEN=$(openssl rand -hex 32)",
          "export VPN_PUBLIC_HOST=vpn.example.com",
          "openssl rand -hex 32 > openasy-kek",
          "",
          "curl -O https://raw.githubusercontent.com/openasy/vpn/main/compose.yaml",
          "docker compose up -d",
        ].join("\n"),
      },
      {
        title: "Create the owner account",
        body: "There is no default password. Open the one-time link from the log, choose a password and add an authenticator app or a passkey. Then invite the people who manage the VPN under Members, and create an API token with the admin role under API tokens for the commands below.",
        code: 'docker compose logs vpn | grep "no owner yet"',
      },
      {
        title: "Open the VPN port",
        body: "Allow UDP 1194 to the host. TCP 443 is a second server for networks that allow only HTTPS. The UI and API stay on 127.0.0.1:8080; put a TLS proxy in front to reach them from elsewhere, and set VPN_PUBLIC_URL to its https:// address.",
      },
      {
        title: "Say who may reach what",
        body: "Create a group, then an IP group with the networks and ports it may use. Anything not listed is not routed.",
        code: [
          'API=http://localhost:8080/api/v1; AUTH="Authorization: Bearer $VPN_API_TOKEN"',
          `curl -sH "$AUTH" $API/groups -d '{"name":"Backend engineers"}'`,
          `curl -sH "$AUTH" $API/ip-groups -d '{"name":"Production databases",`,
          `  "networks":[{"cidr":"172.16.20.0/24","ports":"tcp/5432"}],`,
          `  "allowedGroups":["Backend engineers"]}'`,
        ].join("\n"),
      },
      {
        title: "Add a person and their device",
        body: "Each device gets its own .ovpn file. It holds the private key and is shown only once, so send it straight to the person.",
        code: [
          `curl -sH "$AUTH" $API/people -d '{"name":"Dana Kim","email":"dana@example.com","groups":["Backend engineers"]}'`,
          `curl -sH "$AUTH" $API/people/<person id>/devices -d '{"name":"Laptop"}' | jq -r .ovpn > dana-laptop.ovpn`,
        ].join("\n"),
      },
      {
        title: "They connect",
        body: "Dana imports the file into OpenVPN Connect (Windows, macOS, iOS, Android), Tunnelblick or NetworkManager, and connects. If the first try is refused, wait 15 seconds.",
      },
    ],
    timeToValue: "About 10 minutes",
  },
  {
    id: "compliance",
    title: "Pass an audit",
    ask: "We need ISO 27001, SOC 2 or GDPR evidence without spreadsheets.",
    summary: "Compliance maps controls to evidence collected automatically from the other products, so the audit is a report, not a project.",
    outcomes: [
      "See every control of ISO 27001, SOC 2 and GDPR with its status and owner.",
      "Evidence is attached automatically: access reviews, backups and restore tests, training records, vulnerability fixes.",
      "Export an evidence pack per framework for your auditor.",
      "Track risks and their treatments in a register.",
    ],
    required: ["compliance"],
    recommended: [
      { id: "access", why: "Just-in-time access and access reviews (ISO 27001 A.5.18, SOC 2 CC6)." },
      { id: "backups", why: "Backup and restore-test evidence (A.8.13, SOC 2 A1.2)." },
      { id: "awareness", why: "Phishing simulations and training records (A.6.3, CC2.2)." },
      { id: "risk", why: "Risk register and vendor reviews (A.5.19, CC3)." },
      { id: "vulnerabilities", why: "Proof that vulnerabilities are fixed in time (A.8.8)." },
      { id: "identity", why: "MFA and joiner-mover-leaver evidence (A.5.16)." },
    ],
    steps: [
      { title: "Pick frameworks", body: "In Compliance → Frameworks, enable the ones you are audited against. Controls shared between frameworks are only answered once." },
      { title: "Link the evidence sources", body: "In Integrations, link the OpenAsy products you run. Each one starts sending evidence for the controls it covers." },
      { title: "Assign owners", body: "Give every control an owner. Owners get a reminder when evidence is missing or about to expire." },
    ],
    timeToValue: "A day to set up; evidence builds up from then on",
  },
  {
    id: "data-loss",
    title: "Notice data loss",
    ask: "If data leaves or disappears, I want to know and get it back.",
    summary: "Backups make data recoverable; Network IDS, Deception and Secrets tell you when it is being taken.",
    outcomes: [
      "Daily backups with tested restores, and restore to any point in time.",
      "Alerts on exfiltration: DNS tunnels, large uploads, unusual egress.",
      "Canary files, keys and database users that only an intruder would touch.",
      "Leaked credentials found in code, images and public pastes.",
    ],
    required: ["backups", "network-ids"],
    recommended: [
      { id: "deception", why: "Tripwires that fire only in a real breach." },
      { id: "secrets", why: "Find credentials before someone else does." },
      { id: "cost", why: "Egress cost anomalies are often the first sign of exfiltration." },
      { id: "incidents", why: "Run the response, including the GDPR 72-hour notification clock." },
    ],
    steps: [
      { title: "Choose what to back up", body: "In Backups → Jobs, add databases, volumes and buckets. Pick a schedule and retention (default 7 daily, 4 weekly, 12 monthly)." },
      { title: "Turn on restore tests", body: "Restore tests start a copy of each backup weekly and check it. A backup that was never restored is a hope, not a backup." },
      { title: "Mirror traffic to Network IDS", body: "Send a span port or VPC traffic mirror to the sensor. Exfiltration and DNS-tunnel rules are on by default." },
    ],
    timeToValue: "About an hour",
  },
  {
    id: "who-did-what",
    title: "Know who did what, now and in the past",
    ask: "Who is on our systems right now, and what did they do last Tuesday?",
    summary: "Access records every privileged session, Identity records every sign-in, and SIEM ties them to what happened on the hosts.",
    outcomes: [
      "See every live SSH, database and RDP session and end it.",
      "Replay any session and search recordings by command.",
      "A timeline per person across sign-ins, VPN, access grants and alerts.",
      "No standing admin accounts: privileged access is requested, approved and expires.",
    ],
    required: ["access", "identity"],
    recommended: [
      { id: "siem", why: "Correlate people with what happened on hosts." },
      { id: "logs", why: "Keep the raw events for 400 days." },
      { id: "vpn", why: "Who connected from where." },
      { id: "endpoints", why: "Which laptop they used and whether it was compliant." },
    ],
    steps: [
      { title: "Connect your identity provider", body: "In Identity → Providers, connect Google Workspace, Microsoft Entra ID, Okta or LDAP, or use local accounts with MFA." },
      { title: "Add resources to Access", body: "Register hosts, databases and clusters. Access holds the credentials; people never see them." },
      { title: "Set approval policies", body: "Decide who can request what, who approves, and for how long. Production defaults to one approver and four hours." },
    ],
    timeToValue: "About 30 minutes",
  },
  {
    id: "breach",
    title: "Detect a breach",
    ask: "Would we notice an attacker, and how fast?",
    summary: "Detection at every stage of an attack, and Attack Simulation to keep proving it works.",
    outcomes: [
      "Sigma rules over all security events, correlated into signals.",
      "Process, network and file activity on every host and container.",
      "Decoys and canaries that catch lateral movement.",
      "Nightly safe attack simulations that show which stages you would miss.",
    ],
    required: ["siem", "runtime"],
    recommended: [
      { id: "network-ids", why: "Scans, C2 beacons and exfiltration on the wire." },
      { id: "deception", why: "High-signal tripwires." },
      { id: "attack-simulation", why: "Prove coverage every night with Atomic Red Team style tests." },
      { id: "incidents", why: "Turn signals into a managed response." },
      { id: "threat-intel", why: "Known-bad IPs, domains and hashes." },
    ],
    steps: [
      { title: "Install the Runtime sensor", body: "Run the eBPF sensor as a DaemonSet or a systemd service on each host.", code: "kubectl apply -f https://openasy.github.io/install/runtime-sensor.yaml" },
      { title: "Send events to SIEM", body: "Point Syslog, OpenTelemetry or the other products at SIEM. Detection rules for common attacks are enabled by default." },
      { title: "Route signals to people", body: "In SIEM → Routing, send critical signals to on-call. A detection nobody sees is not a detection." },
    ],
    timeToValue: "About an hour",
  },
  {
    id: "uptime",
    title: "Keep services up",
    ask: "We want to know about outages before our customers do.",
    summary: "Uptime checks from outside, metrics and logs from inside, alerts to the right person and a status page.",
    outcomes: [
      "HTTP, TCP, DNS and certificate checks from several regions.",
      "Dashboards and PromQL over all your metrics.",
      "Alert rules, routing and on-call schedules.",
      "Incidents with a timeline, postmortems and a public status page.",
    ],
    required: ["uptime", "alerts"],
    recommended: [
      { id: "metrics", why: "See the cause, not only the symptom." },
      { id: "logs", why: "Search what happened around the alert." },
      { id: "traces", why: "Find the slow service in a request." },
      { id: "incidents", why: "Coordinate the response and keep customers informed." },
    ],
    steps: [
      { title: "Add checks", body: "In Uptime, add the URLs and ports customers depend on. Certificates are checked automatically." },
      { title: "Set up on-call", body: "In Alerts → On-call, add a rotation and connect email, Slack, Teams or a phone provider." },
    ],
    timeToValue: "About 15 minutes",
  },
  {
    id: "secure-code",
    title: "Ship secure code",
    ask: "Stop vulnerabilities and secrets before they reach production.",
    summary: "Checks on every pull request, every dependency and every image, with admission control so only verified images run.",
    outcomes: [
      "Static analysis and secret scanning on every pull request.",
      "Dependency advisories for npm, pip, Go, Cargo and Composer.",
      "Signed images with SBOMs and provenance, verified at admission.",
      "Dynamic scans of running applications.",
    ],
    required: ["sast", "secrets"],
    recommended: [
      { id: "audit", why: "Vulnerable dependencies, with fix versions." },
      { id: "supply-chain", why: "Only signed images from your builds may run." },
      { id: "dast", why: "Find what only shows up at runtime." },
      { id: "waf", why: "Virtual patches until the code is fixed." },
    ],
    steps: [
      { title: "Install the GitHub or GitLab app", body: "Pick the repositories to protect. Findings appear as pull request comments; push protection blocks verified secrets." },
      { title: "Add the CI step", body: "Sign images and attach SBOMs in your release workflow.", code: "- uses: openasy/supply-chain-action@v1\n  with:\n    image: ghcr.io/acme/api:${{ github.ref_name }}" },
    ],
    timeToValue: "About 20 minutes",
  },
  {
    id: "cost",
    title: "Control cloud spend",
    ask: "Why did the bill go up, and what can we cut?",
    summary: "Spend by team, budgets with forecasts, anomaly alerts and rightsizing recommendations.",
    outcomes: [
      "Daily spend by service, team tag and account.",
      "Budgets per team with forecast alerts.",
      "Anomalies explained down to the resource that caused them.",
      "Savings recommendations from real utilisation.",
    ],
    required: ["cost"],
    recommended: [
      { id: "metrics", why: "Utilisation data for better rightsizing." },
      { id: "infrastructure", why: "Map spend to hosts and clusters." },
    ],
    steps: [
      { title: "Connect billing exports", body: "Give Cost read-only access to the AWS, Azure or GCP billing export. Nothing else is needed." },
      { title: "Tag by team", body: "Cost groups spend by the team tag. Untagged spend is listed so it can be chased down." },
    ],
    timeToValue: "Data appears within a day",
  },
];

export const goalById = (id: string | undefined) => GOALS.find((g) => g.id === id);

/** Goals in which a product is required or recommended. */
export const goalsForProduct = (id: string) => GOALS.filter((g) => g.required.includes(id) || g.recommended.some((r) => r.id === id));
