"use client";

/**
 * The strip along the bottom of a beat screen: where the reader is, and how
 * to go on. One component for the verdict and grace because they are one
 * instrument in two colours — the reader learns it on GUILTY and it has to
 * read as the same thing when the gold arrives. Two copies is how a pixel of
 * offset or a word of hint drifts between them, and the seam shows.
 *
 * Both rows sit at the bottom edge, which on a first visit could belong to the
 * consent banner and on an iPhone belongs to the home indicator. --consent-h
 * is published by the banner; both terms resolve to 0 where neither applies.
 */
interface BeatStripProps {
  count: number;
  current: number;
  /** The current dot's colour. The verdict's turns gold on its last beat. */
  currentClassName: string;
  /**
   * The verdict's own sentence, in both its forms. Null where tapping anywhere
   * does nothing — a hint that promised it would be a lie.
   */
  hint: { touch: string; pointer: string } | null;
  /**
   * Makes the dots a way back. A reader may return to any beat they have
   * reached and never jump past one they have not: the first pass is paced,
   * the second is free. Without this the dots are decoration, hidden from
   * assistive technology.
   */
  navigation?: {
    labels: string[];
    furthest: number;
    onSelect: (index: number) => void;
  };
}

export function BeatStrip({ count, current, currentClassName, hint, navigation }: BeatStripProps) {
  return (
    <>
      {/*
       * Persistent rather than revealed after an idle timer, and worded for
       * the device. A prompt that appears once the reader stops moving says
       * "you are doing it wrong" or "hurry up", and the count beat exists so
       * that a number climbs while nothing happens. At 9px and 30% a permanent
       * label costs a frame almost nothing, and it cannot arrive at the wrong
       * moment because it never arrives.
       *
       * Keyed on the pointer, not the width: a tablet is 768 wide and touch,
       * so a width query tells the device most likely to be held in two hands
       * to press space.
       */}
      {hint && (
        <p className="pointer-events-none absolute inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom)+var(--consent-h,0px))] z-30 text-center font-mono text-[9px] uppercase tracking-[2.4px] text-white/30 sm:text-[11px]">
          <span className="pointer-fine:hidden">{hint.touch}</span>
          <span className="hidden pointer-fine:inline">{hint.pointer}</span>
        </p>
      )}

      {/*
       * Each dot holds a 24px slot even where it is not a button, so the row
       * is the same width on both screens and a reachable dot meets the WCAG
       * 2.5.8 minimum target. The row's own offset is the old 1.75rem dot
       * line less half the slot's extra height, so the dots sit where they
       * always did.
       *
       * z-30 because grace's dots must answer above its tap surface (z-20);
       * the row itself takes no input, so a tap between dots falls through
       * to the surface and still goes on.
       */}
      <div
        aria-hidden={navigation ? undefined : "true"}
        className="pointer-events-none absolute inset-x-0 bottom-[calc(1.15625rem+env(safe-area-inset-bottom)+var(--consent-h,0px))] z-30 flex justify-center"
      >
        {Array.from({ length: count }, (_, i) => {
          const isCurrent = i === current;
          const reachable = navigation ? i <= navigation.furthest : false;
          const dot = (
            <span
              className={`h-[5px] w-[5px] rounded-full transition-colors duration-300 ${
                isCurrent ? currentClassName : reachable ? "bg-white/35" : "bg-white/15"
              }`}
            />
          );
          if (!navigation || !reachable) {
            return (
              <span key={i} className="flex size-6 items-center justify-center">
                {dot}
              </span>
            );
          }
          return (
            <button
              key={i}
              type="button"
              aria-label={navigation.labels[i]}
              aria-current={isCurrent ? "step" : undefined}
              onClick={() => navigation.onSelect(i)}
              className="pointer-events-auto flex size-6 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#D4A843]/70"
            >
              {dot}
            </button>
          );
        })}
      </div>
    </>
  );
}
