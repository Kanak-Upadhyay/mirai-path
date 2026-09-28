"use client";

import { useState } from "react";

import type { ApplicationContent } from "@/lib/types";

const tabs = [
  ["summary", "Professional Summary"],
  ["message", "Recruiter Message"],
  ["letter", "Cover Letter"],
  ["interview", "Interview Prep"],
  ["revise", "Skills to Revise"],
] as const;

type TabId = (typeof tabs)[number][0];

export function ApplicationPanel({
  jobTitle,
  content,
  busy,
  error,
  onClose,
  onRegenerate,
  onToast,
}: {
  jobTitle: string;
  content: ApplicationContent | null;
  busy: boolean;
  error: string;
  onClose: () => void;
  onRegenerate: () => void;
  onToast: (message: string) => void;
}) {
  const [tab, setTab] = useState<TabId>("summary");
  const text = content ? textFor(tab, content) : "";

  async function copy() {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    onToast("Copied");
  }

  function download() {
    if (!text) return;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mirai-path-${tab}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    onToast("Download started");
  }

  return (
    <section className="surface p-5 sm:p-6" aria-labelledby="application-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-[var(--mp-primary)]">APPLICATION</p>
          <h2 id="application-title" className="font-display text-3xl">
            {jobTitle}
          </h2>
        </div>
        <button type="button" className="btn-ghost" onClick={onClose}>
          Close
        </button>
      </div>
      <div role="tablist" aria-label="Application sections" className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            className={tab === id ? "btn-primary shrink-0" : "btn-ghost shrink-0"}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        className="mt-4 min-h-40 rounded-2xl bg-[var(--mp-bg)] p-4 whitespace-pre-wrap leading-7"
      >
        {busy ? "Preparing this draft…" : content ? text : "Choose Prepare Application on a result to draft this section."}
      </div>
      {error ? <p className="mt-3 text-sm text-rose-700 dark:text-rose-300">{error}</p> : null}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button type="button" className="btn-ghost" onClick={copy} disabled={!text || busy}>
          Copy
        </button>
        <button type="button" className="btn-ghost" onClick={download} disabled={!text || busy}>
          Download
        </button>
        <button type="button" className="btn-primary" onClick={onRegenerate} disabled={busy}>
          Regenerate
        </button>
      </div>
    </section>
  );
}

function textFor(tab: TabId, content: ApplicationContent): string {
  if (tab === "summary") return content.summary;
  if (tab === "message") return content.recruiterMessage;
  if (tab === "letter") return content.coverLetter;
  if (tab === "interview") return content.interviewQuestions.map((item, index) => `${index + 1}. ${item}`).join("\n");
  return content.skillsToRevise.map((item, index) => `${index + 1}. ${item}`).join("\n");
}
