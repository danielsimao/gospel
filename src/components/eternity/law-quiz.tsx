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
  caseLabel: string;
  questionLabel: string;
  answeredLabel: string;
  chipGuilty: string;
  chipDenied: string;
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
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showGuilty, setShowGuilty] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showBridge, setShowBridge] = useState(false);
  const [deathsDuring, setDeathsDuring] = useState(0);
  const startTime = useRef<number | null>(null);
  const guiltyRef = useRef<HTMLDivElement>(null);
  const bridgeRef = useRef<HTMLDivElement>(null);

  const total = messages.questions.length;
  const answeredCount = answers.filter((a) => a !== null).length;
  const isComplete = answeredCount === total;

  const handleAnswer = useCallback(
    (choice: "yes" | "no") => {
      if (startTime.current === null) startTime.current = Date.now();

      const idx = currentIdx;
      trackQuizAnswered(idx, choice);
      const newAnswers = [...answers];
      newAnswers[idx] = choice;
      setAnswers(newAnswers);

      const totalAnswered = newAnswers.filter((a) => a !== null).length;

      if (totalAnswered === total) {
        // Wait for response animation then show verdict
        setTimeout(() => {
          setShowGuilty(true);
          trackGuiltyShown();
          setTimeout(() => {
            guiltyRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 100);
        }, 1400);

        setTimeout(() => {
          const elapsed = (Date.now() - (startTime.current ?? Date.now())) / 1000;
          setDeathsDuring(Math.floor(elapsed * DEATHS_PER_SECOND));
          setShowSummary(true);
        }, 2600);

        setTimeout(() => {
          setShowBridge(true);
          setTimeout(() => {
            bridgeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 100);
        }, 3800);
      } else {
        // Advance to next question after showing response briefly
        setTimeout(() => setCurrentIdx(idx + 1), 1400);
      }
    },
    [answers, currentIdx, total],
  );

  const currentQuestion = messages.questions[currentIdx];
  const currentAnswer = answers[currentIdx];

  return (
    <div className="flex flex-col items-center w-full">
      {/* Header */}
      <div className="flex w-full max-w-md flex-col items-center px-2">
        <div className="mb-3 flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[3px] text-red-400/50">
            {messages.caseLabel}
          </span>
          <span className="font-mono text-[9px] tabular-nums text-red-400/50">
            {String(currentIdx + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
        </div>
        <h2 className="text-center text-2xl font-bold leading-tight tracking-tight text-white/90 sm:text-3xl">
          {messages.heading}
        </h2>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[3px] text-white/25">
          {messages.subtitle}
        </p>
      </div>

      {/* Progress segments */}
      <div className="mt-6 flex w-full max-w-xs items-center gap-1.5 sm:max-w-sm">
        {messages.questions.map((_, i) => (
          <div
            key={i}
            className="flex-1 overflow-hidden rounded-full bg-white/[0.04]"
            style={{ height: "2px" }}
          >
            <motion.div
              initial={false}
              animate={{
                width: i < answeredCount ? "100%" : i === currentIdx ? "50%" : "0%",
                backgroundColor:
                  answers[i] === "yes"
                    ? "rgb(239, 68, 68)"
                    : answers[i] === "no"
                    ? "rgba(239, 68, 68, 0.4)"
                    : "rgba(239, 68, 68, 0.25)",
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full"
            />
          </div>
        ))}
      </div>

      {/* Question card — single, swaps */}
      <div className="relative mt-6 w-full max-w-xs sm:max-w-sm" style={{ minHeight: "280px" }}>
        <AnimatePresence mode="wait">
          {!isComplete && (
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0"
            >
              <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-6 sm:p-7">
                {/* Corner index badge */}
                <div className="absolute right-4 top-4 font-mono text-[10px] tabular-nums text-white/15">
                  {String(currentIdx + 1).padStart(2, "0")}
                </div>

                {/* Commandment number in corner */}
                <div className="mb-4 flex items-center gap-2">
                  <span className="h-px w-6 bg-red-500/40" />
                  <span className="font-mono text-[9px] uppercase tracking-[3px] text-red-400/60">
                    {currentAnswer === null ? messages.questionLabel : messages.answeredLabel}
                  </span>
                </div>

                <p className="text-[17px] font-semibold leading-snug text-white/95 sm:text-lg">
                  {currentQuestion.question}
                </p>

                <AnimatePresence mode="wait">
                  {currentAnswer === null ? (
                    <motion.div
                      key="buttons"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-5 flex gap-2"
                    >
                      <button
                        onClick={() => handleAnswer("yes")}
                        className="group relative flex-1 overflow-hidden rounded-xl border border-red-700/40 bg-red-950/40 px-4 py-3 text-sm font-semibold tracking-wide text-red-300 transition-all duration-300 hover:border-red-600/60 hover:bg-red-900/40 min-h-[48px]"
                      >
                        <span className="relative z-10">{messages.yesLabel}</span>
                        <span className="absolute inset-0 bg-gradient-to-r from-red-900/0 via-red-700/20 to-red-900/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      </button>
                      <button
                        onClick={() => handleAnswer("no")}
                        className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm font-medium tracking-wide text-white/50 transition-all hover:border-white/15 hover:bg-white/[0.04] hover:text-white/70 min-h-[48px]"
                      >
                        {messages.noLabel}
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="response"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                      className="mt-5 space-y-2.5"
                    >
                      <p className="text-[13px] leading-relaxed text-white/45">
                        {currentAnswer === "yes"
                          ? currentQuestion.yesResponse
                          : currentQuestion.noResponse}
                      </p>
                      {currentAnswer === "yes" && (
                        <motion.div
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: 0.25 }}
                          className="flex items-center gap-2 border-t border-red-900/30 pt-2.5"
                        >
                          <span className="h-1 w-1 rounded-full bg-red-500" />
                          <p className="font-mono text-[11px] font-semibold uppercase tracking-[2px] text-red-400">
                            {currentQuestion.verdict}
                          </p>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Answered chips — compact history */}
      {answeredCount > 0 && !isComplete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-5 flex w-full max-w-xs flex-wrap justify-center gap-1.5 sm:max-w-sm"
        >
          {messages.questions.map((q, i) => {
            if (answers[i] === null) return null;
            return (
              <div
                key={i}
                className="flex items-center gap-1.5 rounded-full border border-red-900/30 bg-red-950/20 px-2.5 py-1"
              >
                <span className="font-mono text-[9px] tabular-nums text-red-400/50">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[1.5px] text-red-400/70">
                  {answers[i] === "yes" ? messages.chipGuilty : messages.chipDenied}
                </span>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Guilty verdict */}
      <AnimatePresence>
        {showGuilty && (
          <motion.div
            ref={guiltyRef}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-12 text-center"
          >
            <p
              className="text-5xl font-black uppercase tracking-[0.15em] text-red-500 sm:text-6xl md:text-7xl"
              style={{
                textShadow:
                  "0 0 80px rgba(239,68,68,0.35), 0 0 160px rgba(239,68,68,0.12), 0 4px 40px rgba(0,0,0,0.8)",
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="mt-8 max-w-xs text-center sm:max-w-sm"
          >
            <div className="mx-auto mb-4 h-px w-12 bg-white/[0.08]" />
            <p className="text-sm italic leading-relaxed text-white/50">
              &ldquo;{messages.scripture}&rdquo;
            </p>
            <p className="mt-2 text-[10px] font-mono uppercase tracking-widest text-white/20">
              {messages.scriptureRef}
            </p>
            <p className="mt-5 font-mono text-xs tabular-nums text-red-400/40">
              {messages.deathsDuring.replace("{count}", deathsDuring.toLocaleString())}
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
            className="mt-8"
          >
            <button
              onClick={() => {
                trackBridgeClicked();
                onBridgeClick();
              }}
              className="rounded-lg border border-[#D4A843]/20 px-8 py-3.5 text-sm font-medium tracking-wide text-[#D4A843]/80 transition-all duration-500 hover:border-[#D4A843]/40 hover:bg-[#D4A843]/[0.05] hover:text-[#D4A843] min-h-[48px]"
              style={{ animation: "eternity-gentle-pulse 3s ease-in-out infinite" }}
            >
              {messages.bridgeButton} &darr;
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
