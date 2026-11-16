// Apps that run on a person's Mac rather than as a container on a server. They are not in @openasy/ui's
// PRODUCT_IDS, so the products' menus, which open in a browser, do not list them.
// No React imports here, like status.ts: the page picks each app's icon.

export type MacAppId = "database-client" | "schema";

/** In progress: built and tested, no signed build to download yet. Preview: a notarized DMG on GitHub Releases. */
export type MacAppStatus = "Preview" | "In progress";

export interface MacApp {
  id: MacAppId;
  name: string;
  status: MacAppStatus;
  /** Released version, once there is a DMG. */
  version?: string;
  repo: string;
  summary: string;
  /** The page's heading: what it is for. */
  title: string;
  lead: string;
  /** A screenshot of the app in public/screens/<id>/<page>-light.webp and -dark.webp, 1440 by 870. */
  shot?: { page: string; alt: string };
  /** What is built today, in groups. */
  features: Array<{ title: string; items: string[] }>;
  privacy: string[];
  /** How to get it before there is a download. */
  build: { text: string; code: string };
  worksWith: Array<{ name: string; to: string; how: string }>;
  limits: string[];
}

export const MAC_REQUIRES = "macOS 14 Sonoma or later";

export const MAC_APPS: MacApp[] = [
  {
    id: "database-client",
    name: "Database Client",
    status: "In progress",
    repo: "openasy/database-client",
    summary: "A native Mac app to query, browse and change PostgreSQL, Redshift, MySQL, MariaDB and SQLite, straight from your Mac.",
    title: "Query, browse and change your databases from your Mac",
    lead: "PostgreSQL, Redshift, MySQL, MariaDB and SQLite, directly or through an SSH tunnel, with TLS verified. Queries go straight from your Mac to your database: there is no OpenAsy server in between and no account.",
    shot: {
      page: "data",
      alt: "Database Client: the orders table filtered on status, with one cell changed, one row deleted and one added, waiting to be committed",
    },
    features: [
      {
        title: "Connections",
        items: [
          "PostgreSQL, Redshift, MySQL, MariaDB and SQLite",
          "SSH tunnels with Ed25519, RSA or ECDSA keys or a password, the server's fingerprint confirmed on first use",
          "TLS off, required or verified, with your own certificate authority and a client certificate",
          "One window per connection, tabs inside",
        ],
      },
      {
        title: "SQL editor",
        items: [
          "Completion from the schema: tables, aliases and columns",
          "Run the statement under the cursor, the selection or everything, and stop it",
          "The error's position underlined, several results, a JSON viewer for cells",
          "History and saved queries; EXPLAIN as a tree",
        ],
      },
      {
        title: "Changing data safely",
        items: [
          "Begin, commit and roll back, with the autocommit state shown",
          "Connections tagged production ask before a statement that changes data; a connection can be read-only",
          "Edit rows in place, see the pending changes as SQL, then commit them in one transaction or discard them",
        ],
      },
      {
        title: "Structure and more",
        items: [
          "Columns, indexes and foreign keys, applied as ALTER statements you see first",
          "Users and grants for MySQL, MariaDB, PostgreSQL and Redshift",
          "Schema compare between two connections, with each difference's risk and a script",
          "Export to CSV, JSON or SQL INSERT; import CSV into a table",
        ],
      },
    ],
    privacy: [
      "It talks only to the servers you add. No analytics, no telemetry, no account.",
      "Passwords stay in your Mac's keychain, never in the connection list or a backup.",
      "It runs in the macOS sandbox with outgoing connections only. The SSH tunnel is a channel inside the app, not an open local port.",
    ],
    build: {
      text: "Signed and notarized DMGs will be on GitHub Releases. Until then, build it with Xcode and XcodeGen; it needs macos-kit next to it.",
      code: `git clone https://github.com/openasy/macos-kit
git clone https://github.com/openasy/database-client
cd database-client
xcodegen generate
xcodebuild -project DatabaseClient.xcodeproj -scheme DatabaseClient -destination 'platform=macOS' build`,
    },
    worksWith: [
      { name: "Schema", to: "/apps/schema", how: "The same connection list, and a schema opens in Schema with one click." },
      { name: "Database", to: "/products/database", how: "The server product that watches PostgreSQL's and MySQL's performance; this app is where you query." },
    ],
    limits: ["In progress: built and tested, with no signed download yet.", "Mac only.", "SQL Server, Oracle and MongoDB are not supported."],
  },
  {
    id: "schema",
    name: "Schema",
    status: "In progress",
    repo: "openasy/schema",
    summary: "Database schemas as code: text files in git, checked against 56 rules, turned into migrations and drawn as a diagram.",
    title: "Database schemas as code, checked and turned into migrations",
    lead: "Design tables in text files you keep in git. Schema checks them against 56 rules, writes the migration from one version to the next for PostgreSQL, MySQL or SQLite, and draws them as a diagram. The engine is built and tested; the Mac app on it is being built.",
    features: [
      {
        title: "A schema language",
        items: [
          "One file per table or one for all, and comments that become documentation",
          "A project file with the dialect, and a rules file for the team",
          "An edit made on the diagram rewrites only the text it touches",
        ],
      },
      {
        title: "Checks",
        items: [
          "56 rules: naming, types, keys and indexes, normalization, reserved words, what each dialect cannot do",
          "Most come with an automatic fix",
          "A team can allow a rule on one table or column",
          "Missing foreign keys and normalization steps suggested",
        ],
      },
      {
        title: "Migrations",
        items: [
          "The difference between two versions as ordered SQL for PostgreSQL, MySQL or SQLite",
          "Data loss and table rewrites called out before you run them",
          "Versioned migration files with a checksum file",
        ],
      },
      {
        title: "In and out",
        items: [
          "Import from SQL DDL and DBML",
          "Export to DBML and a data dictionary in Markdown or HTML",
          "Sample data that is the same for the same seed",
          "Its texts in 11 languages",
        ],
      },
    ],
    privacy: [
      "Your schemas are text files in your repository; nothing is uploaded.",
      "The Mac app will read a live database through the connection list it shares with Database Client, with passwords in the keychain.",
    ],
    build: {
      text: "The engine is in Swift for the app and in TypeScript as the reference; 613 golden cases keep the two the same. Run its tests with:",
      code: `git clone https://github.com/openasy/schema
cd schema/ts && npm ci && npm run selftest
cd .. && swift test`,
    },
    worksWith: [
      { name: "Database Client", to: "/apps/database-client", how: "The same connection list, and Database Client opens a schema in Schema with one click." },
    ],
    limits: [
      "In progress: the engine is done, the Mac app is being built.",
      "PostgreSQL, MySQL and SQLite only.",
      "It writes migrations; running them in production stays with your deploy.",
    ],
  },
];

export const macApp = (id: string) => MAC_APPS.find((a) => a.id === id);
