import { BandSpine } from "@/components/home/band-spine";

/**
 * John 3:16, as the page's last word.
 *
 * The blog card used to close the homepage, and when the blog went quiet its
 * slot was a hole. Filling it with another card would have been the obvious
 * move and the wrong one: the page's problem was never a missing widget, it
 * was ending on one. A reader who has just met a scoreline, six questions and
 * a reading plan should be let go by something that is not a link.
 *
 * So the page ends the way the flow ends — in gold, quietly. Same shape as
 * grace's own scripture beat: a centred verse and its reference, nothing to
 * click, the fact crawl and the footer underneath.
 *
 * No new copy in either locale. `grace.scripture` and `grace.scriptureRef` are
 * the strings the grace screen already carries, reused verbatim — the same
 * words the reader meets at the end of the argument, met here first.
 */
export function ClosingVerse({
  scripture,
  scriptureRef,
}: {
  scripture: string;
  scriptureRef: string;
}) {
  return (
    <div className="mt-14 w-full max-w-md sm:max-w-2xl">
      <BandSpine label={scriptureRef} tone="gold" />
      <p className="text-balance text-center text-[15px] italic leading-[1.85] text-white/60 sm:text-base">
        &ldquo;{scripture}&rdquo;
      </p>
    </div>
  );
}
