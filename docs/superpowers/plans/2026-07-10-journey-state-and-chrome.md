# Journey State & Chrome Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist the visitor's invitation response, adapt the homepage to five journey stages, unify page chrome (TopBar + Footer everywhere except `/test`), and replace the scattered `test_completed` localStorage flag with one versioned journey record.

**Architecture:** A new `journey-storage.ts` lib owns a versioned `gospel-journey` localStorage record (test completion + invitation response). A `useJourney()` hook composes it with existing reading/learn progress into a `JourneySnapshot` with a derived `stage`. All components that today read `test_completed` raw migrate to the hook (or the pure `computeJourneySnapshot` for init-once spots). The homepage branches on stage. Route groups are restructured so `(immersive)` holds only `/test`.

**Tech Stack:** Next.js 16.2 App Router, React 19, TypeScript, Tailwind v4, Vitest, localStorage, PostHog.

**Spec:** `docs/superpowers/specs/2026-07-10-journey-state-and-chrome-design.md`

## Global Constraints

- **Living Waters framing:** no copy may assure salvation because of a click. Post-commitment copy is conditional — "If you've repented and trusted in Christ…" — and points to Christ's work and fruit (Word, prayer, church).
- The invitation response value is `committed` (never `prayed`) in code, storage, analytics, and message keys. Existing button copy "I will repent and trust in Christ" stays.
- Both locales (`en`, `pt`) updated in the same edit for every message change. PT is drafted by the implementer and reviewed by the owner before ship.
- No new dependencies. `pnpm` for everything.
- This is Next.js 16 — if unsure about an App Router convention, read `node_modules/next/dist/docs/` first.
- Reading plan length is 7 days (`TOTAL_READING_DAYS = 7`); learn topics count comes from `messages.learn.topics`.
- Every task ends with `pnpm test` green and a commit.

## Deviations from spec (found during planning — codebase reality wins)

1. **No resume-at-invitation for answered sessions.** `game-provider.tsx:28-31` clears the saved test session once an invitation response is recorded. The spec's thinking-stage "Return to the question" card (resume at invitation) is impossible. Replaced with a quiet "Take the test again" retake link (full journey reset) on the thinking variant.
2. **No session patching in `saveInvitationResponse()`.** Same reason — by the time a response exists, the session is being cleared. The journey record is the sole source of truth for stage.
3. **Home drops the `StickyDeathCounter` strip.** Home moves into `(content)` and gains the static TopBar; the fixed strip would overlap it, and the home hero already is a giant death counter. The strip remains on `/test` via the `(immersive)` layout.
4. **Two-phase mount pattern instead of `useSyncExternalStore`.** The hook returns an empty snapshot on the server and first client render, then swaps in the real snapshot post-mount (the proven TopBar pattern in this codebase). Hydration-safe; kills the half-baked lazy-init reads. A `ready` flag lets consumers gate on it.
5. **Dead message keys removed.** `HomeMessages.returningQuestion/readingPlanCta/learnCta/retakeCta/sharePrompt` are referenced nowhere — removed from the type and both locale files.

---

### Task 1: Housekeeping — commit WIP, clean root

**Files:**
- Commit (pre-existing WIP): `src/app/[locale]/opengraph-image.tsx`, `src/messages/en.json`, `src/messages/pt.json`
- Delete: all `*.png` in repo root (~25 files, verification screenshots)
- Move: `ACTION-PLAN.md` → `docs/ACTION-PLAN.md`, `FULL-AUDIT-REPORT.md` → `docs/FULL-AUDIT-REPORT.md`

**Interfaces:**
- Consumes: nothing
- Produces: clean baseline for all later diffs

- [ ] **Step 1: Commit the pending copy WIP**

```bash
git add src/app/[locale]/opengraph-image.tsx src/messages/en.json src/messages/pt.json
git commit -m "copy: soften Examination to Test across locales and OG image"
```

- [ ] **Step 2: Delete root screenshots, move docs**

```bash
git rm -q ./*.png 2>/dev/null; rm -f ./*.png
git mv ACTION-PLAN.md docs/ACTION-PLAN.md
git mv FULL-AUDIT-REPORT.md docs/FULL-AUDIT-REPORT.md
```

Note: the pngs are untracked (verify with `git status`); if untracked, plain `rm -f ./*.png` is enough.

- [ ] **Step 3: Verify nothing references the moved files**

Run: `grep -rn "ACTION-PLAN\|FULL-AUDIT" src README.md package.json || echo CLEAN`
Expected: `CLEAN`

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: clean repo root — remove screenshots, move audit docs to docs/"
```

---

### Task 2: Rename `prayed` → `committed`

**Files:**
- Modify: `src/lib/types.ts:10` (InvitationResponse), `:164-170` (invitation messages type)
- Modify: `src/lib/analytics.ts:114-132`
- Modify: `src/lib/discipleship-analytics.ts:11-20`
- Modify: `src/components/invitation-screen.tsx`
- Modify: `src/components/next-steps/track-prayed.tsx` → rename to `track-committed.tsx`
- Modify: `src/app/[locale]/next-steps/client.tsx`
- Modify: `src/app/[locale]/(content)/next-steps/page.tsx`
- Modify: `src/messages/en.json`, `src/messages/pt.json` (`invitation.responses.prayed` key → `committed`, `invitation.prayedEncouragement` → `committedEncouragement`)
- Test: `src/__tests__/game-reducer.test.ts:144-151`

**Interfaces:**
- Consumes: existing `InvitationResponse` type
- Produces: `type InvitationResponse = "committed" | "thinking" | "dismissed"` — every later task uses `"committed"`.

- [ ] **Step 1: Update the reducer test to expect `committed`**

In `src/__tests__/game-reducer.test.ts`, replace both occurrences:

```ts
state = gameReducer(state, { type: "SET_INVITATION_RESPONSE", response: "committed" });
// ...
expect(state.invitationResponse).toBe("committed");
// ...
const state = gameReducer(playing, { type: "SET_INVITATION_RESPONSE", response: "committed" });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test 2>&1 | tail -20`
Expected: FAIL — TypeScript error: `"committed"` not assignable to `InvitationResponse`.

- [ ] **Step 3: Rename across code**

`src/lib/types.ts:10`:
```ts
export type InvitationResponse = "committed" | "thinking" | "dismissed";
```

`src/lib/types.ts` invitation section — rename `prayedEncouragement`:
```ts
  invitation: {
    heading: string;
    committedEncouragement: string;
    thinkingEncouragement: string;
    dismissedEncouragement?: string;
    responses: Record<InvitationResponse, string>;
    resources: Array<{ name: string; url: string }>;
    learnMoreLabel: string;
  };
