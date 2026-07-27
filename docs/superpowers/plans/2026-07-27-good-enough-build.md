# "Good Enough" — Build Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An indexed, shareable page at `/[locale]/good-enough` where the reader tries four times to clear a canyon, visibly falls short every time, and is handed Romans 3:23 and the test.

**Architecture:** A pure-function mechanic (`src/lib/good-enough.ts`) with no React, consumed by one client scene component. The page itself is a server component in the `(content)` route group, so it inherits TopBar and Footer — a cold visitor arriving from a shared link needs a way into the rest of the site. Copy lives in `messages/{en,pt}.json` under a new `goodEnough` block.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4, framer-motion (`m` + `LazyMotion`), lucide-react, Vitest, Biome.

**Supersedes** Tasks 1–3 of `2026-07-27-good-enough.md`. That document keeps the research, the illustration rationale, and the grill record — read it for *why*. This one is *how*, and it resolves a contradiction in the original: its decision log said `/[locale]/good-enough` while its Task 2 said `src/app/[locale]/jump/page.tsx`. One vocabulary throughout now: **good-enough**.

---

## Global Constraints

Copied verbatim from `2026-07-27-good-enough.md:100-108`. Every task's requirements implicitly include these.

- **Everyone can press it. Nobody can finish it.** No cursor-dodging: it excludes keyboard, touch and screen-reader users specifically, and this app is mobile-first. A real `<button>`, always enabled, always responding.
- **Bounded at four presses.** An unwinnable button that never stops is a troll. One that yields and explains itself is a parable.
- **Never a ladder, never a progress bar.** The app's own copy rules it out (`learn.topics[am-i-a-good-person]`: *"not a ladder you climb… they're a mirror"*). Distance short of a target, not progress toward one.
- **No claim about the reader's standing.** It says what they did (jumped), not what they are. The verdict screen does that job, having earned it over six questions.
- **The far side is never drawn.** Frame the near edge only; a numeric remaining-distance counter carries the point. 200 ft against 95,040 ft is 0.21% — to scale, no press appears to do anything; not to scale, the reader can see they crossed a third of it and the argument collapses.
- **`prefers-reduced-motion`** — the jump must still *happen*, just without the animated arc. Cut to the landed position.
- **Locale parity**, both files, same commit. PT throughout.
- **Lint at or below 7 warnings.** `npx tsc --noEmit` clean. All tests green.
- **The CTA goes to `/test`, never straight to grace.** The jump is general; the test is personal. Skipping the Law is exactly what the method forbids.

## Naming contract

Locked here so tasks don't drift:

| thing | name |
|---|---|
| route | `/[locale]/good-enough` (in `(content)`) |
| mechanic module | `src/lib/good-enough.ts` |
| components dir | `src/components/good-enough/` |
| message block | `goodEnough` (top level, both locale files) |
| analytics events | `good_enough_viewed`, `good_enough_jumped`, `good_enough_revealed`, `good_enough_cta_clicked` |

## File Structure

| file | responsibility |
|---|---|
| `src/lib/good-enough.ts` | the mechanic — distances, remaining, terminal attempt. No React. |
| `src/__tests__/good-enough.test.ts` | mechanic invariants + locale copy parity |
| `src/components/good-enough/jump-track.tsx` | the near edge, the marker, the remaining-distance readout |
| `src/components/good-enough/reveal.tsx` | the turn — scripture, the argument, the CTA |
| `src/components/good-enough/good-enough-scene.tsx` | client; holds attempt state, wires button → track → reveal |
| `src/app/[locale]/(content)/good-enough/page.tsx` | server; metadata, copy loading |
| `src/app/[locale]/(content)/good-enough/opengraph-image.tsx` | share card |
| `src/lib/types.ts` | `GoodEnoughMessages` interface |
| `src/lib/eternity-analytics.ts` | four new tracking functions |
| `src/messages/{en,pt}.json` | the `goodEnough` block + two `home.alsoHere` keys |
| `src/app/sitemap.ts` | add `/good-enough` to `staticPages` |
| `src/components/home-shell.tsx` | third row in the Also Here band |

---

### Task 1: The mechanic, headless

