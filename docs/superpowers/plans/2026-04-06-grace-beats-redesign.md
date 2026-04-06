# Grace Beats Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static "But God..." grace section with 4 tap-to-reveal beats that stack visually, and forward mini quiz answers to /test via localStorage.

**Architecture:** The grace-reveal component is rewritten as a beat-based reveal with IntersectionObserver for entry + click handler for beat progression. A thin `quiz-storage.ts` lib provides read/write to localStorage for cross-page quiz state. The /test page's GameProvider reads pre-answered state on mount and auto-skips.

**Tech Stack:** React, Framer Motion, localStorage, existing i18n JSON pattern

**Spec:** `docs/superpowers/specs/2026-04-05-grace-beats-redesign.md`

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/quiz-storage.ts` | Create | Read/write `gospel-quiz-answers` in localStorage |
| `src/components/eternity/grace-reveal.tsx` | Rewrite | Beat-based tap-to-reveal component |
| `src/components/eternity/law-quiz.tsx` | Modify | Write answers to localStorage via quiz-storage |
| `src/components/eternity/eternity-shell.tsx` | Modify | Update GraceMessages type, remove testCta from CTA section |
| `src/components/game-provider.tsx` | Modify | Read localStorage on mount, pre-fill state |
| `src/lib/game-reducer.ts` | Modify | Add HYDRATE_ANSWERS action |
| `src/lib/types.ts` | Modify | Add HYDRATE_ANSWERS to GameAction union |
| `src/lib/eternity-analytics.ts` | Modify | Add trackGraceBeatRevealed, trackGraceCtaClicked |
| `src/messages/en.json` | Modify | Restructure eternity.grace keys, add beats |
| `src/messages/pt.json` | Modify | Same |

---

### Task 1: Quiz Storage Lib

**Files:**
- Create: `src/lib/quiz-storage.ts`

- [ ] **Step 1: Create quiz-storage.ts**

```ts
// src/lib/quiz-storage.ts
const STORAGE_KEY = "gospel-quiz-answers";

/**
 * Mini quiz question index → /test question ID mapping.
 * Mini quiz Q0 = "lied?" → test Q1, Q1 = "stolen?" → test Q2, Q2 = "blasphemy?" → test Q5
 */
const MINI_QUIZ_TO_TEST_ID = [1, 2, 5] as const;

export type StoredAnswers = Record<string, "yes" | "no" | "honest" | "justify">;

export function readQuizAnswers(): StoredAnswers {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as StoredAnswers;
  } catch {
    return {};
  }
}

