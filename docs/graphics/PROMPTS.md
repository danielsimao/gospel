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

**Copy exactly what sits between the ▼ and ▲ markers**, and nothing else. The
prose around each block explains why its paragraphs are there; it is for
whoever maintains this file, and pasting it confuses the model.

Ask for the largest resolution available, PNG. Send results raw — no cropping,
no colour correction, no format conversion.

---

## 1 · A parede de talhos — the tally wall

**Ships as:** `public/graphics/tally.avif` + `.webp` — score band, 16% opacity

**Where it goes:** behind the score band on the homepage at ~10% opacity, red-tinted in code. The single gold stroke is drawn in code on top, so the count stays honest.

**▼ COPY FROM HERE ▼**

```
Generate a new image.

A photograph of hundreds of thin chalk tally marks scratched onto a near-black wall, in groups of five with the fifth struck diagonally across the other four. The marks are hand-made and slightly uneven, arranged in rough horizontal rows that fill the entire frame edge to edge.

Colour: the background is near-black, #060404. The marks are dim pale grey, never bright white, at roughly 30% brightness. Fully desaturated — no colour cast of any kind, no warm or blue tint.

Composition: square, evenly dense across the whole image, no obvious centre, no vignette, no darker corners, no border or frame.

Do not include: any text, any numerals, any people, hands, faces, gavels, scales of justice, crosses, or lens flare.

Style: photographic, high contrast, not illustration. Send it darker and more contrasted than looks right — it will be used as a faint background texture.
```

**▲ COPY TO HERE ▲**
---

## 2 · A multidão — the field of many

**Ships as:** parked in `docs/graphics/assets/dots.avif` — removed from the questions band because its meaning (many, one exception) is the score band's argument, not a topic list's. Candidate for the /test landing; needs approval and a re-measure before serving.

**Where it goes:** behind the questions band, or as the score band's alternative backdrop. The one gold point is drawn in code.

**▼ COPY FROM HERE ▼**

```
Generate a new image.

A photograph of thousands of tiny dim points of light scattered evenly across a dark field, like a vast distant crowd seen at night from far above, or fine dust caught in a dark room. The points vary slightly in size and brightness but none dominates.

Colour: the background is near-black, #060404. The points are dim pale grey at varying low brightness, never white, never glowing. Fully desaturated — no colour cast, no blue or warm tint.

Composition: square, evenly distributed edge to edge, no visible centre, no gradient, no vignette, no darker corners, no border or frame.

Do not include: any text, any numerals, any people, hands, faces, recognisable shapes, constellations, gavels, scales, crosses, or lens flare.

Style: photographic, high contrast, not illustration. Send it darker and more contrasted than looks right — it will be used as a faint background texture.
```

**▲ COPY TO HERE ▲**
---

## 3 · A impressão digital — the fingerprint

**Ships as:** `public/graphics/fingerprint.avif` + `.webp` — pressed under the reader's own charge sheet on the grace record at 9%, above the paper at 7%. Also print (tract backs). And `.jpg` — the testimony story card (`testimony/story/route.tsx`) at 16% under the stamped verdict, finally serving the surface this section always named; JPEG because satori decodes neither AVIF nor WebP.

**Where it goes:** the verdict's OG/share image, and the tract backs. Testimony, identity, the record.

**▼ COPY FROM HERE ▼**

```
Generate a new image.

A single fingerprint pressed in fine metallic gold ink onto a near-black surface, centred in the frame, slightly imperfect at the edges as a real ink print would be. The ridge lines are thin, precise and clearly separated, with a little ink pooling where the finger pressed hardest.

Colour: the background is near-black, #060404. The fingerprint is metallic gold, #D4A843 — the only colour in the image. Everything else is fully desaturated.

Composition: square, the print centred and occupying roughly half the frame, with empty dark space around it. No vignette, no border or frame.

Do not include: any text, any numerals, hands, fingers, arms, people, faces, ink pads, paper edges, gavels, scales, crosses, or lens flare.

Style: photographic macro, high contrast, not illustration.
```

**▲ COPY TO HERE ▲**
---

## 4 · A pedra da Lei — the stone of the Law

**Ships as:** `docs/graphics/assets/stone.avif` — print only (tract backs, card surfaces); not served

**Where it goes:** behind the questions band at low opacity — the six questions sitting on stone. Sibling of the paper texture already in the record card.

**▼ COPY FROM HERE ▼**

```
Generate a new image.

A macro photograph of a dark grey stone surface with one long thin crack running diagonally across it, lit by a single raking light from the upper left so that only the grain and the crack catch dim highlights.

Colour: near-black overall, #060404 in the shadows, with the lit grain reaching no brighter than mid grey. Fully desaturated — matte and cold, no warm or brown tone, no moss green.

Composition: square, the surface filling the frame edge to edge evenly, seamless enough to tile, no visible slab edge or outline, no vignette, no darker corners, no border or frame.

Do not include: any text, any numerals, carvings, chisel marks, engraved letters, tablets, people, hands, gavels, scales, crosses, or lens flare.

Style: photographic, high contrast, not illustration. Send it darker and more contrasted than looks right — it will be used as a faint background texture.
```

**▲ COPY TO HERE ▲**
---

## 5 · O trigo e o joio — wheat and chaff

**Ships as:** not generated — dropped as the weakest idea in the set

**Where it goes:** the reading-plan band, or a share image for the decision. Matthew 3:12 — the only one in the set with any warmth.

**▼ COPY FROM HERE ▼**

