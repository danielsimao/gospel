interface PageShellProps {
  /** narrow = reading column (learn, reading plan, next-steps); wide = legal/about prose. */
  width?: "narrow" | "wide";
  children: React.ReactNode;
}

/**
 * Standard content-page wrapper: dark stage, radial vignette, centered column.
 * Keeps every content page on the same grid so the product reads as one thing.
 */
export function PageShell({ width = "narrow", children }: PageShellProps) {
  return (
    <main className="min-h-dvh bg-[#060404] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#060404_75%)]" />
      <div
        className={
          width === "narrow"
            ? "relative z-[1] mx-auto max-w-lg px-4 py-16 sm:px-6 sm:py-24"
            : "relative z-[1] mx-auto max-w-2xl px-6 py-24 sm:px-8 sm:py-32"
        }
      >
        {children}
      </div>
    </main>
  );
}
