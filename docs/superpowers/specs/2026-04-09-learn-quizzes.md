# Learn Section Reflection Quizzes

## Problem

The learn topic pages are passive reading. Users scroll through theological content with no engagement checkpoint. There's no way to know if the content is landing, and no interactivity to hold attention.

## Goal

Add optional reflection questions within learn topic sections. Multiple choice format — user picks an answer, correct answer highlights gently, reveal text explains why. Persisted in localStorage. No retry — once answered, it stays.

## Design

### Question Format

Each learn section can optionally include a `quiz` field in i18n JSON:

```json
{
  "heading": "God's standard",
  "body": "...",
  "scripture": "...",
  "scriptureRef": "...",
  "quiz": {
    "question": "By God's standard, how many lies does it take to be a liar?",
    "options": ["Many, repeated lies", "Just one", "It depends on intent"],
    "correct": 1,
    "reveal": "Just one. James 2:10 says if you stumble at just one point, you're guilty of all."
  }
}
```

- `question` — the reflection prompt
- `options` — 2-3 answer choices
- `correct` — zero-based index of the right answer
- `reveal` — explanation shown after answering (1-2 sentences + scripture reference)
- Field is **optional** — sections without `quiz` render normally
- Aim for **2-3 questions per topic**, only where they naturally fit (~10-15 total across 5 topics)

### Placement

Within each section: heading → body paragraphs → **quiz** → scripture blockquote.

The scripture stays as the "final word" of each section. The quiz sits between the explanation and the scripture, prompting reflection before the closing verse.

### Interaction Flow

1. User reads section content (heading, body)
2. Quiz appears: question text + answer buttons (ghost variant, sm size)
3. User taps an option:
   - Correct answer highlights with gold border/text
   - Other options stay visible but dim slightly (not punitive — gentle)
   - Selected wrong option gets a subtle dot indicator
   - Reveal text fades in below with Framer Motion
   - Answer is saved to localStorage
4. On revisit: answered state is shown (correct highlighted, reveal visible)
5. No "Try again" — once answered, it stays. The reveal IS the value.

### Gentle Wrong-Answer UX

This is a gospel reflection tool, not a school test. When the user picks wrong:
- Their choice gets a small indicator (selected dot)
- The correct answer lights up gold
- The reveal explains *why* — teaching, not correcting
- No red, no "wrong" label, no shaming

### Persistence

**Key:** `learn-quiz-{topicSlug}-{sectionIndex}`
**Value:** the selected option index (number)

Stored in localStorage. Same pattern as reading plan progress.

### Component

**`SectionQuiz`** — new client component in `src/components/learn/section-quiz.tsx`

Props:
- `quiz: { question: string; options: string[]; correct: number; reveal: string }`
- `topicSlug: string`
- `sectionIndex: number`

State:
- `selectedOption: number | null` (from localStorage on mount, updated on tap)

Rendering:
- "Reflect" monospace label above question (matches section styling)
- Question text in semibold
- Options as `Button` (ghost variant, sm size, full width)
- After selection: correct option border/text turns gold, others dim to 0.5 opacity, selected wrong gets a dot
- Reveal text fades in (Framer Motion, 0.4s)
- Entire component fades in on scroll (match existing section IntersectionObserver pattern)

### Files to Create

- `src/components/learn/section-quiz.tsx` — quiz component
- `src/lib/learn-quiz-storage.ts` — read/write quiz answers to localStorage

### Files to Modify

- `src/components/learn/topic-section.tsx` — accept optional `quiz` prop, render `SectionQuiz` between body and scripture
- `src/components/learn/topic-page.tsx` — pass quiz data through from section messages
- `src/messages/en.json` — add quiz objects to ~10-15 learn sections
- `src/messages/pt.json` — same with Portuguese content

### Content Guidelines

Questions should:
- Provoke thought, not test rote knowledge
- Have one clearly correct biblical answer
- Include answers that sound reasonable but are wrong (common misconceptions)
- Reveal text: concise, 1-2 sentences, cite scripture

## Verification

1. Visit a learn topic page — quiz appears in sections that have one
2. Quiz sits between body and scripture
3. Tap an answer — correct highlights gold, reveal fades in
4. Refresh page — answered state persists
5. Sections without quiz field render normally
6. Both locales work
7. `pnpm build` passes
