# Tem volta? (temvolta.pt)

A Portuguese campaign concept. It borrows the ritual of **Volta**, Portugal's bottle and can return system, to ask the Law's question: *"A máquina só aceita embalagens intactas. E tu? Eras aceite?"* ("The machine only accepts intact containers. And you? Would you be accepted?")

It's a **campaign front door** for Se Morresses Hoje. After the three exits, it hands off to that site's reading plan, questions and find-a-church pages, and **never** to `/pt/next-steps`: that page sends anyone without a recorded answer back to the homepage. Nothing here is part of the Next.js app.

| file | what it is |
|---|---|
| `dist/index.html` | The owner's concept board: the idea, the bridge, three mock-ups of the ways in, guardrails and open items. It is written to be published as an Artifact, so it has no `<html>` skeleton. |
| `dist/tem-volta.html` | The experience: about 30 one-beat cards in PT-PT with *tu*, built on the Once Stories engine. |
| `PROMPTS.md` | Three image prompts in the house style. Results go in `assets/`. |

## Rules it keeps

- **Brand.** It borrows the ritual, never the brand. No Volta logo, "V" mark, colours or domain. volta.com.pt is SDR Portugal's official site, and Volta® is registered. Every card and the tract say "Sem ligação ao sistema Volta de embalagens."
- **Naming God.** God is named on card 2 and on the tract's back. No bait-and-switch.
- **The metaphor is a light touch.**
  - It carries the hook, the receipt, and one deliberate break at the cross: "a máquina paga-te por voltares. Deus não te paga. Ele pagou por ti."
  - The receipt lists the reader's own **violations**. The status is left for the reader to fill in.
- **The method is unchanged:**
  - The reader gives the verdict.
  - Grace comes only after it.
  - Three identical exits, with no decisionism.
  - Mortality appears in the Law half only.

## Scripture

The text is **Bíblia Livre** (Diego Santos, Mario Sérgio, Marco Teles), Creative Commons Atribuição (CC BY). Its Isaiah 44:22 reads *"volta a mim, pois eu já te resgatei"*.

Placeholders are `{{BLV:Ref}}` in `.js` and `[[BLV:Ref]]` in `.html`. They are filled by Once's scripts; no verse is typed by hand. **Confirm the edition date for the CC BY credit before going public.**

## Build and verify

```bash
# PorBLivre.json: raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json/PorBLivre.json
node prototypes/once/scripts/extract-verses.mjs path/to/PorBLivre.json --prefix BLV --root prototypes/volta --no-john --license "Bíblia Livre … CC BY"
node prototypes/volta/scripts/make-qr.mjs        # the tract's QR code → src/qr-temvolta.svg
node prototypes/once/scripts/build.mjs --prefix BLV --root prototypes/volta --no-john
node prototypes/volta/scripts/verify.mjs [screenshot-dir]
```

`verify.mjs` covers:
- **Method:** verses against the source, Law-phase answers, post-exit copy, and card order.
- **Brand and links.**
- **Browser:** three paths at 360×640, 375×667, 390×844 and 1280×800, with no card scrolling, the word budget, and identical exits.
- **The take-away** and **the board.**

It is not a `*.test.*` file, so it stays out of vitest and the pre-push hook.
