export interface ReadingDay {
  title: string;
  passage: string;
  /** Where this day is actually read. The ticket names a passage, so any door
      beside it must open that passage and not a fixed chapter. */
  passageUrl: string;
  keyVerse: string;
  keyVerseRef: string;
}

/**
 * The day this reader is on, or null once the plan is finished.
 *
 * `completed` is a count, so it doubles as the index of the next unread day.
 * Exported because the ticket's surroundings need the same day the ticket
 * shows — a card whose eyebrow says JOHN 10 beside a button opening JOHN 1 is
 * the drift this shared component exists to prevent.
 */
export function currentDay(days: ReadingDay[], completed: number): ReadingDay | null {
  if (completed >= days.length) return null;
  return days[Math.min(completed, days.length - 1)] ?? null;
}

interface DayTicketBodyProps {
  /** "Day {n} of {total}" — the eyebrow's template; never hardcodes English. */
  dayProgress: string;
  /** Shown in place of a day once all are read. */
  completeDescription: string;
  days: ReadingDay[];
  /** How many days this reader has finished, from useJourney. */
  completed: number;
}

/**
 * The day ticket's interior: eyebrow, title, verse, step bar.
 *
 * One component, two surfaces — the homepage reading band and the committed
 * track's Read card — because two hand-kept presentations of the same plan is
 * how the old band-row bands drifted apart, and this repo's rule is shared by
 * construction, not by files agreeing to look alike. The frames stay with
 * their surfaces: the band is one Link with a continue line, the track's card
 * is louder gold with two door buttons. What the reader is shown ABOUT the
 * day — where they are, what it costs, the verse — must be identical, so it
 * lives here.
 *
 * The hierarchy is built around the verse, untrimmed, with its reference, in
 * the house gold blockquote. The eyebrow says where the reader is and what it
 * costs in one glance ("DAY 4 OF 7 · JOHN 10:1–18"), the same register as the
 * test's "6 QUESTIONS · 2 MINUTES".
 *
 * The step bar speaks the page's live-step language: days read in solid gold,
 * today breathing on the LIVE pulse, the rest dim. Two roles, no third
 * branch — with every day read, no index matches `i === completed`, so the
 * pulse retires and the bar reads solid on its own.
 *
 * No score face, deliberately: Big Shoulders is scoped to surfaces that
 * declare (home-passed.test.ts pins the reading surfaces against it). A
 * reading surface gets size, not signage.
 */
export function DayTicketBody({
  dayProgress,
  completeDescription,
  days,
  completed,
}: DayTicketBodyProps) {
  const day = currentDay(days, completed);
  const progressLine = dayProgress
    .replace("{n}", String(completed + 1))
    .replace("{total}", String(days.length));

  return (
    <>
      {day ? (
        <>
          <span className="flex items-center gap-3 font-mono text-[9.5px] uppercase tracking-[2.2px] text-[#D4A843]/80">
            {progressLine}
            <span aria-hidden="true" className="h-[0.7em] w-px bg-white/[0.14]" />
            <span className="tracking-[1.6px] text-white/40">{day.passage}</span>
          </span>
          <span className="mt-2 block text-[20px] font-bold tracking-[-0.01em] text-white/90 transition-colors group-hover:text-white">
            {day.title}
          </span>
          <span className="mt-3.5 block border-l border-[#D4A843]/35 pl-4 text-[15px] italic leading-[1.65] text-white/70">
            &ldquo;{day.keyVerse}&rdquo;
            <span className="mt-1.5 block font-mono text-[9px] not-italic uppercase tracking-[1.8px] text-white/40">
              {day.keyVerseRef}
            </span>
          </span>
        </>
      ) : (
        <span className="block text-[20px] font-bold tracking-[-0.01em] text-white/90 transition-colors group-hover:text-white">
          {completeDescription}
        </span>
      )}
      <span aria-hidden="true" className="mt-4.5 flex gap-1.5">
        {days.map((_, i) => (
          <i
            key={i}
            className={`h-[3px] flex-1 rounded-full ${
              i < completed
                ? "bg-[#D4A843]/85"
                : i === completed
                  ? "bg-[#D4A843]/50 animate-pulse motion-reduce:animate-none"
                  : "bg-white/[0.12]"
            }`}
          />
        ))}
      </span>
    </>
  );
}
