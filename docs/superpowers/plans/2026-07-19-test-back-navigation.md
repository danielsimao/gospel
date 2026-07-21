# Test Back-Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let readers walk back through the testimony screens (invitation → grace → verdict) to re-read them — via quiet in-app links AND the hardware/browser back button — without ever reopening recorded answers.

**Architecture:** Two new reducer actions (`BACK_TO_VERDICT`, `BACK_TO_GRACE`) plus a new `invitationReached` flag mark how far the reader has been, so re-entered screens render complete instantly (no re-staggered choreography, no duplicate analytics). History integration lives in `game-shell.tsx`: forward phase transitions push history entries, `popstate` dispatches the matching action, and the re-read links simply call `history.back()` — one code path for both layers. After an invitation response is recorded, pushed entries are unwound so back exits `/test` cleanly.

**Tech Stack:** Next.js 16.2.1 App Router, React 19, TypeScript, framer-motion via LazyMotion (`m` only), Vitest, pnpm.

## Global Constraints

- **Answers stay one-way.** No navigation into the question rounds. `UNDO_ANSWER` (current-card mis-tap protection) is untouched. `playing` phase gets NO history entries — hardware back during questions keeps today's behavior (exit; session saved; resume dialog on return).
- **Post-response lockout:** once `invitationResponse` is set, `BACK_TO_GRACE` is a no-op and pushed history entries are unwound. Testimony recorded = no back.
- **Instant re-entry:** verdict re-entered with `graceReached === true` renders complete (confession, chips, death count, enabled bridge) with fade-in only, and does NOT re-fire `trackVerdictReached`. Grace re-entered with `invitationReached === true` renders all beats + scripture + Continue immediately and does NOT re-fire `trackGraceRevealed`/`trackGraceBeatRevealed`.
- **Copy (verbatim):** EN `grace.rereadVerdict` = `Re-read the verdict`, EN `invitation.rereadGrace` = `Re-read grace`. PT `grace.rereadVerdict` = `Reler o veredicto`, PT `invitation.rereadGrace` = `Reler a graça`. PT flagged for owner gate.
- **Link costume:** quiet sentence-case underlined text link, exactly the retake-link classes: `text-[11px] text-white/30 underline decoration-white/15 underline-offset-4 transition-colors hover:text-white/50`. Bottom of content, never competing with the gold CTA.
- Bilingual parity; surgical JSON edits via python3 with `assert s.count(old) == 1` + `json.load` validation.
- TDD for reducer and session storage (`src/__tests__/game-reducer.test.ts`, `src/__tests__/test-session-storage.test.ts` — extend, match existing patterns).
- Gates: `pnpm lint && pnpm test && npx tsc --noEmit && pnpm build` all green before each commit.
- Kill port-3000 listeners with `kill $(lsof -ti :3000)` (Next renames its process; pkill-by-name misses it).
- Commit trailers:
  `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
  `Claude-Session: https://claude.ai/code/session_01GCuFmndcCWD1FAQbeLHCxx`

---

### Task 1: Reducer — `invitationReached` flag + `BACK_TO_VERDICT` / `BACK_TO_GRACE` (TDD)

**Files:**
- Modify: `src/lib/types.ts` (GameState + GameAction union)
- Modify: `src/lib/game-reducer.ts`
- Test: `src/__tests__/game-reducer.test.ts`

**Interfaces:**
- Produces: `GameState.invitationReached: boolean` (false in `initialGameState`; set true by `SHOW_INVITATION`; preserved by both back actions and by `RESUME_SESSION`).
- Produces: action `{ type: "BACK_TO_VERDICT" }` — valid only when `phase === "grace"`; sets `phase: "verdict"`; leaves `graceReached`, `invitationReached`, `answers`, `score`, `completedAt` untouched.
- Produces: action `{ type: "BACK_TO_GRACE" }` — valid only when `phase === "invitation" && invitationResponse === null`; sets `phase: "grace"`; everything else untouched.

- [ ] **Step 1: Write the failing tests** — append to `src/__tests__/game-reducer.test.ts` (read the file first; reuse its helpers/style). A `completedState()` helper may already exist from the UNDO_ANSWER wave; if not, build states by walking actions as below:

```ts
function reachInvitation(): GameState {
  let state = gameReducer(initialGameState, { type: "START_GAME" });
  state = { ...state, phase: "verdict", completedAt: Date.now() };
  state = gameReducer(state, { type: "SHOW_GRACE" });
  state = gameReducer(state, { type: "SHOW_INVITATION" });
  return state;
}

describe("back navigation", () => {
  it("SHOW_INVITATION marks invitationReached", () => {
    const state = reachInvitation();
    expect(state.invitationReached).toBe(true);
  });

  it("BACK_TO_VERDICT returns from grace, preserving progress flags", () => {
    let state = gameReducer(initialGameState, { type: "START_GAME" });
    state = { ...state, phase: "verdict", completedAt: 123 };
    state = gameReducer(state, { type: "SHOW_GRACE" });
    state = gameReducer(state, { type: "BACK_TO_VERDICT" });
    expect(state.phase).toBe("verdict");
    expect(state.graceReached).toBe(true);
    expect(state.completedAt).toBe(123);
  });

  it("BACK_TO_VERDICT is a no-op outside grace", () => {
    const state = reachInvitation();
    expect(gameReducer(state, { type: "BACK_TO_VERDICT" })).toBe(state);
  });

  it("BACK_TO_GRACE returns from an unanswered invitation", () => {
    let state = reachInvitation();
    state = gameReducer(state, { type: "BACK_TO_GRACE" });
    expect(state.phase).toBe("grace");
    expect(state.invitationReached).toBe(true);
  });

  it("BACK_TO_GRACE is a no-op once a response is recorded", () => {
    let state = reachInvitation();
    state = gameReducer(state, {
      type: "SET_INVITATION_RESPONSE",
      response: "committed",
    });
    expect(gameReducer(state, { type: "BACK_TO_GRACE" })).toBe(state);
  });

  it("forward again after going back works (grace → invitation)", () => {
    let state = reachInvitation();
    state = gameReducer(state, { type: "BACK_TO_GRACE" });
    state = gameReducer(state, { type: "SHOW_INVITATION" });
    expect(state.phase).toBe("invitation");
  });

  it("RESUME_SESSION carries invitationReached", () => {
    const session = {
      phase: "invitation" as const,
      currentQuestion: 7,
      score: 0,
      answers: [],
      currentAnswer: null,
      showFollowUp: false,
      startedAt: 1000,
      completedAt: 2000,
      questionStartedAt: null,
      savedAt: 3000,
      graceReached: true,
      invitationReached: true,
      invitationResponse: null,
    };
    const state = gameReducer(initialGameState, {
      type: "RESUME_SESSION",
      session,
    });
    expect(state.invitationReached).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- game-reducer`
Expected: FAIL — `invitationReached` undefined / unknown action types.

- [ ] **Step 3: Implement.** In `src/lib/types.ts`: add `invitationReached: boolean;` to `GameState` (next to `graceReached`); add `| { type: "BACK_TO_VERDICT" } | { type: "BACK_TO_GRACE" }` to `GameAction`; add `invitationReached: boolean;` to the `RESUME_SESSION` action's `session` payload type (find it: `grep -n "RESUME_SESSION" src/lib/types.ts`). In `src/lib/game-reducer.ts`:

```ts
// in initialGameState, next to graceReached:
  invitationReached: false,

// SHOW_INVITATION becomes:
    case "SHOW_INVITATION":
      if (state.phase !== "grace") return state;
      return {
        ...state,
        phase: "invitation",
        invitationReached: true,
      };

// new cases, after SHOW_INVITATION:
    case "BACK_TO_VERDICT":
      // Re-reading the recorded testimony, not reopening it — answers,
      // score and completion stay exactly as they were.
      if (state.phase !== "grace") return state;
      return { ...state, phase: "verdict" };

    case "BACK_TO_GRACE":
      // Only while the invitation is unanswered. A recorded response
      // closes the book.
      if (state.phase !== "invitation" || state.invitationResponse) {
        return state;
      }
      return { ...state, phase: "grace" };

// in RESUME_SESSION's returned object, next to graceReached:
        invitationReached: action.session.invitationReached,
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- game-reducer`
Expected: PASS (all suites).

