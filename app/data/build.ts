/**
 * How OpenAsy is built, as the home page and /principles say it. Each practice is one that the repositories show today,
 * with the record or file that shows it; what is not in place yet is listed too, so neither page claims more.
 */

const ADR = "https://github.com/openasy/openasy.github.io/blob/main/docs/decisions/";

export const CLAUDE_CODE =
  "We use Claude Code as part of our development workflow. We remain responsible for the software we ship, its maintenance, and clearly communicating what it can and cannot do.";

export const CLAUDE_CODE_DETAIL =
  "Claude Code writes and changes code with us, and runs the same checks we do before a change is committed. It is a tool in our workflow, not a review, an audit or a guarantee of quality: the checks below are what each change has to pass, whoever wrote it.";

export interface Practice {
  title: string;
  text: string;
  source: { label: string; href: string };
}

export const PRACTICES: Practice[] = [
  {
    title: "Checks on every change",
    text: "Each repository runs type checks, lint, formatting and its tests in CI on every push. Some products also run end-to-end tests against the real server they use, such as a real OpenVPN client for VPN and a running Stalwart for Mail.",
    source: { label: "ADR 0029, testing and quality gates", href: `${ADR}0029-testing-and-quality-gates.md` },
  },
  {
    title: "Signed releases",
    text: "Releases are cut from a tag on main. Each product image is signed with cosign and carries an SBOM and SLSA provenance, so you can check what you run.",
    source: { label: "ADR 0027, build integrity", href: `${ADR}0027-reproducible-builds.md` },
  },
  {
    title: "Dependencies kept current",
    text: "An update bot opens a pull request for each new version of a dependency, base image or CI action, and CI decides whether it goes in.",
    source: { label: "ADR 0009, latest libraries", href: `${ADR}0009-latest-libraries.md` },
  },
  {
    title: "Open-source parts named",
    text: "Where a product runs on another open-source project, such as Stalwart for Mail or OpenCloud for Files, its page names the project and the role it plays.",
    source: { label: "ADR 0008, open source", href: `${ADR}0008-open-source.md` },
  },
  {
    title: "Limits written down",
    text: "Each product page lists what is not built yet, and each design decision says how much of it ships today.",
    source: { label: "The design decisions", href: "https://github.com/openasy/openasy.github.io/tree/main/docs/decisions" },
  },
];

/** What is not in place, said as plainly as what is. */
export const NOT_YET = [
  "No independent security audit has been done.",
  "Changes are not reviewed by a second person before they are merged.",
  "Upgrade, migration and restore tests are not built yet.",
  "Container images are not scanned for vulnerabilities in CI, and builds are not checked for reproducibility yet.",
];
