interface PageShellProps {
  /**
   * narrow = reading column (topic pages, reading plan, next-steps) — prose
   * that's read top to bottom, so the column stays letter-width even on a
   * wide desktop.
   * grid = card layouts (the learn hub) — same vertical rhythm as narrow,
   * but wide enough that a 2-up card grid isn't squeezed to ~226px cards
   * floating in the middle of a desktop viewport.
   * wide = legal/about prose, its own (larger) vertical rhythm.
   */
  width?: "narrow" | "wide" | "grid";
  children: React.ReactNode;
}

const WIDTH_CLASSES = {
  narrow: "relative z-[1] mx-auto max-w-lg px-4 py-16 sm:px-6 sm:py-24",
  grid: "relative z-[1] mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24",
  wide: "relative z-[1] mx-auto max-w-2xl px-6 py-24 sm:px-8 sm:py-32",
};

/**
 * Standard content-page wrapper: dark stage, radial vignette, centered column.
 * Keeps every content page on the same grid so the product reads as one thing.
 */
export function PageShell({ width = "narrow", children }: PageShellProps) {
  return (
    <main className="min-h-dvh bg-[#060404] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#060404_75%)]" />
      <div className={WIDTH_CLASSES[width]}>{children}</div>
    </main>
  );
}