```
Generate a new image.

A macro photograph of a few dry wheat stalks lying on a dark surface, lit by a single low raking light from one side so the grain heads catch pale highlights and everything else falls into shadow.

Colour: the background is near-black, #060404. Almost fully desaturated, with only the faintest warm tone left in the wheat itself — closer to grey than to gold. Nothing in the frame is bright.

Composition: wide 1.91:1, the stalks lying across the lower third, the upper two thirds empty darkness with nothing in them. No vignette, no border or frame.

Do not include: any text, any numerals, hands, people, faces, fields, skies, horizons, barns, sickles, gavels, scales, crosses, or lens flare.

Style: photographic, high contrast, not illustration.
```

**▲ COPY TO HERE ▲**
---

## 6 · A porta — the door

**Ships as:** `public/graphics/door.jpg` — the /test Open Graph plate

**Where it goes:** the decision screen's share image, or the next-steps hub. John 10:9 — the only shape in the set that carries hope.

**▼ COPY FROM HERE ▼**

```
Generate a new image.

A photograph of a tall narrow gap in a dark stone wall with pale daylight coming through it from the far side, seen straight on from within an otherwise near-black interior. The gap is the only light in the frame.

Colour: the walls and floor are near-black, #060404. The light through the gap is pale and cool, near-white but not blown out. Fully desaturated — no warm glow, no golden hour, no colour cast.

Composition: vertical 9:16, the lit gap a narrow vertical band roughly one sixth of the frame's width, everything else empty darkness. No vignette, no border or frame.

Do not include: any text, any numerals, any actual door, hinges, handles, frames, steps, people, hands, faces, gavels, scales, crosses, or lens flare.

Style: photographic, high contrast, not illustration.
```

**▲ COPY TO HERE ▲**
---

## 7 · O papel — the paper texture

**Ships as:** `public/graphics/paper.avif` + `.webp` — under the grace record at 7%, beneath the fingerprint. Predates this file; prompt recorded here so it can be regenerated.

**▼ COPY FROM HERE ▼**

```
Generate a new image.

A flat overhead scan of a sheet of old uncoated paper, evenly lit, with no
shadows and no curl. Neutral grey, desaturated, faintly fibrous, with subtle
tonal variation across the sheet and very slight age at the edges. No writing,
no printing, no lines, no stamps, no folds, no tears, no coffee stains. Square
composition, filling the frame edge to edge, seamless enough to tile. Plain,
archival, unremarkable. Photographic, not illustration.
```

**▲ COPY TO HERE ▲**

---

## 8 · A porta, centrada — the decision-screen door

**Ships as:** `public/graphics/door-decision.avif` + `.webp` — fixed full-bleed behind the decision screen (`invitation-screen.tsx`), at 35% opacity, no scrim. The dismissed response is already told "A porta continua aberta"; this is that sentence as a picture, present before it is needed. John 10:9 without a caption.

**Where it goes:** the decision screen only. Same room as §6's OG door so the two read as one world, recomposed for a portrait screen with content sitting over the middle rather than beside it: gap centred rather than in the right third, dimmer so type can sit directly over it with no scrim.

**▼ COPY FROM HERE ▼**

```
Generate a new image.

A photograph taken from inside a dark bare stone room, looking straight ahead at a tall narrow vertical gap in the centre of the far wall. Pale cool daylight comes through the gap from the far side and falls in a thin band onto the stone floor, reaching toward the viewer. The gap is the only source of light; the walls and floor are plain, rough and unornamented, and everything not touched by the light falls into deep shadow.

Colour: the stone is near-black, #060404, fully desaturated and cold. The light through the gap is pale, cool and slightly blue-neutral — daylight, not sunset. No warm glow, no golden tone, no amber.

Brightness: the light must read instantly against the black but must be DIM — soft, at most 60% brightness, with no bloom, no halo, no rays — because text will sit directly over this image and the light must never compete with it.

Composition: vertical 9:16. The gap is horizontally centred, roughly 1/10th of the image width across, running from about 15% to 75% of the frame's height. The rest of the frame is deep, even darkness with no detail.

Do not include: any text, any numerals, any actual door, door frame, hinges, handle, steps, thresholds, furniture, people, figures, silhouettes, hands, faces, clouds, sky, god rays, sunbeams, dust beams, glowing particles, halos, lens flare, stained glass, church interiors, cathedrals, arches, columns, altars, candles, gavels, scales, or crosses. This is a plain gap in a plain wall, not a doorway and not a religious building.

Style: photographic, high contrast, sharply focused, architectural, not illustration, not a 3D render.
```

**▲ COPY TO HERE ▲**

---

## 9 · O espelho — the mirror (am-i-a-good-person)

**Ships as:** `public/graphics/covers/am-i-a-good-person.avif` + `.webp` — pilot cover for the topic page hero, full-strength (not a dimmed background), replacing the standalone emblem above the title.

**Where it goes:** the topic page for `am-i-a-good-person`, law band. The Law as a mirror is the doctrine itself (James 1:23) — not a decorative pick — and photographic clarity fixes what the small line-icon couldn't: a mirror reads instantly, the abstract emblem did not.

**▼ COPY FROM HERE ▼**

```
Generate a new image.

A photograph of an old mirror mounted on a plain dark wall, angled slightly so
its glass reflects nothing recognizable — only darkness and a faint pale
sheen where the light catches it. The mirror's glass is foxed and mottled with
age, its frame plain and unornamented. Everything around it is deep shadow.

Colour: near-black, #060404, fully desaturated and cold. The pale sheen in the
glass is neutral, not warm — no golden tone, no amber glow.

Composition: portrait 4:3. The mirror sits centred, filling the middle third
of the frame vertically, with generous dark space above and below it.

Do not include: any text, any numerals, any reflection of a person, hands,
faces, silhouettes, furniture, ornate frames, gilt, candles, gavels, scales,
or crosses.

Style: photographic, high contrast, sharply focused, not illustration, not a
3D render.
```

**▲ COPY TO HERE ▲**

---

## 10 · O horizonte — the horizon (does-god-exist)

