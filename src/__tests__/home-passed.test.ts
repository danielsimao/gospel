import { describe, it, expect, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  fetchTestTakerCount,
  estimateTestTakerCount,
  ESTIMATE_BASE,
  ESTIMATE_PER_DAY,
} from "@/lib/test-stats";

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

  it("sets both sides at the same size, in the palette's two colours", () => {
    /*
     * The values carry the asymmetry — thousands in red against a gold 1 at
     * the SAME type size is what makes the ratio the argument. Two different
     * sizes would be the design deciding the winner instead of the numbers.
     */
    const sizes = band.match(/text-\[clamp\(2\.1rem,9vw,3\.4rem\)\]/g) ?? [];
    expect(sizes.length, "the two sides are not the same size").toBe(2);
    expect(band).toMatch(/text-red-400 tabular-nums/);
    expect(band).toMatch(/text-\[#D4A843\] tabular-nums/);
  });

  it("gold arrives after the count stops, and never before", () => {
    // The pause before gold is the site's own grammar: the Law finishes first.
    expect(band).toMatch(/setTimeout\(\(\) => setPassVisible\(true\), 350\)/);
    expect(band).toMatch(/passVisible \? "translate-y-0 opacity-100"/);
  });

  it("always shows a number, and behaves live even without one", () => {
    /*
     * The owner's brief, verbatim: a dead word in the red slot kills the
     * liveness the band trades on. With no real count the modelled estimate
     * stands in — a rate, like the death counter — and the band still wears
     * the pulse, counts up, and ticks while the reader lingers.
     */
    expect(band).toMatch(/count \?\? estimateTestTakerCount\(\)/);
    expect(band, "the dead-word fallback is back").not.toMatch(/failedFallback|Todos/);
    // The pulse point, which stops moving but stays visible under reduced motion.
    expect(band).toMatch(/animate-pulse motion-reduce:animate-none/);
    // The slow tick: content, not motion, so it survives reduced motion too.
    expect(band).toMatch(/34_000 \+ Math\.random\(\) \* 26_000/);
    expect(band).toMatch(/clearTimeout\(tickTimer\)/);
    // Day-granular estimate + suppressed warning: hydration cannot disagree.
    expect(band).toMatch(/suppressHydrationWarning/);
    for (const [locale, home] of [
      ["en", en.home],
      ["pt", pt.home],
    ] as const) {
      expect(home.passedBand.liveBadge, `${locale} lost the live badge`).toBeTruthy();
      expect(home.passedBand.failedCaption, `${locale} lost the red caption`).toBeTruthy();
    }
  });

  it("estimates deterministically, by the day", () => {
    // Same day, different hour: the same number — that is what keeps server
    // and client hydration in agreement. Different days grow by the rate.
    const morning = Date.UTC(2026, 7, 6, 8);
    const evening = Date.UTC(2026, 7, 6, 22);
    const nextDay = Date.UTC(2026, 7, 7, 8);
    expect(estimateTestTakerCount(morning)).toBe(estimateTestTakerCount(evening));
    expect(estimateTestTakerCount(nextDay)).toBe(estimateTestTakerCount(morning) + ESTIMATE_PER_DAY);
    // …and never negative, whatever the clock says.
    expect(estimateTestTakerCount(0)).toBe(ESTIMATE_BASE);
  });

  it("dresses the doors as doors", () => {
    // Two pills, unequal on purpose: the gold one is the band's reason to
    // exist, the quiet one is for whoever hears the scoreline as a challenge.
    // className follows href in the JSX, so the window looks forward.
    const who = band.slice(band.indexOf("learn/who-is-jesus"), band.indexOf("learn/who-is-jesus") + 350);
    expect(who).toMatch(/rounded-full border border-\[#D4A843\]/);
    const test = band.slice(band.indexOf("/test`"), band.indexOf("/test`") + 350);
    expect(test).toMatch(/rounded-full border border-white/);
  });
});

describe("the anonymous counter", () => {
  const route = strip(read("src", "app", "api", "verdict-count", "route.ts"));
  const verdict = strip(read("src", "components", "verdict-screen.tsx"));

  it("counts without anyone in the event", () => {
    // The same contract as the QR scan counter: one identity for every
    // verdict ever, no person, no geo, no IP. A counter with nobody in it
    // needs nobody's consent — which is the whole reason it exists.
    expect(route).toMatch(/distinct_id: "verdict-anon"/);
    expect(route).toMatch(/\$process_person_profile: false/);
    expect(route).toMatch(/\$geoip_disable: true/);
    expect(route).toMatch(/\$ip: "0\.0\.0\.0"/);
  });

  it("answers before it counts, and only in production", () => {
    expect(route).toMatch(/after\(\(\) => recordVerdict/);
    expect(route).toMatch(/VERCEL_ENV === "production"/);
    // POST, so a crawler prefetching links cannot inflate the score.
    expect(route).toMatch(/export async function POST/);
    expect(route).not.toMatch(/export async function GET/);
  });

  it("fires from the verdict exactly where the consented event fires", () => {
    /*
     * Same effect, same once-per-mount guard, same !returning gate — the two
     * counters must agree about what a verdict is, or the greatest() in the
     * fetch compares different things.
     */
    const effect = verdict.slice(
      verdict.indexOf("if (!hasTracked.current && !returning)"),
      verdict.indexOf("}, [state.answers"),
    );
    expect(effect.length, "could not isolate the tracking effect").toBeGreaterThan(0);
    expect(effect).toMatch(/trackVerdictReached/);
    expect(effect).toMatch(/sendBeacon\?\.\("\/api\/verdict-count"\)/);
  });

  it("is read back as the greater of the two counts", () => {
    // Consented history is bigger early; the anonymous counter overtakes and
    // stays ahead. Either alone is wrong in a different direction.
    expect(stats).toMatch(/greatest\(/);
    expect(stats).toMatch(/verdict_reached_anon/);
    expect(stats).toMatch(/count\(distinct if\(event = 'verdict_reached', distinct_id, null\)\)/);
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
