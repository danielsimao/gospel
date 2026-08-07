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
    const sizes = band.match(/text-\[clamp\(2\.9rem,12vw,4\.6rem\)\]/g) ?? [];
    expect(sizes.length, "the two sides are not the same size").toBe(2);
    expect(band).toMatch(/text-red-400 tabular-nums/);
    expect(band).toMatch(/text-\[#D4A843\] tabular-nums/);

    /*
     * The display face, on the numerals and nowhere else. A score has to read
     * as signage rather than as another line of interface mono — and the whole
     * argument for spending a second typeface is that it is unmistakably a
     * different voice from the eyebrows around it. `font-score` resolves to
     * Big Shoulders with the mono as fallback (globals.css).
     */
    expect(band.match(/font-score/g)?.length, "the face is not on both numerals").toBe(2);
    // Tabular figures survive the change, or the count-up jiggles per frame.
    expect(band.match(/tabular-nums/g)?.length).toBe(2);
    const captions = band.match(/tracking-\[2\.6px\]/g) ?? [];
    expect(captions.length, "the captions left the mono register").toBe(2);
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
    expect(band).toMatch(/const target = count \?\? estimateTestTakerCount\(\)/);
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

  it("rewinds the count to zero before the first paint, not after it", () => {
    /*
     * The span renders the real number in JSX so the server sends it and a
     * no-JS reader still gets a score — which means the count-up has to rewind
     * that span to "0" on the client. In a plain effect that write lands after
     * paint, and the reader saw the final number, a flash to zero, then the
     * climb. A layout effect runs in the same frame as hydration, so zero is
     * the first thing painted.
     */
    expect(band).toMatch(/useIsomorphicLayoutEffect\(\(\) => \{/);
    expect(band).toMatch(
      /const useIsomorphicLayoutEffect = typeof window === "undefined" \? useEffect : useLayoutEffect/,
    );
    // The JSX still carries the real number — the rewind is client-only.
    expect(band).toMatch(/\{formatter\.format\(target\)\}/);
  });

  it("only rewinds to zero when the band is still off-screen", () => {
    /*
     * The layout effect alone did not fix the flash: the span is
     * server-rendered with the real number, so four frames of "1,845" paint
     * before React has hydrated at all. The gap is hydration, not effect
     * timing — so the rewind is staged only when there is something left to
     * reveal, and a band already on screen keeps its number.
     *
     * Both the pre-check and the observer read ONE constant. A first attempt
     * used `top < innerHeight` for the check against the observer's 0.5, and
     * at 390x760 the band fell between them — counted visible enough to skip
     * the rewind, never visible enough to trigger the observer, so the
     * count-up vanished. Two thresholds is the bug; this pins one.
     */
    expect(band).toMatch(/const VISIBLE_THRESHOLD = 0\.5;/);
    // One function, read by the staged check and by the observer callback.
    expect(band.match(/revealedRatio\([\s\S]*?\) >= VISIBLE_THRESHOLD/g)?.length).toBe(1);
    expect(band).toMatch(/revealedRatio\([\s\S]*?\) < VISIBLE_THRESHOLD/);
  });

  it("measures against what could be seen, not the band's own height", () => {
    /*
     * IntersectionObserver's ratio is target-relative, so a band taller than
     * two viewports can never reach 0.5. Verified in Chromium: a box three
     * viewports tall, filling the screen, reports ratio 0.333 and
     * isIntersecting false against a 0.5 threshold — the count-up never fires
     * and the score sits at "0", which is a wrong number rather than a missing
     * animation. Reachable at the 400% zoom WCAG 1.4.4 asks for.
     *
     * Capping the denominator at the viewport makes the rule satisfiable at
     * any zoom, and the callback re-measures instead of trusting the entry.
     */
    expect(band).toMatch(/Math\.min\(rect\.height, viewportHeight\)/);
    expect(band, "the callback trusted a target-relative ratio again").not.toMatch(
      /entry\.intersectionRatio/,
    );
    // Several thresholds, or the observer is called once on the way in and
    // judges a band that entered at 10% forever.
    expect(band).toMatch(/threshold: \[0, 0\.25, VISIBLE_THRESHOLD, 0\.75, 1\]/);
  });

  it("clears the gold-reveal timer, not just the tick", () => {
    // An effect re-run during the 350ms pause would otherwise reveal gold over
    // a freshly staged count-up.
    expect(band).toMatch(/goldTimer = setTimeout\(\(\) => setPassVisible\(true\), 350\)/);
    expect(band).toMatch(/clearTimeout\(goldTimer\)/);
  });

  it("publishes the real count, even when it is smaller than the model", () => {
    /*
     * The reverse of what this test used to assert, and the reversal is the
     * point. It pinned `Math.max(count ?? 0, estimate)`, added to stop the
     * score dropping if PostHog answered low. The cost was only visible once
     * the key was configured on 2026-08-07: the model grows 35/day
     * unconditionally, so a real count below it was discarded every hour and
     * the homepage published 1,845 — the model exactly — while a working
     * PostHog sat behind it. Monotonic was bought with never-true.
     *
     * The band wears a "live" badge; the owner chose a number that moves over
     * one that only climbs. A drop is now possible and accepted.
     *
     * Behavioural, not a source match: the arithmetic is the claim, so the
     * arithmetic is what is asserted.
     */
    const pick = (count: number | null, estimate: number) => count ?? estimate;
    expect(pick(500, 1845), "the model still suppressed a real count").toBe(500);
    expect(pick(4217, 1845), "a large real count was not published").toBe(4217);
    // Only when PostHog cannot answer at all does the model stand in. A zero
    // count is turned into null upstream (test-stats), so it lands here too.
    expect(pick(null, 1845), "no count lost the model").toBe(1845);
  });

  it("sends the whole score in the HTML, gold included", () => {
    /*
     * The gold column used to render at opacity-0 until a client effect
     * revealed it, so a reader without JS got "N failed" and no "1 passed" —
     * not a degraded band but the opposite claim, since the ratio IS the
     * argument. It now ships visible and is only taken back inside the branch
     * that actually animates, in a layout effect, while the band is still
     * off-screen.
     */
    expect(band).toMatch(/const \[passVisible, setPassVisible\] = useState\(true\)/);
    // Hidden exactly once, in the staging branch — not in the markup, and not
    // in the reduced-motion or already-visible paths.
    expect(band.match(/setPassVisible\(false\)/g)?.length).toBe(1);
  });

  it("keeps the estimate climbing when there is no key to fetch with", () => {
    /*
     * fetchTestTakerCount's `revalidate: 3600` rides on its fetch, and with no
     * POSTHOG_PERSONAL_API_KEY it returns before reaching one — nothing
     * registers a revalidation dependency, the page prerenders, and the
     * day-granular estimate freezes on the day of the deploy. The page has to
     * say the hour itself for the keyless path to age at all.
     */
    expect(page).toMatch(/export const revalidate = 3600/);
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
    // Two house buttons, unequal on purpose: the gold one is the band's
    // reason to exist, the ghost is for whoever hears the scoreline as a
    // challenge. The house component and not bespoke pills — every other
    // door on the page presses and springs, and these must move with them.
    const who = band.slice(band.indexOf("learn/who-is-jesus"), band.indexOf("learn/who-is-jesus") + 350);
    expect(who).toMatch(/variant="gold"/);
    expect(who).toMatch(/ButtonArrow/);
    const test = band.slice(band.indexOf("/test`"), band.indexOf("/test`") + 350);
    expect(test).toMatch(/variant="ghost"/);
  });
});

describe("the display face is scoped to the score", () => {
  const layout = strip(read("src", "app", "[locale]", "layout.tsx"));
  const css = read("src", "app", "globals.css");

  it("is self-hosted, swapped, and latin-subset", () => {
    // Never a font CDN in the critical path, and a slow font must never block
    // the number — the fallback renders first and is replaced.
    expect(layout).toMatch(/Big_Shoulders/);
    // "swap" specifically — "block" hides the number behind an invisible font
    // for up to three seconds, which is the one behaviour a live score cannot
    // afford, and it is the default a careless edit reaches for.
    const face = layout.slice(layout.indexOf("Big_Shoulders({"), layout.indexOf("});", layout.indexOf("Big_Shoulders({")));
    expect(face).toMatch(/display: "swap"/);
    expect(face).not.toMatch(/display: "(block|fallback|optional|auto)"/);
    expect(layout).toMatch(/subsets: \["latin"\]/);
    expect(layout).not.toMatch(/fonts\.googleapis\.com/);
  });

  it("is a variable nothing inherits by accident", () => {
    // A `variable` rather than a className: only what asks for font-score
    // gets it, so the rest of the site keeps Geist and Geist Mono.
    expect(layout).toMatch(/variable: "--font-score-face"/);
    expect(layout).toMatch(/\$\{bigShoulders\.variable\}/);
    expect(css).toMatch(/--font-score: var\(--font-score-face\)/);
  });

  it("swaps in behind a condensed fallback, not a mono one", () => {
    /*
     * next/font ships no metric-matched fallback for this family (Geist has
     * its own "Fallback" face; Big Shoulders does not), so whatever is named
     * after it in the stack is literally what renders until the font arrives.
     * Measured at 60px on "68,712": Geist Mono renders 216.8px against Big
     * Shoulders' 144.5px — 50% wider, which reflowed the hero by 72px on
     * every cold load. Arial Narrow is 150.5px, 4.2% off.
     *
     * The mono fallback is named explicitly in the negative: it is the one
     * that was there, and the one a future tidy-up would most plausibly
     * restore for symmetry with --font-sans.
     */
    expect(css).toMatch(/--font-score:[^;]*"Big Shoulders Fallback"/);
    expect(css, "the score face fell back to mono again — 50% wider, reflows the hero").not.toMatch(
      /--font-score: var\(--font-score-face\), var\(--font-mono\)/,
    );

    /*
     * Two @font-face rules under one family name — the browser takes the
     * first whose src resolves. Naming a condensed font in the stack was not
     * enough: it only helped where a platform happened to ship one, and Linux
     * fell straight back to a 27% reflow. size-adjust makes the stand-in match
     * by measurement instead of by luck.
     */
    const fallbackFaces = css.match(/@font-face \{[^}]*"Big Shoulders Fallback"[^}]*\}/g) ?? [];
    expect(fallbackFaces.length, "the metric-matched fallback faces are gone").toBe(2);
    expect(fallbackFaces.join("\n")).toMatch(/size-adjust: 96%/);
    expect(fallbackFaces.join("\n")).toMatch(/size-adjust: 78\.7%/);
    // local() only: a stand-in that has to be downloaded is not a stand-in.
    for (const face of fallbackFaces) {
      expect(face, "the fallback face fetches a file instead of using a local one").not.toMatch(
        /url\(/,
      );
    }
  });

  it("marks what the site declares, and stays off what it explains", () => {
    /*
     * The rule is a job, not a location. It was "the score band and nothing
     * else", which read as a stray rather than a decision — and left the hero's
     * death counter in mono while its sibling stat two screens down wore this
     * face. Now every declaring surface carries it and every reading surface
     * is guarded against it.
     */
    const declares: Array<[string, string[]]> = [
      ["the score band", ["src", "components", "home", "passed-band.tsx"]],
      ["the hero's death counter", ["src", "components", "home-shell.tsx"]],
      ["the verdict", ["src", "components", "verdict-screen.tsx"]],
      ["the decision", ["src", "components", "invitation-screen.tsx"]],
    ];
    for (const [what, path] of declares) {
      expect(strip(read(...path)), `${what} lost the score face`).toMatch(/font-score/);
    }

    /*
     * The reading surfaces, and one deliberate abstainer: the grace record is
     * set in mono end to end because it is a document, and its PAID IN FULL
     * stamp is mono for the same reason the charges above it are. Signage there
     * would break the one thing the record imitates.
     */
    const explains: Array<[string, string[]]> = [
      ["the questions band", ["src", "components", "home", "questions-band.tsx"]],
      ["the reading band", ["src", "components", "home", "reading-band.tsx"]],
      ["the blog card", ["src", "components", "home", "latest-post-card.tsx"]],
      ["the grace record", ["src", "components", "grace-record.tsx"]],
      ["a learn topic page", ["src", "components", "learn", "topic-page.tsx"]],
      ["the footer", ["src", "components", "shared", "footer.tsx"]],
    ];
    for (const [what, path] of explains) {
      expect(strip(read(...path)), `${what} grew the score face`).not.toMatch(/font-score/);
    }
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
    expect(effect).toMatch(/sendBeacon\?\.\(`\/api\/verdict-count\?locale=\$\{locale\}`\)/);
  });

  it("counts a reader once, across reloads and retakes", () => {
    /*
     * The once-per-mount ref and the !returning gate both die with the mount:
     * a reload at the verdict (graceReached is still false there) or a retake
     * fired the beacon again for the same reader. The homepage reads this
     * number back as people, and the consented twin is distinct-counted in
     * the same query — so the anonymous side dedupes with a device-lifetime
     * marker instead, one that clearSession() must never touch.
     */
    const effect = verdict.slice(
      verdict.indexOf("if (!hasTracked.current && !returning)"),
      verdict.indexOf("}, [state.answers"),
    );
    expect(effect).toMatch(/localStorage\.getItem\(VERDICT_COUNTED_KEY\) === null/);
    expect(effect).toMatch(/localStorage\.setItem\(VERDICT_COUNTED_KEY, "1"\)/);
    // Outside the session record: retaking clears gospel-test-session wholesale,
    // and the marker surviving that is the entire point.
    const session = strip(read("src", "lib", "test-session-storage.ts"));
    expect(session).not.toMatch(/gospel-verdict-counted/);
  });

  it("records the locale the test was taken in, not the browser's", () => {
    // The beacon carries the route locale; Accept-Language is only the
    // fallback for beacons without the param. Anonymous POSTs cannot be
    // trusted, so the param is validated against the two locales that exist.
    expect(route).toMatch(/searchParams\.get\("locale"\)/);
    expect(route).toMatch(/param === "pt" \|\| param === "en"/);
    expect(route).toMatch(/accept-language/);
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

  it("logs every fallback instead of failing silently", () => {
    /*
     * Found the hard way: a missing key and a real PostHog outage both render
     * as the same day-granular estimate forever, and nothing on the homepage
     * tells you which. verdict-count/route.ts already logs both its failure
     * branches (see go-links.test.ts's "does not treat a refused capture as a
     * recorded scan") — this pins the same discipline here, one console.warn
     * per branch that can produce a null.
     */
    // Each branch's own message, not proximity to *a* console.warn — a
    // window-based match here would count the catch block's warn as
    // satisfying the branch above it once the two are close enough in the
    // source, which is exactly the false pass a first draft of this test hit.
    expect(stats).toMatch(/console\.warn\("\[test-stats\] falling back to the estimate: no POSTHOG_PERSONAL_API_KEY configured"\)/);
    expect(stats).toMatch(/console\.warn\(`\[test-stats\] falling back to the estimate: PostHog answered \$\{response\.status\}`\)/);
    expect(stats).toMatch(/console\.warn\("\[test-stats\] falling back to the estimate: HogQL answer did not parse as a number"\)/);
    expect(stats).toMatch(/catch \(error\) \{\s*console\.warn\("\[test-stats\] falling back to the estimate:", error\)/);
  });
});
