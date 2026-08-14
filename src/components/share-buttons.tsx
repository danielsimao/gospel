"use client";

import { useState, useSyncExternalStore } from "react";
import { m } from "framer-motion";
import { Check, Link, Share2 } from "lucide-react";
import { trackShared } from "@/lib/analytics";
import type { Locale } from "@/lib/i18n";

interface ShareButtonsProps {
  messages: {
    prompt: string;
    whatsappMessage: string;
    telegramMessage: string;
    linkCopied: string;
  };
  locale: Locale;
  /** Override the shared URL path. Defaults to `/${locale}`. */
  sharePath?: string;
  /** When set, share URLs carry utm_source/<channel>, utm_medium=share, utm_campaign. */
  utmCampaign?: string;
  /** When set, the copy button copies "<copyText> <url>" instead of the bare URL —
      so a pasted share still carries the message, not just a link. */
  copyText?: string;
  /** When set and the Web Share API is available, render only the native
      Share button — the OS sheet already covers WhatsApp, Telegram, and
      everything else, so offering them again beside it is the clutter this
      exists to cut. Falls back to WhatsApp/Telegram/copy where the API is
      unavailable, same as the default. */
  nativeOnly?: boolean;
  /** Fired after any share action succeeds, alongside the per-channel
      trackShared call — for a caller that needs to know "a share happened"
      without caring which channel. */
  onShare?: (channel: "whatsapp" | "telegram" | "copy" | "native") => void;
}

function subscribeToNavigator() {
  return () => {};
}

export function ShareButtons({ messages, locale, sharePath, utmCampaign, copyText, nativeOnly, onShare }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const canNativeShare = useSyncExternalStore(
    subscribeToNavigator,
    () => typeof navigator !== "undefined" && typeof navigator.share === "function",
    () => false,
  );

  function getShareUrl(channel: "whatsapp" | "telegram" | "copy" | "native") {
    const path = sharePath ?? `/${locale}`;
    const base = typeof window === "undefined" ? path : `${window.location.origin}${path}`;
    if (!utmCampaign) return base;
    return `${base}?utm_source=${channel}&utm_medium=share&utm_campaign=${encodeURIComponent(utmCampaign)}`;
  }

  function shareWhatsApp() {
    trackShared("whatsapp", locale);
    onShare?.("whatsapp");
    const text = encodeURIComponent(`${messages.whatsappMessage} ${getShareUrl("whatsapp")}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  function shareTelegram() {
    trackShared("telegram", locale);
    onShare?.("telegram");
    const url = encodeURIComponent(getShareUrl("telegram"));
    const text = encodeURIComponent(messages.telegramMessage);
    window.open(
      `https://t.me/share/url?url=${url}&text=${text}`,
      "_blank",
    );
  }

  async function copyLink() {
    try {
      const url = getShareUrl("copy");
      await navigator.clipboard.writeText(copyText ? `${copyText} ${url}` : url);
      trackShared("copy", locale);
      onShare?.("copy");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available in non-secure context
    }
  }

  async function nativeShare() {
    if (!navigator.share) return;
    try {
      await navigator.share({ url: getShareUrl("native"), text: messages.whatsappMessage });
      trackShared("native", locale);
      onShare?.("native");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      // Real error — log but don't crash
    }
  }

  // With nativeOnly, once we know the Web Share API exists the OS sheet
  // already covers every channel below it — showing them side by side is
  // exactly the redundancy this prop exists to cut. `canNativeShare` is
  // false on the server and the first client render (see the store above),
  // so this never disagrees with hydration.
  const showNativeOnly = nativeOnly && canNativeShare;

  return (
    <div className="mt-8 text-center">
      <p className="text-sm text-white/60 mb-4">{messages.prompt}</p>
      <div className="flex items-center justify-center gap-4">
        {!showNativeOnly && (
          <>
            <button
              type="button"
              onClick={shareWhatsApp}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/55 transition-colors hover:border-[#25D366]/40 hover:text-[#25D366] min-h-[44px] min-w-[44px]"
              aria-label="Share on WhatsApp"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </button>

            <button
              type="button"
              onClick={shareTelegram}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/55 transition-colors hover:border-[#0088cc]/40 hover:text-[#0088cc] min-h-[44px] min-w-[44px]"
              aria-label="Share on Telegram"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.492-1.302.48-.428-.013-1.252-.242-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
            </button>

            <button
              type="button"
              onClick={copyLink}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/55 transition-colors hover:border-white/25 hover:text-white/80 min-h-[44px] min-w-[44px]"
              aria-label="Copy link"
            >
              {copied ? (
                <Check className="h-5 w-5" strokeWidth={2} aria-hidden />
              ) : (
                <Link className="h-5 w-5" strokeWidth={2} aria-hidden />
              )}
            </button>
          </>
        )}

        {canNativeShare && (
          <button
            type="button"
            onClick={nativeShare}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/55 transition-colors hover:border-white/25 hover:text-white/80 min-h-[44px] min-w-[44px]"
            aria-label="Share"
          >
            <Share2 className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
        )}
      </div>

      {copied && (
        <m.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-sm text-white/60"
        >
          {messages.linkCopied}
        </m.p>
      )}
    </div>
  );
}
