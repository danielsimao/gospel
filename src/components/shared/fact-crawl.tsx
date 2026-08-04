interface FactCrawlProps {
  facts: string[];
}

/**
 * The mortality facts as a wire feed, on the top edge of the footer.
 *
 * They used to sit in the hero as a single rotating line on a 9-second timer,
 * advancing sequentially from the first. That put the two facts that actually
 * address the reader — "You are not guaranteed tomorrow" and the life
 * expectancy line — at t=36s and t=72s. Nobody waits on a homepage that long,
 * so the best copy on the page was unreachable. A crawl shows all nine
 * continuously instead of hiding eight of them behind a queue.
 *
 * It then lived at the foot of the homepage, above the footer, which is the
 * same place it sits now — except it is now the footer's own top edge, and on
 * every page rather than one. The footer already drew a hairline there; the
 * crawl replaces that line with a moving one, so the page gains no band it did
 * not have. `border-b` only: the rule beneath it is the footer's own.
 *
 * Site-wide, because the fact does not stop being true on /learn. What stops it
 * is proximity — see globals.css, which retires the broadcast strip over the
 * verdict, grace and the invitation: "a ticking death count over the grace
 * screen argues against the screen". The immersive routes have no footer, so
 * that boundary holds without a condition here.
 *
 * The broadcast idiom is already this app's: see `sticky-death-counter`, which
 * calls itself an emergency-broadcast strip. Same family — mono, hairline
 * rules, a live dot — but in flow rather than fixed.
 *
 * A CSS keyframe, not framer: this animates for the whole visit, and CSS
 * animation runs off the main thread where a JS loop would drop frames during
 * navigation. The reduced-motion stop lives in globals.css, since
 * MotionConfig's reducedMotion only governs framer's own animations.
 */
export function FactCrawl({ facts }: FactCrawlProps) {
  if (facts.length === 0) return null;

  return (
    <div
      className="print-hide relative w-full overflow-hidden border-b border-white/[0.06] bg-white/[0.012] py-2.5"
      // The visible text is a decorative repeat of copy the crawl duplicates
      // for seamless looping; announcing a moving marquee twice helps nobody.
      // The list below carries the same facts for assistive tech, unmoving.
      aria-hidden="true"
    >
      <div
        data-slot="fact-crawl-track"
        className="flex w-max animate-[fact-crawl_90s_linear_infinite] gap-10 whitespace-nowrap hover:[animation-play-state:paused]"
      >
        {/* Two identical passes: the keyframe translates by exactly -50%, so the
            second pass is under the cursor at the moment the first leaves. The
            duplicate is dropped under reduced motion, where nothing scrolls and
            a second copy would just repeat every fact. */}
        {[0, 1].map((pass) => (
          <div
            key={pass}
            data-slot={pass === 1 ? "fact-crawl-dupe" : undefined}
            className="flex shrink-0 gap-10"
          >
            {facts.map((fact) => (
              <span
                key={fact}
                className="flex items-center gap-3 font-mono text-[10px] tracking-[1.5px] text-white/45 sm:text-[11px]"
              >
                <span
                  aria-hidden="true"
                  className="size-1 shrink-0 rounded-full bg-red-500/70"
                />
                {fact}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * The same facts, static and readable, for assistive technology and print.
 * Rendered alongside the crawl so nothing in it is available to sighted readers
 * only.
 */
export function FactList({ facts }: FactCrawlProps) {
  if (facts.length === 0) return null;
  return (
    <ul className="sr-only">
      {facts.map((fact) => (
        <li key={fact}>{fact}</li>
      ))}
    </ul>
  );
}
