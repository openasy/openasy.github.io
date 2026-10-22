import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { crc32, zip } from "./data/zip";

describe("zip", () => {
  it("computes the standard CRC-32", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
  });

  it("makes an archive that unzip opens, with every file in one folder", () => {
    const files = [
      { name: "compose.yaml", content: "services:\n  vpn: {}\n" },
      { name: ".env", content: "VPN_CLIENT_SECRET=\n" },
      { name: "openasy-kek", content: "ab".repeat(32) },
    ];
    const dir = mkdtempSync(join(tmpdir(), "oa-zip-"));
    writeFileSync(join(dir, "openasy.zip"), zip(files, "openasy"));
    execFileSync("unzip", ["-q", "openasy.zip"], { cwd: dir });
    for (const f of files) expect(readFileSync(join(dir, "openasy", f.name), "utf8")).toBe(f.content);
  });
});
