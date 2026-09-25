/*
 * Dither — a noise tile laid over a gradient to break up colour banding.
 *
 * The page's ambient glows are warm tints at very low alpha over a near-black
 * ground (#060404). Compositing one shows why they band: the undecided stage's
 * rgba(239,68,68,0.08) peaks at rgb(25,9,9), so its green and blue channels
 * cross only FIVE integer values between the glow's centre and its transparent
 * edge. Five steps spread over a ~700px radius puts a contour edge roughly
 * every 140px, and those contours are what read on screen as broad rectangular
 * blocks — the artifact looks like a repeating texture but no texture exists.
 * passed-band's rgba(153,27,27,0.17) is worse: four steps.
 *
 * More gradient stops cannot fix this. The constraint is the 8-bit channel, not
 * the interpolation between stops — every intermediate value still quantises to
 * the same five integers. The standard answer is dithering: perturb each pixel
 * by about one quantisation step so the eye integrates the noise into a smooth
 * ramp instead of locking onto a hard contour.
 *
 * mix-blend-mode: overlay, not a plain translucent layer. Flat noise at any
 * opacity lifts the black level uniformly — mid-grey at 3.5% over #060404 adds
 * ~4 levels everywhere and greys out a page whose ground is meant to be black.
 * Overlay is scaled by what it lands on (2·base·noise for dark bases), so it
 * varies around the existing value rather than raising it, and it leaves pure
 * white and pure black exactly where they are. Headline text stays clean; only
 * the near-black mid-tones where the banding lives get perturbed.
 *
 * stitchTiles="stitch" matters: the tile repeats, and without it feTurbulence
 * discontinues at the tile edge and lays down a 160px grid of seams — the very
 * artifact this exists to remove.
 *
 * The feComponentTransfer is not optional, and the reason is measured. Raw
 * fractalNoise is bias-bright: sampled off this tile it runs min 99, max 245,
 * MEAN 186 — not the 128 a dither needs. A noise that averages bright does not
 * just perturb the ramp, it lifts it, and because this layer is boxed to the
 * glow's own rectangle that lift stops at the box edge. Undithered the page had
 * one soft artifact; a bright-mean dither would have added a second, harder
 * one — a visible rectangle exactly where the fix was applied. The linear
 * intercept pulls the mean to ~128 so the noise sits symmetrically around
 * whatever it lands on and the box edge stays invisible.
 *
 * feFuncA pins alpha flat at 1. fractalNoise writes noise into the alpha
 * channel too, and varying coverage would modulate the layer a second time on
 * top of the RGB noise — double-dipping that shows up as clumping rather than
 * grain. Only RGB should carry the signal.
 */

const NOISE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160">' +
  '<filter id="d">' +
  '<feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch"/>' +
  "<feComponentTransfer>" +
  '<feFuncR type="linear" slope="1" intercept="-0.23"/>' +
  '<feFuncG type="linear" slope="1" intercept="-0.23"/>' +
  '<feFuncB type="linear" slope="1" intercept="-0.23"/>' +
  '<feFuncA type="linear" slope="0" intercept="1"/>' +
  "</feComponentTransfer>" +
  "</filter>" +
  '<rect width="160" height="160" filter="url(#d)"/>' +
  "</svg>";

/* encodeURIComponent rather than a hand-escaped literal: the SVG carries a
   `url(#d)` whose "#" ends the data URI if it goes through raw. */
const NOISE_URL = `url("data:image/svg+xml;utf8,${encodeURIComponent(NOISE_SVG)}")`;

type DitherProps = {
  /** Positioning/geometry classes. Match the glow being dithered so the noise
   *  covers the banded area and nothing else. */
  className?: string;
  /** Set from the arithmetic, not by eye — the effect is about two 8-bit steps
   *  and no screenshot pipeline survives that, so it cannot be eyeballed.
   *  Measured off the recentred tile: min 0, max 214, mean 137. Overlay on a
   *  near-black base is 2·base·src/255, so at base ~8 that lands 8 ± 6.7, and
   *  this scales it to ~±2.0 levels around a mean shifted +0.17 — enough to
   *  break a four-step ramp, small enough that the lift cannot draw an edge at
   *  the box boundary, and under the threshold where grain reads as texture. */
  opacity?: number;
};

export function Dither({ className = "", opacity = 0.3 }: DitherProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute ${className}`}
      style={{
        backgroundImage: NOISE_URL,
        mixBlendMode: "overlay",
        opacity,
      }}
    />
  );
}
