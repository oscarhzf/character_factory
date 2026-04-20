"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  CharacterListItem,
  GenerationJobCreateInput,
  GenerationJobListItem,
  GenerationJobRecord
} from "@character-factory/core";

import { JobForm } from "@/components/job-form";
import { PageFrame } from "@/components/page-frame";
import { requestApi } from "@/lib/api-client";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function JobCreateClient({
  preferredCharacterId
}: {
  preferredCharacterId?: string;
}) {
  const router = useRouter();
  const [characters, setCharacters] = useState<CharacterListItem[]>([]);
  const [recentJobs, setRecentJobs] = useState<GenerationJobListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sortedCharacters = useMemo(
    () => [...characters].sort((left, right) => left.name.localeCompare(right.name)),
    [characters]
  );

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [characterData, jobData] = await Promise.all([
          requestApi<CharacterListItem[]>("/api/characters"),
          requestApi<GenerationJobListItem[]>("/api/jobs?limit=6")
        ]);

        if (cancelled) {
          return;
        }

        setCharacters(characterData);
        setRecentJobs(jobData);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load job creation data."
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreate(payload: GenerationJobCreateInput) {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const created = await requestApi<GenerationJobRecord>("/api/jobs", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      router.push(`/jobs/${created.id}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create job.");
      setIsSubmitting(false);
    }
  }

  return (
    <PageFrame
      title="Create Job"
      description="This Sprint 3 slice only covers job creation and task detail scaffolding. Queue workers, prompt materialization, generated images, and auto reviews will plug into this record next."
    >
      <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
        <Link className="rounded-full border border-[var(--border)] px-3 py-1.5" href="/characters">
          Characters
        </Link>
      </div>

      {errorMessage ? (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {errorMessage}
        </section>
      ) : null}

      {isLoading ? (
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <p className="text-sm text-[var(--muted)]">Loading job creation workspace...</p>
        </section>
      ) : (
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
          <article className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">New generation job</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Persist the job first. Queue dispatch, prompt compilation, and image generation will attach to this record in the next Sprint 3 slices.
              </p>
            </div>
            <JobForm
              characters={sortedCharacters}
              initialCharacterId={preferredCharacterId}
              isSubmitting={isSubmitting}
              onSubmit={handleCreate}
              key={`${preferredCharacterId ?? "default"}:${sortedCharacters
                .map((character) => character.id)
                .join(",")}`}
            />
          </article>

          <section className="space-y-4">
            <article className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Recent jobs</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                These are the latest persisted job records from `generation_jobs`.
              </p>
            </article>

            {recentJobs.length === 0 ? (
              <article className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
                <h2 className="text-lg font-semibold">No jobs yet</h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  The first created job will appear here and open its detail page.
                </p>
              </article>
            ) : (
              recentJobs.map((job) => (
                <article
                  className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm"
                  key={job.id}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent)]">
                        {job.mode} / {job.status}
                      </p>
                      <h2 className="text-lg font-semibold">
                        {job.character.code} / {job.character.name}
                      </h2>
                      <p className="text-sm text-[var(--muted)]">
                        {job.character.universe.code} / {job.character.universe.name}
                      </p>
                      <p className="text-sm text-[var(--muted)]">
                        Batch size: {job.batchSize} | Updated: {formatDate(job.updatedAt)}
                      </p>
                    </div>
                    <Link
                      className="rounded-full border border-[var(--border)] px-4 py-2 text-sm"
                      href={`/jobs/${job.id}`}
                    >
                      Details
                    </Link>
                  </div>
                </article>
              ))
            )}
          </section>
        </section>
      )}
    </PageFrame>
  );
}