**Ships as:** `public/graphics/covers/does-god-exist.avif` + `.webp` — pilot cover, same treatment as §9.

**Where it goes:** the topic page for `does-god-exist`, questions band. Cool and evidentiary rather than sentimental — deliberately not a warm, literal sunrise, which would read as mood rather than argument.

**▼ COPY FROM HERE ▼**

```
Generate a new image.

A photograph of a plain dark horizon line where land meets sky, seen from a
low, still viewpoint. A single hairline of pale light traces the horizon;
everything above and below it falls into deep, even darkness. No sun disc, no
clouds, no stars, nothing else visible in the frame.

Colour: near-black, #060404, fully desaturated and cold. The hairline of light
is pale and cool, near-white — no warm glow, no gold, no amber, no orange, not
a sunrise or sunset in colour.

Composition: wide 16:9, the horizon line running perfectly straight roughly
through the centre of the frame. No vignette, no border.

Do not include: any text, any numerals, any people, silhouettes, birds,
buildings, mountains, trees, or other landmarks on the horizon line — it must
read as empty and featureless.

Style: photographic, high contrast, sharply focused, not illustration, not a
3D render.
```

**▲ COPY TO HERE ▲**

---

## 11 · O cajado — the shepherd's staff (who-is-jesus)

**Ships as:** `public/graphics/covers/who-is-jesus.avif` + `.webp` — pilot cover, same treatment as §9.

**Where it goes:** the topic page for `who-is-jesus`, rescue band. Same concept as the existing line-icon (John 10, the Good Shepherd) recomposed photographically — a real staff reads unambiguously where the abstract crook shape did not.

**▼ COPY FROM HERE ▼**

```
Generate a new image.

A photograph of a single plain wooden shepherd's crook, leaning alone against
a bare dark stone wall, its foot resting on a stone floor. Nobody is holding
it. One raking light from the upper side catches the wood's grain and the
curve of the crook; everything else falls into deep shadow.

Colour: near-black, #060404, fully desaturated and cold. The wood carries only
the faintest neutral tone — no warm honey colour, no golden glow, no amber.

Composition: portrait 4:3. The crook stands at a slight diagonal, off-centre,
filling the middle of the frame with generous dark space around it.

Do not include: any text, any numerals, any people, hands, faces,
silhouettes, sheep, animals, sandals, robes, gavels, scales, or crosses.

Style: photographic, high contrast, sharply focused, not illustration, not a
3D render.
```

**▲ COPY TO HERE ▲**

---

## 12 · O feixe de luz — the courtroom shaft

**Ships as:** `public/graphics/courtroom.avif` — grace's turn panel, behind "Mas alguém entra no tribunal", under two damping veils. Referenced from CSS `url()` in grace-screen, so a JSX grep will not find it.

**▼ COPY FROM HERE ▼**

```
Generate a new image.

A photograph of a single shaft of pale daylight falling through a tall unseen
window onto a bare stone floor, in a large empty room. Near-black throughout,
almost monochrome, with only the light itself bright. Deep shadow occupying
most of the frame. Extremely high contrast, large simple shapes, very little
detail. Vertical 9:16 composition. The upper two thirds are almost entirely
dark and empty. No people, no furniture, no text, no visible window frame.
Architectural, austere, quiet. Photographic, not illustration.
```

**▲ COPY TO HERE ▲**

---

## 13 · O mundo — the world, from height (footer's closing verse)

**Ships as:** `public/graphics/world.avif` + `.webp` — bottom-anchored behind the closing verse in `src/components/shared/footer.tsx`, 14% opacity, linear-fade mask, site-wide on every page that carries the footer.

**Where it goes:** the one truly universal element on the site — the closing verse every page ends on, regardless of topic. Not a reuse of the door, horizon or courtroom shaft: each of those already carries a specific meaning elsewhere, and reusing them here would dilute that. The verse's own word — "the world" — is the brief.

**▼ COPY FROM HERE ▼**

```
Generate a new image.

A photograph of the earth's curved horizon seen from high altitude, near the
edge of space, looking along the curve rather than straight down. A thin pale
line of atmosphere traces the horizon; the earth's surface below it is dark
and almost featureless — no visible continents, coastlines, city lights, or
weather systems, just a dark curved mass. Above the horizon, deep black space
with no stars, no sun, no moon, no lens flare.

Colour: near-black, #060404, fully desaturated and cold throughout. The thin
atmospheric line is pale and cool — a faint blue-white, never warm, never
gold, never orange, not a sunrise or sunset in colour.

Composition: wide 16:9. The horizon curve sits low in the frame, in the
bottom quarter, curving gently across the full width. The upper three
quarters of the frame are empty black space with nothing in them — that
space is where text will sit.

Do not include: any text, any numerals, any stars, clouds, continents,
coastlines, city lights, satellites, spacecraft, astronauts, people, hands,
faces, the sun, the moon, lens flare, or a visible atmosphere glow in any
colour but pale cool blue-white.

Style: photographic, high contrast, sharply focused, not illustration, not a
3D render, not a stock-photo Earth-from-space cliché with visible continents.
```

**▲ COPY TO HERE ▲**

---

## 14 · A pergunta — the site mark

**Ships as:** `src/app/icon.svg`, and the four rasters generated from it —
`src/app/apple-icon.png` (180), `src/app/favicon.ico` (16/32/48), 
`public/icon-192.png`, `public/icon-512.png`.

**No prompt.** This one is in the file because the rule at the top says every
asset records how it was made, and "how" here was not a prompt — it was a font
and a parser. Recorded so the next person can regenerate it rather than
redraw it by eye.

### How to regenerate

