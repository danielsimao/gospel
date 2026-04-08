"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { Locale } from "@/lib/i18n";

interface Topic {
  slug: string;
  title: string;
  subtitle: string;
}

interface LearnHubProps {
  label: string;
  subtitle: string;
  topics: Topic[];
  locale: Locale;
}

export function LearnHub({ label, subtitle, topics, locale }: LearnHubProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="min-h-dvh bg-[#060404] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#060404_75%)]" />

      <div className="relative z-[1] mx-auto max-w-lg px-4 py-16 sm:px-6 sm:py-24">
        <div
          className="transition-opacity duration-500"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(16px)", transition: "opacity 0.8s ease-out, transform 0.8s ease-out" }}
        >
          <p className="font-mono text-[9px] uppercase tracking-[4px] text-[#D4A843]/50">{label}</p>
          <h1
            className="mt-3 text-3xl font-bold tracking-tight text-[#D4A843] sm:text-4xl"
            style={{ textShadow: "0 0 60px rgba(212,168,67,0.2)" }}
          >
            {label}
          </h1>
          <p className="mt-3 text-sm text-white/45">{subtitle}</p>
        </div>

        <div className="mt-10 flex flex-col gap-3">
          {topics.map((topic, i) => (
            <a
              key={topic.slug}
              href={`/${locale}/learn/${topic.slug}`}
              className="group flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.015] px-5 py-4 transition-all hover:border-[#D4A843]/25 hover:bg-[#D4A843]/[0.02] sm:px-6 sm:py-5"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(8px)",
                transition: `opacity 0.5s ease-out ${0.3 + i * 0.1}s, transform 0.5s ease-out ${0.3 + i * 0.1}s`,
              }}
            >
              <div className="flex items-center gap-4">
                <span className="font-mono text-[10px] tabular-nums text-[#D4A843]/40">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-[15px] font-semibold text-white/85 sm:text-base">{topic.title}</p>
                  <p className="mt-0.5 text-xs text-white/40">{topic.subtitle}</p>
                </div>
              </div>
              <span className="text-white/25 transition-all group-hover:translate-x-1 group-hover:text-[#D4A843]/60">
                &rarr;
              </span>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
