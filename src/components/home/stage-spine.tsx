import type { ReactNode } from "react";

type Tone = "red" | "gold" | "dim";

const TONE: Record<Tone, { rule: string; text: string; heading?: string }> = {
  red: { rule: "bg-red-500/40", text: "text-red-400/80" },
  /*
   * `heading` only exists for gold, deliberately — the reason committed's
   * heading gets its own colour and the other two stay plain white. Same
   * gold, same glow as the decision screen's own committed line
   * (invitation-screen.tsx), so a returning reader's two tellings of this
   * event — there, then again here — read as one thing rather than two.
   */
  gold: { rule: "bg-[#D4A843]/40", text: "text-[#D4A843]/80", heading: "text-[#D4A843]" },
  dim: { rule: "bg-white/[0.16]", text: "text-white/60" },
};

interface StageSpineProps {
  tone: Tone;
  eyebrow: string;
  /** The stage's one and only heading. Required — three stages used to render none. */
  heading: string;
  /**
   * What happened to this reader, in the app's courtroom language. This IS the
   * progression: told, not charted. Omitted only for `visitor`, where nothing
   * has happened yet.
   *
   * ReactNode rather than string because the two date-bearing stages pass a
   * sentence with its time clause held back until the timestamp is known.
   */
  whatHappened?: ReactNode;
  /** Optional extra beat (the house blockquote) between the sentence and the action. */
  children?: ReactNode;
}

/**
 * The shared top of every homepage journey stage: eyebrow → one heading → what
 * happened. Extracted so the spine is guaranteed by construction rather than
 * by five blocks agreeing to look alike — a returning reader feeling lost was
 * the whole complaint, and the states previously differed in heading level,
 * control type and element count.
 *
 * The heading is an h2, not an h1. All four returning-reader stages ship in
 * every HTML response (see the note in home-shell beside the wrappers — it is
 * how the page avoids a 133px layout jump), so an h1 here put five of them in
 * the document. The visitor block keeps the page's single h1, and it is the
 * block a crawler resolves to anyway: the stage comes from localStorage, which
 * is empty for every bot.
 *
 * Actions stay with each stage: they differ enough (reset-and-retake vs.
 * navigate vs. record a response) that folding them in here would take more
 * props than it saves.
 */
export function StageSpine({
  tone,
  eyebrow,
  heading,
  whatHappened,
  children,
}: StageSpineProps) {
  const t = TONE[tone];
  return (
    <>
      <div className="mt-10 flex items-center gap-2 sm:mt-14">
        <span aria-hidden="true" className={`h-px w-6 ${t.rule}`} />
        <span
          className={`font-mono text-[9px] uppercase tracking-[3px] sm:text-[10px] sm:tracking-[4px] ${t.text}`}
        >
          {eyebrow}
        </span>
        <span aria-hidden="true" className={`h-px w-6 ${t.rule}`} />
      </div>

      {/*
       * Colour only, never size — every other stage keeps the exact same
       * heading level and scale. This component exists because varying
       * those across stages was the bug ("the states previously differed in
       * heading level, control type and element count", see the file doc
       * comment); a bigger committed heading would reopen it. Weight comes
       * from colour and the glow alone.
       */}
      <h2
        className={`mt-3 max-w-md text-balance text-center text-2xl font-bold leading-tight tracking-tight sm:mt-4 sm:text-3xl ${t.heading ?? "text-white/90"}`}
        style={tone === "gold" ? { textShadow: "0 0 60px rgba(212,168,67,0.28)" } : undefined}
      >
        {heading}
      </h2>

      {whatHappened && (
        <p className="mt-4 max-w-md text-center text-[14px] leading-[1.7] text-white/65 sm:text-[15px]">
          {whatHappened}
        </p>
      )}

      {children}
    </>
  );
}
