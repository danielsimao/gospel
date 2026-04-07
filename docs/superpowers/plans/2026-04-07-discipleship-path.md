# Discipleship Path Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a "What Now?" post-decision page and a 7-day reading plan, wired from the existing InvitationScreen.

**Architecture:** Two new route pages (next-steps, reading-plan) with client components for interactivity. Reading progress persists in localStorage. InvitationScreen gets a "What Now?" CTA that routes to the appropriate track. All content lives in i18n JSON.

**Tech Stack:** Next.js App Router, React, Framer Motion, localStorage, PostHog analytics, existing i18n pattern

**Spec:** `docs/superpowers/specs/2026-04-07-discipleship-path.md`

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/reading-storage.ts` | Create | Read/write reading plan progress in localStorage |
| `src/lib/discipleship-analytics.ts` | Create | Analytics events for next-steps + reading plan |
| `src/components/next-steps/track-prayed.tsx` | Create | Track A: "I prayed" content |
| `src/components/next-steps/track-thinking.tsx` | Create | Track B: "I want to think about it" content |
| `src/app/[locale]/next-steps/page.tsx` | Create | Next-steps route page |
| `src/components/reading-plan/day-card.tsx` | Create | Individual day card component |
| `src/components/reading-plan/reading-plan.tsx` | Create | Main reading plan client component |
| `src/app/[locale]/reading-plan/page.tsx` | Create | Reading plan route page |
| `src/components/invitation-screen.tsx` | Modify | Add "What Now?" CTA + dismissed soft return |
| `src/messages/en.json` | Modify | Add nextSteps + readingPlan keys |
| `src/messages/pt.json` | Modify | Same (PT translation) |

---

### Task 1: Reading Storage + Analytics Libs

**Files:**
- Create: `src/lib/reading-storage.ts`
- Create: `src/lib/discipleship-analytics.ts`

- [ ] **Step 1: Create reading-storage.ts**

```ts
// src/lib/reading-storage.ts
const STORAGE_KEY = "gospel-reading-progress";

export type ReadingProgress = Record<string, boolean>;

export function readProgress(): ReadingProgress {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    const result: ReadingProgress = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (value === true) result[key] = true;
    }
    return result;
  } catch (error) {
    console.warn("[reading-storage] Failed to read progress:", error);
    return {};
  }
}

