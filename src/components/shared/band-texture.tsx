/*
 * Only what ships. "dots" was here once with a gold point drawn on top —
 * many, one exception — and was removed: that meaning belonged to the score
 * band, and behind a list of learn topics it was decoration wearing the wrong
 * argument. It is back, without the gold point, behind the /test landing
 * question — "many" fits a reader about to join everyone else who has taken
 * this; "one exception" does not, because no verdict has happened for this
 * reader yet. METHOD.md is stricter than the old meaning-mismatch anyway:
 * "Gold does not appear during the Law," and landing is the step before the
 * Law starts. Moved here from components/home because a second consumer
 * outside home/ made "home" the wrong shelf for it — same reason ScrollCue
 * lives in this folder.
 */
type Texture = "tally" | "dots";

/**
 * How hard each texture is pushed, and why the two differ.
 *
 * Both were measured in place rather than guessed. The tally marks are bright
 * strokes on black, so they survive being dimmed — at 16% they read as a wall
 * the score is scratched onto, and at 28% they start fighting the caption
 * under the numerals. The dot field is denser and flatter, so it needs less:
 * at 12% it reads as many, at 22% the question chips start to look like they
 * are floating on a textured wall rather than sitting on the page.
 */
const TEXTURE: Record<Texture, { opacity: string; alt: string }> = {
  tally: { opacity: "0.16", alt: "tally" },
  dots: { opacity: "0.12", alt: "dots" },
};

/**
 * A generated texture behind a band or a full screen.
 *
 * `opacity` overrides the measured default above, and exists because that
 * default is a property of the PLACEMENT, not of the image: 0.16 was measured
 * behind the scoreline, which is two numerals and a lot of open black. Behind
 * the ledger the same strokes land at the weight of the row rules, so structure
 * and wall become indistinguishable — and tally marks behind a list of counted
 * rows read as a second count that disagrees with the first. Re-measured there
 * rather than assumed; see the call in passed-band.
 *
 * Absolutely positioned, wider than its band, and masked to nothing before it
 * reaches the edges — a rectangle of texture with visible corners reads as a
 * panel the band is sitting in, which is the opposite of what a background is
 * for. The radial mask is what makes it atmosphere.
 *
 * `aria-hidden` and `pointer-events-none`: it carries no meaning a reader
 * needs and must never take a click meant for a chip.
 *
 * AVIF with a WebP fallback via <picture>, and both are small — 78 KB and
 * 67 KB for tally — because the source images are mostly black. Every
 * existing caller sits below the fold, so `loading="lazy"` was never a
 * choice to make. `priority` exists because the dots are not: they are the
 * background of the /test landing screen, the first thing painted in the
 * whole flow, and lazy-loading the first screen's own background is the
 * bug lazy-loading exists to describe, not a case of it working correctly.
 * Same rule topic-cover-card.tsx already applies to its first hub row.
 */
export function BandTexture({
  texture,
  opacity: override,
  priority = false,
}: {
  texture: Texture;
  opacity?: string;
  priority?: boolean;
}) {
  const opacity = override ?? TEXTURE[texture].opacity;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-[-14%] inset-y-[-8%] overflow-hidden"
      style={{
        opacity,
        maskImage: "radial-gradient(ellipse at center, black 32%, transparent 79%)",
        WebkitMaskImage: "radial-gradient(ellipse at center, black 32%, transparent 79%)",
      }}
    >
      <picture>
        <source srcSet={`/graphics/${texture}.avif`} type="image/avif" />
        <img
          src={`/graphics/${texture}.webp`}
          alt=""
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="size-full object-cover"
        />
      </picture>
    </div>
  );
}
