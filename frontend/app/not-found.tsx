import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6">
      <p className="text-sm font-semibold tracking-[0.22em] text-[var(--mp-primary)]">未来</p>
      <h1 className="font-display mt-3 text-5xl">This path is not on the map.</h1>
      <p className="mt-4 text-[var(--mp-muted)]">The page you asked for is not part of MIRAI PATH.</p>
      <Link href="/" className="btn-primary mt-8 w-fit">
        Back to MIRAI PATH
      </Link>
    </main>
  );
}
