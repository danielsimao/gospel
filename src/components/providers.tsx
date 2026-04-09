"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

function PostHogPageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedUrlRef = useRef<string | null>(null);
  const search = searchParams.toString();

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY || typeof window === "undefined") {
      return;
    }

    const url = search ? `${window.location.origin}${pathname}?${search}` : `${window.location.origin}${pathname}`;

    if (lastTrackedUrlRef.current === url) {
      return;
    }

    lastTrackedUrlRef.current = url;

    try {
      posthog.capture("$pageview", {
        $current_url: url,
        pathname,
      });
    } catch {
      // Analytics must never break the app
    }
  }, [pathname, search]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <PostHogPageviewTracker />
      </Suspense>
      <Analytics />
      <SpeedInsights />
      {children}
    </>
  );
}
