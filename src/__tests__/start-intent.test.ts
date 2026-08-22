import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * "Take the Test" has to deliver a test.
 *
 * Reproduced before this was written: finish the six questions, answer the
 * decision, go to /next-steps, click Test in the nav. Inside the thirty-minute
 * resume window the shell restored the saved phase — which for that reader is
 * the post-decision screen, an encouragement line and a forward button, with no
 * test on it and no way to start one. The nav was the only entrance into /test
 * carrying no statement of intent, so a resume answered for it.
 *
 * The seeded /test/[rating] route already outranks a resume by arriving in the
 * URL, and the shell's own comment says so. This is the same idea for the nav.
 *
 * Source assertions in the idiom of phase-handoff.test.ts: vitest runs in
 * `environment: "node"`, so there is no shell to mount here.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const read = (...parts: string[]) => readFileSync(join(ROOT, ...parts), "utf8");
const strip = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

const topBar = strip(read("src", "components", "shared", "top-bar.tsx"));
const shell = strip(read("src", "components", "game-shell.tsx"));
const homeShell = strip(read("src", "components", "home-shell.tsx"));

describe("the nav says what it wants", () => {
  it("asks for a start rather than trusting a resume to guess", () => {
    expect(topBar, "the nav's Test link carries no intent again").toMatch(
      /href=\{`\/\$\{locale\}\/test\?start=1`\}/,
    );
  });

  it("carries the intent in the URL, not in a click handler", () => {
    /*
     * The homepage's retake links clear the session in onClick, which is right
     * for them: they mean "again" unconditionally. This link does not. A
     * modified click — cmd, middle button — fires the handler in THIS tab while
     * the test opens in another, so a handler-side clear would wipe the session
     * of the tab the reader is still sitting in. The param travels with the
     * navigation instead.
     */
    const testLink = topBar.slice(topBar.indexOf("/test?start=1"));
    const handler = testLink.slice(0, testLink.indexOf("</Link>"));
    expect(handler, "the nav link clears the session from its own tab").not.toMatch(
      /clearSession/,
    );
    // …and the homepage's unconditional retakes still do clear, as before.
    expect(homeShell, "the homepage retake stopped clearing the session").toMatch(
      /clearSession\(\)/,
    );
  });
});

describe("the shell honours the start request", () => {
  it("reads the flag from the URL and consumes it", () => {
    expect(shell, "the shell no longer reads the start flag").toMatch(
      /url\.searchParams\.has\("start"\)/,
    );
    /*
     * Consumed, not merely read. Left in the URL the flag fires again on the
     * next reload — a phone locking mid-question would then throw away the
     * answers given since, which is the exact loss this feature exists to
     * avoid.
     *
     * Scoped to the consuming block, and that scoping is the assertion. An
     * unscoped `replaceState` check passed against three unrelated calls the
     * history machine already makes in this file — deleting the one line that
     * writes the stripped URL back left every test in here green.
     */
    const consume = shell.slice(
      shell.indexOf("let startRequested"),
      shell.indexOf("if (state.selfRating) return;"),
    );
    expect(consume.length, "the start-flag block moved or vanished").toBeGreaterThan(0);
    expect(consume, "the flag is deleted from the URL but never written back").toMatch(
      /url\.searchParams\.delete\("start"\);[\s\S]*?window\.history\.replaceState\(/,
    );
  });

  it("consumes the flag before any early return can skip it", () => {
    /*
     * The ordering IS the safety. Consumed after `if (!saved) return`, a
     * stranger arriving from the nav — which is how strangers arrive — kept
     * `?start=1` in the address bar for the whole visit. It then fired on the
     * next reload, when a session DID exist: a reader who reached the verdict
     * and whose phone locked came back to a cleared test and the landing
     * screen. The flag exists to prevent that loss and, consumed one return
     * too late, caused it.
     */
    const effect = shell.slice(shell.indexOf("if (restoredRef.current) return;"));
    const consumeAt = effect.indexOf('url.searchParams.delete("start")');
    expect(consumeAt, "the flag is no longer consumed in the restore effect").toBeGreaterThan(-1);
    for (const earlyReturn of ["if (state.selfRating) return;", "if (!saved) return;"]) {
      expect(
        consumeAt,
        `the flag is consumed after \`${earlyReturn}\`, which can skip it`,
      ).toBeLessThan(effect.indexOf(earlyReturn));
    }
  });

  it("only overrides a session that is no longer the test", () => {
    /*
     * A reader mid-test who stepped away to read something is still IN the
     * test: handing their answered questions back is what the link promised,
     * and discarding them is not. Only a finished session — verdict, grace,
     * the decision — makes the label a lie.
     */
    expect(shell, "a mid-test session is discarded by the nav link").toMatch(
      /if \(startRequested && saved\.phase !== "playing"\) \{\s*clearSession\(\);/,
    );
  });

  it("leaves the resume path alone when nothing asked for a start", () => {
    // No flag, no change: a refresh, a locked phone or a restored tab still
    // resumes every phase, which is the whole point of keeping a session.
    // Every clear in this file must be gated on the flag — an ungated one
    // would empty the session of a reader who only refreshed.
    const clears = shell.match(/clearSession\(\)/g) ?? [];
    expect(clears, "clearSession is called somewhere new — check its gate").toHaveLength(1);
    const beforeClear = shell.slice(0, shell.indexOf("clearSession()"));
    expect(
      beforeClear.lastIndexOf("if (startRequested"),
      "clearing escaped the start-requested gate",
    ).toBeGreaterThan(beforeClear.lastIndexOf("const saved = readSession()"));
    expect(shell).toMatch(/dispatch\(\{ type: "RESUME_SESSION", session: saved \}\)/);
  });
});

describe("the decision is recorded once", () => {
  const invitation = strip(read("src", "components", "invitation-screen.tsx"));

  it("latches synchronously, before the analytics and the durable write", () => {
    /*
     * The reducer refuses a second dispatch, but these two run BEFORE it: a
     * same-tick double activation would count the reader twice and overwrite
     * their answer with whichever button fired last. State would not settle in
     * time, so the latch is a ref.
     */
    const handler = invitation.slice(
      invitation.indexOf("function handleResponse"),
      invitation.indexOf("const committed ="),
    );
    expect(handler, "the response handler lost its latch").toMatch(
      /if \(respondedRef\.current\) return;\s*respondedRef\.current = true;/,
    );
    const latchIndex = handler.indexOf("respondedRef.current = true");
    expect(latchIndex, "the latch is set after the writes it exists to guard").toBeLessThan(
      handler.indexOf("trackInvitationResponse"),
    );
    expect(latchIndex).toBeLessThan(handler.indexOf("saveInvitationResponse"));
  });

  it("seeds the latch from state, so a remount over an answer stays shut", () => {
    expect(invitation).toMatch(/respondedRef = useRef\(invitationResponse !== null\)/);
  });
});
