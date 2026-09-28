"use client";

import { motion, useReducedMotion } from "framer-motion";

import type { RobotState } from "@/lib/types";

const labels: Record<RobotState, string> = {
  idle: "MIRAI PATH companion waiting",
  searching: "MIRAI PATH companion searching",
  reading: "MIRAI PATH companion reading a page",
  matching: "MIRAI PATH companion matching skills",
  generating: "MIRAI PATH companion preparing writing",
  completed: "MIRAI PATH companion finished",
};

export function RobotAssistant({
  state = "idle",
  className = "",
}: {
  state?: RobotState;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const looking = state === "reading" ? 6 : 0;

  return (
    <div className={`relative ${className}`} role="img" aria-label={labels[state]}>
      {state === "searching" ? <SearchHalo reduced={!!reduced} /> : null}
      {state === "matching" ? <SkillOrbit reduced={!!reduced} /> : null}
      {state === "completed" ? <Spark reduced={!!reduced} /> : null}
      <motion.div
        animate={reduced ? undefined : { y: [0, -8, 0] }}
        transition={reduced ? undefined : { duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg viewBox="0 0 240 250" className="h-auto w-full" aria-hidden="true">
          <ellipse cx="120" cy="228" rx="54" ry="10" fill="rgb(108 99 255 / 18%)" />
          <path d="M120 46 V28" stroke="#8B7CF6" strokeWidth="4" strokeLinecap="round" />
          <circle cx="120" cy="22" r="7" fill="#FF7EB6" />
          <rect x="78" y="138" width="84" height="72" rx="26" fill="#8B7CF6" />
          <circle cx="120" cy="172" r="8" fill="#F8F7FF" />
          <rect x="42" y="150" width="28" height="14" rx="7" fill="#6C63FF" />
          <rect x="170" y="150" width="28" height="14" rx="7" fill="#6C63FF" />
          <motion.g animate={{ x: looking }} transition={{ type: "spring", stiffness: 120, damping: 14 }}>
            <rect x="68" y="48" width="104" height="84" rx="32" fill="#6C63FF" />
            <rect x="82" y="64" width="76" height="52" rx="22" fill="#F7F6FF" />
            <Eye cx={104} cy={90} reduced={!!reduced} />
            <Eye cx={136} cy={90} reduced={!!reduced} />
            <Mouth state={state} />
          </motion.g>
          {state === "reading" ? (
            <g>
              <rect x="168" y="78" width="46" height="58" rx="8" fill="#FFFFFF" stroke="#6C63FF" />
              <path d="M178 94 H204 M178 106 H204 M178 118 H196" stroke="#8B7CF6" strokeWidth="3" strokeLinecap="round" />
            </g>
          ) : null}
        </svg>
      </motion.div>
    </div>
  );
}

function Eye({ cx, cy, reduced }: { cx: number; cy: number; reduced: boolean }) {
  return (
    <motion.ellipse
      cx={cx}
      cy={cy}
      rx="6"
      ry="7"
      fill="#25243A"
      style={{ transformBox: "fill-box", transformOrigin: "center" }}
      animate={reduced ? { scaleY: 1 } : { scaleY: [1, 1, 0.15, 1] }}
      transition={reduced ? undefined : { duration: 0.35, repeat: Infinity, repeatDelay: 3.1 }}
    />
  );
}

function Mouth({ state }: { state: RobotState }) {
  if (state === "completed") {
    return <path d="M104 104 Q120 116 136 104" fill="none" stroke="#FF7EB6" strokeWidth="3" strokeLinecap="round" />;
  }
  if (state === "generating") {
    return (
      <g fill="#6C63FF">
        <circle cx="108" cy="108" r="2.4" />
        <circle cx="120" cy="108" r="2.4" />
        <circle cx="132" cy="108" r="2.4" />
      </g>
    );
  }
  return <path d="M108 106 H132" stroke="#FF7EB6" strokeWidth="3" strokeLinecap="round" />;
}

function SearchHalo({ reduced }: { reduced: boolean }) {
  return (
    <motion.span
      className="absolute inset-6 rounded-full border border-[var(--mp-accent)]"
      animate={reduced ? undefined : { scale: [0.92, 1.06, 0.92], opacity: [0.35, 0.8, 0.35] }}
      transition={reduced ? undefined : { duration: 2.2, repeat: Infinity }}
      aria-hidden="true"
    />
  );
}

function SkillOrbit({ reduced }: { reduced: boolean }) {
  const nodes = ["Py", "SQL", "API"];
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {nodes.map((label, index) => (
        <motion.span
          key={label}
          className="absolute rounded-full bg-[var(--mp-surface)] px-2 py-1 text-xs font-semibold text-[var(--mp-primary)] shadow"
          style={{ top: `${18 + index * 22}%`, left: index % 2 === 0 ? "0%" : "72%" }}
          animate={reduced ? undefined : { y: [0, -6, 0] }}
          transition={reduced ? undefined : { duration: 2.4, delay: index * 0.2, repeat: Infinity }}
        >
          {label}
        </motion.span>
      ))}
    </div>
  );
}

function Spark({ reduced }: { reduced: boolean }) {
  return (
    <motion.span
      className="absolute top-2 right-6 text-[var(--mp-accent)]"
      animate={reduced ? undefined : { scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
      transition={reduced ? undefined : { duration: 1.6, repeat: Infinity }}
      aria-hidden="true"
    >
      ✦
    </motion.span>
  );
}
