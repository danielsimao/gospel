/*
 * Only what ships. "dots" was here and was removed: its meaning — many, one
 * exception — belonged to the score band, and behind the questions it was
 * decoration wearing the wrong argument. The asset is parked in
 * docs/graphics/assets as a candidate for the /test landing; re-add the union
 * member when a placement earns it, not before, because a member with no
 * served file behind it is a 404 waiting for the next caller.
 */
type Texture = "tally";

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
};

/**
 * A generated texture behind a homepage band.
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
 * 67 KB — because the source images are mostly black. They sit behind
 * content that is already below the fold, so neither is on the LCP path.
 */
export function BandTexture({
  texture,
  opacity: override,
}: {
  texture: Texture;
  opacity?: string;
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
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />
      </picture>
    </div>
  );
}
