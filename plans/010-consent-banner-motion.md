# 010 — Slide the consent banner in and out

- **Status**: TODO
- **Commit**: 71deab3
- **Severity**: MEDIUM-HIGH
- **Category**: Missed opportunity / physicality
- **Estimated scope**: 1 file (`src/components/shared/consent-banner.tsx`), ~15 lines

## Problem

The bottom-fixed consent banner — the first UI every new visitor sees — mounts with zero motion (pops in after hydration) and unmounts instantly on accept/decline.

```tsx
/* src/components/shared/consent-banner.tsx — current structure */
export function ConsentBanner() {
  const visible = useSyncExternalStore(
    subscribeToConsentAnswered,
    () => !hasAnsweredConsent(),
    () => false,
  );

  if (!visible) return null;

  const lang = typeof document !== "undefined" && document.documentElement.lang.startsWith("pt") ? "pt" : "en";
  const copy = COPY[lang];
  ...
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.08] bg-[#060404]/95 backdrop-blur-sm">
```

## Target

AnimatePresence-wrapped slide: enters `translateY(100%) → 0` over 300ms with the house ease; exits down+fade in 150ms.

```tsx
/* target — imports */
import { motion, AnimatePresence } from "framer-motion";
import { EASE_OUT_STRONG } from "@/lib/motion";
```

```tsx
/* target — structure (early return removed; lang/copy/handlers stay above the return) */
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%", opacity: 0, transition: { duration: 0.15, ease: "easeIn" } }}
          transition={{ duration: 0.3, ease: EASE_OUT_STRONG }}
          className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.08] bg-[#060404]/95 backdrop-blur-sm"
        >
          ...existing inner content unchanged...
        </motion.div>
      )}
    </AnimatePresence>
  );
```

Notes:
- `y: "100%"` = the element's own height — no hardcoded pixels.
- The `if (!visible) return null;` early return is REPLACED by the conditional inside AnimatePresence (otherwise exit can't play). Move the `lang`/`copy` derivation above the return (it's SSR-guarded already).
- Exit uses a quick ease-in (leaving = system response, snappy).

## Repo conventions to follow

- `EASE_OUT_STRONG` from `@/lib/motion` (exemplar: `src/components/eternity/rotating-facts.tsx:5,32`).
- AnimatePresence conditional pattern: `src/components/grace-screen.tsx:177`.

## Steps

1. Add the two imports.
2. Restructure the return per Target; nothing inside the banner div changes.
3. Delete the early return.

## Boundaries

- Do NOT touch the consent logic, handlers, `initPostHog`, or the store subscription.
- Do NOT animate on the server pass (AnimatePresence handles it — `visible` is false on server).
- If the component differs from the excerpt (drift since 71deab3), STOP and report.

## Verification

- **Mechanical**: `pnpm lint && pnpm test && npx tsc --noEmit && pnpm build` — green.
- **Feel check**: fresh profile (`localStorage.clear()`), load `/en`: banner slides up from the bottom edge (~300ms). Click Accept: slides down + fades quickly. Nothing pops.
- **Done when**: entrance and exit both animate; no instant mount/unmount.
