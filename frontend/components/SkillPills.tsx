type Tone = "match" | "partial" | "gap" | "neutral";

const toneClass: Record<Tone, string> = {
  match: "bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  partial: "bg-amber-50 text-amber-950 dark:bg-amber-950 dark:text-amber-100",
  gap: "bg-[var(--mp-soft)] text-[var(--mp-text)]",
  neutral: "bg-[var(--mp-soft)] text-[var(--mp-text)]",
};

export function SkillPills({
  skills,
  tone = "neutral",
  label,
}: {
  skills: string[];
  tone?: Tone;
  label?: string;
}) {
  if (skills.length === 0) {
    return <p className="text-sm text-[var(--mp-muted)]">None listed</p>;
  }
  return (
    <ul className="flex flex-wrap gap-2" aria-label={label}>
      {skills.map((skill) => (
        <li key={skill} className={`rounded-full px-3 py-1 text-sm font-semibold ${toneClass[tone]}`}>
          {skill}
        </li>
      ))}
    </ul>
  );
}
