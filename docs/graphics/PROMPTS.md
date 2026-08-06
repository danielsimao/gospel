# Image prompts

Every raster asset on this site is generated, and every one of them was
generated from a prompt in this file. Two rules follow from that:

- **Add the prompt here before the image lands in `public/`.** An asset whose
  prompt is lost cannot be regenerated at a different size, in a different
  crop, or with one constraint changed — and the next person will write a worse
  prompt from scratch rather than editing a good one.
- **The treatment is not in the prompt.** Everything here is a raw generation.
  Desaturating, contrast-crushing, encoding to AVIF/WebP and damping to 8–16%
  opacity happens in code, and is recorded beside the asset that uses it.

Two assets predate this file and are already in the flow: the courtroom shaft
(grace's turn panel, `public/courtroom.avif`) and the paper texture (the record
card, `public/paper.avif`). Their prompts are in the session that made them;
regenerate from #4's shape if either is ever needed again.

---

Six prompts. **One prompt, one fresh chat** — and that is not a style
preference, it is what makes them work:

- Pasting more than one at a time makes the model drop constraints.
- Pasting into a chat that already holds an image makes it read the prompt as
  an *edit request*, and it refuses for want of a source. Every block below
  therefore opens with **"Generate a new image."** — keep that line.

Ask for the largest resolution available, PNG.

**Reject and regenerate if you see any of:** people, faces, hands, lettering or
numerals of any kind, a gavel, scales of justice, a blindfolded figure, a cross
as a decorative motif, warm brown "biblical" colour, lens flare, or a visible
border/frame around the image.

Everything below is destined for a **near-black page** (`#060404`) and will be
desaturated, contrast-crushed and dropped to 8–16% opacity. So: **send it darker
and more contrasted than looks right on its own.** Gold, where it appears, is
`#D4A843`.

Two of these (1 and 2) are things I would otherwise draw in code. Generated as
images they will be *atmospheric rather than exact* — an image model cannot
count, so the tally strokes and the dot field will not have a countable number
of marks. That is fine for a background texture and fatal for anything that
claims to be a real count, so these will be used as texture only.

---

## 1 · A parede de talhos — the tally wall

**Where it goes:** behind the score band on the homepage, at ~10% opacity, red
strokes only. The single gold stroke is added in code on top, so the count can
be honest.

> **Generate a new image.**
>
> A photograph of hundreds of thin white chalk tally marks scratched onto a
> near-black wall, in groups of five with the fifth struck diagonally across the
> other four. The marks are hand-made and slightly uneven, arranged in rough
> horizontal rows filling the entire frame edge to edge. Near-black background,
> almost monochrome, extremely high contrast, the marks dim rather than bright.
> No text, no numerals, no people, no border. Square composition, evenly dense
> across the whole image with no obvious centre. Photographic, not illustration.

---

## 2 · A multidão — the field of many

**Where it goes:** behind the questions band, or as the score band's alternative
backdrop. The one gold point is added in code.

> **Generate a new image.**
>
> A photograph of thousands of tiny dim points of light scattered evenly across
> a near-black field, like a distant crowd seen at night from far above, or dust
> caught in a dark room. The points vary slightly in size and brightness but
> none dominates. Almost monochrome, extremely high contrast, no bright areas.
> No text, no people, no shapes, no constellations, no border. Square
> composition, evenly distributed edge to edge with no visible centre or
> gradient. Photographic, not illustration.

---

## 3 · A impressão digital — the fingerprint

**Where it goes:** the verdict's OG/share image, and the tract backs. Testimony,
identity, the record — the reader's own confession made into a mark.

> **Generate a new image.**
>
> A single fingerprint pressed in fine metallic gold ink onto a near-black
> surface, centered in the frame, slightly imperfect at the edges as a real ink
> print would be. The ridge lines are thin, precise and clearly separated, with
> some ink pooling where the finger pressed hardest. Almost monochrome — only
> the gold carries any colour. No hands, no fingers visible, no text, no border,
> nothing else in the frame. High contrast, photographic macro, not
> illustration. Square composition.

---

## 4 · A pedra da Lei — the stone of the Law

**Where it goes:** behind the questions band at low opacity — the six questions
literally sitting on stone. Sibling of the paper texture already made for the
record.

> **Generate a new image.**
>
> A macro photograph of a dark grey stone surface with one long thin crack
> running diagonally across it, lit by a single raking light from the upper left
> so only the grain and the crack catch dim highlights. Near-black overall,
> matte, cold. No moss, no writing, no carvings, no chisel marks, no visible
> edge of a slab. The surface fills the frame edge to edge evenly. High
> contrast, photographic, not illustration. Square composition, seamless enough
> to tile.

---

## 5 · O trigo e o joio — wheat and chaff

**Where it goes:** the reading-plan band, or a share image for the decision.
Matthew 3:12 — the one image in this set that is scriptural rather than
architectural, and the only one with any warmth in it.

> **Generate a new image.**
>
> A macro photograph of a few dry wheat stalks lying on a near-black surface,
> lit by a single low raking light from one side so the grain heads catch pale
> highlights and everything else falls into shadow. Desaturated almost to
> monochrome, only the faintest warm tone in the wheat. No hands, no field, no
> sky, no text, no border. The stalks occupy the lower third; the upper two
> thirds are empty darkness. High contrast, photographic, not illustration.
> Wide 1.91:1 composition.

---

## 6 · A porta — the door

**Where it goes:** the decision screen's share image, or the `next-steps` hub.
John 10:9. Only image in the set that carries any hope in its shape.

> **Generate a new image.**
>
> A photograph of a tall narrow gap in a dark stone wall, with pale daylight
> coming through it from the far side, seen straight on in an otherwise
> near-black interior. The gap is the only light in the frame. The stone is
> plain and unornamented. Almost monochrome, extremely high contrast, no visible
> door, no hinges, no handle, no people, no text, no border. Vertical 9:16
> composition, with the light occupying a narrow vertical band and everything
> else empty darkness. Photographic, not illustration.

---

## When they come back

Send them over as they are — raw, full resolution, no cropping or colour
correction. Treatment (desaturate, crush, AVIF/WebP encode, opacity, damping
veils) happens on my side, the same way the courtroom shaft and the paper
texture were handled.
