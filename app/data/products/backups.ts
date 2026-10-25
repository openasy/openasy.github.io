import type { ProductStory } from "./types";

export const backups: ProductStory = {
  problem: {
    title: "Whether your backups ran, how late they are, and whether anyone has restored one",
    headline: "A backup nobody restored is a hope",
    text: "Backups fail quietly: a cron job stops after a server move, a bucket fills up, a Kubernetes backup runs partly. Nobody notices until the day a restore is needed, and then a backup nobody ever restored turns out not to work. Backups tracks every backup job, knows how often each should run and how much data you can afford to lose, and counts restore tests as part of being healthy.",
    example:
      "The nightly restic job for the file server stops reporting after a disk change. A day and a half later Backups shows it as late, and after the 24-hour RPO as at risk. The database job is healthy but its last restore test was 40 days ago, so it shows untested until someone restores it and reports the test.",
  },
  who: ["System teams, who run the backup jobs", "Anyone answering an auditor's question about backups and restores"],
  glance: [
    {
      label: "Tracks",
      value: "restic, Velero, any script",
    },
    {
      label: "Knows",
      value: "Cadence and RPO",
    },
    {
      label: "Counts",
      value: "Restore tests",
    },
    {
      label: "Makes",
      value: "No backups itself",
    },
  ],
  flow: [
    {
      label: "Jobs",
      detail: "What makes the backups, what it backs up, where to, how often it should run and the RPO.",
    },
    {
      label: "Runs are reported",
      detail: "restic's summary, Velero's Backup resource or any script sends each finished run.",
    },
    {
      label: "Restore tests",
      detail: "Now and then someone restores, and reports whether it worked.",
    },
    {
      label: "A state per job",
      detail: "Failing, at risk, late, untested or healthy, with success rate, size and restore age.",
    },
  ],
  checks: [
    {
      title: "States",
      items: [
        "Failing: the last 2 runs failed",
        "At risk: the last backup is older than the RPO, or nothing ever succeeded",
        "Late: the last backup is older than one and a half cadences",
        "Untested: no restore test, the last one failed, or it is older than 30 days",
        "Healthy: on time, and a restore has been tested",
      ],
    },
    {
      title: "Measured",
      items: ["Success rate over 30 days", "Size of each backup over time", "Age of the last restore test"],
    },
  ],
  decides: [
    {
      label: "State",
      text: "A job is in the first state that fits, from failing to healthy.",
    },
    {
      label: "Warnings",
      text: "A run with a warning is a backup that was made.",
    },
    {
      label: "Thresholds",
      text: "The thresholds for failing and untested can be changed under Settings.",
    },
  ],
  inputs: [
    {
      name: "restic",
      url: "https://restic.net/",
      how: "The JSON summary line of restic backup, sent after each run.",
    },
    {
      name: "Velero",
      url: "https://velero.io/",
      how: "The Backup resource once its phase is final.",
    },
    {
      name: "Any script",
      how: "A run or a restore test, sent to the API.",
    },
  ],
  screens: [
    {
      page: "overview",
      title: "Overview",
      shows: "Jobs by state, success over 30 days, and the jobs that need attention.",
    },
    {
      page: "jobs",
      title: "Jobs",
      shows: "Every job with its state, last backup, size and last restore test.",
      story: "jobs",
    },
  ],
  worksWith: [
    {
      id: "infrastructure",
      how: "Infrastructure shows the hosts and clusters the jobs back up.",
    },
    {
      id: "incidents",
      how: "A failing backup of something critical is run as an incident there.",
    },
    {
      id: "identity",
      how: "People sign in with Identity or any OpenID Connect provider.",
    },
  ],
  limits: [
    "It makes no backups and restores nothing: it tracks the tools that do.",
    "It knows what the jobs report; a job that never reports shows as unknown.",
  ],
};
