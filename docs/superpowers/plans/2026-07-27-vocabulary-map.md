# Vocabulary Map — making the progression concrete

**Status:** spec for review. Decisions settled 2026-07-27; no code written.

## The finding

The courtroom analogy is not missing from this app. It is already written, verbatim Comfort, inside `grace.beats`:

> 0 — "You're guilty. **The fine is eternal.**"
> 1 — "Imagine standing before a just Judge. You can't pay. Justice demands death."
> 2 — "But someone steps into the courtroom and **pays your fine in full.**"

The problem is where it lives. **The picture is in the prose; the abstraction is in the structure.** The screen that tells the courtroom story is labelled "Grace". The steps that follow are labelled "Daily bread" and "Foundations". A returning reader navigates by labels and step names — so they meet the abstraction and never the picture.

The fix is not to invent a metaphor. It is to promote the one already there from body copy into structure.

## The rule

**The courtroom runs to the pardon, then stops — deliberately.**

Trial → verdict → the fine → someone paid it → the 180. Then it ends, and discipleship gets plain, warm, non-metaphorical language.

**Why it stops there.** Comfort's analogy finishes at "you're free to go." Extending it into discipleship — rehab, probation, going straight, staying clean — says the pardoned person is under correctional supervision. That inverts the sentence the whole app is built to deliver: the fine was paid **in full**. Theologically it is the difference between adoption and parole. The hard stop is itself meaningful: you have left the courtroom.

**Corollary:** the discipleship labels should get *plainer*, not themed. Their current weakness is churchiness ("Daily bread", "Foundations"), not a missing picture. The cure is to say what they are.

## What must NOT change

- **"Test" stays "test".** Living Waters' own name for this is the Good Person Test. Renaming it "the trial" would be more consistent and less faithful to the method — and it is load-bearing in the site identity, `/test`, and the metadata. Do not touch it.
- **`grace.beatsHeading` "But God…" stays.** It is Ephesians 2:4 and it is the theological hinge. Pairing a concrete label with a scriptural heading is the right combination: picture above, theology beneath.
- Routes stay as they are (decided): labels and headings only. `/reading-plan` and `/learn` are in `sitemap.ts` and indexed; renaming them costs ranking recovery for a gain no reader sees.
- Everything already courtroom stays: `guiltLabel`, `commandmentLabel`, `verdict.prelude`, `answeredBadge`/`justifiedBadge` ("Admitted"/"Denied"), `undecided.eyebrow` ("The verdict stands"), the scales emblem.

## The map

| Surface | Key | Now | Proposed | Why |
| --- | --- | --- | --- | --- |
| Grace screen eyebrow | `grace.label` | **Grace** | **Someone paid your fine** | The single highest-value change. The screen already says this in beat 2; the label finally matches the story. Concrete where it was abstract. |
| Grace heading | `grace.beatsHeading` | But God… | *unchanged* | Eph 2:4. Picture above, theology beneath. |
| Tracker step 02 *(new)* | `home.journey.decision.*` | — | **The 180** | Living Waters vocabulary for repentance — turning 180 degrees. Fits the moment of turning, not the years after. Needs label + complete/active/upcoming descriptions. |
| Tracker step: reading | `home.journey.reading.label` | Daily bread | **Seven days in John** | Plain. Says what it is. The metaphor has ended by this point, on purpose. |
| Tracker step: learn | `home.journey.learn.label` | Foundations | **Honest answers** | Plain, and truer to the content than "foundations". |
| Tracker step: share | `home.journey.share.label` | Pass it on | *unchanged* | Already plain and warm. |
| Tracker step: law | `home.journey.test.label` | The Law | *unchanged* | Already right. |
| Invitation eyebrow | `invitation.eyebrow` | The decision | *unchanged — see open items* | "The 180" works in the tracker where a description line explains it. Standing alone as an eyebrow it risks being cryptic. |

## Cost

- **New strings:** the 180 step (label + 3 descriptions), plus 3 relabels. Roughly 6 keys × 2 locales.
- **No route changes, no redirects, no SEO exposure.**
- **No new tracking or storage.** Every number already exists.
- PT needs the owner's pass, especially "Someone paid your fine" — Portuguese has a natural legal register here (*alguém pagou a tua multa*) but the idiom should be checked, and *multa* may read as a parking ticket rather than a court penalty. Worth considering *a tua dívida* / *a tua pena*.

## Open items

1. **Does the invitation eyebrow become "The 180"?** Consistent with the tracker, but cryptic standing alone. Recommend leaving it as "The decision" and letting the tracker teach the term.
2. **Should the verdict screen name the fine?** It currently delivers GUILTY and the live count but never says what is owed — the fine appears first on the grace screen. Naming it at the verdict would make grace's "someone paid it" land harder, but it lengthens a screen just brought above the fold.
3. **PT register for "fine".** See cost note.

## Sequence

This is copy-and-label work with no structural dependency on the routes plan, so it can land before, after, or alongside it. It *does* depend on the homepage tracker work, since two of the relabels and the new step live in `journey-tracker.tsx`.

Suggested order: navigation routes (already planned) → homepage tracker + this vocabulary in one pass, since they touch the same component and the same message keys.
