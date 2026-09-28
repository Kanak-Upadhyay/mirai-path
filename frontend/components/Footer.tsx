export function Footer({ onReplay }: { onReplay?: () => void }) {
  return (
    <footer className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <div className="surface flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-2xl">MIRAI PATH</p>
          <p className="mt-1 text-sm font-semibold text-[var(--mp-primary)]">Future + Path</p>
          <p className="mt-3 max-w-md text-sm leading-6 text-[var(--mp-muted)]">
            AI-powered career research companion. Mirai (未来) means Future.
          </p>
        </div>
        <div className="text-sm text-[var(--mp-muted)]">
          <p>Built with Python · LangGraph · FastAPI · Next.js</p>
          {onReplay ? (
            <button type="button" className="mt-3 underline decoration-[var(--mp-primary)]" onClick={onReplay}>
              Replay introduction
            </button>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
