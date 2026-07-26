# Find-a-Church Explainer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop recommending specific churches (drop both external directory links) and replace them with an on-site explainer, `/find-a-church`, that encourages finding a biblically-sound church and teaches the gospel marks to look for — framed the Living Waters way (by the gospel, never by denomination).

**Architecture:** One new standalone `(content)` page mirroring `/cards` (own `page.tsx` + a `findChurch` messages block, english slug for both locales, chrome supplied by `(content)/layout.tsx`). Two existing inbound links repoint from external directories to this page: the committed next-steps secondary and the footer "Find a Church" link. The two external directory URLs (`9marks.org/church-search`, a Google Maps pin) are removed from use. All doctrinal copy is DRAFTED here for the owner to finalize before it ships.

**Tech Stack:** Next.js 16 (App Router, Turbopack), React 19, Tailwind v4, TypeScript, lucide-react, Vitest, Biome, pnpm.

## Global Constraints

- **Living Waters framing (binding):** frame church-finding by the **gospel**, never by denomination. No denomination is named — not to condemn ("avoid X") and not to endorse ("go to Y"). The filter is the message preached (Scripture as final authority; salvation by grace alone, through faith alone, in Christ alone; Christ central), plus ONE irenic non-tribal line that faithful believers exist across traditions and the test is the gospel, not the label. Aligns with the method's "churches parked" stance.
- **No specific church or directory is recommended.** Remove the `9marks` / Google-Maps directory links from use. The explainer carries NO outbound church-directory link.
- **Owner approval before ship (doctrinal + outward-facing):** the EN/PT copy in Task 1 is a DRAFT. Present it to the owner for approval before the final commit/push. Do not treat drafted doctrinal copy as shippable without a yes.
- **i18n parity:** `src/__tests__/i18n-validate.test.ts` enforces identical key shape across `en.json`/`pt.json`. Every `findChurch` key (and nested `marks[]` object shape) must exist in both locales.
- **Slug is english for both locales:** `/find-a-church` (consistent with `/cards`, `/next-steps`, `/reading-plan`). Content localizes; the path does not.
- **Read Next 16 docs before coding** (`node_modules/next/dist/docs/`) for the App-Router page/metadata API — `generateStaticParams`, `generateMetadata`, `Metadata` type. Mirror `/cards/page.tsx` exactly; do not invent new patterns.
- **Gates before commit:** `pnpm lint && pnpm test && npx tsc --noEmit` (also runs pre-push).
- **Preserve analytics:** the committed secondary keeps `trackNextStepsActionClicked("community", "committed")`.

## File Structure

- **Create:** `src/app/[locale]/(content)/find-a-church/page.tsx` — the explainer page (mirrors `/cards/page.tsx`: `generateStaticParams`, `generateMetadata`, a `<main>` rendering the `findChurch` block). Indexable.
- **Modify:** `src/messages/en.json`, `src/messages/pt.json` — add the `findChurch` block; reword `nextSteps.trackA.communityLinkLabel`; leave `footer.churchLink` label, stop using `footer.churchUrl` / `nextSteps.trackA.communityLink`.
- **Modify:** `src/components/next-steps/track-committed.tsx` — repoint the community secondary from an external `<a>` to an internal `<Link href={/${locale}/find-a-church}>`.
- **Modify:** `src/components/shared/footer.tsx:127-134` — repoint the church `<a target="_blank">` to an internal `<Link href={/${locale}/find-a-church}>`.
- **Modify:** `src/app/sitemap.ts:16` — add `/find-a-church` to `staticPages`.
- **Unchanged, depended upon:** `src/app/[locale]/(content)/layout.tsx` (supplies TopBar + Footer chrome), `@/lib/seo` (`buildPageMetadata`), `@/lib/i18n` (`isValidLocale`, `SUPPORTED_LOCALES`, `Locale`).

---

## Task 1: Add the `findChurch` copy (both locales) — DRAFT for owner approval