**Files:**
- Create: `src/lib/good-enough.ts`
- Test: `src/__tests__/good-enough.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `CANYON_FEET`, `MAX_ATTEMPTS`, `type Attempt`, `attemptAt(n)`, `allAttempts()`.

The distances are the argument, so they are the part worth testing. Attempts deliberately **do not accumulate** — each press is a fresh jump from the same edge that goes further than the last. Accumulation would be a progress bar wearing different clothes, and works that bank are exactly the doctrine this page denies.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/good-enough.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  CANYON_FEET,
  MAX_ATTEMPTS,
  attemptAt,
  allAttempts,
} from "@/lib/good-enough";

describe("good-enough mechanic", () => {
  it("spans eighteen miles", () => {
    expect(CANYON_FEET).toBe(18 * 5280);
  });

  it("bounds the reader at four attempts", () => {
    expect(MAX_ATTEMPTS).toBe(4);
    expect(allAttempts()).toHaveLength(4);
  });

  it("jumps strictly further every attempt", () => {
    const feet = allAttempts().map((a) => a.feet);
    for (let i = 1; i < feet.length; i++) {
      expect(feet[i]!).toBeGreaterThan(feet[i - 1]!);
    }
  });

  it("never reaches the far side, not even on the best attempt", () => {
    for (const a of allAttempts()) {
      expect(a.remainingFeet).toBeGreaterThan(0);
      expect(a.remainingFeet).toBe(CANYON_FEET - a.feet);
    }
    // The best attempt clears well under 1% — the reader must never be able to
    // read the display as "nearly there".
    const best = allAttempts()[MAX_ATTEMPTS - 1]!;
    expect(best.feet / CANYON_FEET).toBeLessThan(0.01);
  });

  it("marks only the last attempt terminal", () => {
    const attempts = allAttempts();
    expect(attempts.filter((a) => a.terminal)).toHaveLength(1);
    expect(attempts[MAX_ATTEMPTS - 1]!.terminal).toBe(true);
  });

  it("includes a world record among the attempts, because comparison is the trap", () => {
    // 50 ft is the standing long-jump-with-pole reference the illustration uses.
    expect(allAttempts().map((a) => a.feet)).toContain(50);
  });

  it("clamps out-of-range attempt numbers instead of returning undefined", () => {
    expect(attemptAt(0)).toEqual(attemptAt(1));
    expect(attemptAt(-5)).toEqual(attemptAt(1));
    expect(attemptAt(99)).toEqual(attemptAt(MAX_ATTEMPTS));
    expect(attemptAt(2.7)).toEqual(attemptAt(2));
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm vitest run src/__tests__/good-enough.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/good-enough"`.

- [ ] **Step 3: Implement the mechanic**

Create `src/lib/good-enough.ts`:

```ts
/**
 * The canyon, in feet. Eighteen miles — the figure the illustration uses, and
 * the reason the far side is never drawn: the best attempt on this page clears
 * 0.21% of it, so any honest drawing shows nothing moving at all.
 */
export const CANYON_FEET = 18 * 5280;

/**
 * An unwinnable button that never stops is a troll; one that yields and
 * explains itself is a parable. Four presses, then the reveal.
 */
export const MAX_ATTEMPTS = 4;

export interface Attempt {
  /** 1-based, matching the copy array index + 1. */
  n: number;
  /**
   * How far THIS jump went. Attempts do not accumulate — each press is a fresh
   * jump from the same edge with more help than the last. Accumulating would
   * make this a progress bar, which the app's own copy forbids, and would
   * teach that works bank.
   */
  feet: number;
  /** Feet still short of the far side. Never zero, never negative. */
  remainingFeet: number;
  /** True on the final attempt — the reveal follows it. */
  terminal: boolean;
}

/**
 * Bare jump, a run-up, a pole vault (a world record), rocket boots. The props
 * escalate because the argument is that effort is real and is not the issue —
 * a button that merely refuses to be pressed says "you are being toyed with".
 */
const JUMP_FEET = [4, 20, 50, 200] as const;

/** Clamped and floored, so a bad index can never produce `undefined`. */
export function attemptAt(n: number): Attempt {
  const index = Math.min(MAX_ATTEMPTS - 1, Math.max(0, Math.floor(n) - 1));
  const feet = JUMP_FEET[index]!;
  return {
    n: index + 1,
    feet,
    remainingFeet: CANYON_FEET - feet,
    terminal: index === MAX_ATTEMPTS - 1,
  };
}

export function allAttempts(): Attempt[] {
  return JUMP_FEET.map((_, i) => attemptAt(i + 1));
}
```

- [ ] **Step 4: Run the tests**

Run: `pnpm vitest run src/__tests__/good-enough.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/good-enough.ts src/__tests__/good-enough.test.ts
git commit -m "feat(good-enough): the jump mechanic, headless"
```

---

### Task 2: Copy, types, and locale parity

**Files:**
- Modify: `src/messages/en.json`, `src/messages/pt.json`, `src/lib/types.ts`
- Test: `src/__tests__/good-enough.test.ts` (append)

**Interfaces:**
- Consumes: `MAX_ATTEMPTS` from Task 1.
- Produces: `GoodEnoughMessages` interface; `goodEnough` block in both locale files.

> **OWNER-GATED.** The EN reveal copy and the whole PT block are drafts. Per this project's standing rule, doctrinal and PT copy needs owner approval before merge. Build against these strings; do not ship them without sign-off. The prop names especially need PT that stays *funny* rather than literal.

