import { describe, it, expect, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DEATH_CENTERS,
  MEAN_PING_GAP_MS,
  nextPingDelayMs,
  pickWeighted,
} from "@/components/eternity/map-constants";

/**
 * The death pings' cadence.
 *
 * The homepage states 1.8 deaths/sec in words; the pings on the globe
 * illustrate that number. Two things therefore have to hold, and neither is
 * self-evident from reading the function:
 *
 *   - the average must not drift from the figure the copy commits to, and
 *   - the gaps must stay drawn per-ping rather than ticked, because a perfectly
 *     even beat reads as a machine keeping time rather than as events.
 *
 * The draw is `-mean * log(1 - Math.random())`. Its one sharp edge is that
 * `1 - x`: Math.random() can return exactly 0, and log(0) is -Infinity, so
 * dropping the shift yields a chain that schedules its next ping at Infinity
 * and silently never fires again. That is a one-character "simplification" away
 * at all times, so it is pinned below with a stub rather than left to luck —
 * unstubbed, the case arises about once in 2^53 draws.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), "utf8");
/*
 * Comments stripped before the source assertions below, per graphics.test.ts.
 * Not cosmetic: the first draft of the setInterval guard failed on the word
 * "setInterval" appearing in the comment that explains why it was removed.
 */
const strip = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

/** Deterministic PRNG, so the statistical assertions cannot flake. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("the gap between deaths", () => {
  it("never schedules a ping that cannot arrive", () => {
    // The whole reason for `1 - Math.random()`. With a bare Math.random() this
    // is Infinity and the ping chain stops for good.
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(Number.isFinite(nextPingDelayMs())).toBe(true);
  });

  it("never goes backwards, whatever the draw", () => {
    for (const u of [0, 0.25, 0.5, 0.75, 0.999999]) {
      vi.spyOn(Math, "random").mockReturnValue(u);
      const gap = nextPingDelayMs();
      expect(Number.isFinite(gap), `u=${u} produced ${gap}`).toBe(true);
      expect(gap).toBeGreaterThanOrEqual(0);
    }
  });

  it("is exponential, not uniform — half the gaps fall under ln2 of the mean", () => {
    /*
     * The signature of a Poisson process, and what separates this from jitter
     * around a fixed interval: the median sits at mean * ln2 (~385ms), well
     * below the mean, with a long tail making up the difference. A uniform
     * jitter would put the median at the mean.
     */
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    expect(nextPingDelayMs()).toBeCloseTo(MEAN_PING_GAP_MS * Math.LN2, 6);
  });

  it("holds 1.8/sec on average and keeps real spread around it", () => {
    const rand = mulberry32(20260812);
    vi.spyOn(Math, "random").mockImplementation(rand);

    const gaps = Array.from({ length: 200_000 }, () => nextPingDelayMs());
    const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    // Within 1% of the stated rate. The sample mean's own sd here is ~1.2ms.
    expect(mean).toBeGreaterThan(MEAN_PING_GAP_MS * 0.99);
    expect(mean).toBeLessThan(MEAN_PING_GAP_MS * 1.01);

    /*
     * Spread, asserted as a floor rather than a shape: a fixed interval — the
     * thing this replaced — has an sd of exactly 0, and for an exponential the
     * sd equals the mean. Anything that collapses the draw back toward a beat
     * fails here even if it keeps the average honest.
     */
    const variance =
      gaps.reduce((a, b) => a + (b - mean) ** 2, 0) / gaps.length;
    expect(Math.sqrt(variance)).toBeGreaterThan(MEAN_PING_GAP_MS * 0.9);

    const sorted = [...gaps].sort((a, b) => a - b);
    expect(sorted[Math.floor(gaps.length * 0.5)]).toBeLessThan(mean);
    expect(sorted[gaps.length - 1]).toBeGreaterThan(mean * 4);
  });
});

describe("the rate the pings claim", () => {
  it("matches the figure the homepage states in words", () => {
    /*
     * home-shell's RATE_CARDS print "1.8" per second as fact. The pings are
     * that number made visible, so the two are one claim in two places and must
     * not be editable apart.
     */
    const homeShell = read("src", "components", "home-shell.tsx");
    expect(homeShell).toMatch(/\{ value: "1\.8", key: "perSecond" \}/);
    expect(1000 / MEAN_PING_GAP_MS).toBeCloseTo(1.8, 2);
  });
});

