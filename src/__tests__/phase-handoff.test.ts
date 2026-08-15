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
     * (testimony, see UNDO_ANSWER), back from the verdict IS Exit, and the
     * decision screen offers the decision and nothing beside it (below).
     */
    const chip = shell.match(/\{state\.phase === "grace" && \([\s\S]*?<\/button>\s*\)\}/)?.[0] ?? "";
    expect(chip, "no grace-gated chip in the shell").toContain("backToVerdict");
    // Exclusivity, not just existence: exactly one render site, inside the
    // grace gate. A second chip on another phase would otherwise pass — the
    // absences above are the half of the rule a screenshot cannot pin.
    expect(shell.match(/backToVerdict/g)).toHaveLength(1);
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
    expect(shell).toMatch(/onBack=\{walkBack\}/);
    // The guarded path still marks the gesture link-driven and walks a real
    // history entry, so the browser stack and the reducer cannot disagree.
    const walkBackFn = shell.match(/function walkBack\(\)[\s\S]*?\n {2}\}/)?.[0] ?? "";
    expect(walkBackFn).toContain("viaLinkRef.current = true");
    expect(walkBackFn).toContain("window.history.back()");
  });

  it("sits above grace's tap surface, or it is decoration", () => {
    /*
     * Grace's tap surface is `fixed inset-0 z-30` for most of the visit. A
     * chip below that answers no clicks for exactly as long as the reader
     * might want it — the affordance would exist and not work, which is worse
     * than its absence ever was.
     */
    const chip = shell.match(/\{state\.phase === "grace" && \([\s\S]*?<\/button>\s*\)\}/)?.[0] ?? "";
    expect(chip).toMatch(/z-40/);
    const grace = code(read("src", "components", "grace-screen.tsx"));
    expect(grace).toMatch(/data-slot="grace-tap-surface"[\s\S]*?z-30/);
  });
});

describe("the decision screen offers the decision, and nothing beside it", () => {
  it("renders no walk-back link", () => {
    /*
     * A "re-read grace" link used to sit beside the eyebrow. Leaving IS visible
     * on this screen — it is the third response, "Not for me" — so the link was
     * not carrying the method's requirement it claimed to; it was offering
     * retreat at the moment of commitment, on the one screen whose whole design
     * is a single choice. Back still works, and grace ends with its own
     * walk-back one screen earlier.
     */
    expect(invitation).not.toMatch(/rereadGrace/);
    expect(invitation).not.toMatch(/onBack/);
  });

  it("is not handed a way back by the shell", () => {
    // The prop is gone from the component, so passing one would not compile —
    // but the shell is where a future edit would try to reinstate it, and the
    // grace screen's own onBack must survive that edit.
    const invitationCall = shell.match(/<InvitationScreen[\s\S]*?\/>/)?.[0] ?? "";
    expect(invitationCall, "InvitationScreen is not rendered here").toContain("messages");
    expect(invitationCall).not.toContain("onBack");
    // Grace keeps its walk-back to the verdict; this test must not pass simply
    // because every onBack in the flow was deleted.
    const graceCall = shell.match(/<GraceScreen[\s\S]*?\/>/)?.[0] ?? "";
    expect(graceCall).toContain("onBack");
  });
});
