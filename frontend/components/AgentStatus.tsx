import type { RobotState } from "@/lib/types";

const copy: Record<RobotState, string> = {
  idle: "Waiting for your next role.",
  searching: "Looking through public listings.",
  reading: "Reading pages that opened.",
  matching: "Comparing skills with your profile.",
  generating: "Drafting application material.",
  completed: "The latest step is ready.",
};

export function AgentStatus({ state, title = "MIRAI AGENT" }: { state: RobotState; title?: string }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.18em] text-[var(--mp-primary)]">{title}</p>
      <p className="mt-1 text-sm text-[var(--mp-muted)]" aria-live="polite">
        {copy[state]}
      </p>
    </div>
  );
}
