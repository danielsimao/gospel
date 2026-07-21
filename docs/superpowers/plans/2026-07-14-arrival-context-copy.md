# Arrival-Context Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Next-steps track openers stop replying to statements the visitor didn't just make: within 1 hour of the invitation response the conversational openers stay ("That's honest." / "Something just changed."); after that, durable openers render. Two other temporal words ("today", "just") become context-free.

**Architecture:** The journey record already stores `respondedAt`. Each track component reads it post-mount (two-phase, rAF-deferred — house pattern) and picks fresh vs. return copy; SSR/first render shows the durable (return) variant, so cold arrivals never flash the wrong register (fresh arrivals may upgrade within a frame — imperceptible). Two new message keys per locale.

**Tech Stack:** Next.js 16.2.1, React 19, TypeScript, pnpm, Vitest.

## Global Constraints

- **Living Waters register:** conditional assurance only — the return opener for the committed track must not declare salvation ("The decision is made" ✓, "You are saved" ✗). Urgency rules from commit 63a54d8 stay intact.
- Two-phase localStorage reads only (no useState-initializer reads — hydration rule; exemplar: `src/components/game-shell.tsx` ResumeDialog rAF pattern, and note `react-hooks/set-state-in-effect` lint).
- Bilingual parity (EN+PT), European Portuguese tu-form, surgical JSON edits + `python3 json.load` validation, PT flagged for owner gate.
- Gates: `pnpm lint && pnpm test && npx tsc --noEmit && pnpm build` all green before commit.
- Commit trailers:
  `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
  `Claude-Session: https://claude.ai/code/session_01GCuFmndcCWD1FAQbeLHCxx`

---

### Task 1: Fresh/return openers + temporal-word fixes

**Files:**
- Modify: `src/lib/journey-storage.ts` (tiny helper, if `respondedAt` isn't already trivially readable — check first: `readJourney()` is exported and pure; if so NO change here, components use it directly)
- Modify: `src/components/next-steps/track-committed.tsx`
- Modify: `src/components/next-steps/track-thinking.tsx`
- Modify: `src/messages/en.json`, `src/messages/pt.json`
- Modify: `src/lib/types.ts` IF the nextSteps track messages are typed there (grep `welcome` / `acknowledgment` in types.ts; the components may carry their own interfaces — find where and extend there)

**Interfaces:**
- Consumes: `readJourney()` from `@/lib/journey-storage` — verify its return shape includes `respondedAt: number | null` (read the file; adapt to the real field name).
- Produces: message keys `nextSteps.trackA.welcomeReturn`, `nextSteps.trackB.acknowledgmentReturn` (both locales).

- [ ] **Step 1: Recon** — read `src/lib/journey-storage.ts` (confirm `respondedAt` field name on the record), `track-committed.tsx` and `track-thinking.tsx` (find where `welcome` / `acknowledgment` render and what the messages interface is named), and the exemplar rAF pattern in `game-shell.tsx`.

- [ ] **Step 2: Message keys (surgical, both locales)**

EN — in `nextSteps.trackA` directly after `"welcome"`:
```json
      "welcomeReturn": "The decision is made. This is how it takes root.",
```
EN — in `nextSteps.trackB` directly after `"acknowledgment"`:
```json
      "acknowledgmentReturn": "Still thinking it through — good. These are worth weighing.",
```
PT — same positions:
```json
      "welcomeReturn": "A decisão está tomada. É assim que ela cria raízes.",
```
```json
      "acknowledgmentReturn": "Ainda a pensar nisso — ainda bem. Isto vale a pena pesar.",
```

- [ ] **Step 3: Temporal-word fixes (surgical, both locales)**

EN `nextSteps.trackB.reflections[0]`:
`"If what you heard today is true, what would that change for you?"` → `"If what you heard is true, what would that change for you?"`
PT equivalent: drop the same "hoje" (read the PT string first, keep the rest verbatim).

EN `nextSteps.trackA.shareMessage`:
`"I just made a decision that changes everything:"` → `"I made a decision that changes everything:"`
PT equivalent: drop the "acabei de" / "agora" construction if present — read it first; result must mean "I made a decision that changes everything:".

- [ ] **Step 4: Fresh/return logic in both track components**

Shared shape (adapt names to each file's conventions). One hour window:

```tsx
const FRESH_WINDOW_MS = 60 * 60 * 1000;
```

In each component (client components — verify "use client" present):

```tsx
  // SSR and first client render show the durable opener; if the visitor
  // arrived within an hour of responding, upgrade to the conversational
  // one post-mount (rAF-deferred — the repo lints synchronous setState
  // in effects). Cold returns never flash the wrong register.
  const [isFresh, setIsFresh] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const respondedAt = readJourney().respondedAt;
      setIsFresh(
        typeof respondedAt === "number" && Date.now() - respondedAt < FRESH_WINDOW_MS,
      );
    });
    return () => cancelAnimationFrame(id);
  }, []);
```

Render site: `track-committed.tsx` heading uses `messages.welcome` → `{isFresh ? messages.welcome : messages.welcomeReturn}`. `track-thinking.tsx` same with `acknowledgment` / `acknowledgmentReturn`. Extend each component's messages interface with the new key. Import `readJourney` from `@/lib/journey-storage`. If the real field name differs from `respondedAt`, use the real one.

- [ ] **Step 5: Gates** — all green (message-parity tests must pass with the new keys).

- [ ] **Step 6: Runtime verify (Playwright, pnpm build + start on :3000)**
  1. Committed record with `respondedAt: Date.now()` in localStorage → `/en/next-steps` shows "Something just changed."
  2. Same record with `respondedAt: Date.now() - 2*60*60*1000` (2h ago) → shows "The decision is made. This is how it takes root."
  3. Thinking record fresh → "That's honest…"; 2h old → "Still thinking it through — good…".
  4. No hydration warnings/console errors in any scenario. Kill server.

- [ ] **Step 7: Commit**

```bash
git add src/components/next-steps/track-committed.tsx src/components/next-steps/track-thinking.tsx src/messages/en.json src/messages/pt.json
# plus types file if touched
git commit -m "fix: next-steps openers match how you arrived

'That's honest.' and 'Something just changed.' were written as the next
beat of the invitation conversation — but the page now has many doors
(What now?, footer, sticky bar, reading-plan bridge) and return visits
days later, where replying to an utterance nobody just made reads
broken. Within an hour of responding the conversational openers stay;
after that, durable ones render (respondedAt check, two-phase read).
Also de-temporalized 'what you heard today' and 'I just made a
decision' — both outlive their moment.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GCuFmndcCWD1FAQbeLHCxx"
```

---

### Task 2: Ship + verify

- [ ] Push; wait Ready; prod smoke `/en/next-steps` redirects visitors home (unchanged) — full behavior trusted from Task 1 runtime.
