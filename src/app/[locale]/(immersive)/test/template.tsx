"use client";

import { m } from "framer-motion";
import { EASE_OUT_STRONG } from "@/lib/motion";

/**
 * Cross-route phase crossfade. Templates remount on every navigation (layouts
 * do not), so this reproduces the 0.2s fade that AnimatePresence used to give
 * the in-component phase switch. Without it the migration to real routes would
 * silently turn every phase change into a hard cut.
 *
 * Opacity only — no transform — so it never creates a containing block for the
 * fixed washes the verdict and grace screens rely on.
 */
export default function TestTemplate({ children }: { children: React.ReactNode }) {
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: EASE_OUT_STRONG }}
      className="flex flex-1 flex-col"
    >
      {children}
    </m.div>
  );
}
