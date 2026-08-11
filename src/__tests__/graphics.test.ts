import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * The generated graphics, and the rules that keep them from becoming weight.
 *
 * Every raster asset here was generated from a prompt in docs/graphics. Most
 * are a background or a share plate; the topic-page covers are the one
 * foreground exception, framed content rather than dimmed atmosphere. So the
 * guards are about restraint: nothing on the LCP path, nothing served that is
 * not used, nothing that can take a click, and no prompt lost.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), "utf8");
const strip = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
const kb = (...p: string[]) => statSync(join(ROOT, ...p)).size / 1024;

const testOg = strip(read("src", "app", "[locale]", "(immersive)", "test", "opengraph-image.tsx"));
const invitation = strip(read("src", "components", "invitation-screen.tsx"));
const storyOg = strip(read("src", "app", "[locale]", "(content)", "testimony", "story", "route.tsx"));
const topicCover = strip(read("src", "components", "learn", "topic-cover.tsx"));
const topicPage = strip(read("src", "components", "learn", "topic-page.tsx"));
const topicCoverCard = strip(read("src", "components", "learn", "topic-cover-card.tsx"));
const learnHub = strip(read("src", "components", "learn", "learn-hub.tsx"));
const topicNav = strip(read("src", "components", "learn", "topic-nav.tsx"));
const topicSection = strip(read("src", "components", "learn", "topic-section.tsx"));
const footer = strip(read("src", "components", "shared", "footer.tsx"));
const prompts = read("docs", "graphics", "PROMPTS.md");

describe("what is served, and what is not", () => {
  it("ships both formats for everything the pages reference", () => {
    for (const name of ["paper", "fingerprint", "dock"]) {
      for (const ext of ["avif", "webp"]) {
        expect(
          existsSync(join(ROOT, "public", "graphics", `${name}.${ext}`)),
          `graphics/${name}.${ext} is missing`,
        ).toBe(true);
      }
    }
  });

  it("keeps parked assets out of public", () => {
    /*
     * The stone is print-only; the dots are a candidate without an
     * approved placement — their meaning belonged to the score band. The
     * tally marks joined them when the score band's own texture was retired
     * for the full-bleed red glow (see passed-band.tsx's own comment) — its
     * last caller is gone, so it is parked rather than served unreferenced.
     * Parked beside their prompts, not served: an unreferenced file in
     * public/ is an invitation for the next caller to wire it without
     * re-measuring.
     */
    for (const name of ["stone", "dots", "tally"]) {
      expect(
        existsSync(join(ROOT, "public", "graphics", `${name}.avif`)),
        `${name} is served but has no approved placement`,
      ).toBe(false);
      expect(
        existsSync(join(ROOT, "docs", "graphics", "assets", `${name}.avif`)),
        `${name} is not versioned`,
      ).toBe(true);
    }
    // The courtroom shaft IS served — grace's turn panel carries it in a CSS
    // url(), which a grep for .avif in JSX will not find. It broke once by
    // being moved on the strength of exactly that bad grep.
    expect(existsSync(join(ROOT, "public", "graphics", "courtroom.avif"))).toBe(true);
    const grace = strip(read("src", "components", "grace-screen.tsx"));
    expect(grace).toMatch(/url\(\/graphics\/courtroom\.avif\)/);
    // Its desktop/tablet companion (§31): courtroom.avif is portrait, and
    // `cover` at desktop widths blew its floor-light detail up into a blob
    // overlapping the heading — caught live on a full run through /test at
    // 1440px. courtroom-wide.avif is the same scene, composed natively
    // landscape, swapped in at `sm` and up.
    expect(existsSync(join(ROOT, "public", "graphics", "courtroom-wide.avif"))).toBe(true);
    expect(grace).toMatch(/url\(\/graphics\/courtroom-wide\.avif\)/);
    expect(existsSync(join(ROOT, "public", "paper.avif")), "paper should live under graphics/").toBe(false);
  });

  it("keeps the served set small", () => {
    // These sit behind content below the fold. A texture that costs more than
    // the page it decorates has stopped being a background.
    // The two .jpg plates are counted too: satori decodes neither AVIF nor
    // WebP, so each OG surface that wants a photograph ships a third copy of
    // it. Left out of this total, they were weight the budget could not see.
    //
    // courtroom (previously excluded from this total by oversight — it is
    // served, just referenced from a CSS url() rather than JSX) and the two
    // §31/§32 desktop-only companions (courtroom-wide, door-decision-wide)
    // are counted here, alongside the dock (grace Movement I, +142KB for a
    // genuinely new asset — Movements III and IV cost nothing here, they
    // reuse covers/ already counted in the topic-cover budget). tally
    // dropped out of this list when its last caller was retired — see the
    // parked-assets test above. The cap moved 500 -> 600 to hold all three
    // additions: real weight from two real fixes, not drift.
    const total = ["paper", "fingerprint", "door-decision", "dock"].flatMap((n) => [`${n}.avif`, `${n}.webp`])
      .concat("door.jpg", "fingerprint.jpg", "courtroom.avif", "courtroom-wide.avif", "door-decision-wide.avif", "door-decision-wide.webp")
      .reduce((sum, f) => sum + kb("public", "graphics", f), 0);
    expect(total, `served graphics total ${total.toFixed(0)} KB`).toBeLessThan(600);
  });
});

