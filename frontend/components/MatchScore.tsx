export function MatchScore({ score }: { score: number | null }) {
  const value = score === null ? 0 : Math.max(0, Math.min(100, score));
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <p className="text-sm font-semibold text-[var(--mp-muted)]">Estimated compatibility</p>
        <p className="font-display text-4xl">{score === null ? "—" : `${value}%`}</p>
      </div>
      <div
        className="mt-3 h-3 overflow-hidden rounded-full bg-[var(--mp-soft)]"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score === null ? undefined : value}
        aria-label="Estimated compatibility"
      >
        <div className="h-full rounded-full bg-[var(--mp-primary)]" style={{ width: `${value}%` }} />
      </div>
      <p className="mt-2 text-xs leading-5 text-[var(--mp-muted)]">
        An overlap estimate so you can read the role. Not a decision about whether a company will hire you.
      </p>
    </div>
  );
}