**Files:**
- Modify: `src/messages/en.json` (add `findChurch` block; reword one existing value)
- Modify: `src/messages/pt.json` (add `findChurch` block; reword one existing value)
- Verify: `src/__tests__/i18n-validate.test.ts`

**Interfaces:**
- Produces: a `findChurch` object consumed by Task 2's page. Shape:
  ```ts
  interface FindChurchMessages {
    title: string;
    metaDescription: string;
    intro: string;
    marksHeading: string;
    marks: Array<{ mark: string; detail: string }>;
    filterLine: string;
    nudge: string;
    closing: string;
  }
  ```

- [ ] **Step 1: Add the `findChurch` block to `en.json`**

Insert a top-level `"findChurch"` key (place it near `"cards"` / other page blocks). Draft content:
```json
"findChurch": {
  "title": "Finding a church",
  "metaDescription": "You weren't meant to walk this alone. How to find a church where the Bible is preached and the gospel is right — and what to look for.",
  "intro": "You weren't meant to do this alone. A new believer grows in a local church — a family that reads the Bible together, prays together, and helps you follow Jesus. But not every church preaches the same message, so it's worth knowing what to look for.",
  "marksHeading": "What to look for",
  "marks": [
    { "mark": "The Bible as its final authority", "detail": "The Scriptures are opened, read, and taught — not replaced by tradition, a leader's opinions, or private revelation." },
    { "mark": "Salvation by grace alone, through faith alone, in Christ alone", "detail": "Forgiveness is a free gift received by trusting Jesus — never something you earn by works, rituals, sacraments, or good behaviour." },
    { "mark": "Jesus Christ at the centre", "detail": "The focus is on who Jesus is and what He did on the cross — not on money, self-improvement, or the church's own importance." },
    { "mark": "A changed people", "detail": "You'll see people who love God and each other, take sin seriously, and point you to Christ rather than to themselves." }
  ],
  "filterLine": "The test is the gospel a church preaches — not the name over its door. Faithful believers are found across many traditions, and unfaithful ones in churches with the right label. So weigh what you hear against the Bible, not against what's familiar.",
  "nudge": "Don't assume the nearest or most familiar church preaches this. Visit, listen, and open the Bible for yourself — a good church will be glad you're testing what they say against Scripture.",
  "closing": "Pray that God would lead you to such a church, and start looking this week. Ask a Christian you trust where the Bible is faithfully preached."
}
```

- [ ] **Step 2: Reword the committed secondary label in `en.json`**

The secondary now points at this explainer, not a directory. Change `nextSteps.trackA.communityLinkLabel`:
```
"Find believers to walk with"  →  "Find a Bible-believing church"
```

- [ ] **Step 3: Add the `findChurch` block to `pt.json` (DRAFT — owner verifies)**

Insert the matching `"findChurch"` key with the same shape. Draft PT:
```json
"findChurch": {
  "title": "Encontrar uma igreja",
  "metaDescription": "Não foste feito para caminhar sozinho. Como encontrar uma igreja onde a Bíblia é pregada e o evangelho é fiel — e o que procurar.",
  "intro": "Não foste feito para fazer isto sozinho. Um novo crente cresce numa igreja local — uma família que lê a Bíblia em conjunto, ora em conjunto e te ajuda a seguir Jesus. Mas nem todas as igrejas pregam a mesma mensagem, por isso vale a pena saber o que procurar.",
  "marksHeading": "O que procurar",
  "marks": [
    { "mark": "A Bíblia como autoridade final", "detail": "As Escrituras são abertas, lidas e ensinadas — não substituídas pela tradição, pelas opiniões de um líder ou por revelações privadas." },
    { "mark": "Salvação só pela graça, só mediante a fé, só em Cristo", "detail": "O perdão é um dom gratuito recebido ao confiar em Jesus — nunca algo que se ganha por obras, rituais, sacramentos ou bom comportamento." },
    { "mark": "Jesus Cristo no centro", "detail": "O foco está em quem Jesus é e no que fez na cruz — não em dinheiro, autoaperfeiçoamento ou na importância da própria igreja." },
    { "mark": "Um povo transformado", "detail": "Verás pessoas que amam Deus e umas às outras, levam o pecado a sério e te apontam para Cristo, e não para si mesmas." }
  ],
  "filterLine": "O teste é o evangelho que uma igreja prega — não o nome à porta. Há crentes fiéis em muitas tradições, e infiéis em igrejas com o rótulo certo. Por isso, pesa o que ouves à luz da Bíblia, e não do que te é familiar.",
  "nudge": "Não assumas que a igreja mais próxima ou mais familiar prega isto. Visita, ouve e abre tu mesmo a Bíblia — uma boa igreja ficará contente por estares a confrontar o que dizem com as Escrituras.",
  "closing": "Ora para que Deus te conduza a uma igreja assim, e começa a procurar esta semana. Pergunta a um cristão em quem confies onde a Bíblia é pregada com fidelidade."
}
```

