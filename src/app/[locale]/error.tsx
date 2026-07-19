"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

// Branded error boundary for everything under [locale]. Copy is EN-only by
// design — error boundaries render outside the message pipeline.
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#060404] px-6 py-16 text-center">
      <div className="flex items-center gap-2">
        <span className="h-px w-6 bg-red-500/40" />
        <span className="font-mono text-[10px] uppercase tracking-[3px] text-red-400/80">
          Error
        </span>
        <span className="h-px w-6 bg-red-500/40" />
      </div>
      <p className="mt-6 max-w-xs text-sm leading-relaxed text-white/60">
        Something broke. It wasn&rsquo;t the message.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 font-mono text-[10px] uppercase tracking-[2.5px] text-[#D4A843]/80 transition-colors hover:text-[#D4A843]"
      >
        Try again
      </button>
    </div>
  );
}
