# Once: a competitor prototype

A standalone concept built as if by a competitor to ifyoudiedtoday.com, for
side-by-side comparison. It is a Living Waters / Way of the Master presentation
in three lengths, designed for a reader who visits once. **Nothing here is part
of the Next.js app**, and nothing in `src/` imports it.

| page | what it is |
|---|---|
| `dist/stories.html` | **3 minutes.** The default front door: the landing page *is* the first question. Four commandments, one beat per card, and no card ever scrolls. |
| `dist/conversation.html` | **6 minutes.** A scripted (not AI) conversation in Comfort's street order, with an atheist branch and the false-believer diagnostic. |
| `dist/letter.html` | **15 minutes.** "To someone I'll probably never meet." A long read with the answers tapped inline, plus "Examine yourself". |
| `dist/john.html` | The whole Gospel of John, readable and printable. |
| `dist/index.html` | The owner's gallery: the thesis, the comparison, the rules. It is written to be published as an Artifact, so it has no `<html>` skeleton. |

Open the variants straight from `dist/` in a browser; they need no server.

## The rules every variant keeps

They follow `docs/METHOD.md`:

- **Law before grace.** No cross or comfort before the reader's own verdict.
  Objections raised during the Law are parked, not debated, and answered after
  the verdict.
- **Testimony is never a shortcut.** "Good person?" and "why would God let you
  in?" are quoted back to the reader. They never shorten the Law.
- **Three equal exits.** They look identical, all appear at once, none is
  preselected, and there is no confirm step.
- **No decisionism.** Every promise after the exits is conditional.
- **Mortality appears in the Law half only.** Nothing about death or deadlines
  appears from repent-and-trust onwards.
- **Nothing leaves the device.** sessionStorage only, and no backend.

## Stories: one beat per card

Stories is the default front door, built for a phone and a short attention span:

- **No card ever scrolls.** `verify-ui.mjs` walks three paths at 360×640, 375×667,
  390×844 and 1280×800 and fails if any card, in any answered state, overflows.
  A small `fitCard()` step can scale type down to 0.8 as a safety net, but at
  375×667 no card is allowed to need it.
- **Answers replace, never stack.** Choosing swaps the buttons for the reply in
  the same place.
- **At most 60 words per card**, buttons and references included, with at most
  one short verse fragment. The short copy lives in `ONCE.stories` (`content.js`)
  and `ONCE_OBJECTIONS.short` (`objections.js`).
- **Prototype: night colour.** A labelled switch above the first cards compares
  navy, blue-hour violet, warm charcoal and ink black, and disappears at dawn.
  `stories.html#violet`, `#charcoal`, `#ink` or `#navy` opens with that colour.
  Once one is chosen, it replaces the switch everywhere.

## Scripture

Every quotation is a placeholder that is filled from the **Berean Standard
Bible**, which was dedicated to the public domain on 2023-04-30. Placeholders
are `{{BSB:Ref}}` in `.js` files and `[[BSB:Ref]]` in `.html` files. A
`|fragment` suffix quotes part of a verse and is checked to be an exact
substring of it. No verse is typed by hand.

## Rebuild and verify

```bash
# 1. Resolve references. BSB.json comes from
#    raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json/BSB.json
node prototypes/once/scripts/extract-verses.mjs path/to/BSB.json   # → data/verses.json

# 2. Build src/ → dist/. Fails on any unresolved reference.
node prototypes/once/scripts/build.mjs

# 3. Method checks: walks every conversation path, objections,
#    post-exit copy, and verse text against the BSB.
node prototypes/once/scripts/verify-method.mjs

# 4. Browser checks: every variant at 390px and 1280px, three paths each,
#    plus the take-away kit. Needs Playwright (a global install is enough).
node prototypes/once/scripts/verify-ui.mjs [screenshot-dir]
```

None of these are `*.test.*` files, so they stay out of vitest and the
pre-push hook. Biome does lint everything here.