- [ ] **Step 4: Reword the committed secondary label in `pt.json` (DRAFT — owner verifies)**

Change `nextSteps.trackA.communityLinkLabel`:
```
"Encontra irmãos para caminhar contigo"  →  "Encontrar uma igreja bíblica"
```

- [ ] **Step 5: Run the parity test**

Run:
```bash
pnpm test src/__tests__/i18n-validate.test.ts
```
Expected: PASS. Both locales now carry an identical `findChurch` shape (incl. the 4-element `marks[]` of `{mark, detail}`). If it fails, diff the two blocks for a missing/extra key.

- [ ] **Step 6: Present the drafted copy to the owner for approval, then commit**

Show the owner the EN + PT `findChurch` copy and the two reworded labels. On approval:
```bash
git add src/messages/en.json src/messages/pt.json
git commit -m "content: add find-a-church explainer copy (gospel-marks framing, both locales)"
```

---

## Task 2: Create the `/find-a-church` page

**Files:**
- Create: `src/app/[locale]/(content)/find-a-church/page.tsx`
- Modify: `src/app/sitemap.ts:16`

**Interfaces:**
- Consumes: `findChurch` from Task 1 (shape above). `buildPageMetadata` from `@/lib/seo`. `isValidLocale`, `SUPPORTED_LOCALES`, `Locale` from `@/lib/i18n`.
- Produces: the route `/{locale}/find-a-church`, targeted by Task 3's links.

- [ ] **Step 1: Create the page (mirror `/cards/page.tsx`)**

Create `src/app/[locale]/(content)/find-a-church/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

// On-site guidance for finding a biblically-sound church. We do NOT recommend
// a specific church or directory — the Living Waters way is to frame by the
// gospel a church preaches, never by its denomination. The page lists the
// gospel marks to look for plus one irenic, non-tribal line.

type Props = { params: Promise<{ locale: string }> };

interface FindChurchMessages {
  title: string;
  metaDescription: string;
  intro: string;
  marksHeading: string;
  marks: Array<{ mark: string; detail: string }>;
  filterLine: string;
  nudge: string;
  closing: string;
}

async function getData(locale: Locale): Promise<{ fc: FindChurchMessages; brand: string }> {
  const messages = await import(`@/messages/${locale}.json`);
  return {
    fc: messages.default.findChurch as FindChurchMessages,
    brand: messages.default.topBar.brand as string,
  };
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const { fc, brand } = await getData(locale);
  return buildPageMetadata({
    locale,
    path: "/find-a-church",
    title: `${fc.title} | ${brand}`,
    description: fc.metaDescription,
    robots: { index: true, follow: true },
  });
}

export default async function FindChurchPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const { fc } = await getData(locale as Locale);

  return (
    <main className="relative z-[1] mx-auto max-w-2xl px-6 py-16 sm:px-8">
      <h1
        className="text-3xl font-bold tracking-tight text-[#D4A843] sm:text-4xl"
        style={{ textShadow: "0 0 60px rgba(212,168,67,0.2)" }}
      >
        {fc.title}
      </h1>

      <p className="mt-6 text-[15px] leading-[1.85] text-white/70">{fc.intro}</p>

      <h2 className="mt-12 text-sm font-semibold uppercase tracking-[2px] text-white/60">
        {fc.marksHeading}
      </h2>
      <ul className="mt-5 space-y-5">
        {fc.marks.map((m) => (
          <li key={m.mark} className="rounded-xl border border-[#D4A843]/20 bg-[#D4A843]/[0.02] p-5">
            <p className="text-[15px] font-semibold text-[#D4A843]">{m.mark}</p>
            <p className="mt-2 text-sm leading-relaxed text-white/60">{m.detail}</p>
          </li>
        ))}
      </ul>

      {/* Irenic, non-tribal line — the gospel is the filter, not the label. */}
      <blockquote className="mt-10 border-l border-[#D4A843]/30 pl-5 text-[15px] italic leading-[1.85] text-white/70">
        {fc.filterLine}
      </blockquote>

      <p className="mt-8 text-[15px] leading-[1.85] text-white/70">{fc.nudge}</p>
      <p className="mt-6 text-[15px] leading-[1.85] text-white/70">{fc.closing}</p>
    </main>
  );
}
```

