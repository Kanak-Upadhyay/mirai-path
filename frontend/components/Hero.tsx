import Link from "next/link";

import { RobotAssistant } from "@/components/RobotAssistant";

const chips = ["Python", "SQL", "FastAPI", "LangGraph", "Docker"];

export function Hero() {
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:py-16">
      <div>
        <p className="text-sm font-semibold tracking-[0.24em] text-[var(--mp-primary)]">未来 · FUTURE + PATH</p>
        <h1 className="font-display mt-4 text-5xl leading-tight sm:text-6xl">
          Your Future.
          <br />
          Your Path.
          <br />
          Your AI Career Companion.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--mp-muted)]">
          Research jobs. Understand requirements. Find your skill gaps. Prepare smarter applications.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/workspace" className="btn-primary">
            Start Your Journey
          </Link>
          <a href="#meaning" className="btn-ghost">
            What Mirai means
          </a>
        </div>
      </div>
      <div className="relative mx-auto w-full max-w-md">
        <div className="surface relative px-6 pt-6 pb-2">
          <RobotAssistant state="idle" className="mx-auto w-56" />
          <ul className="mb-4 flex flex-wrap justify-center gap-2" aria-label="Example skills">
            {chips.map((skill) => (
              <li key={skill} className="float-slow rounded-full bg-[var(--mp-soft)] px-3 py-1 text-sm font-semibold text-[var(--mp-primary)]">
                {skill}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
