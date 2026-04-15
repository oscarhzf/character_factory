export function StatusChip({
  value
}: {
  value: "draft" | "active" | "locked";
}) {
  const palette =
    value === "active"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : value === "locked"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${palette}`}>
      {value}
    </span>
  );
}

