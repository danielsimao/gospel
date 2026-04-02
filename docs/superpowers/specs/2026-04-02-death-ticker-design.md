# Death Ticker — Design Spec

**Route:** `/[locale]/eternity`
**Locales:** `en`, `pt`
**Inspired by:** [iran-cost-ticker.com](https://iran-cost-ticker.com/) — same data-driven urgency, applied to global mortality → gospel

## Overview

A scroll-snapped, single-page experience that confronts users with the reality of death, convicts through the law (Living Waters method), presents the gospel, and funnels to deeper engagement. A live death counter ticks the entire time.

## Page Structure

Four scroll-snapped full-viewport sections with a fixed sticky counter bar.

### Sticky Counter Bar (fixed, always visible)

- Fixed at top, semi-transparent dark background with backdrop blur
- Pulsing red dot (2s ease-in-out blink) + live death count in monospace red (`#f87171`)
- Label: "people have died since you opened this page"
- Counter uses `requestAnimationFrame` at 1.8 deaths/second

### Section 1: Hero / Stats

- Large death counter (72px monospace, `#f87171` with glow)
- Label: "Since you opened this page" / counter / "people have died"
- Four rate cards in a row: 1.8/sec, 108/min, 6,500/hr, 155,000/day
- World map: `react-simple-maps` with `geoNaturalEarth1` projection, filled continents at ~6% white opacity, no country borders. Red death pulses (`#DC2626`) spawn every 550ms at real city coordinates using `<Marker>`. Filter out Antarctica.
- Scroll affordance: animated mouse icon with scrolling wheel dot + "Scroll" text + bouncing chevron. Fades in after 2s.

### Section 2: Law — Interactive Quiz

- Heading: "Are you ready to face God?"
- Subtext: "Answer honestly."
- Three commandment questions, sequential unlock (next is blurred/locked until current is answered):

**Q1: "Have you ever told a lie?"**
- Yes → "Even one lie. A 'white lie,' an exaggeration, a half-truth." → "That makes you a liar."
- No → "Really? You've never told a single lie in your entire life? That itself might be one." → "That makes you a liar."

**Q2: "Have you ever stolen anything?"**
- Yes → "Regardless of the value — a pen, someone's time, credit for someone else's work." → "That makes you a thief."
- No → "Never taken anything that wasn't yours? Not even something small? Think again." → "That makes you a thief."

**Q3: "Have you ever used God's name as a curse word?"**
- Yes → "Instead of using a four-letter word, you used the name of the God who gave you life." → "That makes you a blasphemer."
- No → "Perhaps not — but by two of the Ten Commandments, you've already admitted guilt." → "That makes you a blasphemer."

**Post-quiz verdict sequence** (scroll snap temporarily disabled):

1. **1s pause** after final answer
2. **"GUILTY"** — 64px bold red text, scale-up reveal animation (0→1.05→1), subtle glow pulse. Scrolls into center of viewport.
3. **"By your own admission, you are a lying, thieving blasphemer."**
4. **1.2s later:** James 2:10 scripture + "[X] people died while you answered these questions."
5. **1s later:** Gold bridge button: **"Is there any hope? ↓"** — gentle glow pulse, scrolls to Grace section on click.

### Section 3: Grace

- Content is **hidden** (opacity 0, translateY 30px) until the section enters the viewport (IntersectionObserver, 40% threshold).
- Staggered reveal on enter:
  - "But God..." heading (gold `#D4A843`) — immediate
  - First paragraph — 0.6s delay
  - Second paragraph — 1.2s delay
  - Scripture — 1.8s delay
- Conic gradient gold glow background (same pattern as existing grace-screen.tsx)
- Gospel content: cross + substitution message. God became man, lived perfectly, died for sins, rose from the dead. Repent and trust → forgiveness + eternal life = free gift.
- Scripture: Romans 5:8

### Section 4: CTA

- Heading: "What will you do?"
- Subtitle: "The counter is still ticking."
- Primary CTA (gold border): "Take the Good Person Test →" → links to `/${locale}` (Verdict game)
- Secondary CTA (white border): "Talk to someone about this →" → links to `/${locale}/chat`
- Resource links: Living Waters "Are You a Good Person?", needGod.net
- Share buttons: WhatsApp, Telegram, Copy Link (reuse existing `ShareButtons` component pattern)

## Navigation & Scroll

- `scroll-snap-type: y mandatory` on the page container
- `scroll-snap-stop: always` on each section — forces engagement
- Scroll snap temporarily disabled during guilty verdict sequence, re-enabled when user navigates to Grace
- Progress dots fixed on right side of viewport — red for sections 1/2/4, gold for section 3. Clickable to jump.

## Visual Design

| Element | Value |
|---------|-------|
| Background | `#0c0a09` |
| Counter/rate numbers | `#f87171` (monospace, glow) |
| Death pulses on map | `#DC2626` |
| Guilty verdict | `#f87171` 64px bold, glow |
| Grace accent | `#D4A843` (gold) |
| Body text | `rgba(255,255,255,0.7)` |
| Subtle text | `rgba(255,255,255,0.35)` |
| Cards/borders | `rgba(255,255,255,0.06)` |
| Typography | System UI stack + monospace for numbers |
| Fonts | Geist Sans (body), Geist Mono (counters) — already in project |

## Tech Stack

- Next.js 16 App Router, server component page, client component shell
- Framer Motion for animations (already installed)
- react-simple-maps for world map (already installed on feature branch, needs re-install on main)
- Existing `ShareButtons` component pattern for share functionality
- PostHog analytics for quiz interactions and scroll depth

## i18n

Add `eternity` key to both `src/messages/en.json` and `src/messages/pt.json` with all text content: hero labels, rate card labels, quiz questions/verdicts, guilty text, grace content, CTA labels, share messages.

## Analytics Events (PostHog)

- `eternity_page_viewed` — page load
- `eternity_quiz_answered` — each question (question number, answer yes/no)
- `eternity_guilty_shown` — verdict revealed
- `eternity_bridge_clicked` — "Is there any hope?" clicked
- `eternity_grace_revealed` — grace section entered viewport
- `eternity_cta_clicked` — which CTA (test/chat/resource)
- `eternity_shared` — share button clicked (channel)
- `eternity_scroll_depth` — furthest section reached

## Components

| Component | File | Purpose |
|-----------|------|---------|
| `EternityShell` | `src/components/eternity/eternity-shell.tsx` | Main orchestrator, scroll snap, sticky counter, progress dots |
| `DeathCounter` | `src/components/eternity/death-counter.tsx` | requestAnimationFrame counter |
| `RateCards` | Inline in shell | Four stat cards |
| `WorldMap` | `src/components/eternity/world-map.tsx` | react-simple-maps with death pulses |
| `LawQuiz` | `src/components/eternity/law-quiz.tsx` | Interactive 3-question quiz with verdict sequence |
| `GraceReveal` | `src/components/eternity/grace-reveal.tsx` | IntersectionObserver-triggered staggered reveal |
| `ScrollAffordance` | Inline in shell | Mouse animation + scroll text |
| `ProgressDots` | Inline in shell | Fixed right-side nav dots |

## File Structure

```
src/
├── app/[locale]/eternity/
│   └── page.tsx              # Server component, loads messages, renders EternityShell
├── components/eternity/
│   ├── eternity-shell.tsx    # Main orchestrator
│   ├── death-counter.tsx     # Live counter (requestAnimationFrame)
│   ├── world-map.tsx         # react-simple-maps + death pulses
│   ├── law-quiz.tsx          # Interactive quiz + guilty verdict
│   ├── grace-reveal.tsx      # Staggered grace content reveal
│   └── map-constants.ts      # GEO_URL + POPULATION_CENTERS (exists)
├── lib/
│   └── eternity-analytics.ts # PostHog event helpers
├── messages/
│   ├── en.json               # Add eternity key
│   └── pt.json               # Add eternity key
└── public/data/
    └── world-110m.json       # TopoJSON (exists)
```

## Reference Mockup

Interactive mockup with full flow: `.superpowers/brainstorm/99946-1775142916/content/final-design-v3.html`
