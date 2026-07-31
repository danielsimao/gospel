import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The box that holds a place for "{when}" must stop holding it once the phrase
 * arrives.
 *
 * The reserve exists because the undecided and thinking stages are painted
 * before their timestamp is readable, and a sentence that reflows when the date
 * lands is worse than a sentence with a blank in it. But the reserve was
 * unconditional, so it outlived the blank: 15ch is 141.7px and "earlier today"
 * is 85px, which put 57px of nothing between the phrase and its full stop for
 * every returning reader — measured in a browser, and reported by one.
 *
 * A source assertion in the idiom of stage-css.test.ts: this is an inline style
 * inside JSX and vitest runs in `environment: "node"`, so there is no layout
 * here to measure.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const homeShell = readFileSync(join(ROOT, "src", "components", "home-shell.tsx"), "utf8");

/** The comment above the style quotes both the width and the bug, so assertions
    read the file with comments stripped. */
const code = homeShell.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

describe("the {when} reserve", () => {
  it("is conditional on the phrase still being unknown", () => {
    // The regression was a bare object literal here. Anything that applies the
    // reserve unconditionally fails, whatever width it uses.
    expect(code).toMatch(/style=\{known \? undefined : \{[^}]*minWidth/);
  });

  it("still reserves a width wide enough for the longest phrase", () => {
    // 15ch clears "há 156 semanas" in Portuguese, which 13ch did not. Narrowing
    // it re-opens the re-wrap this box exists to prevent.
    expect(code).toMatch(/minWidth: "15ch"/);
  });

  it("renders the phrase itself only when it is known", () => {
    // The other half of the same guard: the sentence must not state a date it
    // does not have. journey-storage carries the history of this app telling a
    // reader they took the test today when they took it three weeks ago.
    expect(code).toMatch(/known \? sincePhrase\(days, since\)/);
  });
});
