import { describe, expect, it } from "vitest";
import { splitProducts, yamlText, yamlValue } from "./productfiles";

const compose = `# made here
name: try

services:
  proxy:
    image: example/proxy
    volumes:
      - proxy-data:/data

  web:
    image: example/web
    env_file: [openasy.env]
    volumes:
      - web-data:/data
    secrets: [kek]
    environment:
      WEB_PUBLIC_URL: https://web.example.com   # the address people open
      # Off until it is filled in
      WEB_ISSUER: \${WEB_ISSUER:-}
      WEB_TOKEN: \${SHARED_TOKEN}
    depends_on: [db]
  web-agent:
    image: example/web-agent
    secrets:
      - source: kek
        target: agent-kek
    environment:
      AGENT_TOKEN: \${SHARED_TOKEN}
      AGENT_ENROLL_TOKEN: \${AGENT_ENROLL_TOKEN:-}

volumes:
  proxy-data:
  web-data:

secrets:
  kek:
    file: ./keys/kek`;

const split = (setup?: Record<string, { url?: string }>) =>
  splitProducts(compose, {
    productOf: (s) => (s === "proxy" ? undefined : "web"),
    title: () => "OpenAsy Web",
    values: { SHARED_TOKEN: "abc" },
    examples: { WEB_ISSUER: "https://id.example.com" },
    apply: "docker compose up -d",
    extra: { web: ["      # WEB_FORGE_TOKEN: ..."] },
    setup,
  });

describe("each product in one compose file of its own (ADR 0054)", () => {
  it("moves a product's services into its file and leaves compose.yaml including it", () => {
    const out = split();
    expect(out.compose).toContain("name: try\n\n# One file per product");
    expect(out.compose).toContain("include:\n  - { path: products/web.yaml, project_directory: . }\n\nservices:\n  proxy:");
    expect(out.compose).not.toContain("web-agent");
    // Only what the services left here use is declared here.
    expect(out.compose).toContain("volumes:\n  proxy-data:");
    expect(out.compose).not.toContain("secrets:");
    expect(out.files.map((f) => f.name)).toEqual(["products/web.yaml"]);
    const web = out.files[0]!.content;
    expect(web).toMatch(/^# OpenAsy Web: its containers, with their settings and secrets/);
    expect(web).toContain("# After a change: docker compose up -d web web-agent\nservices:\n  web:");
    expect(web).toContain("volumes:\n  web-data:\n\nsecrets:\n  kek:\n    file: ./keys/kek\n");
  });

  it("writes the values in, keeps what exists only later empty or as an example, and says where a shared value also is", () => {
    const web = split().files[0]!.content;
    expect(web).toContain("      WEB_PUBLIC_URL: https://web.example.com   # the address people open");
    expect(web).toContain("      # Off until it is filled in\n      # WEB_ISSUER: https://id.example.com\n");
    expect(web).toContain("      # The same value as AGENT_TOKEN of web-agent: change them together.\n      WEB_TOKEN: abc\n");
    expect(web).toContain('      AGENT_ENROLL_TOKEN: ""\n');
    // Extra lines go at the end of the service's environment.
    expect(web).toContain("      WEB_TOKEN: abc\n      # WEB_FORGE_TOKEN: ...\n    depends_on: [db]");
  });

  it("tells setup each product's address and the lines it fills, on x-openasy", () => {
    const out = split({ web: { url: "https://web.example.com" } });
    const web = out.files[0]!.content;
    expect(web).toContain('    image: example/web\n    x-openasy: {"url":"https://web.example.com","fills":{"WEB_ISSUER":"WEB_ISSUER"}}   # read by setup\n');
    // A value made here is not setup's to fill.
    expect(web).toContain('    x-openasy: {"fills":{"AGENT_ENROLL_TOKEN":"AGENT_ENROLL_TOKEN"}}');
    expect(out.targets.SHARED_TOKEN).toHaveLength(2);
  });

  it("leaves a compose.yaml with no services as it is", () => {
    expect(splitProducts("services: {}", { productOf: () => "x", title: () => "", apply: "up" }).compose).toBe("services: {}");
  });
});

describe("values in YAML", () => {
  it("writes a plain value plainly and quotes the rest, so it reads back the same", () => {
    expect(yamlValue("https://id.example.com:8443")).toBe("https://id.example.com:8443");
    expect(yamlValue("ssh-ed25519 AAAA openasy")).toBe("ssh-ed25519 AAAA openasy");
    for (const v of ["true", "1194", "a: b", "# x", "Bearer x$y", "line\\none", "", "- x"]) expect(yamlText(yamlValue(v))).toBe(v);
    expect(yamlValue("Bearer x$y")).toBe('"Bearer x$$y"');
  });
});
