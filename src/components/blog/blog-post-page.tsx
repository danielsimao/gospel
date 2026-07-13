import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/shared/page-shell";
import { Button, ButtonArrow } from "@/components/ui/button";
import { SaveStoryImageButton } from "./save-story-image-button";
import { BlogViewTracker } from "./blog-view-tracker";
import type { BlogPostContent } from "@/content/blog/types";
import type { Locale } from "@/lib/i18n";

interface BlogChromeMessages {
  label: string;
  saveStoryButton: string;
  saveStoryHint: string;
  referencesLabel: string;
  ctaHeading: string;
  ctaButton: string;
}

interface BlogPostPageProps {
  slug: string;
  content: BlogPostContent;
  datePublished: string;
  locale: Locale;
  messages: BlogChromeMessages;
}

export function BlogPostPage({ slug, content, datePublished, locale, messages }: BlogPostPageProps) {
  const formattedDate = new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
    new Date(`${datePublished}T00:00:00Z`),
  );

  return (
    <PageShell>
      <article>
        <BlogViewTracker slug={slug} locale={locale} />
        <Link
          href={`/${locale}/blog`}
          className="group mb-6 inline-flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[2px] text-white/60 transition-all hover:border-[#D4A843]/25 hover:bg-[#D4A843]/[0.03] hover:text-[#D4A843]/70"
        >
          <ArrowLeft className="size-3 transition-transform group-hover:-translate-x-0.5" />
          {messages.label}
        </Link>

        <p className="mt-3 font-mono text-[10px] uppercase tracking-[2.5px] text-white/40">
          {formattedDate}
        </p>
        <h1
          className="mt-3 text-3xl font-bold tracking-tight text-[#D4A843] sm:text-4xl md:text-5xl"
          style={{ textShadow: "0 0 60px rgba(212,168,67,0.2)" }}
        >
          {content.title}
        </h1>
        <p className="mt-3 text-sm text-white/60">{content.hook}</p>

        <div className="mt-12">
          {content.sections.map((section, i) => (
            <section key={i} className="mt-12 first:mt-0">
              {section.heading && (
                <div className="mb-4 flex items-center gap-3">
                  <span className="h-px w-6 bg-[#D4A843]/40" />
                  <h2 className="text-xl font-bold text-white/90 sm:text-2xl">{section.heading}</h2>
                </div>
              )}

              <div className="space-y-4">
                {section.body.split("\n\n").map((paragraph, j) => (
                  <p key={j} className="text-[15px] leading-[1.85] text-white/60 sm:text-base">
                    {paragraph}
                  </p>
                ))}
              </div>

              {section.scripture && section.scriptureRef && (
                <blockquote className="mt-6 border-l border-[#D4A843]/30 pl-5">
                  <p className="text-[15px] italic leading-[1.85] text-white/55 sm:text-base">
                    &ldquo;{section.scripture}&rdquo;
                  </p>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-[#D4A843]/70">
                    {section.scriptureRef}
                  </p>
                </blockquote>
              )}
            </section>
          ))}
        </div>

        {content.sources && content.sources.length > 0 && (
          <div className="mt-14 border-t border-white/[0.06] pt-6">
            <h3 className="font-mono text-[10px] uppercase tracking-[2.5px] text-[#D4A843]/70">
              {messages.referencesLabel}
            </h3>
            <ul className="mt-3 space-y-2">
              {content.sources.map((source, i) => (
                <li key={i}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white/50 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white/70"
                  >
                    {source.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-14 border-t border-white/[0.06] pt-8 text-center">
          <SaveStoryImageButton
            locale={locale}
            slug={slug}
            label={messages.saveStoryButton}
            hint={messages.saveStoryHint}
          />
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-white/60">{messages.ctaHeading}</p>
          <Link href={`/${locale}/test`} className="mt-3 inline-block">
            <Button variant="gold" mist>
              {messages.ctaButton}
              <ButtonArrow />
            </Button>
          </Link>
        </div>
      </article>
    </PageShell>
  );
}
