// Each product in one compose file of its own (ADR 0054). The install builder and the dev setup write one compose.yaml
// with every service, as is easiest to build; this moves each product's services, with their settings and secrets,
// into products/<product>.yaml, and leaves compose.yaml including them. A value written as ${NAME} or ${NAME:-} is
// filled in from `values`; one that exists only later is left for the reader, or the dev setup, to fill.

const SERVICE = /^ {2}([a-z0-9][a-z0-9-]*):\s*$/;
const ENTRY = /^ {6}([A-Z_][A-Z0-9_]*): (.*)$/;
const REF = /^\$\{([A-Z_][A-Z0-9_]*)(:-)?\}$/;

export interface ProductTarget {
  file: string;
  service: string;
  key: string;
  /** Written as ${NAME:-}: a value that exists only after the first start, such as an enrolment token. */
  later: boolean;
}

export interface SplitProducts {
  compose: string;
  /** The product files, in the order their services come. */
  files: Array<{ name: string; content: string }>;
  /** For each ${NAME}, the services and keys it fills. */
  targets: Record<string, ProductTarget[]>;
}

export interface SplitOptions {
  /** The file a service goes in, such as sast for sast and sast-agent; undefined keeps it in compose.yaml. */
  productOf: (service: string) => string | undefined;
  /** The heading of a product's file, such as "OpenAsy SAST". */
  title: (product: string) => string;
  /** Values for ${NAME}; a name missing here is left empty, or commented out with its example. */
  values?: Record<string, string>;
  /** Examples for values that only exist later, such as an issuer, shown commented out. */
  examples?: Record<string, string>;
  /** The command that applies a change, with the services' names at the end. */
  apply: string;
  /** Lines added at the end of a service's environment, such as the tokens its inventory entries name. */
  extra?: Record<string, string[]>;
  /**
   * For the dev setup: what setup/setup.ts reads of each service, written on it as x-openasy, with the keys each
   * ${NAME} fills there, so setup writes what it makes into the right lines.
   */
  setup?: Record<string, { url?: string; template?: string }>;
}

/** A value as YAML reads it back as the same text, and compose leaves alone: anything unusual is quoted, $ doubled. */
export function yamlValue(v: string): string {
  const plain =
    /^[A-Za-z0-9_./@+=,~][A-Za-z0-9_./@+=,~:-]*( [A-Za-z0-9_./@+=,~:-]+)*$/.test(v) &&
    !/:( |$)/.test(v) &&
    !/^(true|false|yes|no|on|off|null|[-+]?[0-9][0-9._]*(e[0-9]+)?)$/i.test(v);
  return plain ? v : JSON.stringify(v).replaceAll("$", () => "$$");
}

/** The value of a YAML line written by yamlValue, as it was before. */
export function yamlText(v: string): string {
  if (v.startsWith('"')) return (JSON.parse(v) as string).replaceAll("$$", "$");
  if (v.startsWith("'")) return v.slice(1, -1).replaceAll("''", "'");
  return v;
}