- [ ] **Step 1: Add the interface**

In `src/lib/types.ts`, after `HomeMessages`:

```ts
export interface GoodEnoughMessages {
  title: string;
  metaDescription: string;
  eyebrow: string;
  /** The setup. Sets a goal the reader will not reach, without promising they will. */
  prompt: string;
  buttonLabel: string;
  /** Label from attempt 2 onward — the reader is trying again with more help. */
  buttonLabelAgain: string;
  /**
   * One entry per attempt, MAX_ATTEMPTS long. `help` names the prop given for
   * that jump ("" on the first, which is bare); `reaction` is what lands after.
   */
  attempts: Array<{ help: string; reaction: string }>;
  /** Suffix on the distance readout, e.g. "still short". */
  remainingLabel: string;
  /** Unit word for the readout, already plural — distances here are never 1. */
  feetLabel: string;
  reveal: {
    lead: string;
    scripture: string;
    scriptureRef: string;
    /** The turn from the general case to the reader's own. */
    turn: string;
    cta: string;
  };
}
```

Add to the `Messages` interface — note it is **optional**, matching how `nextSteps` is declared, so a locale file mid-edit does not break the whole app:

```ts
  goodEnough?: GoodEnoughMessages;
```

- [ ] **Step 2: Add the EN block**

In `src/messages/en.json`, as a new top-level key after `findChurch`:

```json
"goodEnough": {
  "title": "Good enough?",
  "metaDescription": "Everyone jumps further than someone. The canyon is eighteen miles wide. Four attempts, and what they show.",
  "eyebrow": "One jump",
  "prompt": "The other side is where you want to end up. Go on, then.",
  "buttonLabel": "Jump",
  "buttonLabelAgain": "Jump again",
  "attempts": [
    { "help": "", "reaction": "Four feet. Not bad, standing." },
    { "help": "a run-up", "reaction": "Twenty feet, with a run-up. Better than most people manage." },
    { "help": "a pole vault", "reaction": "Fifty feet. That is a world record. Nobody alive jumps further." },
    { "help": "rocket boots", "reaction": "Two hundred feet, on rocket boots. Further than any human has ever gone." }
  ],
  "remainingLabel": "still short",
  "feetLabel": "feet",
  "reveal": {
    "lead": "Fifty feet is a world record — no living person jumps further. You went four times that, wearing rockets. The gap is eighteen miles. Nobody is arguing you didn't clear more than the person beside you; that was never the question.",
    "scripture": "For all have sinned and fall short of the glory of God.",
    "scriptureRef": "Romans 3:23",
    "turn": "That is everyone, in general. There is a version of this that is about you specifically, and it takes six questions.",
    "cta": "Take the test"
  }
}
```

- [ ] **Step 3: Add the PT block — DRAFT, owner-gated**

In `src/messages/pt.json`, same position:

```json
"goodEnough": {
  "title": "Suficientemente bom?",
  "metaDescription": "Toda a gente salta mais do que alguém. O desfiladeiro tem vinte e nove quilómetros. Quatro tentativas, e o que elas mostram.",
  "eyebrow": "Um salto",
  "prompt": "O outro lado é onde queres acabar. Então força.",
  "buttonLabel": "Saltar",
  "buttonLabelAgain": "Saltar outra vez",
  "attempts": [
    { "help": "", "reaction": "Um metro e vinte. Nada mau, parado." },
    { "help": "balanço", "reaction": "Seis metros, com balanço. Melhor do que a maioria consegue." },
    { "help": "vara de salto", "reaction": "Quinze metros. Isso é um recorde mundial. Ninguém vivo salta mais." },
    { "help": "botas a jato", "reaction": "Sessenta metros, de botas a jato. Mais longe do que qualquer humano alguma vez foi." }
  ],
  "remainingLabel": "ainda em falta",
  "feetLabel": "metros",
  "reveal": {
    "lead": "Quinze metros é um recorde mundial — ninguém vivo salta mais. Tu foste quatro vezes isso, de foguetes nos pés. A distância é de vinte e nove quilómetros. Ninguém está a discutir que saltaste mais do que a pessoa ao teu lado; nunca foi essa a questão.",
    "scripture": "Porque todos pecaram e destituídos estão da glória de Deus.",
    "scriptureRef": "Romanos 3:23",
    "turn": "Isso é toda a gente, em geral. Há uma versão disto que é sobre ti especificamente, e leva seis perguntas.",
    "cta": "Fazer o teste"
  }
}
```

> **Unit problem, flagged for the owner.** PT uses metres, so the numbers cannot be the same strings. The mechanic stores feet; the PT copy above states metric equivalents in prose, and the numeric readout must convert. Decide with the owner: convert the readout to metres for PT (29,000 m), or keep feet in both. Task 3 Step 4 implements conversion; if the owner picks feet-everywhere, delete that branch.