describe("the decision-screen door", () => {
  it("ships both formats, mobile and desktop", () => {
    for (const name of ["door-decision", "door-decision-wide"]) {
      for (const ext of ["avif", "webp"]) {
        expect(
          existsSync(join(ROOT, "public", "graphics", `${name}.${ext}`)),
          `graphics/${name}.${ext} is missing`,
        ).toBe(true);
      }
    }
  });

  it("stays a background, at the opacity it was measured at, in both wrappers", () => {
    /*
     * Full-bleed with no scrim, unlike the courtroom shaft. The shaft's raw
     * opacity is higher (70%) but sits under two dark gradient layers, so its
     * effective brightness is well below the tally/paper/fingerprint's
     * unscrimmed 7-16%. This has no scrim, so it is dimmed at the source
     * instead — 35%, screenshotted against 0.55 and 0.80 and chosen because
     * those two ran hotter than anything else in the set that isn't damped by
     * a scrim on top of it. Both wrappers — mobile's door-decision and
     * desktop's door-decision-wide — carry the same opacity: only the source
     * image and the responsive display class differ between them.
     */
    /*
     * The door now answers the commitment, so its opacity is a conditional
     * rather than a constant and the wrapper carries a template literal. The
     * measured value is unchanged where it was measured: 0.35 at rest, behind
     * the question and three buttons.
     *
     * On a profession of faith it brightens to 0.5 across the hold. That is a
     * different screen — one line of gold type, no buttons, nothing to read
     * over the image — which is why it is allowed to go up at all. It is
     * still pinned strictly below the 0.55 that was screenshotted and
     * rejected as too hot, so "brighter afterwards" cannot quietly become
     * "brighter than the value we already ruled out".
     */
    const wrappers = [...invitation.matchAll(
      /data-flow-graphic\s+className=\{`([\s\S]*?)`\}/g,
    )];
    expect(wrappers, "expected exactly two door wrapper divs (mobile, desktop)").toHaveLength(2);
    const [mobileClass, desktopClass] = wrappers.map((m) => m[1]);
    for (const className of [mobileClass, desktopClass]) {
      expect(className).toMatch(/pointer-events-none/);
      expect(className).toMatch(/fixed inset-0/);
      expect(className, "the resting opacity is no longer the measured 0.35").toMatch(
        /opacity-\[0\.35\]/,
      );
      const committedOpacity = className.match(/committed \? "[^"]*opacity-\[([\d.]+)\]/);
      expect(committedOpacity, "the committed branch no longer sets an opacity").not.toBeNull();
      expect(
        Number(committedOpacity![1]),
        "the door brightened past the 0.55 that was measured and rejected",
      ).toBeLessThan(0.55);
      /*
       * Both wrappers, not just whichever one a whole-file search happened to
       * hit. Review caught that the transition contract was pinned against the
       * file rather than against each responsive variant, so dropping the
       * scale, the duration or the reduced-motion escape from mobile alone
       * would have left every suite green.
       */
      expect(className, "the door no longer grows with the light").toMatch(/scale-\[1\.04\]/);
      expect(className, "the door's change is not the length of the hold").toMatch(
        /duration-\[2000ms\]/,
      );
      expect(className, "the door animates for a reader who asked for less motion").toMatch(
        /motion-reduce:transition-none/,
      );
    }
    expect(mobileClass, "the mobile wrapper should hide at sm").toMatch(/sm:hidden/);
    expect(desktopClass, "the desktop wrapper should stay hidden below sm").toMatch(/hidden/);
    expect(desktopClass, "the desktop wrapper should show at sm").toMatch(/sm:block/);

    const pictures: string[] = [];
    let cursor = invitation.indexOf("data-flow-graphic");
    for (let i = 0; i < 2; i++) {
      const pictureStart = invitation.indexOf("<picture>", cursor);
      const pictureEnd = invitation.indexOf("</picture>", pictureStart) + "</picture>".length;
      pictures.push(invitation.slice(pictureStart, pictureEnd));
      cursor = pictureEnd;
    }
    const [mobilePicture, desktopPicture] = pictures;
    expect(mobilePicture).toMatch(/door-decision\.avif/);
    expect(mobilePicture).toMatch(/door-decision\.webp/);
    expect(desktopPicture).toMatch(/door-decision-wide\.avif/);
    expect(desktopPicture).toMatch(/door-decision-wide\.webp/);
    for (const picture of [mobilePicture, desktopPicture]) {
      expect(picture).toMatch(/loading="lazy"/);
      expect(picture).toMatch(/decoding="async"/);
      expect(picture).toMatch(/alt=""/);
    }
  });

  it("appears on the decision screen alone", () => {
    for (const name of ["home-shell", "grace-screen", "grace-record", "verdict-screen"]) {
      expect(
        strip(read("src", "components", `${name}.tsx`)),
        `${name} grew the decision-screen door`,
      ).not.toMatch(/door-decision/);
    }
  });
});

