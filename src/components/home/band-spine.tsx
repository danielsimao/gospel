type Tone = "gold" | "dim";

const TONE: Record<Tone, { rule: string; text: string }> = {
  gold: { rule: "bg-[#D4A843]/40", text: "text-[#D4A843]/80" },
  dim: { rule: "bg-white/[0.16]", text: "text-white/60" },
};

/**
 * The homepage's band header: seam, then rule — eyebrow — rule, centred.
 *
 * The page used to speak two dialects. The hero and all five journey stages
 * centre themselves under an eyebrow flanked by two short rules (StageSpine);
 * the bands below used next-steps' BandHeader instead — label hard left with a
 * stub rule and a long one trailing off to the right. Reading down the page,
 * the axis jumped from centre to left halfway through, and the score band made
 * it worse by wearing a left header over centred numerals.
 *
 * So the bands adopt the dialect the page already speaks at the top. This is
 * deliberately a copy of StageSpine's header rather than an import of it:
 * StageSpine also owns a heading and a whatHappened paragraph that no band has,
 * and folding a band case into it would take more props than it saves. The two
 * are pinned to the same measurements by test instead.
 *
 * next-steps keeps BandHeader untouched. Its pages are left-aligned documents
 * throughout, and the left header is right there.
 */
export function BandSpine({ label, tone = "dim" }: { label: string; tone?: Tone }) {
  const t = TONE[tone];
  return (
    <div className="mb-4">
      {/*
       * The seam. mt-24 and a 9px eyebrow were the only things separating one
       * band from the next, and read top to bottom the page had no section
       * boundaries — just pauses. A full-width hairline at the top of every
       * band marks where a section actually starts, the same gradient idiom as
       * the visitor block's short divider but fainter, because at full width
       * the same opacity would outweigh the cards' own borders. Neutral in
       * both tones: it marks structure, not meaning — gold stays on the words
       * and rules that carry it.
       */}
      <span
        aria-hidden="true"
        className="mb-8 block h-px w-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent"
      />
      <div className="flex items-center justify-center gap-2">
        <span aria-hidden="true" className={`h-px w-6 ${t.rule}`} />
        <span
          className={`font-mono text-[9px] uppercase tracking-[3px] sm:text-[10px] sm:tracking-[4px] ${t.text}`}
        >
          {label}
        </span>
        <span aria-hidden="true" className={`h-px w-6 ${t.rule}`} />
      </div>
    </div>
  );
}