- [ ] **Step 4: Append the parity test**

To `src/__tests__/good-enough.test.ts`:

```ts
import en from "../messages/en.json";
import pt from "../messages/pt.json";

describe("good-enough copy", () => {
  it.each([["en", en], ["pt", pt]] as const)(
    "%s has a complete goodEnough block",
    (_locale, messages) => {
      const g = (messages as { goodEnough?: Record<string, unknown> }).goodEnough;
      expect(g).toBeDefined();
      for (const key of ["title", "metaDescription", "eyebrow", "prompt", "buttonLabel", "buttonLabelAgain", "remainingLabel", "feetLabel"]) {
        expect(typeof g![key]).toBe("string");
        expect(g![key]).not.toBe("");
      }
      const reveal = g!.reveal as Record<string, string>;
      for (const key of ["lead", "scripture", "scriptureRef", "turn", "cta"]) {
        expect(typeof reveal[key]).toBe("string");
        expect(reveal[key]).not.toBe("");
      }
    },
  );

  it.each([["en", en], ["pt", pt]] as const)(
    "%s has exactly one copy entry per attempt",
    (_locale, messages) => {
      const attempts = (messages as { goodEnough: { attempts: Array<{ help: string; reaction: string }> } })
        .goodEnough.attempts;
      expect(attempts).toHaveLength(MAX_ATTEMPTS);
      for (const a of attempts) {
        // `help` is intentionally "" on the bare first jump; `reaction` never is.
        expect(typeof a.help).toBe("string");
        expect(a.reaction.length).toBeGreaterThan(0);
      }
    },
  );
});
```

- [ ] **Step 5: Run and commit**

Run: `pnpm vitest run src/__tests__/good-enough.test.ts && npx tsc --noEmit`
Expected: PASS, 9 tests; tsc clean.

```bash
git add src/lib/types.ts src/messages/en.json src/messages/pt.json src/__tests__/good-enough.test.ts
git commit -m "feat(good-enough): copy in both locales, typed and parity-tested"
```

---

### Task 3: The scene

**Files:**
- Create: `src/components/good-enough/jump-track.tsx`, `src/components/good-enough/reveal.tsx`, `src/components/good-enough/good-enough-scene.tsx`
- Modify: `src/lib/eternity-analytics.ts`

**Interfaces:**
- Consumes: `attemptAt`, `MAX_ATTEMPTS`, `CANYON_FEET` (Task 1); `GoodEnoughMessages` (Task 2).
- Produces: `<GoodEnoughScene copy={...} locale={...} />`.

- [ ] **Step 1: Add the analytics functions**

Append to `src/lib/eternity-analytics.ts`:

```ts
/** The shareable Romans 3:23 page. The interesting number is how many press all four times versus bounce at one. */
export function trackGoodEnoughViewed(locale: string) {
  safeCapture("good_enough_viewed", { locale });
}

export function trackGoodEnoughJumped(attempt: number, locale: string) {
  safeCapture("good_enough_jumped", { attempt, locale });
}

export function trackGoodEnoughRevealed(locale: string) {
  safeCapture("good_enough_revealed", { locale });
}

export function trackGoodEnoughCtaClicked(locale: string) {
  safeCapture("good_enough_cta_clicked", { locale, destination: "test" });
}
```

- [ ] **Step 2: Build the track**

Create `src/components/good-enough/jump-track.tsx`:

```tsx
"use client";

import { m, useReducedMotion } from "framer-motion";
import { EASE_OUT_STRONG } from "@/lib/motion";
import type { Locale } from "@/lib/i18n";

/**
 * The near edge, the reader's marker, and the remaining distance.
 *
 * The far side is deliberately not rendered, and neither is anything the
 * marker's position could be read as a fraction OF. An earlier draft placed the
 * marker at a percentage inside a bounded box, which is the same mistake as
 * drawing the far side: a percentage implies a 100%, and the reader can then
 * see themselves most of the way across. So travel is a fixed pixel offset per
 * attempt inside a frame that fades out on the right — real, felt movement,
 * with no denominator anywhere on screen. The number underneath is the only
 * thing that reports scale, and it tells the truth.
 */
const OFFSET_PX = [8, 22, 40, 74] as const;

export function JumpTrack({
  attemptIndex,
  remainingFeet,
  remainingLabel,
  feetLabel,
  locale,
}: {
  /** 0-based; -1 before the first press. */
  attemptIndex: number;
  remainingFeet: number;
  remainingLabel: string;
  feetLabel: string;
  locale: Locale;
}) {
  // The jump IS the interaction, so it must still happen under reduced motion —
  // it simply arrives without the arc. Setting the offset via style rather than
  // trusting `animate` to snap means a suppressed transform can never leave the
  // marker stranded at the edge.
  const reduced = useReducedMotion();
  const x = attemptIndex >= 0 ? OFFSET_PX[attemptIndex]! : 0;

  return (
    <div className="w-full max-w-sm">
      {/* The mask is load-bearing: it says "this continues" without drawing
          where it continues to. */}
      <div className="relative h-24 [mask-image:linear-gradient(to_right,black_70%,transparent_100%)]">
        <div className="absolute bottom-0 left-0 h-10 w-16 rounded-r-sm border-r border-white/20 bg-white/[0.06]" />
        <m.div
          className="absolute bottom-10 left-12 size-2.5 rounded-full bg-red-500"
          animate={reduced ? undefined : { x }}
          style={reduced ? { transform: `translateX(${x}px)` } : undefined}
          transition={{ duration: 0.55, ease: EASE_OUT_STRONG }}
          aria-hidden="true"
        />
        {/* Nothing below the edge. The drop is the point. */}
        <div className="absolute bottom-0 left-16 right-0 h-px bg-gradient-to-r from-white/15 to-transparent" />
      </div>

      {/* Explicit locale: a bare toLocaleString() formats with the runtime's
          locale, not the page's, so a PT reader could get English separators —
          and server and client could disagree. */}
      <p className="mt-4 text-center font-mono text-[11px] uppercase tracking-[2px] text-white/50">
        <span className="tabular-nums text-red-400/85">
          {remainingFeet.toLocaleString(locale === "pt" ? "pt-PT" : "en-US")}
        </span>{" "}
        {feetLabel} {remainingLabel}
      </p>
    </div>
  );
}
```

Note what is **not** here: no `sr-only` duplicate of the readout. The visible paragraph is already readable text; a parallel hidden copy makes a screen reader say everything twice. The announcement job belongs to the reaction line in Task 3 Step 4, which carries `aria-live="polite"`.

- [ ] **Step 3: Build the reveal**

Create `src/components/good-enough/reveal.tsx`:

```tsx
"use client";

import Link from "next/link";
import { m } from "framer-motion";
import { Button, ButtonArrow } from "@/components/ui/button";
import { EASE_OUT_STRONG } from "@/lib/motion";
import type { GoodEnoughMessages } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

/**
 * The turn. Everything before this is setup, so if this paragraph is weak the
 * page is a gag with no gospel in it.
 *
 * The CTA goes to /test, never to grace: the jump is the general case and the
 * test is the personal one, and the method forbids skipping the Law. The `turn`
 * line says that out loud rather than leaving the reader to infer it.
 */
export function Reveal({
  copy,
  locale,
  onCtaClick,
}: {
  copy: GoodEnoughMessages["reveal"];
  locale: Locale;
  onCtaClick: () => void;
}) {
  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE_OUT_STRONG }}
      className="mt-10 w-full max-w-md text-left"
    >
      <p className="text-[15px] leading-relaxed text-white/80">{copy.lead}</p>

      <blockquote className="mt-6 border-l border-red-500/30 pl-4">
        <p className="text-sm italic leading-[1.8] text-white/65 sm:text-[15px]">
          &ldquo;{copy.scripture}&rdquo;
        </p>
        <cite className="mt-2 block font-mono text-[10px] uppercase not-italic tracking-[2px] text-red-400/75">
          {copy.scriptureRef}
        </cite>
      </blockquote>

      <p className="mt-6 text-[15px] leading-relaxed text-white/80">{copy.turn}</p>

      <div className="mt-8">
        <Button variant="gold" mist asChild>
          <Link href={`/${locale}/test`} onClick={onCtaClick}>
            {copy.cta}
            <ButtonArrow />
          </Link>
        </Button>
      </div>
    </m.div>
  );
}
```

> **`Button` has no `asChild`** — confirmed at `src/components/ui/button.tsx:80`, it is a `forwardRef<HTMLButtonElement>` rendering a real `<button>`. Use `onClick` + `router.push`, which is what `grace-screen.tsx:125` and `first-question.tsx:77` already do:
>
> ```tsx
> const router = useRouter();
> // ...
> <Button variant="gold" mist onClick={() => { onCtaClick(); router.push(`/${locale}/test`); }}>
>   {copy.cta}
>   <ButtonArrow />
> </Button>
> ```
>
> Drop the `Link` import; keep `ButtonArrow`.

- [ ] **Step 4: Build the scene**

