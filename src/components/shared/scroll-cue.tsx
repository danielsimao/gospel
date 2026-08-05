/**
 * "There is more below this."
 *
 * Two screens need it and they must not drift apart, because they are the same
 * promise made twice: grace opens with a full viewport and the argument beneath
 * it, and the verdict in re-read mode puts its only forward control 34px below
 * the fold. Both were measured as false bottoms at 390×844 — a section that
 * fills the viewport exactly, with nothing intruding, reads as the end of the
 * page.
 *
 * Why it moves. Grace's cue used to be a static 10px mark. Static arrows are
 * routinely missed; motion is pre-attentive — the eye is drawn to it without
 * deciding to look — which is the whole reason a scroll cue animates at all.
 * The travel is deliberately small: 6px is enough to register in peripheral
 * vision and not enough to compete with the gold headline above it, which is
 * the one thing on that screen that must dominate.
 *
 * Why it is bigger. 10px was below noticing. This is ~16px of chevron under a
 * hairline, which reads at arm's length without becoming a second focal point.
 *
 * Decorative, so `aria-hidden` and no accessible name: a screen reader meets
 * the argument itself next, in reading order, and does not need to be told to
 * scroll. That also means no WCAG target-size rule applies — nothing here is
 * interactive.
 *
 * Reduced motion is handled in globals.css against `data-slot="scroll-cue"`,
 * following the fact crawl's precedent: it stops moving and stays visible,
 * rather than disappearing. A reader who asked for less motion still needs to
 * know the page continues.
 */
export function ScrollCue({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      data-slot="scroll-cue"
      className={`flex flex-col items-center gap-2 animate-[scroll-cue_2.1s_ease-in-out_infinite] ${className}`}
    >
      <span className="h-8 w-px bg-gradient-to-b from-transparent to-[#D4A843]/40" />
      {/* Two borders on a rotated square. An SVG would need a title to satisfy
          the a11y lint, and titling a decoration is worse than not having one —
          this has no accessible surface at all. */}
      <span className="size-4 rotate-45 border-r border-b border-[#D4A843]/70" />
    </span>
  );
}