- [ ] **Step 2: Add the route to the sitemap**

In `src/app/sitemap.ts:16`, add `/find-a-church` to `staticPages`:
```ts
const staticPages = ["", "/test", "/reading-plan", "/learn", "/about", "/privacy", "/terms", "/find-a-church"];
```

- [ ] **Step 3: Typecheck + build**

Run:
```bash
npx tsc --noEmit && pnpm build
```
Expected: PASS; build shows `/find-a-church` prerendered (SSG) for each locale.

- [ ] **Step 4: Verify it renders (both locales)**

`pnpm start`, then:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/en/find-a-church
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/pt/find-a-church
```
Expected: `200` each. Load `/en/find-a-church` in a browser (390px): title, intro, four gospel-mark cards, the italic filter line, nudge, closing — no external church-directory link anywhere. Confirm PT renders the drafted copy.

- [ ] **Step 5: Commit**

```bash
git add src/app/[locale]/(content)/find-a-church/page.tsx src/app/sitemap.ts
git commit -m "feat: add /find-a-church explainer page (indexable, both locales)"
```

---

## Task 3: Repoint the two inbound links to `/find-a-church`

**Files:**
- Modify: `src/components/next-steps/track-committed.tsx` (community secondary)
- Modify: `src/components/shared/footer.tsx:127-134` (footer church link)

**Interfaces:**
- Consumes: the `/find-a-church` route from Task 2; the reworded `communityLinkLabel` from Task 1.

- [ ] **Step 1: Repoint the committed secondary (internal `Link`)**

In `src/components/next-steps/track-committed.tsx`, the community secondary is currently an external anchor:
```tsx
<a
  href={messages.communityLink}
  target="_blank"
  rel="noopener noreferrer"
  onClick={() => trackNextStepsActionClicked("community", "committed")}
  className="mt-5 flex min-h-[44px] items-center gap-3 rounded-lg border border-white/[0.08] px-4 py-2.5 text-sm text-white/70 transition-colors hover:border-[#D4A843]/25 hover:text-[#D4A843]/80"
>
  <Users className="size-4 shrink-0 text-white/50" aria-hidden="true" />
  <span className="flex-1">{messages.communityLinkLabel}</span>
  <span aria-hidden="true" className="text-white/40">&rarr;</span>
</a>
```
Replace it with an internal `Link` to the explainer (drop `communityLink`, `target`, `rel`):
```tsx
<Link
  href={`/${locale}/find-a-church`}
  onClick={() => trackNextStepsActionClicked("community", "committed")}
  className="mt-5 flex min-h-[44px] items-center gap-3 rounded-lg border border-white/[0.08] px-4 py-2.5 text-sm text-white/70 transition-colors hover:border-[#D4A843]/25 hover:text-[#D4A843]/80"
