import { notFound } from "next/navigation";

/**
 * Catch-all for unmatched paths under a valid locale. Without this, Next
 * serves its default unstyled 404 instead of the locale not-found page.
 */
export default function CatchAll() {
  notFound();
}
