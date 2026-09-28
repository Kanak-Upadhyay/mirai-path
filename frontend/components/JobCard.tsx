"use client";

import { useState } from "react";

import { MatchScore } from "@/components/MatchScore";
import { SkillPills } from "@/components/SkillPills";
import type { JobResult } from "@/lib/types";

export function JobCard({
  job,
  onPrepare,
}: {
  job: JobResult;
  onPrepare: (job: JobResult) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <article className="surface flex h-full flex-col p-5">
      {job.preview ? (
        <p className="text-xs font-semibold tracking-wide text-[var(--mp-accent)]">SAMPLE LAYOUT · NOT A LIVE JOB</p>
      ) : null}
      <h3 className="font-display mt-1 text-2xl">{job.title}</h3>
      <p className="mt-1 text-sm text-[var(--mp-muted)]">
        {job.company} · {job.location} · {job.employmentType}
      </p>
      <p className="mt-3 text-sm">Experience: {job.experience || "Not specified"}</p>
      <p className="text-sm">Salary: {job.salary || "Not specified"}</p>
      <div className="mt-4">
        <SkillPills skills={job.skills} label="Skills on this role" />
      </div>
      <div className="mt-4">
        <MatchScore score={job.compatibilityScore} />
      </div>
      <p className="mt-3 text-xs text-[var(--mp-muted)]">Source: {job.source || "Not specified"}</p>
      {open ? (
        <div className="mt-4 space-y-3 border-t border-[var(--mp-line)] pt-4">
          <p className="text-sm leading-6">{job.explanation}</p>
          <Group title="Matched skills" skills={job.matchedSkills} tone="match" />
          <Group title="Partial" skills={job.partialSkills} tone="partial" />
          <Group title="Potential gaps" skills={job.missingSkills} tone="gap" />
        </div>
      ) : null}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {job.url ? (
          <a className="btn-ghost" href={job.url} target="_blank" rel="noreferrer noopener">
            View Job
          </a>
        ) : (
          <button type="button" className="btn-ghost" disabled>
            View Job
          </button>
        )}
        <button type="button" className="btn-ghost" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
          {open ? "Hide analysis" : "Analyze"}
        </button>
        <button type="button" className="btn-primary" onClick={() => onPrepare(job)}>
          Prepare Application
        </button>
      </div>
    </article>
  );
}

function Group({
  title,
  skills,
  tone,
}: {
  title: string;
  skills: string[];
  tone: "match" | "partial" | "gap";
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold">{title}</p>
      <SkillPills skills={skills} tone={tone} label={title} />
    </div>
  );
}

export function JobCardSkeleton() {
  return (
    <div className="surface h-64 animate-pulse p-5" aria-hidden="true">
      <div className="h-6 w-2/3 rounded-full bg-[var(--mp-soft)]" />
      <div className="mt-3 h-4 w-1/2 rounded-full bg-[var(--mp-soft)]" />
      <div className="mt-6 h-3 w-full rounded-full bg-[var(--mp-soft)]" />
    </div>
  );
}
