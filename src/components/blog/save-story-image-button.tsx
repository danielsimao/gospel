"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Copy } from "lucide-react";
import { trackStoryLinkCopied } from "@/lib/blog-analytics";
import type { Locale } from "@/lib/i18n";

interface SaveStoryImageButtonProps {
  locale: Locale;
  slug: string;
  label: string;
  hint: string;
  copyLabel: string;
  copiedLabel: string;
}

/**
 * Saves the post's 1080×1920 story graphic. iOS Safari only honors
 * navigator.share() during the tap's transient activation, so the file is
 * pre-fetched on mount and share() is called synchronously in the handler.
 */
export function SaveStoryImageButton({ locale, slug, label, hint, copyLabel, copiedLabel }: SaveStoryImageButtonProps) {
  const fileRef = useRef<File | null>(null);
  const [copied, setCopied] = useState(false);
  const storyUrl = `/${locale}/blog/${slug}/story`;

  useEffect(() => {
    let cancelled = false;
    fetch(storyUrl)
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (blob && !cancelled) {
          fileRef.current = new File([blob], `${slug}-story.png`, { type: "image/png" });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [storyUrl, slug]);

  const downloadFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.name;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleClick = () => {
    const file = fileRef.current;

    if (!file) {
      // Pre-fetch hasn't finished (or failed) — open the image directly.
      window.open(storyUrl, "_blank", "noopener");
      return;
    }

    if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file] }).catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        downloadFile(file);
      });
      return;
    }

    downloadFile(file);
  };

  const copyStickerLink = async () => {
    const url = `${window.location.origin}/${locale}/blog/${slug}?utm_source=ig_story&utm_medium=social&utm_campaign=${encodeURIComponent(slug)}`;
    try {
      await navigator.clipboard.writeText(url);
      trackStoryLinkCopied(slug);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard unavailable (non-secure context) — nothing to do
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        className="group inline-flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2 font-mono text-[11px] uppercase tracking-[2px] text-white/60 transition-all hover:border-[#D4A843]/25 hover:bg-[#D4A843]/[0.03] hover:text-[#D4A843]/70"
      >
        <Download className="size-3.5" />
        {label}
      </button>
      <p className="mt-3 text-xs text-white/40">{hint}</p>
      <button
        type="button"
        onClick={copyStickerLink}
        className="group mt-4 inline-flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2 font-mono text-[11px] uppercase tracking-[2px] text-white/60 transition-all hover:border-[#D4A843]/25 hover:bg-[#D4A843]/[0.03] hover:text-[#D4A843]/70"
      >
        <Copy className="size-3.5" />
        {copied ? copiedLabel : copyLabel}
      </button>
    </div>
  );
}