The mark is the Big Shoulders glyph for `?`, converted from TrueType
quadratics to SVG paths and baked in as outlines, so the icon needs no font at
runtime. Source: `bigshoulders700.ttf`, glyph id **568**, two contours — the
body and a **rectangular** dot (not a circle; that is the face's character and
the thing a hand-drawn version gets wrong).

Two departures from the raw glyph, and only two:

- The dot is nudged down, opening the gap from **5 to 7.2 units** in the 64
  viewBox. At 16px the font's own spacing lets body and dot merge into a blob.
- Nothing else. A draft grew the dot 18% "so it survives 16px"; measured, the
  font's dot already renders 2.68 × 1.95px there, and the enlargement pushed
  its height to a fractional 2.30px — the same half-lit-rows problem that rules
  out thin strokes elsewhere in this file.

The rasters are all `rsvg-convert` from `icon.svg`, so they cannot drift from
it. The `.ico` is PNG-in-ICO at 16/32/48.

### Why it is red, and why that is not an omission

Gold on this site arrives once, late, on ground the red has drained out of
(`verdict-screen.tsx`). A favicon is the earliest thing a stranger sees, so
gold there spends the arrival before the Law has said anything — see
`METHOD.md:119`, "Grace is never offered before the Law has done its work."
Several gold variants were drawn and rejected on that basis, including a gold
cross, which additionally collides with `why-the-cross`'s emblem and with this
file's own reject list.

### Why a question mark

The domain is not a question. It is a conditional with the second half
missing: *if you died today…* has no main clause, and the reader supplies it.
The mark is the punctuation the name withholds — which is a reason no other
site can borrow, because it comes from the name rather than from the subject.

---

## 15 · As pegadas — the footprints (why-are-you-afraid-to-die)

**Ships as:** `public/graphics/covers/why-are-you-afraid-to-die.avif` + `.webp` — homepage questions-band card and the topic page cover, same treatment as §9. Until the asset lands (and the slug joins `TOPIC_COVERS` in `topic-cover.tsx` — one line), the homepage card wears the gold medallion on its own ground; the flip is automatic.

**Where it goes:** the third card of the homepage questions band, and the topic page for `why-are-you-afraid-to-die`. Same concept as the existing line-icon (Footprints) recomposed photographically — the §11 move: a trail that simply stops is the question's own image, austere rather than morbid. The exclusion list bars the "Footprints" poem cliché (a second trail) along with every grave-and-skull shortcut; the image must ask the question, not answer it with props.

**▼ COPY FROM HERE ▼**

```
Generate a new image.

A photograph of a single trail of bare footprints pressed into a thin layer of pale dust on a dark stone floor, walking away from the viewer into deep darkness. The trail starts at the lower edge of the frame and simply stops partway in — the last print or two fainter than the rest, with untouched dust beyond them. One low raking light from the side catches the edges of the prints; everything else falls into deep shadow.

Colour: near-black, #060404, fully desaturated and cold. The dust is dim pale grey, never white; the prints read by shadow, not by colour. No warm tone, no gold, no amber.

Composition: portrait 4:3. The trail runs from the bottom of the frame toward the upper third at a slight diagonal, ending well before any wall or horizon. Generous even darkness on every side, so the frame crops safely at other aspect ratios. No vignette, no border or frame.

Do not include: any text, any numerals, any people, legs, feet, shoes, silhouettes, shadows of figures, a second trail of footprints, sand dunes, beaches, water, skulls, bones, graves, headstones, coffins, candles, gavels, scales, crosses, or lens flare.

Style: photographic, high contrast, sharply focused, not illustration, not a 3D render.
```

**▲ COPY TO HERE ▲**

---

## 16 · A primeira luz — first light (does-god-exist, recomposed)

**Ships as:** shipped briefly, superseded by §18 — kept for the record. The recomposition gave §10's hairline enough weight to hold a card, but the owner ruled the line itself too thin an idea: twice generated, it stayed a picture of almost nothing. §18 changes the argument instead of the exposure.

**Where it goes:** the third card of the homepage questions band and the topic page for `does-god-exist`. §10's rationale stands — cool and evidentiary, deliberately not a warm sunrise, light arriving out of darkness rather than mood — but the hairline is now a narrow graded band with enough presence to hold a card, and the composition is portrait with the horizon just below centre so it survives all three crops in use (3:4 card, 2.6:1 phone card, 4:3 topic page).

**▼ COPY FROM HERE ▼**

```
Generate a new image.

A photograph of a plain dark horizon at the very first moment of dawn, seen from a low, still viewpoint. A narrow band of pale cool light sits along the horizon line, brightest at the line itself and fading quickly into deep darkness both upward into the sky and downward across the land. No sun disc, no clouds, no stars — only the light itself, arriving.

Colour: near-black, #060404, fully desaturated and cold. The light is pale blue-white, never warm — no gold, no amber, no orange, not a sunrise or sunset in colour.

Brightness: the band must read instantly against the black but stay dim — at most 60% brightness at the line itself, with no bloom, no rays, no halo — because a gold title sits over the lower part of this image and the light must never compete with it.

Composition: portrait 4:3. The horizon line runs perfectly straight across the full width, slightly below the centre of the frame. The land below it is featureless darkness; the sky above it is featureless darkness beyond the narrow band. Generous even darkness at the top and bottom edges, so the frame crops safely at other aspect ratios. No vignette, no border or frame.

Do not include: any text, any numerals, any sun, moon, stars, clouds, birds, people, silhouettes, buildings, mountains, trees, roads, water, reflections, or other landmarks — the horizon must read as empty and featureless.

Style: photographic, high contrast, sharply focused, not illustration, not a 3D render.
```

**▲ COPY TO HERE ▲**

---

## 17 · A pedra removida — the stone rolled away (who-is-jesus)

**Ships as:** `public/graphics/covers/who-is-jesus.avif` + `.webp` — replaces §11's files under the same names, so `TOPIC_COVERS` and the topic page are untouched.

