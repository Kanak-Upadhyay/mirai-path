import Link from "next/link";

import { ThemeToggle } from "@/components/ThemeToggle";

export function Header({ current }: { current: "home" | "workspace" }) {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
      <Link href="/" className="min-w-0">
        <span className="block text-xs font-semibold tracking-[0.22em] text-[var(--mp-primary)]">未来</span>
        <span className="font-display block truncate text-xl text-[var(--mp-text)]">MIRAI PATH</span>
      </Link>
      <nav aria-label="Primary" className="flex items-center gap-2">
        <Link
          href={current === "home" ? "/workspace" : "/"}
          className="btn-ghost min-h-11 px-4"
        >
          {current === "home" ? "Workspace" : "Home"}
        </Link>
        <ThemeToggle />
      </nav>
    </header>
  );
}