>
  <Users className="size-4 shrink-0 text-white/50" aria-hidden="true" />
  <span className="flex-1">{messages.communityLinkLabel}</span>
  <span aria-hidden="true" className="text-white/40">&rarr;</span>
</Link>
```
(`Link` is already imported in this file. `messages.communityLink` becomes unused — leave the key in JSON for parity; do not delete.)

- [ ] **Step 2: Repoint the footer church link (internal `Link`)**

In `src/components/shared/footer.tsx:127-134`, replace the external church anchor:
```tsx
<a
  href={messages.churchUrl}
  target="_blank"
  rel="noopener noreferrer"
  className="text-sm text-white/70 transition-colors hover:text-white/80"
>
  {messages.churchLink}
</a>
```
with an internal `Link` (matching the `reading-plan` link two rows above):
```tsx
<Link
  href={`/${locale}/find-a-church`}
  prefetch={false}
  className="text-sm text-white/70 transition-colors hover:text-white/80"
>
  {messages.churchLink}
</Link>
```
(`Link` is already imported in `footer.tsx`. `messages.churchUrl` becomes unused — leave the key for parity.)

- [ ] **Step 3: Typecheck + lint + test**

Run:
```bash
npx tsc --noEmit && pnpm lint && pnpm test
```
Expected: PASS; lint warning count stays at the pre-existing 9; 109 tests pass.

- [ ] **Step 4: Verify both entry points reach the page (no external directory left)**

`pnpm build && pnpm start`. In the browser (390px):
- Seed committed (`localStorage.setItem("gospel-journey", JSON.stringify({ version: 1, testCompletedAt: Date.now(), invitationResponse: "committed", respondedAt: Date.now() }))`), load `/en/next-steps`, click the "Find a Bible-believing church" secondary → lands on `/en/find-a-church` (same tab, no external nav).
- Scroll any page's footer, click "Find a Church" → lands on `/find-a-church`.
- Grep the running DOM / source to confirm no `9marks.org` or `maps.app.goo.gl` link is reachable from committed next-steps or the footer.

- [ ] **Step 5: Commit + push (after owner has approved Task 1 copy)**

```bash
git add src/components/next-steps/track-committed.tsx src/components/shared/footer.tsx
git commit -m "$(cat <<'EOF'
feat: repoint church links to the /find-a-church explainer

The committed next-steps secondary and the footer "Find a Church" link no
longer point to an external church directory (9marks / Google Maps). Both now
open the on-site explainer, which teaches the gospel marks of a sound church
without recommending any specific church or denomination.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GCuFmndcCWD1FAQbeLHCxx
EOF
)"
git push
```

---

## Self-Review

**1. Spec coverage:**
- Stop recommending churches → both external directory links (`communityLink`, `footer.churchUrl`) removed from use (Task 3). ✓
- Point to finding a biblically-sound church + explain it → `/find-a-church` page with gospel marks (Task 2, copy in Task 1). ✓
- Living Waters framing / "should we frame denominations?" → gospel-marks only, no denomination named, one irenic non-tribal `filterLine` (Global Constraints + Task 1 copy). ✓
- Catholic-Portugal nuance → handled implicitly via "grace alone, not works/rituals/sacraments" mark + "don't assume the most familiar church" nudge, without naming Catholicism. ✓
- On-site page mechanism (accepted fork) → standalone `(content)` page, not a `/learn` topic. ✓

**2. Placeholder scan:** No TBD/TODO. Full page code, full sitemap edit, full link replacements, complete EN + PT draft copy supplied. Owner-approval gate is explicit, not a placeholder. ✓

**3. Type consistency:** `FindChurchMessages` shape in Task 2 matches the JSON added in Task 1 (`title`, `metaDescription`, `intro`, `marksHeading`, `marks: {mark, detail}[]`, `filterLine`, `nudge`, `closing`). `buildPageMetadata` signature (`{ locale, path, title, description, robots }`) matches its use in `/cards/page.tsx`. `Link` already imported in both modified components. Analytics action `"community"` unchanged. Unused keys (`communityLink`, `churchUrl`) intentionally retained for i18n parity. ✓
