"use client";

import type { RecordRow } from "@/lib/confession";

interface GraceRecordProps {
  rows: RecordRow[];
  messages: {
    eyebrow: string;
    count: string;
    charge: string;
    plea: string;
    admitted: string;
    contested: string;
    finding: string;
    guilty: string;
    ability: string;
    none: string;
    paid: string;
  };
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

/**
 * The reader's own test, as the court record it has been describing.
 *
 * Grace has just argued the courtroom analogy in four movements — a judge, a
 * penalty, someone who pays, and the response. This is the same courtroom
 * applied to the reader by name: their six answers as counts, and the record
 * stamped paid.
 *
 * ── Why the plea column exists ──────────────────────────────────────────────
 *
 * A record that printed "Count I — a liar" flat would state as established fact
 * something a justifying reader never said. docs/METHOD.md is explicit:
 * "Evasions are recorded, not dismissed. Rendering both in one colour would
 * state the evaded commandments with the same force as the confessed ones,
 * which is not what the reader said." The verdict screen already honours that
 * by colouring admitted and denied runs differently.
 *
 * A real record has the affordance for this, and it is the plea: what the
 * defendant said, kept separate from what the court found. So a reader who
 * contested all six sees six contested counts and a finding that is unchanged —
 * which is a sharper mirror than agreement, and is precisely what the verdict
 * already tells them in words: "by your evasions".
 *
 * The finding therefore takes no argument. It does not depend on the pleas,
 * because James 2:10 does not.
 *
 * ── What is deliberately not here ───────────────────────────────────────────
 *
 * The score. Six honest answers drain 100 to 0; six justifications drain only
 * 49, leaving 51. Printing that on a record would turn a conviction into a
 * grade and invite the reader to compare themselves with someone worse, which
 * is the exact instinct the six questions exist to close off — the same reason
 * the reader's self-rating is testimony and never a measurement.
 */
export function GraceRecord({ rows, messages }: GraceRecordProps) {
  return (
    <figure className="m-0">
      <figcaption className="mb-3 font-mono text-[9px] uppercase tracking-[2.6px] text-[#D4A843]/70">
        {messages.eyebrow}
      </figcaption>

      <div className="relative overflow-hidden rounded-md border border-white/[0.13] bg-white/[0.015] p-4 sm:p-5">
        {/*
         * Two layers under the charges, and each means something.
         *
         * The paper is what makes the record read as issued rather than
         * rendered — a document, not a styled div. The fingerprint is the
         * reader pressed into their own record: identity, testimony, the mark
         * a charge sheet carries. Both were measured in place; the print sits
         * at 9% because at 16% it competed with the pleas it sits under.
         *
         * <picture> with AVIF + WebP, lazy — the record is many screens deep
         * in the flow and nothing here may cost the reader a frame.
         */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <picture>
            <source srcSet="/graphics/paper.avif" type="image/avif" />
            <img
              src="/graphics/paper.webp"
              alt=""
              loading="lazy"
              decoding="async"
              className="size-full object-cover opacity-[0.07]"
            />
          </picture>
          <picture>
            <source srcSet="/graphics/fingerprint.avif" type="image/avif" />
            <img
              src="/graphics/fingerprint.webp"
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 m-auto h-[86%] w-auto opacity-[0.09]"
            />
          </picture>
        </div>
        {/*
         * A real table, not a grid of divs. This is tabular data — count,
         * charge, plea — and the document look is styling on top of that, not a
         * reason to withhold the structure from a screen reader. The headings
         * are visually hidden because the record's own layout says what each
         * column is to anyone who can see it.
         */}
        <table className="relative w-full border-collapse text-left">
          <thead className="sr-only">
            <tr>
              <th scope="col">{messages.count}</th>
              <th scope="col">{messages.charge}</th>
              <th scope="col">{messages.plea}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const admitted = row.plea === "admitted";
              return (
                <tr
                  key={row.commandment}
                  className="border-b border-dashed border-white/[0.07] last:border-b-0"
                >
                  <th
                    scope="row"
                    className="py-2 pr-3 align-baseline font-mono text-[9px] font-normal tracking-[1px] whitespace-nowrap text-white/30"
                  >
                    {ROMAN[i] ?? String(i + 1)} · {row.commandment}
                  </th>
                  <td
                    className={`py-2 pr-3 align-baseline font-mono text-[11.5px] ${
                      admitted ? "text-red-400" : "text-white/60"
                    }`}
                  >
                    {row.label}
                  </td>
                  <td
                    className={`py-2 text-right align-baseline font-mono text-[8px] uppercase tracking-[1.4px] whitespace-nowrap ${
                      admitted ? "text-red-400/70" : "text-white/30"
                    }`}
                  >
                    {admitted ? messages.admitted : messages.contested}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <dl className="relative mt-3 border-t border-white/[0.16] pt-3 font-mono text-[9.5px] uppercase tracking-[1.2px]">
          <div className="flex items-baseline justify-between">
            <dt className="text-white/40">{messages.finding}</dt>
            <dd className="m-0 text-[11px] tracking-[1px] text-red-400/90">{messages.guilty}</dd>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-4">
            <dt className="text-white/40">{messages.ability}</dt>
            <dd className="m-0 text-[11px] tracking-[1px] text-red-400/90">{messages.none}</dd>
          </div>
        </dl>

        {/*
         * The stamp. Decorative in the strict sense — it repeats what the line
         * beneath it says in flowing text — so it is hidden from assistive
         * technology rather than announced twice out of order.
         *
         * Rotated with a transform, which is safe here because nothing framer
         * animates touches this element; the codebase's margin-not-transform
         * rule is about elements that are also being animated on `y`.
         */}
        <div className="relative mt-5 flex justify-end">
          <span
            aria-hidden="true"
            className="-rotate-[7deg] rounded border-2 border-[#D4A843]/85 bg-[#D4A843]/[0.07] px-3 py-1.5 font-mono text-[13px] font-bold uppercase tracking-[2px] text-[#D4A843] sm:text-[15px]"
          >
            {messages.paid}
          </span>
        </div>
      </div>

      {/* The stamp's words, in the reading order a screen reader needs them,
          and the only place the record makes its own claim. */}
      <p className="sr-only">{messages.paid}</p>
    </figure>
  );
}
