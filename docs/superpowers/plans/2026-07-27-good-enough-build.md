# "Good Enough" — design record

**Status:** built 2026-07-27. This document replaced a build plan for the canyon
jump, which the owner rejected in favour of their own mechanic. It now records
what exists and why, so the next person to touch it does not undo an argument by
adjusting a number.

**Live at:** `/[locale]/good-enough`, indexed, both locales.

**Origin:** owner's idea — *"if you click this button, you will go to heaven, but
the button is impossible to click, and we end up giving the gospel"*, refined by
the owner into a bar filled by tapping.

**Supersedes** the task list in `2026-07-27-good-enough.md`. That document's
research on the canyon illustration is still worth reading; its mechanic is not
what shipped.

---

## What it is

Tap a button, fill a bar. The bar rises in equal steps for eight taps, then stops
dead at **this play's ceiling** — rolled from a 24–42% band — against a line
drawn at **92%**. The button is never taken away. Keep pressing and a hard lip
renders across the top of the fill and the copy narrates that nothing is moving.
After three dead taps: Romans 3:23, a link to `/test`, and a quiet **Try again**.

### Why the ceiling varies

A fixed stop was a lie the page did not need to tell — people differ — and it
made replaying pointless. But a variable outcome plus a retry button is the
shape of a slot machine, so the band is the whole safety question. It works only
because **no roll comes near the line**: the luckiest possible play still falls
50 points short, so no outcome can suggest another go might do better.
`GOAL_PCT` is *derived* as `CEILING_MAX_PCT + MIN_GAP_PCT` rather than left as a
constant, so the gap cannot be closed by editing one number, and the near-miss
test runs over every ceiling in the band rather than one chosen value.

The variance also does the work the crowd bars were added for: replaying is how
a reader discovers for themselves that a different number is not a different
answer.

### Why there are no longer other people's bars

An earlier version drew fourteen at the ceiling, to make the failure global
rather than personal. Cut, for two reasons that outweigh the argument it made.
It landed on the exact beat the reader's own bar stops — the most important
moment on the page — and a spread of bars is a *distribution*, which implies a
tail: the eye hunts for the tallest and infers that somebody might reach the
line. That is the one inference this page cannot allow, and the reveal copy
makes the same claim in a way a chart cannot: **nobody**.

## Why the mechanic is shaped this way

Every constant is set against evidence rather than taste. Changing one without
reading this section will quietly break the argument.

### The ceiling sits far below the line, and a test enforces it

The **near-miss effect** is among the most replicated findings in gambling
research. Near-misses are rated more negatively than clear misses yet *increase*
the motivation to continue, recruit win-related reward circuitry, and
specifically breed an **illusion of control**. Persistence peaks when near-misses
run around 30% of outcomes, following an inverted-U. It is potent enough that
inflating near-misses in slot machines is illegal in several jurisdictions.

A bar that crept up on the line would therefore manufacture *try harder* — the
one belief this page exists to remove. `good-enough.test.ts` asserts the gap is
at least 50 percentage points and that no tap count can ever bring the fill near
the line.

### Equal steps, never diminishing returns

Idle-game design leans on diminishing returns and asymptotic plateaus, and an
asymptote is tempting here because it is *literally* the doctrine — approaches
but never reaches. It is also a **near-miss generator by construction**, forever
implying that a little more effort buys a little more ground. Ruled out by the
finding above.

Equal steps also keep the rules honest, which is the harder constraint: the
standard may be hidden, the **rules never may**. Secret decay or a mis-tap
penalty would make this a carnival game, and the response to a carnival game is
*you tricked me*, not repentance. The Good Person Test convicts precisely because
its arithmetic is fair and visible.

### No timer

The owner asked for a countdown, reasonably, because the first prototype cut the
reader off for no stated reason.

A clock is the wrong fix. Under **Weiner's attribution theory**, it makes the
failure *unstable* ("I ran out of time") and *specific* ("my tapping speed") —
exactly the attributions that send someone back for another go. It also imports
the wrong illustration: a countdown is Comfort's parachute, which argues
**urgency**; the bar argues **impossibility**. Both are true and stacking them
blurs each.

### The button is never removed or disabled

The reader stops, not the page. That is what makes the failure theirs to observe
rather than a machine's to declare, and it is the honest answer to *why can't I
keep trying* — you can; it does nothing. The rendered lip answers the same
question with a picture instead of a rule.

### Making the failure global rather than personal

Attribution again, and the reason the ceiling is rolled. Left personal, the
reader concludes *I was bad at this* — **specific**, which produces a retry.
The page needs *it stops somewhere for everyone* — **stable and global**, which
is the doctrine, Romans 3:23's "all".

