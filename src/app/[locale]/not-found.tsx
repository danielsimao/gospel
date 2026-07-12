import Link from "next/link";

// Rendered inside the [locale] layout for any unmatched path (via the
// [...rest] catch-all). Copy is EN-only by design — not-found pages don't
// receive params in Next, and the line carries the site's voice either way.
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#060404] px-6 py-16 text-center">
      <div className="flex items-center gap-2">
        <span className="h-px w-6 bg-red-500/40" />
        <span className="font-mono text-[9px] uppercase tracking-[3px] text-red-400/75">
          Not found
        </span>
        <span className="h-px w-6 bg-red-500/40" />
      </div>
      <p
        className="mt-4 font-mono text-6xl font-black tabular-nums tracking-tighter text-red-500"
        style={{ textShadow: "0 0 80px rgba(239,68,68,0.25)" }}
      >
        404
      </p>
      <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
        This page doesn&rsquo;t exist. Eternity does.
      </p>
      <Link
        href="/"
        className="mt-8 font-mono text-[10px] uppercase tracking-[2.5px] text-[#D4A843]/80 transition-colors hover:text-[#D4A843]"
      >
        &larr; Back to the beginning
      </Link>
    </div>
  );
}