/** A value from compose.yaml: the text, without the comment after it. */
function parse(line: string): { key: string; value: string; comment?: string } | undefined {
  const m = ENTRY.exec(line);
  if (!m) return undefined;
  const [, key, rest] = m;
  const at = rest!.search(/\s{2,}# /);
  return { key: key!, value: (at < 0 ? rest! : rest!.slice(0, at)).trim(), comment: at < 0 ? undefined : rest!.slice(at).trim() };
}

interface Block {
  name: string;
  lines: string[];
}

/** The named volumes and the secrets a service uses, to declare them in its file. */
function uses(block: Block) {
  const volumes = new Set<string>();
  const secrets = new Set<string>();
  let inSecrets = false;
  for (const l of block.lines) {
    const v = /^ {6}- "?([a-z0-9][a-z0-9_-]*):\//.exec(l);
    if (v) volumes.add(v[1]!);
    if (/^ {4}secrets:/.test(l)) {
      const inline = /\[(.*)\]/.exec(l.replace(/\s+#.*$/, ""));
      if (inline) for (const s of inline[1]!.split(",")) secrets.add(s.trim());
      inSecrets = !inline;
      continue;
    }
    if (inSecrets && /^ {6}- /.test(l)) secrets.add(l.replace(/^ {6}- (source: )?/, "").trim());
    else if (!/^ {8}/.test(l)) inSecrets = false;
  }
  return { volumes, secrets };
}

export function splitProducts(composeText: string, o: SplitOptions): SplitProducts {
  if (!/^services:\s*$/m.test(composeText)) return { compose: composeText, files: [], targets: {} };
  const { values = {}, examples = {} } = o;
  const head: string[] = [];
  const tail: string[] = [];
  const blocks: Block[] = [];
  const top: Record<"volumes" | "secrets", Map<string, string[]>> = { volumes: new Map(), secrets: new Map() };
  let section = "";
  let pending: string[] = [];
  let entry: string[] | undefined;
  for (const line of composeText.split("\n")) {
    if (/^[a-z]/.test(line)) {
      section = line.replace(/:.*$/, "");
      if (section !== "services" && section !== "volumes" && section !== "secrets") (section === "name" ? head : tail).push(line);
      continue;
    }
    if (!section) {
      head.push(line);
      continue;
    }
    if (section === "volumes" || section === "secrets") {
      const m = /^ {2}([a-z0-9][a-z0-9_-]*):/.exec(line);
      if (m) top[section].set(m[1]!, (entry = [line]));
      else if (line.trim() && entry) entry.push(line);
      continue;
    }
    if (section !== "services") {
      tail.push(line);
      continue;
    }
    const s = SERVICE.exec(line);
    if (s) {
      blocks.push({ name: s[1]!, lines: [...pending.filter((l) => l.trim()), line] });
      pending = [];
    } else if (!line.trim() || /^ {2}#/.test(line)) pending.push(line);
    else {
      blocks.at(-1)!.lines.push(...pending, line);
      pending = [];
    }
  }

  const fileOf = (service: string) => {
    const p = o.productOf(service);
    return p ? `products/${p}.yaml` : "compose.yaml";
  };
  const targets: Record<string, ProductTarget[]> = {};
  for (const b of blocks) {
    const at = b.lines.indexOf("    environment:");
    if (at < 0) continue;
    let end = at + 1;
    for (; end < b.lines.length && /^ {6}/.test(b.lines[end]!); end++) {
      const e = parse(b.lines[end]!);
      if (!e) continue;
      const ref = REF.exec(e.value);
      if (!ref) continue;
      const from = ref[1]!;
      (targets[from] ??= []).push({ file: fileOf(b.name), service: b.name, key: e.key, later: !!ref[2] });
      const v = values[from];
      const tail = e.comment ? `   ${e.comment}` : "";
      b.lines[end] =
        v !== undefined && v !== ""
          ? `      ${e.key}: ${yamlValue(v)}${tail}`
          : examples[from] !== undefined
            ? `      # ${e.key}:${examples[from] ? ` ${examples[from]}` : ""}${tail}`
            : `      ${e.key}: ""${tail}`;
    }
    if (o.extra?.[b.name]) b.lines.splice(end, 0, ...o.extra[b.name]!);
  }
  // A value written in more than one place says where the others are, so it is changed in all of them.
  for (const ts of Object.values(targets)) {
    if (ts.length < 2) continue;
    for (const t of ts) {
      const b = blocks.find((x) => x.name === t.service)!;
      const at = b.lines.findIndex((l) => l.startsWith(`      ${t.key}: `) || l.startsWith(`      # ${t.key}: `));
      const others = ts.filter((x) => x !== t);
      const where = [...new Set(others.map((x) => x.file))].map(
        (f) =>
          `${others
            .filter((x) => x.file === f)
            .map((x) => `${x.key} of ${x.service}`)
            .join(" and ")}${f === t.file ? "" : ` in ${f}`}`,
      );
      b.lines.splice(at, 0, `      # The same value as ${where.join(", ")}: change them together.`);
    }
  }
  if (o.setup)
    for (const b of blocks) {
      const fills = Object.fromEntries(
        Object.entries(targets).flatMap(([name, ts]) => ts.filter((t) => t.service === b.name && t.later).map((t) => [t.key, name] as const)),
      );
      const meta = { ...o.setup[b.name], ...(Object.keys(fills).length && { fills }) };
      const image = b.lines.findIndex((l) => /^ {4}image:/.test(l));
      const after = image >= 0 ? image : b.lines.findIndex((l) => SERVICE.test(l));
      if (Object.keys(meta).length) b.lines.splice(after + 1, 0, `    x-openasy: ${JSON.stringify(meta)}   # read by setup`);
    }

  const declare = (bs: Block[]) => {
    const vols = new Set<string>();
    const secs = new Set<string>();
    for (const b of bs) {
      const u = uses(b);
      u.volumes.forEach((v) => top.volumes.has(v) && vols.add(v));
      u.secrets.forEach((s) => top.secrets.has(s) && secs.add(s));
    }
    return [
      ...(vols.size ? ["", "volumes:", ...[...top.volumes].filter(([n]) => vols.has(n)).flatMap(([, l]) => l)] : []),
      ...(secs.size ? ["", "secrets:", ...[...top.secrets].filter(([n]) => secs.has(n)).flatMap(([, l]) => l)] : []),
    ];
  };
  const body = (bs: Block[]) => bs.flatMap((b, i) => [...(i ? [""] : []), ...b.lines]);

  const products = [...new Set(blocks.map((b) => o.productOf(b.name)).filter((p): p is string => !!p))];
  const files = products.map((p) => {
    const bs = blocks.filter((b) => o.productOf(b.name) === p);
    return {
      name: `products/${p}.yaml`,
      content: `${[
        `# ${o.title(p)}: its containers, with their settings and secrets (ADR 0054). Keep this file out of git and with`,
        "# your backups: it holds the product's tokens.",
        `# After a change: ${o.apply} ${bs.map((b) => b.name).join(" ")}`,
        "services:",
        ...body(bs),
        ...declare(bs),
      ].join("\n")}\n`,
    };
  });
  const own = blocks.filter((b) => !o.productOf(b.name));
  while (head.length && !head.at(-1)!.trim()) head.pop();
  const compose = [
    ...head,
    "",
    "# One file per product, with its containers, settings and secrets. Leave a line out to leave the product out.",
    "include:",
    ...files.map((f) => `  - { path: ${f.name}, project_directory: . }`),
    ...(own.length ? ["", "services:", ...body(own)] : []),
    ...declare(own),
    ...tail,
  ].join("\n");
  return { compose: `${compose.trimEnd()}\n`, files, targets };
}
