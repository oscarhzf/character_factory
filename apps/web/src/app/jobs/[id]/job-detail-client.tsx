"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { GenerationJobDetail, PromptVersionRecord } from "@character-factory/core";

import { JsonCard } from "@/components/json-card";
import { PageFrame } from "@/components/page-frame";
import { requestApi } from "@/lib/api-client";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function JobDetailClient({ id }: { id: string }) {
  const [job, setJob] = useState<GenerationJobDetail | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedVariant =
    job?.promptVariants.find((variant) => variant.id === selectedVariantId) ??
    job?.promptVariants[0] ??
    null;

  useEffect(() => {
    let cancelled = false;

    async function loadJob() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const data = await requestApi<GenerationJobDetail>(`/api/jobs/${id}`);

        if (cancelled) {
          return;
        }

        setJob(data);
        setSelectedVariantId((current) =>
          current && data.promptVariants.some((variant) => variant.id === current)
            ? current
            : (data.promptVariants[0]?.id ?? "")
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : "Failed to load job.");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadJob();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <PageFrame
      title="Job Detail"
      description="This page is the landing zone for Sprint 3 outputs. Jobs now aggregate persisted prompt variants and candidate images so the create-job workflow can be reviewed end-to-end before the async runner lands."
    >
      <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
        <Link className="rounded-full border border-[var(--border)] px-3 py-1.5" href="/jobs/new">
          New Job
        </Link>
        {job ? (
          <Link
            className="rounded-full border border-[var(--border)] px-3 py-1.5"
            href={`/characters/${job.character.id}`}
          >
            Character
          </Link>
        ) : null}
      </div>

      {errorMessage ? (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {errorMessage}
        </section>
      ) : null}

      {isLoading ? (
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <p className="text-sm text-[var(--muted)]">Loading job detail...</p>
        </section>
      ) : null}

      {!isLoading && !job ? (
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Job not found</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            The requested generation job id does not exist.
          </p>
        </section>
      ) : null}

      {!isLoading && job ? (
        <>
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent)]">
                    {job.mode}
                  </p>
                  <JobStatusChip value={job.status} />
                </div>
                <h2 className="text-2xl font-semibold">
                  {job.character.code} / {job.character.name}
                </h2>
                <p className="text-sm text-[var(--muted)]">
                  {job.character.universe.code} / {job.character.universe.name}
                </p>
              </div>
              <div className="space-y-2 text-sm text-[var(--muted)]">
                <p>Created: {formatDate(job.createdAt)}</p>
                <p>Updated: {formatDate(job.updatedAt)}</p>
                <p>Batch size: {job.batchSize}</p>
                <p>Images per variant: {job.inputConfig.imagesPerVariant}</p>
                <p>Source image: {job.sourceImageId ?? "-"}</p>
                <p>Created by: {job.createdBy || "-"}</p>
              </div>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            <JsonCard title="Input Config" value={job.inputConfig} />
            <JsonCard title="Task Prompt" value={job.inputConfig.taskPrompt} />
            <JsonCard
              title="Prompt Variant Summary"
              value={{
                count: job.promptVariants.length,
                strategies: job.promptVariants.map((variant) => variant.strategy)
              }}
            />
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Candidate Images</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Candidate images are grouped under the job and keep their prompt variant association.
                </p>
              </div>
              <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-medium text-slate-600">
                {job.generatedImages.length}
              </span>
            </div>

            {job.generatedImages.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-[var(--border)] bg-[#fcfaf4] px-5 py-8 text-sm text-[var(--muted)]">
                This job does not have any `generated_images` yet.
              </div>
            ) : (
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {job.generatedImages.map((image) => (
                  <article
                    className="overflow-hidden rounded-3xl border border-[var(--border)] bg-white shadow-sm"
                    key={image.id}
                  >
                    <div
                      aria-label={`candidate-${image.id}`}
                      className="aspect-[4/5] w-full bg-slate-100 bg-cover bg-center"
                      style={{
                        backgroundImage: image.thumbUrl || image.imageUrl
                          ? `url("${image.thumbUrl ?? image.imageUrl}")`
                          : undefined
                      }}
                    />
                    <div className="space-y-3 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <ImageStatusChip value={image.status} />
                        {image.promptVariant ? (
                          <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-medium text-slate-600">
                            {image.promptVariant.variantKey}
                          </span>
                        ) : null}
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="font-medium text-slate-800">{image.modelName}</p>
                        <p className="text-[var(--muted)]">Source API: {image.sourceApi}</p>
                        <p className="text-[var(--muted)]">
                          Created: {formatDate(image.createdAt)}
                        </p>
                      </div>
                      {image.promptVariant ? (
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
                          {image.promptVariant.strategy}
                        </p>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {job.promptVariants.length === 0 ? (
            <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
              <h2 className="text-lg font-semibold">No prompt variants yet</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Prompt variants will appear here after job-scoped compilation runs.
              </p>
            </section>
          ) : (
            <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
              <article className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">Prompt Variants</h2>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Persisted prompt versions compiled for this job.
                    </p>
                  </div>
                  <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-medium text-slate-600">
                    {job.promptVariants.length}
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {job.promptVariants.map((variant) => (
                    <button
                      className={`w-full rounded-2xl border px-4 py-3 text-left text-sm ${
                        selectedVariant?.id === variant.id
                          ? "border-[var(--accent)] bg-[#f6f1e8]"
                          : "border-[var(--border)] bg-white"
                      }`}
                      key={variant.id}
                      onClick={() => setSelectedVariantId(variant.id)}
                      type="button"
                    >
                      <p className="font-medium">
                        {variant.variantKey} / {variant.strategy}
                      </p>
                      <p className="mt-1 text-[var(--muted)]">
                        {formatDate(variant.createdAt)}
                      </p>
                    </button>
                  ))}
                </div>
              </article>

              {selectedVariant ? (
                <VariantDetailPanel variant={selectedVariant} />
              ) : null}
            </section>
          )}
        </>
      ) : null}
    </PageFrame>
  );
}

function VariantDetailPanel({ variant }: { variant: PromptVersionRecord }) {
  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
          Variant Meta
        </h3>
        <div className="mt-4 space-y-3 text-sm text-slate-700">
          <p>
            <span className="font-medium">Variant:</span> {variant.variantKey}
          </p>
          <p>
            <span className="font-medium">Strategy:</span> {variant.strategy}
          </p>
          <p>
            <span className="font-medium">Scope:</span> {variant.scope}
          </p>
          <p>
            <span className="font-medium">Parent:</span>{" "}
            {variant.parentPromptVersionId ?? "root version"}
          </p>
        </div>
      </section>

      <JsonCard title="Template Snapshot" value={variant.debugPayload.templateConfig} />
      <PromptTextCard title={`${variant.variantKey} Prompt`} value={variant.compiledPrompt} />
      <PromptTextCard
        title={`${variant.variantKey} Negative Prompt`}
        value={variant.compiledNegativePrompt}
      />
      <JsonCard title="Resolved Task Prompt" value={variant.debugPayload.resolvedTaskPrompt} />
      <JsonCard title="Prompt Patch" value={variant.patch ?? null} />
      <JsonCard title="Debug Sections" value={variant.debugPayload.sections} />
      <JsonCard title="Debug Payload" value={variant.debugPayload} />
    </section>
  );
}

function PromptTextCard({
  title,
  value
}: {
  title: string;
  value: string;
}) {
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
        {title}
      </h3>
      <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-words rounded-2xl bg-slate-950 p-4 text-sm leading-6 text-slate-100">
        {value || "(empty)"}
      </pre>
    </section>
  );
}

function JobStatusChip({
  value
}: {
  value: GenerationJobDetail["status"];
}) {
  const palette =
    value === "completed"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : value === "failed"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : value === "running" || value === "reviewing"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${palette}`}>
      {value}
    </span>
  );
}

function ImageStatusChip({
  value
}: {
  value: GenerationJobDetail["generatedImages"][number]["status"];
}) {
  const palette =
    value === "master"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : value === "candidate_master"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : value === "rejected"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${palette}`}>
      {value}
    </span>
  );
}
