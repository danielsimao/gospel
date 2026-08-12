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

// [longitude, latitude] of major population centers for death pulse targeting
export const POPULATION_CENTERS: [number, number][] = [
  // East Asia
  [139.69, 35.68],   // Tokyo
  [121.47, 31.23],   // Shanghai
  [116.40, 39.90],   // Beijing
  [126.98, 37.57],   // Seoul
  [114.17, 22.32],   // Hong Kong
  [121.56, 25.03],   // Taipei
  [106.85, -6.21],   // Jakarta
  [100.50, 13.76],   // Bangkok
  [106.63, 10.82],   // Ho Chi Minh City
  [103.85, 1.35],    // Singapore
  // South Asia
  [77.21, 28.61],    // Delhi
  [72.88, 19.08],    // Mumbai
  [88.36, 22.57],    // Kolkata
  [80.27, 13.08],    // Chennai
  [77.59, 12.97],    // Bangalore
  [90.41, 23.81],    // Dhaka
  [67.01, 24.86],    // Karachi
  [73.06, 33.69],    // Islamabad
  // Middle East
  [51.42, 35.69],    // Tehran
  [44.37, 33.31],    // Baghdad
  [46.72, 24.71],    // Riyadh
  [36.28, 33.51],    // Damascus
  [29.01, 41.01],    // Istanbul
  // Africa
  [3.39, 6.52],      // Lagos
  [31.24, 30.04],    // Cairo
  [36.82, -1.29],    // Nairobi
  [28.05, -26.20],   // Johannesburg
  [7.49, 9.06],      // Abuja
  [32.58, 0.35],     // Kampala
  [15.27, -4.27],    // Kinshasa
  // Europe
  [-0.12, 51.51],    // London
  [2.35, 48.86],     // Paris
  [13.40, 52.52],    // Berlin
  [12.50, 41.90],    // Rome
  [37.62, 55.75],    // Moscow
  [-3.70, 40.42],    // Madrid
  // Americas
  [-73.94, 40.67],   // New York
  [-43.17, -22.91],  // Rio de Janeiro
  [-46.63, -23.55],  // Sao Paulo
  [-99.13, 19.43],   // Mexico City
  [-58.38, -34.60],  // Buenos Aires
  [-77.04, -12.05],  // Lima
  [-87.63, 41.88],   // Chicago
  [-118.24, 34.05],  // Los Angeles
];
