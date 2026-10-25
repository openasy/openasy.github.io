import type { ProductStory } from "./types";

export const cost: ProductStory = {
  problem: {
    title: "Who spends what in the cloud, against budgets, with spikes caught the next day",
    headline: "The cloud bill arrives after the money is spent",
    text: "Cloud bills arrive as one number at the end of the month, by which time a forgotten test cluster or a runaway query has already cost thousands. Teams do not see their own spend, and nobody owns the part without tags. Cost takes the bill from your pipeline every day, splits it by team and tag, compares it with budgets and a forecast, and flags a day that cost far more than usual.",
    example:
      "On Tuesday the data team's BigQuery spend is five times its usual day. On Wednesday Cost shows an anomaly for that service and account, and the team's budget forecast jumps past 100%. They find a scheduled query without a partition filter, fix it, and mark the anomaly acknowledged.",
  },
  who: ["Engineering leads, who see their team's spend", "Finance and FinOps, who set budgets and follow the forecast"],
  glance: [
    {
      label: "Takes",
      value: "Daily spend from any cloud",
    },
    {
      label: "Splits by",
      value: "Team, service, tag",
    },
    {
      label: "Watches",
      value: "Budgets and forecasts",
    },
    {
      label: "Catches",
      value: "Spikes the next day",
    },
  ],
  flow: [
    {
      label: "The bill",
      detail: "A pipeline sends daily spend lines from AWS Cost Explorer, a GCP or Azure export, or any CSV.",
    },
    {
      label: "Who spent it",
      detail: "A team tag, or the first rule that matches the account, service or another tag; the rest is unowned.",
    },
    {
      label: "Budgets and forecast",
      detail: "Monthly budgets per team or tag, burn rate, and the month's forecast.",
    },
    {
      label: "Anomalies",
      detail: "A day of one service in one account that cost far more than the two weeks before it.",
    },
  ],
  checks: [
    {
      title: "Spend",
      items: [
        "By team, service, account, region and tag",
        "Spend nobody owns yet, so tagging can catch up",
        "Several currencies, at rates an admin sets for the reporting currency",
      ],
    },
    {
      title: "Budgets",
      items: ["A monthly amount per team or tag value", "Burn rate: above 1 runs out early", "States at 50%, 80% and 100%"],
    },
  ],
  decides: [
    {
      label: "Forecast",
      text: "The forecast is the spend so far plus the last seven days' daily rate for the days left in the month.",
    },
    {
      label: "Anomaly",
      text: "An anomaly is a day that cost more than the 14-day mean plus three standard deviations, and by more than the minimum you set, 50 by default.",
    },
    {
      label: "Sending again",
      text: "Sending the same days again replaces them, so a daily job can send the whole month each time.",
    },
    {
      label: "Precision",
      text: "Amounts are kept as millionths, so sums do not drift; credits are negative.",
    },
  ],
  inputs: [
    {
      name: "AWS Cost Explorer",
      how: "aws ce get-cost-and-usage, turned into lines by a small script in the repository.",
    },
    {
      name: "GCP and Azure exports",
      how: "Their billing exports as CSV.",
    },
    {
      name: "Any CSV, JSON or NDJSON",
      how: "One line per day, provider, account and service, with tags as columns.",
    },
  ],
  screens: [
    {
      page: "overview",
      title: "Overview",
      shows: "This month's spend and forecast, budgets by state, spend by team, and anomalies.",
    },
    {
      page: "spend",
      title: "Spend",
      shows: "Spend by team, service, account or tag over any period.",
      story: "explorer",
    },
    {
      page: "budgets",
      title: "Budgets",
      shows: "Each budget, what is spent, its burn rate and state.",
      story: "budgets",
    },
    {
      page: "anomalies",
      title: "Anomalies",
      shows: "Days that cost far more than usual, to acknowledge or mark expected.",
      story: "anomalies",
    },
  ],
  worksWith: [
    {
      id: "infrastructure",
      how: "Infrastructure shows what runs on the hosts and clusters you pay for.",
    },
    {
      id: "identity",
      how: "People sign in with Identity or any OpenID Connect provider.",
    },
  ],
  limits: [
    "It holds no cloud credentials and calls no cloud API: a pipeline sends the bill.",
    "It shows where money goes; it does not resize or switch off anything.",
    "Spend is daily: an anomaly shows the day after the bill has it.",
  ],
};