describe("where the deaths land", () => {
  it("carries a coherent, normalised set of shares", () => {
    expect(DEATH_CENTERS.length).toBeGreaterThan(60);
    const total = DEATH_CENTERS.reduce((s, c) => s + c[2], 0);
    // Rounded to 6dp in the generated file, so exact equality is not available.
    expect(total).toBeCloseTo(1, 4);
    for (const [lng, lat, share] of DEATH_CENTERS) {
      expect(share).toBeGreaterThan(0);
      expect(Math.abs(lng)).toBeLessThanOrEqual(180);
      expect(Math.abs(lat)).toBeLessThanOrEqual(90);
    }
  });

  it("reaches the countries the old hand-picked list had no point in", () => {
    /*
     * Ethiopia, the Philippines, Ukraine and Myanmar bury over two million
     * people a year between them and had no point at all on the 44-city list.
     * Asserted by coordinate box rather than by name, since the generated file
     * carries the place name only as a trailing comment.
     */
    const near = (lng: number, lat: number) =>
      DEATH_CENTERS.some(
        (c) => Math.abs(c[0] - lng) < 2.5 && Math.abs(c[1] - lat) < 2.5,
      );
    expect(near(38.7, 9.0), "Addis Ababa").toBe(true);
    expect(near(120.97, 14.6), "Manila").toBe(true);
    expect(near(30.5, 50.43), "Kyiv").toBe(true);
    expect(near(96.15, 16.8), "Yangon/Naypyidaw").toBe(true);
  });

  it("no longer gives Singapore as many deaths as Shanghai", () => {
    /*
     * The distortion this table exists to remove. Uniform selection gave both
     * an identical share; by the sourced figures Shanghai's country buries
     * roughly two hundred times as many people as Singapore's.
     */
    const at = (lng: number, lat: number) =>
      DEATH_CENTERS.find(
        (c) => Math.abs(c[0] - lng) < 0.5 && Math.abs(c[1] - lat) < 0.5,
      );
    const singapore = at(103.85, 1.35);
    const shanghai = at(121.47, 31.23);
    expect(singapore, "Singapore missing").toBeDefined();
    expect(shanghai, "Shanghai missing").toBeDefined();
    if (!singapore || !shanghai) return;
    expect(shanghai[2] / singapore[2]).toBeGreaterThan(50);
  });

  it("picks in proportion to the shares, not uniformly", () => {
    const rand = mulberry32(6620);
    vi.spyOn(Math, "random").mockImplementation(rand);
    const pool = [
      [0, 0, 0.9],
      [10, 10, 0.1],
    ] as const;
    let heavy = 0;
    const N = 40_000;
    for (let i = 0; i < N; i++) if (pickWeighted(pool)?.[0] === 0) heavy++;
    expect(heavy / N).toBeGreaterThan(0.88);
    expect(heavy / N).toBeLessThan(0.92);
  });

  it("renormalises over whatever pool it is handed", () => {
    /*
     * What lets the globe pass in only the centres facing the reader. A pool
     * whose shares sum to 0.02 must still split 3:1 inside itself, not fall
     * back to uniform or return nothing.
     */
    const rand = mulberry32(99);
    vi.spyOn(Math, "random").mockImplementation(rand);
    const pool = [
      [0, 0, 0.015],
      [10, 10, 0.005],
    ] as const;
    let heavy = 0;
    const N = 40_000;
    for (let i = 0; i < N; i++) if (pickWeighted(pool)?.[0] === 0) heavy++;
    expect(heavy / N).toBeGreaterThan(0.73);
    expect(heavy / N).toBeLessThan(0.77);
  });

  it("survives the degenerate pools the globe can hand it", () => {
    expect(pickWeighted([])).toBeUndefined();
    // A pool of zero-weight entries must still yield a place, not undefined.
    const zeroed = [
      [0, 0, 0],
      [1, 1, 0],
    ] as const;
    expect(pickWeighted(zeroed)).toBeDefined();
    expect(pickWeighted([[5, 5, 1]] as const)?.[0]).toBe(5);
  });
});

describe("both surfaces draw their gaps, neither ticks", () => {
  const globe = strip(read("src", "components", "eternity", "death-globe.tsx"));
  const flat = strip(read("src", "components", "eternity", "world-map.tsx"));

  it("leaves no fixed-interval ping loop behind", () => {
    for (const [name, src] of [["death-globe", globe], ["world-map", flat]] as const) {
      expect(src, `${name} still ticks on a fixed interval`).not.toMatch(/setInterval/);
      expect(src).toMatch(/nextPingDelayMs\(\)/);
      // Neither surface may reach for an unweighted pick again.
      expect(src, `${name} picks a place uniformly`).not.toMatch(
        /Math\.floor\(Math\.random\(\) \* (pool|DEATH_CENTERS)/,
      );
      expect(src).toMatch(/pickWeighted\(/);
    }
  });

  it("keeps the globe's chain alive across a skipped ping", () => {
    /*
     * addPing returns early while the globe is off-screen or the tab is hidden.
     * The reschedule therefore has to sit in tick(), outside addPing — inside,
     * the first skipped ping would end the chain and a globe returning from a
     * background tab would come back dead. Cheap to get wrong in a refactor and
     * invisible in review, so it is pinned.
     */
    expect(globe).toMatch(
      /const tick = \(\) => \{\s*addPing\(\);\s*pingTimer = setTimeout\(tick, nextPingDelayMs\(\)\);\s*\}/,
    );
    expect(globe).toMatch(/if \(pingTimer\) clearTimeout\(pingTimer\)/);
  });

  it("tears the flat map's chain down on unmount", () => {
    expect(flat).toMatch(/return \(\) => clearTimeout\(timer\)/);
  });
});
