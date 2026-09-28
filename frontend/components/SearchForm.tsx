"use client";

import { useState, type ReactNode } from "react";

import type { SearchValues } from "@/lib/types";

const empty: SearchValues = {
  role: "",
  location: "",
  experience: "",
  skills: "",
  jobType: "Any",
  salary: "",
  preferences: "",
};

export function SearchForm({
  disabled,
  resumeName,
  resumeError,
  onResume,
  onClearResume,
  onSubmit,
  onClearMemory,
}: {
  disabled: boolean;
  resumeName: string;
  resumeError: string;
  onResume: (file: File) => void;
  onClearResume: () => void;
  onSubmit: (values: SearchValues) => void;
  onClearMemory: () => void;
}) {
  const [values, setValues] = useState<SearchValues>(empty);
  const [roleError, setRoleError] = useState("");

  function update<K extends keyof SearchValues>(key: K, value: SearchValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  return (
    <form
      className="surface p-5 sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (!values.role.trim()) {
          setRoleError("Add the role you want to research.");
          return;
        }
        setRoleError("");
        onSubmit(values);
      }}
    >
      <h2 className="font-display text-3xl">Search jobs</h2>
      <div className="mt-5 grid gap-4">
        <Field label="Role" error={roleError}>
          <input
            className="field"
            value={values.role}
            onChange={(event) => update("role", event.target.value)}
            placeholder="Python Data Engineer"
            required
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Location">
            <input
              className="field"
              value={values.location}
              onChange={(event) => update("location", event.target.value)}
              placeholder="Bangalore"
            />
          </Field>
          <Field label="Experience">
            <input
              className="field"
              value={values.experience}
              onChange={(event) => update("experience", event.target.value)}
              placeholder="2–4 years"
            />
          </Field>
        </div>
        <Field label="Skills">
          <input
            className="field"
            value={values.skills}
            onChange={(event) => update("skills", event.target.value)}
            placeholder="Python, SQL, FastAPI"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Job type">
            <select
              className="field"
              value={values.jobType}
              onChange={(event) => update("jobType", event.target.value)}
            >
              <option>Any</option>
              <option>Full-time</option>
              <option>Contract</option>
              <option>Internship</option>
            </select>
          </Field>
          <Field label="Salary preference">
            <input
              className="field"
              value={values.salary}
              onChange={(event) => update("salary", event.target.value)}
              placeholder="Optional"
            />
          </Field>
        </div>
        <Field label="Preferences">
          <textarea
            className="field min-h-24"
            value={values.preferences}
            onChange={(event) => update("preferences", event.target.value)}
            placeholder="Remote-friendly, product companies, Python-heavy teams"
          />
        </Field>
        <Field label="Resume" hint="PDF, Word, text, or a photo of your CV. Up to 10 MB.">
          <input
            className="field"
            type="file"
            accept=".pdf,.doc,.docx,.txt,.rtf,.odt,.jpg,.jpeg,.png,.webp,application/pdf"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onResume(file);
              event.target.value = "";
            }}
          />
          {resumeName ? (
            <p className="mt-2 flex items-center justify-between gap-3 text-sm">
              <span className="truncate">{resumeName}</span>
              <button type="button" className="underline" onClick={onClearResume}>
                Remove
              </button>
            </p>
          ) : null}
          {resumeError ? <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">{resumeError}</p> : null}
        </Field>
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button type="submit" className="btn-primary" disabled={disabled}>
          {disabled ? "Researching…" : "Start Research"}
        </button>
        <button type="button" className="btn-ghost" onClick={onClearMemory}>
          Clear Memory
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <span className="mt-2 block font-normal">{children}</span>
      {hint ? <span className="mt-1 block font-normal text-[var(--mp-muted)]">{hint}</span> : null}
      {error ? <span className="mt-1 block font-normal text-rose-700 dark:text-rose-300">{error}</span> : null}
    </label>
  );
}
