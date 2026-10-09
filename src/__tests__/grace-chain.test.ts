import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Grace is a beat sequence — the verdict's instrument, in gold — and these are
 * the properties that make that safe.
 *
 * This file has pinned two mechanics before this one. First the accordion: one
 * rung open, three greyed labels, the argument visibly withheld — the Law's
 * instrument borrowed for grace. Then a scroll: everything on one long page,
 * with a tap surface laid over it. The scroll could be skimmed in three
 * flicks and about five seconds, past "That someone is Jesus Christ", and an
 * ordinary swipe landed between two movements. The beats replace both, and the
 * assertions below replace theirs rather than sit alongside them, because a
 * test describing a mechanic that no longer exists is worse than no test.
 *
 * Source assertions in the idiom of stage-css.test.ts: this is JSX and vitest
 * runs in `environment: "node"`, so there is no layout here to observe.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const grace = readFileSync(join(ROOT, "src", "components", "grace-screen.tsx"), "utf8");
const en = JSON.parse(readFileSync(join(ROOT, "src", "messages", "en.json"), "utf8"));

/** The comments narrate the mechanics that were removed and quote their names,
    so every assertion reads the file with comments stripped. */
const code = grace.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

const BEATS = (code.match(/const BEATS = \[([^\]]*)\]/)?.[1] ?? "").split(",").filter((b) => b.trim());