```

`src/lib/analytics.ts` — change both signatures:
```ts
export function trackInvitationResponse(
  response: "committed" | "thinking" | "dismissed",
  totalTime: number,
) {
```
```ts
export function trackInvitationLearnMoreClicked(
  response: "committed" | "thinking" | "dismissed",
  locale: string,
) {
```

`src/lib/discipleship-analytics.ts`:
```ts
export function trackNextStepsViewed(track: "committed" | "thinking", locale: string) {
  safeCapture("next_steps_viewed", { track, locale });
}

export function trackNextStepsActionClicked(
  action: "read" | "pray" | "community" | "share" | "reading_plan" | "learn",
  track: "committed" | "thinking",
) {
  safeCapture("next_steps_action_clicked", { action, track });
}
```

`src/components/invitation-screen.tsx` — replace all `"prayed"` literals and key accesses:
- `handleResponse("prayed")` → `handleResponse("committed")`
- `{invitation.responses.prayed}` → `{invitation.responses.committed}`
- `invitationResponse === "prayed"` → `invitationResponse === "committed"`
- `{invitation.prayedEncouragement}` → `{invitation.committedEncouragement}`
- The next-steps href: `` `/${locale}/next-steps?track=${invitationResponse === "committed" ? "committed" : "thinking"}` `` (param itself dies in Task 8).

Rename component file and symbol:
```bash
git mv src/components/next-steps/track-prayed.tsx src/components/next-steps/track-committed.tsx
```
Inside it: `export function TrackPrayed(` → `export function TrackCommitted(`, and any `track: "prayed"` analytics args → `"committed"`.

`src/app/[locale]/next-steps/client.tsx`:
- `import { TrackCommitted } from "@/components/next-steps/track-committed";`
- `type Track = "committed" | "thinking";`
- `{track === "committed" ? <TrackCommitted .../> : <TrackThinking .../>}` (keep `trackA`/`trackB` message key names)

`src/app/[locale]/(content)/next-steps/page.tsx`:
- `track={track === "thinking" ? "thinking" : "committed"}`

`src/messages/en.json` + `src/messages/pt.json`:
- `"invitation.responses"`: rename key `"prayed"` → `"committed"` (values unchanged)
- `"prayedEncouragement"` → `"committedEncouragement"` (values unchanged)

- [ ] **Step 4: Verify zero remaining references**

Run: `grep -rn "prayed" src/ | grep -v "track-committed\|node_modules" ; echo "exit: $?"`
Expected: no output lines, `exit: 1` (grep found nothing).

- [ ] **Step 5: Run tests and build**

Run: `pnpm test && pnpm build 2>&1 | tail -5`
Expected: tests PASS, build succeeds.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: rename invitation response 'prayed' to 'committed' (Living Waters framing)"
```

---

### Task 3: `journey-storage` lib (TDD)

**Files:**
- Create: `src/lib/journey-storage.ts`
- Test: `src/__tests__/journey-storage.test.ts`

**Interfaces:**
- Consumes: `emitStorageChange` from `@/lib/client-storage`, `InvitationResponse` from `@/lib/types`
- Produces (later tasks depend on these exact names):
  - `interface JourneyRecord { version: number; testCompletedAt: number | null; invitationResponse: InvitationResponse | null; respondedAt: number | null }`
  - `type JourneyStage = "visitor" | "undecided" | "committed" | "thinking" | "dismissed"`
  - `readJourney(): JourneyRecord` (never null — empty record when absent/corrupt)
  - `markTestCompleted(): void` (idempotent — keeps first timestamp)
  - `saveInvitationResponse(response: InvitationResponse): void`
  - `resetJourney(): void`
  - `deriveStage(record: JourneyRecord): JourneyStage`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/journey-storage.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  readJourney,
  markTestCompleted,
  saveInvitationResponse,
  resetJourney,
  deriveStage,
  type JourneyRecord,
} from "@/lib/journey-storage";

// Mock localStorage (same pattern as test-session-storage.test.ts)
const storage = new Map<string, string>();
const localStorageMock = {
  getItem: vi.fn((key: string) => storage.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
  removeItem: vi.fn((key: string) => storage.delete(key)),
};

vi.stubGlobal("window", {});
vi.stubGlobal("localStorage", localStorageMock);

vi.mock("@/lib/client-storage", () => ({
  emitStorageChange: vi.fn(),
}));

describe("journey-storage", () => {
  beforeEach(() => {
    storage.clear();
    vi.clearAllMocks();
  });

  describe("readJourney", () => {
    it("returns an empty record when nothing is stored", () => {
      const record = readJourney();
      expect(record.testCompletedAt).toBeNull();
      expect(record.invitationResponse).toBeNull();
      expect(record.respondedAt).toBeNull();
    });

    it("returns an empty record for corrupted JSON", () => {
      storage.set("gospel-journey", "not json{{{");
      expect(readJourney().testCompletedAt).toBeNull();
    });

    it("returns an empty record for a version mismatch", () => {
      storage.set(
        "gospel-journey",
        JSON.stringify({ version: 999, testCompletedAt: 123 }),
      );
      expect(readJourney().testCompletedAt).toBeNull();
    });

    it("discards an invalid invitationResponse value", () => {
      storage.set(
        "gospel-journey",
        JSON.stringify({
          version: 1,
          testCompletedAt: 123,
          invitationResponse: "prayed",
          respondedAt: 456,
        }),
      );
      expect(readJourney().invitationResponse).toBeNull();
    });
  });

  describe("legacy test_completed migration", () => {
    it("folds a legacy flag into a new record and deletes the flag", () => {
      storage.set("test_completed", "1");
      const record = readJourney();
      expect(record.testCompletedAt).not.toBeNull();
      expect(storage.has("test_completed")).toBe(false);
    });

    it("does not overwrite an existing record, but still deletes the flag", () => {
      saveInvitationResponse("committed");
      storage.set("test_completed", "1");
      const record = readJourney();
      expect(record.invitationResponse).toBe("committed");
      expect(storage.has("test_completed")).toBe(false);
    });

    it("ignores a legacy flag that is not '1'", () => {
      storage.set("test_completed", "0");
      expect(readJourney().testCompletedAt).toBeNull();
      expect(storage.has("test_completed")).toBe(false);
    });
  });

  describe("markTestCompleted", () => {
    it("stamps testCompletedAt", () => {
      markTestCompleted();
      expect(readJourney().testCompletedAt).toBeTypeOf("number");
    });

    it("is idempotent — keeps the first timestamp", () => {
      markTestCompleted();
      const first = readJourney().testCompletedAt;
      markTestCompleted();
      expect(readJourney().testCompletedAt).toBe(first);
    });
  });

  describe("saveInvitationResponse", () => {
    it("stores the response and respondedAt", () => {
      markTestCompleted();
      saveInvitationResponse("thinking");
      const record = readJourney();
      expect(record.invitationResponse).toBe("thinking");
      expect(record.respondedAt).toBeTypeOf("number");
    });

    it("backfills testCompletedAt when missing", () => {
      saveInvitationResponse("committed");
      expect(readJourney().testCompletedAt).toBeTypeOf("number");
    });

    it("overwrites a previous response (thinking → committed)", () => {
      saveInvitationResponse("thinking");
      saveInvitationResponse("committed");
      expect(readJourney().invitationResponse).toBe("committed");
    });
  });

  describe("resetJourney", () => {
    it("clears the record", () => {
      saveInvitationResponse("dismissed");
      resetJourney();
      expect(readJourney().invitationResponse).toBeNull();
      expect(readJourney().testCompletedAt).toBeNull();
    });
  });

  describe("deriveStage", () => {
    const base: JourneyRecord = {
      version: 1,
      testCompletedAt: null,
      invitationResponse: null,
      respondedAt: null,
    };

    it("visitor when nothing happened", () => {
      expect(deriveStage(base)).toBe("visitor");
    });

    it("undecided when test done but no response", () => {
      expect(deriveStage({ ...base, testCompletedAt: 123 })).toBe("undecided");
    });

    it("committed / thinking / dismissed follow the response", () => {
      expect(
        deriveStage({ ...base, testCompletedAt: 1, invitationResponse: "committed", respondedAt: 2 }),
      ).toBe("committed");
      expect(
        deriveStage({ ...base, testCompletedAt: 1, invitationResponse: "thinking", respondedAt: 2 }),
      ).toBe("thinking");
      expect(
        deriveStage({ ...base, testCompletedAt: 1, invitationResponse: "dismissed", respondedAt: 2 }),
      ).toBe("dismissed");
    });

    it("response wins even without testCompletedAt (defensive)", () => {
      expect(deriveStage({ ...base, invitationResponse: "committed" })).toBe("committed");
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test 2>&1 | tail -10`
Expected: FAIL — cannot resolve `@/lib/journey-storage`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/journey-storage.ts`:

```ts
import { emitStorageChange } from "./client-storage";
import type { InvitationResponse } from "./types";

const STORAGE_KEY = "gospel-journey";
const LEGACY_TEST_COMPLETED_KEY = "test_completed";

// Bump when JourneyRecord shape changes. Mismatched versions are
// silently discarded on read (same policy as test-session-storage).
const CURRENT_VERSION = 1;

export interface JourneyRecord {
  version: number;
  testCompletedAt: number | null;
  invitationResponse: InvitationResponse | null;
  respondedAt: number | null;
}

export type JourneyStage =
  | "visitor"
  | "undecided"
  | "committed"
  | "thinking"
  | "dismissed";

const EMPTY_RECORD: JourneyRecord = {
  version: CURRENT_VERSION,
  testCompletedAt: null,
  invitationResponse: null,
  respondedAt: null,
};

function isValidResponse(value: unknown): value is InvitationResponse {
  return value === "committed" || value === "thinking" || value === "dismissed";
}

/**
 * One-time migration: fold the legacy bare "test_completed" flag into the
 * journey record, then delete the flag. Never overwrites an existing record.
 */
function migrateLegacyFlag(): void {
  const legacy = localStorage.getItem(LEGACY_TEST_COMPLETED_KEY);
  if (legacy === null) return;
  if (legacy === "1" && localStorage.getItem(STORAGE_KEY) === null) {
    const record: JourneyRecord = { ...EMPTY_RECORD, testCompletedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  }
  localStorage.removeItem(LEGACY_TEST_COMPLETED_KEY);
}

export function readJourney(): JourneyRecord {
  if (typeof window === "undefined") return EMPTY_RECORD;
  try {
    migrateLegacyFlag();
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_RECORD;
    const parsed = JSON.parse(raw) as Partial<JourneyRecord>;
    if (parsed.version !== CURRENT_VERSION) return EMPTY_RECORD;
    return {
      version: CURRENT_VERSION,
      testCompletedAt:
        typeof parsed.testCompletedAt === "number" ? parsed.testCompletedAt : null,
      invitationResponse: isValidResponse(parsed.invitationResponse)
        ? parsed.invitationResponse
        : null,
      respondedAt: typeof parsed.respondedAt === "number" ? parsed.respondedAt : null,
    };
  } catch (error) {
    console.warn("[journey-storage] Failed to read journey:", error);
    return EMPTY_RECORD;
  }
}

function writeJourney(record: JourneyRecord): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    emitStorageChange();
  } catch (error) {
    console.warn("[journey-storage] Failed to write journey:", error);
  }
}

/** Idempotent: the first completion timestamp is kept. */
export function markTestCompleted(): void {
  const current = readJourney();
  if (current.testCompletedAt !== null) return;
  writeJourney({ ...current, testCompletedAt: Date.now() });
}

export function saveInvitationResponse(response: InvitationResponse): void {
  const current = readJourney();
  writeJourney({
    ...current,
    testCompletedAt: current.testCompletedAt ?? Date.now(),
    invitationResponse: response,
    respondedAt: Date.now(),
  });
}

export function resetJourney(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_TEST_COMPLETED_KEY);
    emitStorageChange();
  } catch (error) {
    console.warn("[journey-storage] Failed to reset journey:", error);
  }
}

export function deriveStage(record: JourneyRecord): JourneyStage {
  if (record.invitationResponse) return record.invitationResponse;
  if (record.testCompletedAt !== null) return "undecided";
  return "visitor";
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test 2>&1 | tail -10`
Expected: PASS (all suites).

- [ ] **Step 5: Commit**

```bash
git add src/lib/journey-storage.ts src/__tests__/journey-storage.test.ts
git commit -m "feat: versioned journey record with legacy test_completed migration"
```

---

### Task 4: `useJourney` hook

**Files:**
- Create: `src/lib/use-journey.ts`

**Interfaces:**
- Consumes: `readJourney`, `deriveStage` (Task 3); `subscribeToStorage` from `@/lib/client-storage`; `readProgress`, `getCompletedCount` from `@/lib/reading-storage`; `isTopicCompleted` from `@/lib/learn-progress-storage`
- Produces:
  - `interface JourneySnapshot { stage: JourneyStage; readingDone: number; learnDone: number; ready: boolean }`
  - `useJourney(topicSlugs?: readonly string[]): JourneySnapshot` — `ready` is `false` on server + first client render, `true` after the post-mount read (hydration-safe two-phase, same as TopBar).
  - `computeJourneySnapshot(topicSlugs: readonly string[]): JourneySnapshot` — pure read for init-once, non-subscribing call sites (topic-nav).
  - `TOTAL_READING_DAYS = 7` re-exported constant.

No dedicated unit test: the stage logic is tested in Task 3; the hook is a thin subscription shell exercised by the E2E walkthrough (Task 10).

- [ ] **Step 1: Write the hook**

Create `src/lib/use-journey.ts`:

```ts
"use client";

import { useEffect, useState } from "react";
import { subscribeToStorage } from "./client-storage";
import { readJourney, deriveStage, type JourneyStage } from "./journey-storage";
import { readProgress, getCompletedCount } from "./reading-storage";
import { isTopicCompleted } from "./learn-progress-storage";

export const TOTAL_READING_DAYS = 7;

export interface JourneySnapshot {
  stage: JourneyStage;
  readingDone: number;
  learnDone: number;
  /** false on the server and the first client render; true once localStorage has been read. */
  ready: boolean;
}

const EMPTY_SNAPSHOT: JourneySnapshot = {
  stage: "visitor",
  readingDone: 0,
  learnDone: 0,
  ready: false,
};

/** Pure snapshot read for init-once call sites that don't need subscriptions. */
export function computeJourneySnapshot(
  topicSlugs: readonly string[],
): JourneySnapshot {
  try {
    return {
      stage: deriveStage(readJourney()),
      readingDone: getCompletedCount(readProgress(), TOTAL_READING_DAYS),
      learnDone: topicSlugs.reduce(
        (n, slug) => (isTopicCompleted(slug) ? n + 1 : n),
        0,
      ),
      ready: true,
    };
  } catch {
    return { ...EMPTY_SNAPSHOT, ready: true };
  }
}

/**
 * Journey snapshot with live updates. Server render and first client render
 * return EMPTY_SNAPSHOT so hydration output is stable; the effect swaps in
 * the real snapshot post-mount and re-reads on storage changes and bfcache
 * restores (pageshow).
 */
export function useJourney(
  topicSlugs: readonly string[] = [],
): JourneySnapshot {
  const [snapshot, setSnapshot] = useState<JourneySnapshot>(EMPTY_SNAPSHOT);
  const slugsKey = topicSlugs.join(",");

  useEffect(() => {
    const slugs = slugsKey ? slugsKey.split(",") : [];
    const update = () => setSnapshot(computeJourneySnapshot(slugs));
    update();
    window.addEventListener("pageshow", update);
    const unsubscribe = subscribeToStorage(update);
    return () => {
      window.removeEventListener("pageshow", update);
      unsubscribe();
    };
  }, [slugsKey]);

  return snapshot;
}
```

- [ ] **Step 2: Type-check and test**

Run: `pnpm test && npx tsc --noEmit 2>&1 | tail -5`
Expected: PASS, no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/use-journey.ts
git commit -m "feat: useJourney hook — single journey snapshot with live updates"
```

---

### Task 5: Migrate writers and readers to the journey record

**Files:**
- Modify: `src/components/game-shell.tsx:80-88` (writer), `:165-175` (invitation response writer)
- Modify: `src/components/journey-tracker.tsx` (reader via props + retake reset)
- Modify: `src/components/home-shell.tsx` (reader — keep binary behavior for now)
- Modify: `src/components/shared/top-bar.tsx` (reader)
- Modify: `src/components/learn/learn-hub.tsx:67-70` (reader)
- Modify: `src/components/learn/topic-nav.tsx:25-50` (reader)

**Interfaces:**
- Consumes: Task 3 (`markTestCompleted`, `saveInvitationResponse`, `resetJourney`, `readJourney`, `deriveStage`), Task 4 (`useJourney`, `computeJourneySnapshot`, `JourneySnapshot`)
- Produces: `JourneyTracker` prop change — it now receives `snapshot: JourneySnapshot` from its parent instead of reading storage itself. Zero raw `test_completed` reads remain outside `journey-storage.ts`.

- [ ] **Step 1: game-shell — journey writers**

In `src/components/game-shell.tsx`, add import:
```ts
import { markTestCompleted, saveInvitationResponse } from "@/lib/journey-storage";
```
Remove the `emitStorageChange` import (no longer used here). Replace the inline persistence block in the phase effect:

```ts
    // Persist test completion so other pages (home, learn, nav) can check
    if (state.phase === "verdict" || state.phase === "grace" || state.phase === "invitation") {
      markTestCompleted();
    }
```

Change the invitation `onResponse` callback:

```tsx
            onResponse={(response) => {
              saveInvitationResponse(response);
              dispatch({ type: "SET_INVITATION_RESPONSE", response });
            }}
```

- [ ] **Step 2: journey-tracker — snapshot via props, resetJourney on retake**

In `src/components/journey-tracker.tsx`:
- Remove imports: `useEffect`, `useState`, `subscribeToStorage`, `emitStorageChange`, `readProgress`, `getCompletedCount`, `isTopicCompleted`.
- Add: `import { resetJourney } from "@/lib/journey-storage";` and `import { TOTAL_READING_DAYS, type JourneySnapshot } from "@/lib/use-journey";`
- Delete the local `Snapshot` type, `EMPTY_SNAPSHOT`, `readSnapshot()`, the `useState` lazy init, and the subscribe `useEffect`.
- Change props: add `snapshot: JourneySnapshot` to `JourneyTrackerProps` and destructure it; delete the `TOTAL_READING_DAYS` local const (use the imported one).
- `testComplete` becomes `snapshot.stage !== "visitor"` (the tracker only renders for non-visitor stages anyway; keep the guard).
- Replace the retake link's onClick:

```tsx
        onClick={() => {
          trackHomeRetakeClicked();
          resetJourney();
          clearSession();
        }}
```

- [ ] **Step 3: home-shell — useJourney (behavior-preserving)**

In `src/components/home-shell.tsx`:
- Remove the `testCompleted` state, its lazy initializer, the `readTestCompleted` function, the `pageshow` listener, and the `subscribeToStorage` usage (the hook handles all of it).
- Add: `import { useJourney } from "@/lib/use-journey";`
- Inside the component:

```ts
  const journey = useJourney(topicSlugs);
  const testCompleted = journey.stage !== "visitor";
```
- Pass the snapshot down: `<JourneyTracker snapshot={journey} ... />` (keep other props).
- Keep `trackHomeViewed(locale)` as is for now (stage property added in Task 6).

Note: this changes returning-visitor first paint — the tracker appears post-mount instead of on first render. Accepted deviation (hydration correctness); verify no egregious jump in Task 10.

- [ ] **Step 4: top-bar — useJourney**

In `src/components/shared/top-bar.tsx`:
- Remove imports `subscribeToStorage`, `readProgress`, `getCompletedCount`; remove `TOTAL_READING_DAYS`, the `Stage` type, and `readStage()`.
- Add: `import { useJourney, TOTAL_READING_DAYS } from "@/lib/use-journey";`
- Replace the state logic:

```ts
  const journey = useJourney();
  const stage: "pre-test" | "pre-reading" | "done" =
    journey.stage === "visitor"
      ? "pre-test"
      : journey.readingDone >= TOTAL_READING_DAYS
        ? "done"
        : "pre-reading";
```
Delete the old `useState`/`useEffect` pair. JSX stays unchanged.

- [ ] **Step 5: learn-hub + topic-nav**

`src/components/learn/learn-hub.tsx` — in `readLearnHubState`, replace the raw read:
```ts
      const testDone = deriveStage(readJourney()) !== "visitor";
```
with import `import { readJourney, deriveStage } from "@/lib/journey-storage";`.

`src/components/learn/topic-nav.tsx` — in `getInitialCta`, replace:
```ts
    const testDone = localStorage.getItem("test_completed") === "1";
```
with:
```ts
    const testDone = computeJourneySnapshot([]).stage !== "visitor";
```
and import `import { computeJourneySnapshot } from "@/lib/use-journey";`. (Init-once by design — this CTA intentionally doesn't live-update.)

- [ ] **Step 6: Verify no raw flag reads remain**

Run: `grep -rn "test_completed" src/ | grep -v journey-storage`
Expected: no output.

- [ ] **Step 7: Test, build, manual smoke**

Run: `pnpm test && pnpm build 2>&1 | tail -5`
Expected: green.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor: route all journey state through journey-storage and useJourney"
```

---

### Task 6: Homepage stage variants + messages

**Files:**
- Modify: `src/components/home-shell.tsx` (stage branches)
- Modify: `src/lib/types.ts` (`HomeMessages` — add `journeyStages`, drop dead keys)
- Modify: `src/lib/i18n.ts` (validator)
- Modify: `src/lib/eternity-analytics.ts` (`trackHomeViewed` stage property)
- Modify: `src/messages/en.json`, `src/messages/pt.json`

**Interfaces:**
- Consumes: `useJourney` snapshot (`stage`, `ready`), `saveInvitationResponse`, `resetJourney`, `clearSession`
- Produces: `HomeMessages.journeyStages` shape (below) — Task 10 verifies each variant renders.

- [ ] **Step 1: Extend `HomeMessages` in `src/lib/types.ts`**

Replace the `HomeMessages` interface (dropping the five dead keys `returningQuestion`, `readingPlanCta`, `learnCta`, `retakeCta`, `sharePrompt` — verified unused):

```ts
export interface JourneyStagesMessages {
  undecided: {
    heading: string;
    cta: string;
  };
  committed: {
    heading: string;
    subheading: string;
  };
  thinking: {
    reflection: string;
    johnCard: { label: string; description: string; url: string };
    learnCard: { label: string; description: string };
    commitLabel: string;
    retakeLabel: string;
  };
  dismissed: {
    line: string;
    retakeCta: string;
  };
}

export interface HomeMessages {
  provocativeQuestion: string;
  mortalityStat: string;
  ctaButton: string;
  secondaryLink: string;
  facts: string[];
  journey: JourneyMessages;
  journeyStages: JourneyStagesMessages;
}
```

- [ ] **Step 2: Add messages — `en.json` under `home`**

Add `journeyStages` (and delete the five dead keys `returningQuestion`, `readingPlanCta`, `learnCta`, `retakeCta`, `sharePrompt`):

```json
"journeyStages": {
  "undecided": {
    "heading": "You've seen the verdict. What will you do with it?",
    "cta": "Return to where you left off"
  },
  "committed": {
    "heading": "If you've repented and trusted in Christ, God has forgiven you — not because you earned it, but because of what Christ did.",
    "subheading": "Grow in it:"
  },
  "thinking": {
    "reflection": "The discomfort you feel might be your conscience agreeing with God's standard. Take it seriously.",
    "johnCard": {
      "label": "Read John 3",
      "description": "A conversation between Jesus and a man who had questions just like yours.",
      "url": "https://www.bible.com/bible/114/JHN.3.NKJV"
    },
    "learnCard": {
      "label": "The foundations",
      "description": "Short, honest answers to the core questions."
    },
    "commitLabel": "I have repented and trusted in Christ",
    "retakeLabel": "Take the test again"
  },
  "dismissed": {
    "line": "That's okay. The door stays open.",
    "retakeCta": "Take the test again"
  }
}
```

- [ ] **Step 3: Add PT messages — `pt.json` under `home`** (same key deletions)

```json
"journeyStages": {
  "undecided": {
    "heading": "Viste o veredito. O que vais fazer com ele?",
    "cta": "Volta onde ficaste"
  },
  "committed": {
    "heading": "Se te arrependeste e confiaste em Cristo, Deus perdoou-te — não porque o mereceste, mas por causa do que Cristo fez.",
    "subheading": "Cresce nisso:"
  },
  "thinking": {
    "reflection": "O desconforto que sentes pode ser a tua consciência a concordar com o padrão de Deus. Leva-o a sério.",
    "johnCard": {
      "label": "Lê João 3",
      "description": "Uma conversa entre Jesus e um homem que tinha perguntas como as tuas.",
      "url": "https://www.bible.com/bible/1930/JHN.3.ARC"
    },
    "learnCard": {
      "label": "Os fundamentos",
      "description": "Respostas curtas e honestas às perguntas essenciais."
    },
    "commitLabel": "Arrependi-me e confiei em Cristo",
    "retakeLabel": "Faz o teste outra vez"
  },
  "dismissed": {
    "line": "Está bem. A porta continua aberta.",
    "retakeCta": "Faz o teste outra vez"
  }
}
```

(PT drafted — owner reviews register before ship.)

- [ ] **Step 4: Validator — `src/lib/i18n.ts`**

In `validateMessages`, after the existing test-content check, add:

```ts
  const stages = (m as Messages & { home?: { journeyStages?: Record<string, unknown> } }).home?.journeyStages as
    | import("./types").JourneyStagesMessages
    | undefined;
  if (
    !stages?.undecided?.heading ||
    !stages?.committed?.heading ||
    !stages?.thinking?.commitLabel ||
    !stages?.dismissed?.retakeCta
  ) {
    throw new Error(`[i18n] Missing home.journeyStages content for locale "${locale}"`);
  }
```

(If `Messages` doesn't include `home`, extend the check pragmatically to match how `home` is typed in this file — the goal: build fails loudly when a locale is missing stage copy.)

- [ ] **Step 5: Analytics — stage on home_page_viewed**

`src/lib/eternity-analytics.ts`:

```ts
export function trackHomeViewed(locale: string, stage?: string) {
  safeCapture("home_page_viewed", { locale, stage });
}
```

- [ ] **Step 6: home-shell stage branches**

In `src/components/home-shell.tsx` replace the bottom CTA section (`{testCompleted ? ... : ...}`) with a five-way branch. Full section code:

```tsx
          {/* === Bottom CTA section — adapts to journey stage === */}
          {journey.stage === "committed" && (
            <div className="mt-10 flex w-full flex-col items-center sm:mt-14">
              <p className="max-w-md text-center text-sm leading-relaxed text-white/70">
                {home.journeyStages.committed.heading}
              </p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[3px] text-[#D4A843]/80">
                {home.journeyStages.committed.subheading}
              </p>
              <JourneyTracker
                snapshot={journey}
                locale={locale}
                messages={home.journey}
                shareMessages={share}
                topicSlugs={topicSlugs}
              />
            </div>
          )}

          {journey.stage === "undecided" && (
            <>
              <h1 className="mt-10 max-w-md text-center text-2xl font-bold leading-tight tracking-tight text-white/90 sm:mt-14 sm:text-3xl">
                {home.journeyStages.undecided.heading}
              </h1>
              <Link href={`/${locale}/test`} onClick={() => trackHomeCtaClicked()} className="mt-8">
                <Button variant="gold" size="lg" mist>
                  {home.journeyStages.undecided.cta}
                  <ButtonArrow />
                </Button>
              </Link>
            </>
          )}

          {journey.stage === "thinking" && (
            <div className="mt-10 flex w-full max-w-md flex-col items-center gap-3 sm:mt-14">
              <p className="text-center text-sm leading-relaxed text-white/70">
                {home.journeyStages.thinking.reflection}
              </p>
              <a
                href={home.journeyStages.thinking.johnCard.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-xl border border-white/[0.06] bg-white/[0.015] p-5 transition-all hover:border-[#D4A843]/20"
              >
                <p className="text-sm font-semibold text-white/85">
                  {home.journeyStages.thinking.johnCard.label}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-white/60">
                  {home.journeyStages.thinking.johnCard.description}
                </p>
              </a>
              <Link
                href={`/${locale}/learn`}
                className="block w-full rounded-xl border border-white/[0.06] bg-white/[0.015] p-5 transition-all hover:border-[#D4A843]/20"
              >
                <p className="text-sm font-semibold text-white/85">
                  {home.journeyStages.thinking.learnCard.label}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-white/60">
                  {home.journeyStages.thinking.learnCard.description}
                </p>
              </Link>
              <button
                type="button"
                onClick={() => saveInvitationResponse("committed")}
                className="mt-3 font-mono text-[10px] uppercase tracking-[2px] text-[#D4A843]/70 transition-colors hover:text-[#D4A843]"
              >
                {home.journeyStages.thinking.commitLabel}
              </button>
              <Link
                href={`/${locale}/test`}
                onClick={() => {
                  resetJourney();
                  clearSession();
                }}
                className="font-mono text-[10px] uppercase tracking-[2px] text-white/40 transition-colors hover:text-white/60"
              >
                {home.journeyStages.thinking.retakeLabel}
              </Link>
            </div>
          )}

          {journey.stage === "dismissed" && (
            <>
              <p className="mt-10 max-w-md text-center text-sm leading-relaxed text-white/60 sm:mt-14">
                {home.journeyStages.dismissed.line}
              </p>
              <Link
                href={`/${locale}/test`}
                onClick={() => {
                  resetJourney();
                  clearSession();
                }}
                className="mt-6"
              >
                <Button variant="ghost">
                  {home.journeyStages.dismissed.retakeCta}
                </Button>
              </Link>
              <Link href={`/${locale}/learn`} onClick={() => trackHomeSecondaryClicked()} className="mt-4">
                <Button variant="text">{home.secondaryLink}</Button>
              </Link>
            </>
          )}

          {journey.stage === "visitor" && (
            <>
              {/* New visitor */}
              <p className="mt-10 font-mono text-[10px] uppercase tracking-[3px] text-red-400/80 sm:mt-14 sm:text-[11px] sm:tracking-[4px]">
                {home.mortalityStat}
              </p>
              <h1 className="mt-3 max-w-md text-center text-2xl font-bold leading-tight tracking-tight text-white/90 sm:mt-4 sm:text-3xl md:text-4xl">
                {home.provocativeQuestion}
              </h1>
              <Link href={`/${locale}/test`} onClick={() => trackHomeCtaClicked()} className="mt-8">
                <Button variant="gold" size="lg" mist>
                  {home.ctaButton}
                  <ButtonArrow />
                </Button>
              </Link>
              <Link href={`/${locale}/learn`} onClick={() => trackHomeSecondaryClicked()} className="mt-4">
                <Button variant="text">{home.secondaryLink}</Button>
              </Link>
            </>
          )}
```

Imports to add in home-shell:
```ts
import { saveInvitationResponse, resetJourney } from "@/lib/journey-storage";
import { clearSession } from "@/lib/test-session-storage";
```

Also: `showScrollHint` — replace `!testCompleted` with `journey.stage === "visitor"`, and delete the now-unused `testCompleted` variable.

Analytics effect — report the stage once real (replace the plain `trackHomeViewed(locale)` call):

```ts
  const [viewTracked, setViewTracked] = useState(false);
  useEffect(() => {
    if (viewTracked || !journey.ready) return;
    setViewTracked(true);
    trackHomeViewed(locale, journey.stage);
  }, [viewTracked, journey.ready, journey.stage, locale]);
```

- [ ] **Step 7: Test + build + visual smoke**

Run: `pnpm test && pnpm build 2>&1 | tail -5`
Expected: green. (Variant rendering verified in Task 10.)

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: homepage adapts to journey stage — committed, thinking, dismissed, undecided"
```

---

### Task 7: Chrome unification — home joins `(content)`

**Files:**
- Move: `src/app/[locale]/(immersive)/page.tsx` → `src/app/[locale]/(content)/page.tsx`
- Modify: `src/app/[locale]/(immersive)/layout.tsx` (unchanged code — now serves only `/test`; update its comment if any)
- Modify: `src/components/home-shell.tsx` (spacing: hero no longer clears a fixed strip)

**Interfaces:**
- Consumes: existing `(content)` layout (TopBar + Footer)
- Produces: home URL unchanged (`/{locale}`), now wrapped in TopBar + Footer; `/test` is the only chromeless-with-death-strip route.

- [ ] **Step 1: Move the page**

```bash
git mv "src/app/[locale]/(immersive)/page.tsx" "src/app/[locale]/(content)/page.tsx"
```

Route groups don't affect URLs — `/{locale}` still resolves; no conflict since only one `page.tsx` exists for that segment.

- [ ] **Step 2: Adjust hero top spacing in home-shell**

The hero section's `pt-16 sm:pt-20` cleared the fixed death strip, which is gone; TopBar is now in normal flow above. Change the section class:

```tsx
      <section className="relative flex min-h-[calc(100svh-3.5rem)] flex-col items-center justify-center px-4 pt-8 pb-12 sm:px-6 sm:pt-10 sm:pb-16">
```

(`3.5rem` ≈ TopBar height so hero + TopBar ≈ one viewport; fine-tune during the visual check in Task 10.)

- [ ] **Step 3: Build and verify routes**

Run: `pnpm build 2>&1 | tail -15`
Expected: build succeeds; route list shows `/[locale]` and `/[locale]/test` both present.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: home joins content chrome — TopBar and Footer everywhere except /test"
```

---

### Task 8: Next-steps derives track from journey record

**Files:**
- Move: `src/app/[locale]/next-steps/client.tsx` → `src/app/[locale]/(content)/next-steps/client.tsx`
- Modify: `src/app/[locale]/(content)/next-steps/page.tsx` (drop `searchParams`)
- Modify: `src/components/invitation-screen.tsx` (drop `?track=` from href)

**Interfaces:**
- Consumes: `useJourney` (Task 4)
- Produces: `/next-steps` renders trackA for `committed`, trackB for `thinking`, redirects `/{locale}` otherwise.

- [ ] **Step 1: Move client.tsx and gate on journey stage**

```bash
git mv "src/app/[locale]/next-steps/client.tsx" "src/app/[locale]/(content)/next-steps/client.tsx"
rmdir "src/app/[locale]/next-steps"
```

Rewrite the moved `client.tsx`'s exported component (keep `NextStepsView` and the messages prop types as they are, minus the `track` prop threading):

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TrackCommitted } from "@/components/next-steps/track-committed";
import { TrackThinking } from "@/components/next-steps/track-thinking";
import { trackNextStepsViewed } from "@/lib/discipleship-analytics";
import { useJourney } from "@/lib/use-journey";
import type { Locale } from "@/lib/i18n";

interface NextStepsClientProps {
  nextStepsMessages: {
    trackA: Parameters<typeof TrackCommitted>[0]["messages"];
    trackB: Parameters<typeof TrackThinking>[0]["messages"];
  };
  shareMessages: { prompt: string; whatsappMessage: string; telegramMessage: string; linkCopied: string };
  locale: Locale;
}

export function NextStepsClient({ nextStepsMessages, shareMessages, locale }: NextStepsClientProps) {
  const { stage, ready } = useJourney();
  const router = useRouter();

  const track = stage === "committed" ? "committed" : stage === "thinking" ? "thinking" : null;

  useEffect(() => {
    if (!ready) return;
    if (!track) {
      // No recorded response — the page has nothing honest to say. Go home.
      router.replace(`/${locale}`);
      return;
    }
    trackNextStepsViewed(track, locale);
  }, [ready, track, locale, router]);

  if (!ready || !track) return null;

  return (
    <main className="min-h-dvh bg-[#060404] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#060404_75%)]" />
      <div className="relative z-[1]">
        {track === "committed" ? (
          <TrackCommitted messages={nextStepsMessages.trackA} shareMessages={shareMessages} locale={locale} />
        ) : (
          <TrackThinking messages={nextStepsMessages.trackB} locale={locale} />
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Page drops searchParams**

In `src/app/[locale]/(content)/next-steps/page.tsx`:
- Fix the import: `import { NextStepsClient } from "./client";`
- Remove `searchParams` from `Props` and the `const { track } = await searchParams;` line.
- Render `<NextStepsClient nextStepsMessages={data.nextSteps} shareMessages={data.share} locale={locale as Locale} />` (no `track` prop).

- [ ] **Step 3: Invitation screen — clean href**

In `src/components/invitation-screen.tsx`, the next-steps CTA:

```tsx
              <Link href={`/${locale}/next-steps`} className="mt-6 block">
```

- [ ] **Step 4: Verify param is gone**

Run: `grep -rn "track=" src/ | grep -v "track ===" ; echo "exit: $?"`
Expected: no `?track=` URL construction remains.

- [ ] **Step 5: Test + build**

Run: `pnpm test && pnpm build 2>&1 | tail -5`
Expected: green.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: next-steps derives track from journey record, query param removed"
```

---

### Task 9: Shared page container

**Files:**
- Create: `src/components/shared/page-shell.tsx`
- Modify: `src/components/learn/learn-hub.tsx:141-144`, `src/components/learn/topic-page.tsx:52-55`, `src/app/[locale]/(content)/reading-plan/page.tsx:53`, `src/app/[locale]/(content)/about/page.tsx:52-55`, `src/app/[locale]/(content)/privacy/page.tsx:52-55`, `src/app/[locale]/(content)/terms/page.tsx` (same pattern), `src/app/[locale]/(content)/next-steps/client.tsx`

**Interfaces:**
- Consumes: nothing new
- Produces: `PageShell({ width?: "narrow" | "wide", children })` — the single wrapper for content pages.

- [ ] **Step 1: Create the component**

```tsx
interface PageShellProps {
  /** narrow = reading column (learn, reading plan, next-steps); wide = legal/about prose. */
  width?: "narrow" | "wide";
  children: React.ReactNode;
}

/**
 * Standard content-page wrapper: dark stage, radial vignette, centered column.
 * Keeps every content page on the same grid so the product reads as one thing.
 */
export function PageShell({ width = "narrow", children }: PageShellProps) {
  return (
    <main className="min-h-dvh bg-[#060404] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#060404_75%)]" />
      <div
        className={
          width === "narrow"
            ? "relative z-[1] mx-auto max-w-lg px-4 py-16 sm:px-6 sm:py-24"
            : "relative z-[1] mx-auto max-w-2xl px-6 py-24 sm:px-8 sm:py-32"
        }
      >
        {children}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Apply to each listed file**

Mechanical transform, worked example — `src/components/learn/learn-hub.tsx` currently:

```tsx
    <main className="min-h-dvh bg-[#060404] text-white">
      {/* vignette div */}
      <div className="relative z-[1] mx-auto max-w-lg px-4 py-16 sm:px-6 sm:py-24">
        {content}
      </div>
    </main>
```

becomes:

```tsx
    <PageShell>
      {content}
    </PageShell>
```

with `import { PageShell } from "@/components/shared/page-shell";`. Apply the same replacement at every listed location: pages already using `max-w-2xl px-6 py-24` (about, privacy, terms) get `<PageShell width="wide">`; the rest use the default. Where a page's `<main>` wraps a component that itself provides the inner container (`reading-plan.tsx:98`, `track-committed.tsx:44` render their own `max-w-lg` div), replace only the outer `<main>` + vignette with `<PageShell>` **minus** its inner column — in those two cases keep the page's own inner div and use this variant: pass the content directly and delete the duplicated column div from the child component so the column lives in exactly one place. Verify each page visually in Task 10.

- [ ] **Step 3: Test + build**

Run: `pnpm test && pnpm build 2>&1 | tail -5`
Expected: green.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: shared PageShell wrapper for all content pages"
```

---

### Task 10: End-to-end walkthrough + copy review gate

**Files:** none created in repo (screenshots go to the session scratchpad, not the repo root)

**Interfaces:**
- Consumes: everything above
- Produces: verified product; the launch-confidence evidence.

- [ ] **Step 1: Full check**

Run: `pnpm lint && pnpm test && pnpm build`
Expected: all green.

- [ ] **Step 2: Start dev server**

Run: `pnpm dev` (background)

- [ ] **Step 3: Drive the five arcs with Playwright MCP (clear localStorage between arcs)**

1. **Committed arc:** `/en` → CTA → complete all 8 questions → verdict → grace → "I will repent and trust in Christ" → next-steps shows trackA → back to `/en` → committed variant (conditional heading + tracker).
2. **Thinking arc:** full test → "I want to think about it" → next-steps shows trackB → `/en` shows thinking variant → click "I have repented and trusted in Christ" → variant flips to committed in place.
3. **Dismissed arc:** full test → "Not for me" → `/en` shows dismissed variant ("door stays open" + ghost retake) → `/en/next-steps` redirects home.
4. **Undecided arc:** full test → close at invitation (navigate away without answering) → `/en` shows undecided variant → CTA returns to test and resume dialog restores the session.
5. **Chrome + reset arc:** TopBar + Footer present on `/en`, `/en/learn`, `/en/learn/who-is-jesus`, `/en/reading-plan`, `/en/about`, `/en/next-steps` (when reachable); absent on `/en/test` (death strip present there instead). Retake from committed homepage → journey resets, reading progress (mark day 1 first) survives.

Screenshot each variant + one content page to the scratchpad directory. Check browser console for hydration warnings on `/en` with a populated journey record — expected: none.

- [ ] **Step 4: Legacy migration spot-check**

In the browser console on `/en`: `localStorage.clear(); localStorage.setItem("test_completed", "1"); location.reload()` → homepage shows **undecided** variant, and `localStorage.getItem("test_completed")` is `null` while `gospel-journey` exists.

- [ ] **Step 5: PT copy review gate**

Present all new PT strings (Task 6 Step 3 plus any next-steps copy edits) to the owner for native-speaker review. Apply corrections, re-run `pnpm test`, commit any copy fixes:

```bash
git add src/messages/pt.json src/messages/en.json
git commit -m "copy: PT review pass on journey-stage strings"
```

- [ ] **Step 6: Final commit if anything shifted during E2E fixes**

```bash
git status  # should be clean; commit stragglers with a descriptive message
```

---

## Self-review notes

- Spec coverage: state layer (T3-5), invitation persistence + writers (T5), five-stage homepage (T6), rename (T2), chrome (T7), next-steps rewiring (T8), container sweep (T9), tests (T3 + updated T2), E2E (T10), housekeeping (T1), analytics stage (T6), PT review (T10). LW copy constraints in Global Constraints.
- Deviations from spec are listed up top and must be relayed to the owner before execution.
- Type consistency: `JourneySnapshot.ready` used by home-shell (T6) and next-steps client (T8); `computeJourneySnapshot` used by topic-nav (T5); `TrackCommitted` produced in T2, consumed in T8.
