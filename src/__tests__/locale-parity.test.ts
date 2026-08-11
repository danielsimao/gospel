import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The two locale files must carry the same keys.
 *
 * validateMessages checks a named list and nothing else, so a key added to one
 * locale and forgotten in the other reached production as an undefined render.
 * This is the whole-file version: every path, both directions.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const read = (...p: string[]) => JSON.parse(readFileSync(join(ROOT, ...p), "utf8"));

const en = read("src", "messages", "en.json");
const pt = read("src", "messages", "pt.json");

/** Every leaf path. Arrays collapse to `[]` so a differing length is not a diff —
    reflections and days legitimately differ in count between locales. */
function keyPaths(node: unknown, prefix = ""): string[] {
  if (Array.isArray(node)) {
    return node.flatMap((v) => keyPaths(v, `${prefix}[]`)).concat(`${prefix}[]`);
  }
  if (node && typeof node === "object") {
    return Object.entries(node).flatMap(([k, v]) => keyPaths(v, `${prefix}.${k}`));
  }
  return [prefix];
}

describe("locale key parity", () => {
  it("en and pt carry identical key sets", () => {
    const enKeys = new Set(keyPaths(en));
    const ptKeys = new Set(keyPaths(pt));
    const missingInPt = [...enKeys].filter((k) => !ptKeys.has(k)).sort();
    const missingInEn = [...ptKeys].filter((k) => !enKeys.has(k)).sort();

    expect(missingInPt, "keys present in en.json but missing from pt.json").toEqual([]);
    expect(missingInEn, "keys present in pt.json but missing from en.json").toEqual([]);
  });
});
