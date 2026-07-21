# Fence-Sitter Asks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The blog's sticky bar and personal-turn CTA speak to each journey stage correctly: undecided users (saw the verdict, never answered) get a return-to-the-verdict ask; thinking users get the next-steps track; dismissed users are never pursued (bar hidden, turn question stands without a button); the off-method reading-plan nudge to undecided/dismissed is removed.

**Architecture:** Both components replace their single visitor gate with a stage→ask map. Message keys stay flat in the `blog` namespace for parity. No mechanics change (consent gate, 40% scroll, turn-block yielding, motion all stay).

**Tech Stack:** Next.js 16.2.1, React 19, TypeScript, framer-motion via LazyMotion strict (`m` only), pnpm.

## Global Constraints

- **Living Waters:** dismissed users are NOT pursued — no bar, no button; the turn question may stand alone. No discipleship nudges (reading plan) to undecided/dismissed — they haven't responded to grace.
- Stage → surfaces contract (both components must implement exactly this):
  - visitor: bar "Are you a good person?"→/test · turn CTA `ctaButton`→/test
  - undecided: bar `stickyUndecidedQuestion`→/test · turn CTA `returnCtaButton`→/test
  - thinking: bar `stickyThinkingQuestion`→/next-steps · turn CTA `readingCtaButton`→/reading-plan (if reading incomplete, else none)
  - committed: NO bar · turn CTA `readingCtaButton`→/reading-plan (if reading incomplete, else none)
  - dismissed: NO bar · NO turn CTA (question renders, button slot empty — min-h already reserves the space)
- Bilingual parity (blog.test.ts enforces); PT European Portuguese tu-form; surgical JSON edits + `python3 json.load` validation; flag PT for owner gate.
- Gates: `pnpm lint && pnpm test && npx tsc --noEmit && pnpm build` all green before commit.
- Commit trailers:
  `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
  `Claude-Session: https://claude.ai/code/session_01GCuFmndcCWD1FAQbeLHCxx`

---

### Task 1: Stage-aware asks in sticky bar + personal turn

**Files:**
- Modify: `src/components/blog/blog-sticky-bar.tsx`
- Modify: `src/components/blog/personal-turn.tsx`
- Modify: `src/components/blog/blog-post-page.tsx` (thread new message keys)
- Modify: `src/messages/en.json`, `src/messages/pt.json` (`blog` namespace: 5 new keys)

**Interfaces:**
- Consumes: existing `useJourney`, `trackBlogCtaClicked(slug, position, stage)`.
- Produces: `BlogStickyBar` props become `{ slug, locale, messages: { visitorQuestion, visitorCta, undecidedQuestion, undecidedCta, thinkingQuestion, thinkingCta } }`; `PersonalTurn` gains `returnCtaButton: string`.

- [ ] **Step 1: Message keys (surgical, both locales)** — in `blog` after `"stickyCta"`:

EN:
```json
    "stickyUndecidedQuestion": "You saw the verdict. It's still on the table.",
    "stickyUndecidedCta": "Return",
    "stickyThinkingQuestion": "Still weighing it?",
    "stickyThinkingCta": "Take the next step",
    "returnCtaButton": "Return to the verdict",
```

PT:
```json
    "stickyUndecidedQuestion": "Viste o veredicto. Continua em cima da mesa.",
    "stickyUndecidedCta": "Voltar",
    "stickyThinkingQuestion": "Ainda a pesar a decisão?",
    "stickyThinkingCta": "Dá o próximo passo",
    "returnCtaButton": "Volta ao veredicto",
```

- [ ] **Step 2: `blog-sticky-bar.tsx` stage map**

Replace the props interface's `question: string; ctaLabel: string;` with:

```ts
  messages: {
    visitorQuestion: string;
    visitorCta: string;
    undecidedQuestion: string;
    undecidedCta: string;
    thinkingQuestion: string;
    thinkingCta: string;
  };
```

Inside the component (after the hooks), replace the visitor-only logic:

```tsx
  // Stage → ask map. Committed users have nothing left to convert; dismissed
  // users said no and are not pursued (Living Waters — the door stays open,
  // quietly). Undecided and thinking users are the fence-sitters this bar
  // exists for.
  const ask =
    stage === "visitor"
      ? { question: messages.visitorQuestion, cta: messages.visitorCta, href: `/${locale}/test` }
      : stage === "undecided"
        ? { question: messages.undecidedQuestion, cta: messages.undecidedCta, href: `/${locale}/test` }
        : stage === "thinking"
          ? { question: messages.thinkingQuestion, cta: messages.thinkingCta, href: `/${locale}/next-steps` }
          : null;

  const visible = ready && ask !== null && consentAnswered && scrolledEnough && !turnVisible;
```

In the JSX, `{question}` → `{ask?.question}`, the Link `href` → `{ask?.href ?? `/${locale}/test`}` — better: keep the JSX inside `{visible && …}` which only renders when `ask` is non-null; since TypeScript can't narrow `ask` through `visible`, hoist: render `{visible && ask && ( … )}` and use `ask.question`/`ask.cta`/`ask.href` directly. CTA click stays `trackBlogCtaClicked(slug, "sticky", stage)`.

- [ ] **Step 3: `personal-turn.tsx` stage map**

Add prop `returnCtaButton: string;` (interface + destructure). Replace the CTA derivation:

```tsx
  // Stage → CTA. Undecided users return to the verdict they walked away
  // from; reading-plan nudges are reserved for those who responded to grace
  // (committed/thinking) — offering discipleship to the undecided or
  // dismissed is out of order. Dismissed: the question stands, unpushed.
  const cta = !ready
    ? null
    : stage === "visitor"
      ? { label: ctaButton, href: `/${locale}/test` }
      : stage === "undecided"
        ? { label: returnCtaButton, href: `/${locale}/test` }
        : (stage === "committed" || stage === "thinking") && !readingComplete
          ? { label: readingCtaButton, href: `/${locale}/reading-plan` }
          : null;
```

(`testDone` variable becomes unused — remove it. `readingComplete` stays.)

- [ ] **Step 4: Thread in `blog-post-page.tsx`**

`BlogChromeMessages`: replace `stickyQuestion: string; stickyCta: string;` with the six sticky keys + add `returnCtaButton: string;`:

```ts
  stickyQuestion: string;
  stickyCta: string;
  stickyUndecidedQuestion: string;
  stickyUndecidedCta: string;
  stickyThinkingQuestion: string;
  stickyThinkingCta: string;
  returnCtaButton: string;
```

Update the two call sites:

```tsx
        <PersonalTurn
          slug={slug}
          locale={locale}
          setup={content.personalTurn.setup}
          question={content.personalTurn.question}
          ctaButton={messages.ctaButton}
          returnCtaButton={messages.returnCtaButton}
          readingCtaButton={messages.readingCtaButton}
        />
```

```tsx
        <BlogStickyBar
          slug={slug}
          locale={locale}
          messages={{
            visitorQuestion: messages.stickyQuestion,
            visitorCta: messages.stickyCta,
            undecidedQuestion: messages.stickyUndecidedQuestion,
            undecidedCta: messages.stickyUndecidedCta,
            thinkingQuestion: messages.stickyThinkingQuestion,
            thinkingCta: messages.stickyThinkingCta,
          }}
        />
```

- [ ] **Step 5: Gates** — all green (blog.test.ts parity covers the 5 new keys).
- [ ] **Step 6: Dev check** — curl page for non-crash; stage matrix is the reviewer's (Playwright).
- [ ] **Step 7: Commit**

```bash
git add src/components/blog/blog-sticky-bar.tsx src/components/blog/personal-turn.tsx src/components/blog/blog-post-page.tsx src/messages/en.json src/messages/pt.json
git commit -m "feat: blog asks speak to fence-sitters, not just visitors

Undecided users — saw the verdict, never answered — get 'It's still on
the table → Return'; thinking users get the next-steps track. Dismissed
users are never pursued: no bar, and the turn question now stands
without a button. Also removes the off-method reading-plan nudge the
turn CTA offered to undecided/dismissed users (same class as the J5
top-bar fix — discipleship waits for a response to grace).

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GCuFmndcCWD1FAQbeLHCxx"
```

---

### Task 2: Ship + verify

- [ ] Push; wait Ready; prod fresh-profile spot-check (visitor bar unchanged); stage matrix trusted from dev review.
