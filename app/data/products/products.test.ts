import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PRODUCT_IDS } from "@openasy/ui";
import { STORIES, hasScreenshot, screenshot } from ".";

// Storybook's story ids, worked out from @openasy/ui's story files as Storybook does: CI builds the library, not Storybook.
const STORIES_DIR = "node_modules/@openasy/ui/src/stories/products";
const kebab = (s: string) =>
  s
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
const slug = (name: string) => name.toLowerCase().replace(/\s+/g, "-");
const STORY_IDS = new Set(
  readdirSync(STORIES_DIR)
    .filter((f) => f.endsWith(".stories.tsx"))
    .flatMap((f) => {
      const src = readFileSync(`${STORIES_DIR}/${f}`, "utf8");
      const title = /title:\s*"Products\/([^"]+)"/.exec(src)?.[1];
      return title ? [...src.matchAll(/^export const (\w+)/gm)].map((m) => `products-${slug(title)}--${kebab(m[1]!)}`) : [];
    }),
);
const MAX_SCREENSHOT = 150 * 1024;

it("every product has a story", () => {
  expect(Object.keys(STORIES).toSorted()).toEqual([...PRODUCT_IDS].toSorted());
});

describe.each(Object.entries(STORIES))("%s", (id, story) => {
  it("is a product, with every part written", () => {
    expect(PRODUCT_IDS).toContain(id);
    const s = story!;
    for (const part of [s.problem.title, s.problem.text]) expect(part.trim()).not.toBe("");
    for (const list of [s.who, s.flow, s.checks, s.decides, s.inputs, s.screens, s.worksWith, s.limits]) expect(list.length).toBeGreaterThan(0);
    expect(s.flow.length).toBeLessThanOrEqual(5);
  });

  it("links only to products that exist, never to itself", () => {
    for (const w of story!.worksWith) {
      expect(PRODUCT_IDS).toContain(w.id);
      expect(w.id).not.toBe(id);
    }
  });

  it("names screens that are in Storybook, and each screenshot taken has both themes, small enough", async () => {
    const { PRODUCTS } = await import("@openasy/ui");
    const name = slug(PRODUCTS[id as keyof typeof PRODUCTS].name);
    for (const s of story!.screens) {
      if (s.story) expect(STORY_IDS).toContain(`products-${name}--${s.story}`);
      if (!hasScreenshot(id, s.page)) continue;
      for (const theme of ["light", "dark"] as const) {
        const file = `public${screenshot(id, s.page, theme)}`;
        expect(existsSync(file), file).toBe(true);
        expect(statSync(file).size, file).toBeLessThanOrEqual(MAX_SCREENSHOT);
      }
    }
  });

  it("has no em dash", () => {
    expect(JSON.stringify(story)).not.toContain(String.fromCharCode(0x2014));
  });
});
