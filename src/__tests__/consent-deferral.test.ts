import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  isConsentBannerDeferred,
  setConsentBannerDeferred,
  subscribeToConsentDeferral,
} from "@/lib/consent";

/**
 * The consent banner waits while the test is in progress.
 *
 * It sat under every beat of the Law and of grace for exactly the readers
 * meeting them for the first time, and after the content it was the most
 * clickable-looking thing on those screens. It is asked on the test's landing
 * and again on whatever page follows the test. Nothing is tracked in between —
 * PostHog only starts on an answer — so what waits is the question, not the
 * reader's privacy.
 *
 * The store is plain module state and is tested as behaviour; the banner and
 * the shell are JSX, pinned in source in the idiom of bottom-inset.test.ts.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
const banner = strip(readFileSync(join(ROOT, "src", "components", "shared", "consent-banner.tsx"), "utf8"));
const shell = strip(readFileSync(join(ROOT, "src", "components", "game-shell.tsx"), "utf8"));

describe("the deferral store", () => {
  it("tells its subscribers when the banner is held and released", () => {
    const seen: boolean[] = [];
    const unsubscribe = subscribeToConsentDeferral(() => seen.push(isConsentBannerDeferred()));
    setConsentBannerDeferred(true);
    setConsentBannerDeferred(false);
    unsubscribe();
    setConsentBannerDeferred(true);
    setConsentBannerDeferred(false);
    expect(seen).toEqual([true, false]);
  });

  it("does not notify for a value it already holds", () => {
    let calls = 0;
    const unsubscribe = subscribeToConsentDeferral(() => calls++);
    setConsentBannerDeferred(false);
    unsubscribe();
    expect(calls).toBe(0);
  });
});

describe("the banner", () => {
  it("shows only while unanswered and not held back", () => {
    expect(banner).toMatch(/useSyncExternalStore\(\s*subscribeToConsentDeferral,\s*isConsentBannerDeferred,\s*\(\) => false,?\s*\)/);
    expect(banner).toMatch(/const visible = unanswered && !deferred;/);
  });

  it("closes its reserve at once when held back, before paint", () => {
    // Deferral lands as the landing leaves; the first question must arrive with
    // its buttons where they will stay, not slide down as it fades in.
    const effect = banner.slice(banner.indexOf("useIsomorphicLayoutEffect(() => {"));
    expect(effect.slice(0, 400)).toMatch(/if \(!deferred \|\| !unanswered\) return;/);
    expect(effect.slice(0, 400)).toMatch(/setProperty\("--consent-h-timing", "0s"\)/);
    expect(effect.slice(0, 400)).toMatch(/setProperty\("--consent-h", "0px"\)/);
  });

  it("starts each showing clean, so a second showing reserves its space", () => {
    // Held back, then asked again: the first showing's release would stop the
    // second publishing its height, and its tidy-up timer would remove it.
    const measure = banner.slice(banner.indexOf("const measureBanner = useCallback("));
    const publish = measure.indexOf("const publish = ()");
    const reset = measure.indexOf("releasedRef.current = false;");
    const clear = measure.indexOf("window.clearTimeout(cleanupTimerRef.current)");
    expect(reset).toBeGreaterThan(-1);
    expect(clear).toBeGreaterThan(-1);
    expect(reset).toBeLessThan(publish);
    expect(clear).toBeLessThan(publish);
  });
});

describe("the test shell", () => {
  it("holds the banner back from the first question until it unmounts", () => {
    expect(shell).toMatch(/useIsomorphicLayoutEffect\(\(\) => \{\s*setConsentBannerDeferred\(state\.phase !== "landing"\);\s*\}, \[state\.phase\]\);/);
    expect(shell).toMatch(/useEffect\(\(\) => \(\) => setConsentBannerDeferred\(false\), \[\]\);/);
  });
});
