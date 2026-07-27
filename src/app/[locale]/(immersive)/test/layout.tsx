import { GameProvider } from "@/components/game-provider";

/**
 * Holds the game reducer above the flow. The phases used to be sibling routes
 * and this layout was what let state survive navigating between them; the flow
 * is one route again, so the layout is now just the provider's home — kept
 * rather than folded into the page so the reducer is not remounted by any
 * future segment added under /test.
 */
export default function TestLayout({ children }: { children: React.ReactNode }) {
  return <GameProvider>{children}</GameProvider>;
}