describe("the learn topic-page covers", () => {
  const coverDir = join(ROOT, "public", "graphics", "covers");
  const shippedSlugs = readdirSync(coverDir)
    .filter((f) => f.endsWith(".avif"))
    .map((f) => f.replace(/\.avif$/, ""));

  it("ships both formats for every cover it names", () => {
    // Reads the component's own set rather than a hardcoded slug list, so a
    // cover added to the component without its files (or vice versa) fails
    // here instead of 404ing in the browser.
    const setMatch = topicCover.match(/new Set\(\[([^\]]*)\]\)/);
    expect(setMatch, "TOPIC_COVERS set not found").not.toBeNull();
    const declared = Array.from(setMatch![1].matchAll(/"([^"]+)"/g)).map((m) => m[1]);
    expect(declared.length, "every declared cover should be shipped").toBe(14);
    for (const slug of declared) {
      for (const ext of ["avif", "webp"]) {
        expect(
          existsSync(join(coverDir, `${slug}.${ext}`)),
          `graphics/covers/${slug}.${ext} is missing`,
        ).toBe(true);
      }
    }
    // And the reverse: no file served for a slug the component doesn't know.
    expect(shippedSlugs.sort()).toEqual(declared.sort());
  });

  it("shows the cover at full strength, framed rather than dimmed", () => {
    // Unlike the band textures, this is foreground content: no opacity
    // damping, no radial mask fading it into the page.
    expect(topicCover).not.toMatch(/opacity-\[0\./);
    expect(topicCover).not.toMatch(/maskImage/);
    expect(topicCover).toMatch(/rounded-2xl/);
    expect(topicCover).toMatch(/border border-white\/10/);
    expect(topicCover).toMatch(/object-cover/);
    // The longest topic title ("Why Does God Allow Suffering?", 29 chars)
    // wraps to 3 lines without this and eats most of the frame at 320px —
    // measured live, fixed by adding text-balance, must not silently drop.
    expect(topicCover).toMatch(/text-balance/);
    expect(topicCover).toMatch(/loading="lazy"/);
    expect(topicCover).toMatch(/decoding="async"/);
  });

  it("replaced the topic page's emblem rather than sitting beside it", () => {
    // The emblem at 32px didn't decode ("who is Jesus" as an abstract crook
    // shape read as noise); the cover is what took its place there. The hub
    // list's emblem is untouched — a separate, smaller problem left for
    // later.
    expect(topicPage).toMatch(/<TopicCover slug={topic\.slug}/);
    expect(topicPage).not.toMatch(/TopicEmblem/);
  });

  it("sets the title into the frame without borrowing the score band's face", () => {
    /*
     * Big Shoulders earns exactly one place on this site — the score band's
     * numerals (see layout.tsx's own comment: "a display face earns entry in
     * exactly one place"). The cover title reaches for scale, weight and the
     * house glow on the existing sans instead of a second display face.
     */
    expect(topicCover).toMatch(/<h1\b/);
    expect(topicCover).not.toMatch(/font-score/);
    // Exactly one heading reaches the page for a covered topic: topic-page's
    // own fallback <h1> is conditional on the cover NOT existing.
    expect(topicPage).toMatch(/hasTopicCover\(topic\.slug\)/);
    expect(topicPage.match(/<h1\b/g)?.length, "topic-page should carry no h1 of its own when a cover supplies one").toBe(1);
  });
});

