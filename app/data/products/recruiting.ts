import type { ProductStory } from "./types";

export const recruiting: ProductStory = {
  problem: {
    title: "Job posts, applications and interviews in one pipeline",
    headline: "Candidates are lost in an inbox",
    text: "CVs arrive by email, interview notes are in someone's notebook, and a good candidate waits three weeks for an answer. Recruiting puts each opening, its applications and its interviews in one pipeline, with a careers page, scorecards and the candidate's data deleted when the law says it must be.",
    example:
      "A backend opening gets 80 applications from the careers page. Recruiting moves 12 to Interview; the interviewer books slots through Calendar with a Meet link, fills in the scorecard, and the hired candidate becomes an employee in HR with one click.",
  },
  who: ["HR and recruiters, who run hiring", "Hiring managers and interviewers"],
  glance: [
    {
      label: "Pipeline",
      value: "Stages set in a file",
    },
    {
      label: "Applies through",
      value: "A careers page",
    },
    {
      label: "Interviews",
      value: "With Calendar and Meet",
    },
    {
      label: "Hired",
      value: "Straight into HR",
    },
  ],
  flow: [
    {
      label: "Open",
      detail: "An opening with its description, team and stages.",
    },
    {
      label: "Apply",
      detail: "Candidates apply on the careers page, with their consent to keep their data.",
    },
    {
      label: "Interview",
      detail: "Slots through Calendar, a Meet link, and a scorecard per interviewer.",
    },
    {
      label: "Decide",
      detail: "An offer, a polite no, or HR for the one who is hired.",
    },
  ],
  checks: [
    {
      title: "Hiring",
      items: ["Openings and a careers page", "Applications through stages", "Scorecards and interview notes"],
    },
    {
      title: "Candidates' data",
      items: ["Consent recorded with the application", "Deleted after the period in the file", "A candidate's data on request"],
    },
  ],
  decides: [
    {
      label: "Stages",
      text: "Each opening's stages come from a template in the file.",
    },
    {
      label: "Deleting",
      text: "A candidate who was not hired is deleted after the period the file sets, unless they agreed to be kept for later openings.",
    },
    {
      label: "Fairness",
      text: "Scorecards are hidden from other interviewers until they submit their own.",
    },
  ],
  inputs: [
    {
      name: "Careers page",
      how: "A page of its own, or one script tag on your site.",
    },
    {
      name: "Email",
      how: "Applications sent to a jobs address, through Mail.",
    },
  ],
  screens: [
    {
      page: "pipeline",
      title: "Pipeline",
      shows: "An opening's candidates by stage.",
    },
    {
      page: "candidate",
      title: "Candidate",
      shows: "One candidate with their CV, interviews and scorecards.",
    },
  ],
  worksWith: [
    {
      id: "hr",
      how: "A hired candidate becomes an employee.",
    },
    {
      id: "calendar",
      how: "Interviews are booked in Calendar.",
    },
    {
      id: "meet",
      how: "Interviews get a Meet link.",
    },
    {
      id: "consent",
      how: "Consent to keep a candidate's data is recorded.",
    },
  ],
  limits: ["Planned: not built yet.", "Posting to job boards is done by hand or by their own import.", "Assessments and tests are out of scope."],
};
