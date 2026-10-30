import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import { Check, ExternalLink, Minus } from "lucide-react";
import { Callout, cn } from "@openasy/ui";
import { hasScreenshot, screenshot, type ProductStory, type Screen } from "../data/products";
import { hasDesign, storyUrl } from "../data/storybook";
import { product } from "./cards";

/** The sections a story adds, for the bar under the page's heading. */
export const STORY_SECTIONS = [
  { id: "problem", title: "The problem" },
  { id: "how", title: "How it works" },
  { id: "checks", title: "What it checks" },
  { id: "decides", title: "How it decides" },
  { id: "screens", title: "Where you see it" },
  { id: "with", title: "Works with" },
  { id: "limits", title: "What it does not do" },
] as const;

type SectionId = (typeof STORY_SECTIONS)[number]["id"];
const title = (id: SectionId) => STORY_SECTIONS.find((s) => s.id === id)!.title;

/** A section of the page: its heading names it, and the bar at the top jumps to it. */
export function PageSection({
  id,
  heading,
  eyebrow,
  children,
  className,
}: {
  id: string;
  heading: ReactNode;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section aria-labelledby={`${id}-h`} id={id} className={cn("scroll-mt-16", className)}>
      {eyebrow && <p className="m-0 mb-2 text-sm font-semibold tracking-wide text-accent-text uppercase">{eyebrow}</p>}
      <h2 id={`${id}-h`} className="m-0 text-2xl font-semibold tracking-tight sm:text-3xl">
        {heading}
      </h2>
      {children}
    </section>
  );
}

