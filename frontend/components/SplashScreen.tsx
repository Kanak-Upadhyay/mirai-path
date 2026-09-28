"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

import { RobotAssistant } from "@/components/RobotAssistant";

export function SplashScreen({
  onStart,
  onSkip,
}: {
  onStart: () => void;
  onSkip: () => void;
}) {
  const startRef = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    startRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onSkip();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSkip]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[var(--mp-bg)] px-6"
      role="dialog"
      aria-modal="true"
      aria-label="MIRAI PATH introduction"
    >
      <div className="pointer-events-none absolute inset-x-0 top-1/2" aria-hidden="true">
        <svg viewBox="0 0 360 40" className="mx-auto w-full max-w-3xl">
          <path
            d="M8 28 C 70 4, 140 4, 180 22 S 290 40, 352 12"
            fill="none"
            stroke="#FF7EB6"
            strokeWidth="3"
            strokeLinecap="round"
            className={reduced ? "" : "path-draw"}
          />
        </svg>
      </div>
      <div className="relative w-full max-w-xl text-center">
        <p className="text-sm font-semibold tracking-[0.28em] text-[var(--mp-primary)]">未来</p>
        <h1 className="font-display mt-3 text-5xl sm:text-6xl">MIRAI PATH</h1>
        <p className="mt-4 text-lg font-semibold text-[var(--mp-muted)]">FUTURE + PATH</p>
        <RobotAssistant state="idle" className="mx-auto mt-2 w-40" />
        <p className="text-lg">
          Your AI-powered
          <br />
          career companion
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button ref={startRef} type="button" className="btn-primary" onClick={onStart}>
            Start Your Journey →
          </button>
          <button type="button" className="btn-ghost" onClick={onSkip}>
            Skip intro
          </button>
        </div>
      </div>
    </div>
  );
}
