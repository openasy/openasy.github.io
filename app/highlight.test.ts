import { describe, expect, it } from "vitest";
import { highlight, languageOf } from "./data/highlight";
import { buildDevKit } from "./data/devkit";
import { makeSecrets } from "./data/install";

const kinds = (content: string, lang: Parameters<typeof highlight>[1]) =>
  highlight(content, lang)
    .flat()
    .filter((t) => t.kind !== "plain")
    .map((t) => `${t.kind}:${t.text}`);

describe("highlight", () => {
  it("knows each file by its name", () => {
    expect(
      [
        "compose.yaml",
        "config/prometheus.yml",
        "config/brand.env",
        ".env",
        "setup/setup.ts",
        "config/Caddyfile",
        "config/openasy-nginx.conf",
        "README.md",
        "secrets/openasy-kek",
      ].map(languageOf),
    ).toEqual(["yaml", "yaml", "env", "env", "ts", "conf", "conf", "md", "text"]);
  });

  it("colours keys, strings, literals and comments, and keeps the text as it is", () => {
    expect(kinds('  vpn:\n    image: "x" # pinned\n    ports: [1194]\n    read_only: true', "yaml")).toEqual([
      "key:vpn",
      "key:image",
      'string:"x"',
      "comment:# pinned",
      "key:ports",
      "punct:[",
      "literal:1194",
      "punct:]",
      "key:read_only",
      "literal:true",
    ]);
    // A port inside a URL is part of the text, not a number.
    expect(kinds("  OPENASY_PRODUCTS: id=https://id.localhost:8443", "yaml")).toEqual(["key:OPENASY_PRODUCTS"]);
    expect(kinds("# brand\nOPENASY_ORGANIZATION='Acme'", "env")).toEqual(["comment:# brand", "key:OPENASY_ORGANIZATION", "string:'Acme'"]);
    expect(kinds('const x = "a"; // b', "ts")).toEqual(["keyword:const", 'string:"a"', "comment:// b"]);
  });

  it("gives back every file of the dev setup unchanged", () => {
    for (const f of buildDevKit(makeSecrets((b) => b.fill(7))).files)
      expect(
        highlight(f.content, languageOf(f.name))
          .map((l) => l.map((t) => t.text).join(""))
          .join("\n"),
      ).toBe(f.content);
  });
});
