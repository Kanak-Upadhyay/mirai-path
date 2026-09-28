import Link from "next/link";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { MatchScore } from "@/components/MatchScore";
import { SkillPills } from "@/components/SkillPills";

const steps = [
  { title: "Tell it the role", body: "Role, city, experience, and the skills you already use." },
  { title: "It reads public pages", body: "Only pages that can be opened normally. Nothing behind a login." },
  { title: "You see the gaps", body: "Matched skills, partial overlaps, and what the posting still asks for." },
  { title: "You prepare the note", body: "A recruiter message, cover letter, and interview questions from that match." },
];

export function Landing({ onReplay }: { onReplay: () => void }) {
  return (
    <div>
      <Header current="home" />
      <main id="main">
        <Hero />
        <section id="meaning" className="mx-auto grid w-full max-w-6xl gap-4 px-4 sm:px-6 md:grid-cols-2">
          <article className="surface p-6">
            <p className="text-3xl text-[var(--mp-primary)]">未来</p>
            <h2 className="font-display mt-2 text-3xl">Mirai means Future</h2>
            <p className="mt-3 leading-7 text-[var(--mp-muted)]">
              The name is Japanese for future. MIRAI PATH is the route from the skills you have now to the work you want next.
            </p>
          </article>
          <article className="surface p-6">
            <p className="text-sm font-semibold tracking-[0.18em] text-[var(--mp-accent)]">PATH</p>
            <h2 className="font-display mt-2 text-3xl">A career journey</h2>
            <p className="mt-3 leading-7 text-[var(--mp-muted)]">
              Not a generic chat box. A companion that researches a role, compares it with your resume, and helps you apply with care.
            </p>
          </article>
        </section>
        <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6" aria-labelledby="steps-title">
          <h2 id="steps-title" className="font-display text-3xl">How the path works</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step.title} className="surface p-5">
                <p className="text-sm font-semibold text-[var(--mp-primary)]">0{index + 1}</p>
                <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--mp-muted)]">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>
        <section className="mx-auto grid w-full max-w-6xl items-center gap-6 px-4 pb-8 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl">A look at a result</h2>
            <p className="mt-3 leading-7 text-[var(--mp-muted)]">
              This card is a sample of the layout. It is not a live job posting, and the percentage is not a hiring decision.
            </p>
            <Link href="/workspace" className="btn-primary mt-6">
              Open the workspace
            </Link>
          </div>
          <article className="surface p-6">
            <p className="text-xs font-semibold tracking-wide text-[var(--mp-accent)]">SAMPLE LAYOUT</p>
            <h3 className="font-display mt-2 text-2xl">Python Data Engineer</h3>
            <p className="mt-1 text-sm text-[var(--mp-muted)]">Sample Company · Bangalore · Full-time</p>
            <div className="mt-4">
              <SkillPills skills={["Python", "SQL", "ETL", "FastAPI"]} />
            </div>
            <div className="mt-5">
              <MatchScore score={78} />
            </div>
          </article>
        </section>
      </main>
      <Footer onReplay={onReplay} />
    </div>
  );
}
