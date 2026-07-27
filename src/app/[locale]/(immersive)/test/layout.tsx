import { GameProvider } from "@/components/game-provider";

/**
 * Holds the game reducer above the phase segments. Next.js preserves layouts
 * across sibling-segment navigation, so state survives /test → /test/verdict.
 * With GameProvider in page.tsx it would remount on every navigation and wipe
 * the reducer — this layout is what makes routes-per-phase possible at all.
 */
export default function TestLayout({ children }: { children: React.ReactNode }) {
  return <GameProvider>{children}</GameProvider>;
}