- [ ] **Step 5: Fix ripple compile errors from the widened types.** `npx tsc --noEmit` will flag every `RESUME_SESSION` dispatch site missing `invitationReached` — `src/components/game-shell.tsx` (`handleResumeContinue`) needs `invitationReached: pendingResume.invitationReached,` which requires Task 2's storage field; to keep this task compiling standalone, pass `invitationReached: pendingResume.graceReached && pendingResume.phase === "invitation"` with a `// Task 2 replaces this with the stored flag` comment ONLY if Task 2 is not being done in the same branch sitting; otherwise do Tasks 1+2 back-to-back and wire the real field. Prefer back-to-back.

- [ ] **Step 6: Gates + commit**

```bash
pnpm lint && pnpm test && npx tsc --noEmit && pnpm build
git add src/lib/types.ts src/lib/game-reducer.ts src/__tests__/game-reducer.test.ts src/components/game-shell.tsx
git commit -m "feat: reducer walks back through testimony screens

BACK_TO_VERDICT (grace) and BACK_TO_GRACE (unanswered invitation only)
re-enter earlier screens without touching answers, score or completion.
New invitationReached flag records that the reader finished grace once,
so re-entered screens can render complete instead of replaying reveals."
```

(Append the two required trailers to every commit in this plan.)

---

### Task 2: Session storage carries `invitationReached` (TDD)

**Files:**
- Modify: `src/lib/test-session-storage.ts`
- Test: `src/__tests__/test-session-storage.test.ts`

**Interfaces:**
- Consumes: `GameState.invitationReached` from Task 1.
- Produces: `SavedSession.invitationReached: boolean` — written by `writeSession`, defaulted to `false` by `readSession` for sessions saved before this field existed.

- [ ] **Step 1: Read `src/lib/test-session-storage.ts` fully.** Note the `SavedSession` interface, `writeSession`'s field list, and how `readSession` validates (it may have a version constant and per-field checks — match the existing validation idiom exactly).

- [ ] **Step 2: Write the failing tests** — append to `src/__tests__/test-session-storage.test.ts`, matching its setup (jsdom localStorage, existing fixture builders):

```ts
it("round-trips invitationReached", () => {
  writeSession({ ...baseState, phase: "invitation", invitationReached: true });
  expect(readSession()?.invitationReached).toBe(true);
});

it("defaults invitationReached to false for sessions saved before the field", () => {
  writeSession({ ...baseState, phase: "grace" });
  const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
  delete raw.invitationReached;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
  expect(readSession()?.invitationReached).toBe(false);
});
```

(Use the file's actual state-fixture and storage-key names — `grep -n "const" src/__tests__/test-session-storage.test.ts` first; if the key isn't exported, read it from the source file and mirror how existing tests reference it.)

- [ ] **Step 3: Run to verify failure**

Run: `pnpm test -- test-session-storage`
Expected: FAIL — property missing.

- [ ] **Step 4: Implement.** In `SavedSession`, add `invitationReached: boolean;` next to `graceReached`. In `writeSession`, persist `invitationReached: state.invitationReached,`. In `readSession`, coerce with backward-compat default: `invitationReached: parsed.invitationReached === true,` (matching however the file coerces `graceReached`).

- [ ] **Step 5: Verify pass, replace any Task-1 stopgap** in `game-shell.tsx` with `invitationReached: pendingResume.invitationReached,`.

Run: `pnpm test -- test-session-storage && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Gates + commit**

```bash
pnpm lint && pnpm test && npx tsc --noEmit && pnpm build
git add src/lib/test-session-storage.ts src/__tests__/test-session-storage.test.ts src/components/game-shell.tsx
git commit -m "feat: saved test sessions remember the reader finished grace"
```

---

### Task 3: Messages + types — re-read link copy (EN/PT)

**Files:**
- Modify: `src/messages/en.json`, `src/messages/pt.json`
- Modify: `src/lib/types.ts` (invitation message type)

**Interfaces:**
- Produces: `grace.rereadVerdict` and `invitation.rereadGrace` strings in both locales; `Messages["invitation"]` type gains `rereadGrace: string;`. (GraceScreen types its own inline `messages` prop — Task 4 extends that interface locally.)

- [ ] **Step 1: Surgical JSON edits** (one python3 heredoc, both locales):

```bash
python3 - <<'EOF'
import json

