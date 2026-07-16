/** Temporal band header — a next-steps page's answer to "what do I do first?" */
export function BandHeader({ label, tone }: { label: string; tone: "gold" | "dim" }) {
  const hairline = tone === "gold" ? "bg-[#D4A843]/40" : "bg-white/[0.12]";
  const text = tone === "gold" ? "text-[#D4A843]/75" : "text-white/45";
  return (
    <div className="mb-3 mt-10 flex items-center gap-2 first:mt-0">
      <span className={`h-px w-6 ${hairline}`} />
      <span className={`font-mono text-[9px] uppercase tracking-[3px] ${text}`}>{label}</span>
      <span className={`h-px flex-1 ${hairline} opacity-40`} />
    </div>
  );
}
