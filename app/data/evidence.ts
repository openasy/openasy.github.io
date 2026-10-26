/**
 * What the design decisions rest on. Each claim names the decisions it backs, the sources, what they show and how
 * strong they are; a decision with no source is listed as our own judgment, so nothing passes for more than it is.
 * Every quote was read in the source itself.
 */

export type Grade = "Research" | "Standard" | "Law" | "Practice" | "Vendor";

/** What each grade means, strongest first. */
export const GRADES: Record<Grade, string> = {
  Research: "Peer-reviewed studies or measurements",
  Standard: "Standards and official guidance",
  Law: "Regulation the products help you meet",
  Practice: "Published experience of teams that run this at scale",
  Vendor: "Figures from the maker of a tool, not checked by others",
};

/** The badge tone of each grade on the site. */
export const GRADE_TONE: Record<Grade, "success" | "info" | "neutral" | "warning"> = {
  Research: "success",
  Standard: "info",
  Law: "info",
  Practice: "neutral",
  Vendor: "warning",
};

export interface Source {
  title: string;
  by: string;
  /** Left out for a page that is kept up to date. */
  year?: number;
  url: string;
}

export interface Claim {
  id: string;
  /** The decisions it backs, as in docs/decisions. */
  adrs: string[];
  claim: string;
  shows: string;
  grade: Grade;
  sources: Source[];
}

