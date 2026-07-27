# Navigation Contract

**Status:** decided 2026-07-27. Not a plan — the decisions a plan implements. Navigation work (D1–D4) is planned in `2026-07-27-routes-per-phase.md`. Homepage work (D5–D6) is a later, separate plan.

**Why this exists:** four of the five items in the 2026-07-27 user feedback are the same defect wearing different clothes. The app is confident about *rhetoric* and vague about *place*. It deliberately controls what you are told and when — the verdict is pronounced, grace is revealed beat by beat — and that is the method working as designed. But it also, accidentally, controls *where you are*: the homepage changes identity under you, back drops you out of the flow, the decision hands you to a page you did not ask for.

**The rule this contract enforces:** rhetorical authority is earned; navigational authority is never the app's to take. The reader must always be able to answer *where am I, what is behind me, what is next* without guessing.

**Corollary already shipped (`0a67b91`):** pace the message, never the control.

---

## Part 1 — Recon findings this contract answers

All measured against `f5fd3b8`, both locales, cold profile.

| Finding | Evidence |
| --- | --- |
| The verdict is a trapdoor | Back trail from the decision: `invitation → grace → verdict → exits the app`. `history.length` is 20 at landing, 20 at first question, 20 at verdict, 22 at decision. Questions and the verdict push **no** entries; only grace and invitation push one each. |
| The homepage loses its `h1` | `visitor` 1, `undecided` 1, `committed` **0**, `thinking` **0**, `dismissed` **0`. `committed` also renders zero `<button>` elements — every action is a link-card. |
| Stage states share no skeleton | Each stage differs in heading level, control type, and CTA size. The states express difference but never continuity. |
| The blog does not participate | Every homepage section adapts to journey stage except the latest-post card, which is stage-blind and self-hides after 60 days. |
| `GameProvider` blocks routing | It mounts in `test/page.tsx`, not a layout. Sibling routes would unmount it on every navigation and wipe the reducer. |

---

## Part 2 — The decisions

### D1. Phases become real routes

| Route | Phase | Notes |
| --- | --- | --- |
| `/test` | landing + all questions | One route. Questions stay one-way — the method requires it, `game-reducer` states it, and the current code already declines to push history for them. |
| `/test/verdict` | verdict | |
| `/test/grace` | grace | |
| `/test/decision` | invitation | |
| `/next-steps` | post-decision | Already a real route. |

`GameProvider` hoists to a new `src/app/[locale]/(immersive)/test/layout.tsx` so state survives sibling navigation. This is the load-bearing change; without it the rest is impossible.

**What this buys:** back, forward, refresh, share-a-link, and browser gestures all work by default instead of being simulated. The `pushState` juggling in `game-shell` deletes.

**What it does not buy:** the policy question below. Routing fixes the mechanism, not the meaning.

---

### D2. What Back means at each surface — THE OPEN QUESTION

Once `/test/verdict` is a route, browser back from it naturally targets `/test` — which is the questions. The method forbids re-entering questions. So this needs an explicit answer.

| Option | Behaviour | Cost |
| --- | --- | --- |
| **A. Verdict is the floor (recommended)** | Back from `/test/verdict` leaves the test and returns wherever the reader came from (usually `/`). Forward-only within the law section; free movement between verdict ⇄ grace ⇄ decision. | Honest: it is what already happens today, but *announced* rather than a trapdoor. Requires the Exit affordance to be explicit so leaving is never a surprise. |
| **B. Guarded exit** | Back from the verdict opens a confirm ("Leave the test?"). | Confirm-shaming the exit. Living Waters says never gate the answer and never shame the exit — I read this as violating that. |
| **C. Redirect-forward** | `/test` detects a completed session and bounces to `/test/verdict`, so back is a no-op loop. | Traps the reader on a page they are trying to leave. Worst of the three. |

**DECIDED: A.** The verdict is the floor of the law section. You may always move forward, always move freely among verdict/grace/decision, and always leave — but you cannot re-take questions you have answered, which is the method, stated plainly instead of enforced by an invisible history trick.

**Sub-decision:** the full-restart retake link stays. A deliberate restart is not the same as backing into a question mid-flow, so it does not conflict with the floor.

---

### D3. Deep-link guards

Cold navigation to `/test/verdict`, `/test/grace`, or `/test/decision` with no session in `localStorage`:

- Redirect to `/test`.
- Client-side, in the test layout — the state is client-only, so a server guard cannot see it.
- Must not flash: render nothing until the session read resolves (the existing rAF-deferred read pattern in `game-shell` already handles hydration safely).

With a *partial* session (answers exist, verdict not reached) and a request for `/test/grace`: redirect to the furthest phase legitimately reached. Never forward past where the reader actually got to.

---

### D4. What persists

Add to `SavedSession`:

- `graceBeatsRevealed: number` — fixes the confirmed regression where refreshing on grace restores the phase but resets all eight beats to one. `grace-screen` seeds `revealedCount` from it. Cannot be derived from `graceReached`, which is true the instant grace is entered and would skip the reveal for first-time readers.

Everything else already persists correctly; verified by measurement.

---

### D5. The homepage keeps the test as a persistent anchor that evolves

**Owner's words (2026-07-27), which supersede the earlier "shared skeleton" proposal:**

> "I think that dropping the initial take test CTA is what confuses the users, meaning that the homepage changes too much. We should probably keep it and show the result from taking the test and so on. We should create a more clear progression"

This is a sharper diagnosis than the one it replaces. "Shared skeleton" said *same slots, different content*. This says **the anchor object must persist**. The gold "Take the test" button is what defines the homepage; measured, it goes prominent → relabelled → **absent** (`committed` renders zero buttons) → replaced by a different action (`thinking` shows a decision button) → demoted to ghost-small (`dismissed`). The landmark disappears, which is why returning readers feel lost.

So the homepage's primary slot always holds **the test object**, in whatever state the reader has left it — the same thing, further along, not a different page per stage.

Constraints this creates:

- **The completed state shows the arc, not the verdict.** A committed reader cannot have "Guilty" frozen on their homepage; the verdict was answered. The card has to express what happened *through* the verdict, not stop at it.
- **Every stage still renders exactly one `<h1>`.** Three currently render none — an a11y and SEO defect independent of the UX complaint, and it survives into this design unless fixed deliberately.
- **One primary action per stage, always the same control type**, in the same position.

Do not reduce what each stage says. The five states are well written; they just need to hang off a persistent anchor.

**Still to confirm before the homepage plan:** the exact reading above, and what the completed-state card actually shows per stage.

---

### D6. The blog joins the journey

It is detached because it is the only stage-blind section on the page.

**DECIDED: make it stage-aware.** The card gets a framing line that changes with journey stage, so it participates like every other section. Needs new copy in both locales. The route does not change — renaming it would cost SEO (`sitemap.ts` plus indexed posts) for no reason beyond taste.

---

## Part 3 — What this does NOT decide

- Visual design of the homepage frame — that is a design pass, and I would bring the five states side by side rather than describe them.
- Whether the Exit affordance changes shape.
- Copy for any new element.

---

## Part 4 — Sequence once approved

1. Hoist `GameProvider` to a test layout. No behaviour change, pure enabling move, independently verifiable.
2. Split phases into routes, delete the `pushState` machinery, add deep-link guards.
3. `graceBeatsRevealed` persistence.
4. Homepage skeleton + `h1` fix + progress indicator.
5. Blog participation.

Steps 1–3 are one workstream (navigation). Steps 4–5 are a second (homepage) that depends on D2 being settled.

---

## Decision log

| # | Decision | Date |
| --- | --- | --- |
| D1 | Phases become real routes; `GameProvider` hoists to a test layout | 2026-07-27 |
| D2 | Verdict is the floor; retake link stays | 2026-07-27 |
| D3 | Client-side deep-link guards, redirect to furthest phase legitimately reached | 2026-07-27 |
| D4 | Persist `graceBeatsRevealed` | 2026-07-27 |
| D5 | Homepage keeps the test as a persistent anchor that evolves (owner reframe) | 2026-07-27 |
| D6 | Blog card becomes stage-aware; route unchanged | 2026-07-27 |
