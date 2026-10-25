/** First story of each product in the @openasy/ui Storybook, keyed by product name. */
export const STORYBOOK = "https://openasy.github.io/ui/";

const FIRST_STORY: Record<string, string> = {
  Access: "requests",
  Alerts: "rules",
  Assistant: "ask",
  "Attack Simulation": "coverage",
  "Attack Surface": "assets",
  Audit: "project",
  Automation: "playbooks",
  Awareness: "campaigns",
  Backups: "jobs",
  Certificates: "inventory",
  Compliance: "overview",
  Cost: "overview",
  DAST: "scans",
  Database: "overview",
  Deception: "canaries",
  Endpoints: "devices",
  Errors: "issues",
  Identity: "overview",
  Incidents: "detail",
  Infrastructure: "overview",
  Logs: "explorer",
  Malware: "detections",
  Metrics: "dashboards",
  "Network IDS": "alerts",
  Posture: "overview",
  Profiling: "profiles",
  Risk: "register",
  Runtime: "detections",
  SAST: "pull-requests",
  Secrets: "findings",
  SIEM: "signals",
  "Supply Chain": "images",
  "Threat Intel": "indicators",
  Traces: "services",
  Uptime: "checks",
  VPN: "overview",
  Vulnerabilities: "findings",
  WAF: "traffic",
};

const slug = (name: string) => name.toLowerCase().replace(/\s+/g, "-");

/** Storybook URL of a product's screens, by its display name: its first story, or the one named. */
export function storyUrl(name: string, story?: string): string {
  const first = story ?? FIRST_STORY[name];
  return first ? `${STORYBOOK}?path=/story/products-${slug(name)}--${first}` : STORYBOOK;
}
