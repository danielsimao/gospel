"use client";

import { useEffect, useRef, useState } from "react";
import { m } from "framer-motion";
import Link from "next/link";
import { BookOpen, Compass } from "lucide-react";
import { trackNextStepsActionClicked, trackScriptureOpened } from "@/lib/discipleship-analytics";
import { BandHeader } from "./band-header";
import { Button, ButtonArrow } from "@/components/ui/button";
import { readJourney } from "@/lib/journey-storage";
import { EASE_OUT_STRONG } from "@/lib/motion";
import type { Locale } from "@/lib/i18n";

const FRESH_WINDOW_MS = 60 * 60 * 1000;

export type ReflectionState = "done" | "armed" | "pending";

/**
 * Which of the three states a reflection is in, given how many have been
 * acknowledged.
 *
 * Exported and pure so the chain's actual rule can be tested. The rendering
 * assertions around it only pin that the component still spells things the
 * same way; they would pass just as happily if this derivation armed every
 * item at once, or armed nothing after an acknowledgement. That gap was
 * found in review, and this is the half that closes it.
 */
export function reflectionState(index: number, acknowledged: number): ReflectionState {
  if (index < acknowledged) return "done";
  if (index === acknowledged) return "armed";
  return "pending";
}

interface TrackThinkingMessages {
  acknowledgment: string;
  acknowledgmentReturn: string;
  reflections: string[];
  readingHeading: string;
  readingBody: string;
  readingLink: string;
  readingLinkLabel: string;
  learnLinkLabel: string;
  learnLeadIn: string;
  reflectionHint: string;
  bands: { today: string };
  comeBack: string;
}

interface TrackThinkingProps {
  messages: TrackThinkingMessages;
  locale: Locale;
}

