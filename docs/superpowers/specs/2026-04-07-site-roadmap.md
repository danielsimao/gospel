# Gospel Site Roadmap — From Landing Page to Destination

## Problem

The site is a single-use funnel. Three paths (eternity page, quiz, AI chat) all lead to the same endpoint: invitation + prayer + external resource links. There's no reason to return, no depth for the curious, and no next steps for the converted. It serves seekers, new believers, and sharers — but only at one point in their journey.

## Constraints

- No auth system (anonymous by default)
- Database OK for lightweight persistence (progress, analytics)
- Full technical flexibility otherwise

---

## Stream 1: Discipleship Path (Post-Decision)

**Who it serves:** People who just responded to the invitation ("I prayed", "I want to think about it").

**The gap:** After the invitation, users see 2-3 external links and share buttons. The moment of highest intent is met with an exit ramp to someone else's site.

**What to build:**

- **"What Now?" page** (`/{locale}/next-steps`) — a guided post-decision flow:
  - For "I prayed": Welcome message, what just happened theologically, your first prayer, your first Bible reading (John 1), finding a church near you (Google Maps integration), share your decision (optional).
  - For "I want to think about it": Gentler path — a few questions to reflect on, bookmark/save for later, one key reading (John 3), "come back anytime" messaging.
- **7-Day Reading Plan** — a simple daily devotional path stored in i18n JSON. Each day: a short passage, a reflection question, a prayer prompt. Progress tracked in localStorage (no account needed). Accessible from "What Now?" and as a standalone page.
- **"Find a Church" integration** — embed a Google Maps search for "church near me" or link to a church finder service. Localized labels.
- **Email collection (optional)** — "Want us to send you the reading plan?" Simple form → Vercel KV or Resend integration. No account, just email + locale.

**Technical scope:** 2-3 new pages, i18n content, localStorage progress, optional email integration.

**Impact:** Highest urgency. Every conversion that doesn't get follow-up is a missed opportunity.

---

## Stream 2: Content Library (Pre-Decision Depth)

**Who it serves:** Seekers who want to understand more before deciding. Also improves SEO (topical pages rank for search queries).

**The gap:** The quiz is 3-8 questions. The grace section is 4 beats. Someone genuinely curious has no way to go deeper *on this site*. They either convert immediately or bounce.

**What to build:**

- **Topical pages** — standalone, beautifully designed pages for core gospel concepts:
  - "Who is Jesus?" — deity, humanity, historical evidence, why it matters
  - "What is sin?" — God's standard, the human condition, why it's universal
  - "Why the cross?" — substitutionary atonement explained simply, the courtroom metaphor expanded
  - "What is repentance?" — not just feeling sorry, turning + trusting, what it looks like practically
  - "What happens when I die?" — eternity, judgment, hope
- **Cross-linking** — these pages are linked from relevant points in the quiz, chat, and eternity flows. E.g., after the grace beats, a "Learn more about what Jesus did" link to the cross page.
- **Each page ends with a soft CTA** — "Ready to respond?" → links back to the test or chat.
- **SEO-optimized** — proper meta tags, structured data, answer-style content for featured snippets.

**Technical scope:** 5-6 new static pages, i18n content (significant translation effort), cross-linking updates to existing flows, SEO meta.

**Impact:** Medium-term growth driver. These pages can rank in search and serve as entry points for organic traffic.

---

## Stream 3: Sharer Toolkit

**Who it serves:** Christians who share the site as an evangelism tool.

**The gap:** Share buttons exist but are generic. There's no way to know if anyone you shared with actually engaged. No personalization, no campaign support.

**What to build:**

- **Personal share links** — `/{locale}?ref=abc123`. Each sharer gets a unique ref code (generated client-side, stored in localStorage). When someone visits via a ref link, the referrer's code is tracked in PostHog.
- **Share dashboard** — simple page showing "X people visited from your link, Y took the quiz, Z responded." Read from PostHog API or a lightweight Vercel KV counter.
- **Campaign landing pages** — themed entry points for events: Easter, Christmas, evangelism weeks. Same quiz/content, different hero messaging and visuals. Driven by URL params or dedicated routes.
- **Embeddable widget** — a `<script>` or `<iframe>` that surfaces a mini version of the quiz (2-3 questions) on any website, with a CTA to the full site. For churches, blogs, etc.
- **QR code generator** — for physical distribution (flyers, posters). Generates a QR code pointing to the site with a ref code.

**Technical scope:** Ref link tracking (PostHog properties), lightweight KV for counters, 1-2 new pages, optional embeddable widget.

**Impact:** Force multiplier. Turns every satisfied user into a distribution channel. But depends on having content worth sharing (Streams 1+2 improve what's being shared).

---

## Recommended Order

1. **Stream 1 (Discipleship)** — fix the biggest leak first. People who respond deserve follow-up.
2. **Stream 2 (Content Library)** — add depth that makes the site worth exploring and SEO-viable.
3. **Stream 3 (Sharer Toolkit)** — amplify distribution once the destination is worth sharing.

Each stream is independent and gets its own spec → plan → implementation cycle.
