import { describe, it, expect, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  fetchTestTakerCount,
  fetchRecentVerdicts,
  estimateTestTakerCount,
  ESTIMATE_BASE,
  ESTIMATE_PER_DAY,
  LEDGER_CITY_MIN,
  LEDGER_ROWS,
  LEDGER_WINDOW_DAYS,
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
const ledger = strip(read("src", "components", "home", "verdict-ledger.tsx"));
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

  it("gives the band one door, and keeps the test as a quiet line", () => {
    /*
     * Two buttons of similar weight split the band's question in two — and
     * the ask directly above this band already IS the test's entry (question
     * 1 answers on the homepage). So gold owns the band, and the test door
     * demotes to the underlined sentence-case line the journey stages use for
     * retake. It must never grow back into a competing button.
     */
    const who = band.slice(band.indexOf("learn/who-is-jesus"), band.indexOf("learn/who-is-jesus") + 350);
    expect(who).toMatch(/variant="gold"/);
    expect(who).toMatch(/ButtonArrow/);
    const test = band.slice(band.indexOf("/test`"), band.indexOf("/test`") + 350);
    expect(test).toMatch(/underline decoration-white\/15/);
    expect(test, "the test door grew back into a button").not.toMatch(/<Button|variant=/);
  });

  it("draws the verdict as a bar: a wall of red, one gold stroke", () => {
    /*
     * The tally texture's own documented idea — "the single gold stroke is
     * drawn in code on top, so the count stays honest" (PROMPTS.md §1) —
     * promoted from background to instrument. The stroke breathes on the LIVE
     * pulse and holds still, visible, under reduced motion.
     */
    expect(band).toMatch(/from-red-400\/50 to-red-400\/25/);
    const stroke = band.slice(band.indexOf("from-red-400/50"), band.indexOf("from-red-400/50") + 400);
    expect(stroke).toMatch(/bg-\[#D4A843\]/);
    expect(stroke).toMatch(/animate-pulse motion-reduce:animate-none/);
  });

  it("keeps the caption's count in step with the numeral", () => {
    /*
     * The bar caption restates the live count in words — a second copy of a
     * number that moves. Every path that writes the numeral goes through one
     * function that writes both, or the band contradicts itself in one
     * breath: the score climbing while the sentence below it holds the old
     * figure.
     */
    expect(band).toMatch(/const writeCount = \(value: string\) => \{/);
    // Exactly one numeral write — writeCount's own — so no path can update
    // the score without the caption hearing about it.
    expect(band.match(/el\.textContent =/g)?.length, "a numeral write bypasses the caption").toBe(1);
    expect(band).toMatch(/captionCountRef/);
    // The caption is template-driven, so the locales control the wording.
    expect(band).toMatch(/messages\.barCaption\.split\("\{n\}"\)/);
    for (const [locale, home] of [
      ["en", en.home],
      ["pt", pt.home],
    ] as const) {
      expect(home.passedBand.barCaption, `${locale} lost the bar caption`).toContain("{n}");
    }
    // Mono register, not the score face — and not the numerals' own tracking,
    // which the same-size test above counts exactly twice.
    const caption = band.slice(band.indexOf("barCaption"), band.indexOf("barCaption") + 300);
    expect(caption).not.toMatch(/font-score/);
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
    /* Awaited in the page, which is a server component — it was a bare
       `await fetchTestTakerCount()` until the ledger gave the page a second
       read of the same project and the two were paired into one Promise.all
       so the ledger's round trip never lands on top of the count's. What this
       pins is unchanged: the call is resolved here, on the server. */
    expect(page).toMatch(/await Promise\.all\(\[\s*fetchTestTakerCount\(\),/);
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

/**
 * The ledger — the same argument as the scoreline, with a name on the end.
 *
 * Every row above the gold one is a real verdict somebody reached. That is the
 * whole difference between this and the count above it: the count may stand in
 * a modelled rate when PostHog cannot answer (a rate, like the death counter),
 * because nobody reads "1,915" as a claim about a particular person. A row is
 * exactly that claim, so a row is never modelled, never padded and never
 * approximated — when there is no data there is no ledger, and the scoreline
 * takes the band back.
 */
describe("the ledger", () => {
  const rowsFrom = (results: unknown[][]) => {
    vi.stubEnv("POSTHOG_PERSONAL_API_KEY", "phx_test");
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ results }) })));
    return fetchRecentVerdicts();
  };

  it("shows a name, a place and a date — with the gold row last", () => {
    /*
     * The format IS the argument: "2,000 years ago" sitting in the column where
     * every row above it says minutes. Both halves have to be in the markup —
     * a ledger whose last line arrived by effect would argue only the Law to
     * anyone whose observer never fired.
     */
    expect(ledger).toMatch(/messages\.ledgerPlace/);
    expect(ledger).toMatch(/messages\.ledgerWhen/);
    // Last in the source is last on the page: the list is static order, not a
    // sort that a future edit could invert.
    expect(ledger.indexOf("messages.ledgerWhen")).toBeGreaterThan(ledger.indexOf("rows.map"));
    for (const [locale, home] of [
      ["en", en.home],
      ["pt", pt.home],
    ] as const) {
      expect(home.passedBand.ledgerPlace, `${locale} lost the gold row's place`).toBeTruthy();
      expect(home.passedBand.ledgerWhen, `${locale} lost the gold row's date`).toBeTruthy();
    }
  });

  it("reuses the scoreline's own two words for the verdicts", () => {
    // One vocabulary across both renderings. A second pair of strings for
    // "failed"/"passed" is two places for the translation to drift.
    expect(ledger).toMatch(/messages\.failedCaption/);
    expect(ledger).toMatch(/messages\.passedCaption/);
    expect(ledger, "the ledger grew its own verdict wording").not.toMatch(/rowFailed|rowPassed/);
  });

  it("is a record, so it is set in mono — no score face", () => {
    /*
     * The grace record made this call first and for the same reason: signage
     * would break the one thing a record imitates. The declaring voice stays on
     * the scoreline's two numerals, which the same-size test counts exactly
     * twice in the band next door.
     */
    expect(ledger, "the ledger took the declaring voice").not.toMatch(/font-score/);
    expect(ledger).toMatch(/font-mono/);
  });

  it("falls back to the scoreline rather than to a thinner ledger", () => {
    /*
     * A list of one is not a pattern — and it points at that one reader harder
     * than the city threshold upstream is willing to allow. Below the minimum
     * the band renders what it always rendered.
     */
    expect(band).toMatch(/const LEDGER_MIN_ROWS = 3;/);
    expect(band).toMatch(/verdicts\.length >= LEDGER_MIN_ROWS/);
    // The scoreline is still fully present — this is a branch, not a rewrite.
    expect(band).toMatch(/estimateTestTakerCount\(\)/);
    expect(band).toMatch(/<VerdictLedger/);
    // …and nothing anywhere manufactures a row to reach the minimum.
    expect(ledger, "the ledger invented rows").not.toMatch(/placeholder|sample|Math\.random/);
    expect(stats, "the ledger invented rows").not.toMatch(/estimateRecentVerdicts|fakeRow/);
  });

  it("draws the bar in the scoreline only", () => {
    // The ledger already IS a column of red with one gold under it. The bar
    // restating that immediately beneath would make the argument twice.
    expect(band).toMatch(/\{!showLedger && \(/);
    expect(ledger).not.toMatch(/from-red-400\/50/);
  });

  it("names a city only once there is a crowd to hide in", async () => {
    /*
     * k-anonymity, and the reason cities are allowed here at all. "Someone in
     * Óbidos failed, 3 minutes ago" is a sentence everyone in Óbidos can
     * resolve to a person; "Portugal" is not. The threshold is computed from
     * the data rather than from a population table, so a city earns its name.
     */
    expect(stats).toMatch(/having count\(\) >= \$\{LEDGER_CITY_MIN\}/);
    expect(LEDGER_CITY_MIN).toBeGreaterThanOrEqual(5);
    // The query blanks the city itself, so a blanked one arrives here as an
    // empty string and the row falls back to its country alone.
    const rows = await rowsFrom([
      ["2026-08-09T12:00:00Z", "Portugal", "PT", "Lisboa", "a"],
      ["2026-08-09T11:00:00Z", "Portugal", "PT", "", "b"],
    ]);
    expect(rows.map((r) => r.city)).toEqual(["Lisboa", ""]);
  });

  it("says the country in the reader's language, not in GeoIP's", () => {
    /*
     * GeoIP answers "Brazil" whoever is asking. Composing the place upstream
     * printed "São Paulo, Brazil" on a Portuguese page — the site dropping into
     * English mid-sentence — so the alpha-2 code travels instead and the
     * country is resolved per locale in the component.
     *
     * The city has no code behind it and stays as GeoIP wrote it. That is a
     * limit of the data, and the reason the half that can be said properly is.
     */
    expect(ledger).toMatch(/Intl\.DisplayNames/);
    expect(ledger).toMatch(/type: "region"/);
    expect(stats).toMatch(/properties\.\$geoip_country_code/);
    // Only a well-formed alpha-2 travels, so the component has one shape to
    // guard rather than whatever the property happened to hold.
    expect(stats).toMatch(/\/\^\[A-Z\]\{2\}\$\/\.test\(rawCode\)/);
    const codes = [
      ["BR", "en", "Brazil"],
      ["BR", "pt", "Brasil"],
      ["GB", "pt", "Reino Unido"],
    ] as const;
    for (const [code, locale, expected] of codes) {
      const named = new Intl.DisplayNames([locale === "pt" ? "pt-PT" : "en-US"], {
        type: "region",
      }).of(code);
      expect(named, `${code} in ${locale}`).toBe(expected);
    }
  });

  it("never lets one reader fill the ledger", async () => {
    /*
     * The consented event fires again on a reload at the verdict and on a
     * retake — five reloads would otherwise render as five people, which is
     * the one thing this band must not overstate. Deduped on a distinct_id
     * that is fetched and then dropped: it exists to collapse rows, and it is
     * not part of what the component receives.
     */
    const rows = await rowsFrom([
      ["2026-08-09T12:00:00Z", "Portugal", "PT", "", "same-reader"],
      ["2026-08-09T11:00:00Z", "Portugal", "PT", "", "same-reader"],
      ["2026-08-09T10:00:00Z", "Brazil", "BR", "", "other-reader"],
    ]);
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.country)).toEqual(["Portugal", "Brazil"]);
    // A place and a moment, and nothing else — no id, no ip, no coordinate.
    expect(Object.keys(rows[0]).sort()).toEqual(["at", "city", "country", "countryCode"]);
  });

  it("reads a zone-less ClickHouse timestamp as UTC, not as local time", async () => {
    /*
     * ClickHouse can answer "2026-08-09 12:34:56" — no T, no zone — and
     * new Date() reads that as LOCAL time: right by accident on a UTC server
     * and silently hours out anywhere else. An hours-wrong row is worse than a
     * missing one, because the column it lands in is the argument.
     */
    const rows = await rowsFrom([["2026-08-09 12:34:56", "Portugal", "PT", "", "a"]]);
    expect(rows[0].at).toBe("2026-08-09T12:34:56.000Z");
    // And a timestamp that cannot be parsed takes its own row out, quietly.
    expect(await rowsFrom([["not a date", "Portugal", "PT", "", "a"]])).toEqual([]);
  });

  it("asks for a bounded window and stops at the rows it shows", async () => {
    expect(stats).toMatch(/interval \$\{LEDGER_WINDOW_DAYS\} day/);
    expect(LEDGER_WINDOW_DAYS).toBeGreaterThan(0);
    const many = Array.from({ length: LEDGER_ROWS + 6 }, (_, i) => [
      `2026-08-09T1${i % 10}:00:00Z`,
      "Portugal",
      "PT",
      "",
      `reader-${i}`,
    ]);
    expect(await rowsFrom(many)).toHaveLength(LEDGER_ROWS);
  });

  it("turns every failure into no ledger, never a throw", async () => {
    // Same contract as the count: the homepage must never break because an
    // analytics vendor had a bad day. Here the cost of failing is smaller —
    // the scoreline simply keeps the band.
    vi.stubEnv("POSTHOG_PERSONAL_API_KEY", "phx_test");
    for (const impl of [
      async () => ({ ok: false, json: async () => ({}) }),
      async () => ({ ok: true, json: async () => ({}) }),
      async () => ({ ok: true, json: async () => ({ results: "not an array" }) }),
      async () => ({ ok: true, json: async () => ({ results: [[null, null, null, null, null]] }) }),
      async () => ({
        ok: true,
        json: async () => ({ results: [["2026-08-09T12:00:00Z", "", "", "", "a"]] }),
      }),
      async () => {
        throw new Error("network");
      },
    ]) {
      vi.stubGlobal("fetch", vi.fn(impl));
      expect(await fetchRecentVerdicts()).toEqual([]);
    }
  });

  it("asks for nothing when there is no key to ask with", async () => {
    vi.stubEnv("POSTHOG_PERSONAL_API_KEY", "");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect(await fetchRecentVerdicts()).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("reads the consented event, because it is the only one with a place in it", () => {
    /*
     * The anonymous twin is captured with $geoip_disable and a zeroed IP on
     * purpose — that decision predates this band and is pinned by "counts
     * without anyone in the event" above. The ledger therefore shows a subset
     * of the count beside it, and the honest consequence is that it can be
     * empty while the count is large.
     */
    expect(stats).toMatch(/where event = 'verdict_reached' /);
    expect(stats, "the ledger reached for the counter that has no geography").not.toMatch(
      /verdict_reached_anon[\s\S]{0,200}geoip/,
    );
    expect(stats).toMatch(/properties\.\$geoip_country_name/);
  });

  it("resolves on the server, like the count it sits under", () => {
    // The personal key reads every event in the project; the component gets
    // rows, not the means to fetch them.
    expect(page).toMatch(/fetchRecentVerdicts\(\)/);
    expect(ledger).not.toMatch(/fetch\(|process\.env|POSTHOG/);
    expect(stats).toMatch(/revalidate: 3600/);
  });

  it("renders a date the cache cannot falsify, then lets the client say when", () => {
    /*
     * "4 minutes ago" baked into HTML that revalidates hourly is a lie forty
     * minutes later. So the SERVER renders a UTC, day-granular date — pure from
     * the timestamp, zone pinned, so hydration cannot disagree and there is
     * nothing to suppress — and the client rewrites it to the relative form
     * before paint, from the real timestamp in the datetime attribute.
     *
     * Intl does the wording rather than a hand-translated table, so Portuguese
     * gets "há 4 minutos" and "ontem" as its own idiom.
     */
    expect(ledger).toMatch(/timeZone: "UTC"/);
    expect(ledger).toMatch(/useIsomorphicLayoutEffect/);
    expect(ledger).toMatch(/Intl\.RelativeTimeFormat/);
    expect(ledger).toMatch(/dateTime=\{row\.at\}/);
    // Clamped at zero: a clock a few seconds fast must not put a verdict in
    // the future, and "0 seconds ago" is worse than "1 minute ago".
    expect(ledger).toMatch(/Math\.max\(0, now - at\)/);
    expect(ledger).toMatch(/-Math\.max\(1, minutes\)/);
    // The ageing rows are content, not motion — they keep running when a
    // reader has asked for less of it. The gold row is markup and never ticks.
    expect(ledger).toMatch(/setInterval\(write, 60_000\)/);
    expect(ledger).toMatch(/clearInterval\(timer\)/);
  });
});