export function writeQuizAnswer(miniQuizIndex: number, answer: "yes" | "no"): void {
  const testId = MINI_QUIZ_TO_TEST_ID[miniQuizIndex];
  if (testId === undefined) return;
  try {
    const current = readQuizAnswers();
    // Map mini quiz "yes" → test "honest", "no" → "justify"
    current[String(testId)] = answer === "yes" ? "honest" : "justify";
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // localStorage unavailable (SSR, private browsing) — silently skip
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/quiz-storage.ts
git commit -m "feat: add quiz-storage lib for cross-page answer forwarding"
```

---

### Task 2: Analytics Functions

**Files:**
- Modify: `src/lib/eternity-analytics.ts`

- [ ] **Step 1: Add two new tracking functions at the end of the file**

Add after `trackScrollDepth`:

```ts
export function trackGraceBeatRevealed(beatIndex: number) {
  safeCapture("eternity_grace_beat_revealed", { beat_index: beatIndex });
}

export function trackGraceCtaClicked() {
  safeCapture("eternity_grace_cta_clicked");
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/eternity-analytics.ts
git commit -m "feat: add grace beat analytics events"
```

---

### Task 3: Update i18n Messages (EN + PT)

**Files:**
- Modify: `src/messages/en.json` (lines 191-197)
- Modify: `src/messages/pt.json` (lines 191-197)

- [ ] **Step 1: Replace eternity.grace in en.json**

Replace the `"grace": { ... }` block at line 191 with:

```json
"grace": {
  "heading": "But God…",
  "beats": [
    "You're guilty. The fine is eternal.",
    "Someone paid it in full.",
    "Jesus Christ — God in flesh — lived the life you couldn't, died the death you deserved, and rose.",
    "Turn from sin. Trust in Him. Live."
  ],
  "tapContinue": "Tap to continue",
  "scripture": "But God demonstrates His own love for us in this: While we were still sinners, Christ died for us.",
  "scriptureRef": "Romans 5:8",
  "testCta": "Take the test"
}
```

- [ ] **Step 2: Replace eternity.grace in pt.json**

Replace the `"grace": { ... }` block at line 191 with:

```json
"grace": {
  "heading": "Mas Deus…",
  "beats": [
    "És culpado. A multa é eterna.",
    "Alguém a pagou na totalidade.",
    "Jesus Cristo — Deus em carne — viveu a vida que não conseguiste, morreu a morte que merecias, e ressuscitou.",
    "Abandona o pecado. Confia n'Ele. Vive."
  ],
  "tapContinue": "Toca para continuar",
  "scripture": "Mas Deus prova o seu amor para connosco, em que Cristo morreu por nós, sendo nós ainda pecadores.",
  "scriptureRef": "Romanos 5:8 (ACF)",
  "testCta": "Faz o teste"
}
```

- [ ] **Step 3: Commit**

```bash
git add src/messages/en.json src/messages/pt.json
git commit -m "feat: restructure eternity.grace i18n for beat-based reveal"
```

---

### Task 4: Rewrite grace-reveal.tsx

**Files:**
- Rewrite: `src/components/eternity/grace-reveal.tsx`

- [ ] **Step 1: Rewrite the full component**

```tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  trackGraceRevealed,
  trackGraceBeatRevealed,
  trackGraceCtaClicked,
} from "@/lib/eternity-analytics";
import type { Locale } from "@/lib/i18n";

export interface GraceMessages {
  heading: string;
  beats: string[];
  tapContinue: string;
  scripture: string;
  scriptureRef: string;
  testCta: string;
}

interface GraceRevealProps {
  messages: GraceMessages;
  locale: Locale;
}

export function GraceReveal({ messages, locale }: GraceRevealProps) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [entryRevealed, setEntryRevealed] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const totalBeats = messages.beats.length;
  const allRevealed = revealedCount >= totalBeats;

  // Reveal heading + beat 0 on scroll into view
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEntryRevealed(true);
          setRevealedCount(1);
          trackGraceRevealed();
          trackGraceBeatRevealed(0);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleTapContinue = useCallback(() => {
    if (revealedCount >= totalBeats) return;
    const nextBeat = revealedCount;
    trackGraceBeatRevealed(nextBeat);
    setRevealedCount(nextBeat + 1);
  }, [revealedCount, totalBeats]);

  return (
    <div ref={sectionRef} className="relative w-full max-w-xs text-center sm:max-w-md">
      {/* Warm atmospheric glow */}
      <div
        className="pointer-events-none absolute -inset-32 -z-10 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(212,168,67,0.06) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Heading */}
      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        animate={entryRevealed ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="text-4xl font-bold tracking-tight text-[#D4A843] sm:text-5xl"
        style={{ textShadow: "0 0 60px rgba(212,168,67,0.2)" }}
      >
        {messages.heading}
      </motion.h2>

      {/* Beats */}
      <div className="mt-10 text-left">
        {messages.beats.map((text, i) => {
          const isRevealed = i < revealedCount;
          const isActive = i === revealedCount - 1;
          const isGold = i === 2 || i === 3; // beats III and IV

          if (!isRevealed) return null;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{
                opacity: isActive ? 1 : 0.32,
                y: 0,
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="border-t border-white/[0.04] py-4 first:border-t-0 first:pt-0"
            >
              <p className="mb-2 font-mono text-[8px] uppercase tracking-[2.5px] text-[#D4A843]/45">
                {["I", "II", "III", "IV"][i]}
              </p>
              <p
                className={`text-lg font-semibold leading-snug sm:text-xl ${
                  isGold ? "text-[#D4A843]" : "text-white/95"
                }`}
              >
                {text}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Tap to continue pill */}
      <AnimatePresence>
        {entryRevealed && !allRevealed && (
          <motion.button
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            onClick={handleTapContinue}
            className="mx-auto mt-6 flex items-center justify-center gap-2 rounded-lg border border-[#D4A843]/22 px-6 py-3 font-mono text-[10px] uppercase tracking-[2.5px] text-[#D4A843]/70 transition-all hover:border-[#D4A843]/40 hover:bg-[#D4A843]/[0.05] min-h-[48px]"
            style={{ animation: "eternity-gentle-pulse 2.4s ease-in-out infinite" }}
          >
            {messages.tapContinue} <span aria-hidden="true">↓</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Scripture + CTA — revealed after all beats */}
      <AnimatePresence>
        {allRevealed && (
          <>
            <motion.blockquote
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-8 border-l border-[#D4A843]/30 pl-5 text-left"
            >
              <p className="text-[15px] italic leading-[1.85] text-white/55 sm:text-base">
                &ldquo;{messages.scripture}&rdquo;
              </p>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-[#D4A843]/40">
                {messages.scriptureRef}
              </p>
            </motion.blockquote>

            <motion.a
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              href={`/${locale}/test`}
              onClick={() => trackGraceCtaClicked()}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-[#D4A843]/35 bg-[#D4A843]/[0.04] px-6 py-3.5 text-sm font-semibold tracking-wide text-[#D4A843] shadow-[0_0_24px_rgba(212,168,67,0.08)] transition-all hover:border-[#D4A843]/50 hover:bg-[#D4A843]/[0.08] min-h-[48px]"
            >
              {messages.testCta} <span aria-hidden="true">→</span>
            </motion.a>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm tsc --noEmit 2>&1 | head -30`

Expected: Type errors because `eternity-shell.tsx` still expects old `GraceMessages` — we'll fix that next.

- [ ] **Step 3: Commit**

```bash
git add src/components/eternity/grace-reveal.tsx
git commit -m "feat: rewrite grace-reveal as beat-based tap-to-reveal"
```

---

### Task 5: Update eternity-shell.tsx (GraceMessages + CTA section)

**Files:**
- Modify: `src/components/eternity/eternity-shell.tsx`

- [ ] **Step 1: Add locale prop to GraceReveal**

In `eternity-shell.tsx` line 211, change:

```tsx
<GraceReveal messages={messages.grace} />
```

to:

```tsx
<GraceReveal messages={messages.grace} locale={locale} />
```

- [ ] **Step 2: Remove the testCta link from CTA section**

Remove lines 222-231 (the `<a href={\`/\${locale}/test\`}` block and its wrapper div). Replace with just the resource links. The CTA section becomes:

```tsx
{/* ═══════════════ SECTION 4: CTA ═══════════════ */}
<section
  id="eternity-cta"
  className="flex min-h-[80svh] flex-col items-center justify-center px-4 py-16 sm:px-6 sm:py-24"
>
  <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">{messages.cta.heading}</h2>
  <p className="mt-2 text-xs tracking-wide text-white/40 sm:mt-3 sm:text-sm">{messages.cta.subtitle}</p>

  <div className="mt-6 flex w-full max-w-xs flex-col gap-2 sm:mt-8">
    {messages.cta.resources.map((resource) => (
      <a
        key={resource.url}
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEternityCtaClicked("resource", resource.name)}
        className="rounded border border-white/[0.04] px-4 py-2.5 text-xs tracking-wide text-white/30 transition-colors hover:border-white/[0.08] hover:text-white/50"
      >
        {resource.name} &rarr;
      </a>
    ))}
  </div>

  <ShareButtons messages={messages.share} locale={locale} />
</section>
```

- [ ] **Step 3: Verify it compiles**

Run: `pnpm tsc --noEmit 2>&1 | head -30`

Expected: Clean — no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/eternity/eternity-shell.tsx
git commit -m "feat: wire grace beats + remove duplicate test CTA from section"
```

---

### Task 6: Write Mini Quiz Answers to localStorage

**Files:**
- Modify: `src/components/eternity/law-quiz.tsx` (lines 61-69, handleAnswer)

- [ ] **Step 1: Import writeQuizAnswer**

Add to imports at top of `law-quiz.tsx`:

```ts
import { writeQuizAnswer } from "@/lib/quiz-storage";
```

- [ ] **Step 2: Call writeQuizAnswer in handleAnswer**

In `handleAnswer`, after `setAnswers(newAnswers)` (line 68), add:

```ts
writeQuizAnswer(idx, choice);
```

The full `handleAnswer` becomes:

```ts
const handleAnswer = useCallback(
  (choice: "yes" | "no") => {
    if (startTime.current === null) startTime.current = Date.now();
    const idx = currentIdx;
    trackQuizAnswered(idx, choice);
    const newAnswers = [...answers];
    newAnswers[idx] = choice;
    setAnswers(newAnswers);
    writeQuizAnswer(idx, choice);
  },
  [answers, currentIdx],
);
```

- [ ] **Step 3: Verify it compiles**

Run: `pnpm tsc --noEmit 2>&1 | head -10`

Expected: Clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/eternity/law-quiz.tsx
git commit -m "feat: persist mini quiz answers to localStorage"
```

---

### Task 7: Hydrate /test Quiz State from localStorage

**Files:**
- Modify: `src/lib/types.ts` (GameAction union)
- Modify: `src/lib/game-reducer.ts` (add HYDRATE_ANSWERS case)
- Modify: `src/components/game-provider.tsx` (read localStorage on mount)

- [ ] **Step 1: Add HYDRATE_ANSWERS to GameAction in types.ts**

In `src/lib/types.ts`, add to the `GameAction` union (after the `SET_INVITATION_RESPONSE` line):

```ts
| { type: "HYDRATE_ANSWERS"; answers: Array<{ questionId: number; answer: AnswerType }>; startAt: number };
```

- [ ] **Step 2: Add HYDRATE_ANSWERS case to game-reducer.ts**

Add before the `default:` case in `gameReducer`:

```ts
case "HYDRATE_ANSWERS": {
  if (state.phase !== "landing") return state;

  // Build answers array and compute score
  let score = INITIAL_SCORE;
  const hydratedAnswers = action.answers.map((a) => {
    const config = QUESTION_CONFIGS.find((c) => c.id === a.questionId);
    const drain = config
      ? a.answer === "honest"
        ? config.honestDrain
        : config.justifyDrain
      : 0;
    score = Math.max(0, score - drain);
    return {
      questionId: a.questionId,
      answer: a.answer,
      commandment: config?.commandment ?? "",
      scoreChange: -drain,
      timeOnQuestion: 0,
    };
  });

  // Find first unanswered question index
  const answeredIds = new Set(action.answers.map((a) => a.questionId));
  let startQuestion = 0;
  for (let i = 0; i < QUESTION_CONFIGS.length; i++) {
    if (!answeredIds.has(QUESTION_CONFIGS[i].id)) {
      startQuestion = i;
      break;
    }
    startQuestion = i + 1;
  }

  return {
    ...state,
    phase: "playing",
    score,
    answers: hydratedAnswers,
    currentQuestion: Math.min(startQuestion, TOTAL_QUESTIONS),
    startedAt: Date.now(),
    questionStartedAt: Date.now(),
  };
}
```

- [ ] **Step 3: Read localStorage in GameProvider on mount**

In `src/components/game-provider.tsx`, add imports and a mount effect:

```tsx
"use client";

import { createContext, useContext, useReducer, useEffect, type Dispatch } from "react";
import { gameReducer, initialGameState } from "@/lib/game-reducer";
import type { GameState, GameAction, AnswerType } from "@/lib/types";
import { readQuizAnswers } from "@/lib/quiz-storage";
import { QUESTION_CONFIGS } from "@/lib/questions";

const GameStateContext = createContext<GameState>(initialGameState);
const GameDispatchContext = createContext<Dispatch<GameAction>>(() => {});

export function useGameState() {
  return useContext(GameStateContext);
}

export function useGameDispatch() {
  return useContext(GameDispatchContext);
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);

  useEffect(() => {
    const stored = readQuizAnswers();
    const entries = Object.entries(stored);
    if (entries.length === 0) return;

    // Only hydrate answers for question IDs that exist in QUESTION_CONFIGS
    const validIds = new Set(QUESTION_CONFIGS.map((c) => c.id));
    const answers = entries
      .filter(([id]) => validIds.has(Number(id)))
      .map(([id, answer]) => ({
        questionId: Number(id),
        answer: answer as AnswerType,
      }));

    if (answers.length > 0) {
      dispatch({ type: "HYDRATE_ANSWERS", answers, startAt: Date.now() });
    }
  }, []);

  return (
    <GameStateContext value={state}>
      <GameDispatchContext value={dispatch}>
        {children}
      </GameDispatchContext>
    </GameStateContext>
  );
}
```

- [ ] **Step 4: Verify it compiles**

Run: `pnpm tsc --noEmit 2>&1 | head -30`

Expected: Clean — no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts src/lib/game-reducer.ts src/components/game-provider.tsx
git commit -m "feat: hydrate /test quiz from localStorage (eternity → test forwarding)"
```

---

### Task 8: Verify End-to-End

- [ ] **Step 1: Start dev server**

Run: `pnpm dev`

- [ ] **Step 2: Test grace beats flow**

1. Open `http://localhost:3000/en` in browser
2. Scroll to quiz, answer all 3 questions using Next buttons
3. Click "Is there any hope?" bridge button
4. Verify: grace section shows "But God..." heading + beat I on scroll
5. Tap "Tap to continue" — verify beat II appears, beat I dims
6. Continue tapping through beats III and IV
7. After beat IV: verify scripture + "Take the test →" CTA appear
8. Click CTA — verify navigates to `/en/test`

- [ ] **Step 3: Test quiz state forwarding**

1. On `/en/test`, verify the quiz starts at question 4 (index 3) — the first unanswered question
2. The answered chips at the bottom should show the 3 pre-answered questions
3. Score should reflect the pre-answered drains

- [ ] **Step 4: Test PT locale**

1. Open `http://localhost:3000/pt`
2. Verify beat text is in Portuguese
3. Verify "Toca para continuar" pill label
4. Verify "Faz o teste" CTA text

- [ ] **Step 5: Test clean state (no localStorage)**

1. Clear localStorage in browser dev tools
2. Navigate to `/en/test` directly
3. Verify quiz starts normally at question 1 with no pre-filled answers

- [ ] **Step 6: Commit any fixes from testing**

```bash
git add -A
git commit -m "fix: address issues found during e2e verification"
```
