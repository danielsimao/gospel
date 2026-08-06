# Image prompts

Every raster asset on this site is generated, and every one was generated from
a prompt in this file. Two rules follow:

- **Add the prompt here before the image lands in `public/`.** An asset whose
  prompt is lost cannot be regenerated at another size, in another crop, or
  with one constraint changed — and the next person writes a worse prompt from
  scratch rather than editing a good one.
- **The treatment is not in the prompt.** Everything here is a raw generation.
  Desaturating, contrast-crushing, AVIF/WebP encoding and damping to 8-16%
  opacity happens in code, recorded beside the asset that uses it.

## How to run them

**One prompt, one fresh chat.** Not a style preference — it is what makes them
work:

- More than one at a time and the model drops constraints.
- Pasted into a chat that already holds an image, the model reads the prompt as
  an *edit request* and refuses for want of a source. Every block opens with
  **"Generate a new image."** — keep that line.

Each block is **self-contained**: colours, composition, exclusions and style are
all inside it, because a prompt pasted alone is all the model ever sees. Never
strip the "do not include" list — it is what keeps gavels, scales and stock
crosses out.

Ask for the largest resolution available, PNG. Send results raw — no cropping,
no colour correction, no format conversion.

Two assets predate this file and are already in the flow: the courtroom shaft
(grace's turn panel, `public/courtroom.avif`) and the paper texture (the record
card, `public/paper.avif`).

---

## 1 · A parede de talhos — the tally wall

**Where it goes:** behind the score band on the homepage at ~10% opacity, red-tinted in code. The single gold stroke is drawn in code on top, so the count stays honest.

> Generate a new image.
>
> A photograph of hundreds of thin chalk tally marks scratched onto a near-black wall, in groups of five with the fifth struck diagonally across the other four. The marks are hand-made and slightly uneven, arranged in rough horizontal rows that fill the entire frame edge to edge.
>
> Colour: the background is near-black, #060404. The marks are dim pale grey, never bright white, at roughly 30% brightness. Fully desaturated — no colour cast of any kind, no warm or blue tint.
>
> Composition: square, evenly dense across the whole image, no obvious centre, no vignette, no darker corners, no border or frame.
>
> Do not include: any text, any numerals, any people, hands, faces, gavels, scales of justice, crosses, or lens flare.
>
> Style: photographic, high contrast, not illustration. Send it darker and more contrasted than looks right — it will be used as a faint background texture.

---

## 2 · A multidão — the field of many

**Where it goes:** behind the questions band, or as the score band's alternative backdrop. The one gold point is drawn in code.

> Generate a new image.
>
> A photograph of thousands of tiny dim points of light scattered evenly across a dark field, like a vast distant crowd seen at night from far above, or fine dust caught in a dark room. The points vary slightly in size and brightness but none dominates.
>
> Colour: the background is near-black, #060404. The points are dim pale grey at varying low brightness, never white, never glowing. Fully desaturated — no colour cast, no blue or warm tint.
>
> Composition: square, evenly distributed edge to edge, no visible centre, no gradient, no vignette, no darker corners, no border or frame.
>
> Do not include: any text, any numerals, any people, hands, faces, recognisable shapes, constellations, gavels, scales, crosses, or lens flare.
>
> Style: photographic, high contrast, not illustration. Send it darker and more contrasted than looks right — it will be used as a faint background texture.

---

## 3 · A impressão digital — the fingerprint

**Where it goes:** the verdict's OG/share image, and the tract backs. Testimony, identity, the record.

> Generate a new image.
>
> A single fingerprint pressed in fine metallic gold ink onto a near-black surface, centred in the frame, slightly imperfect at the edges as a real ink print would be. The ridge lines are thin, precise and clearly separated, with a little ink pooling where the finger pressed hardest.
>
> Colour: the background is near-black, #060404. The fingerprint is metallic gold, #D4A843 — the only colour in the image. Everything else is fully desaturated.
>
> Composition: square, the print centred and occupying roughly half the frame, with empty dark space around it. No vignette, no border or frame.
>
> Do not include: any text, any numerals, hands, fingers, arms, people, faces, ink pads, paper edges, gavels, scales, crosses, or lens flare.
>
> Style: photographic macro, high contrast, not illustration.

---

## 4 · A pedra da Lei — the stone of the Law

**Where it goes:** behind the questions band at low opacity — the six questions sitting on stone. Sibling of the paper texture already in the record card.

> Generate a new image.
>
> A macro photograph of a dark grey stone surface with one long thin crack running diagonally across it, lit by a single raking light from the upper left so that only the grain and the crack catch dim highlights.
>
> Colour: near-black overall, #060404 in the shadows, with the lit grain reaching no brighter than mid grey. Fully desaturated — matte and cold, no warm or brown tone, no moss green.
>
> Composition: square, the surface filling the frame edge to edge evenly, seamless enough to tile, no visible slab edge or outline, no vignette, no darker corners, no border or frame.
>
> Do not include: any text, any numerals, carvings, chisel marks, engraved letters, tablets, people, hands, gavels, scales, crosses, or lens flare.
>
> Style: photographic, high contrast, not illustration. Send it darker and more contrasted than looks right — it will be used as a faint background texture.

---

## 5 · O trigo e o joio — wheat and chaff

**Where it goes:** the reading-plan band, or a share image for the decision. Matthew 3:12 — the only one in the set with any warmth.

> Generate a new image.
>
> A macro photograph of a few dry wheat stalks lying on a dark surface, lit by a single low raking light from one side so the grain heads catch pale highlights and everything else falls into shadow.
>
> Colour: the background is near-black, #060404. Almost fully desaturated, with only the faintest warm tone left in the wheat itself — closer to grey than to gold. Nothing in the frame is bright.
>
> Composition: wide 1.91:1, the stalks lying across the lower third, the upper two thirds empty darkness with nothing in them. No vignette, no border or frame.
>
> Do not include: any text, any numerals, hands, people, faces, fields, skies, horizons, barns, sickles, gavels, scales, crosses, or lens flare.
>
> Style: photographic, high contrast, not illustration.

---

## 6 · A porta — the door

**Where it goes:** the decision screen's share image, or the next-steps hub. John 10:9 — the only shape in the set that carries hope.

> Generate a new image.
>
> A photograph of a tall narrow gap in a dark stone wall with pale daylight coming through it from the far side, seen straight on from within an otherwise near-black interior. The gap is the only light in the frame.
>
> Colour: the walls and floor are near-black, #060404. The light through the gap is pale and cool, near-white but not blown out. Fully desaturated — no warm glow, no golden hour, no colour cast.
>
> Composition: vertical 9:16, the lit gap a narrow vertical band roughly one sixth of the frame's width, everything else empty darkness. No vignette, no border or frame.
>
> Do not include: any text, any numerals, any actual door, hinges, handles, frames, steps, people, hands, faces, gavels, scales, crosses, or lens flare.
>
> Style: photographic, high contrast, not illustration.