Two designs were tried. Drawing other people's bars is the one that failed (see
above). The roll is the one that works, because the reader generates the spread
themselves and every life they try stops. The reveal copy carries the claim in
words — *play again and you will get a different number; you will not get a
different answer* — and the **Try again** link is what lets them check.

### The turn is a safety mechanism, not a payoff

Stable-and-global is the attribution profile the literature ties to learned
helplessness. Inducing it about self-salvation is the intent — *that every mouth
may be stopped* — but it is not a state to leave anyone in, so the turn appears
the moment the reader has proved it, never a scroll away.

### The CTA goes to `/test`, never to grace

The bar proves **inability**, not **guilt**. A reader holding only inability
concludes either *nobody gets in* or *God must let everyone in*, and neither is
the gospel. The Law has to get specific — not *are you good enough* but *have you
ever told a lie* — so the bar manufactures the need for the test rather than
replacing it. The `turn` copy names that swap out loud, or the CTA reads as
bait-and-switch.

`/test` is also right for a reader who has already taken it: that route is the
router, and its resume dialog forwards them from the **saved session** rather
than the separate journey flag, which can drift. An earlier draft branched to
`/test/grace` for returning readers; it would have bounced them, because
`furthestPhase` reads the session and `isBeyond("grace", "landing")` is true.

## Files

| file | responsibility |
|---|---|
| `src/lib/good-enough.ts` | the mechanic — pure, no React |
| `src/__tests__/good-enough.test.ts` | invariants incl. the near-miss guard, plus copy parity |
| `src/components/good-enough/bar-track.tsx` | track, fill, line, lip |
| `src/components/good-enough/reveal.tsx` | the turn and the CTA |
| `src/components/good-enough/good-enough-scene.tsx` | tap state, analytics, aria-live |
| `src/app/[locale]/(content)/good-enough/page.tsx` | route + metadata |
| `src/app/[locale]/(content)/good-enough/opengraph-image.tsx` | share card, drawn at true proportions |

`(content)` rather than `(immersive)`: a cold arrival from a shared link needs
TopBar and Footer to reach anything else.

## Analytics

`good_enough_viewed` · `good_enough_tapped` (per press, including dead ones) ·
`good_enough_revealed` (with tap count) · `good_enough_replayed` (with play
number) · `good_enough_cta_clicked` (with `had_completed_test`, read at click
time so no render branches on localStorage).

The number that decides whether this page earns its place is
`had_completed_test`: whether it recruits strangers or entertains regulars.

## Verified

Both locales at 390px: readout 92% → 58% and frozen across further taps, crowd
0 → 14 bars, CTA to `/{locale}/test`, button still live after the turn, no
horizontal scroll. OG image 200/`image/png` at 1200×630 in both locales. Band row
renders first, 66px tall.

## Still owner-gated

- **The reveal copy**, EN and PT. It is the whole page — everything before it is
  setup. In particular `"it stops there for everyone"` is the sentence doing the
  attribution work; a weaker phrasing collapses the argument back to *I was bad
  at this*.
- **The PT throughout**, especially the `ceilingLines`, which have to stay dry
  rather than becoming literal.

## Rejected, with reasons

| idea | why not |
|---|---|
| progress decays over time | rule-lie; teaches *tap faster* |
| mis-tap penalty | rule-lie; teaches *be more careful* |
| button dodges the cursor | excludes keyboard, touch and screen-reader users on the one page built to be shared, and reads as being toyed with |
| countdown / fail timer | wrong attribution, wrong illustration — see above |
| diminishing returns toward the line | near-miss generator |
| ceiling near the line | near-miss, maximally |
| a fixed ceiling for everyone | untrue, and makes the replay pointless |
| other people's bars at the ceiling | a spread implies a tail; it also collided with the beat the reader's own bar stops |
| CTA straight to grace | skips the Law, which the method forbids |
| branch returning readers to `/test/grace` | the guard bounces them; `/test` already routes correctly |

## Sources

Near-miss: [review, J. Gambling Studies](https://link.springer.com/article/10.1007/s10899-019-09891-8) ·
[Neuron, win-related circuitry](https://www.sciencedirect.com/science/article/pii/S0896627309000373) ·
Attribution: [Weiner](https://www.instructionaldesign.org/theories/attribution-theory/) ·
[learned helplessness in games](https://www.psychologyofgames.com/2016/03/learned-helplessness-and-halo-5/) ·
Effort: [effort justification](https://en.wikipedia.org/wiki/Effort_justification) ·
Rules as argument: [procedural rhetoric](https://en.wikipedia.org/wiki/Procedural_rhetoric),
[Bogost, *Persuasive Games*](https://bogost.com/books/persuasive_games/) ·
Idle-game shape: [the math of incremental games](https://code.tutsplus.com/numbers-getting-bigger-the-design-and-math-of-incremental-games--cms-24023a)