export const CLAIMS: Claim[] = [
  {
    id: "new-findings",
    adrs: ["0036", "0044"],
    claim: "A pull request is blocked only by what it adds, and findings are shown where the change is reviewed.",
    shows:
      "Google shows analysis results in code review, only for edited files or lines, and keeps a check only while fewer than 10% of its findings are ignored; across its checks that share is just below 5%.",
    grade: "Practice",
    sources: [
      {
        title: "Software Engineering at Google, chapter 20: Static Analysis",
        by: "Caitlin Sadowski (Google, O'Reilly)",
        year: 2020,
        url: "https://abseil.io/resources/swe-book/html/ch20.html",
      },
    ],
  },
  {
    id: "one-signal",
    adrs: ["0040"],
    claim: "SIEM groups matches into one signal per rule and host instead of one alert per line.",
    shows:
      "Analysts in security operations centres reported many false positives that each need checking by hand, a tedious task that can cause alarm burnout and eventually desensitization.",
    grade: "Research",
    sources: [
      {
        title: "99% False Positives: A Qualitative Study of SOC Analysts' Perspectives on Security Alarms",
        by: "Bushra A. Alahmadi, Louise Axon and Ivan Martinovic (USENIX Security)",
        year: 2022,
        url: "https://www.usenix.org/conference/usenixsecurity22/presentation/alahmadi",
      },
    ],
  },
  {
    id: "outside",
    adrs: ["0047", "0017"],
    claim: "Uptime checks from outside, as a user would, and every product exposes health and metrics.",
    shows:
      "Black-box monitoring tests externally visible behavior as a user would see it; latency, traffic, errors and saturation are the four golden signals, and paging is on symptoms.",
    grade: "Practice",
    sources: [
      {
        title: "Site Reliability Engineering, chapter 6: Monitoring Distributed Systems",
        by: "Rob Ewaschuk (Google, O'Reilly)",
        year: 2016,
        url: "https://sre.google/sre-book/monitoring-distributed-systems/",
      },
    ],
  },
  {
    id: "blameless",
    adrs: ["0041"],
    claim: "Incidents keeps a timeline and a postmortem about what happened, not who to blame.",
    shows: "Where people are blamed for mistakes, they stop bringing problems to light; blameless postmortems keep them reported.",
    grade: "Practice",
    sources: [
      {
        title: "Site Reliability Engineering, chapter 15: Postmortem Culture: Learning from Failure",
        by: "John Lunney and Sue Lueder (Google, O'Reilly)",
        year: 2016,
        url: "https://sre.google/sre-book/postmortem-culture/",
      },
    ],
  },
  {
    id: "passkeys",
    adrs: ["0002"],
    claim: "Two-step verification and passkeys in every product, and a group can be asked for a passkey only.",
    shows:
      "Across more than 350,000 real hijacking attempts, challenges on a device the owner holds blocked over 94% of those rooted in phishing, and questions only the owner should know as few as 10%. FIDO and WebAuthn are the widely available MFA that resists phishing.",
    grade: "Research",
    sources: [
      {
        title: "Evaluating Login Challenges as a Defense Against Account Takeover",
        by: "Periwinkle Doerfler and others (The Web Conference)",
        year: 2019,
        url: "https://research.google/pubs/evaluating-login-challenges-as-a-defense-against-account-takeover/",
      },
      {
        title: "Implementing Phishing-Resistant MFA",
        by: "CISA",
        year: 2022,
        url: "https://www.cisa.gov/sites/default/files/publications/fact-sheet-implementing-phishing-resistant-mfa-508c.pdf",
      },
    ],
  },
  {
    id: "no-default-passwords",
    adrs: ["0013"],
    claim: "No product ships with a default password.",
    shows: "CISA asks makers of software to eliminate default passwords, so that the secure way is the one customers get.",
    grade: "Standard",
    sources: [
      {
        title: "Secure by Design Alert: How Manufacturers Can Protect Customers by Eliminating Default Passwords",
        by: "CISA",
        year: 2023,
        url: "https://www.cisa.gov/news-events/alerts/2023/12/15/cisa-secure-design-alert-urges-manufacturers-eliminate-default-passwords",
      },
    ],
  },
  {
    id: "least-privilege",
    adrs: ["0003", "0022"],
    claim: "New members start as Viewers, tokens are scoped, and products run unprivileged.",
    shows:
      "Every program and every user should operate using the least set of privileges necessary to complete the job, and access should be based on permission rather than exclusion.",
    grade: "Research",
    sources: [
      {
        title: "The Protection of Information in Computer Systems",
        by: "Jerome H. Saltzer and Michael D. Schroeder (Proceedings of the IEEE)",
        year: 1975,
        url: "https://web.mit.edu/Saltzer/www/publications/protection/Basic.html",
      },
    ],
  },
  {
    id: "restore-tests",
    adrs: ["0048", "0012"],
    claim: "A backup job with no recent restore test is untested, not healthy.",
    shows: "CISA's ransomware guide says to keep offline, encrypted backups and to regularly test their availability and integrity.",
    grade: "Standard",
    sources: [{ title: "#StopRansomware Guide", by: "CISA", year: 2023, url: "https://www.cisa.gov/stopransomware/ransomware-guide" }],
  },
  {
    id: "short-certificates",
    adrs: ["0046"],
    claim: "Certificates warns before each certificate ends, once per threshold.",
    shows:
      "Browsers and certificate authorities voted without a vote against to cut the longest a TLS certificate may last from 398 days to 47, from March 2026 to March 2029.",
    grade: "Standard",
    sources: [
      {
        title: "Ballot SC-081v3: Introduce Schedule of Reducing Validity and Data Reuse Periods",
        by: "CA/Browser Forum",
        year: 2025,
        url: "https://cabforum.org/2025/04/11/ballot-sc081v3-introduce-schedule-of-reducing-validity-and-data-reuse-periods/",
      },
    ],
  },
  {
    id: "sbom",
    adrs: ["0016", "0027", "0043"],
    claim: "Every image carries an SBOM, and Supply Chain keeps the SBOMs your CI reports.",
    shows:
      "The minimum elements of an SBOM: the data fields, the automation and the practices that let it be used for vulnerabilities, inventory and licences.",
    grade: "Standard",
    sources: [
      {
        title: "The Minimum Elements For a Software Bill of Materials (SBOM)",
        by: "NTIA",
        year: 2021,
        url: "https://www.ntia.gov/report/2021/minimum-elements-software-bill-materials-sbom",
      },
    ],
  },
  {
    id: "accessibility",
    adrs: ["0005"],
    claim: "WCAG 2.2 AA, with axe on every screen in CI and checks by hand.",
    shows:
      "WCAG 2.2 is the W3C's standard. On a page built with 143 failures, no automated tool found every barrier; the maker of axe reports that it finds 57% of issues by count in its own audits.",
    grade: "Standard",
    sources: [
      { title: "WCAG 2.2 is a W3C Recommendation", by: "W3C", year: 2023, url: "https://www.w3.org/WAI/news/2023-10-05/wcag22rec" },
      {
        title: "What we found when we tested tools on the world's least-accessible webpage",
        by: "Mehmet Duran (GOV.UK)",
        year: 2017,
        url: "https://accessibility.blog.gov.uk/2017/02/24/what-we-found-when-we-tested-tools-on-the-worlds-least-accessible-webpage/",
      },
      {
        title: "Automated testing study identifies 57 percent of digital accessibility issues",
        by: "Deque",
        year: 2021,
        url: "https://www.deque.com/blog/automated-testing-study-identifies-57-percent-of-digital-accessibility-issues/",
      },
    ],
  },
  {
    id: "light-and-dark",
    adrs: ["0007"],
    claim: "Light and dark themes, following the system unless you pick one.",
    shows:
      "Dark text on a light background gave better acuity and proofreading at every age; in a later study of charts, which polarity helped differed from person to person, so both are offered.",
    grade: "Research",
    sources: [
      {
        title: "Positive display polarity is advantageous for both younger and older adults",
        by: "Cosima Piepenbrock, Susanne Mayr, Iris Mund and Axel Buchner (Ergonomics)",
        year: 2013,
        url: "https://doi.org/10.1080/00140139.2013.790485",
      },
      {
        title: "Dark Mode or Light Mode? Exploring the Impact of Contrast Polarity on Visualization Performance Between Age Groups",
        by: "Zack While and Ali Sarvghad (IEEE VIS)",
        year: 2024,
        url: "https://arxiv.org/abs/2409.10841",
      },
    ],
  },
  {
    id: "charts",
    adrs: [],
    claim: "The charts every product shares are bars and lines on a common scale; there is no pie chart.",
    shows: "People judge position and length more accurately than angle, slope or area; the ranking held when it was run again with crowd workers.",
    grade: "Research",
    sources: [
      {
        title: "Graphical Perception: Theory, Experimentation, and Application to the Development of Graphical Methods",
        by: "William S. Cleveland and Robert McGill (Journal of the American Statistical Association)",
        year: 1984,
        url: "https://www.jstor.org/stable/2288400",
      },
      {
        title: "Crowdsourcing Graphical Perception: Using Mechanical Turk to Assess Visualization Design",
        by: "Jeffrey Heer and Michael Bostock (CHI)",
        year: 2010,
        url: "https://doi.org/10.1145/1753326.1753357",
      },
    ],
  },
  {
    id: "sqlite",
    adrs: ["0011"],
    claim: "SQLite by default, one file per product.",
    shows: "A site with fewer than 100,000 hits a day should work fine with SQLite, and it has been shown to work with ten times that.",
    grade: "Vendor",
    sources: [{ title: "Appropriate Uses For SQLite", by: "SQLite", url: "https://sqlite.org/whentouse.html" }],
  },
  {
    id: "minimal-data",
    adrs: ["0015"],
    claim: "No telemetry, and only the data each product needs.",
    shows: "By default, only personal data necessary for each specific purpose is processed: how much is collected, how long it is kept and who can reach it.",
    grade: "Law",
    sources: [
      {
        title: "General Data Protection Regulation, Articles 5(1)(c) and 25",
        by: "European Union",
        year: 2016,
        url: "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
      },
    ],
  },
];

/** Decisions with no source behind them yet: our judgment, said as such. */
export const JUDGMENT = ["0001", "0010", "0014", "0018", "0019", "0028", "0031", "0052", "0055"];
