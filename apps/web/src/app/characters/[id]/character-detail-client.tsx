"use client";

import { useEffect, useEffectEvent, useState } from "react";
import Link from "next/link";
import type {
  CharacterCreateInput,
  CharacterListItem,
  UniverseRecord
} from "@character-factory/core";

import { CharacterForm } from "@/components/character-form";
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
  const [universes, setUniverses] = useState<UniverseRecord[]>([]);
  const [character, setCharacter] = useState<CharacterListItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      setErrorMessage(error instanceof Error ? error.message : "加载失败。");
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
      setErrorMessage(error instanceof Error ? error.message : "保存失败。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageFrame
      title="Character 详情"
      description="详情页直接展示结构化设定字段，并提供原地编辑入口。这里不提前接入任务、评审或 Prompt 相关逻辑。"
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
                  所属 Universe：{character.universe.code} / {character.universe.name}
                </p>
                <p className="text-sm leading-6 text-slate-700">
                  {character.description || "暂无角色说明。"}
                </p>
              </div>
              <div className="text-sm text-[var(--muted)]">
                更新于 {formatDate(character.updatedAt)}
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
              <h2 className="text-xl font-semibold">编辑角色设定</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                保存后，详情区会立即刷新为数据库中的结构化结果。
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
