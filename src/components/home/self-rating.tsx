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
   * `row` — stacked full-width on a phone, three equal columns from `sm`. The
   * homepage hero, where the question has the width to hold a row.
   *
   * `stack` — one answer per line at every width. The test's landing ranges
   * its type left inside the same narrow column the questions use, and three
   * columns there crush the Portuguese "Mais ou menos" against its radio.
   */
  layout?: "row" | "stack";
}

const FIELDSET_LAYOUT: Record<NonNullable<SelfRatingProps["layout"]>, string> = {
  row: "flex-col items-stretch sm:flex-row",
  stack: "flex-col items-stretch",
};

const BUTTON_LAYOUT: Record<NonNullable<SelfRatingProps["layout"]>, string> = {
  row: "sm:flex-1",
  stack: "",
};

/**
 * The three answers to "Are you a good person?".
 *
 * Every option leads to the same six questions — that is the point, not a
 * shortcut taken. See `SelfRating` in types for why a "no" does not earn a
 * shorter Law.
 *
 * These used to be small centred chips, and readers read them as labels
 * rather than controls — nothing about three quiet pills says "we are waiting
 * for you". They are answer rows now, each carrying an EMPTY RADIO MARK that
 * fills on hover and focus: an unticked form control is the plainest
 * "your input is expected here" signal there is, and it is honest — tapping
 * one does not navigate to the test, it ANSWERS the test's first question
 * (the route lands with the reply already rendered; see home-shell).
 *
 * Still deliberately not the house 3D `Button`, and still one visual weight
 * with no recommended option: three competing calls to action would make this
 * a choice between destinations, and gold or red on any door would either
 * spend grace's colour early or ask the reader to condemn themselves before
 * the Law has said anything. The radio is aria-hidden decoration — the
 * control is the button itself, named by its label.
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
          className={`group flex min-h-[52px] items-center gap-3 rounded-2xl border border-white/[0.12] bg-white/[0.035] px-4 py-3.5 text-left text-[15px] font-semibold text-white/85 transition-[color,border-color,background-color,transform] duration-200 ease-[var(--ease-out-strong)] hover:-translate-y-px hover:border-white/30 hover:bg-white/[0.06] hover:text-white focus-visible:border-white/30 active:translate-y-0 active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100 ${BUTTON_LAYOUT[layout]}`}
        >
          {/* The empty radio, filling on hover/focus. Decoration, not a
              control — the button is the control — so it is hidden from
              assistive tech, which already has the labelled button. */}
          <span
            aria-hidden="true"
            className="grid size-[18px] shrink-0 place-items-center rounded-full border-[1.5px] border-white/30 transition-colors duration-200 group-hover:border-white/60 group-focus-visible:border-white/60"
          >
            <span className="size-2 scale-0 rounded-full bg-white/90 transition-transform duration-200 ease-[var(--ease-out-strong)] group-hover:scale-100 group-focus-visible:scale-100 motion-reduce:transition-none" />
          </span>
          {option.label}
          <span
            aria-hidden="true"
            className="ml-auto text-[13px] text-white/40 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
          >
            &rarr;
          </span>
        </button>
      ))}
    </fieldset>
  );
}
