---
name: copy-review
description: Review changed EN and PT copy in src/messages against this app's method, vocabulary and register. Use when locale files change, before shipping copy, or when asked to check the wording. Reports findings only — it does not rewrite Portuguese idiom.
---

# Copy review

Review the copy that **changed**, against the rules this app has already
committed to. Report findings. Do not rewrite the files unless asked.

## Scope: the diff, not the file

There are ~1,110 leaf strings per locale. Reviewing all of them produces a wall
nobody reads and buries the three things that matter.

```bash
git diff --unified=0 -- src/messages/          # uncommitted
git diff --unified=0 <base>..HEAD -- src/messages/   # a range
```

If nothing has changed, say so and stop. If asked to review a specific screen
or key, scope to that instead. Only review the whole file when explicitly asked.

## Do not repeat the tests

`src/__tests__/copy-integrity.test.ts` already enforces, on every run:

- placeholder parity in both directions (`{list}`, `{n}`, `{when}`…)
- untranslated strings (PT identical to EN), allowlisting URLs and slugs
- `tu` address form on the reader-addressed keys
- translation length ratio, 0.45–2.0
- leaf-key parity both ways, and no blank strings

Never report these — they cannot be wrong at review time. If a change *should*
be caught by a test and isn't, propose the test rather than the finding.

## What to actually check

### 1. The method

This app follows Living Waters / Way of the Master. Its spine is **Law to the
proud, grace to the humble** — which is why judgment copy is red and grace copy
is gold.

The full reference is `docs/METHOD.md`: the presentation in order, which pieces
are load-bearing, and the gaps currently open. Read it when a finding turns on
whether something the method needs has been removed — this checklist catches
copy that says the wrong thing, that document catches copy that stopped saying
a necessary thing.

- **No decisionism.** Nothing may promise that a prayer, a tap or a button
  saves. Commitment copy stays conditional and points to Christ, never to the
  act of deciding.
- **The Law gets specific.** *Have you ever told a lie* — not *are you a good
  person in general*. Vague copy weakens the instrument.
- **Grace is never offered before the Law has done its work.** Copy that jumps
  to comfort on a judgment screen is a method error, not a tone preference.

### 2. The courtroom, and where it stops

The picture is trial → verdict → the fine → someone paid it → the decision.
**Then it stops, deliberately.**

Discipleship copy — reading plan, learn, next steps — must be plain and warm,
never themed. Extending the courtroom into it (rehab, probation, going straight,
staying clean, a clean record to maintain) says the pardoned reader is under
correctional supervision, which inverts the sentence the whole app exists to
deliver: **the fine was paid in full**. Adoption, not parole.

Flag any correctional or debt-remaining imagery after the decision.

### 3. Committed vocabulary

| term | status |
|---|---|
| **Test** | never rename. Living Waters' own name (the Good Person Test), and load-bearing in `/test`, the metadata and the site identity |
| **"But God…"** | `grace.beatsHeading`, Ephesians 2:4, the theological hinge — unchanged |
| **"Someone paid your fine"** | the grace label; confirmed against Comfort's courtroom analogy |
| **"Seven days in John"**, **"Honest answers"**, **"Pass it on"**, **"The Law"** | plain by design; do not re-theme |
| **"The 180"** | **forbidden.** It is Ray Comfort's 2011 pro-life documentary, not shorthand for repentance. Using it for the decision beat collides with a well-known Living Waters property about a different subject |

Full reasoning: `docs/superpowers/plans/2026-07-27-vocabulary-map.md`.

### 4. Register

- **Declarative, not interrogative.** needGod.net phrases its steps as questions;
  this app states. That is a deliberate difference — flag drift toward the
  question form, but as a consistency note, not an error.
- **Portuguese is `tu` throughout** — *És*, *tua própria confissão*, *tiraste*.
  Third person is correct where the copy is about Jesus (*pagou*,
  *ressuscitou*), wrong where it addresses the reader.
- **No churchiness.** "Daily bread" and "Foundations" were removed for this
  reason. Say what the thing is.

### 5. Portuguese, honestly

State plainly what you can and cannot judge.

**You can check:** that PT says what EN says; terminology consistency; register;
placeholder integrity; whether a term matches the committed vocabulary.

**You cannot reliably judge** whether Portuguese reads naturally — idiom, rhythm,
whether a phrase sounds translated. Do not assert that it does. Flag new or
reworded PT for the owner, who is the native speaker, and say why it is worth
their eye rather than implying it is wrong.

**Open PT question**, unresolved: the word for *fine*. `multa` may read as a
parking ticket rather than a court penalty; `dívida` and `pena` are candidates.
Raise it whenever the term appears in new copy.

## Reporting

Findings only, most serious first. For each:

```
<locale>.<dotted.key> — <what is wrong> — <why it matters here>
```

Severity: **method** (contradicts the doctrine or the flow's job) ·
**vocabulary** (breaks a committed term) · **register** (tone, person,
churchiness) · **owner** (PT that needs a native speaker, not a defect).

Say "no findings" when there are none. A short honest list beats a padded one —
and never invent a finding to look thorough on a copy change that is fine.
