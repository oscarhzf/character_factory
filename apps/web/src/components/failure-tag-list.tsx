import type { ReviewFailureTag } from "@character-factory/core";

function formatFailureTag(value: ReviewFailureTag): string {
  return value.replaceAll("_", " ");
}

export function FailureTagList({ tags }: { tags: readonly ReviewFailureTag[] }) {
  if (tags.length === 0) {
    return (
      <p className="text-sm text-emerald-700">No failure tags from the latest auto review.</p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700"
          key={tag}
        >
          {formatFailureTag(tag)}
        </span>
      ))}
    </div>
  );
}
