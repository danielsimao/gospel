import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The questions band's card row: one frame for every topic — the cover photo
 * where one shipped, the medallion on the card's own ground where one hasn't.
 * The uniform frame is the design; a covered topic and a pending one must
 * read as three cards, not two photos and an apology.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), "utf8");
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

const band = strip(read("src", "components", "home", "questions-band.tsx"));

describe("the questions band's cards", () => {
  it("branches on the same hasTopicCover every /learn page uses", () => {
    expect(band).toMatch(/import \{ hasTopicCover \} from "@\/components\/learn\/topic-cover"/);
    expect(band).toMatch(/hasTopicCover\(q\.slug\) \? \(/);
  });

  it("is one row of three columns from sm, stacked wide cards below", () => {
    /*
     * The branch decides what fills the frame, never the frame itself: one
     * <Link> shape outside the ternary, so the two card kinds cannot drift
     * apart in size, radius or border the way the old photo-tile/text-row
     * hybrid did.
     */
    expect(band).toMatch(/sm:grid-cols-3/);
    expect(band).toMatch(/aspect-\[2\.6\/1\]/);
    expect(band).toMatch(/sm:aspect-\[3\/4\]/);
    // The frame is shared: exactly one card Link, with the cover branch inside.
    expect(band.match(/<Link/g)?.length).toBe(2); // the card + the all-topics door
  });

  it("the photo card carries the covers' own asset pair and attributes", () => {
    expect(band).toMatch(/graphics\/covers\/\$\{q\.slug\}\.avif/);
    expect(band).toMatch(/graphics\/covers\/\$\{q\.slug\}\.webp/);
    expect(band).toMatch(/loading="lazy"/);
    expect(band).toMatch(/decoding="async"/);
  });

  it("the photo leans in on interaction, and holds still under reduced motion", () => {
    // Transform-only (never a repaint), the house strong ease-out, keyboard
    // parity via focus-visible, and an explicit opt-out — a hover seen tens
    // of times a day must be subtle everywhere and absent where asked.
    expect(band).toMatch(/group-hover:scale-\[1\.04\]/);
    expect(band).toMatch(/group-focus-visible:scale-\[1\.04\]/);
    expect(band).toMatch(/ease-\[var\(--ease-out-strong\)\]/);
    expect(band).toMatch(/motion-reduce:transition-none/);
  });

  it("the medallion card still resolves a real per-topic emblem", () => {
    expect(band).toMatch(/<TopicEmblem slug={q\.slug}/);
  });

  it("lifts on hover and answers back with the topic's own standfirst", () => {
    /*
     * The 2px lift is the page's shared pressable-surface move (the answer
     * rows wear the same one). The subtitle is the topic page's standfirst
     * reused — no homepage copy of its own to drift — collapsed only where a
     * hover exists AND the card is a portrait column: the media query is
     * capability, not width, so a touch tablet at desktop size keeps the
     * always-on line rather than a reveal it cannot perform.
     */
    expect(band).toMatch(/hover:-translate-y-0\.5/);
    expect(band).toMatch(/q\.subtitle/);
    expect(band).toMatch(/hover:hover\)_and_\(min-width:640px\)\]:max-h-0/);
    expect(band).toMatch(/group-hover:max-h-16/);
    expect(band).toMatch(/group-focus-visible:max-h-16/);
  });

  it("hides nothing by width — three cards reach every viewport", () => {
    /*
     * The six-question list needed a mobile cut (four of six); three cards
     * fit everywhere, so the hidden-index machinery went with the list. Its
     * return would mean the band grew past one row without the count test in
     * home-questions.test.ts being consulted.
     */
    expect(band).not.toMatch(/HOME_QUESTIONS_MOBILE|hidden sm:/);
  });
});