Create `src/components/good-enough/good-enough-scene.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { JumpTrack } from "./jump-track";
import { Reveal } from "./reveal";
import { attemptAt, CANYON_FEET, type Attempt } from "@/lib/good-enough";
import { EASE_OUT_STRONG } from "@/lib/motion";
import {
  trackGoodEnoughViewed,
  trackGoodEnoughJumped,
  trackGoodEnoughRevealed,
  trackGoodEnoughCtaClicked,
} from "@/lib/eternity-analytics";
import type { GoodEnoughMessages } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

export function GoodEnoughScene({
  copy,
  locale,
}: {
  copy: GoodEnoughMessages;
  locale: Locale;
}) {
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const viewedRef = useRef(false);
  const revealedRef = useRef(false);

  useEffect(() => {
    if (viewedRef.current) return;
    viewedRef.current = true;
    trackGoodEnoughViewed(locale);
  }, [locale]);

  const done = attempt?.terminal === true;

  useEffect(() => {
    if (!done || revealedRef.current) return;
    revealedRef.current = true;
    trackGoodEnoughRevealed(locale);
  }, [done, locale]);

  function jump() {
    if (done) return;
    const next = attemptAt((attempt?.n ?? 0) + 1);
    setAttempt(next);
    trackGoodEnoughJumped(next.n, locale);
  }

  const line = attempt ? copy.attempts[attempt.n - 1] : null;

  return (
    <div className="flex w-full flex-col items-center">
      <p className="max-w-sm text-center text-[15px] leading-relaxed text-white/70">
        {copy.prompt}
      </p>

      {/* Before the first press the readout shows the WHOLE canyon, not zero.
          Zero reads as "you made it", and stating the gap up front is the
          honest framing anyway: this page is impossible by construction and
          visibly so, never impossible by difficulty. Knowing the number makes
          rocket boots funnier, not less funny. */}
      <div className="mt-8 w-full">
        <JumpTrack
          attemptIndex={attempt ? attempt.n - 1 : -1}
          remainingFeet={attempt?.remainingFeet ?? CANYON_FEET}
          remainingLabel={copy.remainingLabel}
          feetLabel={copy.feetLabel}
          locale={locale}
        />
      </div>

      {/* aria-live, not an sr-only duplicate: pressing the button changes text
          elsewhere on the page, and a screen-reader user needs to hear the
          outcome of their own press. Four changes total across the whole page,
          so this is nothing like the verdict counter that had to lose its live
          region for ticking twice a second. */}
      <div aria-live="polite" className="w-full">
        <AnimatePresence mode="wait">
          {line && (
            <m.p
              key={attempt!.n}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE_OUT_STRONG }}
              className="mx-auto mt-5 max-w-sm text-center text-sm leading-relaxed text-white/75"
            >
              {line.reaction}
            </m.p>
          )}
        </AnimatePresence>
      </div>

      {/* Always a real button, always enabled until the bound is reached.
          Never moves, never dodges — excluding keyboard, touch and screen
          reader users from a gospel page to make a joke is not a trade worth
          making, and a button that refuses to be pressed says "you are being
          toyed with" rather than "your effort is real and is not the issue". */}
      {!done && (
        <div className="mt-8">
          <Button variant="red" mist onClick={jump}>
            {attempt === null ? copy.buttonLabel : copy.buttonLabelAgain}
          </Button>
        </div>
      )}

      {done && (
        <Reveal
          copy={copy.reveal}
          locale={locale}
          onCtaClick={() => trackGoodEnoughCtaClicked(locale)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 5: Verify gates, then commit**

Run: `npx tsc --noEmit && pnpm lint && pnpm vitest run`
Expected: tsc clean, ≤7 warnings, all tests pass.

```bash
git add src/components/good-enough src/lib/eternity-analytics.ts
git commit -m "feat(good-enough): the jump scene"
```

---

### Task 4: The route

**Files:**
- Create: `src/app/[locale]/(content)/good-enough/page.tsx`
- Modify: `src/app/sitemap.ts`

**Interfaces:**
- Consumes: `<GoodEnoughScene />` (Task 3), `goodEnough` messages (Task 2).
- Produces: the live route at `/[locale]/good-enough`.

`(content)`, not `(immersive)`: a cold visitor arriving from a shared link needs TopBar and Footer to reach the rest of the site. This is the one page built to be found.

- [ ] **Step 1: Write the page**

Create `src/app/[locale]/(content)/good-enough/page.tsx`, following `find-a-church/page.tsx` exactly:

```tsx
import { notFound } from "next/navigation";
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/seo";
import { GoodEnoughScene } from "@/components/good-enough/good-enough-scene";
import type { GoodEnoughMessages } from "@/lib/types";
import type { Metadata } from "next";

// The general case of Romans 3:23, made physical. Indexed and shareable — the
// CTA hands the reader to /test, which is where it gets personal.

type Props = { params: Promise<{ locale: string }> };