describe("grace is one beat at a time", () => {
  it("renders every beat as its own frame, and only the current one", () => {
    expect(BEATS.length, "the beat list is gone").toBeGreaterThan(0);
    for (let n = 0; n < BEATS.length; n++) {
      // One frame per beat, each behind its own condition — two frames for one
      // beat would put two screens' words on one screen.
      expect(code.match(new RegExp(`data-beat="${n}"`, "g")) ?? [], `beat ${n}`).toHaveLength(1);
    }
    expect(code).toMatch(/\{beat === LAST_BEAT && \(/);
    for (let n = 0; n < BEATS.length - 1; n++) {
      expect(code, `beat ${n} is not conditional`).toContain(`{beat === ${n} && (`);
    }
  });

  it("carries every movement exactly once, on five beats", () => {
    /*
     * The announcement, the courtroom (Movements I and II, the penalty and the
     * payment told in one breath, as Living Waters tells it), the payer, the
     * response with John 3:16 under it, and the record. Fewer beats, not
     * fewer words: every movement in the copy is still on a screen, and the
     * map that says which is the same one the funnel reports from.
     */
    expect(BEATS.length).toBe(5);
    const map = code.slice(code.indexOf("const MOVEMENTS_ON_BEAT"), code.indexOf("};", code.indexOf("const MOVEMENTS_ON_BEAT")));
    const carried = [...map.matchAll(/\d+: \[([\d, ]+)\]/g)].flatMap((m) => m[1]!.split(",").map(Number));
    expect(carried.sort((a, b) => a - b)).toEqual(Array.from({ length: en.grace.beats.length }, (_, i) => i));
  });

  it("tells the courtroom penalty first, then the payment, on one screen", () => {
    // METHOD.md: without the courtroom, "someone pays" has no venue — and on
    // one screen the venue is literally above the payment.
    const courtroom = code.slice(code.indexOf('data-beat="1"'), code.indexOf("</m.section>", code.indexOf('data-beat="1"')));
    const penalty = courtroom.indexOf("{problem?.headline}");
    const payment = courtroom.indexOf("{payment?.headline}");
    expect(penalty).toBeGreaterThan(-1);
    expect(payment).toBeGreaterThan(penalty);
  });

  it("keeps John 3:16, under Repent and trust, rather than cutting it", () => {
    // It is the scripture behind that movement's last sentence, and still the
    // only "perish" and "everlasting" in the flow — METHOD.md, Known gaps.
    const response = code.slice(code.indexOf('data-beat="3"'), code.indexOf("</m.section>", code.indexOf('data-beat="3"')));
    expect(response).toContain("{response?.headline}");
    expect(response).toContain("{messages.scripture}");
    expect(response.indexOf("{messages.scripture}")).toBeGreaterThan(response.indexOf("{response?.subtitle}"));
    expect(code.match(/\{messages\.scripture\}/g) ?? []).toHaveLength(1);
  });

  it("keeps no greyed rung — every beat is whole when it arrives", () => {
    // The accordion's whole vocabulary. Any of these coming back means a rung
    // is being withheld again, which is the Law's mechanic borrowed for grace.
    for (const gone of ["allBeatsRevealed", "activeIndex", "revealedCount", "PILL_DELAY_MS"]) {
      expect(code, `"${gone}" is back in grace-screen`).not.toContain(gone);
    }
  });

  it("and no scroll machinery either", () => {
    // The scroll's own vocabulary: an observer revealing sections, a hop
    // between them, a chevron saying there is more below.
    for (const gone of ["IntersectionObserver", "advanceSection", "ScrollCue", "REVEAL_SECTIONS", "svh"]) {
      expect(code, `"${gone}" is back in grace-screen`).not.toContain(gone);
    }
  });

  it("animates opacity and transform only", () => {
    // An arriving beat must never change the page's size under the reader.
    const entrances = code.slice(code.indexOf("const BEAT_ENTRANCE"), code.indexOf("const BEAT_FRAME"));
    expect(entrances.length, "could not isolate the entrances").toBeGreaterThan(0);
    expect(entrances).not.toMatch(/height|width|padding|margin|top:|left:/);
    // The frame itself only fades. A transform on it would make it the
    // containing block for the beat's fixed ground and pin that ground to the
    // frame — the dark band across the courtroom, back again.
    const frame = entrances.slice(0, entrances.indexOf("const WORDS_ENTRANCE"));
    expect(frame).toMatch(/opacity/);
    expect(frame).not.toMatch(/\by:|\bx:|scale/);
  });
});

describe("the end of grace is a brake, not a slide", () => {
  it("leaves exactly one forward control at the end, and it goes to the decision", () => {
    expect(code.match(/onClick=\{handleContinue\}/g) ?? []).toHaveLength(1);
    expect(code).toContain('dispatch({ type: "SHOW_INVITATION" })');
  });

  it("drops the tap surface and the hint on the record", () => {
    // The reader has tapped the middle of the screen for a dozen beats; on the
    // last one the middle does nothing and the way on has to be found.
    expect(code).toMatch(/\{beat < LAST_BEAT && \(\s*<button[\s\S]*?\{\.\.\.surfaceProps\}/);
    expect(code).toMatch(/hint=\{beat < LAST_BEAT \? advanceHint : null\}/);
    expect(code).toMatch(/canNext: beat < LAST_BEAT/);
  });

  it("holds the way on until the stamp has landed, by visibility and not opacity alone", () => {
    const stamp = Number(code.match(/const STAMP_DELAY_MS = (\d+)/)?.[1]);
    const wayOn = Number(code.match(/const WAY_ON_DELAY_MS = (\d+)/)?.[1]);
    expect(stamp).toBeGreaterThan(0);
    expect(wayOn).toBeGreaterThan(stamp);
    // A button at opacity 0 is an invisible click target.
    expect(code).toMatch(/recordStage === "open" \? "visible opacity-100" : "invisible opacity-0"/);
  });

  it("lands the stamp on its own, never on the reader's tap", () => {
    /*
     * docs/METHOD.md, "No decisionism": nothing may promise that a tap saves.
     * A tap that produced "Paid in full" on the reader's record would. The
     * only step to "stamped" is a timer, and the gesture handler never touches
     * the record's stage.
     */
    expect(code).not.toMatch(/setRecordStage\("stamped"\)/);
    expect(code).toMatch(/recordStage === "waiting" \? "stamped" : "open"/);
    expect(code).toMatch(/setTimeout\(\(\) => setRecordStage\(next\), delay\)/);
    const onMove = code.slice(code.indexOf("onMove: (direction, input) =>"), code.indexOf("});", code.indexOf("onMove: (direction, input) =>")));
    expect(onMove.length, "could not isolate the gesture handler").toBeGreaterThan(0);
    expect(onMove).not.toMatch(/setRecordStage/);
  });

  it("shows a returning reader their record already stamped", () => {
    // From the decision, or a beat back and forward: no second wait, no second
    // strike — as the decision screen does for a reader returning to an answer.
    expect(code).toMatch(/if \(target === LAST_BEAT\) setRecordStage\(firstTime \? "waiting" : "open"\)/);
  });
});

describe("re-reading: the dots go back, never past", () => {
  it("lets a dot reach only a beat already reached", () => {
    expect(code).toMatch(/function jumpTo\(target: number\) \{\s*if \(target > furthest\) return;/);
    expect(code).toMatch(/const furthest = Math\.max\(reached - 1, beat\)/);
    expect(code).toMatch(/onSelect: jumpTo/);
  });

  it("opens every dot once the decision has been reached", () => {
    // The decision's "← Grace" chip lands on the first beat with the whole
    // argument a tap away — and the way back to the decision two taps away.
    expect(code).toMatch(/const reached = state\.invitationReached \? BEATS\.length : clampReached\(/);
  });

  it("clamps the persisted count before trusting it", () => {
    // It comes out of storage. Past the end it would open beats nobody has
    // seen; corrupted it could be anything.
    expect(code).toMatch(/Math\.min\(Math\.max\(Math\.trunc\(count\) \|\| 0, 0\), BEATS\.length\)/);
  });

  it("names the dots with strings that already exist, one per beat", () => {
    const navigation = code.slice(code.indexOf("navigation={{"));
    const labels = ["messages.label", "problem?.label", "payer?.label", "response?.label", "messages.record.eyebrow"];
    for (const label of labels) {
      expect(navigation, `${label} no longer names a dot`).toContain(label);
    }
    expect(labels).toHaveLength(BEATS.length);
  });

  it("starts every arrival at the announcement", () => {
    expect(code).toMatch(/const \[beat, setBeat\] = useState\(0\)/);
  });
});

describe("the funnel still reports", () => {
  it("reports a movement the first time it is reached, and never again", () => {
    // In the handler, not an effect: "first time" is a fact about the moment
    // of arriving, and an effect that runs twice would decide it twice.
    const goTo = code.slice(code.indexOf("function goTo("), code.indexOf("function jumpTo("));
    expect(goTo).toMatch(/const firstTime = target >= reached;/);
    expect(goTo).toMatch(/if \(firstTime\) \{[\s\S]*for \(const movement of MOVEMENTS_ON_BEAT\[target\] \?\? \[\]\) trackGraceBeatRevealed\(movement\)/);
    expect(goTo).toMatch(/dispatch\(\{ type: "REVEAL_GRACE_BEAT", count: target \+ 1 \}\)/);
  });

  it("reports the four movements, and the courtroom reports two", () => {
    // `grace_beat_revealed` keeps its four indices, so the funnel stays
    // comparable with what was measured before the courtroom was merged.
    expect(code).toMatch(/1: \[0, 1\],\s*2: \[2\],\s*3: \[3\],/);
  });

  it("counts a tap only when it was a tap that moved the reader on", () => {
    expect(code).toMatch(/goTo\(beat \+ 1\);\s*if \(input === "tap"\) trackGraceTapAdvance\(\)/);
  });

  it("measures how far in the reader got, now that there is no scroll depth", () => {
    expect(code).toMatch(/trackGraceViewed\(Date\.now\(\) - start, Math\.round\(\(deepest\.current \/ LAST_BEAT\) \* 100\)\)/);
  });
});
