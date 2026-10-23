// Colours for the files the install page shows: YAML, env files, TypeScript, Caddyfile and proxy configs, Markdown.
// A few rules per language, line by line, so the page needs no highlighting library. Pure, like zip.ts.

export type Kind = "plain" | "comment" | "key" | "string" | "literal" | "keyword" | "punct" | "heading";
export interface Token {
  text: string;
  kind: Kind;
}
export type Language = "yaml" | "env" | "ts" | "conf" | "md" | "text";

/** The language of a file from its name, as the page names them. */
export function languageOf(name: string): Language {
  const base = name.slice(name.lastIndexOf("/") + 1);
  if (/\.ya?ml$/.test(base)) return "yaml";
  if (/(^|\.)env$/.test(base)) return "env";
  if (base.endsWith(".ts")) return "ts";
  if (base === "Caddyfile" || base.endsWith(".conf")) return "conf";
  if (base.endsWith(".md")) return "md";
  return "text";
}

type Rule = [Kind, RegExp];
const STRING: Rule = ["string", /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/y];
const RULES: Record<Exclude<Language, "text" | "md">, Rule[]> = {
  yaml: [
    ["comment", /(?<=^|\s)#.*/y],
    ["key", /(?<=^\s*(?:-\s+)?)[A-Za-z0-9_.<-]+(?=:(\s|$))/y],
    STRING,
    ["punct", /(?<=\s|^)[&*][A-Za-z0-9_-]+|^\s*-(?=\s)|[[\]{}]/y],
    ["literal", /(?<=[\s[,]|^)(true|false|null|-?\d+(\.\d+)?)(?=[\s,\]}]|$)/y],
  ],
  env: [["comment", /^\s*#.*/y], ["key", /^[A-Za-z_][A-Za-z0-9_]*(?==)/y], STRING],
  ts: [
    ["comment", /\/\/.*|\/\*.*?\*\//y],
    ["string", /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/y],
    [
      "keyword",
      /\b(?:import|from|export|const|let|var|function|async|await|return|if|else|for|of|in|while|break|continue|new|throw|try|catch|class|extends|interface|type|as|typeof)\b/y,
    ],
    ["literal", /\b(?:true|false|null|undefined|\d[\d_]*(\.\d+)?)\b/y],
  ],
  conf: [["comment", /(?<=^|\s)#.*/y], STRING, ["key", /(?<=^\s*)<?\/?[A-Za-z_][A-Za-z0-9_-]*/y], ["punct", /[{};]/y]],
};

function line(text: string, rules: Rule[]): Token[] {
  const out: Token[] = [];
  let plain = "";
  for (let i = 0; i < text.length;) {
    let hit: Token | null = null;
    for (const [kind, re] of rules) {
      re.lastIndex = i;
      const m = re.exec(text);
      if (m && m[0]) {
        hit = { text: m[0], kind };
        break;
      }
    }
    if (!hit) {
      plain += text[i++];
      continue;
    }
    if (plain) (out.push({ text: plain, kind: "plain" }), (plain = ""));
    out.push(hit);
    i += hit.text.length;
  }
  if (plain) out.push({ text: plain, kind: "plain" });
  return out;
}

/** The file as lines of tokens; joined back together they are the file exactly. */
export function highlight(content: string, language: Language): Token[][] {
  const lines = content.split("\n");
  if (language === "text") return lines.map((l) => [{ text: l, kind: "plain" }]);
  if (language === "md") {
    let fenced = false;
    return lines.map((l) => {
      if (/^\s*```/.test(l)) {
        fenced = !fenced;
        return [{ text: l, kind: "punct" }];
      }
      if (fenced) return [{ text: l, kind: "string" }];
      if (/^#{1,6} /.test(l)) return [{ text: l, kind: "heading" }];
      return line(l, [
        ["string", /`[^`]+`/y],
        ["punct", /^\s*(\d+\.|[-*|])(?=\s)|\|/y],
      ]);
    });
  }
  return lines.map((l) => line(l, RULES[language]));
}
