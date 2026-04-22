"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { GenerationJobDetail } from "@character-factory/core";

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
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      description="This page is the landing zone for Sprint 3 and Sprint 4 outputs. The persisted job record is live now; prompt variants, generated images, and reviews will attach here as the queue pipeline lands."
    >
      <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
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
                  <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                    {job.status}
                  </span>
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
                <p>Source image: {job.sourceImageId ?? "-"}</p>
                <p>Created by: {job.createdBy || "-"}</p>
              </div>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <JsonCard title="Input Config" value={job.inputConfig} />
            <JsonCard
              title="Task Prompt"
              value={job.inputConfig.taskPrompt}
            />
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            <PlaceholderCard
              title="Prompt Variants"
              body="Prompt versions are not wired to jobs yet in this slice. This panel will list compiled variants once the queue and compiler handoff is added."
            />
            <PlaceholderCard
              title="Generated Images"
              body="Candidate images will appear here after the image generation processor starts writing into generated_images."
            />
            <PlaceholderCard
              title="Auto Reviews"
              body="Review scores and failure tags will land here once review_results are created in Sprint 4."
            />
          </section>
        </>
      ) : null}
    </PageFrame>
  );
}

function PlaceholderCard({
  title,
  body
}: {
  title: string;
  body: string;
}) {
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
        {title}
      </h3>
      <p className="mt-4 text-sm leading-6 text-slate-700">{body}</p>
    </section>
  );
}
