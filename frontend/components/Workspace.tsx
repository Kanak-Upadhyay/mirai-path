"use client";

import { useEffect, useMemo, useState } from "react";

import { AgentActivity } from "@/components/AgentActivity";
import { AgentStatus } from "@/components/AgentStatus";
import { ApplicationPanel } from "@/components/ApplicationPanel";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JobCard, JobCardSkeleton } from "@/components/JobCard";
import { RobotAssistant } from "@/components/RobotAssistant";
import { SearchForm } from "@/components/SearchForm";
import {
  ApiError,
  checkHealth,
  clearMemory,
  generateApplication,
  researchJobs,
  sessionId,
  removeResume,
  uploadResume,
} from "@/lib/api";
import { previewApplication, previewJob } from "@/lib/preview";
import type { AgentStep, ApplicationContent, JobResult, RobotState, SearchValues } from "@/lib/types";

const initialSteps: AgentStep[] = [
  { id: "understand", label: "Understanding your request", state: "pending" },
  { id: "strategy", label: "Creating search strategy", state: "pending" },
  { id: "search", label: "Searching jobs", state: "pending" },
  { id: "read", label: "Reading job pages", state: "pending" },
  { id: "match", label: "Matching your profile", state: "pending" },
  { id: "write", label: "Preparing application", state: "pending" },
];

