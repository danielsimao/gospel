# Journey State & Chrome Unification — Design

**Date:** 2026-07-10
**Status:** Approved
**Goal:** Make the post-test journey solid and theologically consistent (Living Waters method), and give the site one coherent product identity, before sharing it publicly.

## Problem

1. **Post-test state is fragile.** Test completion is a bare `test_completed = "1"` localStorage flag, written inline in `game-shell.tsx` and read raw in four other components (`home-shell`, `journey-tracker`, `top-bar`, `learn-hub`), each with its own duplicated read/derive logic. Change propagation relies on remembering to call `emitStorageChange()`.
2. **The invitation response is never persisted.** `invitation_response` exists only as an analytics event. The homepage cannot distinguish someone who committed to repent and trust Christ from someone who dismissed the gospel — everyone gets the same journey tracker.
3. **Layout is inconsistent.** `(immersive)` routes (home, test) have a sticky death counter and no nav/footer; `(content)` routes have TopBar + Footer and no counter. Navigating home → learn swaps the entire chrome.
4. **Theological framing.** The site follows the Living Waters method: no decisionism. Nothing downstream of the invitation may assure salvation based on a button click. All post-commitment copy must be conditional ("If you have repented and trusted in Christ…") and point assurance at Christ's work and ongoing fruit — Word, prayer, church.

## Non-goals

- Church directory/list feature — parked. The existing generic "find a church" link stays.
- Pre-decision persuasion flow (home hero → test → verdict → grace) — content unchanged.
- Server-side persistence, accounts, email — out of scope. localStorage only.
- Back-compat for existing visitors — site is not launched; only a trivial `test_completed` migration is included.

## Design

### 1. Journey state layer

**New `src/lib/journey-storage.ts`** — single versioned record, same pattern as `test-session-storage.ts`:

```ts
// localStorage key: "gospel-journey"
interface JourneyRecord {
  version: 1;
  testCompletedAt: number | null;
  invitationResponse: "committed" | "thinking" | "dismissed" | null;
  respondedAt: number | null;
}
```

- API: `readJourney()`, `markTestCompleted()`, `saveInvitationResponse(r)`, `resetJourney()`.
- Wrong version or corrupt JSON → discarded silently (existing pattern). All writes emit via the existing `gospel:storage` event bus.
- **Migration:** on first read, if legacy `test_completed` key exists, fold it into the record (`testCompletedAt = Date.now()` proxy) and delete the legacy key.
- **Writers:** `game-shell` calls `markTestCompleted()` at verdict and `saveInvitationResponse()` on invitation answer. Retake calls `resetJourney()` — clears journey record and test session, **keeps** reading and learn progress.

**New `src/lib/use-journey.ts`** — one hook built on `useSyncExternalStore` over the existing `gospel:storage` bus:

```ts
useJourney(topicSlugs) → {
  stage: "visitor" | "undecided" | "committed" | "thinking" | "dismissed",
  readingDone: number,  // 0..7
  learnDone: number,    // 0..topicSlugs.length
}
```

- `undecided` = test completed but no invitation response (closed tab at grace/invitation).
- Stage derivation is a pure exported function (unit-tested).
- Consumers migrate to the hook: `home-shell`, `journey-tracker`, `top-bar`, `learn-hub`. All raw `localStorage.getItem("test_completed")` calls and the duplicated `readSnapshot()` / `readStage()` helpers are removed.
- `reading-storage`, `learn-progress-storage`, `test-session-storage` stay as they are; the hook composes them.

**Rename `prayed` → `committed`** across types (`InvitationResponse`), reducer, session storage, analytics events, and component props. Not launched, so no data migration. Button copy is already correct ("I will repent and trust in Christ").

### 2. Homepage per stage

`home-shell.tsx` branches on `stage` (replacing the binary `testCompleted`):

| Stage | Rendering |
|---|---|
| `visitor` | Unchanged: mortality stat, "Are you a good person?", gold CTA → test. |
| `undecided` | Heading with the LW charge — "You've seen the verdict. What will you do with it?" — gold CTA → `/test` (resume dialog restores at grace/invitation). No tracker. |
| `committed` | Conditional LW framing header — "If you've repented and trusted in Christ, God has forgiven you. Grow in it:" — then the existing `JourneyTracker` (reading → learn → share). No celebration of the click; assurance points at Christ's work and fruit. |
| `thinking` | No checklist pressure. One reflection line (trackB voice) + three cards: Read John 3 (external Bible link) · Learn foundations (→ `/learn`) · Revisit the verdict (→ `/test`, resumes at the completed session's grace/invitation). Quiet link "I have repented and trusted in Christ" → updates response `thinking → committed`. Never auto-downgrades. |
| `dismissed` | Near-visitor: same hero, subdued ghost "Take the test again" CTA + `dismissedEncouragement` line ("The door stays open"). No tracker, no guilt. |

All new copy lives in `messages/{en,pt}.json` under `home.journeyStages`, required by the `i18n.ts` validator.

The `thinking → committed` link routes through the same `saveInvitationResponse("committed")` path (analytics event included) — no bespoke mutation.

### 3. Chrome unification + next-steps

**Route groups:**
- `(immersive)` = `/test` only. Keeps `StickyDeathCounter`, no TopBar/Footer — the examination stays distraction-free.
- Home moves into `(content)`: TopBar + Footer like every other page. `StickyDeathCounter` moves into the home page composition (hero counter + sticky-on-scroll behavior preserved).
- Net: every page except `/test` renders TopBar + content + Footer.
- TopBar's adaptive nav (`pre-test`/`pre-reading`/`done`) is rewired to `useJourney()`; its private `readStage()` is removed.

**Next-steps:**
- Track derives from the stored journey response; the `?track=` query param is removed. `committed` → trackA, `thinking` → trackB, `visitor`/`undecided`/`dismissed` → redirect to `/{locale}`.
- `src/app/[locale]/next-steps/client.tsx` moves inside `(content)/next-steps/`.
- Copy pass on both tracks for LW consistency (trackA is largely correct already).

**Consistency sweep:** a shared page container (max-width, padding, heading scale) used by content pages so learn / reading-plan / about / next-steps stop drifting apart visually.

### 4. Testing & validation

**Unit (Vitest, existing patterns in `src/__tests__/`):**
- Update existing `game-reducer` and `test-session-storage` tests for the `committed` rename (they break otherwise).
- New: `journey-storage` — read/write/reset, version mismatch discard, corrupt JSON, legacy `test_completed` migration.
- New: stage derivation — all five stages and edge combinations (e.g. response present without `testCompletedAt`).
- Deliberately skipped: component render tests, exhaustive i18n validation tests — covered by E2E.

**End-to-end walkthrough (Playwright MCP against dev server, screenshots per arc):**
1. visitor → test → verdict → grace → commit → next-steps trackA → home shows `committed` variant
2. same → thinking → trackB → home `thinking` variant → "I have repented…" link flips to `committed`
3. same → dismissed → home `dismissed` variant
4. quit at invitation → home `undecided` variant → resume works
5. chrome: TopBar + Footer on every page, absent on `/test`; retake resets journey but keeps reading progress

**Done =** `pnpm build` and `pnpm test` green + all five arcs verified.

## Implementation order

1. State layer (journey-storage, use-journey, rename, migrate consumers) — everything else depends on it.
2. Homepage stage variants + messages.
3. Chrome restructure + next-steps rewiring.
4. Test updates + E2E walkthrough.

Each slice leaves the app working and is verifiable on its own.