**Where it goes:** the topic page for `who-is-jesus`, rescue band. §11's crook recomposed the line-icon faithfully, but a leaning stick answers the question with a prop. The empty tomb answers it with the claim — the one fact the topic's whole argument stands on (1 Cor 15:14) — and it speaks the site's existing grammar of stone and arriving light (§§6, 8, 12) without a figure, which the house rules bar in any case. The exclusions keep it a tomb and not a cave, a garden, or an Easter card: no light rays, no glow from within, no angels, no cloth, no dawn sky. The stone aside and the dark opening are the whole statement.

**▼ COPY FROM HERE ▼**

```
Generate a new image.

A photograph of the entrance to an ancient rock-cut tomb: a low rounded opening in a rough stone face, with a massive circular stone slab rolled aside to one side of it, resting against the rock. The opening is dark and empty. Thin pale early light falls across the stone face and catches the rim of the rolled slab and the edge of the opening; everything else falls into deep shadow.

Colour: near-black, #060404, fully desaturated and cold. The light is pale and neutral — no warm glow, no golden hour, no amber.

Composition: wide 4:3. The opening sits just off-centre with the rolled stone beside it, together filling roughly the middle half of the frame, with generous even darkness around them on every side so the frame crops safely at other aspect ratios. Seen straight on from a low, still viewpoint. No vignette, no border or frame.

Do not include: any text, any numerals, any people, figures, silhouettes, angels, hands, faces, folded cloth, linen, light rays, god rays, light coming from inside the tomb, glowing interiors, dawn skies, sun discs, gardens, flowers, trees, paths, steps, Roman soldiers, spears, helmets, gavels, scales, crosses, or lens flare. The opening is dark; the only light is the thin early light on the outside stone.

Style: photographic, high contrast, sharply focused, architectural, not illustration, not a 3D render.
```

**▲ COPY TO HERE ▲**

---

## 18 · O relógio — the watchmaker's movement (does-god-exist)

**Ships as:** `public/graphics/covers/does-god-exist.avif` + `.webp` — replaces §16's files under the same names, so `TOPIC_COVERS` and every consumer are untouched.

**Where it goes:** the third card of the homepage questions band and the topic page for `does-god-exist`. The horizon (§10, §16) was cool and evidentiary but twice proved a picture of almost nothing; this is the topic's own apologetic made visible — Paley's watch, the argument Comfort runs as "a building proves a builder": an exposed mechanical movement, every part meshed with the next, is a made thing asking for its maker. No dial and no numerals — partly the house text rule, partly the point: the argument is the mechanism, not the time.

**▼ COPY FROM HERE ▼**

```
Generate a new image.

A macro photograph of the open back of an old mechanical pocket watch lying on a dark stone surface, its case back removed so the movement is exposed: interlocking gears of different sizes, a coiled spring, tiny screws, every part meshed with the next. One low raking light from the side catches the teeth of the gears and the edges where they mesh; everything else falls into deep shadow.

Colour: near-black, #060404, fully desaturated and cold. The metal is dim steel grey — no gold, no brass, no copper, no amber, no warm tone of any kind.

Composition: portrait 4:3, seen from directly above. The watch lies just off-centre, filling roughly half the frame, with generous even darkness around it on every side so the frame crops safely at other aspect ratios. No vignette, no border or frame.

Do not include: any text, any numerals, any watch dial, clock face, clock hands, Roman numerals, engraved lettering, brand names, chains, straps, people, fingers, hands, workbenches, tools, loupes, other watches, gavels, scales, crosses, or lens flare. Only the open movement and the dark stone it lies on.

Style: photographic macro, high contrast, sharply focused, not illustration, not a 3D render.
```

**▲ COPY TO HERE ▲**

---

## The remaining topic covers (§19–§28)

Ten of the fourteen learn topics still wear the line emblem on its own ground.
These are their covers, written together so the set reads as one hand rather
than ten separate commissions.

Three rules run through all ten, and they are the reason the blocks look alike:

- **The emblem is the brief.** §11 and §15 set the move — take the topic's
  existing line-icon and recompose it photographically, so the cover and the
  emblem argue the same thing. Where a block departs from its emblem, the
  prose above it says why, and the reason is always a collision with an image
  this file has already spent.
- **Nothing decorative gets a second job.** The exclusion lists bar the props
  that turn austerity into a stock photo — gavels, scales, glowing crosses,
  skulls, candles, doves, rays of light — and each block adds the specific
  cliché its own subject attracts.
- **Portrait 4:3, with darkness to spare.** Every cover is cropped three ways
  (3:4 hub card, 2.6:1 phone card, 4:3 topic page), so the subject sits well
  inside the frame and the edges stay empty. §16 learned this the hard way.

Three of the ten also carry a title over the image on the homepage questions
band — `what-happens-when-i-die`, `why-does-god-allow-suffering` and
`what-is-the-gospel`. Those three carry the brightness ceiling §16 introduced;
the other seven do not need it.

Until an asset lands **and** its slug joins `TOPIC_COVERS` in
`topic-cover.tsx` (one line each), the topic keeps its emblem. The flip is
automatic and the two can be done in any order — `graphics.test.ts` fails if a
slug is declared without its files, so the test is the ratchet, not a
convention.

---

## 19 · A folha de acusação — the charge sheet (what-is-sin)

**Ships as:** `public/graphics/covers/what-is-sin.avif` + `.webp` — topic page cover, same treatment as §9.

**Where it goes:** the topic page for `what-is-sin`, law band. The emblem is a scroll of text (`ScrollText`), and the recomposition makes it the reader's own charge sheet — the app's word for the same object on the grace record. Sin as a written record rather than a mood is the doctrine the topic teaches: it is countable, specific, and against someone. The lines run off the frame because the count is the point and the count does not end.