export function markDayRead(day: number): void {
  if (typeof window === "undefined") return;
  try {
    const current = readProgress();
    current[String(day)] = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (error) {
    console.warn("[reading-storage] Failed to write progress:", error);
  }
}

export function getCompletedCount(progress: ReadingProgress, totalDays: number): number {
  let count = 0;
  for (let i = 1; i <= totalDays; i++) {
    if (progress[String(i)]) count++;
  }
  return count;
}
```

- [ ] **Step 2: Create discipleship-analytics.ts**

```ts
// src/lib/discipleship-analytics.ts
import posthog from "posthog-js";

function safeCapture(event: string, properties?: Record<string, unknown>) {
  try {
    posthog.capture(event, properties);
  } catch (error) {
    console.warn("[discipleship-analytics] Capture failed:", error);
  }
}

export function trackNextStepsViewed(track: "prayed" | "thinking", locale: string) {
  safeCapture("next_steps_viewed", { track, locale });
}

export function trackNextStepsActionClicked(
  action: "read" | "pray" | "community" | "share" | "reading_plan",
  track: "prayed" | "thinking",
) {
  safeCapture("next_steps_action_clicked", { action, track });
}

export function trackReadingPlanViewed(locale: string) {
  safeCapture("reading_plan_viewed", { locale });
}

export function trackReadingPlanDayCompleted(day: number, locale: string) {
  safeCapture("reading_plan_day_completed", { day, locale });
}

export function trackReadingPlanCompleted(locale: string) {
  safeCapture("reading_plan_completed", { total_days: 7, locale });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/reading-storage.ts src/lib/discipleship-analytics.ts
git commit -m "feat: add reading-storage and discipleship-analytics libs"
```

---

### Task 2: i18n — EN Messages

**Files:**
- Modify: `src/messages/en.json`

- [ ] **Step 1: Add `nextSteps` key after `share` at the top level**

Add the following new top-level key to `en.json` (after `"share": { ... }`, before `"meta": { ... }`):

```json
"nextSteps": {
  "cta": "What now?",
  "dismissedReturn": "Changed your mind? The reading plan is always open.",
  "trackA": {
    "welcome": "Something just changed.",
    "whatHappened": "You acknowledged that you've broken God's Law. You placed your trust in Jesus Christ — the One who paid the fine for your sins on the cross and rose from the dead.\n\nIf you meant that prayer sincerely, God has forgiven every sin you've ever committed and granted you eternal life. Not because you earned it — but because He loves you.\n\n\"Therefore, if anyone is in Christ, he is a new creation; old things have passed away; behold, all things have become new.\" — 2 Corinthians 5:17 (NKJV)",
    "readHeading": "Read",
    "readBody": "Start with the Gospel of John — it's the best place to meet Jesus for the first time. Or follow our 7-day reading plan.",
    "readLink": "https://www.bible.com/bible/114/JHN.1.NKJV",
    "readLinkLabel": "Read John 1",
    "readPlanLabel": "Start the 7-day plan",
    "prayHeading": "Pray",
    "prayBody": "Talk to God like a Father. He's listening.",
    "prayPrompt": "God, thank You for forgiving me. Help me to understand what You've done for me. Guide me as I read Your Word. Give me the courage to turn from sin and follow You. In Jesus' name, Amen.",
    "communityHeading": "Find Community",
    "communityBody": "You weren't meant to do this alone. Find a Bible-believing church where you can grow.",
    "communityLink": "https://www.9marks.org/church-search/",
    "communityLinkLabel": "Search for a church",
    "shareHeading": "Share Your Decision",
    "shareMessage": "I just made a decision that changes everything:"
  },
  "trackB": {
    "acknowledgment": "That's honest. Here are some things worth thinking about.",
    "reflections": [
      "If what you heard today is true, what would that change for you?",
      "Have you ever considered that the discomfort you feel might be your conscience agreeing with God's standard?",
      "What would it take for you to investigate this further?"
    ],
    "readingHeading": "One thing to read",
    "readingBody": "When you're ready, read John chapter 3. It's a conversation between Jesus and a man who had questions just like yours.",
    "readingLink": "https://www.bible.com/bible/114/JHN.3.NKJV",
    "readingLinkLabel": "Read John 3",
    "comeBack": "This site will be here whenever you're ready. Bookmark it, or start the reading plan when the time is right."
  }
},
```

- [ ] **Step 2: Add `readingPlan` key after `nextSteps`**

```json
"readingPlan": {
  "heading": "7-Day Reading Plan",
  "subtitle": "A week in the Gospel of John — meeting Jesus for yourself.",
  "progressLabel": "Day {current} of {total}",
  "markReadLabel": "Mark as read",
  "completedLabel": "Completed",
  "allCompleteHeading": "Well done.",
  "allCompleteBody": "You've finished the 7-day plan. But this is just the beginning — keep reading, keep praying, keep growing. The Gospel of John has 21 chapters. Why not keep going?",
  "continueReadingLink": "https://www.bible.com/bible/114/JHN.8.NKJV",
  "continueReadingLabel": "Continue reading John",
  "days": [
    {
      "title": "The Beginning",
      "passage": "John 1:1-18",
      "passageUrl": "https://www.bible.com/bible/114/JHN.1.NKJV",
      "keyVerse": "And the Word became flesh and dwelt among us, and we beheld His glory, the glory as of the only begotten of the Father, full of grace and truth.",
      "keyVerseRef": "John 1:14 (NKJV)",
      "reflection": "Before Jesus was born in Bethlehem, He existed eternally as God. He wasn't created — He was the Creator who stepped into His creation. The same God whose Law convicted you is the God who became a man to save you.",
      "prayer": "God, help me to understand who Jesus really is — not just a good teacher, but the Word made flesh. Open my eyes as I read. Amen."
    },
    {
      "title": "Born Again",
      "passage": "John 3:1-21",
      "passageUrl": "https://www.bible.com/bible/114/JHN.3.NKJV",
      "keyVerse": "Jesus answered and said to him, 'Most assuredly, I say to you, unless one is born again, he cannot see the kingdom of God.'",
      "keyVerseRef": "John 3:3 (NKJV)",
      "reflection": "Nicodemus was a religious leader — a 'good person' by anyone's standard. But Jesus told him that being good wasn't enough. You need a completely new start. That's what happened when you trusted Christ — you were born again.",
      "prayer": "Lord, thank You for giving me a new beginning. Help me to live as someone who has been born again — not trying to earn Your love, but resting in it. Amen."
    },
    {
      "title": "Living Water",
      "passage": "John 4:1-26",
      "passageUrl": "https://www.bible.com/bible/114/JHN.4.NKJV",
      "keyVerse": "Jesus answered and said to her, 'Whoever drinks of this water will thirst again, but whoever drinks of the water that I shall give him will never thirst.'",
      "keyVerseRef": "John 4:13-14 (NKJV)",
      "reflection": "Jesus met this woman at her lowest — ashamed, alone, avoiding others. He didn't condemn her. He offered her something that would satisfy forever. He meets you the same way — wherever you are, however you feel.",
      "prayer": "Jesus, I've tried to fill my life with things that don't last. Be my living water. Satisfy the thirst that nothing else can. Amen."
    },
    {
      "title": "The Good Shepherd",
      "passage": "John 10:1-18",
      "passageUrl": "https://www.bible.com/bible/114/JHN.10.NKJV",
      "keyVerse": "I am the good shepherd. The good shepherd gives His life for the sheep.",
      "keyVerseRef": "John 10:11 (NKJV)",
      "reflection": "A hired hand runs when danger comes. But Jesus — the Good Shepherd — willingly laid down His life. Nobody took it from Him. He chose the cross because He chose you.",
      "prayer": "Good Shepherd, thank You for not running when it cost You everything. Help me to hear Your voice and follow where You lead. Amen."
    },
    {
      "title": "The Way",
      "passage": "John 14:1-14",
      "passageUrl": "https://www.bible.com/bible/114/JHN.14.NKJV",
      "keyVerse": "Jesus said to him, 'I am the way, the truth, and the life. No one comes to the Father except through Me.'",
      "keyVerseRef": "John 14:6 (NKJV)",
      "reflection": "This is the most exclusive and the most inclusive claim ever made. Exclusive — there's only one way. Inclusive — anyone can take it. Jesus didn't say 'I'll show you the way.' He said 'I AM the way.'",
      "prayer": "Lord, in a world of many voices and many paths, give me confidence that You are the way. Help me to trust You even when I don't understand. Amen."
    },
    {
      "title": "The Vine",
      "passage": "John 15:1-17",
      "passageUrl": "https://www.bible.com/bible/114/JHN.15.NKJV",
      "keyVerse": "I am the vine, you are the branches. He who abides in Me, and I in him, bears much fruit; for without Me you can do nothing.",
      "keyVerseRef": "John 15:5 (NKJV)",
      "reflection": "The Christian life isn't about trying harder. It's about staying connected. A branch doesn't strain to produce fruit — it just stays attached to the vine. Your job is to abide. Stay close. Read. Pray. Trust.",
      "prayer": "Jesus, teach me what it means to abide in You — not to perform for You, but to remain in Your love and let You work through me. Amen."
    },
    {
      "title": "Risen",
      "passage": "John 20:1-31",
      "passageUrl": "https://www.bible.com/bible/114/JHN.20.NKJV",
      "keyVerse": "Jesus said to him, 'Thomas, because you have seen Me, you have believed. Blessed are those who have not seen and yet have believed.'",
      "keyVerseRef": "John 20:29 (NKJV)",
      "reflection": "Thomas doubted. Jesus didn't reject him — He showed up. If you have doubts, bring them to God. He's not afraid of your questions. The resurrection is the foundation of everything — if Jesus rose, then everything He said is true.",
      "prayer": "Risen Lord, strengthen my faith. When doubts come, remind me that You are alive and that Your promises are sure. Help me to live boldly for You. Amen."
    }
  ]
},
```

- [ ] **Step 3: Verify JSON is valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('src/messages/en.json','utf8')); console.log('valid')"`

Expected: `valid`

- [ ] **Step 4: Commit**

```bash
git add src/messages/en.json
git commit -m "feat: add EN i18n content for next-steps and 7-day reading plan"
```

---

### Task 3: i18n — PT Messages

**Files:**
- Modify: `src/messages/pt.json`

- [ ] **Step 1: Add `nextSteps` key (same position as EN)**

```json
"nextSteps": {
  "cta": "E agora?",
  "dismissedReturn": "Mudaste de ideias? O plano de leitura está sempre aberto.",
  "trackA": {
    "welcome": "Algo acabou de mudar.",
    "whatHappened": "Reconheceste que quebraste a Lei de Deus. Colocaste a tua confiança em Jesus Cristo — Aquele que pagou a multa pelos teus pecados na cruz e ressuscitou dos mortos.\n\nSe fizeste essa oração com sinceridade, Deus perdoou todos os pecados que alguma vez cometeste e concedeu-te a vida eterna. Não porque o mereceste — mas porque Ele te ama.\n\n\"Assim que, se alguém está em Cristo, nova criatura é; as coisas velhas já passaram; eis que tudo se fez novo.\" — 2 Coríntios 5:17 (ACF)",
    "readHeading": "Lê",
    "readBody": "Começa pelo Evangelho de João — é o melhor lugar para conhecer Jesus pela primeira vez. Ou segue o nosso plano de leitura de 7 dias.",
    "readLink": "https://www.bible.com/bible/212/JHN.1.ARC",
    "readLinkLabel": "Ler João 1",
    "readPlanLabel": "Começar o plano de 7 dias",
    "prayHeading": "Ora",
    "prayBody": "Fala com Deus como um Pai. Ele está a ouvir.",
    "prayPrompt": "Deus, obrigado por me perdoares. Ajuda-me a compreender o que fizeste por mim. Guia-me enquanto leio a Tua Palavra. Dá-me coragem para abandonar o pecado e seguir-Te. Em nome de Jesus, Amém.",
    "communityHeading": "Encontra Comunidade",
    "communityBody": "Não foste feito para fazer isto sozinho. Encontra uma igreja que crê na Bíblia onde possas crescer.",
    "communityLink": "https://maps.app.goo.gl/NMMMdeJa5H5BR5Vp9",
    "communityLinkLabel": "Ver igrejas",
    "shareHeading": "Partilha a Tua Decisão",
    "shareMessage": "Acabei de tomar uma decisão que muda tudo:"
  },
  "trackB": {
    "acknowledgment": "Isso é honesto. Aqui ficam algumas coisas em que vale a pena pensar.",
    "reflections": [
      "Se o que ouviste hoje for verdade, o que é que isso mudaria na tua vida?",
      "Já consideraste que o desconforto que sentes pode ser a tua consciência a concordar com o padrão de Deus?",
      "O que seria preciso para investigares isto mais a fundo?"
    ],
    "readingHeading": "Uma coisa para ler",
    "readingBody": "Quando estiveres pronto, lê João capítulo 3. É uma conversa entre Jesus e um homem que tinha perguntas como as tuas.",
    "readingLink": "https://www.bible.com/bible/212/JHN.3.ARC",
    "readingLinkLabel": "Ler João 3",
    "comeBack": "Este site estará aqui sempre que estiveres pronto. Guarda nos favoritos, ou começa o plano de leitura quando achares que é a altura."
  }
},
```

- [ ] **Step 2: Add `readingPlan` key**

```json
"readingPlan": {
  "heading": "Plano de Leitura de 7 Dias",
  "subtitle": "Uma semana no Evangelho de João — conhece Jesus por ti mesmo.",
  "progressLabel": "Dia {current} de {total}",
  "markReadLabel": "Marcar como lido",
  "completedLabel": "Concluído",
  "allCompleteHeading": "Muito bem.",
  "allCompleteBody": "Terminaste o plano de 7 dias. Mas isto é apenas o começo — continua a ler, a orar e a crescer. O Evangelho de João tem 21 capítulos. Porque não continuar?",
  "continueReadingLink": "https://www.bible.com/bible/212/JHN.8.ARC",
  "continueReadingLabel": "Continuar a ler João",
  "days": [
    {
      "title": "O Princípio",
      "passage": "João 1:1-18",
      "passageUrl": "https://www.bible.com/bible/212/JHN.1.ARC",
      "keyVerse": "E o Verbo se fez carne, e habitou entre nós, e vimos a sua glória, como a glória do unigénito do Pai, cheio de graça e de verdade.",
      "keyVerseRef": "João 1:14 (ARC)",
      "reflection": "Antes de Jesus nascer em Belém, Ele existia eternamente como Deus. Não foi criado — foi o Criador que entrou na Sua criação. O mesmo Deus cuja Lei te condenou é o Deus que se fez homem para te salvar.",
      "prayer": "Deus, ajuda-me a compreender quem Jesus realmente é — não apenas um bom mestre, mas o Verbo feito carne. Abre os meus olhos enquanto leio. Amém."
    },
    {
      "title": "Nascer de Novo",
      "passage": "João 3:1-21",
      "passageUrl": "https://www.bible.com/bible/212/JHN.3.ARC",
      "keyVerse": "Jesus respondeu, e disse-lhe: Na verdade, na verdade te digo que aquele que não nascer de novo, não pode ver o reino de Deus.",
      "keyVerseRef": "João 3:3 (ARC)",
      "reflection": "Nicodemos era um líder religioso — uma 'boa pessoa' por qualquer padrão. Mas Jesus disse-lhe que ser bom não era suficiente. Precisas de um começo completamente novo. Foi isso que aconteceu quando confiaste em Cristo — nasceste de novo.",
      "prayer": "Senhor, obrigado por me dares um novo começo. Ajuda-me a viver como alguém que nasceu de novo — não tentando merecer o Teu amor, mas descansando nele. Amém."
    },
    {
      "title": "Água Viva",
      "passage": "João 4:1-26",
      "passageUrl": "https://www.bible.com/bible/212/JHN.4.ARC",
      "keyVerse": "Jesus respondeu, e disse-lhe: Qualquer que beber desta água tornará a ter sede; mas aquele que beber da água que eu lhe der nunca terá sede.",
      "keyVerseRef": "João 4:13-14 (ARC)",
      "reflection": "Jesus encontrou esta mulher no seu pior momento — envergonhada, sozinha, a evitar os outros. Não a condenou. Ofereceu-lhe algo que a satisfaria para sempre. Ele encontra-te da mesma forma — onde quer que estejas, como quer que te sintas.",
      "prayer": "Jesus, tentei preencher a minha vida com coisas que não duram. Sê a minha água viva. Satisfaz a sede que nada mais consegue. Amém."
    },
    {
      "title": "O Bom Pastor",
      "passage": "João 10:1-18",
      "passageUrl": "https://www.bible.com/bible/212/JHN.10.ARC",
      "keyVerse": "Eu sou o bom Pastor; o bom Pastor dá a sua vida pelas ovelhas.",
      "keyVerseRef": "João 10:11 (ARC)",
      "reflection": "Um mercenário foge quando o perigo vem. Mas Jesus — o Bom Pastor — voluntariamente deu a Sua vida. Ninguém a tirou d'Ele. Escolheu a cruz porque te escolheu a ti.",
      "prayer": "Bom Pastor, obrigado por não fugires quando Te custou tudo. Ajuda-me a ouvir a Tua voz e a seguir para onde me guias. Amém."
    },
    {
      "title": "O Caminho",
      "passage": "João 14:1-14",
      "passageUrl": "https://www.bible.com/bible/212/JHN.14.ARC",
      "keyVerse": "Disse-lhe Jesus: Eu sou o caminho, e a verdade e a vida; ninguém vem ao Pai, senão por mim.",
      "keyVerseRef": "João 14:6 (ARC)",
      "reflection": "Esta é a afirmação mais exclusiva e mais inclusiva alguma vez feita. Exclusiva — há apenas um caminho. Inclusiva — qualquer um pode segui-lo. Jesus não disse 'Eu mostro-te o caminho.' Disse 'Eu SOU o caminho.'",
      "prayer": "Senhor, num mundo de muitas vozes e muitos caminhos, dá-me confiança de que Tu és o caminho. Ajuda-me a confiar em Ti mesmo quando não compreendo. Amém."
    },
    {
      "title": "A Videira",
      "passage": "João 15:1-17",
      "passageUrl": "https://www.bible.com/bible/212/JHN.15.ARC",
      "keyVerse": "Eu sou a videira, vós as varas; quem está em mim, e eu nele, esse dá muito fruto; porque sem mim nada podeis fazer.",
      "keyVerseRef": "João 15:5 (ARC)",
      "reflection": "A vida cristã não é sobre esforçar-te mais. É sobre permaneceres conectado. Um ramo não se esforça para produzir fruto — simplesmente fica ligado à videira. O teu trabalho é permanecer. Fica perto. Lê. Ora. Confia.",
      "prayer": "Jesus, ensina-me o que significa permanecer em Ti — não actuar para Ti, mas permanecer no Teu amor e deixar-Te trabalhar através de mim. Amém."
    },
    {
      "title": "Ressuscitado",
      "passage": "João 20:1-31",
      "passageUrl": "https://www.bible.com/bible/212/JHN.20.ARC",
      "keyVerse": "Disse-lhe Jesus: Porque me viste, Tomé, creste; bem-aventurados os que não viram e creram.",
      "keyVerseRef": "João 20:29 (ARC)",
      "reflection": "Tomé duvidou. Jesus não o rejeitou — apareceu-lhe. Se tens dúvidas, leva-as a Deus. Ele não tem medo das tuas perguntas. A ressurreição é o fundamento de tudo — se Jesus ressuscitou, então tudo o que Ele disse é verdade.",
      "prayer": "Senhor ressuscitado, fortalece a minha fé. Quando as dúvidas vierem, lembra-me de que estás vivo e que as Tuas promessas são seguras. Ajuda-me a viver corajosamente para Ti. Amém."
    }
  ]
},
```

- [ ] **Step 3: Verify JSON is valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('src/messages/pt.json','utf8')); console.log('valid')"`

Expected: `valid`

- [ ] **Step 4: Commit**

```bash
git add src/messages/pt.json
git commit -m "feat: add PT i18n content for next-steps and 7-day reading plan"
```

---

### Task 4: Next-Steps Track Components

**Files:**
- Create: `src/components/next-steps/track-prayed.tsx`
- Create: `src/components/next-steps/track-thinking.tsx`

- [ ] **Step 1: Create track-prayed.tsx**

```tsx
// src/components/next-steps/track-prayed.tsx
"use client";

import { motion } from "framer-motion";
import { ShareButtons } from "@/components/share-buttons";
import { trackNextStepsActionClicked } from "@/lib/discipleship-analytics";
import type { Locale } from "@/lib/i18n";

interface TrackPrayedMessages {
  welcome: string;
  whatHappened: string;
  readHeading: string;
  readBody: string;
  readLink: string;
  readLinkLabel: string;
  readPlanLabel: string;
  prayHeading: string;
  prayBody: string;
  prayPrompt: string;
  communityHeading: string;
  communityBody: string;
  communityLink: string;
  communityLinkLabel: string;
  shareHeading: string;
  shareMessage: string;
}

interface TrackPrayedProps {
  messages: TrackPrayedMessages;
  shareMessages: { prompt: string; whatsappMessage: string; telegramMessage: string; linkCopied: string };
  locale: Locale;
}

const stagger = (i: number) => ({ duration: 0.8, delay: 0.3 + i * 0.2 });

export function TrackPrayed({ messages, shareMessages, locale }: TrackPrayedProps) {
  const paragraphs = messages.whatHappened.split("\n\n");

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6 sm:py-24">
      {/* Welcome */}
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="text-3xl font-bold tracking-tight text-[#D4A843] sm:text-4xl"
        style={{ textShadow: "0 0 60px rgba(212,168,67,0.2)" }}
      >
        {messages.welcome}
      </motion.h1>

      {/* What happened */}
      <div className="mt-8 space-y-5">
        {paragraphs.map((p, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={stagger(i)}
            className="text-[15px] leading-[1.85] text-white/60 sm:text-base"
          >
            {p}
          </motion.p>
        ))}
      </div>

      {/* Action cards */}
      <div className="mt-12 space-y-4">
        {/* Read */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={stagger(paragraphs.length)}
          className="rounded-xl border border-[#D4A843]/20 bg-[#D4A843]/[0.02] p-5"
        >
          <h3 className="text-sm font-semibold tracking-wide text-[#D4A843]">{messages.readHeading}</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/50">{messages.readBody}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={messages.readLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackNextStepsActionClicked("read", "prayed")}
              className="rounded-lg border border-[#D4A843]/30 px-4 py-2 text-xs font-medium text-[#D4A843] transition-colors hover:bg-[#D4A843]/[0.06] min-h-[44px] flex items-center"
            >
              {messages.readLinkLabel} &rarr;
            </a>
            <a
              href={`/${locale}/reading-plan`}
              onClick={() => trackNextStepsActionClicked("reading_plan", "prayed")}
              className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-white/50 transition-colors hover:bg-white/5 min-h-[44px] flex items-center"
            >
              {messages.readPlanLabel} &rarr;
            </a>
          </div>
        </motion.div>

        {/* Pray */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={stagger(paragraphs.length + 1)}
          className="rounded-xl border border-[#D4A843]/20 bg-[#D4A843]/[0.02] p-5"
        >
          <h3 className="text-sm font-semibold tracking-wide text-[#D4A843]">{messages.prayHeading}</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/50">{messages.prayBody}</p>
          <blockquote
            className="mt-3 border-l border-[#D4A843]/30 pl-4 text-sm italic leading-relaxed text-white/45"
            onClick={() => trackNextStepsActionClicked("pray", "prayed")}
          >
            {messages.prayPrompt}
          </blockquote>
        </motion.div>

        {/* Community */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={stagger(paragraphs.length + 2)}
          className="rounded-xl border border-[#D4A843]/20 bg-[#D4A843]/[0.02] p-5"
        >
          <h3 className="text-sm font-semibold tracking-wide text-[#D4A843]">{messages.communityHeading}</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/50">{messages.communityBody}</p>
          <a
            href={messages.communityLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackNextStepsActionClicked("community", "prayed")}
            className="mt-3 inline-flex items-center rounded-lg border border-[#D4A843]/30 px-4 py-2 text-xs font-medium text-[#D4A843] transition-colors hover:bg-[#D4A843]/[0.06] min-h-[44px]"
          >
            {messages.communityLinkLabel} &rarr;
          </a>
        </motion.div>
      </div>

      {/* Share */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={stagger(paragraphs.length + 3)}
        className="mt-12"
        onClick={() => trackNextStepsActionClicked("share", "prayed")}
      >
        <p className="text-center text-sm text-white/30">{messages.shareHeading}</p>
        <ShareButtons
          messages={{ ...shareMessages, whatsappMessage: messages.shareMessage, telegramMessage: messages.shareMessage }}
          locale={locale}
        />
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Create track-thinking.tsx**

```tsx
// src/components/next-steps/track-thinking.tsx
"use client";

import { motion } from "framer-motion";
import { trackNextStepsActionClicked } from "@/lib/discipleship-analytics";
import type { Locale } from "@/lib/i18n";

interface TrackThinkingMessages {
  acknowledgment: string;
  reflections: string[];
  readingHeading: string;
  readingBody: string;
  readingLink: string;
  readingLinkLabel: string;
  comeBack: string;
}

interface TrackThinkingProps {
  messages: TrackThinkingMessages;
  locale: Locale;
}

export function TrackThinking({ messages, locale }: TrackThinkingProps) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6 sm:py-24">
      {/* Acknowledgment */}
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="text-2xl font-bold tracking-tight text-white/90 sm:text-3xl"
      >
        {messages.acknowledgment}
      </motion.h1>

      {/* Reflections */}
      <div className="mt-10 space-y-6">
        {messages.reflections.map((question, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 + i * 0.3 }}
            className="border-l border-white/10 pl-5"
          >
            <p className="text-[15px] leading-relaxed text-white/55 sm:text-base italic">{question}</p>
          </motion.div>
        ))}
      </div>

      {/* One key reading */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 + messages.reflections.length * 0.3 }}
        className="mt-12 rounded-xl border border-white/10 bg-white/[0.02] p-5"
      >
        <h3 className="text-sm font-semibold tracking-wide text-white/70">{messages.readingHeading}</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/45">{messages.readingBody}</p>
        <a
          href={messages.readingLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackNextStepsActionClicked("read", "thinking")}
          className="mt-3 inline-flex items-center rounded-lg border border-white/15 px-4 py-2 text-xs font-medium text-white/50 transition-colors hover:bg-white/5 min-h-[44px]"
        >
          {messages.readingLinkLabel} &rarr;
        </a>
      </motion.div>

      {/* Come back */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 + (messages.reflections.length + 1) * 0.3 }}
        className="mt-10 text-center"
      >
        <p className="text-sm leading-relaxed text-white/35">{messages.comeBack}</p>
        <a
          href={`/${locale}/reading-plan`}
          onClick={() => trackNextStepsActionClicked("reading_plan", "thinking")}
          className="mt-4 inline-flex items-center text-sm text-white/40 transition-colors hover:text-white/60"
        >
          7-day reading plan &rarr;
        </a>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/next-steps/track-prayed.tsx src/components/next-steps/track-thinking.tsx
