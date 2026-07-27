# "Good Enough" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A short, shareable interactive page at `/good-enough` where the reader tries to earn their way across, cannot, and is handed the gospel.

**Status:** grilled 2026-07-27, all items resolved. Ready to build.

**Implements:** idea 2 from `2026-07-27-homepage-idea-backlog.md` (graded A).

**Origin:** owner's idea — *"if you click this button, you will go to heaven, but the button is impossible to click, and we end up giving the gospel."*

---

## Research findings, and how they changed the design

I was going to build a "press to earn your way in" progress bar. Research says don't.

**1. The canyon jump is an established gospel illustration for exactly this point.** Widely used for Romans 3:23 — *"all have sinned and **fall short** of the glory of God."* One person jumps a foot, another twenty feet, another sets a world record at fifty. The canyon is eighteen miles. All land in the same place. Its argument is that **comparison between people is irrelevant against the standard** — which is also the Good Person Test's entire argument, so this is not a novelty bolted on, it's the app's own thesis made physical.

**2. The app already forbids the metaphor I was about to use.** From `learn.topics[am-i-a-good-person]`:

> *"The Ten Commandments are not a **ladder you climb** to reach heaven — they're a mirror."*

A progress bar you fill by pressing **is a ladder**. It would contradict the app's own copy. "Fall short of a distance" does not. This alone rules out the first design.

**3. The same topic already names the trap the interaction exposes:**

> *"Ask almost anyone, 'Are you a good person?' and you'll hear the same answer: 'I think so. I mean, I'm not perfect, but…' And there it is — the comparison."*

**4. Ray Comfort's own signature illustration is the parachute**, not this — it is about the *urgency and value* of salvation, not the impossibility of earning it. So the canyon does not collide with a Living Waters property, unlike "The 180" (see the vocabulary map). Nothing here is borrowed from a title that means something else.

