import type { ReviewBestUse } from "@character-factory/core";

function formatBestUseLabel(value: ReviewBestUse): string {
  return value.replaceAll("_", " ");
}

export function ScoreBadge({
  score,
  bestUse
}: {
  score: number;
  bestUse: ReviewBestUse;
}) {
  const palette =
    score >= 88
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : score >= 74
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${palette}`}
    >
      <span>{score.toFixed(0)}</span>
      <span className="uppercase tracking-[0.14em]">{formatBestUseLabel(bestUse)}</span>
    </div>
  );
}
