"use client";

import { useEffect, useEffectEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  CharacterCreateInput,
  CharacterListItem,
  GenerationJobCreateInput,
  GenerationJobRecord,
  UniverseRecord
} from "@character-factory/core";

import { CharacterForm } from "@/components/character-form";
import { JobForm } from "@/components/job-form";
import { JsonCard } from "@/components/json-card";
import { PageFrame } from "@/components/page-frame";
import { StatusChip } from "@/components/status-chip";
import { requestApi } from "@/lib/api-client";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function CharacterDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [universes, setUniverses] = useState<UniverseRecord[]>([]);
  const [character, setCharacter] = useState<CharacterListItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function refresh() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [characterData, universeData] = await Promise.all([
        requestApi<CharacterListItem>(`/api/characters/${id}`),
        requestApi<UniverseRecord[]>("/api/universes")
      ]);

      setCharacter(characterData);
      setUniverses(universeData);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "加载角色详情失败。");
    } finally {
      setIsLoading(false);
    }
  }

  const refreshDetail = useEffectEvent(async () => {
    await refresh();
  });

  useEffect(() => {
    void refreshDetail();
  }, [id]);

  async function handleUpdate(payload: CharacterCreateInput) {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const updated = await requestApi<CharacterListItem>(`/api/characters/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload)
      });
      setCharacter(updated);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "保存角色设定失败。");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateJob(payload: GenerationJobCreateInput) {
    setIsCreatingJob(true);
    setErrorMessage(null);

    try {
      const job = await requestApi<GenerationJobRecord>("/api/jobs", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      router.push(`/jobs/${job.id}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "创建任务失败。");
    } finally {
      setIsCreatingJob(false);
    }
  }

  return (
    <PageFrame
      title="Character Detail"
      description="角色详情页同时承载结构化设定维护和 create job 入口。创建后会直接进入 job detail 查看本轮编译出的 prompt variants。"
    >
      <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
        <Link className="rounded-full border border-[var(--border)] px-3 py-1.5" href="/characters">
          返回角色列表
        </Link>
      </div>

      {errorMessage ? (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {errorMessage}
        </section>
      ) : null}

      {isLoading ? (
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <p className="text-sm text-[var(--muted)]">正在加载角色详情...</p>
        </section>
      ) : null}

      {!isLoading && !character ? (
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <h2 className="text-lg font-semibold">角色不存在</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            当前 id 没有查到对应角色。
          </p>
        </section>
      ) : null}

      {!isLoading && character ? (
        <>
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent)]">
                    {character.code}
                  </p>
                  <StatusChip value={character.status} />
                </div>
                <h2 className="text-2xl font-semibold">{character.name}</h2>
                <p className="text-sm text-[var(--muted)]">
                  所属 Universe: {character.universe.code} / {character.universe.name}
                </p>
                <p className="text-sm leading-6 text-slate-700">
                  {character.description || "暂无角色说明。"}
                </p>
              </div>
              <div className="text-sm text-[var(--muted)]">
                最近更新: {formatDate(character.updatedAt)}
              </div>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <JsonCard title="Fixed Traits" value={character.fixedTraits} />
            <JsonCard title="Semi-fixed Traits" value={character.semiFixedTraits} />
            <JsonCard title="Variable Defaults" value={character.variableDefaults} />
            <JsonCard title="Palette" value={character.palette} />
            <JsonCard title="Negative Rules" value={character.negativeRules} />
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">Create Job</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                当前先接通 explore job 创建、prompt_versions 编译和详情页展示。提交后会直接跳到 job detail。
              </p>
            </div>
            <JobForm
              characters={[character]}
              initialCharacterId={character.id}
              isSubmitting={isCreatingJob}
              onSubmit={handleCreateJob}
            />
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">编辑角色设定</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                保存后，详情区域会立即刷新为数据库中的最新结构化结果。
              </p>
            </div>
            <CharacterForm
              initialValue={character}
              isSubmitting={isSubmitting}
              onSubmit={handleUpdate}
              submitLabel="保存角色设定"
              universes={universes}
            />
          </section>
        </>
      ) : null}
    </PageFrame>
  );
}
