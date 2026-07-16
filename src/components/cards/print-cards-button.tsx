"use client";

import { Printer } from "lucide-react";

export function PrintCardsButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="group inline-flex items-center gap-2 rounded-lg border border-[#D4A843]/30 bg-[#D4A843]/[0.05] px-5 py-2.5 font-mono text-[11px] uppercase tracking-[2px] text-[#D4A843]/90 transition-all hover:border-[#D4A843]/50 hover:bg-[#D4A843]/[0.09]"
    >
      <Printer className="size-3.5" />
      {label}
    </button>
  );
}