Sources: [Romans 3:23 illustrated](https://www.heartlight.org/gallery/6607.html) · [Bridge diagram](https://weareibc.com/share-the-gospel-using-the-bridge-diagram/) · [Comfort's parachute](http://foundright.org/ray-comfort-parachute-analogy/) · [Way of the Master](https://en.wikipedia.org/wiki/The_Way_of_the_Master)

---

## The interaction

A gap. One button. **Jump.**

```
   you ●                                    the other side
       └───── 4 ft ─────┘                              ┆
                        ▁▁▁▁▁▁▁▁▁▁▁▁ 18 miles ▁▁▁▁▁▁▁▁▁┆
```

**Decided: escalating help.** Each press does not just try harder — it gives the
reader *more*, and none of it bridges the gap.

| press | help | distance | remaining |
| --- | --- | --- | --- |
| 1 | — | 4 ft | 95,036 ft |
| 2 | a run-up | 20 ft | 95,020 ft |
| 3 | a pole vault | 50 ft — a world record | 94,990 ft |
| 4 | rocket boots | 200 ft | 94,840 ft |

Funnier than repetition, and theologically exact: the props are works, religion,
effort and self-improvement. Adding more never bridges it, and the problem was
never that the reader failed to out-jump the person beside them.

**Rewarding the effort is the argument.** A button that mocks the reader by
refusing to be pressed says "you are being toyed with". A jump that genuinely
goes further every time and still falls short says "your effort is real and it
is not the issue" — which is the actual doctrine.

Then:

> Fifty feet is a world record. The gap is eighteen miles.
> Nobody is arguing you didn't jump further than the last person.
> **"For all have sinned and fall short of the glory of God."** — Romans 3:23
> **[ So how does anyone get across? → ]**

Which lands on grace — the bridge someone else built, the fine someone else paid.

## Grill outcomes (2026-07-27)

**The far side is never drawn.** Fifty feet against eighteen miles is ~0.05%.
To scale, no press appears to do anything; not to scale, the reader can see they
crossed a third of it and the argument collapses. So: frame the near edge only,
far side permanently off-screen, and let a numeric remaining-distance counter
carry the point. The reader visibly moves and the destination never appears.
Works at 390px, and it is honest.

**It does not undercut the test, on method grounds.** The jump is *general* —
everyone falls short. The test is *personal* — have **you** ever told a lie.
Comfort's whole insistence is that the Law must get specific rather than stay
abstract, so the jump cannot substitute for the test; it manufactures the need
for it.

**Therefore the CTA goes to `/test`, not to grace.** Straight to grace would skip
the Law, which the method forbids. The reveal copy should say so out loud: that
was the general version, here is yours.

**This is a bigger build than the band.** New route, animated component, copy in
two locales, OG image, analytics, tests. Not a quick win — size it accordingly.

**The reveal copy has to carry weight.** With the humour dialled up, a light
landing would read as glib about sin. The turn is the whole thing.

## Global Constraints

- **Everyone can press it. Nobody can finish it.** No cursor-dodging: it excludes keyboard, touch and screen-reader users specifically, and this app is mobile-first. A real `<button>`, always enabled, always responding.
- **Bounded at four presses.** An unwinnable button that never stops is a troll. One that yields and explains itself is a parable.
- **Never a ladder, never a progress bar.** The app's own copy rules it out. Distance short of a target, not progress toward one.
- **No claim about the reader's standing.** It says what they did (jumped), not what they are. The verdict screen does that job, having earned it over six questions.
- **`prefers-reduced-motion`** — the jump is the whole interaction, so it must still *happen*, just without the animated arc. Cut to the landed position.
- **Locale parity**, both files, same commit. PT throughout.
- **Lint at or below 7 warnings.**

---

## Where it lives — decide before Task 1

**Decided: `/[locale]/good-enough`**, indexed and shareable — unlike the test
phase routes, this one *should* be found. `ifyoudiedtoday.com/good-enough`
states the question the whole site asks and reads, out of context, as a claim
someone might want to test.

One slug for both locales, matching `/find-a-church` — routes are not localised
in this app.

Rejected: a pre-test interstitial (adds a gate in front of the test, which this
session spent effort removing) and a homepage section (competes head-on with
**Take the test**; two interactive hooks and neither wins).

---

### Task 1: The mechanic, headless

**Files:** `src/lib/jump.ts`, `src/__tests__/jump.test.ts`

Pure functions, no React — the distances and the copy selection are the part worth testing.

- [ ] Write failing tests: `distanceForAttempt(n)` returns a strictly increasing sequence; `remainingAfter(n)` never reaches zero; attempt 4 is terminal.
- [ ] Implement. Distances grounded in the illustration: ~4ft, ~20ft, ~50ft (world record), against 18 miles / 95,040 ft.
- [ ] Tests pass. Commit.

### Task 2: The page

**Files:** `src/app/[locale]/jump/page.tsx`, `src/components/jump/*`, both locale files

- [ ] Copy block in both locales — button label, the three attempt reactions, the reveal, Rom 3:23, the CTA. **Owner approval required on the reveal copy and the PT before merge**, as with all doctrinal copy this session.
- [ ] Build the page: gap visual, the button, the attempt counter.
- [ ] Reduced-motion branch: no arc, straight to landed.
- [ ] Verify with keyboard only, and with VoiceOver — the button must announce its state and the reveal must be reachable.
- [ ] Verify at 390×844.

### Task 3: Route it in, and measure it

- [ ] Add as a third row in the "Also here" band.
- [ ] `sitemap.ts`, and OG image so it shares well — this is the one page built to be shared.
- [ ] Analytics: `jump_attempted` (with attempt number), `jump_revealed`, `jump_cta_clicked`. The interesting number is how many press all four times versus bounce at one.
- [ ] Both locales, full sweep.

---

## Decision log

| # | Decision |
| --- | --- |
| Route | `/[locale]/good-enough`, indexed |
| Tone | Escalating help — the funny version |
| Far side | Never drawn; numeric remaining distance carries it |
| CTA | `/test` — the jump is general, the test is personal |
| Bound | Four presses |
| Accessibility | Real button, always pressable; no cursor-dodging |

## Still owner-gated

- **The reveal copy**, EN and PT, as with all doctrinal copy this session.
- **The prop names in PT** — run-up / pole vault / rocket boots need translations
  that stay funny rather than literal.
