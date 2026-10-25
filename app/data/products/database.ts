import type { ProductStory } from "./types";

export const database: ProductStory = {
  problem: {
    title: "Why the database is slow: queries, locks, replication and connections",
    headline: "Most slow applications are waiting on their database",
    text: "Most slow applications are waiting on their database: a query without an index, a lock held by a forgotten transaction, a replica minutes behind, a pool that ran out of connections. The answers are in Postgres and MySQL's own statistics, but reading them needs a DBA at the right moment. Database will collect them continuously and show the slowest queries, who blocks whom, replication lag and connection use, with query plans.",
    example:
      "The order page times out. Database shows a migration's transaction holding a lock on the orders table for 12 minutes, with 40 queries waiting behind it. The migration is stopped and the page recovers.",
  },
  who: ["Developers, who fix slow queries", "DBAs and SREs, who keep databases healthy"],
  glance: [
    {
      label: "Engines",
      value: "PostgreSQL, MySQL",
    },
    {
      label: "Watches",
      value: "Queries, locks, lag",
    },
    {
      label: "Explains",
      value: "Slow query plans",
    },
    {
      label: "Changes",
      value: "Nothing",
    },
  ],
  flow: [
    {
      label: "Statistics read",
      detail: "pg_stat_statements, the activity and lock views, and MySQL's performance schema, with a read-only account.",
    },
    {
      label: "Kept over time",
      detail: "Query timings, locks, lag and connections, sampled continuously.",
    },
    {
      label: "Explained",
      detail: "Query plans for the slow ones.",
    },
    {
      label: "Shown",
      detail: "The slowest queries, who blocks whom, replication and connection pools.",
    },
  ],
  checks: [
    {
      title: "Engines",
      items: ["PostgreSQL", "MySQL and MariaDB"],
    },
    {
      title: "What it watches",
      items: ["Slow and frequent queries", "Locks and blocking chains", "Replication lag", "Connections and pool use", "Query plans"],
    },
  ],
  decides: [
    {
      label: "Queries",
      text: "Queries are grouped by their normalized text.",
    },
    {
      label: "Blocking",
      text: "A blocking chain names the session at its head.",
    },
  ],
  inputs: [
    {
      name: "PostgreSQL statistics",
      how: "pg_stat_statements and the pg_stat views, read with a monitoring role.",
    },
    {
      name: "MySQL performance schema",
      how: "Read with a monitoring account.",
    },
  ],
  screens: [
    {
      page: "overview",
      title: "Overview",
      shows: "Each database's load, slow queries, lag and connections.",
      story: "overview",
    },
    {
      page: "queries",
      title: "Queries",
      shows: "The slowest and most frequent queries, with their timings.",
      story: "queries",
    },
    {
      page: "locks",
      title: "Locks",
      shows: "Who blocks whom, right now.",
      story: "locks",
    },
    {
      page: "explain",
      title: "Explain",
      shows: "The plan of a query, and where it spends its time.",
      story: "explain",
    },
  ],
  worksWith: [
    {
      id: "traces",
      how: "From a slow span to the query behind it.",
    },
    {
      id: "metrics",
      how: "Database statistics as time series to alert on.",
    },
  ],
  limits: ["It reads statistics; it does not change indexes or settings.", "It needs a monitoring account on each database."],
};
