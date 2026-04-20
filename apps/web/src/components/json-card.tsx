export function JsonCard({
  title,
  value
}: {
  title: string;
  value: unknown;
}) {
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
        {title}
      </h3>
      <pre className="mt-4 overflow-x-auto rounded-2xl bg-[#f6f1e8] p-4 text-sm leading-6 text-slate-700">
        {JSON.stringify(value, null, 2)}
      </pre>
    </section>
  );
}