EDITS = {
    "en": [
        ('"scriptureRef"', "grace", '"rereadVerdict": "Re-read the verdict",'),
        ('"urgencyLine"', "invitation", '"rereadGrace": "Re-read grace",'),
    ],
    "pt": [
        ('"scriptureRef"', "grace", '"rereadVerdict": "Reler o veredicto",'),
        ('"urgencyLine"', "invitation", '"rereadGrace": "Reler a graça",'),
    ],
}
# Strategy: parse, mutate the dict, dump — safer than string surgery for
# nested sections. Preserve 2-space indent + ensure_ascii=False.
for loc in ("en", "pt"):
    p = f"src/messages/{loc}.json"
    with open(p, encoding="utf-8") as f:
        d = json.load(f)
    assert "rereadVerdict" not in d["grace"]
    assert "rereadGrace" not in d["invitation"]
    d["grace"]["rereadVerdict"] = "Re-read the verdict" if loc == "en" else "Reler o veredicto"
    d["invitation"]["rereadGrace"] = "Re-read grace" if loc == "en" else "Reler a graça"
    with open(p, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=2)
        f.write("\n")
    json.load(open(p, encoding="utf-8"))
    print(loc, "ok")
EOF
```

CAUTION: `json.dump` rewrites the whole file — diff it (`git diff --stat src/messages`) and confirm ONLY the two added lines per file changed (plus no key reordering; python dicts preserve order). If the diff shows churn (indent or escaping differences), revert and fall back to the string-replace idiom used in earlier waves (`s.replace(needle, needle + new_line)` with `assert s.count(needle) == 1`), anchoring on `"scriptureRef": "..."` inside the `"grace"` object and `"urgencyLine": "..."` inside `"invitation"`.

- [ ] **Step 2: Type.** In `src/lib/types.ts`, find the invitation message shape (`grep -n "urgencyLine" src/lib/types.ts`) and add `rereadGrace: string;` next to `urgencyLine`.

- [ ] **Step 3: Gates + commit**

```bash
pnpm lint && pnpm test && npx tsc --noEmit && pnpm build
git add src/messages/en.json src/messages/pt.json src/lib/types.ts
git commit -m "feat: re-read link copy for grace and invitation (en/pt)"
```

PT strings go on the owner's PT gate list: "Reler o veredicto", "Reler a graça".

---

### Task 4: Instant re-entry + re-read link — GraceScreen

**Files:**
- Modify: `src/components/grace-screen.tsx`

**Interfaces:**
- Consumes: `state.invitationReached` (Task 1), `grace.rereadVerdict` (Task 3).
- Produces: props change — `GraceScreen` now receives `messages` (extended inline interface `+ rereadVerdict: string`), `returning: boolean` (true when `invitationReached`), and `onBack: () => void`. Caller wiring happens in Task 6.

- [ ] **Step 1: Extend props.** Add to the inline `GraceScreenProps["messages"]` interface: `rereadVerdict: string;`. Add sibling props: `returning: boolean;` and `onBack: () => void;`.

- [ ] **Step 2: Instant mode.** Initialize reveal state from `returning`:

```ts
const [revealedCount, setRevealedCount] = useState(returning ? messages.beats.length : 1);
```

`allBeatsRevealed` then starts true when returning, which already collapses the spotlight, hides the tap-continue pill, and shows scripture + Continue via the existing conditionals. Neutralize the first-beat fade delay for returning readers: change the beat transition delay to `` delay: i === 0 && !returning ? 1.5 : 0 `` and the heading/label delays can stay (pure fade, no shift).

- [ ] **Step 3: Suppress duplicate analytics.** Wrap the entry-tracking effect:

```ts
useEffect(() => {
  if (returning) return; // re-read, already counted
  trackGraceRevealed();
  trackGraceBeatRevealed(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once per mount
}, []);
```

(`trackGraceViewed` in the scroll-depth effect's cleanup measures time-on-screen; leave it — a re-read is a real view with real duration.)

- [ ] **Step 4: Re-read link.** At the bottom of the content column, after the scripture/Continue `AnimatePresence` block but inside `max-w-lg`, add — visible in BOTH modes (progressive and returning), so it must not sit inside the `allBeatsRevealed` conditional:

```tsx
{/* Quiet walk-back — re-reading the verdict, not reopening it */}
<div className="mt-8 flex justify-center">
  <button
    type="button"
    onClick={onBack}
    className="text-[11px] text-white/30 underline decoration-white/15 underline-offset-4 transition-colors hover:text-white/50"
  >
    {messages.rereadVerdict}
  </button>
</div>
```

- [ ] **Step 5: Gates** (`pnpm lint && npx tsc --noEmit`) — expect ONE remaining error: the call site in `game-shell.tsx` missing the new props. That is Task 6's wiring; if executing tasks in the same sitting, proceed to Task 5/6 before committing. Commit boundary: Tasks 4+5+6 commit together in Task 6 (the shell wiring makes them compile as a unit).

---

### Task 5: Instant re-entry + re-read link — VerdictScreen + InvitationScreen

**Files:**
- Modify: `src/components/verdict-screen.tsx`
- Modify: `src/components/invitation-screen.tsx`

**Interfaces:**
- Consumes: `state.graceReached` (existing), `invitation.rereadGrace` (Task 3).
- Produces: `VerdictScreen` — no prop changes (`state` prop already carries `graceReached`). `InvitationScreen` gains `onBack: () => void;` prop.

- [ ] **Step 1: VerdictScreen instant mode.** `returning = state.graceReached` (grace only reachable through the full verdict, so this exactly means "verdict fully seen"). Initialize the staged flags from it and skip timers + duplicate tracking:

```ts
const returning = state.graceReached;
const [showConfession, setShowConfession] = useState(returning);
const [showDeathLine, setShowDeathLine] = useState(returning);
const [showBridge, setShowBridge] = useState(returning);
```

In the effect: guard tracking with `if (!hasTracked.current && !returning)`, and early-return before the timeouts when `returning` (flags already true; return no-op cleanup). Neutralize the GUILTY stamp + prelude entrance delays when returning: change the stamp's transition to `` delay: returning ? 0 : 0.3 `` — everything else is opacity-only and already gated by the flags.

- [ ] **Step 2: InvitationScreen re-read link.** Add `onBack: () => void;` to `InvitationScreenProps`. Inside the `{!invitationResponse && (...)}` buttons block, after the `dismissed` text Button (still inside the `m.div`), add:

```tsx
<button
  type="button"
  onClick={onBack}
  className="mt-3 text-[11px] text-white/30 underline decoration-white/15 underline-offset-4 transition-colors hover:text-white/50"
>
  {invitation.rereadGrace}
</button>
```

Post-response state renders no link (the block it lives in unmounts) — lockout is structural.

- [ ] **Step 3:** Same commit-boundary note as Task 4 — compile completes after Task 6.

---

### Task 6: History integration in GameShell — one path for links and hardware back

**Files:**
- Modify: `src/components/game-shell.tsx`
- Modify: `src/lib/analytics.ts`

**Interfaces:**
- Consumes: everything above.
- Produces: `trackTestBack(from: string, to: string, via: "link" | "browser")` in `src/lib/analytics.ts` (match the file's existing event helper idiom — `grep -n "trackTestResumed" src/lib/analytics.ts` for the pattern; event name `test_back`).

**Design (implement exactly):**
- History entries carry `{ gospelTestPhase: "verdict" | "grace" | "invitation" }` via native `history.pushState`/`replaceState` (Next.js App Router supports shallow same-URL pushState).
- Forward transitions: entering `verdict` → `replaceState` (back from verdict must exit `/test` — no extra entry); entering `grace` or `invitation` moving FORWARD (prev phase earlier in the order) → `pushState`.
- Backward transitions (dispatched by popstate) must NOT push — detect direction by comparing phase order index.
- Resume synthesis: when a `RESUME_SESSION` lands directly on grace/invitation, build the stack: `replaceState(verdict)`, then `pushState(grace)`, then (if invitation) `pushState(invitation)`.
- Re-read links call `history.back()` — the popstate handler does the dispatch. A `viaLink` ref distinguishes analytics `via`.
- Post-response unwind: on `invitationResponse` becoming non-null, set `unwinding.current = true` and `history.go(-depth)`; the popstate handler ignores events while unwinding (clearing the flag when the landing event arrives), then `replaceState` strips the phase marker so the next back exits the page. Stale FORWARD entries after unwind are inert by the legality guards — accepted edge.

- [ ] **Step 1: Add the analytics helper** to `src/lib/analytics.ts` following the file's existing pattern:

```ts
export function trackTestBack(from: string, to: string, via: "link" | "browser") {
  track("test_back", { from, to, via });
}
```

(Adapt `track(...)` to the file's actual emit function name.)

- [ ] **Step 2: Implement in `game-shell.tsx`.** Add below the existing effects:

```ts
const PHASE_ORDER = ["landing", "playing", "verdict", "grace", "invitation"] as const;

// --- Back-navigation history integration -------------------------------
// One path: re-read links call history.back(); popstate dispatches the
// reducer action. Entries exist only for verdict/grace/invitation —
// questions are one-way and get none.
const prevPhaseRef = useRef(state.phase);
const depthRef = useRef(0); // entries pushed beyond the verdict baseline
const unwindingRef = useRef(false);
const viaLinkRef = useRef(false);

useEffect(() => {
  const prev = prevPhaseRef.current;
  const curr = state.phase;
  prevPhaseRef.current = curr;
  if (prev === curr) return;

  const forward =
    PHASE_ORDER.indexOf(curr) > PHASE_ORDER.indexOf(prev);

  if (curr === "verdict" && forward) {
    // Baseline — back from the verdict leaves /test, as today.
    window.history.replaceState({ gospelTestPhase: "verdict" }, "");
    depthRef.current = 0;
    return;
  }

  if ((curr === "grace" || curr === "invitation") && forward) {
    if (prev === "landing") {
      // Resumed straight into a later phase — synthesize the stack so
      // the re-read links have real entries beneath them.
      window.history.replaceState({ gospelTestPhase: "verdict" }, "");
      depthRef.current = 0;
      window.history.pushState({ gospelTestPhase: "grace" }, "");
      depthRef.current = 1;
      if (curr === "invitation") {
        window.history.pushState({ gospelTestPhase: "invitation" }, "");
        depthRef.current = 2;
      }
      return;
    }
    window.history.pushState({ gospelTestPhase: curr }, "");
    depthRef.current += 1;
  }
}, [state.phase]);

useEffect(() => {
  function onPopState(e: PopStateEvent) {
    if (unwindingRef.current) {
      // Landing event of the post-response unwind: strip the marker so
      // the next back press exits the page.
      unwindingRef.current = false;
      window.history.replaceState({}, "");
      return;
    }
    const target = (e.state as { gospelTestPhase?: string } | null)
      ?.gospelTestPhase;
    if (!target) return; // left our range — App Router handles it

    const via = viaLinkRef.current ? "link" : "browser";
    viaLinkRef.current = false;
    const phase = prevPhaseRef.current;

    if (target === "verdict" && phase === "grace") {
      trackTestBack("grace", "verdict", via);
      depthRef.current = Math.max(0, depthRef.current - 1);
      dispatch({ type: "BACK_TO_VERDICT" });
    } else if (target === "grace" && phase === "invitation") {
      if (stateRef.current.invitationResponse) return; // recorded — inert
      trackTestBack("invitation", "grace", via);
      depthRef.current = Math.max(0, depthRef.current - 1);
      dispatch({ type: "BACK_TO_GRACE" });
    } else if (target === "grace" && phase === "verdict") {
      // Browser forward
      depthRef.current += 1;
      dispatch({ type: "SHOW_GRACE" });
    } else if (target === "invitation" && phase === "grace") {
      depthRef.current += 1;
      dispatch({ type: "SHOW_INVITATION" });
    }
    // Anything else: inert entry (e.g. stale forward after unwind).
  }
  window.addEventListener("popstate", onPopState);
  return () => window.removeEventListener("popstate", onPopState);
}, [dispatch]);

// Response recorded → unwind our pushed entries so hardware back exits.
const responseRef = useRef(state.invitationResponse);
useEffect(() => {
  const had = responseRef.current;
  responseRef.current = state.invitationResponse;
  if (!had && state.invitationResponse && depthRef.current > 0) {
    unwindingRef.current = true;
    window.history.go(-depthRef.current);
    depthRef.current = 0;
  }
}, [state.invitationResponse]);
```

`stateRef` note: the popstate handler is registered once (`[dispatch]`) but needs current `invitationResponse`; add `const stateRef = useRef(state); stateRef.current = state;` near the top of the component (render-time ref write is the established React escape hatch for event handlers; if the repo's lint config rejects it, sync it in a `useEffect(() => { stateRef.current = state; })` instead). `prevPhaseRef` is likewise updated by the phase effect above and read by the handler.

- [ ] **Step 3: Wire the screens.** In the phase render block:

```tsx
{state.phase === "grace" && (
  <GraceScreen
    messages={messages.grace}
    returning={state.invitationReached}
    onBack={() => {
      viaLinkRef.current = true;
      window.history.back();
    }}
  />
)}

{state.phase === "invitation" && (
  <InvitationScreen
    /* existing props unchanged */
    onBack={() => {
      viaLinkRef.current = true;
      window.history.back();
    }}
  />
)}
```

(`messages.grace` now includes `rereadVerdict` from Task 3 — the inline prop interface from Task 4 accepts it.)

- [ ] **Step 4: Full manual verification** (build + serve + Playwright or hand-drive):

```bash
pnpm build && kill $(lsof -ti :3000) 2>/dev/null; pnpm start
```

Walk: complete test → verdict (choreography plays) → grace, tap through all beats → invitation. Then verify each:
1. Invitation "Re-read grace" link → grace, ALL beats + scripture + Continue instantly visible.
2. Grace "Re-read the verdict" link → verdict complete instantly (no 3s stagger), bridge enabled.
3. Bridge → grace (instant again) → Continue → invitation. Urgency line + buttons present.
4. Hardware back on invitation → grace. Hardware back on grace → verdict. Hardware back on verdict → exits /test.
5. Browser forward from verdict → grace → invitation.
6. Answer the invitation (any response) → hardware back ONCE → exits /test (no dead presses).
7. Mid-flow exit on grace, return to /test → resume dialog → Continue → grace; "Re-read the verdict" link works (synthesized stack).
8. Questions phase: hardware back exits /test (unchanged); return shows resume dialog.
9. `pnpm test` — 104+ tests green.

- [ ] **Step 5: Gates + commit (Tasks 4+5+6 together)**

```bash
pnpm lint && pnpm test && npx tsc --noEmit && pnpm build
git add src/components/grace-screen.tsx src/components/verdict-screen.tsx src/components/invitation-screen.tsx src/components/game-shell.tsx src/lib/analytics.ts
git commit -m "feat: walk back through the testimony — re-read links + hardware back

Quiet re-read links on grace and the unanswered invitation, plus
history integration so the browser back button walks invitation →
grace → verdict instead of ejecting from /test. One code path: links
call history.back(); popstate dispatches. Re-entered screens render
complete instantly (no replayed choreography, no duplicate analytics).
A recorded response unwinds the entries — testimony stays one-way."
```

---

## Self-Review Notes

- Spec coverage: reducer actions ✓ (T1), instant re-entry ✓ (T4/T5), links ✓ (T4/T5), hardware back ✓ (T6), post-response lockout ✓ (T1 guard + T5 structural + T6 unwind), resume ✓ (T2 + T6 synthesis), copy/PT ✓ (T3), analytics ✓ (T6).
- Type ripples: `GameState.invitationReached` (T1) → storage (T2) → shell resume dispatch (T1 step 5 / T2 step 5). `GraceScreen`/`InvitationScreen` prop changes compile only after T6 wiring — commit boundary documented in T4/T5.
- Names used consistently: `invitationReached`, `BACK_TO_VERDICT`, `BACK_TO_GRACE`, `gospelTestPhase`, `trackTestBack`, `rereadVerdict`, `rereadGrace`, `returning`, `onBack`.
