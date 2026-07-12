"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

// Last-resort boundary: replaces the root layout when it crashes, so it must
// render its own <html>/<body>. Inline styles only — the stylesheet may not
// have survived whatever broke.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#060404",
          color: "rgba(255,255,255,0.6)",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          textAlign: "center",
          padding: "4rem 1.5rem",
        }}
      >
        <p
          style={{
            fontFamily: "ui-monospace, monospace",
            fontSize: 9,
            textTransform: "uppercase",
            letterSpacing: 3,
            color: "rgba(248,113,113,0.75)",
            margin: 0,
          }}
        >
          — Error —
        </p>
        <p style={{ marginTop: 24, maxWidth: 320, fontSize: 14, lineHeight: 1.6 }}>
          Something broke. It wasn&rsquo;t the message.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: 32,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "ui-monospace, monospace",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: 2.5,
            color: "rgba(212,168,67,0.8)",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
