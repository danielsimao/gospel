"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  trackQuizAnswered,
  trackGuiltyShown,
  trackBridgeClicked,
} from "@/lib/eternity-analytics";

interface QuizQuestion {
  question: string;
  yesResponse: string;
  noResponse: string;
  verdict: string;
}

export interface LawQuizMessages {
  heading: string;
  subtitle: string;
  yesLabel: string;
  noLabel: string;
  questions: QuizQuestion[];
  guiltyTitle: string;
  guiltyDesc: string;
  scripture: string;
  scriptureRef: string;
  deathsDuring: string;
  bridgeButton: string;
}

interface LawQuizProps {
  messages: LawQuizMessages;
  onBridgeClick: () => void;
}

const DEATHS_PER_SECOND = 1.8;

export function LawQuiz({ messages, onBridgeClick }: LawQuizProps) {
  const [answers, setAnswers] = useState<(string | null)[]>(
    new Array(messages.questions.length).fill(null),
  );
  const [showGuilty, setShowGuilty] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showBridge, setShowBridge] = useState(false);
  const [deathsDuring, setDeathsDuring] = useState(0);
  const startTime = useRef<number | null>(null);
  const guiltyRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const bridgeRef = useRef<HTMLDivElement>(null);

  const answeredCount = answers.filter((a) => a !== null).length;

  const handleAnswer = useCallback(
    (index: number, choice: "yes" | "no") => {
      if (answers[index] !== null) return;

      // Start timer on first answer
      if (startTime.current === null) {
        startTime.current = Date.now();
      }

      trackQuizAnswered(index, choice);
      const newAnswers = [...answers];
      newAnswers[index] = choice;
      setAnswers(newAnswers);

      const totalAnswered = newAnswers.filter((a) => a !== null).length;

      if (totalAnswered === messages.questions.length) {
        // Disable scroll snap on the container
        document.getElementById("eternity-container")?.classList.add("snap-off");

        // Show guilty after pause
        setTimeout(() => {
          setShowGuilty(true);
          trackGuiltyShown();
          setTimeout(() => {
            guiltyRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }, 100);
        }, 1000);

        // Show summary
        setTimeout(() => {
          const elapsed = (Date.now() - (startTime.current ?? Date.now())) / 1000;
          setDeathsDuring(Math.floor(elapsed * DEATHS_PER_SECOND));
          setShowSummary(true);
          setTimeout(() => {
            summaryRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }, 100);
        }, 2200);

        // Show bridge
        setTimeout(() => {
          setShowBridge(true);
          setTimeout(() => {
            bridgeRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }, 100);
        }, 3200);
      }
    },
    [answers, messages.questions.length],
  );

  return (
    <div className="flex flex-col items-center w-full">
      <h2 className="text-3xl font-bold text-center leading-snug max-w-md tracking-tight text-white/90 sm:text-4xl">
        {messages.heading}
      </h2>
      <p className="mt-3 text-xs font-mono uppercase tracking-[3px] text-white/25">{messages.subtitle}</p>

      <div className="mt-12 w-full max-w-sm space-y-3">
        {messages.questions.map((q, i) => {
          const isLocked = i > 0 && answers[i - 1] === null;
          const isAnswered = answers[i] !== null;

          return (
            <motion.div
              key={i}
              initial={{ opacity: i === 0 ? 1 : 0.3 }}
              animate={{
                opacity: isLocked ? 0.2 : 1,
                filter: isLocked ? "blur(3px)" : "none",
              }}
              transition={{ duration: 0.5 }}
              className={`rounded-lg border p-5 transition-all duration-500 ${
                isAnswered
                  ? "border-red-900/30 bg-red-950/20"
                  : "border-white/[0.06] bg-white/[0.015]"
              } ${isLocked ? "pointer-events-none" : ""}`}
            >
              <p className="text-[15px] font-medium leading-relaxed text-white/85">{q.question}</p>

              {!isAnswered && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleAnswer(i, "yes")}
                    className="flex-1 rounded border border-red-800/30 bg-red-950/30 px-4 py-2.5 text-xs font-medium tracking-wide text-red-400 transition-all hover:bg-red-950/50 hover:border-red-700/40 min-h-[44px]"
                  >
                    {messages.yesLabel}
                  </button>
                  <button
                    onClick={() => handleAnswer(i, "no")}
                    className="flex-1 rounded border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-xs font-medium tracking-wide text-white/40 transition-all hover:bg-white/[0.05] min-h-[44px]"
                  >
                    {messages.noLabel}
                  </button>
                </div>
              )}

              <AnimatePresence>
                {isAnswered && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.5 }}
                    className="mt-3 border-l border-red-800/40 pl-3"
                  >
                    <p className="text-xs leading-relaxed text-white/40">
                      {answers[i] === "yes" ? q.yesResponse : q.noResponse}
                    </p>
                    {answers[i] === "yes" && (
                      <p className="mt-1.5 text-xs font-semibold tracking-wide text-red-400/80">
                        {q.verdict}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Guilty verdict */}
      <AnimatePresence>
        {showGuilty && (
          <motion.div
            ref={guiltyRef}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-14 text-center"
          >
            <p
              className="text-6xl font-black uppercase tracking-[0.2em] text-red-500 sm:text-7xl"
              style={{
                textShadow: "0 0 80px rgba(239,68,68,0.35), 0 0 160px rgba(239,68,68,0.12), 0 4px 40px rgba(0,0,0,0.8)",
              }}
            >
              {messages.guiltyTitle}
            </p>
            <p className="mt-4 text-sm tracking-wide text-white/40">{messages.guiltyDesc}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary scripture */}
      <AnimatePresence>
        {showSummary && (
          <motion.div
            ref={summaryRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="mt-10 max-w-sm text-center"
          >
            <div className="mx-auto mb-4 h-px w-12 bg-white/[0.08]" />
            <p className="text-sm italic leading-relaxed text-white/50">
              &ldquo;{messages.scripture}&rdquo;
            </p>
            <p className="mt-2 text-[10px] font-mono uppercase tracking-widest text-white/20">
              {messages.scriptureRef}
            </p>
            <p className="mt-5 font-mono text-xs tabular-nums text-red-400/40">
              {messages.deathsDuring.replace(
                "{count}",
                deathsDuring.toLocaleString(),
              )}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bridge to grace */}
      <AnimatePresence>
        {showBridge && (
          <motion.div
            ref={bridgeRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="mt-10"
          >
            <button
              onClick={() => {
                trackBridgeClicked();
                onBridgeClick();
              }}
              className="rounded-lg border border-[#D4A843]/20 px-8 py-3.5 text-sm font-medium tracking-wide text-[#D4A843]/80 transition-all duration-500 hover:border-[#D4A843]/40 hover:bg-[#D4A843]/[0.05] hover:text-[#D4A843] min-h-[48px]"
              style={{
                animation: "eternity-gentle-pulse 3s ease-in-out infinite",
              }}
            >
              {messages.bridgeButton} &darr;
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
