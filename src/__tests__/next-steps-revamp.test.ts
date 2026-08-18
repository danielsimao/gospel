import { describe, it, expect } from "vitest";
import { reflectionState } from "@/components/next-steps/track-thinking";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * What came off the two tracks, and must not drift back on.
 *
 * The page was a menu -- seven destinations on the committed track, five on
 * the thinking one -- and every cut here was argued for in
 * docs/superpowers/specs/2026-08-10-next-steps-revamp-design.md. These pin the
 * cuts themselves, because a removed row is exactly the kind of thing a later
 * change restores without noticing.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), "utf8");
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

const committed = strip(read("src", "components", "next-steps", "track-committed.tsx"));
const thinking = strip(read("src", "components", "next-steps", "track-thinking.tsx"));
const shareButtons = strip(read("src", "components", "share-buttons.tsx"));
const readingPlan = strip(read("src", "components", "reading-plan", "reading-plan.tsx"));
const discipleshipAnalytics = strip(read("src", "lib", "discipleship-analytics.ts"));
const posthogLib = strip(read("src", "lib", "posthog.ts"));
const en = JSON.parse(read("src", "messages", "en.json"));
const pt = JSON.parse(read("src", "messages", "pt.json"));

describe("the committed track", () => {
  it("no longer sends a new believer to print evangelism cards", () => {
    // Street evangelism on day one is the 'as you grow' of as-you-grow. The
    // route survives; the footer carries it (see the footer test below).
    expect(committed, "the print-cards row came back").not.toMatch(/\/cards/);
    expect(committed).not.toMatch(/streetLinkLabel/);
    expect(committed, "the cards analytics action came back").not.toMatch(/"cards"/);
  });

  it("opens on what God did, not on what the reader just did", () => {
    // The cut paragraph recapped the reader's own decision -- the same
    // restatement removed from grace's first beat on 2026-07-31.
    for (const [name, msgs] of [["en", en], ["pt", pt]] as const) {
      const paras = msgs.nextSteps.trackA.whatHappened.split("\n\n");
      expect(paras, `${name} whatHappened should be two beats, not three`).toHaveLength(2);
      expect(
        paras[0],
        `${name} still opens by recapping the reader's decision`,
      ).not.toMatch(/you'?ve made the decision|fizeste a decisão|decidiste/i);
    }
  });

  it("keeps church, but below the day's work", () => {
    // Read, pray, fellowship is the method's own follow-up triad, so the row
    // survives. It just stops competing with the one thing to do today.
    expect(committed, "the church row was removed, not demoted").toMatch(/find-a-church/);
    const growBand = committed.indexOf("messages.bands.grow");
    const church = committed.indexOf("find-a-church");
    expect(growBand, "the grow band header is gone").toBeGreaterThan(-1);
    expect(church, "the church row is still above the grow band").toBeGreaterThan(growBand);
  });

  it("folds the share block behind a disclosure", () => {
    // It was roughly a third of the page, always open, while the reader was
    // being asked to read one chapter.
    expect(committed, "share is not behind a disclosure").toMatch(/aria-expanded=\{shareOpen\}/);
    expect(committed).toMatch(/aria-controls": "next-steps-share/);
    // Without this the block could be made permanently visible again and the
    // two attribute assertions above would not notice.
    expect(committed, "the share panel is no longer gated on shareOpen").toMatch(
      /\{shareOpen && \(/,
    );
  });
});

describe("the committed track's read card gets a mark-as-read control", () => {
  // Opening the passage is not reading it (owner rule) -- the Read card
  // needed its own explicit control, wired to the same contiguity-guarded
  // writer reading-plan.tsx uses, not a second copy of that rule.
  it("marks the day through the shared writer, not a local write", () => {
    expect(committed, "markDayRead is not imported").toMatch(
      /import \{ firstUnreadDay, markDayRead, readProgress \} from "@\/lib\/reading-storage"/,
    );
    expect(committed, "the button is not wired to markDayRead").toMatch(
      /if \(!markDayRead\(day\)\) return;/,
    );
  });

  it("derives the day from storage at click time, not from the render", () => {
    // The rendered readingDone can lag storage (another tab advancing the
    // plan before the subscription lands), and the writer deliberately
    // reports success for an already-read day -- so a stale `readingDone + 1`
    // would fire completion analytics for a day this tap did not complete.
    // Read fresh, the day handed to the writer is unread by construction.
    expect(committed, "the handler derives the day from a stale snapshot").toMatch(
      /const day = firstUnreadDay\(readProgress\(\), readingDays\.length\);/,
    );
    expect(committed, "the finished plan is not guarded before the write").toMatch(
      /if \(day > readingDays\.length\) return;/,
    );
  });

  it("only renders while there is a day left to mark", () => {
    // `today` is null once the plan is finished, which is exactly when the
    // card has already switched to the continue-reading state -- the mark
    // button must not reappear there.
    expect(committed, "the mark-read button always renders").toMatch(
      /\{today && \(\s*<Button variant="gold" size="sm" onClick=\{handleMarkRead\}>/,
    );
  });

  it("reuses the reading plan's own label, not new copy", () => {
    expect(committed, "the button does not use readingLabels.markReadLabel").toMatch(
      /\{readingLabels\.markReadLabel\}/,
    );
    for (const [name, msgs] of [["en", en], ["pt", pt]] as const) {
      expect(msgs.readingPlan.markReadLabel, `${name} lost markReadLabel`).toBeTruthy();
    }
  });

  it("fires the day-completed event tagged with the next_steps surface", () => {
    expect(
      committed,
      "trackReadingPlanDayCompleted is not called with the next_steps surface",
    ).toMatch(/trackReadingPlanDayCompleted\(day, locale, "next_steps"\)/);
    expect(committed, "the plan-completed event is missing on the 7th day").toMatch(
      /if \(day >= readingDays\.length\) \{\s*trackReadingPlanCompleted\(locale\);/,
    );
  });

  it("stops inviting a finished reader to start the plan", () => {
    // "Start the 7-day plan" is only true while there's a day left to
    // start -- once `today` is null the primary button has already become
    // the continue-reading door, and "start" is the wrong verb for a plan
    // the reader just finished.
    expect(committed, "the reading-plan link always renders").toMatch(
      /\{today && \(\s*<Link href=\{`\/\$\{locale\}\/reading-plan`\}/,
    );
  });

  it("carries a surface property so the two mark-read surfaces are distinguishable", () => {
    expect(
      discipleshipAnalytics,
      "trackReadingPlanDayCompleted lost its surface parameter",
    ).toMatch(/surface: "reading_plan" \| "next_steps"/);
    expect(
      discipleshipAnalytics,
      "the event still fires without a surface property",
    ).toMatch(/safeCapture\("reading_plan_day_completed", \{ day, locale, surface \}\)/);
    expect(
      readingPlan,
      "reading-plan.tsx's own call site was not updated to pass its surface",
    ).toMatch(/trackReadingPlanDayCompleted\(day, locale, "reading_plan"\)/);
  });
});

describe("the committed track's share section", () => {
  it("collapses to one native Share button where the OS sheet is available", () => {
    expect(committed, "ShareButtons is not asked for the exclusive native button").toMatch(
      /nativeOnly/,
    );
  });

  it("removed the Instagram story-image flow entirely", () => {
    expect(committed, "SaveStoryImageButton is still used on this page").not.toMatch(
      /SaveStoryImageButton/,
    );
    expect(committed, "the story preview image is still rendered").not.toMatch(
      /testimony\/story/,
    );
    for (const [name, msgs] of [["en", en], ["pt", pt]] as const) {
      const a = msgs.nextSteps.trackA;
      expect(a.storyHint, `${name} trackA.storyHint is orphaned`).toBeUndefined();
      expect(a.storyButton, `${name} trackA.storyButton is orphaned`).toBeUndefined();
      expect(a.storyCopyButton, `${name} trackA.storyCopyButton is orphaned`).toBeUndefined();
      expect(a.storyCopied, `${name} trackA.storyCopied is orphaned`).toBeUndefined();
      // Both survive -- the heading and the shared message text are still used.
      expect(a.shareHeading, `${name} lost shareHeading`).toBeTruthy();
      expect(a.shareMessage, `${name} lost shareMessage`).toBeTruthy();
    }
  });

  it("keeps analytics firing on a share action", () => {
    expect(
      committed,
      "share actions no longer report to the next-steps funnel",
    ).toMatch(/onShare=\{\(\) => trackNextStepsActionClicked\("share", "committed"\)\}/);
  });
});

describe("share-buttons.tsx supports an exclusive native mode", () => {
  it("hides WhatsApp/Telegram/copy once the native button is the only thing shown", () => {
    expect(shareButtons, "showNativeOnly is not derived from the nativeOnly prop").toMatch(
      /const showNativeOnly = nativeOnly && canNativeShare;/,
    );
    expect(
      shareButtons,
      "the WhatsApp/Telegram/copy row is not gated on showNativeOnly",
    ).toMatch(/\{!showNativeOnly && \(/);
  });

  it("still falls back to WhatsApp/Telegram/copy when the Web Share API is unavailable", () => {
    // canNativeShare itself is untouched by nativeOnly -- desktop still gets
    // the three-button row because showNativeOnly can only be true alongside it.
    expect(shareButtons).toMatch(/aria-label="Share on WhatsApp"/);
    expect(shareButtons).toMatch(/aria-label="Share on Telegram"/);
    expect(shareButtons).toMatch(/aria-label="Copy link"/);
  });

  it("reports share actions through the optional onShare callback", () => {
    expect(shareButtons, "onShare is never invoked").toMatch(/onShare\?\.\("native"\)/);
  });
});

describe("the thinking track", () => {
  it("does not promise a chat that does not exist", () => {
    // needGod.net has no chat control on the page -- it invites questions by
    // form and by social message -- and it has no Portuguese, so a tu-form
    // reader was being handed an English site at the moment they were
    // promised a conversation. The footer keeps the link.
    expect(thinking, "the needGod row came back").not.toMatch(/needgod/i);
    expect(thinking, "the talk analytics action came back").not.toMatch(/"talk"/);
  });

  it("offers two destinations, not five", () => {
    // John 3 is the reading ask; a seven-day plan alongside it splits the ask.
    expect(thinking, "the reading-plan row came back").not.toMatch(/\/reading-plan/);
    expect(thinking, "a band header with nothing under it came back").not.toMatch(
      /bands\.deeper/,
    );
    expect(thinking, "learn is no longer offered").toMatch(/\/learn/);
  });

  it("keeps the mortality line at the end, after the offer", () => {
    // A stake, not a lever -- it must never sit between a question and its
    // answer (docs/METHOD.md).
    const learn = thinking.indexOf("/learn");
    const comeBack = thinking.indexOf("messages.comeBack");
    expect(comeBack, "the closing line vanished").toBeGreaterThan(-1);
    expect(comeBack, "the mortality line moved above the offer").toBeGreaterThan(learn);
  });
});

describe("the reflection chain", () => {
  it("arms one question at a time and never gates the page", () => {
    // The flow spent fifteen screens teaching one-thing-then-tap. A static
    // list of three breaks that cadence at the moment retention matters.
    expect(thinking, "the chain has no acknowledged cursor").toMatch(
      /const \[acknowledged, setAcknowledged\] = useState\(0\)/,
    );
    expect(thinking, "questions are not buttons, so they cannot be armed").toMatch(
      /<button[\s\S]*?setAcknowledged\(i \+ 1\)/,
    );
    // Pending items stay readable to a screen reader -- dimmed, not hidden.
    expect(thinking).toMatch(/aria-disabled=\{state !== "armed"\}/);
    expect(thinking, "pending questions were removed from the DOM").not.toMatch(
      /state === "pending" && null/,
    );
  });

  it("carries a hint on the armed question, in both locales", () => {
    expect(thinking).toMatch(/messages\.reflectionHint/);
    for (const [name, msgs] of [["en", en], ["pt", pt]] as const) {
      expect(msgs.nextSteps.trackB.reflectionHint, `${name} lost the hint`).toBeTruthy();
    }
  });
});

describe("reachability after the cuts", () => {
  const footer = strip(read("src", "components", "shared", "footer.tsx"));

  it("keeps /cards reachable now that the track no longer links it", () => {
    // /cards is noindex and absent from the sitemap, so this is not an SEO
    // question -- without an internal link the page is reachable only by
    // typing the URL.
    expect(footer, "/cards has no internal link anywhere").toMatch(/\/cards/);
    expect(footer).toMatch(/messages\.cardsLink/);
  });

  it("keeps needGod in the footer after removing it from the track", () => {
    expect(footer, "the needGod link left the footer too").toMatch(/needGodUrl/);
  });

  it("credits the translations it actually quotes, and says it once", () => {
    /*
     * The first version of this test pinned the Portuguese notice to
     * Sociedade Bíblica de Portugal's ARC. The site does not use ARC: the
     * Portuguese text is Almeida Corrigida Fiel, which belongs to Sociedade
     * Bíblica Trinitariana do Brasil, and /about had been crediting it
     * correctly all along. The footer was crediting the wrong publisher, on
     * the same site, contradicting its own about page.
     *
     * So this pins the relationship rather than a string: whatever the notice
     * says, the footer and /about must say the same thing. Two different
     * copyright claims for one text is worse than one wrong claim.
     */
    expect(footer, "the footer renders no translation credit").toMatch(
      /messages\.scriptureNotice/,
    );
    for (const [name, msgs] of [["en", en], ["pt", pt]] as const) {
      expect(
        msgs.footer.scriptureNotice,
        `${name} footer notice disagrees with the one on /about`,
      ).toBe(msgs.about.scriptureNote);
    }
    // The publishers' own names, so a translation cannot be swapped without
    // the credit following it.
    expect(en.footer.scriptureNotice).toMatch(/New King James Version/);
    expect(pt.footer.scriptureNotice).toMatch(/Almeida Corrigida Fiel/);
    expect(pt.footer.scriptureNotice).toMatch(/Trinitariana/);
  });

  it("has no locale keys left orphaned by the cuts", () => {
    for (const [name, msgs] of [["en", en], ["pt", pt]] as const) {
      const a = msgs.nextSteps.trackA;
      const b = msgs.nextSteps.trackB;
      expect(a.streetLinkLabel, `${name} trackA.streetLinkLabel is orphaned`).toBeUndefined();
      expect(b.talkLabel, `${name} trackB.talkLabel is orphaned`).toBeUndefined();
      expect(b.talkLink, `${name} trackB.talkLink is orphaned`).toBeUndefined();
      expect(b.talkUrl, `${name} trackB.talkUrl is orphaned`).toBeUndefined();
      expect(b.readingPlanLabel, `${name} trackB.readingPlanLabel is orphaned`).toBeUndefined();
      expect(b.bands.deeper, `${name} trackB.bands.deeper is orphaned`).toBeUndefined();
      expect(msgs.footer.cardsLink, `${name} footer.cardsLink is missing`).toBeTruthy();
    }
  });
});

describe("the transition into next steps", () => {
  const invitation = strip(read("src", "components", "invitation-screen.tsx"));

  it("lets the door respond to the commitment, over the length of the hold", () => {
    // The door has sat behind this screen at 35% since it shipped and has
    // never responded to anything. Nothing announces the change -- the seam's
    // gold resolution does not announce itself either.
    expect(invitation, "the door does not react to the answer").toMatch(
      /committed \? "scale-\[1\.04\] opacity-\[0\.5\]" : "opacity-\[0\.35\]"/,
    );
    expect(invitation, "the door's change is not the length of the hold").toMatch(
      /duration-\[2000ms\]/,
    );
  });

  it("respects reduced motion on the door", () => {
    expect(invitation).toMatch(/motion-reduce:transition-none/);
  });

  it("carries the light into the arrival, without a seam under the header", () => {
    /*
     * The dawn was absolute inside PageShell's reading column, so it began at
     * the top of the content area — the exact pixel the header ends, measured
     * at y=60 for both — and inherited the column's width, painting a 512px
     * band down the middle of a 1512px viewport. Fixed and full-bleed runs it
     * behind the transparent header instead, which is what removes the edge.
     */
    expect(committed, "the committed opener lost its dawn").toMatch(/data-dawn/);
    expect(committed, "the dawn went back inside the reading column").toMatch(
      /data-dawn[\s\S]{0,120}fixed inset-x-0 top-0/,
    );
    expect(committed, "the dawn stopped being click-through").toMatch(
      /data-dawn[\s\S]{0,120}pointer-events-none/,
    );
  });
});

describe("the reflection chain cannot be driven out of turn", () => {
  it("guards the handler rather than trusting CSS and tabindex", () => {
    /*
     * Found in review: aria-disabled announces a state, it does not enforce
     * one. A done item had no pointer-events-none at all, so clicking the
     * first question after reaching the third rewound the chain; and pointer
     * hit-testing is not consulted by .click(), voice control, or activation
     * from the accessibility tree, so a pending item could be jumped to.
     */
    expect(thinking, "the click handler trusts CSS to keep it unreachable").toMatch(
      /if \(state !== "armed"\) return;/,
    );
  });
});

describe("the reflection chain's actual rule", () => {
  /*
   * The assertions above pin how the component spells things. Review pointed
   * out they would pass just as happily if the derivation armed every item at
   * once, or armed nothing after an acknowledgement -- the behaviour the spec
   * names was never exercised. This is that half, against the real function.
   */
  it("arms exactly one question, and it is the first unacknowledged one", () => {
    for (let acknowledged = 0; acknowledged <= 3; acknowledged++) {
      const states = [0, 1, 2].map((i) => reflectionState(i, acknowledged));
      const armed = states.filter((s) => s === "armed");
      // Once every question is acknowledged there is nothing left to arm.
      expect(armed.length, `acknowledged=${acknowledged} armed ${armed.length}`).toBe(
        acknowledged < 3 ? 1 : 0,
      );
      if (acknowledged < 3) {
        expect(states.indexOf("armed"), "the armed one is not the first unacknowledged").toBe(
          acknowledged,
        );
      }
    }
  });

  it("advances by exactly one when a question is acknowledged", () => {
    expect(reflectionState(0, 0)).toBe("armed");
    expect(reflectionState(1, 0)).toBe("pending");
    // Acknowledging the first arms the second and retires the first.
    expect(reflectionState(0, 1)).toBe("done");
    expect(reflectionState(1, 1)).toBe("armed");
    expect(reflectionState(2, 1)).toBe("pending");
  });

  it("never reports a question as both done and pending", () => {
    for (let a = 0; a <= 4; a++) {
      for (let i = 0; i < 4; i++) {
        expect(["done", "armed", "pending"]).toContain(reflectionState(i, a));
      }
    }
  });
});

describe("the reading plan's own mark-read control", () => {
  // Same bug as the committed track's fix above, on the other surface: a
  // render-time `progress` snapshot can lag storage across tabs, and
  // markDayRead "succeeds" (by contract) on an already-read day -- so a
  // click could fire reading_plan_day_completed for a day this tap did not
  // complete, and derive plan-completed from a stale count.
  it("derives the day from storage at click time, not a spread of the stale render-time snapshot", () => {
    expect(readingPlan, "the handler derives the day from a stale progress snapshot").toMatch(
      /const day = firstUnreadDay\(readProgress\(\), totalDays\);/,
    );
    expect(
      readingPlan,
      "the handler still spreads the stale progress state into a new object",
    ).not.toMatch(/\.\.\.progress, \[String\(day\)\]: true/);
    expect(readingPlan, "the finished plan is not guarded before the write").toMatch(
      /if \(day > totalDays\) return;/,
    );
  });

  it("computes plan completion from the freshly-read day, not a stale count", () => {
    expect(readingPlan, "completion no longer follows the fresh write").toMatch(
      /if \(day >= totalDays\) \{\s*trackReadingPlanCompleted\(locale\);/,
    );
  });

  it("hands DayCard's already-no-argument callback straight through, not a per-card bound day", () => {
    // DayCard only ever renders the button on the one card isCurrent picks,
    // so a day baked into the closure at render time is exactly the stale
    // value the fix above removes -- the writer's own contiguity rule is
    // what has to pick the day, not the card that happened to render it.
    expect(readingPlan, "onMarkRead is bound to a per-card day again").toMatch(
      /onMarkRead=\{handleMarkRead\}/,
    );
  });
});

describe("scripture-open analytics survive the same-tab handoff", () => {
  // Scripture links navigate same-tab now (scripture-links-same-tab.test.ts),
  // and posthog-js's default XHR/fetch transport is an in-flight request the
  // browser cancels on document teardown -- so the event that measures the
  // whole reading-handoff funnel was exactly the one most likely to be
  // dropped. sendBeacon survives teardown by design.
  it("capture() accepts and forwards a transport override to the client", () => {
    expect(posthogLib, "capture no longer takes a third options argument").toMatch(
      /export function capture\(\s*event: string,\s*properties\?: Record<string, unknown>,\s*options\?: CaptureOptions,\s*\): void/,
    );
    expect(posthogLib, "capture stopped forwarding options to the underlying client").toMatch(
      /client\?\.capture\(event, properties, options\)/,
    );
  });

  it("trackScriptureOpened fires on sendBeacon so it survives the navigation it precedes", () => {
    expect(
      discipleshipAnalytics,
      "trackScriptureOpened lost its sendBeacon transport",
    ).toMatch(
      /safeCapture\("scripture_opened", \{ surface, day, locale \}, \{ transport: "sendBeacon" \}\)/,
    );
  });

  it("carries the read action out on the same beacon, since it races the same teardown", () => {
    // trackNextStepsActionClicked fires in the same onClick, one line above
    // trackScriptureOpened, before the same external navigation -- it was
    // left on the default transport when the beacon landed.
    expect(
      discipleshipAnalytics,
      "the leaving actions lost their beacon transport",
    ).toMatch(/leaving \? \{ transport: "sendBeacon" \} : undefined/);
    // …and only where the click actually leaves the site. An internal Link
    // navigation tears nothing down, and sendBeacon is the wrong default.
    expect(committed, "the committed track's read link stopped flagging the exit").toMatch(
      /trackNextStepsActionClicked\("read", "committed", true\)/,
    );
    expect(thinking, "the thinking track's read link stopped flagging the exit").toMatch(
      /trackNextStepsActionClicked\("read", "thinking", true\)/,
    );
  });

  it("reports the day the link was rendered with, not a rescan of the plan", () => {
    // `today` IS readingDays[readingDone], so the opened day is readingDone + 1
    // by construction -- an indexOf scan for a value already known by index.
    // Deliberately the RENDERED day, unlike handleMarkRead's fresh read: this
    // reports what the anchor opened, and the anchor's href is the rendered one.
    expect(committed, "the opened day is derived by scanning for the day object").not.toMatch(
      /readingDays\.indexOf\(today\)/,
    );
    expect(committed, "the opened day no longer matches the rendered href").toMatch(
      /trackScriptureOpened\("next_steps_committed", today \? readingDone \+ 1 : null, locale\)/,
    );
  });
});

describe("the reflection chain keeps focus alive across an acknowledgement", () => {
  // The armed item is the only one with tabIndex 0; acknowledging it flips
  // its own tabIndex to -1 (it is now "done") while it still holds focus, so
  // without an explicit move the next Tab restarted from the top of the
  // document instead of continuing down the chain.
  it("gives every chain item a ref so focus can be moved onto it", () => {
    expect(thinking, "the chain items lost their per-item refs").toMatch(
      /itemRefs\.current\[i\] = el;/,
    );
  });

  it("moves focus to the newly armed item after acknowledging one", () => {
    expect(thinking, "focus is not moved to the next armed item").toMatch(
      /itemRefs\.current\[acknowledged\]\?\.focus\(\);/,
    );
  });

  it("moves focus to the primary CTA once the chain is finished, not nowhere", () => {
    expect(thinking, "the read link lost its ref").toMatch(/ref=\{readLinkRef\}/);
    expect(thinking, "focus does not land anywhere once the chain completes").toMatch(
      /readLinkRef\.current\?\.focus\(\);/,
    );
  });

  it("never steals focus on first mount, before any acknowledgement", () => {
    expect(thinking, "the focus effect no longer guards the initial render").toMatch(
      /if \(acknowledged === 0\) return;/,
    );
  });
});
