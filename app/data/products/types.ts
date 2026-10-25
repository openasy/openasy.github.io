// What a product is for and how it works, for its page on the site. status.ts says how far it is built; this says what
// it does. No React or @openasy/ui imports here, like goals.ts.

/** A fact at a glance: a short label and its value. */
export interface Fact {
  label: string;
  value: string;
}

/** One rule of how a product decides, under a short label such as Severity. */
export interface Rule {
  label: string;
  text: string;
}

/** One step from where the data comes from to where people see the result. */
export interface FlowStep {
  label: string;
  detail: string;
}

/** A group of things the product looks for, such as the rules for one kind of flaw. */
export interface CheckGroup {
  title: string;
  items: string[];
}

/** A tool or format the product takes, and how. */
export interface Input {
  name: string;
  url?: string;
  how: string;
}

/** A screen of the product: its screenshots are public/screens/<product>/<page>-{light,dark}.webp. */
export interface Screen {
  page: string;
  title: string;
  shows: string;
  /** The story in the @openasy/ui Storybook, such as "findings" for products-sast--findings. */
  story?: string;
  /** Where the screen is in the product, /<page> unless set. */
  path?: string;
  /** A page whose first link to this path opens the screen, for a screen of one record, such as a scan. */
  from?: string;
}

/** Another OpenAsy product, and what passes between the two. */
export interface Link {
  id: string;
  how: string;
}

export interface ProductStory {
  problem: {
    /** The problem in one line: the page's main heading. */
    title: string;
    /** The problem as a short claim, the heading of the problem section. */
    headline: string;
    text: string;
    /** The problem as it happens to a team. */
    example?: string;
  };
  /** Whose work it is. */
  who: string[];
  /** Four facts under the page's heading, such as what it reads and what it runs on. */
  glance: Fact[];
  flow: FlowStep[];
  checks: CheckGroup[];
  /** What makes a finding, its severity, and when a check fails, each under a short label. */
  decides: Rule[];
  inputs: Input[];
  screens: Screen[];
  worksWith: Link[];
  /** What it does not do, so nobody expects it. */
  limits: string[];
}