async function getData(locale: Locale): Promise<{ ge: GoodEnoughMessages; brand: string }> {
  const messages = await import(`@/messages/${locale}.json`);
  return {
    ge: messages.default.goodEnough as GoodEnoughMessages,
    brand: messages.default.topBar.brand as string,
  };
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const { ge, brand } = await getData(locale as Locale);
  return buildPageMetadata({
    locale,
    path: "/good-enough",
    title: `${ge.title} | ${brand}`,
    description: ge.metaDescription,
    robots: { index: true, follow: true },
  });
}

export default async function GoodEnoughPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const { ge } = await getData(locale as Locale);

  return (
    <main className="relative z-[1] mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center px-6 py-16 sm:px-8">
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="h-px w-6 bg-red-500/40" />
        <span className="font-mono text-[9px] uppercase tracking-[3px] text-red-400/75">
          {ge.eyebrow}
        </span>
        <span aria-hidden="true" className="h-px w-6 bg-red-500/40" />
      </div>
      <h1 className="mt-5 text-balance text-center text-3xl font-bold tracking-tight sm:text-4xl">
        {ge.title}
      </h1>
      <div className="mt-10 w-full">
        <GoodEnoughScene copy={ge} locale={locale as Locale} />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Add to the sitemap**

In `src/app/sitemap.ts`, extend the `staticPages` array:

```ts
    const staticPages = ["", "/test", "/reading-plan", "/learn", "/about", "/privacy", "/terms", "/find-a-church", "/good-enough"];
```

- [ ] **Step 3: Verify live in both locales**

```bash
pnpm dev
```

Then, at 390×844:
- `/en/good-enough` and `/pt/good-enough` both render.
- Press the button four times: the marker moves each time, the reaction line changes each time, the remaining number decreases and never reaches zero.
- After the fourth press the button is gone and the reveal is present.
- The CTA lands on `/{locale}/test`.
- **Keyboard only:** Tab reaches the button, Enter and Space both jump, Tab reaches the CTA after the reveal.
- **`prefers-reduced-motion: reduce`:** the marker must still end up in the landed position — the jump *is* the interaction, so no-movement is a broken page, not a considerate one. `JumpTrack` already branches explicitly on `useReducedMotion()` rather than trusting `MotionConfig reducedMotion="user"` (`providers.tsx:55`) to snap the transform. Verify by emulating the media query and confirming the marker moves on every press.
- **Screen reader (VoiceOver):** pressing the button announces the reaction line once, via the `aria-live="polite"` wrapper. Confirm the distance readout is announced once, not twice.

- [ ] **Step 4: Decide the PT unit question**

Task 2 flagged it: PT copy says metres, the mechanic stores feet. Either convert the readout for PT or keep feet in both. **Ask the owner; do not pick silently.** If converting, do it in the page (a `feetToMetres` helper in `src/lib/good-enough.ts` with its own test), never in the component.

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/(content)/good-enough" src/app/sitemap.ts
git commit -m "feat(good-enough): route, metadata, sitemap"
```

---

### Task 5: Discoverability — share card and the Also Here band

**Files:**
- Create: `src/app/[locale]/(content)/good-enough/opengraph-image.tsx`
- Modify: `src/components/home-shell.tsx`, `src/messages/{en,pt}.json`, `src/lib/types.ts`

**Interfaces:**
- Consumes: the live route (Task 4).
- Produces: a share card; a third row in the homepage band.

- [ ] **Step 1: The OG image**

Create `src/app/[locale]/(content)/good-enough/opengraph-image.tsx`, copying the structure of `src/app/[locale]/opengraph-image.tsx` — including its `loadOgFonts()` try/catch fallback, which must be kept. Copy:

```ts
const COPY = {
  en: { title: "Good enough?", subtitle: "The canyon is eighteen miles wide." },
  pt: { title: "Suficientemente bom?", subtitle: "O desfiladeiro tem vinte e nove quilómetros." },
} as const;
```

- [ ] **Step 2: Two new message keys**

In `src/lib/types.ts`, extend `HomeMessages["alsoHere"]`:

```ts
  alsoHere: {
    label: string;
    readingDescription: string;
    learnDescription: string;
    goodEnoughLabel: string;
    goodEnoughDescription: string;
  };
```

`en.json` → `home.alsoHere`:
```json
"goodEnoughLabel": "Good enough?",
"goodEnoughDescription": "Four jumps, one canyon. Takes twenty seconds."
```

`pt.json` → `home.alsoHere`:
```json
"goodEnoughLabel": "Suficientemente bom?",
"goodEnoughDescription": "Quatro saltos, um desfiladeiro. Leva vinte segundos."
```

- [ ] **Step 3: The third row**

In `src/components/home-shell.tsx`, import `Footprints` from `lucide-react` (verified present) alongside `BookOpen` and `Compass` — **not** `Mountain`, which is a climbing image and therefore a ladder by another name.

**First in `alsoHereRows`, not last.** Reading Plan and Learn are post-decision content; this is the pre-test hook, sitting on the page new readers actually land on.

```tsx
  const alsoHereRows: AlsoHereRow[] = [
    {
      href: `/${locale}/good-enough`,
      label: home.alsoHere.goodEnoughLabel,
      description: home.alsoHere.goodEnoughDescription,
      icon: <Footprints className="size-4" aria-hidden="true" />,
    },
    // ...existing reading-plan and learn rows follow, unchanged
  ];
```

No `onClick` — the band's own contract is that every row is a plain link, always. Page-level `good_enough_viewed` already records arrivals.

- [ ] **Step 4: Verify and commit**

Run: `npx tsc --noEmit && pnpm lint && pnpm vitest run`

Check `/en` and `/pt`: the band shows three rows, the third links to `/good-enough`, and the row is ≥60px tall (the band's `min-h-[60px]`).
Check the card renders: `/en/good-enough/opengraph-image`.

```bash
git add -A
git commit -m "feat(good-enough): share card and homepage band row"
```

---

## Self-review

**Spec coverage.** Every constraint in `2026-07-27-good-enough.md` maps to a task: escalating help → Task 1 `JUMP_FEET`; four presses → Task 1 `MAX_ATTEMPTS`; far side never drawn → Task 3 `JumpTrack`; no cursor-dodging → Task 3 Step 4; reduced motion → Task 4 Step 3; CTA to `/test` → Task 3 `Reveal`; locale parity → Task 2; `/good-enough` indexed → Task 4; Also Here row → Task 5.

**Type consistency.** `GoodEnoughMessages` is defined once (Task 2) and consumed by Tasks 3, 4. `Attempt`, `attemptAt`, `MAX_ATTEMPTS`, `CANYON_FEET` defined once (Task 1), consumed by Tasks 2, 3.

**Known gaps, deliberately left for the owner rather than guessed:**
1. **The PT unit question** (Task 2 note, Task 4 Step 4) — feet vs metres in the numeric readout.
2. **All doctrinal copy** — the EN reveal and the whole PT block are drafts pending sign-off.
3. **Zero-press bounce.** A reader who reads the prompt and leaves gets no gospel. Accepted deliberately: a second always-visible CTA would compete with the reveal, which is the page's whole payload. TopBar and Footer (the reason for the `(content)` group) are the fallback. Revisit if `good_enough_viewed` vastly exceeds `good_enough_jumped` with attempt 1.

## Grill record (2026-07-27)

Six defects found and fixed in place; three questions escalated.

| # | finding | resolution |
|---|---|---|
| 1 | `Button` has no `asChild` — verified at `ui/button.tsx:80` | `onClick` + `router.push`, matching `grace-screen.tsx:125` |
| 2 | the track implied a denominator: a marker at 62% of a bounded box is the far side drawn by other means, the exact failure the original grill guarded against | fixed pixel offsets, right-edge mask, no percentage anywhere |
| 3 | pre-press readout showed `0 … still short`, which reads as *you made it* | show the full `CANYON_FEET` before the first press |
| 4 | reveal copy said "Fifty feet is a world record" — inherited from when 50 ft was the terminal attempt, but rocket boots now go 200 | rewritten to use both: human ceiling, then beyond-human |
| 5 | bare `toLocaleString()` formats with the runtime locale, not the page's | explicit `pt-PT` / `en-US` |
| 6 | `sr-only` readout duplicated the visible one | dropped; `aria-live="polite"` on the reaction line instead |

Also settled: `validateMessages` (`i18n.ts:48`) is a whitelist, so a new top-level message key needs no validator change — no task required. `LazyMotion … strict` (`providers.tsx:54`) means `m` only, which the plan already uses throughout. Reduced motion was promoted from "verify and branch if needed" to an explicit `useReducedMotion()` branch, because the failure mode is a marker that never moves — and on this page that is not a degraded experience, it is a blank one.

Escalated, not guessed: the PT unit question, all doctrinal copy, and whether the zero-press bounce deserves a mitigation.

## Decision log (this plan)

| # | Decision | Why |
|---|---|---|
| Vocabulary | `good-enough` everywhere | the original plan said `/good-enough` in one place and `jump` in another |
| Route group | `(content)` | shareable page; a cold arrival needs TopBar and Footer |
| Accumulation | attempts do **not** accumulate | accumulating is a progress bar, which the app's copy forbids |
| Visual travel | fixed pixel offsets, never a percentage | a percentage implies a 100%, and a 100% is the far side drawn |
| Opening readout | the full 95,040, before any press | impossible by construction and visibly so — never impossible by difficulty |
| Icon | `Footprints` | `Mountain` is a climbing image — a ladder by another name |
| Band position | first row, above Reading Plan and Learn | those are post-decision; this is the pre-test hook |
| Events | `good_enough_*` | matches the `home_*` / `test_*` surface-prefixed convention |
