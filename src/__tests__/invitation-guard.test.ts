import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The decision cannot be made by momentum.
 *
 * The verdict says "click anywhere, or press space" and grace keeps that
 * contract for another eight sections — a dozen screens teach tap-the-middle
 * to go on. The invitation then mounts the commitment button in exactly that
 * spot, invisible for its first 350ms and clickable the whole time.
 * Reproduced with an automated walk at a reader's own cadence: the centre tap
 * after "So what now?" — 400ms in, buttons at opacity ~0 — recorded
 * "committed". A profession of faith the reader never saw, on the one screen
 * METHOD.md requires to be a free and VISIBLE choice.
 *
 * These pin the two halves of the guard and the coupling that sizes it.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const src = readFileSync(
  join(ROOT, "src", "components", "invitation-screen.tsx"),
  "utf8",
);
const stripped = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

describe("the invitation's choice guard", () => {
  it("refuses input for exactly the entrance the buttons are still arriving through", () => {
    /*
     * 950 = the responses' own 350ms delay + 600ms fade. The guard must end
     * at the frame the buttons are fully there — shorter re-opens the
     * invisible-click window, longer makes visible buttons ignore a
     * deliberate tap. Pinning the animation numbers beside the constant means
     * a change to either without the other fails here.
     */
    expect(stripped).toMatch(/const CHOICE_GUARD_MS = 950/);
    const buttons = stripped.slice(stripped.indexOf('handleResponse("committed")') - 600);
    expect(buttons).toMatch(/duration: 0\.6, delay: 0\.35/);
  });

  it("guards with pointer-events AND an inert handler, not one alone", () => {
    // The class covers the tap; the handler covers focus-and-Enter during the
    // entrance and any tap that slips a frame past the class toggle.
    expect(stripped).toMatch(/choicesArmed \? "" : "pointer-events-none"/);
    expect(stripped).toMatch(/if \(!choicesArmed\) return;/);
  });

  it("arms once, on a timer that dies with the screen", () => {
    expect(stripped).toMatch(/setTimeout\(\(\) => setChoicesArmed\(true\), CHOICE_GUARD_MS\)/);
    const effect = stripped.slice(stripped.indexOf("setChoicesArmed(true)"));
    expect(effect.slice(0, 200)).toMatch(/clearTimeout\(t\)/);
  });

  it("starts disarmed — the free choice is never assumed", () => {
    expect(stripped).toMatch(/\[choicesArmed, setChoicesArmed\] = useState\(false\)/);
  });
});