git commit -m "feat: add next-steps track components (prayed + thinking)"
```

---

### Task 5: Next-Steps Route Page

**Files:**
- Create: `src/app/[locale]/next-steps/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// src/app/[locale]/next-steps/page.tsx
import { notFound } from "next/navigation";
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { NextStepsClient } from "./client";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ track?: string }>;
};

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default async function NextStepsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const { track } = await searchParams;
  const messages = await import(`@/messages/${locale}.json`);
  const data = messages.default;

  return (
    <NextStepsClient
      track={track === "thinking" ? "thinking" : "prayed"}
      nextStepsMessages={data.nextSteps}
      shareMessages={data.share}
      locale={locale as Locale}
    />
  );
}
```

- [ ] **Step 2: Create the client wrapper**

```tsx
// src/app/[locale]/next-steps/client.tsx
"use client";

import { useEffect } from "react";
import { TrackPrayed } from "@/components/next-steps/track-prayed";
import { TrackThinking } from "@/components/next-steps/track-thinking";
import { trackNextStepsViewed } from "@/lib/discipleship-analytics";
import type { Locale } from "@/lib/i18n";

interface NextStepsClientProps {
  track: "prayed" | "thinking";
  nextStepsMessages: {
    trackA: Parameters<typeof TrackPrayed>[0]["messages"];
    trackB: Parameters<typeof TrackThinking>[0]["messages"];
  };
  shareMessages: { prompt: string; whatsappMessage: string; telegramMessage: string; linkCopied: string };
  locale: Locale;
}

