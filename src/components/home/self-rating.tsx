"use client";

import type { SelfRating as SelfRatingValue } from "@/lib/types";

export interface SelfRatingMessages {
  yes: string;
  mostly: string;
  no: string;
}

interface SelfRatingProps {
  messages: SelfRatingMessages;
  onSelect: (rating: SelfRatingValue) => void;
  /** Accessible name for the group, since the visible question is a separate heading. */
  ariaLabel: string;
  className?: string;
  /**
   * `row` — three chips centred on one line. The homepage hero, where the
   * question is the only thing on screen and has the width to hold them.
   *
   * `stack` — one chip per line on a phone, returning to a row from `sm`. The
   * test's landing ranges its type left inside the same narrow column the
   * questions use, and at that width the third chip wraps: two answers on one
   * line and one alone underneath, which reads as a different kind of answer
   * rather than the third of three.
   */
  layout?: "row" | "stack";
}

const FIELDSET_LAYOUT: Record<NonNullable<SelfRatingProps["layout"]>, string> = {
  row: "flex-wrap items-center justify-center",
  stack: "flex-col items-stretch sm:flex-row sm:flex-wrap sm:items-center sm:justify-start",
};

/**
 * The three answers to "Are you a good person?".
 *
 * Every option leads to the same six questions — that is the point, not a
 * shortcut taken. See `SelfRating` in types for why a "no" does not earn a
 * shorter Law.
 *
 * Deliberately not the house 3D `Button`: three of those side by side read as
 * three competing calls to action, and the reader is answering a question here,
 * not choosing between destinations. Flat chips, one visual weight, no
 * recommended option.
 *
 * Rendered on the homepage and on the test's landing screen, so the question is
 * asked exactly once wherever the reader first meets it.
 */
export function SelfRating({
  messages,
  onSelect,
  ariaLabel,
  className,
  layout = "row",
}: SelfRatingProps) {
  const options: { value: SelfRatingValue; label: string }[] = [
    { value: "yes", label: messages.yes },
    { value: "mostly", label: messages.mostly },
    { value: "no", label: messages.no },
  ];

  return (
    // A real fieldset rather than role="group" on a div: these are form
    // controls answering one question, which is exactly what a fieldset is for.
    // The legend carries the accessible name and is hidden visually, since the
    // question is already on screen as the heading above.
    <fieldset
      className={`m-0 flex min-w-0 gap-2.5 border-0 p-0 sm:gap-3 ${FIELDSET_LAYOUT[layout]} ${className ?? ""}`}
    >
      <legend className="sr-only">{ariaLabel}</legend>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onSelect(option.value)}
          className="min-h-[44px] rounded-xl border border-white/[0.14] bg-gradient-to-b from-[#0e0c0c] to-[#0a0808] px-5 py-3 text-[14px] text-white/70 transition-[color,border-color,transform] duration-200 ease-[var(--ease-out-strong)] hover:border-white/25 hover:text-white/90 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100 sm:px-6 sm:text-[15px]"
        >
          {option.label}
        </button>
      ))}
    </fieldset>
  );
}
