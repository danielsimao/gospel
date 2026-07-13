"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { MotionConfig } from "framer-motion";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getConsent } from "@/lib/consent";
import { initPostHog } from "@/lib/posthog";

function PostHogPageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedUrlRef = useRef<string | null>(null);
  const search = searchParams.toString();

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY || typeof window === "undefined" || getConsent() !== "granted") {
      return;
    }

    let cancelled = false;

    // Ensure PostHog is loaded + initialized (idempotent — handles mid-session consent)
    initPostHog().then((ph) => {
      if (cancelled || !ph) return;

      const url = search ? `${window.location.origin}${pathname}?${search}` : `${window.location.origin}${pathname}`;

      if (lastTrackedUrlRef.current === url) {
        return;
      }

      lastTrackedUrlRef.current = url;

      try {
        ph.capture("$pageview", {
          $current_url: url,
          pathname,
        });
      } catch {
        // Analytics must never break the app
      }
    });

    return () => {
      cancelled = true;
    };
  }, [pathname, search]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <Suspense fallback={null}>
        <PostHogPageviewTracker />
      </Suspense>
      <SpeedInsights />
      {children}
    </MotionConfig>
  );
}
