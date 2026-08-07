import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The reading band's medallion and progress dots.
 *
 * Replaced a hairline list container built for multiple rows on a band that
 * only ever shows one. The dots' correctness rests on a single comparison —
 * `i < completed` — that is meant to double as the finished-state fill
 * (every dot passes once `completed` reaches `days.length`) rather than a
 * second branch. Pinning that it stays one comparison, not two.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), "utf8");
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

const band = strip(read("src", "components", "home", "reading-band.tsx"));

describe("the reading band's card", () => {
  it("carries its own medallion, not a borrowed topic emblem", () => {
    expect(band).toMatch(/import \{ BookOpen \} from "lucide-react"/);
    expect(band).toMatch(/<BookOpen/);
    // TopicEmblem is per-topic; this band is the plan itself, not a topic.
    expect(band).not.toMatch(/TopicEmblem/);
  });

  it("drops the multi-row list container this band never needed", () => {
    // One row, always — the border-y/first:border-t-0 pairing was for a list
    // that could hold more than one item, which this band never has.
    expect(band).not.toMatch(/border-y/);
    expect(band).not.toMatch(/first:border-t-0/);
  });

  it("fills progress dots and the finished state from the same comparison", () => {
    expect(band).toMatch(/days\.map\(\(_, i\) => \(/);
    expect(band).toMatch(/i < completed \? "bg-\[#D4A843\]" : "bg-white\/\[0\.12\]"/);
    // No second branch for "finished" — it must fall out of i < completed.
    expect(band.match(/i < completed/g)?.length).toBe(1);
  });
});
