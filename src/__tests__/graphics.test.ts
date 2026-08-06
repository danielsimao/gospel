import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * The generated graphics, and the rules that keep them from becoming weight.
 *
 * Every raster asset here was generated from a prompt in docs/graphics, and
 * every one is a background or a share plate — never content. So the guards
 * are about restraint: nothing on the LCP path, nothing served that is not
 * used, nothing that can take a click, and no prompt lost.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), "utf8");
const strip = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
const kb = (...p: string[]) => statSync(join(ROOT, ...p)).size / 1024;

const texture = strip(read("src", "components", "home", "band-texture.tsx"));
const testOg = strip(read("src", "app", "[locale]", "(immersive)", "test", "opengraph-image.tsx"));
const prompts = read("docs", "graphics", "PROMPTS.md");

describe("what is served, and what is not", () => {
  it("ships both formats for every band texture", () => {
    for (const name of ["tally", "dots"]) {
      for (const ext of ["avif", "webp"]) {
        expect(
          existsSync(join(ROOT, "public", "graphics", `${name}.${ext}`)),
          `graphics/${name}.${ext} is missing`,
        ).toBe(true);
      }
    }
    expect(texture).toMatch(/type="image\/avif"/);
    expect(texture).toMatch(/\.webp/);
  });

  it("keeps print-only assets out of public", () => {
    /*
     * The fingerprint and the stone are for tract backs and card surfaces —
     * print, at full strength. Served they would be ~350 KB nobody ever
     * downloads. Versioned beside their prompts instead.
     */
    for (const name of ["fingerprint", "stone"]) {
      expect(
        existsSync(join(ROOT, "public", "graphics", `${name}.avif`)),
        `${name} is being served but is print-only`,
      ).toBe(false);
      expect(
        existsSync(join(ROOT, "docs", "graphics", "assets", `${name}.avif`)),
        `${name} is not versioned`,
      ).toBe(true);
    }
  });

  it("keeps the served set small", () => {
    // These sit behind content below the fold. A texture that costs more than
    // the page it decorates has stopped being a background.
    const total = ["tally", "dots"].flatMap((n) => [`${n}.avif`, `${n}.webp`])
      .concat("door.jpg")
      .reduce((sum, f) => sum + kb("public", "graphics", f), 0);
    expect(total, `served graphics total ${total.toFixed(0)} KB`).toBeLessThan(500);
  });
});

describe("the band textures stay backgrounds", () => {
  it("never loads eagerly, and never takes a click", () => {
    // Below the fold by construction, and carrying no meaning a reader needs.
    expect(texture).toMatch(/loading="lazy"/);
    expect(texture).toMatch(/decoding="async"/);
    expect(texture).toMatch(/aria-hidden="true"/);
    expect(texture).toMatch(/pointer-events-none/);
    expect(texture).toMatch(/alt=""/);
  });

  it("fades out before its own edges", () => {
    /*
     * A rectangle of texture with visible corners reads as a panel the band
     * sits in — the opposite of a background. The radial mask is the whole
     * difference between atmosphere and a box.
     */
    expect(texture).toMatch(/maskImage: "radial-gradient/);
    expect(texture).toMatch(/WebkitMaskImage: "radial-gradient/);
  });

  it("holds each texture at the opacity it was measured at", () => {
    /*
     * Both were tested in place. The tally marks are bright strokes on black
     * and survive dimming — 16% reads as a wall, 28% fights the caption. The
     * dot field is denser and flatter, so 12% reads as many and 22% makes the
     * chips look like they float.
     */
    expect(texture).toMatch(/tally: \{ opacity: "0\.16"/);
    expect(texture).toMatch(/dots: \{ opacity: "0\.12"/);
  });

  it("is used by exactly the two bands it was measured against", () => {
    const passed = strip(read("src", "components", "home", "passed-band.tsx"));
    const questions = strip(read("src", "components", "home", "questions-band.tsx"));
    expect(passed).toMatch(/<BandTexture texture="tally"/);
    expect(questions).toMatch(/<BandTexture texture="dots"/);
    // Not sprayed across the rest of the page.
    for (const name of ["reading-band", "closing-verse", "latest-post-card"]) {
      expect(
        strip(read("src", "components", "home", `${name}.tsx`)),
        `${name} grew a texture nobody measured`,
      ).not.toMatch(/BandTexture/);
    }
  });
});

describe("the /test share plate", () => {
  it("reads the image from disk rather than fetching it", () => {
    /*
     * Satori resolves <img src> over the network, which at build time means a
     * request to a host that may not be serving yet — the plate would render
     * silently without its background.
     */
    expect(testOg).toMatch(/readFile\(join\(process\.cwd\(\), "public", "graphics", "door\.jpg"\)\)/);
    expect(testOg).toMatch(/data:image\/jpeg;base64/);
    expect(testOg).not.toMatch(/src=\{`https?:/);
  });

  it("survives the image being missing", () => {
    // The layout is black-on-black by design; no image is a plainer card, not
    // a broken one.
    expect(testOg).toMatch(/doorSrc && \(/);
    expect(testOg).toMatch(/catch \(error\)/);
  });

  it("leaves the headline half of the frame clear", () => {
    /*
     * Measured on the source: the left 62% sits at p99 = 2 of 255, so white
     * type holds there without a scrim — and a scrim would only dull the one
     * lit thing in the picture. The right padding is what keeps the words out
     * of the light.
     */
    expect(testOg).toMatch(/paddingRight: "560px"/);
    expect(testOg, "a scrim was added over an already-black field").not.toMatch(
      /rgba\(0, ?0, ?0/,
    );
  });

  it("carries both locales", () => {
    expect(testOg).toMatch(/en: \{/);
    expect(testOg).toMatch(/pt: \{/);
    expect(testOg).toMatch(/locale === "pt" \? "pt" : "en"/);
  });
});

describe("every asset keeps its prompt", () => {
  it("documents the six, with copy markers", () => {
    // An asset whose prompt is lost cannot be regenerated at another size or
    // with one constraint changed.
    expect(prompts.match(/COPY FROM HERE/g)?.length).toBe(6);
    expect(prompts.match(/Generate a new image\./g)?.length).toBeGreaterThanOrEqual(6);
  });

  it("names the assets that shipped", () => {
    for (const name of ["tally", "dots", "fingerprint", "stone", "door"]) {
      expect(prompts.toLowerCase(), `${name} has no prompt on record`).toContain(name);
    }
  });
});