export function NextStepsClient({ track, nextStepsMessages, shareMessages, locale }: NextStepsClientProps) {
  useEffect(() => {
    trackNextStepsViewed(track, locale);
  }, [track, locale]);

  return (
    <main className="min-h-dvh bg-[#060404] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#060404_75%)]" />
      <div className="relative z-[1]">
        {track === "prayed" ? (
          <TrackPrayed messages={nextStepsMessages.trackA} shareMessages={shareMessages} locale={locale} />
        ) : (
          <TrackThinking messages={nextStepsMessages.trackB} locale={locale} />
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Verify it compiles**

Run: `pnpm tsc --noEmit 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/next-steps/
git commit -m "feat: add next-steps route page with track routing"
```

---

### Task 6: Reading Plan Components

**Files:**
- Create: `src/components/reading-plan/day-card.tsx`
- Create: `src/components/reading-plan/reading-plan.tsx`

- [ ] **Step 1: Create day-card.tsx**

```tsx
// src/components/reading-plan/day-card.tsx
"use client";

import { motion } from "framer-motion";

interface DayCardMessages {
  title: string;
  passage: string;
  passageUrl: string;
  keyVerse: string;
  keyVerseRef: string;
  reflection: string;
  prayer: string;
}

interface DayCardProps {
  day: number;
  messages: DayCardMessages;
  isCompleted: boolean;
  isCurrent: boolean;
  markReadLabel: string;
  completedLabel: string;
  onMarkRead: () => void;
}

export function DayCard({ day, messages, isCompleted, isCurrent, markReadLabel, completedLabel, onMarkRead }: DayCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isCompleted && !isCurrent ? 0.4 : 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`rounded-xl border p-5 sm:p-6 ${
        isCurrent
          ? "border-[#D4A843]/30 bg-[#D4A843]/[0.02] border-l-2 border-l-[#D4A843]"
          : isCompleted
          ? "border-white/[0.04] bg-white/[0.01]"
          : "border-white/[0.06] bg-white/[0.015]"
      }`}
    >
      {/* Day header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[2px] text-[#D4A843]/50">
            Day {day}
          </span>
          <h3 className="text-base font-semibold text-white/90 sm:text-lg">{messages.title}</h3>
        </div>
        {isCompleted && (
          <span className="font-mono text-[9px] uppercase tracking-[2px] text-[#D4A843]/50">
            {completedLabel}
          </span>
        )}
      </div>

      {/* Passage link */}
      <a
        href={messages.passageUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center text-sm font-medium text-[#D4A843]/80 transition-colors hover:text-[#D4A843]"
      >
        {messages.passage} &rarr;
      </a>

      {/* Key verse */}
      <blockquote className="mt-4 border-l border-[#D4A843]/30 pl-4">
        <p className="text-sm italic leading-[1.8] text-white/50">
          &ldquo;{messages.keyVerse}&rdquo;
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-[#D4A843]/35">
          {messages.keyVerseRef}
        </p>
      </blockquote>

      {/* Reflection */}
      <p className="mt-4 text-sm leading-relaxed text-white/50">{messages.reflection}</p>

      {/* Prayer */}
      <div className="mt-4 rounded-lg bg-white/[0.02] p-3">
        <p className="text-sm italic leading-relaxed text-white/40">{messages.prayer}</p>
      </div>

      {/* Mark as read */}
      {!isCompleted && (
        <button
          onClick={onMarkRead}
          className="mt-4 rounded-lg border border-[#D4A843]/25 px-4 py-2 text-xs font-medium text-[#D4A843]/70 transition-all hover:border-[#D4A843]/40 hover:bg-[#D4A843]/[0.05] hover:text-[#D4A843] min-h-[44px]"
        >
          {markReadLabel}
        </button>
      )}
    </motion.div>
  );
}
```

- [ ] **Step 2: Create reading-plan.tsx**

```tsx
// src/components/reading-plan/reading-plan.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { DayCard } from "./day-card";
import { readProgress, markDayRead, getCompletedCount } from "@/lib/reading-storage";
import { trackReadingPlanViewed, trackReadingPlanDayCompleted, trackReadingPlanCompleted } from "@/lib/discipleship-analytics";
import type { Locale } from "@/lib/i18n";

interface DayMessages {
  title: string;
  passage: string;
  passageUrl: string;
  keyVerse: string;
  keyVerseRef: string;
  reflection: string;
  prayer: string;
}

interface ReadingPlanMessages {
  heading: string;
  subtitle: string;
  progressLabel: string;
  markReadLabel: string;
  completedLabel: string;
  allCompleteHeading: string;
  allCompleteBody: string;
  continueReadingLink: string;
  continueReadingLabel: string;
  days: DayMessages[];
}

interface ReadingPlanProps {
  messages: ReadingPlanMessages;
  locale: Locale;
}

export function ReadingPlan({ messages, locale }: ReadingPlanProps) {
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const totalDays = messages.days.length;

  useEffect(() => {
    setProgress(readProgress());
    trackReadingPlanViewed(locale);
  }, [locale]);

  const completedCount = getCompletedCount(progress, totalDays);
  const allComplete = completedCount >= totalDays;

  // Find current day (first incomplete)
  let currentDay = totalDays + 1;
  for (let i = 1; i <= totalDays; i++) {
    if (!progress[String(i)]) {
      currentDay = i;
      break;
    }
  }

  const handleMarkRead = useCallback((day: number) => {
    markDayRead(day);
    const updated = { ...progress, [String(day)]: true };
    setProgress(updated);
    trackReadingPlanDayCompleted(day, locale);

    const newCount = getCompletedCount(updated, totalDays);
    if (newCount >= totalDays) {
      trackReadingPlanCompleted(locale);
    }
  }, [progress, totalDays, locale]);

  const progressLabel = messages.progressLabel
    .replace("{current}", String(Math.min(completedCount + 1, totalDays)))
    .replace("{total}", String(totalDays));

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6 sm:py-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="text-3xl font-bold tracking-tight text-[#D4A843] sm:text-4xl"
          style={{ textShadow: "0 0 60px rgba(212,168,67,0.2)" }}
        >
          {messages.heading}
        </h1>
        <p className="mt-2 text-sm text-white/40">{messages.subtitle}</p>
      </motion.div>

      {/* Progress bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="mt-6"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] uppercase tracking-[2px] text-[#D4A843]/50">
            {progressLabel}
          </span>
        </div>
        <div className="flex gap-1.5">
          {messages.days.map((_, i) => (
            <div key={i} className="flex-1 h-[2px] rounded-full bg-white/[0.04] overflow-hidden">
              <motion.div
                initial={false}
                animate={{ width: progress[String(i + 1)] ? "100%" : "0%" }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full bg-[#D4A843]"
              />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Day cards */}
      <div className="mt-8 space-y-4">
        {messages.days.map((day, i) => (
          <DayCard
            key={i}
            day={i + 1}
            messages={day}
            isCompleted={!!progress[String(i + 1)]}
            isCurrent={currentDay === i + 1}
            markReadLabel={messages.markReadLabel}
            completedLabel={messages.completedLabel}
            onMarkRead={() => handleMarkRead(i + 1)}
          />
        ))}
      </div>

      {/* All complete message */}
      {allComplete && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mt-10 text-center"
        >
          <h2 className="text-2xl font-bold text-[#D4A843]">{messages.allCompleteHeading}</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/50">{messages.allCompleteBody}</p>
          <a
            href={messages.continueReadingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center rounded-lg border border-[#D4A843]/30 px-5 py-2.5 text-sm font-medium text-[#D4A843] transition-colors hover:bg-[#D4A843]/[0.06] min-h-[44px]"
          >
            {messages.continueReadingLabel} &rarr;
          </a>
        </motion.div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/reading-plan/
git commit -m "feat: add reading plan components (day-card + reading-plan)"
```

---

### Task 7: Reading Plan Route Page

**Files:**
- Create: `src/app/[locale]/reading-plan/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// src/app/[locale]/reading-plan/page.tsx
import { notFound } from "next/navigation";
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { ReadingPlan } from "@/components/reading-plan/reading-plan";

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default async function ReadingPlanPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const messages = await import(`@/messages/${locale}.json`);
  const data = messages.default;

  return (
    <main className="min-h-dvh bg-[#060404] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#060404_75%)]" />
      <div className="relative z-[1]">
        <ReadingPlan messages={data.readingPlan} locale={locale as Locale} />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm tsc --noEmit 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/reading-plan/
git commit -m "feat: add reading-plan route page"
```

---

### Task 8: Update InvitationScreen

**Files:**
- Modify: `src/components/invitation-screen.tsx`

- [ ] **Step 1: Add "What Now?" CTA and dismissed soft return**

Replace the post-response section (lines 97-123) in `invitation-screen.tsx` with:

```tsx
{invitationResponse && (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    className="mt-8"
  >
    {/* What Now CTA — for prayed and thinking */}
    {invitationResponse !== "dismissed" && (
      <a
        href={`/${locale}/next-steps?track=${invitationResponse === "prayed" ? "prayed" : "thinking"}`}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#D4A843]/35 bg-[#D4A843]/[0.04] px-6 py-3.5 text-base font-semibold tracking-wide text-[#D4A843] shadow-[0_0_24px_rgba(212,168,67,0.08)] transition-all hover:border-[#D4A843]/50 hover:bg-[#D4A843]/[0.08] min-h-[48px]"
      >
        {messages.nextSteps?.cta ?? "What now?"} <span aria-hidden="true">→</span>
      </a>
    )}

    {/* Soft return for dismissed */}
    {invitationResponse === "dismissed" && messages.nextSteps?.dismissedReturn && (
      <p className="text-center text-sm text-white/30">
        <a href={`/${locale}/reading-plan`} className="underline transition-colors hover:text-white/50">
          {messages.nextSteps.dismissedReturn}
        </a>
      </p>
    )}

    <div className="flex flex-col gap-2 mt-6">
      {invitation.resources.map((resource) => (
        <a
          key={resource.url}
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            handleResourceClick(resource.name, resource.url)
          }
          className="rounded-lg border border-white/10 px-4 py-3 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white/80"
        >
          {resource.name} &rarr;
        </a>
      ))}
    </div>

    <ShareButtons messages={shareMessages || share} locale={locale} />
  </motion.div>
)}
```

Note: This requires `messages` to have the `nextSteps` property. Since `InvitationScreen` receives the full `Messages` type, we need to add `nextSteps` to the `Messages` interface in `types.ts` as an optional field. Add to `src/lib/types.ts` in the `Messages` interface:

```ts
nextSteps?: {
  cta: string;
  dismissedReturn: string;
};
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm tsc --noEmit 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/components/invitation-screen.tsx src/lib/types.ts
git commit -m "feat: add What Now CTA and soft return to InvitationScreen"
```

---

### Task 9: Build Verification

- [ ] **Step 1: Type-check**

Run: `pnpm tsc --noEmit 2>&1 | head -30`

Expected: Clean — no errors.

- [ ] **Step 2: Build**

Run: `pnpm build 2>&1 | tail -30`

Expected: All pages generate including `/en/next-steps`, `/pt/next-steps`, `/en/reading-plan`, `/pt/reading-plan`.

- [ ] **Step 3: Manual verification checklist**

Run `pnpm dev` and test:

1. `/en/test` → answer all questions → "I prayed" → see "What now?" button → click → `/en/next-steps?track=prayed` with Track A content (3 action cards)
2. `/en/test` → "I want to think about it" → "What now?" → `/en/next-steps?track=thinking` with Track B (reflections + reading)
3. `/en/test` → "Not for me" → see "Changed your mind?" soft return line with reading plan link
4. `/en/reading-plan` → see 7 days with progress bar → mark Day 1 as read → refresh → Day 1 still marked
5. Complete all 7 days → see completion message with "Continue reading John" link
6. `/pt/next-steps?track=prayed` → Portuguese content
7. `/pt/reading-plan` → Portuguese content with ARC Bible links

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: address issues found during e2e verification"
```