export function Workspace() {
  const [online, setOnline] = useState<boolean | null>(null);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<AgentStep[]>(initialSteps);
  const [jobs, setJobs] = useState<JobResult[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const [resumeName, setResumeName] = useState("");
  const [resumeError, setResumeError] = useState("");
  const [selected, setSelected] = useState<JobResult | null>(null);
  const [application, setApplication] = useState<ApplicationContent | null>(null);
  const [appBusy, setAppBusy] = useState(false);
  const [appError, setAppError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    void checkHealth().then(setOnline);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const robot: RobotState = useMemo(() => {
    if (selected && appBusy) return "generating";
    if (selected && application) return "completed";
    const active = steps.find((step) => step.state === "active");
    if (!active) return jobs.length > 0 ? "completed" : "idle";
    if (active.id === "read") return "reading";
    if (active.id === "match") return "matching";
    if (active.id === "write") return "generating";
    return "searching";
  }, [appBusy, application, jobs.length, selected, steps]);

  async function onResume(file: File) {
    if (file.size === 0) {
      setResumeError("That file is empty.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setResumeError("That CV is larger than 10 MB.");
      return;
    }
    setResumeError("");
    setResumeName(file.name);
    try {
      await uploadResume(file, sessionId());
      setToast("Resume received");
    } catch (cause) {
      setResumeName("");
      setResumeError(cause instanceof ApiError ? cause.message : "Could not reach MIRAI PATH.");
    }
  }

  async function onSubmit(values: SearchValues) {
    setRunning(true);
    setError("");
    setNotice("");
    setPreview(false);
    setJobs([]);
    setSelected(null);
    setApplication(null);
    setSteps(initialSteps.map((step, index) => ({ ...step, state: index === 0 ? "active" : "pending" })));
    try {
      const response = await researchJobs(values, sessionId());
      setJobs(response.jobs);
      setNotice(response.notice ?? "");
      setSteps((current) =>
        current.map((step) => ({ ...step, state: step.id === "write" ? "pending" : "done" })),
      );
    } catch (cause) {
      const message = cause instanceof ApiError ? cause.message : "Hmm… the path got a little blurry.";
      setError(message);
      setSteps((current) =>
        current.map((step) => (step.state === "active" ? { ...step, state: "error" } : step)),
      );
    } finally {
      setRunning(false);
    }
  }

  function showPreview() {
    setPreview(true);
    setError("");
    setJobs([previewJob]);
    setSelected(null);
    setApplication(null);
    setSteps(initialSteps.map((step) => ({ ...step, state: step.id === "write" ? "pending" : "done" })));
  }

  async function prepare(job: JobResult) {
    setSelected(job);
    setAppError("");
    if (job.preview) {
      setApplication(previewApplication);
      setSteps((current) => current.map((step) => ({ ...step, state: "done" })));
      return;
    }
    setAppBusy(true);
    setApplication(null);
    setSteps((current) =>
      current.map((step) => ({ ...step, state: step.id === "write" ? "active" : step.state === "pending" ? "done" : step.state })),
    );
    try {
      const content = await generateApplication(job, sessionId());
      setApplication(content);
      setSteps((current) => current.map((step) => ({ ...step, state: "done" })));
    } catch (cause) {
      setAppError(cause instanceof ApiError ? cause.message : "The draft could not be prepared.");
      setSteps((current) =>
        current.map((step) => (step.id === "write" ? { ...step, state: "error" } : step)),
      );
    } finally {
      setAppBusy(false);
    }
  }

  async function onClearMemory() {
    try {
      await clearMemory(sessionId());
      setToast("Memory cleared");
    } catch (cause) {
      setToast(cause instanceof ApiError ? cause.message : "Memory could not be cleared.");
    }
  }

  return (
    <div>
      <Header current="workspace" />
      <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[var(--mp-muted)]">
            {online === null ? "Checking the companion…" : online ? "Companion online" : "Companion offline"}
          </p>
          <button type="button" className="btn-ghost" onClick={showPreview}>
            View interface preview
          </button>
        </div>
        <div className="grid items-start gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <SearchForm
            disabled={running}
            resumeName={resumeName}
            resumeError={resumeError}
            onResume={onResume}
            onClearResume={() => {
              setResumeName("");
              setResumeError("");
              void removeResume(sessionId()).catch(() => undefined);
            }}
            onSubmit={onSubmit}
            onClearMemory={onClearMemory}
          />
          <aside className="surface p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-[9rem_1fr] sm:items-center">
              <RobotAssistant state={robot} />
              <AgentStatus state={robot} />
            </div>
            <div className="mt-6">
              <AgentActivity steps={steps} />
            </div>
          </aside>
        </div>

        {error ? (
          <section className="surface mt-4 p-6" role="alert">
            <h2 className="font-display text-3xl">Hmm… the path got a little blurry.</h2>
            <p className="mt-3 max-w-2xl leading-7 text-[var(--mp-muted)]">{error}</p>
            <button type="button" className="btn-primary mt-5" onClick={() => setError("")}>
              Try Again
            </button>
          </section>
        ) : null}

        {running ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2" aria-hidden="true">
            <JobCardSkeleton />
            <JobCardSkeleton />
          </div>
        ) : null}

        {!running && jobs.length === 0 && !error && !notice ? (
          <section className="surface mt-4 grid items-center gap-4 p-6 sm:grid-cols-[10rem_1fr]">
            <RobotAssistant state="idle" />
            <div>
              <h2 className="font-display text-3xl">Your next opportunity starts here.</h2>
              <p className="mt-2 text-[var(--mp-muted)]">Tell MIRAI PATH what you are looking for.</p>
            </div>
          </section>
        ) : null}

        {!running && jobs.length === 0 && !error && notice ? (
          <section className="surface mt-4 p-6">
            <h2 className="font-display text-3xl">No public listings matched.</h2>
            <p className="mt-3 max-w-2xl leading-7 text-[var(--mp-muted)]">{notice}</p>
          </section>
        ) : null}

        {jobs.length > 0 ? (
          <section className="mt-4" aria-labelledby="results-title">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <h2 id="results-title" className="font-display text-3xl">
                {preview ? "Interface preview" : `${jobs.length} result${jobs.length === 1 ? "" : "s"}`}
              </h2>
              {notice ? <p className="text-sm text-[var(--mp-muted)]">{notice}</p> : null}
            </div>
            {preview ? (
              <p className="mb-3 text-sm text-[var(--mp-muted)]">
                Sample layout only. These details are not a live posting and the score is not a hiring decision.
              </p>
            ) : null}
            <div className="grid gap-4 lg:grid-cols-2">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} onPrepare={prepare} />
              ))}
            </div>
          </section>
        ) : null}

        {selected ? (
          <div className="mt-4">
            <ApplicationPanel
              jobTitle={selected.title}
              content={application}
              busy={appBusy}
              error={appError}
              onClose={() => {
                setSelected(null);
                setApplication(null);
                setAppError("");
              }}
              onRegenerate={() => prepare(selected)}
              onToast={setToast}
            />
          </div>
        ) : null}
      </main>
      <Footer />
      {toast ? (
        <p
          role="status"
          className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full bg-[var(--mp-text)] px-4 py-2 text-sm text-[var(--mp-bg)]"
        >
          {toast}
        </p>
      ) : null}
    </div>
  );
}
