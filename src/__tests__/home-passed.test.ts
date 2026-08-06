import { describe, it, expect, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fetchTestTakerCount } from "@/lib/test-stats";

/**
 * "N took the test. 1 passed." — the homepage's score band.
 *
 * The claim is doctrine, not data: exactly one person in history kept the Law,
 * and he is not a row in PostHog. So the band's guards split cleanly in two —
 * the sentence must stand on its own when the number is missing, and the
 * number's plumbing must never be able to break, shift, or leak from the
 * homepage.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), "utf8");
const strip = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

const band = strip(read("src", "components", "home", "passed-band.tsx"));
const shell = strip(read("src", "components", "home-shell.tsx"));
const stats = strip(read("src", "lib", "test-stats.ts"));
const page = strip(read("src", "app", "[locale]", "(content)", "page.tsx"));
const en = JSON.parse(read("src", "messages", "en.json"));
const pt = JSON.parse(read("src", "messages", "pt.json"));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("the band and its doors", () => {
  it("is ungated — every stage sees the same score", () => {
    // Rendered once among the ungated bands, not inside a journey branch: the
    // same precedent as the questions and reading bands, so the five stages
    // cannot drift apart.
    const at = shell.indexOf("<PassedBand");
    expect(at, "PassedBand is not rendered").toBeGreaterThan(-1);
    expect(at, "PassedBand is not before QuestionsBand").toBeLessThan(shell.indexOf("<QuestionsBand"));
    expect(shell.match(/<PassedBand/g)?.length, "rendered more than once").toBe(1);
    /*
     * Not wrapped in a stage conditional. The first version of this assertion
     * only checked ordering, and a mutation gating the band on
     * journey.stage === "visitor" passed it — the exact drift this test exists
     * to stop. The window before the JSX is where a gate would sit.
     */
    const before = shell.slice(Math.max(0, at - 160), at);
    expect(before, "the band is gated on a journey stage").not.toMatch(/journey\.|stage|&& \(/);
  });

  it("opens both doors: who he is, and the test itself", () => {
    expect(band).toMatch(/learn\/who-is-jesus/);
    expect(band).toMatch(/\/test`/);
  });

  it("points at a topic that exists", () => {
    // A renamed slug turns the band's whole point into a 404.
    const slugs = en.learn.topics.map((t: { slug: string }) => t.slug);
    expect(slugs).toContain("who-is-jesus");
  });

  it("sets the one who passed in gold", () => {
    // Red is judgment, gold is grace — the palette is the argument. The line
    // naming the exception must be the gold thing, and the largest.
    const passed = band.slice(band.indexOf("{messages.passed}") - 400, band.indexOf("{messages.passed}"));
    expect(passed).toMatch(/#D4A843/);
    expect(passed).toMatch(/text-\[27px\]/);
  });

  it("reads whole without the number", () => {
    // The count is a garnish. Both locales carry a count-less sentence, and
    // the component chooses it rather than printing "null people".
    expect(band).toMatch(/formatted === null\s*\?\s*messages\.took/);
    for (const [locale, home] of [
      ["en", en.home],
      ["pt", pt.home],
    ] as const) {
      expect(home.passedBand.took, `${locale} has no count-less line`).not.toContain("{n}");
      expect(home.passedBand.tookWithCount, `${locale} lost its placeholder`).toContain("{n}");
    }
  });
});

describe("the count's plumbing", () => {
  it("resolves on the server, with a key that never reaches a browser", () => {
    /*
     * The project token in the client is write-only by design; a personal key
     * can read every event in the project. NEXT_PUBLIC_ would inline it into
     * the bundle for anyone to lift.
     */
    expect(stats).not.toMatch(/NEXT_PUBLIC/);
    expect(stats).toMatch(/POSTHOG_PERSONAL_API_KEY/);
    expect(page).toMatch(/await fetchTestTakerCount\(\)/);
    // …and the client component receives a number, not the means to fetch one.
    expect(band).not.toMatch(/fetch\(|process\.env/);
  });

  it("revalidates instead of refetching per request", () => {
    // The homepage is static; an hourly count is indistinguishable from fresh
    // on a number that only grows.
    expect(stats).toMatch(/revalidate: 3600/);
  });

  it("returns null when there is no key", async () => {
    vi.stubEnv("POSTHOG_PERSONAL_API_KEY", "");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect(await fetchTestTakerCount()).toBeNull();
    // No key means no request — not a request that fails.
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns the count PostHog answers with", async () => {
    vi.stubEnv("POSTHOG_PERSONAL_API_KEY", "phx_test");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ results: [[4217]] }),
      })),
    );
    expect(await fetchTestTakerCount()).toBe(4217);
  });

  it("turns every failure into null, never a throw", async () => {
    vi.stubEnv("POSTHOG_PERSONAL_API_KEY", "phx_test");
    // A homepage that 500s because an analytics vendor had a bad day is the
    // failure mode every branch here exists to rule out.
    for (const impl of [
      async () => ({ ok: false, json: async () => ({}) }),
      async () => ({ ok: true, json: async () => ({}) }),
      async () => ({ ok: true, json: async () => ({ results: [["not a number"]] }) }),
      async () => ({ ok: true, json: async () => ({ results: [[0]] }) }),
      async () => {
        throw new Error("network");
      },
    ]) {
      vi.stubGlobal("fetch", vi.fn(impl));
      expect(await fetchTestTakerCount()).toBeNull();
    }
  });
});