export function TrackThinking({ messages, locale }: TrackThinkingProps) {
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

  /*
   * One question at a time.
   *
   * Deliberately NOT persisted. This is a reading-pace device, not progress:
   * a returning reader who found three greyed-out lines with nothing armed
   * would be worse off than one starting again. Keeping it in component state
   * also means nothing here reads storage during render, which the page's
   * pre-paint design depends on.
   */
  const [acknowledged, setAcknowledged] = useState(0);

  /*
   * Where focus goes after an item is acknowledged.
   *
   * The armed item is the only chain item with tabIndex 0; acknowledging it
   * flips its own tabIndex to -1 (it is now "done") while it still holds
   * focus, so without this the next Tab restarts from the top of the
   * document instead of continuing down the chain. `itemRefs` holds one
   * button per reflection; `readLinkRef` is where focus goes once the chain
   * is finished and there is no next item to arm — the primary CTA is the
   * next actionable thing on the page.
   */
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const readLinkRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    // Runs on mount too (acknowledged starts at 0); skip so a fresh page
    // load never steals focus from wherever the reader actually is.
    if (acknowledged === 0) return;
    if (acknowledged < messages.reflections.length) {
      itemRefs.current[acknowledged]?.focus();
    } else {
      readLinkRef.current?.focus();
    }
  }, [acknowledged, messages.reflections.length]);

  // One gentle rise per reflection, capped so the questions read in
  // sequence but never run past ~1s total (was 0.5 + i*0.3 — far too slow).
  const para = (i: number) => ({ duration: 0.7, delay: 0.15 + Math.min(i, 3) * 0.12, ease: EASE_OUT_STRONG });
  // Each section reveals as one group, not per-card.
  const band = { duration: 0.7, ease: EASE_OUT_STRONG };
  const groupDelay = 0.15 + Math.min(messages.reflections.length, 3) * 0.12;

  return (
    <>
      <m.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: EASE_OUT_STRONG }}
        className="text-2xl font-bold tracking-tight text-white/90 sm:text-3xl"
      >
        {isFresh ? messages.acknowledgment : messages.acknowledgmentReturn}
      </m.h1>

      {/*
       * Nothing below this list is gated on it. A reader who ignores the chain
       * entirely scrolls past to the same page — pending questions are dimmed
       * and unfocusable, never hidden, so a screen reader can still read ahead.
       */}
      {/* An ordered list, because it is one: a screen reader gets "2 of 3"
          rather than three unrelated buttons. */}
      <ol className="mt-10 space-y-2">
        {messages.reflections.map((question, i) => {
          const state = reflectionState(i, acknowledged);
          return (
            <m.li
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={para(i)}
            >
              {/*
               * The handler guards on state, and it has to.
               *
               * An earlier version relied on `pointer-events-none` plus
               * `tabIndex={-1}` and claimed the condition could never be
               * false. Both are wrong. A *done* item never had
               * pointer-events-none at all, so clicking question one after
               * reaching question three rewound the chain; and CSS pointer
               * hit-testing is not consulted by programmatic `.click()`,
               * voice control, or activation from the accessibility tree,
               * so a pending item could be jumped to as well. `aria-disabled`
               * announces a state; it does not enforce one.
               */}
              <button
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                type="button"
                onClick={() => {
                  if (state !== "armed") return;
                  setAcknowledged(i + 1);
                }}
                aria-disabled={state !== "armed"}
                tabIndex={state === "armed" ? 0 : -1}
                className={`block w-full border-l pl-5 text-left italic leading-relaxed transition-opacity duration-500 ease-[var(--ease-out-strong)] motion-reduce:transition-none ${
                  state === "armed"
                    ? "cursor-pointer border-white/10 text-[15px] text-white/60 sm:text-base"
                    : state === "done"
                      ? "cursor-default border-white/10 text-[13px] text-white/60 opacity-35"
                      : "pointer-events-none border-white/10 text-[15px] text-white/60 opacity-20 sm:text-base"
                }`}
              >
                {question}
                {state === "armed" && (
                  <span className="mt-2 block font-mono text-[9px] uppercase not-italic tracking-[2px] text-[#D4A843]/65">
                    {messages.reflectionHint}
                  </span>
                )}
              </button>
            </m.li>
          );
        })}
      </ol>

      {/* ── TODAY: one primary read + warm human secondary ── */}
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...band, delay: groupDelay + 0.1 }}
        className="mt-12"
      >
        <BandHeader label={messages.bands.today} tone="gold" />

        {/* PRIMARY — one thing to read. No glow: the committed track's glow
            celebrates a decision; a skeptic gets a calm invite, not a pitch. */}
        <div className="rounded-2xl border border-[#D4A843]/40 bg-[#D4A843]/[0.04] p-6">
          <div className="flex items-center gap-2.5">
            <BookOpen className="size-5 text-[#D4A843]" aria-hidden="true" />
            <h3 className="text-base font-semibold tracking-wide text-[#D4A843]">{messages.readingHeading}</h3>
          </div>
          <p className="mt-2 text-[15px] leading-relaxed text-white/70">{messages.readingBody}</p>
          <div className="mt-4">
            <a
              ref={readLinkRef}
              href={messages.readingLink}
              rel="noopener noreferrer"
              onClick={() => {
                trackNextStepsActionClicked("read", "thinking");
                trackScriptureOpened("next_steps_thinking", null, locale);
              }}
            >
              <Button variant="gold" size="sm">
                {messages.readingLinkLabel}
                <ButtonArrow />
              </Button>
            </a>
          </div>
        </div>

        {/*
         * Where the questions go.
         *
         * A "Chat at needGod.net" row sat here, and there is no chat at
         * needGod.net — the page offers a form and two social handles, and no
         * Portuguese at all, so a tu-form reader was handed an English site at
         * the moment they had been promised a conversation. Learn is the
         * honest version of the same intent: on-site, bilingual, and in this
         * app's own voice. The footer keeps the needGod link.
         */}
        <p className="mt-5 text-sm leading-relaxed text-white/60">{messages.learnLeadIn}</p>
        <Link
          href={`/${locale}/learn`}
          onClick={() => trackNextStepsActionClicked("learn", "thinking")}
          className="group mt-2 flex min-h-[48px] items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm font-semibold text-white/75 transition-[color,border-color,background-color,transform] duration-200 ease-[var(--ease-out-strong)] hover:-translate-y-px hover:border-[#D4A843]/35 hover:bg-white/[0.045] hover:text-white motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        >
          <Compass className="size-4 shrink-0 text-white/50" aria-hidden="true" />
          <span className="flex-1">{messages.learnLinkLabel}</span>
          <span aria-hidden="true" className="text-white/40 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none">&rarr;</span>
        </Link>
      </m.div>

      {/* Closing beat — the mortality press. Plain text, no CTA. */}
      <m.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...band, delay: groupDelay + 0.4 }}
        className="mt-10 text-center text-sm leading-relaxed text-white/60"
      >
        {messages.comeBack}
      </m.p>
    </>
  );
}
