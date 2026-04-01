"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { DottedWorldMap } from "@/components/eternity/dotted-world-map";
import { DeathCounter } from "@/components/eternity/death-counter";
import { ShareButtons } from "@/components/share-buttons";
import type { Locale } from "@/lib/i18n";

export interface EternityMessages {
  hero: {
    counter: string;
    counterSuffix: string;
    subtitle: string;
  };
  question: {
    heading: string;
    scripture: string;
    scriptureRef: string;
    body: string;
  };
  grace: {
    heading: string;
    body: string;
    scripture: string;
    scriptureRef: string;
  };
  invitation: {
    heading: string;
    subtitle: string;
    testCta: string;
    chatCta: string;
    resources: Array<{ name: string; url: string }>;
  };
  share: {
    prompt: string;
    whatsappMessage: string;
    telegramMessage: string;
    linkCopied: string;
  };
}

interface EternityShellProps {
  messages: EternityMessages;
  locale: Locale;
}

function FadeInSection({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function EternityShell({ messages, locale }: EternityShellProps) {
  return (
    <div className="flex flex-col">
      <section className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-16">
        <DeathCounter
          prefix={messages.hero.counter}
          suffix={messages.hero.counterSuffix}
        />

        <div className="mt-10 w-full">
          <DottedWorldMap />
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 1.5 }}
          className="mt-8 text-center text-base text-white/40 sm:text-lg"
        >
          {messages.hero.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 8, 0] }}
          transition={{
            opacity: { duration: 1, delay: 3 },
            y: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 3 },
          }}
          className="absolute bottom-8"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-white/20"
          >
            <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
          </svg>
        </motion.div>
      </section>

      <section className="flex min-h-dvh flex-col items-center justify-center px-6 py-20">
        <div className="max-w-xl text-center">
          <FadeInSection>
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              {messages.question.heading}
            </h2>
          </FadeInSection>

          <FadeInSection delay={0.3}>
            <blockquote className="mt-10 border-l-2 border-white/20 pl-4 text-left">
              <p className="text-base italic text-white/60 sm:text-lg">
                &ldquo;{messages.question.scripture}&rdquo;
              </p>
              <p className="mt-2 text-sm text-white/30">
                {messages.question.scriptureRef}
              </p>
            </blockquote>
          </FadeInSection>

          <FadeInSection delay={0.6}>
            <p className="mt-10 text-base leading-relaxed text-white/70 sm:text-lg">
              {messages.question.body}
            </p>
          </FadeInSection>
        </div>
      </section>

      <section className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-20">
        <div className="pointer-events-none absolute inset-0 z-0">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.15 }}
            viewport={{ once: true, margin: "-200px" }}
            transition={{ duration: 3 }}
            className="absolute inset-0"
            style={{
              background:
                "conic-gradient(from 0deg at 50% 40%, transparent 0deg, rgba(212, 168, 67, 0.3) 15deg, transparent 30deg, transparent 60deg, rgba(212, 168, 67, 0.2) 75deg, transparent 90deg, transparent 150deg, rgba(212, 168, 67, 0.25) 165deg, transparent 180deg, transparent 240deg, rgba(212, 168, 67, 0.15) 255deg, transparent 270deg, transparent 330deg, rgba(212, 168, 67, 0.2) 345deg, transparent 360deg)",
              filter: "blur(40px)",
            }}
          />
        </div>

        <div className="relative z-10 max-w-2xl text-center">
          <FadeInSection>
            <h2 className="text-3xl font-bold text-[#D4A843] sm:text-4xl">
              {messages.grace.heading}
            </h2>
          </FadeInSection>

          <div className="mt-10 space-y-6 text-left">
            {messages.grace.body.split("\n\n").map((paragraph, i) => (
              <FadeInSection key={i} delay={0.2 + i * 0.2}>
                <p className="text-base leading-relaxed text-white/80 sm:text-lg">
                  {paragraph}
                </p>
              </FadeInSection>
            ))}
          </div>

          <FadeInSection delay={0.4}>
            <blockquote className="mt-10 border-l-2 border-[#D4A843] pl-4 text-left">
              <p className="text-base italic text-white/70 sm:text-lg">
                &ldquo;{messages.grace.scripture}&rdquo;
              </p>
              <p className="mt-2 text-sm text-white/40">
                {messages.grace.scriptureRef}
              </p>
            </blockquote>
          </FadeInSection>
        </div>
      </section>

      <section className="flex min-h-[80dvh] flex-col items-center justify-center px-6 py-20">
        <div className="max-w-lg w-full text-center">
          <FadeInSection>
            <h2 className="text-3xl font-bold sm:text-4xl">
              {messages.invitation.heading}
            </h2>
            <p className="mt-4 text-base text-white/60 sm:text-lg">
              {messages.invitation.subtitle}
            </p>
          </FadeInSection>

          <FadeInSection delay={0.3}>
            <div className="mt-10 flex flex-col gap-4">
              <a
                href={`/${locale}`}
                className="rounded-lg border border-[#D4A843]/30 px-6 py-4 text-base font-medium text-[#D4A843] transition-colors hover:bg-[#D4A843]/5 active:bg-[#D4A843]/10 min-h-[44px] flex items-center justify-center"
              >
                {messages.invitation.testCta} &rarr;
              </a>
              <a
                href={`/${locale}/chat`}
                className="rounded-lg border border-white/20 px-6 py-4 text-base font-medium text-white/70 transition-colors hover:bg-white/5 active:bg-white/10 min-h-[44px] flex items-center justify-center"
              >
                {messages.invitation.chatCta} &rarr;
              </a>
            </div>
          </FadeInSection>

          <FadeInSection delay={0.5}>
            <div className="mt-10 flex flex-col gap-2">
              {messages.invitation.resources.map((resource) => (
                <a
                  key={resource.url}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-white/10 px-4 py-3 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white/80"
                >
                  {resource.name} &rarr;
                </a>
              ))}
            </div>
          </FadeInSection>

          <FadeInSection delay={0.6}>
            <ShareButtons messages={messages.share} locale={locale} />
          </FadeInSection>
        </div>
      </section>
    </div>
  );
}
