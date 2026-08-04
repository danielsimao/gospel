import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The landing and the six questions stand in the same column.
 *
 * The landing used to centre itself, horizontally and vertically, while the
 * questions ranged left at a fixed offset. The reader's own question and the
 * first commandment are the same beat, so they now share a column width and a
 * vertical offset — and the offset is written twice, once in each file, which
 * is precisely the kind of pair that drifts apart six months from now.
 *
 * Source assertions in the idiom of bottom-inset.test.ts: these are Tailwind
 * classes inside JSX, and vitest runs in `environment: "node"`, so there is no
 * layout here to observe as behaviour.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const read = (...parts: string[]) => readFileSync(join(ROOT, ...parts), "utf8");

const landing = read("src", "components", "landing.tsx");
const questionCard = read("src", "components", "question-card.tsx");
const selfRating = read("src", "components", "home", "self-rating.tsx");

/** Comments in both files quote these classes while explaining them, so a
    deleted implementation would otherwise pass on the strength of its own
    prose. */
function code(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

/** Every top-offset class on the element, in source order: base, then the `sm`
    and short-viewport overrides. */
function topOffsets(source: string): string[] {
  return [...code(source).matchAll(/(?:sm:|\[@media\(max-height:500px\)\]:)?pt-\[\d+vh\]/g)].map(
    (m) => m[0],
  );
}

describe("the landing and the questions share one column", () => {
  it("anchors both at the same three offsets", () => {
    const offsets = topOffsets(landing);
    // Not just equal to each other — non-empty, or two screens that both
    // stopped using vh offsets would agree vacuously.
    expect(offsets.length).toBeGreaterThan(0);
    expect(offsets).toEqual(topOffsets(questionCard));
  });

  it("ranges the landing left rather than centring it", () => {
    // `text-center` here is what the move removed. It would not fail a build,
    // a type check, or any other test — it would just quietly put this screen
    // back in a different grammar from the six that follow it.
    const root = code(landing);
    expect(root).not.toMatch(/className="[^"]*\btext-center\b/);
    expect(root).not.toMatch(/className="[^"]*\bjustify-center\b/);
  });
});

describe("the shared self-rating chips", () => {
  it("keeps the homepage on the row layout by default", () => {
    // The landing needs stacked chips; the homepage hero does not. The default
    // is what protects the hero from the landing's requirement, so a change of
    // default is a change to a screen nobody was editing.
    expect(code(selfRating)).toMatch(/layout\s*=\s*"row"/);
  });

  it("gives the landing the stacked layout", () => {
    expect(code(landing)).toMatch(/layout="stack"/);
  });
});
