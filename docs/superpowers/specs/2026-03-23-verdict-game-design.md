# Verdict — The Impossible Standard Game

## Summary

A mobile-first progressive web app that presents the gospel through an interactive game based on Ray Comfort's "Way of the Master" evangelism method. The user attempts to prove they're a "good person" by answering moral questions tied to the Ten Commandments. The game is truthfully unwinnable — no one meets God's perfect standard. When the score hits zero, the screen cracks and the verdict drops: **Guilty.** Then light breaks through — the gospel of grace is presented. Jesus paid the fine.

## Target Audience

- **Primary:** Non-believers receiving a link (cold share via social media/QR/text, or warm follow-up after a conversation)
- **Context:** Works whether the person has had a prior evangelism conversation or not
- **Session:** Single sitting, 3-7 minutes. Return visits are a bonus, not required.

## Core Principles

- **Law before Grace** — conviction before comfort (Ray Comfort's core principle)
- **Truthful, not tricky** — the game isn't rigged unfairly; it reflects God's actual standard of perfection
- **Faithful to the method's core** but creative in presentation
- **Maximum impact in one session** — the full gospel is delivered every time

## Ray Comfort Method Mapping

| Ray Comfort Step | App Phase |
|-----------------|-----------|
| "Are you a good person?" | Landing — the implicit challenge |
| Walk through the Commandments | Game — 8 moral questions |
| "Would you be innocent or guilty?" | Verdict — score hits zero, "Guilty" |
| God paid the fine through Christ | Grace — light breaks through, gospel message |
| Call to repentance and faith | Invitation — prayer, resources |

## Game Flow

```
Landing → Game (rapid-fire moral questions, draining score) → Verdict (zero, screen cracks) → Grace (light breaks through, gospel message) → Invitation (prayer, share, resources)
```

### Phase 1: Landing

- Full-screen dark background with subtle warm glow
- Simple question: "Are you a good person?"
- Single CTA button: "Find out" or "Take the test"
- No sign-up, no friction — one tap to start

### Phase 2: Game (8 Questions)

**Score System:**
- Starts at 100 — visualized as a thin, elegant bar at the top
- Score drains are calibrated so it always reaches zero on or after question 8
- The bar cannot go up — no way to earn points back
- The game is truthfully unwinnable because the standard is perfection

**Questions with score values:**

| # | Question | Commandment | Honest drain | Justify drain | Follow-up (if justify) |
|---|----------|-------------|-------------|--------------|----------------------|
| 1 | "Have you ever told a lie — even a small one?" | 9th | -12 | -5 | "What about a 'white lie' to spare someone's feelings?" |
| 2 | "Have you ever taken something that wasn't yours — even something small?" | 8th | -12 | -5 | "Have you ever kept extra change, downloaded something you didn't pay for?" |
| 3 | "Have you ever looked at someone with lust?" | 7th (Matt 5:28) | -13 | -6 | "Jesus said looking with lust is adultery of the heart." |
| 4 | "Have you ever been so angry you wished someone harm?" | 6th | -13 | -6 | "Even a flash of hatred — Jesus called that murder of the heart." |
| 5 | "Have you ever used God's name as a curse word?" | 3rd | -12 | -7 | "Even 'OMG' as an exclamation — using the Creator's name carelessly?" |
| 6 | "Have you ever wanted something that belonged to someone else?" | 10th | -13 | -7 | "A friend's lifestyle, someone's relationship, a coworker's promotion?" |
| 7 | "Have you ever put something — money, career, relationships — above God?" | 1st | -13 | -8 | "If you've spent more time on your phone than thinking about your Creator..." |
| 8 | "Have you ever failed to honor your parents?" | 5th | -12 | -8 | "Even in your heart — resentment, dismissiveness, ingratitude?" |

**Score math:** All honest = 100 points drained (exactly zero). All justify = 52 points drained (score at 48, but the follow-ups make dishonesty increasingly difficult to maintain). Mixed answers always land at or near zero by Q8. If score reaches zero before Q8, remaining questions still play with score fixed at zero — the conviction continues building.

**Follow-up interaction:** When user picks the self-justifying option, a follow-up text appears below the question (inline, not a modal) with a 1.5s delay. After reading, the score drains and the next question auto-advances after 2s.

**Interaction:**
- Two options per question: honest admission or self-justifying claim
- Tap to answer (large tap targets, stacked vertically on mobile, side-by-side on desktop)
- Smooth slide/fade transitions between questions
- No skip option — every question is part of the journey

**Visual Shift (progressive mood change):**
- Questions 1-3: Dark neutral background, green score bar, confident tone
- Questions 4-6: Darker background, bar shifts yellow → orange, slight unease
- Questions 7-8: Near black, red bar almost empty, bold stark text, conviction

### Phase 3: Verdict

- Score hits zero → screen crack effect (CSS overlay with animated SVG crack pattern radiating from center)
- **"Guilty."** — large text, pause for weight
- "By God's perfect standard, none of us are good enough."
- Brief moment of silence / stillness

### Phase 4: Grace

- Light breaks through the cracks (CSS gradients + blur for volumetric rays)
- Tone shifts entirely — warm, hopeful
- "But God, being rich in mercy..."
- The courtroom fine analogy: a judge who pays your penalty
- Jesus paid the fine — His death on the cross satisfied God's justice
- The score bar refills slowly with golden/white light — not from your works, but from His sacrifice

### Phase 5: Invitation

- Clear, dignified explanation of repentance and faith
- Not a pushy altar call — simple and respectful
- A prayer the user can pray if they choose
- Three response options: "I prayed this" / "I want to think about it" / dismiss
- Links to resources: Living Waters, Bible reading plan, local church finder

### Phase 6: Share

- **WhatsApp:** Pre-filled message with the locale-specific link (e.g., `https://wa.me/?text=...`)
- **Telegram:** Share via `https://t.me/share/url?url=...&text=...`
- **Copy link:** Copies the locale-specific URL with "Link copied!" toast
- **Native Web Share API:** Fallback for other apps on mobile (uses navigator.share)
- Share buttons displayed as a row of icons — WhatsApp and Telegram prominent, copy link and native share as secondary

## Visual & UI Design

**Aesthetic:** Dark mode base — deep blacks and dark grays. Creates contrast for the dramatic light-breaking-through moment.

| Phase | Background | Score Bar | Typography | Mood |
|-------|-----------|-----------|------------|------|
| Landing | Dark + subtle warm glow | N/A | Clean, inviting | Curiosity |
| Early questions (1-3) | Dark neutral | Green, full | Confident | "I'm doing fine" |
| Mid questions (4-6) | Slightly darker | Yellow → Orange | Slightly heavier | Unease |
| Late questions (7-8) | Near black | Red, almost empty | Bold, stark | Conviction |
| Verdict | Black, screen crack | Empty / shattered | Large, impactful | Weight |
| Grace | Light through cracks | Refills gold/white | Warm, softer | Hope |
| Invitation | Warm light, clean | N/A | Clear, readable | Peace |

**Mobile Layout:**
- Full-screen experience — no nav bar, no distractions
- Questions centered vertically
- Score bar fixed at top (thin, elegant)
- Smooth transitions between questions

**Animations:**
- Score bar draining with easing (user watches it fall)
- Gradual background color/mood shifts
- Screen crack: animated SVG overlay with CSS transforms (no WebGL — keep bundle small)
- Light rays: CSS conic-gradient with animated opacity for "god rays" effect
- Score bar golden refill at grace moment
- All animations respect `prefers-reduced-motion` — fade-only fallbacks

**Typography:**
- Geist Sans for UI and questions
- Geist Mono for the score number
- Larger text on gospel/grace section — most important content gets room

**Sound:** Out of scope for v1. Can be added later with user-gesture activation to comply with mobile autoplay policies.

## Tech Stack

- **Framework:** Next.js (App Router) on Vercel
- **Styling:** Tailwind CSS + shadcn/ui
- **Animations:** Framer Motion (score bar, crack effect, light rays)
- **Analytics:** Vercel Web Analytics + PostHog (behavioral analytics, funnels, session replay)
- **Error Tracking:** Sentry (error monitoring, performance tracing)
- **i18n:** Next.js built-in i18n routing with locale prefix (`/en`, `/pt`)
- **PWA:** Service worker for offline support (optional v2)
- **No database** — all game state is client-side
- **No authentication** — anonymous, frictionless experience

## Data Model

```typescript
type GamePhase = "landing" | "playing" | "verdict" | "grace" | "invitation" // "grace" includes gospel message; "invitation" includes share/resources
type AnswerType = "honest" | "justify"
type InvitationResponse = "prayed" | "thinking" | "dismissed"

interface Answer {
  questionId: number
  answer: AnswerType
  commandment: string
  scoreChange: number
}

interface GameState {
  phase: GamePhase
  currentQuestion: number
  score: number // 0-100
  answers: Answer[]
  startedAt: number // timestamp
  completedAt: number | null
  graceReached: boolean
  invitationResponse: InvitationResponse | null
}
```

## Analytics & Observability

### Vercel Web Analytics
Basic traffic metrics — page views, referral sources, device types. Lightweight, privacy-friendly, always on.

### PostHog (Behavioral Analytics)
PostHog provides the actionable insights needed to understand user behavior and adjust the app. Installed via Vercel Marketplace for auto-provisioned env vars.

**Events:**

| Event | Properties | Purpose |
|-------|-----------|---------|
| `game_started` | locale, referral source, device type, utm params | Traffic source & campaign tracking |
| `question_answered` | questionId, commandment, answer type ("honest"/"justify"), score after, time on question (ms) | Per-question engagement — which questions cause hesitation, which get fast answers |
| `question_followup_shown` | questionId | How often users try to justify — conviction effectiveness |
| `game_abandoned` | last questionId, score at exit, total time, locale | Funnel drop-off — which question loses people |
| `verdict_reached` | total honest, total justify, total time | Completion rate |
| `grace_viewed` | time spent (ms), scroll depth | Are people reading the gospel? How far? |
| `invitation_response` | "prayed" / "thinking" / "dismissed", total time | The key conversion metric |
| `resource_clicked` | resource name, resource url | Follow-up resonance |
| `shared` | share method ("whatsapp" / "telegram" / "copy" / "native"), locale | Viral coefficient per channel |

**PostHog Funnels (pre-configured):**
1. **Full Journey:** game_started → verdict_reached → grace_viewed → invitation_response
2. **Question Drop-off:** game_started → Q1 answered → Q2 → ... → Q8 → verdict
3. **Share Funnel:** invitation_response → shared

**PostHog Session Replay:** Enabled for a sample of sessions to watch real user interactions — see where people hesitate, rage-tap, or get confused. Helps inform UI adjustments.

**How to use this data to adjust the app:**
- If a specific question has high abandon rate → reword it or adjust its position
- If "justify" rate is very high on a question → the follow-up isn't convincing enough
- If grace_viewed time is very short → the gospel presentation needs to be more engaging
- If share rate is low → make the share CTA more prominent or adjust placement
- Compare metrics across locales → different cultures may respond differently

### Sentry (Error Tracking)
Installed via Vercel Marketplace. Captures runtime errors, unhandled promise rejections, and performance traces.

**Configuration:**
- Source maps uploaded at build time for readable stack traces
- Performance tracing enabled (transaction per game session)
- Custom breadcrumbs for phase transitions (landing → playing → verdict → grace → invitation)
- Alert on error spike (if error rate > 1% of sessions)

**No PII collected.** No accounts, no emails. PostHog and Sentry are configured to anonymize IPs.

## Component Architecture

**Single-page app** — all phases render within one route (`/`). No client-side routing between phases; state machine drives which phase component renders.

**State management:** `useReducer` with a `GameState` context. No external state library needed — the state is simple and contained.

```
app/
├── [locale]/
│   ├── page.tsx                # Entry point, wraps GameProvider with locale messages
│   └── layout.tsx              # Geist fonts, locale-specific metadata, analytics/sentry providers
├── proxy.ts                    # Accept-Language detection, redirect / → /{locale}
├── components/
│   ├── game-provider.tsx       # GameState context + useReducer
│   ├── landing.tsx             # "Are you a good person?" CTA
│   ├── question-card.tsx       # Single question with two answer buttons
│   ├── follow-up.tsx           # Inline follow-up for justify answers
│   ├── score-bar.tsx           # Animated score bar (top of screen)
│   ├── verdict-screen.tsx      # "Guilty" + crack effect
│   ├── grace-screen.tsx        # Light rays + gospel message + score refill
│   ├── invitation-screen.tsx   # Prayer, response buttons, share, resources
│   ├── share-buttons.tsx       # WhatsApp, Telegram, copy link, native share
│   └── crack-overlay.tsx       # SVG crack animation overlay
├── lib/
│   ├── questions.ts            # Score drain values and question metadata
│   ├── game-reducer.ts         # State machine reducer (phase transitions, score calc)
│   ├── analytics.ts            # PostHog + Vercel Analytics event helpers
│   └── i18n.ts                 # Locale detection, message loading helpers
├── messages/
│   ├── en.json                 # English content (NKJV Scripture references)
│   └── pt.json                 # Portuguese (PT) content (ACF Scripture references)
├── sentry.client.config.ts     # Sentry browser SDK config
├── sentry.server.config.ts     # Sentry server SDK config
└── public/
    ├── og-image-en.png         # English OG image
    └── og-image-pt.png         # Portuguese OG image
```

## URL & Routing Strategy

**Locale-prefixed routes:** `/{locale}` — e.g., `/en`, `/pt`. The root `/` redirects to the user's preferred locale based on `Accept-Language` header (via `proxy.ts`), defaulting to `/en`.

Each locale gets its own shareable URL. When you share the link, the recipient gets the game in that language: `https://yourdomain.com/pt` goes straight to Portuguese.

No deep-linking to individual phases — the experience is sequential within each locale. Browser back button navigates away from the app (not between phases). Page refresh resets to landing.

## Metadata & Social Sharing

Locale-specific metadata so shared links show the right language in previews.

**English (`/en`):**
- **Title:** "Are You a Good Person? | Take the Test"
- **Description:** "Most people think they're good. Find out where you really stand."
- **OG Image:** Dark-themed, "Are you a good person?" in English

**Portuguese (`/pt`):**
- **Title:** "Voce e uma Boa Pessoa? | Faca o Teste"
- **Description:** "A maioria das pessoas pensa que e boa. Descubra onde realmente esta."
- **OG Image:** Dark-themed, same design in Portuguese

**Favicon:** Simple minimal icon (shared across locales)

## Accessibility

- All interactive elements are keyboard-accessible (Tab + Enter/Space)
- Focus management: auto-focus moves to the next question after answering
- `aria-live="polite"` on score bar for screen reader updates
- WCAG 2.1 AA contrast ratios for all text (especially important during dark phases)
- `prefers-reduced-motion`: all animations degrade to simple fades
- Answer buttons have sufficient size (min 44x44px touch targets)

## Edge Cases & Error Handling

- **Page refresh mid-game:** Resets to landing. The experience is 3-5 minutes — acceptable to restart.
- **Web Share API unavailable:** Falls back to copy-link button with "Link copied!" toast
- **Low-end devices:** Framer Motion handles frame dropping gracefully. Crack effect uses CSS/SVG, not WebGL. If animations are too slow, `prefers-reduced-motion` path is simpler.
- **JavaScript disabled:** Not supported — the app is inherently interactive. A `<noscript>` tag can show a static gospel message as fallback.

## Browser Support

Modern browsers: Chrome 90+, Safari 15+, Firefox 90+, Edge 90+. Mobile Safari and Chrome on Android are the primary targets.

## Acceptance Criteria (v1)

**Must-have:**
- [ ] Landing screen with CTA
- [ ] 8 questions with honest/justify paths and follow-ups
- [ ] Animated score bar that drains and changes color
- [ ] Verdict screen with crack effect and "Guilty" text
- [ ] Grace screen with light effect, gospel message, score refill
- [ ] Invitation screen with prayer, 3 response options, resource links
- [ ] Share buttons: WhatsApp, Telegram, copy link, native share
- [ ] i18n: English (NKJV) and Portuguese Portugal (ACF) with locale-prefixed URLs
- [ ] Locale detection via Accept-Language with redirect
- [ ] PostHog behavioral analytics with funnels and session replay
- [ ] Sentry error tracking with source maps and breadcrumbs
- [ ] Vercel Web Analytics for basic traffic metrics
- [ ] Mobile-first responsive design
- [ ] Locale-specific OG images and metadata for social sharing
- [ ] Deployed on Vercel

**Nice-to-have (v1.1):**
- [ ] Haptic feedback on mobile (navigator.vibrate)
- [ ] Shareable result card image generation
- [ ] Sound effects with user toggle
- [ ] Additional languages

## Internationalization (i18n)

**Supported locales (v1):**

| Locale | Language | Bible Version | URL |
|--------|----------|--------------|-----|
| `en` | English | NKJV (New King James Version) | `/en` |
| `pt` | Portuguese (Portugal) | ACF (Almeida Corrigida Fiel) | `/pt` |

**Implementation:**
- Next.js App Router i18n with `[locale]` dynamic segment: `app/[locale]/page.tsx`
- `proxy.ts` detects `Accept-Language` header and redirects `/` → `/{locale}`
- All content stored in JSON message files: `messages/en.json`, `messages/pt.json`
- Each message file contains: questions, follow-ups, verdict text, gospel text, prayer, button labels, share messages, and Scripture references in the correct Bible version
- Scripture references use NKJV wording for English and ACF wording for Portuguese
- OG metadata (title, description) is locale-specific for proper social sharing previews
- Adding a new language = adding a new `messages/{locale}.json` file + updating the locale list

**Content structure per locale:**
```json
{
  "landing": { "title": "...", "cta": "..." },
  "questions": [
    {
      "id": 1,
      "text": "...",
      "commandment": "...",
      "honestLabel": "...",
      "justifyLabel": "...",
      "followUp": "..."
    }
  ],
  "verdict": { "title": "...", "subtitle": "..." },
  "grace": { "heading": "...", "body": "...", "scripture": "..." },
  "invitation": { "prayer": "...", "responses": { ... } },
  "share": { "whatsappMessage": "...", "prompt": "..." },
  "meta": { "title": "...", "description": "..." }
}
```

## Future Phases

- **Phase 2:** AI Conversational Experience (Idea 2) — an AI-powered "Good Person Test" conversation
- **Phase 3:** Shareable result cards / dynamic OG images
- **Phase 4:** Additional languages (Spanish, French, etc.)
- **Phase 5:** PWA with offline support
