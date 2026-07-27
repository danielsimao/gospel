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
| Tracker step 02 *(new)* | `home.journey.decision.*` | — | **The decision** | See "Research" below — "The 180" was proposed and withdrawn. needGod frames this beat as a choice ("You now have a choice to make"), which the existing wording already matches. Needs label + complete/active/upcoming descriptions. |
| Tracker step: reading | `home.journey.reading.label` | Daily bread | **Seven days in John** | Plain. Says what it is. The metaphor has ended by this point, on purpose. |
| Tracker step: learn | `home.journey.learn.label` | Foundations | **Honest answers** | Plain, and truer to the content than "foundations". |
| Tracker step: share | `home.journey.share.label` | Pass it on | *unchanged* | Already plain and warm. |
| Tracker step: law | `home.journey.test.label` | The Law | *unchanged* | Already right. |
| Invitation eyebrow | `invitation.eyebrow` | The decision | *unchanged — see open items* | "The 180" works in the tracker where a description line explains it. Standing alone as an eyebrow it risks being cryptic. |

## Research — Living Waters and needGod.net (2026-07-27)

Checked before committing to any name.

**"The 180" is withdrawn — it means something else entirely.** `180` is Ray Comfort's 2011 pro-life documentary, comparing abortion to the Holocaust; it is one of Living Waters' best-known productions and has its own page on livingwaters.com. Using it as a label for repentance in a Living-Waters-aligned app would collide with a widely recognised LW property about a different subject. It was proposed here on the assumption that it was LW shorthand for "turning 180 degrees". That assumption was wrong.

**"Someone paid your fine" is confirmed and well-founded.** The Way of the Master courtroom analogy is exactly this: God as judge, the sinner guilty, a fine that cannot be paid, Christ paying it, repentance and faith receiving the pardon. "Jesus pays your fine" is directly associated with Comfort's presentation of substitutionary atonement. This name stands.

**needGod.net's own step names, in order:**

1. Nothing can make itself
2. Why the creator has to judge
3. So how good are you?
4. **The Consequences**
5. What's the solution?
6. **Who's going to pay for you?**
7. You now have a choice to make
8. What will you choose today?

Three things worth carrying:

- **needGod's steps are questions, not nouns.** Their register is interrogative and conversational throughout; ours is declarative. Neither is wrong, but it is a deliberate difference to make consciously rather than drift into.
- **needGod does not use "fine" as a step name.** It appears only as an illustration — "a police officer pulls you over for speeding and gives you a fine". The step itself is called *The Consequences*. So "fine" is proven as a *picture* but not as a *label*, which is a mild caution against over-extending it structurally. Using it once, on the payment step, is the strongest possible placement.
- **needGod has an explicit consequences beat** between guilt and solution. Our app has no equivalent: the verdict delivers GUILTY plus the live count, and the fine first appears at the top of grace. This is direct evidence for open item 2 below.

**Way of the Master framework.** The founding principle is "Law to the proud, grace to the humble" — which is precisely this app's two-part structure and its red/gold colour semantics, so the existing design language is already aligned with the method's spine. The test itself is WDJD: *Would you consider yourself a good person? / Do you think you have kept the Ten Commandments? / If you were judged by them, would you be guilty or innocent? / Destiny: heaven or hell?*

Sources: [needGod.net](http://www.needgod.net/), [Living Waters "180"](https://livingwaters.com/movie/180movie/), [180 (2011 film) — Wikipedia](https://en.wikipedia.org/wiki/180_(2011_American_film)), [The Way of the Master — Wikipedia](https://en.wikipedia.org/wiki/The_Way_of_the_Master), [GotQuestions — Way of the Master](https://www.gotquestions.org/way-of-the-master.html)

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