**▼ COPY FROM HERE ▼**

```
Generate a new image.

A photograph of a single sheet of aged paper lying flat on dark stone, covered edge to edge in dense handwritten lines in dark ink. The writing is small, tight and unreadable — line after line after line, with no margins and no gaps, running off the bottom edge of the sheet as though the page could not hold it. One low raking light from the side catches the paper's grain and its slightly curled edge; everything around it falls into deep shadow.

Colour: near-black, #060404, fully desaturated and cold. The paper is dim grey, never white or cream; the ink reads darker still. No warm tone, no gold, no amber, no sepia.

Composition: portrait 4:3. The sheet sits centred and fills the middle of the frame at a slight angle, with generous even darkness on every side, so the frame crops safely at other aspect ratios. No vignette, no border or frame.

Do not include: any legible text, any real words, any numerals, any letters that resolve on close inspection, any people, hands, pens, quills, ink bottles, wax seals, ribbons, scrolls with ornate rods, gavels, scales, crosses, or candles.

Style: photographic, high contrast, sharply focused, not illustration, not a 3D render.
```

**▲ COPY TO HERE ▲**

---

## 20 · A ampulheta — the hourglass (what-happens-when-i-die)

**Ships as:** `public/graphics/covers/what-happens-when-i-die.avif` + `.webp` — homepage questions-band card and the topic page cover, same treatment as §9.

**Where it goes:** the second card of the homepage questions band, and the topic page for `what-happens-when-i-die`, law band. The emblem is an hourglass and it recomposes directly. Nearly run out rather than half full: the topic is not that time passes but that it ends. Every grave-and-skull prop is barred — the question is austere, and the props answer it with a mood instead of a fact.

**▼ COPY FROM HERE ▼**

```
Generate a new image.

A photograph of a plain glass hourglass standing on dark stone, almost run out — only a small mound of sand left in the upper bulb, with a thin thread of grains falling. The frame is simple turned wood, unornamented. One low raking light from the side catches the glass edges and the falling thread; everything else falls into deep shadow.

Colour: near-black, #060404, fully desaturated and cold. The sand and the glass highlights are dim pale grey, never white. No warm tone, no gold, no amber, no brass.

Brightness: the hourglass must read instantly against the black but stay dim — no bloom, no glow, no rays, no lens flare — because a title sits over the lower part of this image on the homepage card and the image must never compete with it.

Composition: portrait 4:3. The hourglass stands centred, filling the middle third of the frame vertically, with generous even darkness above, below and to both sides, so the frame crops safely at other aspect ratios. No vignette, no border or frame.

Do not include: any text, any numerals, any people, hands, silhouettes, skulls, bones, graves, headstones, coffins, clocks, watches, calendars, wilting flowers, candles, gavels, scales, or crosses.

Style: photographic, high contrast, sharply focused, not illustration, not a 3D render.
```

**▲ COPY TO HERE ▲**

---

## 21 · O rebento — the shoot (is-there-life-after-death)

**Ships as:** `public/graphics/covers/is-there-life-after-death.avif` + `.webp` — topic page cover, same treatment as §9.

**Where it goes:** the topic page for `is-there-life-after-death`, questions band. The emblem is a sprout (`Sprout`) and it recomposes directly — and the image is Paul's own argument in 1 Corinthians 15, where what is sown is not what rises. Stone rather than soil, so it reads as life from where life does not come, and the shoot stays pale and desaturated: a green sprig would turn the argument into springtime.

**▼ COPY FROM HERE ▼**

```
Generate a new image.

A photograph of a single thin shoot with two small leaves pushing up through a narrow crack in a slab of dark stone. The stone is dry, cold and featureless apart from the crack; the shoot is slender and stands only a few centimetres. One low raking light from the side rims the leaves and the edge of the crack; everything else falls into deep shadow.

Colour: near-black, #060404, fully desaturated and cold. The shoot is pale grey, never green and never bright; the stone is darker still. No warm tone, no gold, no amber, no colour of any kind.

Composition: portrait 4:3. The shoot sits centred in the lower middle of the frame, small against a large field of stone and darkness, with generous even darkness above and to both sides, so the frame crops safely at other aspect ratios. No vignette, no border or frame.

Do not include: any text, any numerals, any people, hands, soil, pots, gardens, fields, flowers, blossom, butterflies, sunlight, sunbeams, rays, doves, skies, skulls, graves, candles, gavels, scales, or crosses.

Style: photographic, high contrast, sharply focused, not illustration, not a 3D render.
```

**▲ COPY TO HERE ▲**

---

## 22 · A bússola — the compass (what-is-the-meaning-of-life)

**Ships as:** `public/graphics/covers/what-is-the-meaning-of-life.avif` + `.webp` — topic page cover, same treatment as §9.

**Where it goes:** the topic page for `what-is-the-meaning-of-life`, questions band. The emblem is a compass (`Compass`) and it recomposes directly. Worn and scratched rather than pristine, because the question is asked by someone who has already been walking a while. The needle is left settled, not spinning: the topic answers the question rather than celebrating the search, and a spinning needle would make aimlessness the point.

**▼ COPY FROM HERE ▼**

```
Generate a new image.

A photograph of an old pocket compass lying open on dark stone, its glass scratched and its face worn almost blank, the needle settled and still. The case is plain and unengraved. One low raking light from the side catches the rim of the case and the edge of the glass; everything else falls into deep shadow.

Colour: near-black, #060404, fully desaturated and cold. The metal is dull grey, never polished, never brass and never gold; the face is dim grey, never white. No warm tone, no amber.

Composition: portrait 4:3. The compass sits centred, filling roughly the middle third of the frame, with generous even darkness on every side, so the frame crops safely at other aspect ratios. No vignette, no border or frame.

Do not include: any legible text, any letters, any numerals, any cardinal-point markings that resolve on close inspection, any people, hands, maps, charts, globes, ships, telescopes, sextants, wooden desks, candles, gavels, scales, or crosses.

Style: photographic, high contrast, sharply focused, not illustration, not a 3D render.
```

