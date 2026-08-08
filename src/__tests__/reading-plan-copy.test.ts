import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The reading plan does not tell a reader they are saved.
 *
 * The plan is discipleship copy, and it was written as if only a believer
 * would ever open it. Day 2 said, flatly, "That's what happened when you
 * trusted Christ — you were born again." Day 6 opened "The Christian life
 * isn't about trying harder… Your job is to abide."
 *
 * Both are false for most of the people who can actually reach the page:
 *
 * - `/reading-plan` is a public, indexed route in the sitemap. Anyone can
 *   arrive from a search engine having never taken the test.
 * - The THINKING track at `/next-steps` links to it by design — a reader who
 *   explicitly did not commit.
 * - The learn hub and topic-nav completion CTAs point at it for any reader who
 *   finishes a topic, including a pure visitor.
 * - The homepage band shows it to `undecided`, `thinking` and `dismissed` —
 *   `dismissed` being a reader who was offered the decision and declined.
 *
 * Telling that reader they were born again is the decisionism the method
 * exists to prevent, arriving from the opposite direction: not "pray this and
 * you're saved", but "you already are". METHOD.md keeps commitment copy
 * conditional and pointed at Christ, and the app already models the form —
 * `home.journeyStages.committed.heading` says "If you've repented and trusted
 * in Christ, God has forgiven you", not "God has forgiven you".
 *
 * So the rule these pin: where the plan speaks about the reader's own standing
 * before God, it stays conditional. It may still say the thing plainly — the
 * conditional is not a hedge and must not soften the necessity — it simply
 * may not assume the answer.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const read = (...p: string[]) => JSON.parse(readFileSync(join(ROOT, ...p), "utf8"));
const en = read("src", "messages", "en.json");
const pt = read("src", "messages", "pt.json");

/**
 * Claims about the reader's standing that may never stand unconditioned.
 *
 * Each needs a conditional governing it in the same string. Kept as pairs so a
 * failure names the claim and the missing condition rather than a regex.
 */
const GOVERNED = [
  {
    locale: "en",
    plan: en.readingPlan,
    claims: [/you were born again/i, /your job is to abide/i],
    conditions: [/\bif you have\b/i, /\bif you are\b/i, /\bif you haven't\b/i, /\bif you're\b/i],
  },
  {
    locale: "pt",
    plan: pt.readingPlan,
    claims: [/nasceste de novo/i, /o teu trabalho é permanecer/i],
    conditions: [/\bse confiaste\b/i, /\bse estás\b/i, /\bse ainda não\b/i],
  },
] as const;

describe("the reading plan's copy", () => {
  it("never states the reader's new birth as settled fact", () => {
    for (const { locale, plan, claims, conditions } of GOVERNED) {
      for (const [i, day] of plan.days.entries()) {
        for (const field of ["reflection", "prayer"] as const) {
          const text: string = day[field];
          for (const claim of claims) {
            if (!claim.test(text)) continue;
            expect(
              conditions.some((c) => c.test(text)),
              `${locale} day ${i + 1} ${field} asserts "${claim.source}" with no condition governing it — ` +
                "a dismissed or undecided reader can reach this page. See the file header.",
            ).toBe(true);
          }
        }
      }
    }
  });

  it("keeps the two days that were rewritten conditional, by name", () => {
    // Belt to the braces above: the scan only fires when a claim phrase is
    // present, so rewording a claim out of the list would silently retire it.
    // These two are the ones that shipped wrong, pinned individually.
    for (const [locale, plan] of [
      ["en", en.readingPlan],
      ["pt", pt.readingPlan],
    ] as const) {
      const born = plan.days[1];
      const vine = plan.days[5];
      expect(`${born.reflection} ${born.prayer}`, `${locale} day 2 lost its condition`).toMatch(
        locale === "en" ? /\bif you (have|haven't)\b/i : /\bse (confiaste|ainda não)\b/i,
      );
      expect(`${vine.reflection} ${vine.prayer}`, `${locale} day 6 lost its condition`).toMatch(
        locale === "en" ? /\bif you are\b|\bif i am\b/i : /\bse estás\b|\bse ainda não\b/i,
      );
    }
  });

  it("still says the necessity plainly — the condition is not a softener", () => {
    /*
     * The failure mode of a conditional rewrite is that it also becomes vague,
     * which would cost the plan the thing the method needs most. Day 2 must
     * still tell the reader a new birth is required, not merely available.
     */
    expect(en.readingPlan.days[1].reflection).toMatch(/must have|need/i);
    expect(pt.readingPlan.days[1].reflection).toMatch(/tens de ter|precisa/i);
  });
});