/** The four facts under the page's heading. */
export function Glance({ facts }: { facts: ProductStory["glance"] }) {
  return (
    <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-px overflow-hidden rounded-xl border border-line bg-line">
      {facts.map((f) => (
        <div key={f.label} className="bg-surface px-4 py-3.5">
          <dt className="text-xs font-semibold tracking-wide text-fg-subtle uppercase">{f.label}</dt>
          <dd className="m-0 mt-1 font-semibold">{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A screen's screenshot in the theme the page is in, opening full size. */
export function Screenshot({ id, screen, className }: { id: string; screen: Screen; className?: string }) {
  const alt = `${product(id).name}, ${screen.title}: ${screen.shows}`;
  return (
    <>
      {(["light", "dark"] as const).map((theme) => (
        <a
          key={theme}
          href={screenshot(id, screen.page, theme)}
          aria-label={`${screen.title}, full size`}
          className={cn(theme === "light" ? "block dark:hidden" : "hidden dark:block", className)}
        >
          <img src={screenshot(id, screen.page, theme)} alt={alt} width={1440} height={900} loading="lazy" className="block h-auto w-full" />
        </a>
      ))}
    </>
  );
}

/** The first screen that has a screenshot, for the top of the page. */
export const heroScreen = (id: string, story: ProductStory) => story.screens.find((s) => hasScreenshot(id, s.page));

function Problem({ story }: { story: ProductStory }) {
  return (
    <PageSection id="problem" eyebrow={title("problem")} heading={story.problem.headline}>
      <div className="mt-4 flex flex-wrap gap-8">
        <div className="min-w-0 flex-[1_1_440px]">
          <p className="m-0 text-fg-muted">{story.problem.text}</p>
          <h3 className="mt-6 mb-0 text-sm font-semibold text-fg-subtle">Who uses it</h3>
          <ul aria-label="Who uses it" className="m-0 mt-2 flex list-none flex-wrap gap-2 p-0">
            {story.who.map((w) => (
              <li key={w} className="rounded-full border border-line bg-surface px-3 py-1 text-sm">
                {w}
              </li>
            ))}
          </ul>
        </div>
        {story.problem.example && (
          <figure className="m-0 min-w-0 flex-[1_1_380px] rounded-2xl border border-line bg-surface p-6">
            <figcaption className="text-xs font-semibold tracking-wide text-fg-subtle uppercase">For example</figcaption>
            <p className="mt-3 mb-0">{story.problem.example}</p>
          </figure>
        )}
      </div>
    </PageSection>
  );
}

function How({ story }: { story: ProductStory }) {
  return (
    <PageSection id="how" heading={title("how")}>
      <ol aria-label="How it works, step by step" className="m-0 mt-5 grid list-none grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-4 p-0">
        {story.flow.map((s, i) => {
          const last = i === story.flow.length - 1;
          return (
            <li key={s.label} className={cn("flex flex-col gap-2 rounded-xl border p-5", last ? "border-fg bg-fg text-canvas" : "border-line bg-surface")}>
              <span className="flex items-center gap-2.5">
                <span
                  aria-hidden
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full text-sm font-bold",
                    last ? "bg-accent text-white" : "bg-accent-soft text-accent-text",
                  )}
                >
                  {i + 1}
                </span>
                <span className="font-semibold">{s.label}</span>
              </span>
              <span className={cn("text-sm", last ? "opacity-80" : "text-fg-muted")}>{s.detail}</span>
            </li>
          );
        })}
      </ol>
      <h3 className="mt-6 mb-0 text-sm font-semibold text-fg-subtle">What it takes</h3>
      <ul aria-label="What it takes" className="m-0 mt-2 grid list-none grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3 p-0">
        {story.inputs.map((x) => (
          <li key={x.name} className="rounded-lg border border-line bg-surface px-4 py-3">
            <span className="font-semibold">{x.url ? <a href={x.url}>{x.name}</a> : x.name}</span>
            <span className="mt-0.5 block text-sm text-fg-muted">{x.how}</span>
          </li>
        ))}
      </ul>
    </PageSection>
  );
}

/** A tab per group of what the product looks for, down the side; on a narrow screen the tabs sit above the panel. */
export function CheckTabs({ story }: { story: ProductStory }) {
  const [open, setOpen] = useState(0);
  const group = story.checks[open] ?? story.checks[0]!;
  return (
    <div className="mt-5 flex flex-wrap overflow-hidden rounded-2xl border border-line bg-surface">
      <div
        role="tablist"
        aria-label="What it checks"
        aria-orientation="vertical"
        className="flex min-w-0 flex-[1_1_240px] flex-col gap-1 border-line bg-canvas p-2.5 max-sm:border-b sm:border-r"
      >
        {story.checks.map((g, i) => (
          <button
            key={g.title}
            type="button"
            role="tab"
            aria-selected={i === open}
            onClick={() => setOpen(i)}
            onKeyDown={(e) => {
              const step = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
              if (!step) return;
              e.preventDefault();
              const next = (i + step + story.checks.length) % story.checks.length;
              setOpen(next);
              (e.currentTarget.parentElement?.children[next] as HTMLElement | undefined)?.focus();
            }}
            tabIndex={i === open ? 0 : -1}
            className={cn(
              "flex items-center justify-between gap-3 rounded-lg px-3.5 py-2.5 text-left",
              i === open ? "bg-accent-soft font-semibold text-accent-text" : "text-fg-muted hover:bg-subtle hover:text-fg",
            )}
          >
            {g.title}
            <span className="font-mono text-xs">{g.items.length}</span>
          </button>
        ))}
      </div>
      <ul role="tabpanel" aria-label={group.title} className="m-0 min-w-0 flex-[999_1_480px] list-none p-0 py-1">
        {group.items.map((item) => (
          <li key={item} className="flex gap-3.5 border-subtle px-6 py-4 not-last:border-b">
            <Check aria-hidden className="mt-1 size-4 shrink-0 text-success" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Decides({ story }: { story: ProductStory }) {
  return (
    <PageSection id="decides" heading={title("decides")}>
      <dl aria-label="How it decides" className="m-0 mt-5 overflow-hidden rounded-2xl border border-line bg-surface">
        {story.decides.map((d) => (
          <div key={d.label} className="flex flex-wrap gap-x-6 gap-y-1 border-subtle px-6 py-4 not-last:border-b">
            <dt className="flex-[0_0_11rem] font-semibold">{d.label}</dt>
            <dd className="m-0 min-w-0 flex-[1_1_380px] text-fg-muted">{d.text}</dd>
          </div>
        ))}
      </dl>
    </PageSection>
  );
}

/** One screen at a time, picked from a row of pills, with its screenshot and a link to it in Storybook. */
export function ScreenTabs({ id, story }: { id: string; story: ProductStory }) {
  // Opens on the first screen that has a screenshot, so the panel is never empty at first.
  const [open, setOpen] = useState(() =>
    Math.max(
      0,
      story.screens.findIndex((s) => hasScreenshot(id, s.page)),
    ),
  );
  const screen = story.screens[open] ?? story.screens[0]!;
  const name = product(id).name;
  return (
    <>
      <div role="tablist" aria-label="Screens" className="mt-5 flex flex-wrap gap-2">
        {story.screens.map((s, i) => (
          <button
            key={s.page}
            type="button"
            role="tab"
            aria-selected={i === open}
            onClick={() => setOpen(i)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm",
              i === open ? "border-fg bg-fg font-semibold text-canvas" : "border-line bg-surface text-fg hover:border-line-strong",
            )}
          >
            {s.title}
          </button>
        ))}
      </div>
      <figure role="tabpanel" aria-label={screen.title} className="m-0 mt-4 overflow-hidden rounded-2xl border border-line bg-surface">
        {hasScreenshot(id, screen.page) && <Screenshot id={id} screen={screen} className="border-b border-line" />}
        <figcaption className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <span>
            <span className="font-semibold">{screen.title}.</span> <span className="text-fg-muted">{screen.shows}</span>
          </span>
          {screen.story && (
            <a href={storyUrl(name, screen.story)} className="inline-flex items-center gap-1 text-sm font-semibold whitespace-nowrap">
              Open in Storybook <ExternalLink aria-hidden className="size-3.5" />
            </a>
          )}
        </figcaption>
      </figure>
    </>
  );
}

function WorksWith({ story }: { story: ProductStory }) {
  return (
    <PageSection id="with" heading={title("with")}>
      <ul aria-label="Works with" className="m-0 mt-5 grid list-none grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4 p-0">
        {story.worksWith.map((w) => {
          const other = product(w.id);
          return (
            <li key={w.id} className="flex flex-col gap-2.5 rounded-xl border border-line bg-surface p-5">
              <span className="flex items-center gap-2.5">
                <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent-text">
                  <other.icon className="size-4" />
                </span>
                <Link to={`/products/${w.id}`} className="font-semibold">
                  {other.name}
                </Link>
              </span>
              <span className="text-sm text-fg-muted">{w.how}</span>
            </li>
          );
        })}
      </ul>
    </PageSection>
  );
}

function Limits({ story }: { story: ProductStory }) {
  return (
    <section aria-labelledby="limits-h" id="limits" className="flex scroll-mt-16 flex-wrap gap-x-12 gap-y-5 rounded-2xl border border-line bg-surface p-7">
      <div className="flex-[1_1_220px]">
        <p className="m-0 mb-2 text-sm font-semibold tracking-wide text-accent-text uppercase">Limits</p>
        <h2 id="limits-h" className="m-0 text-2xl font-semibold tracking-tight">
          {title("limits")}
        </h2>
      </div>
      <ul
        aria-label="What it does not do"
        className="m-0 grid min-w-0 flex-[2_1_440px] list-none grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-x-8 gap-y-4 p-0"
      >
        {story.limits.map((l) => (
          <li key={l} className="flex gap-2.5 text-fg-muted">
            <Minus aria-hidden className="mt-1 size-4 shrink-0 text-fg-subtle" />
            <span>{l}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** What the product is for and how it works, in the order a visitor asks. */
/** `building`: the product is written and tested but not released, so the story is how it works, not a plan. */
export function StorySections({ id, story, planned, building = false }: { id: string; story: ProductStory; planned: boolean; building?: boolean }) {
  return (
    <>
      {planned &&
        (building ? (
          <Callout tone="info" title="Not released yet">
            This product is built and tested, and has no release to install yet. This is how it works.
          </Callout>
        ) : (
          <Callout tone="info" title="The plan, open to change">
            {hasDesign(product(id).name) ? "This product is designed but not built yet." : "This product is planned and not built yet."} This is how it will
            work.
          </Callout>
        ))}
      <Problem story={story} />
      <How story={story} />
      <PageSection id="checks" heading={title("checks")}>
        <CheckTabs story={story} />
      </PageSection>
      <Decides story={story} />
      <PageSection id="screens" heading={title("screens")}>
        <p className="mt-2 mb-0 text-fg-muted">
          {building ? "The product's screens." : planned ? "Screens from the design, with sample data." : "Screens of the released product, with sample data."}
        </p>
        <ScreenTabs id={id} story={story} />
      </PageSection>
      <WorksWith story={story} />
      <Limits story={story} />
    </>
  );
}