**▲ COPY TO HERE ▲**

---

## 23 · A água funda — deep water (why-does-god-allow-suffering)

**Ships as:** `public/graphics/covers/why-does-god-allow-suffering.avif` + `.webp` — homepage questions-band card and the topic page cover, same treatment as §9.

**Where it goes:** the fifth card of the homepage questions band, and the topic page for `why-does-god-allow-suffering`, questions band. The emblem is waves (`Waves`) and it recomposes directly — the psalms' deep waters, which is the register this topic is written in. No storm, no wreck, no drama: the grief this page meets is heavy rather than spectacular, and a shipwreck would make somebody else's catastrophe of it.

**▼ COPY FROM HERE ▼**

```
Generate a new image.

A photograph of open deep water at night, seen close to the surface — a slow heavy swell with no breaking crest and no foam, its ridges catching a faint pale sheen. No horizon, no sky, no shore, no vessel: the frame holds nothing but moving water and darkness.

Colour: near-black, #060404, fully desaturated and cold. The sheen on the water is dim pale grey, never white and never blue. No warm tone, no gold, no amber.

Brightness: the water must read instantly against the black but stay dim — no bloom, no glare, no moonlight path, no rays, no lens flare — because a title sits over the lower part of this image on the homepage card and the image must never compete with it.

Composition: portrait 4:3. The swell runs across the full width of the frame, with the darkest, quietest water at the bottom edge and generous even darkness at the top, so the frame crops safely at other aspect ratios. No vignette, no border or frame.

Do not include: any text, any numerals, any people, hands, swimmers, boats, ships, wrecks, sails, lighthouses, piers, rocks, land, horizon line, sky, moon, stars, lightning, rain, breaking waves, whitecaps, spray, candles, gavels, scales, or crosses.

Style: photographic, high contrast, sharply focused, not illustration, not a 3D render.
```

**▲ COPY TO HERE ▲**

---

## 24 · O embrulho — the plain parcel (what-is-the-gospel)

**Ships as:** `public/graphics/covers/what-is-the-gospel.avif` + `.webp` — homepage questions-band card and the topic page cover, same treatment as §9.

**Where it goes:** the sixth card of the homepage questions band, and the topic page for `what-is-the-gospel`, rescue band — the anchor topic of the whole hub. The emblem is a gift (`Gift`), and the recomposition keeps the gift while stripping everything festive from it: plain paper, coarse string, no ribbon and no bow. The doctrine is that the gospel is a gift rather than a wage (Romans 6:23), and a birthday parcel would make it a treat. Unopened, deliberately — the topic makes the offer, it does not perform the reader's acceptance of it.

**▼ COPY FROM HERE ▼**

```
Generate a new image.

A photograph of a small parcel wrapped in plain coarse paper and tied with rough string, sitting on dark stone. The paper is creased and unprinted; the string is knotted once, with no bow, no ribbon, no label and no seal. The parcel is closed. One low raking light from the side catches the creases in the paper and the twist of the string; everything else falls into deep shadow.

Colour: near-black, #060404, fully desaturated and cold. The paper is dim grey, never brown, never cream and never white. No warm tone, no gold, no amber.

Brightness: the parcel must read instantly against the black but stay dim — no bloom, no glow, no rays, no lens flare — because a title sits over the lower part of this image on the homepage card and the image must never compete with it.

Composition: portrait 4:3. The parcel sits centred, filling roughly the middle third of the frame, with generous even darkness on every side, so the frame crops safely at other aspect ratios. No vignette, no border or frame.

Do not include: any text, any numerals, any people, hands, bows, ribbons, gift tags, wax seals, wrapping patterns, confetti, balloons, Christmas imagery, candles, doves, rays of light, gavels, scales, or crosses.

Style: photographic, high contrast, sharply focused, not illustration, not a 3D render.
```

**▲ COPY TO HERE ▲**

---

## 25 · A viga — the upright timber (why-the-cross)

**Ships as:** `public/graphics/covers/why-the-cross.avif` + `.webp` — topic page cover, same treatment as §9.

**Where it goes:** the topic page for `why-the-cross`, rescue band. The emblem is a cross on a hill (`CrossOnHill`), and this is the one subject in the file the reject list already names — "stock crosses" are barred everywhere else precisely so that the topic *about* the cross can use one without inheriting the cliché. So it is built rather than symbolic: rough sawn timber, tool marks, the grain visible, photographed from below and close enough that it reads as an execution stake rather than a shape. Empty, and no sunset behind it. The site's own reject list stands: the gold cross was drawn and rejected (§14), and nothing here reintroduces it.

**▼ COPY FROM HERE ▼**

```
Generate a new image.

A photograph looking up at a rough-hewn wooden upright and crossbeam against a black sky, seen from close below and slightly to one side, so the timbers run out of the frame. The wood is coarse sawn timber with visible grain, splinters and tool marks, weathered and unpainted, joined plainly. It is empty. One hard low light from the side rakes across the grain; the sky behind is featureless black.

Colour: near-black, #060404, fully desaturated and cold. The wood is dim grey, never brown and never warm. No gold, no amber, no orange, no sunset colour of any kind.

Composition: portrait 4:3. The upright runs vertically slightly off-centre with the crossbeam entering the upper third, both cropped by the frame edges, and generous even darkness around them, so the frame crops safely at other aspect ratios. No vignette, no border or frame.

Do not include: any text, any numerals, any people, figures, bodies, hands, nails, blood, crowns of thorns, ropes, crowds, hills with three crosses, silhouetted crosses on horizons, sunsets, sunrises, sunbeams, rays of light, glowing edges, doves, clouds, churches, ornate or metal or jewellery crosses, candles, gavels, or scales.

Style: photographic, high contrast, sharply focused, not illustration, not a 3D render.
```