describe("the cover-first learn hub (plan 015)", () => {
  it("retires the line emblem — the last surface that still wore it", () => {
    // topic-cover.tsx's own epitaph for the emblem ("a 32px line icon
    // doesn't decode... where a photograph of the same idea does") is why
    // the topic pages moved to covers first; the hub and its "Next up" /
    // "Keep digging" rows were the last surfaces still rendering it.
    expect(learnHub).not.toMatch(/TopicEmblem/);
    expect(topicNav).not.toMatch(/TopicEmblem/);
  });

  it("shares one cover-card component rather than three copies of the markup", () => {
    expect(learnHub).toMatch(/<TopicCoverCard/);
    expect(topicNav).toMatch(/<TopicCoverCard/);
  });

  it("stays in the reading column — page-shell.test.ts owns this split", () => {
    // Widening was tried during plan 015 (matching the questions-band/footer
    // grid precedent) and reverted: page-shell.test.ts already pins learn-hub
    // to the narrow reading column alongside reading-plan and next-steps, a
    // prior regression fix. The two weak covers were fixed at the source
    // (regenerated with a bold rim-lit silhouette, docs/graphics/PROMPTS.md
    // §29–§30) instead of solved by giving the grid more room.
    expect(learnHub).not.toMatch(/<PageShell width="wide">/);
  });

  it("holds band eyebrows neutral — no doctrinal red or gold as a filing label", () => {
    // Red and gold are event colours (the Law's verdict, grace's arrival),
    // not category tags for a library index — spending gold here is gold in
    // front of a reader who hasn't taken the test yet.
    expect(learnHub).not.toMatch(/band\.key === "law"[\s\S]{0,40}red-/);
    expect(learnHub).not.toMatch(/band\.key === "rescue"[\s\S]{0,40}D4A843/);
  });

  it("keeps every subtitle visible by default, never hover-only", () => {
    // Two topics are near-duplicate questions ("What Happens When You
    // Die?" / "Is There Life After Death?"); the subtitle is their only
    // disambiguator, so it cannot be gated behind a hover state the hub's
    // touch readers (the majority) can never trigger.
    expect(topicCoverCard).not.toMatch(/group-hover:opacity-100/);
    expect(topicCoverCard).not.toMatch(/group-hover:max-h/);
  });

  it("gives the hub's own first row eager loading, everything else lazy", () => {
    // 14 covers is too many to ship eager — only the first row is a
    // plausible LCP element on /learn itself.
    expect(topicCoverCard).toMatch(/loading=\{priority \? "eager" : "lazy"\}/);
    expect(learnHub).toMatch(/priority=\{bandIdx === 0 && idxInBand < 2\}/);
  });
});

