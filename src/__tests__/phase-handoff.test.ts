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
     * `showAll` — the verdict's re-read layout — is derived from graceReached.
     * Tapping the door dispatches SHOW_GRACE, which sets that flag true WHILE
     * this screen is still playing its exit. Read live, the departing verdict
     * re-rendered into document mode: measured at 390×844, one frame after the
     * tap the whole record (GUILTY, the confession, the death count, the claim)
     * slammed over the door and stayed ~115ms until grace mounted, with the
     * document growing 844 → 1088 underneath it.
     *
     * The value cannot legitimately change mid-life — "did this reader arrive
     * having already seen grace" is settled on arrival — and the shell keys each
     * phase, so walking back remounts this component and asks again then.
     */
    expect(verdict).toMatch(/const \[returning\] = useState\(state\.graceReached\)/);
    // The live read is what caused it; it must not come back in either form.
    expect(verdict).not.toMatch(/const returning = state\.graceReached/);
  });

  it("still gives a returning reader the whole document", () => {
    // The fix must not turn the re-read back into a single gold question, which
    // is the bug showAll exists to solve.
    expect(verdict).toMatch(/const showAll = returning/);
    expect(verdict).toMatch(/useState\(returning \? LAST_BEAT : 0\)/);
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