**▲ COPY TO HERE ▲**

---

## 26 · A bacia — the basin (how-can-my-sins-be-forgiven)

**Ships as:** `public/graphics/covers/how-can-my-sins-be-forgiven.avif` + `.webp` — topic page cover, same treatment as §9.

**Where it goes:** the topic page for `how-can-my-sins-be-forgiven`, rescue band. This is the one block that departs from its emblem, and the reason is collision: the emblem is an open door (`DoorOpen`) and this file has already spent the door twice — §6 for the share plate and §8 for the decision screen — so a third would read as the same asset rather than as this topic's own. The washing takes its place, which the topic's own scripture carries (Isaiah 1:18, "though your sins be as scarlet, they shall be as white as snow"). Still water rather than the act of washing: nobody is performing the cleansing, which is the whole doctrine of the page.

**▼ COPY FROM HERE ▼**

```
Generate a new image.

A photograph of a plain stone basin standing on dark stone, filled to the brim with perfectly still, clear water. The basin is unornamented and slightly worn at the rim. The water's surface is flat and unbroken, holding a faint pale sheen where the light catches it, reflecting nothing recognizable. One low raking light from the side catches the rim and the surface; everything else falls into deep shadow.

Colour: near-black, #060404, fully desaturated and cold. The sheen on the water and the lit edge of the stone are dim pale grey, never white and never blue. No warm tone, no gold, no amber.

Composition: portrait 4:3. The basin sits centred, filling roughly the middle third of the frame, with generous even darkness above, below and to both sides, so the frame crops safely at other aspect ratios. No vignette, no border or frame.

Do not include: any text, any numerals, any people, hands, faces, reflections of figures, towels, cloths, jugs, soap, ripples, splashes, running water, fountains, doors, doorways, thresholds, keys, chains, doves, rays of light, candles, gavels, scales, or crosses.

Style: photographic, high contrast, sharply focused, not illustration, not a 3D render.
```

**▲ COPY TO HERE ▲**

---

## 27 · A curva — the turn (what-is-repentance)

**Ships as:** `public/graphics/covers/what-is-repentance.avif` + `.webp` — topic page cover, same treatment as §9.

**Where it goes:** the topic page for `what-is-repentance`, rescue band. The emblem is a reversing arrow (`Undo2`) and the recomposition is the turn itself, seen from above: a track that goes one way, doubles back hard, and leaves in the other direction. Deliberately not footprints — §15 has those, and this would read as the same asset. The track is bare because repentance is a change of direction rather than an emotion, which is the correction this topic exists to make: no tears, no kneeling figure, no altar.

**▼ COPY FROM HERE ▼**

```
Generate a new image.

A photograph looking straight down from above at a narrow track worn into pale dust across dark stone. The track comes in from the bottom edge of the frame, runs forward, then doubles back on itself in a single hard hairpin turn and leaves by the bottom edge again, heading the other way. Nothing else is in the frame. One low raking light from the side gives the worn track its edge; everything around it falls into deep shadow.

Colour: near-black, #060404, fully desaturated and cold. The dust is dim pale grey, never white. No warm tone, no gold, no amber.

Composition: portrait 4:3, a flat overhead view with no perspective and no horizon. The hairpin sits in the middle of the frame with generous even darkness on every side, so the frame crops safely at other aspect ratios. No vignette, no border or frame.

Do not include: any text, any numerals, any people, figures, kneeling, hands, feet, footprints, shoes, tyre tracks, road markings, signs, arrows, crossroads, forks, maps, altars, churches, tears, candles, doves, rays of light, gavels, scales, or crosses.

Style: photographic, high contrast, sharply focused, not illustration, not a 3D render.
```

**▲ COPY TO HERE ▲**

---

## 28 · A âncora — the anchor (how-can-i-be-saved)

**Ships as:** `public/graphics/covers/how-can-i-be-saved.avif` + `.webp` — topic page cover, same treatment as §9.

**Where it goes:** the topic page for `how-can-i-be-saved`, rescue band. The emblem is an anchor (`Anchor`) and it recomposes directly — Hebrews 6:19, hope as an anchor of the soul, sure and steadfast. Set and holding rather than lying loose on a deck: the topic's answer is that the reader's safety rests on something already fixed, and a decorative nautical anchor would make it a motif. The chain runs out of frame because what it is fastened to is not in the picture, which is the point.

**▼ COPY FROM HERE ▼**

```
Generate a new image.

A photograph of a heavy old iron anchor set into dark rock, one fluke buried and the shank angled upward, with a thick chain running taut from its ring out of the top of the frame. The iron is pitted and rough with age. One low raking light from the side catches the chain links and the edge of the shank; everything else falls into deep shadow.

Colour: near-black, #060404, fully desaturated and cold. The iron is dull grey, never rusted orange, never polished and never brass. No warm tone, no gold, no amber.

Composition: portrait 4:3. The anchor sits centred in the lower two thirds of the frame with the chain rising out of the top edge, and generous even darkness on every side, so the frame crops safely at other aspect ratios. No vignette, no border or frame.

Do not include: any text, any numerals, any people, hands, divers, boats, ships, harbours, quays, ropes, nets, buoys, fish, seaweed, coral, bubbles, water surface, sky, horizon, nautical decoration, candles, gavels, scales, or crosses.

Style: photographic, high contrast, sharply focused, not illustration, not a 3D render.
```

**▲ COPY TO HERE ▲**
