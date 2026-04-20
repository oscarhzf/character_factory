import Link from "next/link";

export function PageFrame({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-6 py-10">
      <header className="space-y-5">
        <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
          <Link
            className="rounded-full border border-[var(--border)] px-3 py-1.5 hover:border-[var(--accent)]"
            href="/"
          >
            系统状态
          </Link>
          <Link
            className="rounded-full border border-[var(--border)] px-3 py-1.5 hover:border-[var(--accent)]"
            href="/universes"
          >
            Universes
          </Link>
          <Link
            className="rounded-full border border-[var(--border)] px-3 py-1.5 hover:border-[var(--accent)]"
            href="/characters"
          >
            Characters
          </Link>
          <Link
            className="rounded-full border border-[var(--border)] px-3 py-1.5 hover:border-[var(--accent)]"
            href="/prompts/debug"
          >
            Prompt Debug
          </Link>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="max-w-3xl text-sm leading-7 text-[var(--muted)]">
            {description}
          </p>
        </div>
      </header>

      {children}
    </main>
  );
}
