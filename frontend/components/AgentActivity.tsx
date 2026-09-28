import type { AgentStep } from "@/lib/types";

const mark: Record<AgentStep["state"], string> = {
  pending: "○",
  active: "●",
  done: "✓",
  error: "!",
};

export function AgentActivity({ steps }: { steps: AgentStep[] }) {
  return (
    <ol className="space-y-3" aria-label="Agent activity">
      {steps.map((step) => (
        <li key={step.id} className="flex items-center gap-3 text-sm">
          <span
            aria-hidden="true"
            className={
              step.state === "done"
                ? "text-emerald-600"
                : step.state === "active"
                  ? "text-[var(--mp-primary)]"
                  : step.state === "error"
                    ? "text-[var(--mp-accent)]"
                    : "text-[var(--mp-muted)]"
            }
          >
            {mark[step.state]}
          </span>
          <span className={step.state === "pending" ? "text-[var(--mp-muted)]" : "font-semibold"}>
            {step.label}
            <span className="sr-only">
              {step.state === "done"
                ? ", done"
                : step.state === "active"
                  ? ", in progress"
                  : step.state === "error"
                    ? ", needs attention"
                    : ", waiting"}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}
