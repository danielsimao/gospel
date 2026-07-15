"use client";

import { Suspense, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";

function OwnerToolsInner({ children }: { children: ReactNode }) {
  const params = useSearchParams();
  if (params.get("tools") !== "1") return null;
  return <>{children}</>;
}

/**
 * Publisher-only UI, revealed with ?tools=1. The story-image workflow
 * (save PNG, copy sticker link) is the owner's posting routine, not a
 * reader feature — exposed by default it read as internal tooling leaked
 * into the article. Client-side so the page stays fully static.
 */
export function OwnerTools({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <OwnerToolsInner>{children}</OwnerToolsInner>
    </Suspense>
  );
}
