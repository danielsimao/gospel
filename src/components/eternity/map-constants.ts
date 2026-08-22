export const GEO_URL = "/data/world-110m.json";

/**
 * 1.8 deaths/sec — the figure the page states in words (home-shell's RATE_CARDS:
 * 1.8/sec, 108/min, 6,500/hr, 155,000/day). The pings illustrate that number, so
 * this is the one thing here that must not drift from it.
 */
export const MEAN_PING_GAP_MS = 556;

/**
 * How long to wait before the next death.
 *
 * Deaths are a Poisson process: independent events at a constant average rate,
 * with no memory of each other. The gaps between them are therefore
 * exponentially distributed — mostly shorter than the mean, with a long tail of
 * quiet. Simulated: median ~387ms against the ~556ms mean, 10% of gaps under
 * 60ms, 1% over 2.5s. On screen that is clumps and lulls instead of a tick —
 * with a 2.5s ping life the count alive at once wanders between 1 and ~12
 * rather than sitting on 4-5.
 *
 * Both callers previously used setInterval, which is the one property real
 * deaths certainly do not have: a perfectly even beat reads as a machine keeping
 * time rather than as events happening to people. The rate is unchanged.
 *
 * `1 - Math.random()`, not `Math.random()`: Math.random() can return exactly 0,
 * and -mean * log(0) is Infinity — a ping chain that schedules its next tick
 * past the heat death of the universe and never fires again. Shifting the draw
 * into (0, 1] makes that unreachable. Guarded in map-pings.test.ts, because it
 * is exactly the kind of "redundant" -1 a later reader deletes.
 */
export function nextPingDelayMs(mean = MEAN_PING_GAP_MS): number {
  return -mean * Math.log(1 - Math.random());
}

/**
 * Where the deaths land, and how often each place is chosen.
 *
 * Re-exported from the generated table: 81 points carrying a share of world
 * deaths apiece, covering 92.6% of them. See death-centers.generated.ts and the
 * sourced figures it is built from in docs/data/deaths-by-country.json.
 *
 * This replaced a hand-picked list of 44 cities drawn uniformly at random,
 * which gave every city an equal share of the world's dying — Singapore as much
 * as Shanghai. Weighted, Singapore takes 0.05% against Shanghai's 9.58%; under
 * uniform both took 2.3%. The old list also had no point at all in Ethiopia,
 * the Philippines, Ukraine or Myanmar, which together bury over 2 million
 * people a year.
 *
 * What this does NOT claim: that deaths happen in city centres. Roughly half
 * the world is rural and mortality skews rural and older in most high-death
 * countries, but there is no sourced metro-level mortality to place them with,
 * and a country's share is simply split evenly across whichever of its points
 * are listed. Each point is an anchor for a country's mortality, not an
 * assertion about a city. The jitter below spreads a ping ~55km around it.
 */
export { DEATH_CENTERS } from "./death-centers.generated";
export type DeathCenter = readonly [number, number, number];

/**
 * Choose a place for the next death, in proportion to how many people actually
 * die there.
 *
 * Normalised over the pool it is given rather than over the whole table, which
 * is what lets the globe hand it only the centres currently facing the reader
 * and still get a truthful split among those.
 *
 * The trailing return is not dead code: accumulated floating-point error can
 * leave `r` a hair above the running total, and falling out of the loop must
 * yield a centre rather than undefined.
 */
export function pickWeighted<T extends DeathCenter>(pool: readonly T[]): T | undefined {
  if (pool.length === 0) return undefined;
  let total = 0;
  for (const c of pool) total += c[2];
  if (!(total > 0)) return pool[Math.floor(Math.random() * pool.length)];
  let r = Math.random() * total;
  for (const c of pool) {
    r -= c[2];
    if (r < 0) return c;
  }
  return pool[pool.length - 1];
}
