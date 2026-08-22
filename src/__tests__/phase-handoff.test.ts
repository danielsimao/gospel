import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The hand-off between phases, and what the decision screen is allowed to carry.
 *
 * Source assertions in the idiom of flow-column.test.ts / bottom-inset.test.ts:
 * these are framer props and JSX, and vitest runs in `environment: "node"`, so
 * there is no timeline here to observe as behaviour.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), "utf8");

/** Both files explain these decisions in prose that quotes the very tokens
    being asserted, so a deleted implementation would otherwise pass on the
    strength of its own comments. */
function code(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

const shell = code(read("src", "components", "game-shell.tsx"));
const invitation = code(read("src", "components", "invitation-screen.tsx"));
const verdict = code(read("src", "components", "verdict-screen.tsx"));

describe("the phase hand-off does not swallow the first gesture", () => {
  it("leaves faster than it arrives", () => {
    /*
     * `mode="wait"` holds the incoming phase until the outgoing one has
     * finished leaving, which makes the exit duration dead time: for its whole
     * length the next screen does not exist, so there is nothing to scroll and
     * nothing to touch.
     *
     * Measured on verdict → grace at 390×844, medians of five runs: a 0.2s exit
     * mounted grace at 224ms; a 0.09s exit mounts it at 124ms. A swipe takes
     * roughly 150–300ms, so the difference is whether the reader's first gesture
     * lands on a screen that exists. CPU throttling at 4× and 6× barely moved
     * either number — this is a wall-clock animation, not work — which is how it
     * was told apart from a slow render.
     *
     * Asserted as a relationship, not a magic number: the exit may be retuned,
     * but it must never again be as slow as the entrance.
     */
    const exitDuration = Number(
      shell.match(/exit=\{\{\s*opacity:\s*0,\s*transition:\s*\{\s*duration:\s*([\d.]+)/)?.[1],
    );
    const enterDuration = Number(
      shell.match(/transition=\{\{\s*duration:\s*([\d.]+),\s*ease:\s*EASE_OUT_STRONG\s*\}\}/)?.[1],
    );
    expect(exitDuration, "phase exit has no explicit duration").toBeGreaterThan(0);
    expect(enterDuration, "phase entrance has no explicit duration").toBeGreaterThan(0);
    expect(exitDuration).toBeLessThan(enterDuration);
    // Grace is the only screen taller than one viewport, so it is the only one
    // where this is felt. Half the entrance keeps the dead window under ~100ms.
    expect(exitDuration).toBeLessThanOrEqual(enterDuration / 2);
  });

  it("still crossfades rather than cutting", () => {
    // A zero-length exit would fix the dead window by removing the transition,
    // which is not the trade being made here.
    const exitDuration = Number(
      shell.match(/exit=\{\{\s*opacity:\s*0,\s*transition:\s*\{\s*duration:\s*([\d.]+)/)?.[1],
    );
    expect(exitDuration).toBeGreaterThanOrEqual(0.05);
  });
});

describe("a screen does not change what it is while it is leaving", () => {
  it("reads graceReached once, at mount, not on every render", () => {
    /*
     * Tapping the door dispatches SHOW_GRACE, which sets graceReached true
     * WHILE this screen is still playing its exit. When the re-read layout
     * derived from a live read of it, the departing verdict re-rendered into
     * that other mode over the door: measured at 390×844, ~115ms of the whole
     * record slammed on top of the gold question until grace mounted. The
     * layout no longer branches on the flag at all — only analytics do — but
     * the mount-time read stays pinned: "did this reader arrive having
     * already seen grace" is settled on arrival, and a live read is exactly
     * how the mid-exit flip gets reintroduced by an innocent refactor.
     */
    expect(verdict).toMatch(/const \[returning\] = useState\(state\.graceReached\)/);
    // The live read is what caused it; it must not come back in either form.
    expect(verdict).not.toMatch(/const returning = state\.graceReached/);
  });

  it("replays the sequence from the charge for a returning reader", () => {
    /*
     * Owner ruling (2026-08-15): walking back means hearing the verdict again,
     * from GUILTY, by the same taps — not consulting a transcript. Two other
     * answers shipped briefly and were rejected: a separate `showAll` document
     * (a layout the forward pass never showed, so "re-read" landed somewhere
     * unfamiliar) and an accumulating stack whose settled frame doubled as the
     * re-read (which re-staged the two-heroes failure and brightened the full
     * red record under gold's arrival). Every arrival therefore seeds beat 0,
     * unconditionally, and there is no second rendering path.
     */
    expect(verdict).toMatch(/const \[beatIndex, setBeatIndex\] = useState\(0\)/);
    expect(verdict).not.toMatch(/showAll/);
    expect(verdict).not.toMatch(/LAST_BEAT : 0/);
  });
});

describe("the flow's own walk-back is visible, and only where walking back is legal", () => {
  it("the shell shows the verdict chip on grace, and on no other phase", () => {
    /*
     * "Backwards" used to be a link at the bottom of grace's seventh viewport
     * plus an unlabelled browser gesture. The chip is the always-visible half
     * of the answer — but each absence is a rule: the Law is one-way
     * (testimony, see UNDO_ANSWER), and back from the verdict IS Exit, so a
     * second chip there would make the reader guess which "back" it meant.
     */
    const chip = shell.match(/\{state\.phase === "grace" && \([\s\S]*?<\/button>\s*\)\}/)?.[0] ?? "";
    expect(chip, "no grace-gated chip in the shell").toContain("backToVerdict");
    // Exclusivity, not just existence: exactly one render site, inside the
    // grace gate. A second chip on another phase would otherwise pass — the
    // absences above are the half of the rule a screenshot cannot pin.
    expect(shell.match(/backToVerdict/g)).toHaveLength(1);
  });

  it("shows the grace chip on the decision screen, while the decision is open", () => {
    /*
     * Owner ruling (2026-08-15): walking back from the decision, landing at
     * the top of grace, is intended — so it is named rather than left to a
     * gesture with nothing on screen to announce it. The rule this obeys is
     * where the affordance lives, not whether it exists: it is shell edge
     * chrome, in the same slot as grace's own chip, and never a fourth item in
     * the choice stack (the screen itself is pinned bare further down).
     */
    const chip =
      shell.match(/\{state\.phase === "invitation" &&[\s\S]*?<\/button>\s*\)\}/)?.[0] ?? "";
    expect(chip, "no invitation-gated chip in the shell").toContain("backToGrace");
    // Exclusivity, exactly as the verdict chip is pinned: one render site, and
    // it is this one. The two chips share a position slot — left-3/top-3.5 —
    // which is only safe because their phases cannot both be current.
    expect(shell.match(/backToGrace/g)).toHaveLength(1);
    // The slot is now the shared chassis plus the edge it holds; top-3.5 moved
    // into EDGE_CHIP when the two controls stopped being styled separately.
    expect(chip).toMatch(/\$\{EDGE_CHIP\} left-3/);
    // The same guarded walk as grace's chip, not a second way back. A chip
    // that called history.back() itself would skip the in-flight latch and
    // reinstate the double-traversal that ejected readers from /test.
    expect(chip).toMatch(/onClick=\{walkBack\}/);
  });

  it("takes the chip away the moment the response is recorded", () => {
    /*
     * A recorded response closes the book: BACK_TO_GRACE is refused by the
     * reducer and the shell unwinds its pushed history entries, so a chip
     * still up afterwards would be a labelled affordance that does nothing —
     * the one failure worse than never having offered it. The gate therefore
     * reads the response as well as the phase.
     */
    const gate =
      shell.match(/\{state\.phase === "invitation" &&[^(]*\(/)?.[0] ?? "";
    expect(gate, "the invitation chip is gated on the phase alone").toContain(
      "invitationResponse",
    );
    const reducer = code(read("src", "lib", "game-reducer.ts"));
    const backToGrace =
      reducer.match(/case "BACK_TO_GRACE":[\s\S]*?\n {4}case /)?.[0] ?? "";
    expect(backToGrace).toContain("state.invitationResponse");
  });

  it("walks back through one guarded path, shared with grace's own link", () => {
    /*
     * history.back() is asynchronous and the screen shows nothing until the
     * popstate lands, so a second impatient press queued a second traversal —
     * back past the verdict baseline and clean out of /test, from a control
     * labelled "Verdict". One in-flight walk at a time; popstate clears the
     * latch whatever entry it lands on.
     */
    expect(shell).toMatch(/function walkBack\(\)/);
    expect(shell).toMatch(/if \(backInFlightRef\.current\) return/);
    expect(shell).toMatch(/onClick=\{walkBack\}/);
    /*
     * Both halves, and this is the whole guard rather than a detail of it.
     * Checking only that the flag is READ leaves either half deletable in
     * silence: drop the arming line and the second tap sails through, drop the
     * release and the chips die permanently after one use. Both mutations were
     * applied to this file and left the entire suite green, which is what a
     * pin that cannot fail looks like.
     */
    const walkBackFn = shell.match(/function walkBack\(\)[\s\S]*?\n {2}\}/)?.[0] ?? "";
    expect(walkBackFn, "the latch is read but never armed").toContain(
      "backInFlightRef.current = true",
    );
    const popStateFn = shell.match(/function onPopState\([\s\S]*?\n {4}\}/)?.[0] ?? "";
    expect(popStateFn, "the latch is armed but never released").toContain(
      "backInFlightRef.current = false",
    );
    // The guarded path still marks the gesture link-driven and walks a real
    // history entry, so the browser stack and the reducer cannot disagree.
    expect(walkBackFn).toContain("viaLinkRef.current = true");
    expect(walkBackFn).toContain("window.history.back()");
    // One traversal site for the whole shell, now that two chips and grace's
    // own link all want one. A second `history.back()` anywhere would be a
    // second mechanism, unlatched and invisible to the popstate handler.
    expect(shell.match(/history\.back\(\)/g)).toHaveLength(1);
  });

  it("queues the post-response unwind behind a walk-back instead of stacking on it", () => {
    /*
     * The other traversal in this shell. The walk-back chip and the three
     * response buttons are gated on the same condition, so both are live on
     * the decision screen: tap "Grace", answer inside the 0.29s before the pop
     * lands, and `history.go(-depth)` went out on top of a `history.back()`
     * that had not arrived — three entries travelled where two were meant to,
     * past the verdict baseline and out of /test. The exact ejection the latch
     * above exists to prevent, through the one door that never checked it.
     */
    const unwindEffect =
      shell.match(/const had = responseRef\.current;[\s\S]*?\n {2}\}, \[state\.invitationResponse/)?.[0] ?? "";
    expect(unwindEffect.length, "the response-unwind effect moved").toBeGreaterThan(0);
    expect(unwindEffect, "the unwind no longer checks for a walk-back in flight").toContain(
      "if (backInFlightRef.current)",
    );
    expect(unwindEffect, "the deferred unwind is never queued").toContain(
      "pendingUnwindRef.current = true",
    );
    // …and popstate runs it once the pop has landed.
    const popStateFn = shell.match(/function onPopState\([\s\S]*?\n {4}\}/)?.[0] ?? "";
    expect(popStateFn, "a queued unwind is never run").toMatch(
      /if \(pendingUnwindRef\.current\) \{\s*pendingUnwindRef\.current = false;\s*unwindToBaseline\(\);/,
    );
    // One place computes the distance, so the deferred path cannot drift from
    // the immediate one.
    expect(shell.match(/window\.history\.go\(/g), "more than one unwind site").toHaveLength(1);
  });

  it("keeps depth measuring the browser, not our dispatches", () => {
    /*
     * depthRef is the distance back to the verdict baseline, and the unwind
     * multiplies it into a real traversal. It used to be assigned only on the
     * branches that dispatched, so an entry we deliberately ignored — a
     * recorded response refusing BACK_TO_GRACE — left depth one ahead of the
     * stack it claims to measure, and the unwind that followed travelled one
     * entry too far.
     */
    const popStateFn = shell.match(/function onPopState\([\s\S]*?\n {4}\}/)?.[0] ?? "";
    // Assigned once, before any dispatch decision.
    expect(popStateFn.match(/depthRef\.current = i;/g), "depth is set per-branch again").toHaveLength(1);
    const beforeBranches = popStateFn.slice(0, popStateFn.indexOf("if (backward"));
    expect(beforeBranches, "depth is synced after the branches, not before").toContain(
      "depthRef.current = i;",
    );
  });

  it("clears the link flag on the unwind's own landing too", () => {
    // The unwinding branch returned before the reset below it, so a
    // link-driven walk-back that ended in an unwind left the flag set and the
    // NEXT genuine browser press reported itself as "link".
    const popStateFn = shell.match(/function onPopState\([\s\S]*?\n {4}\}/)?.[0] ?? "";
    const unwindBranch = popStateFn.slice(
      popStateFn.indexOf("if (unwindingRef.current)"),
      popStateFn.indexOf("const via ="),
    );
    expect(unwindBranch, "the unwind landing leaks viaLinkRef").toContain(
      "viaLinkRef.current = false",
    );
  });

  it("moves focus onto the screen the reader just walked to", () => {
    /*
     * Activating a walk-back chip by keyboard walked the phase correctly and
     * dropped activeElement to <body>, so the next Tab restarted at the top of
     * the document — and the two chips this flow adds exist to trigger exactly
     * that move. A ref callback, not the phase effect: `mode="wait"` mounts the
     * incoming screen only after the outgoing one has left.
     */
    expect(shell, "the phase panel is not focusable").toMatch(/tabIndex=\{-1\}/);
    expect(shell, "nothing moves focus on a phase change").toMatch(/ref=\{focusPhasePanel\}/);
    const focusFn = shell.match(/const focusPhasePanel = useCallback\([\s\S]*?\n {2}\}, \[\]\)/)?.[0] ?? "";
    expect(focusFn, "focus scrolls the page it was told not to").toContain(
      "focus({ preventScroll: true })",
    );
    expect(focusFn, "a cold arrival is yanked out of the document's start").toContain(
      "firstPhaseMountRef.current",
    );
  });

  it("sits above grace's tap surface, or it is decoration", () => {
    /*
     * Grace's tap surface is `fixed inset-0 z-30` for most of the visit. A
     * chip below that answers no clicks for exactly as long as the reader
     * might want it — the affordance would exist and not work, which is worse
     * than its absence ever was.
     */
    const chip = shell.match(/\{state\.phase === "grace" && \([\s\S]*?<\/button>\s*\)\}/)?.[0] ?? "";
    // The z lives on the shared chassis now, so the guard follows it there —
    // and covers the exit at the same time, which sits over the same surface.
    expect(chip).toMatch(/\$\{EDGE_CHIP\}/);
    expect(
      shell.match(/const EDGE_CHIP =\s*\n?\s*"([^"]*)"/)?.[1] ?? "",
      "the edge chips dropped below grace's tap surface",
    ).toContain("z-40");
    const grace = code(read("src", "components", "grace-screen.tsx"));
    expect(grace).toMatch(/data-slot="grace-tap-surface"[\s\S]*?z-30/);
  });
});

describe("the decision's choice stack holds the decision, and nothing beside it", () => {
  it("renders no walk-back of its own", () => {
    /*
     * The rule is about place, not existence: the shell now shows a walk-back
     * chip on this phase (above), and the owner sanctioned it as edge chrome —
     * fixed at the top corner, in the slot grace's chip uses, outside the
     * column the reader is reading.
     *
     * Inside the column nothing changes. A "re-read grace" link used to sit
     * beside the eyebrow, and leaving IS already visible here — it is the third
     * response, "Not for me" — so that link was not carrying the method's
     * requirement it claimed to; it was offering retreat among the answers, on
     * the one screen whose whole design is a single choice. A walk-back ranked
     * with the three responses reads as a fourth one. Chrome does not.
     */
    expect(invitation).not.toMatch(/rereadGrace/);
    expect(invitation).not.toMatch(/onBack/);
  });

  it("is not handed a way back by the shell — and neither is grace", () => {
    /*
     * Both screens are now bare of walk-backs, which is a stronger rule than
     * the one this replaced rather than a weaker one. Grace used to carry a
     * "re-read the verdict" link beneath its Continue button; it went when the
     * chip arrived, because two controls for one destination is one too many
     * and a backward link directly under the forward CTA is retreat offered at
     * the moment of going on — the same argument that stripped the decision
     * screen, applied one screen earlier.
     *
     * The chip is not a way in for either: it renders beside these calls in the
     * shell's own chrome, never through them.
     */
    const invitationCall = shell.match(/<InvitationScreen[\s\S]*?\/>/)?.[0] ?? "";
    expect(invitationCall, "InvitationScreen is not rendered here").toContain("messages");
    expect(invitationCall).not.toContain("onBack");
    const graceCall = shell.match(/<GraceScreen[\s\S]*?\/>/)?.[0] ?? "";
    expect(graceCall, "GraceScreen is not rendered here").toContain("advanceHint");
    expect(graceCall).not.toContain("onBack");
  });
});

describe("the exit and the walk-back cannot be mistaken for each other", () => {
  /*
   * They were identical twins: same pill, same border, same size, same arrow,
   * same y, differing only by which edge they clung to — and on grace, tapping
   * the wrong one costs the reader the whole flow. Worse, the exit held back's
   * position AND back's glyph while the walk-back sat on the right.
   *
   * Now they differ on every axis at once: side, glyph, and whether they carry
   * a word. Back is left, arrowed and labelled with its destination; the exit
   * is right and an icon, which is the vocabulary for closing a layer — honest
   * because /test IS one, the (immersive) route group over the site.
   */
  it("puts back on the left and the exit on the right", () => {
    const exit = shell.match(/<Link[\s\S]*?<\/Link>/)?.[0] ?? "";
    expect(exit, "the exit link is not the first Link in the shell").toContain("backLabel");
    expect(exit).toMatch(/\$\{EDGE_CHIP\} right-3/);
    // Both chips, and nothing left on the right for them to collide with.
    expect(shell.match(/\$\{EDGE_CHIP\} left-3/g) ?? []).toHaveLength(2);
  });

  it("builds both on one chassis, so neither can drift off the other's line", () => {
    /*
     * Telling the two apart is the rule above; sharing a chassis is what keeps
     * them from telling on each other. Restyling the exit alone once left the
     * walk-back on the old padding and the old fill — a 32px control beside a
     * 22px one, in different colours, on the same line. So height, inset,
     * radius, fill and type live in one string that both spread, and the only
     * per-side classes are the edge and the padding their shapes demand.
     */
    const chassis = shell.match(/const EDGE_CHIP =\s*\n?\s*"([^"]*)"/)?.[1] ?? "";
    expect(chassis, "EDGE_CHIP is gone; the two controls are styled apart again").toBeTruthy();
    // The properties that have to agree for them to read as one system.
    for (const property of [
      "top-[calc(0.875rem+env(safe-area-inset-top))]",
      "sm:top-[calc(1rem+env(safe-area-inset-top))]",
      "h-8",
      "sm:h-9",
      "rounded-md",
      "bg-white/[0.06]",
      "border-white/10",
    ]) {
      expect(chassis, `${property} left the shared chassis`).toContain(property);
    }
    // The chips are fixed to the top edge, so a bare inset puts them under the
    // status bar on a home-screen install — the same reason the examination
    // ledger's rail carries the term.
    expect(chassis, "the chips lost their safe-area term").toContain("env(safe-area-inset-top)");
    // A height declared rather than left to padding: the exit is a square and
    // the walk-back is a pill, so their horizontal padding cannot match and
    // their heights must anyway.
    expect(chassis, "the shared height went back to being padding-derived").not.toMatch(/\bpy-/);
  });

  it("keeps the exit square while it is only an icon", () => {
    // px-2/py-1 gave a 32x22 rectangle. aspect-square against the chassis
    // height is 32 and 36 exactly -- 36 being shadcn's own icon-button size --
    // and the square is dropped only when the label is revealed, which is the
    // one moment the box is meant to be wider than it is tall.
    const exit = shell.match(/<Link[\s\S]*?<\/Link>/)?.[0] ?? "";
    expect(exit, "the collapsed exit is no longer square").toMatch(
      /exitRevealed \? "px-2\.5" : "aspect-square"/,
    );
  });

  it("gives the exit an icon where back gets an arrow and a word", () => {
    const exit = shell.match(/<Link[\s\S]*?<\/Link>/)?.[0] ?? "";
    expect(exit).toMatch(/<X\b/);
    expect(exit, "the exit wears back's glyph again").not.toMatch(/&larr;/);
    // The chips keep both, because naming the destination is their whole value.
    expect(shell).toMatch(/&larr;<\/span>\s*<span>\{messages\.test\.backToVerdict\}/);
    expect(shell).toMatch(/&larr;<\/span>\s*<span>\{messages\.test\.backToGrace\}/);
  });

  it("reveals the word on the first pointer tap, and leaves on the second", () => {
    /*
     * A bare icon on a screen whose whole surface is a button invites the
     * exploratory tap, and the thing on the other side of it is a ninety-second
     * flow with no way back into the middle. So the first pointer press only
     * names the action.
     */
    const exit = shell.match(/<Link[\s\S]*?<\/Link>/)?.[0] ?? "";
    expect(exit).toMatch(/event\.preventDefault\(\)/);
    expect(exit).toMatch(/setExitRevealed\(true\)/);
    // Rule 3: keyboard and AT skip the two-step. A keyboard activation reports
    // detail 0, so only a real pointer click is held back — the link is named
    // by aria-label and navigates on the first Enter.
    expect(exit).toMatch(/event\.detail > 0/);
    expect(exit).toMatch(/aria-label=\{messages\.test\.backLabel\}/);
  });

  it("never swallows the tap that dismisses it", () => {
    /*
     * Rule 1, and the one that decides whether this is a label or a modal. The
     * collapse listener is passive and non-capturing, so the tap that closes
     * the reveal still reaches whatever it landed on — advancing a verdict
     * beat, moving grace a section. A backdrop element, or a capturing
     * listener, would put a modal on a tap-anywhere screen: the exact seam
     * defect grace's own tap surface exists to have fixed.
     */
    expect(shell).toMatch(/document\.addEventListener\("pointerdown", onPointerDown, \{ passive: true \}\)/);
    /*
     * And it recognises its own control by data-slot, not by a ref. pointerdown
     * runs before click: a press on the X that this listener fails to place
     * collapses the reveal a moment before the click lands, so the click
     * handler sees a collapsed control and re-reveals instead of leaving. The
     * reader taps twice and goes nowhere — measured, the second tap never left
     * /test. `closest` also answers for the icon inside, which is what a thumb
     * actually hits.
     */
    expect(shell).toMatch(/closest\?\.\('\[data-slot="test-exit"\]'\)/);
    expect(shell).toMatch(/data-slot="test-exit"/);
    expect(shell, "a capturing collapse listener eats the gesture").not.toMatch(
      /"pointerdown"[^)]*capture: true/,
    );
    // Rule 2: nothing collapses it on a timer — same reasoning that keeps the
    // verdict tap-advanced rather than timed.
    const revealEffect =
      shell.match(/if \(!exitRevealed\) return;[\s\S]*?\}, \[exitRevealed\]\)/)?.[0] ?? "";
    expect(revealEffect, "the reveal effect moved").toContain("pointerdown");
    expect(revealEffect).not.toMatch(/setTimeout/);
  });

  it("counts the exit, because nothing did", () => {
    /*
     * The exit is a client-side <Link>, so the document never unloads and
     * `beforeunload` — the only abandonment hook in this shell — does not fire.
     * Leaving produced no event at all, which is exactly the evidence needed to
     * judge whether the reveal in front of it prevents accidents or merely
     * costs every deliberate leaver a tap.
     */
    const exit = shell.match(/<Link[\s\S]*?<\/Link>/)?.[0] ?? "";
    expect(exit).toMatch(/trackTestExit\(state\.phase, locale, /);
  });

  it("says whether the exit went through the reveal or straight out", () => {
    // The event's own doc comment promised this dimension while the payload
    // carried only phase and locale — so every exit looked alike and the
    // question the two-step exists to settle could not be asked of the data.
    const exit = shell.match(/<Link[\s\S]*?<\/Link>/)?.[0] ?? "";
    expect(exit, "the exit no longer reports which path it took").toMatch(
      /trackTestExit\(state\.phase, locale, exitRevealed \? "revealed" : "direct"\)/,
    );
    const analytics = code(read("src", "lib", "analytics.ts"));
    expect(analytics, "the event dropped the property again").toMatch(
      /safeCapture\("test_exit", \{ phase, locale, via \}\)/,
    );
  });
});