describe("the topic-page section-progress bar", () => {
  it("passes TopicSection a stable callback, not a fresh one per reveal", () => {
    // Caught in review: an inline arrow here changes identity on every
    // render, and TopicSection's observer effect lists the callback as a
    // dependency — a changing reference tore down and recreated every
    // section's IntersectionObserver each time any one section was reached.
    // A freshly created observer fires immediately for whatever is already
    // intersecting, so sections still in view kept re-firing
    // trackTopicSectionReached (and markTopicCompleted on the last one).
    const topicPage = strip(read("src", "components", "learn", "topic-page.tsx"));
    expect(topicPage).toMatch(/useCallback\(/);
    expect(topicPage).toMatch(/onSectionReached=\{handleSectionReached\}/);
    expect(topicSection).toMatch(/onSectionReached\?\.\(index\)/);
  });
});

describe("each graphic stays where its meaning is", () => {
  it("holds each graphic at the opacity it was measured at", () => {
    /*
     * All tested in place, none guessed. On the record, the paper is 7% and
     * the print 9%, because at 16% the print competed with the pleas it sits
     * under.
     */
    const record = strip(read("src", "components", "grace-record.tsx"));
    expect(record).toMatch(/opacity-\[0\.07\]/);
    expect(record).toMatch(/opacity-\[0\.09\]/);
  });

  it("appears exactly where its meaning is, and nowhere else", () => {
    /*
     * The owner's rule, learned the hard way: the dots sat behind the
     * questions band because they looked good there, and their meaning —
     * many, one exception — had nothing to do with a list of learn topics.
     * Every placement now matches image to argument: a fingerprint pressed
     * into the reader's own charge sheet, on the grace record.
     *
     * The tally texture's own placement behind the score band was retired in
     * favour of a full-bleed red glow (see passed-band.tsx's own comment) —
     * pinned here as its absence, so a reversion doesn't silently bring the
     * old texture back alongside the new colour treatment.
     */
    const passed = strip(read("src", "components", "home", "passed-band.tsx"));
    expect(passed, "the retired tally texture is back").not.toMatch(/<BandTexture/);
    expect(passed, "the full-bleed glow is gone").toMatch(/radial-gradient\(ellipse 70% 55% at 50% 0%/);
    const record = strip(read("src", "components", "grace-record.tsx"));
    expect(record).toMatch(/fingerprint\.avif/);
    expect(record).toMatch(/paper\.avif/);
    // The questions band earned its own graphics through hasTopicCover — the
    // same approved, per-topic mechanism /learn uses, not a decoration
    // wired in ad hoc. Everything else stays plain.
    const questions = strip(read("src", "components", "home", "questions-band.tsx"));
    expect(questions).toMatch(/import \{ hasTopicCover \} from "@\/components\/learn\/topic-cover"/);
    expect(questions).toMatch(/hasTopicCover\(q\.slug\)/);
    for (const name of ["reading-band", "latest-post-card"]) {
      expect(
        strip(read("src", "components", "home", `${name}.tsx`)),
        `${name} grew a texture nobody approved`,
      ).not.toMatch(/BandTexture|graphics\//);
    }
  });
});

describe("grace's non-hinge movements", () => {
  const grace = strip(read("src", "components", "grace-screen.tsx"));

  it("ships the dock, and only for Movement I", () => {
    expect(grace).toMatch(/url\(\/graphics\/dock\.avif\)/);
    // Single-use, same discipline as the courtroom shaft and the decision
    // door — a background this specific belongs to one screen.
    for (const name of ["home-shell", "verdict-screen", "invitation-screen", "grace-record"]) {
      expect(
        strip(read("src", "components", `${name}.tsx`)),
        `${name} grew the dock`,
      ).not.toMatch(/dock\.avif/);
    }
  });

  it("keeps the turn as the one full-strength hinge — I, III and IV stay dimmed", () => {
    /*
     * Giving every movement the courtroom's own full-bleed treatment would
     * flatten the one moment that treatment exists to mark. I, III and IV
     * are atmosphere: radial-masked, low-opacity, same idiom as the
     * homepage's band textures — never the turn's unmasked full-bleed cover.
     */
    const maskCount = grace.match(/maskImage: "radial-gradient/g)?.length ?? 0;
    expect(maskCount, "expected exactly 3 masked movement backgrounds").toBe(3);
    expect(grace).toMatch(/opacity: 0\.16,\s*\n\s*maskImage/);
  });

  it("colours Movement I red and Movements III/IV gold, never the reverse", () => {
    // Still the Law in Movement I (see that section's own doc comment) —
    // gold there would spend grace's colour before the turn has happened.
    const movementI = grace.slice(grace.indexOf('data-reveal="0"'), grace.indexOf('data-reveal="1"'));
    expect(movementI).toMatch(/rgba\(239,68,68,0\.35\)/);
    expect(movementI).not.toMatch(/rgba\(212,168,67/);

    const movementIII = grace.slice(grace.indexOf('data-reveal="2"'), grace.indexOf('data-reveal="3"'));
    const movementIV = grace.slice(grace.indexOf('data-reveal="3"'), grace.indexOf('data-reveal="4"'));
    for (const movement of [movementIII, movementIV]) {
      expect(movement).toMatch(/rgba\(212,168,67,0\.35\)/);
      expect(movement).not.toMatch(/rgba\(239,68,68/);
    }
  });

  it("reuses who-is-jesus and what-is-repentance rather than regenerating", () => {
    // The doctrinal claim in Movement III (the payer's resurrection) and
    // Movement IV (repentance) is identical to what those two topic covers
    // already argue — a deliberate cross-reference, not a new asset.
    expect(grace).toMatch(/url\(\/graphics\/covers\/who-is-jesus\.avif\)/);
    expect(grace).toMatch(/url\(\/graphics\/covers\/what-is-repentance\.avif\)/);
  });

  it("never takes a click, and carries no meaning a reader needs", () => {
    for (const dataReveal of ['data-reveal="0"', 'data-reveal="2"', 'data-reveal="3"']) {
      const start = grace.indexOf(dataReveal);
      const sectionEnd = grace.indexOf("</section>", start);
      const section = grace.slice(start, sectionEnd);
      expect(section, `${dataReveal} background is missing aria-hidden`).toMatch(/aria-hidden="true"/);
      expect(section, `${dataReveal} background is missing pointer-events-none`).toMatch(/pointer-events-none/);
    }
  });

  it("bleeds full-width, not confined to the reading column", () => {
    /*
     * Measured on desktop: confined to the ~512px reading column, these
     * backgrounds read as a hard-edged box floating in black — the "panel
     * the band is sitting in" failure band-texture.tsx's own comment
     * warns about. Same breakout the turn already uses.
     */
    for (const dataReveal of ['data-reveal="0"', 'data-reveal="2"', 'data-reveal="3"']) {
      const start = grace.indexOf(dataReveal);
      const sectionTag = grace.slice(start, grace.indexOf(">", start));
      expect(sectionTag, `${dataReveal} lost its full-bleed breakout`).toMatch(/mx-\[calc\(50%-50vw\)\]/);
    }
  });

  it("shields the eyebrow label against the brighter parts of its own background", () => {
    /*
     * Measured (canvas-rendered, not screenshot pixels): red-400/70 and
     * gold/75 already sit near the 4.5:1 AA floor against pure black
     * (4.0:1 and 5.4:1) before any image — a bright local point in these
     * new backgrounds can push that well under 3:1. A text-shadow halo
     * claws back real contrast without changing colour or size, which
     * would be a sitewide design change well outside this PR.
     */
    for (const dataReveal of ['data-reveal="0"', 'data-reveal="2"', 'data-reveal="3"']) {
      const start = grace.indexOf(dataReveal);
      const sectionEnd = grace.indexOf("</section>", start);
      const section = grace.slice(start, sectionEnd);
      const eyebrowP = section.slice(section.indexOf("<p"), section.indexOf("</p>"));
      expect(eyebrowP, `${dataReveal} eyebrow lost its contrast shadow`).toMatch(
        /textShadow: "0 1px 3px rgba\(0,0,0,0\.9\)"/,
      );
    }
  });
});

describe("the /test share plate", () => {
  it("reads the image from disk rather than fetching it", () => {
    /*
     * Satori resolves <img src> over the network, which at build time means a
     * request to a host that may not be serving yet — the plate would render
     * silently without its background.
     */
    expect(testOg).toMatch(/readFile\(join\(process\.cwd\(\), "public", "graphics", "door\.jpg"\)\)/);
    expect(testOg).toMatch(/data:image\/jpeg;base64/);
    expect(testOg).not.toMatch(/src=\{`https?:/);
  });

  it("survives the image being missing", () => {
    // The layout is black-on-black by design; no image is a plainer card, not
    // a broken one.
    expect(testOg).toMatch(/doorSrc && \(/);
    expect(testOg).toMatch(/catch \(error\)/);
  });

  it("leaves the headline half of the frame clear", () => {
    /*
     * Measured on the source: the left 62% sits at p99 = 2 of 255, so white
     * type holds there without a scrim — and a scrim would only dull the one
     * lit thing in the picture. The right padding is what keeps the words out
     * of the light.
     */
    expect(testOg).toMatch(/paddingRight: "560px"/);
    expect(testOg, "a scrim was added over an already-black field").not.toMatch(
      /rgba\(0, ?0, ?0/,
    );
  });

  it("carries both locales", () => {
    expect(testOg).toMatch(/en: \{/);
    expect(testOg).toMatch(/pt: \{/);
    expect(testOg).toMatch(/locale === "pt" \? "pt" : "en"/);
  });
});

describe("every asset keeps its prompt", () => {
  it("documents the six, with copy markers", () => {
    // An asset whose prompt is lost cannot be regenerated at another size or
    // with one constraint changed.
    // Grows as assets do — the floor is the six originals plus the two that
    // predated the file and had their prompts back-filled, plus the
    // decision-screen door recomposed from the OG door's prompt.
    expect(prompts.match(/COPY FROM HERE/g)?.length).toBeGreaterThanOrEqual(9);
    expect(prompts.match(/Generate a new image\./g)?.length).toBeGreaterThanOrEqual(7);
  });

  it("names the assets that shipped", () => {
    for (const name of ["tally", "dots", "fingerprint", "stone", "door", "door-decision", "paper", "courtroom", "who-is-jesus", "am-i-a-good-person", "does-god-exist", "world", "dock"]) {
      expect(prompts.toLowerCase(), `${name} has no prompt on record`).toContain(name);
    }
  });
});

describe("the footer's closing verse", () => {
  it("ships both formats", () => {
    for (const ext of ["avif", "webp"]) {
      expect(
        existsSync(join(ROOT, "public", "graphics", `world.${ext}`)),
        `graphics/world.${ext} is missing`,
      ).toBe(true);
    }
  });

  it("stays a background: masked, low-opacity, bottom-anchored, no click target", () => {
    /*
     * Bottom-anchored rather than centred like the band textures — the
     * footer's height varies a lot page to page (the fact crawl and full
     * link grid on home vs. a short legal page), but the verse it sits
     * behind is always near the bottom. A fixed height anchored to the
     * bottom keeps the graphic near the verse regardless.
     */
    expect(footer).toMatch(/aria-hidden="true"/);
    expect(footer).toMatch(/pointer-events-none/);
    expect(footer).toMatch(/absolute inset-x-0 bottom-0/);
    expect(footer).toMatch(/opacity-\[0\.14\]/);
    expect(footer).toMatch(/maskImage: "linear-gradient/);
    expect(footer).toMatch(/WebkitMaskImage: "linear-gradient/);
    expect(footer).toMatch(/graphics\/world\.avif/);
    expect(footer).toMatch(/graphics\/world\.webp/);
    expect(footer).toMatch(/loading="lazy"/);
    expect(footer).toMatch(/decoding="async"/);
  });

  it("never paints over the fact crawl or the link grid", () => {
    // The content wrapper carries the same z-[1] promotion PageShell uses
    // to sit its content above its own background — without it, an
    // absolutely-positioned background at the top of a stacking context
    // paints above static content, not below it.
    expect(footer).toMatch(/relative z-\[1\] mx-auto max-w-2xl/);
  });
});

describe("the testimony story card", () => {
  it("reads the fingerprint from disk rather than fetching it", () => {
    // Same rule the /test plate learned: satori resolves <img src> over the
    // network, and at prerender that is a request to a host not serving yet.
    expect(storyOg).toMatch(
      /readFile\(join\(process\.cwd\(\), "public", "graphics", "fingerprint\.jpg"\)\)/,
    );
    expect(storyOg).toMatch(/data:image\/jpeg;base64/);
    expect(storyOg).not.toMatch(/src=\{`https?:/);
  });

  it("survives the image and the score face being missing", () => {
    // Both are decoration on a card whose words carry it. Absent, the reader
    // gets a plainer record — never a broken one, and never no card at all.
    expect(storyOg).toMatch(/printSrc && \(/);
    expect(storyOg).toMatch(/scoreFont \? "BigShoulders" : "Geist"/);
    expect(storyOg).toMatch(/allFonts\.length \? \{ fonts: allFonts \} : \{\}/);
  });

  it("carries the score face's licence beside it", () => {
    /*
     * Big Shoulders is OFL, and committing the .ttf to this repo IS
     * redistribution — the licence requires its copyright notice to travel
     * with the file. The notice names the upstream project so the next caller
     * can find where the bytes came from.
     */
    const ofl = read("src", "lib", "fonts", "OFL.txt");
    expect(ofl).toMatch(/SIL OPEN FONT LICENSE Version 1\.1/);
    expect(ofl, "the notice must name the copyright holder").toMatch(
      /Copyright 2019 The Big Shoulders Project Authors/,
    );
    expect(ofl, "the notice must name where the font came from").toMatch(
      /github\.com\/xotypeco\/big_shoulders/,
    );
  });
});
