"use client";

import { useEffect, useEffectEvent, useState } from "react";
import Link from "next/link";
import type {
  CharacterCreateInput,
  CharacterListItem,
  UniverseRecord
} from "@character-factory/core";

import { CharacterForm } from "@/components/character-form";
import { PageFrame } from "@/components/page-frame";
import { StatusChip } from "@/components/status-chip";
import { requestApi } from "@/lib/api-client";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function CharactersClient() {
  const [universes, setUniverses] = useState<UniverseRecord[]>([]);
  const [characters, setCharacters] = useState<CharacterListItem[]>([]);
  const [editingCharacter, setEditingCharacter] = useState<CharacterListItem | null>(
    null
  );
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function refreshUniverses() {
    const data = await requestApi<UniverseRecord[]>("/api/universes");
    setUniverses(data);
  }

  async function refreshCharacters() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const search = new URLSearchParams();

      if (query.trim()) {
        search.set("q", query.trim());
      }

      if (statusFilter) {
        search.set("status", statusFilter);
      }

      const data = await requestApi<CharacterListItem[]>(
        `/api/characters${search.size > 0 ? `?${search.toString()}` : ""}`
      );
      setCharacters(data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "加载失败。");
    } finally {
      setIsLoading(false);
    }
  }

  const bootstrap = useEffectEvent(async () => {
    try {
      await Promise.all([refreshUniverses(), refreshCharacters()]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "初始化失败。");
      setIsLoading(false);
    }
  });

  useEffect(() => {
    void bootstrap();
  }, []);

  async function handleCreateOrUpdate(payload: CharacterCreateInput) {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (editingCharacter) {
        await requestApi<CharacterListItem>(`/api/characters/${editingCharacter.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });
      } else {
        await requestApi<CharacterListItem>("/api/characters", {
          method: "POST",
          body: JSON.stringify(payload)
        });
      }

      setEditingCharacter(null);
      await refreshCharacters();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "提交失败。");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("确认删除这个 Character 吗？")) {
      return;
    }

    try {
      await requestApi<{ id: string }>(`/api/characters/${id}`, {
        method: "DELETE"
      });

      if (editingCharacter?.id === id) {
        setEditingCharacter(null);
      }

      await refreshCharacters();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "删除失败。");
    }
  }

  return (
    <PageFrame
      title="Character 管理"
      description="角色页面只承载列表、详情入口和基础设定维护；所有结构化字段都会通过统一 schema 归一化后再持久化。"
    >
      {errorMessage ? (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {errorMessage}
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <article className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold">
              {editingCharacter ? "编辑 Character" : "新建 Character"}
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              结构化字段采用输入框和多行文本混合录入。
            </p>
          </div>
          <CharacterForm
            initialValue={editingCharacter}
            isSubmitting={isSubmitting}
            onCancel={
              editingCharacter ? () => setEditingCharacter(null) : undefined
            }
            onSubmit={handleCreateOrUpdate}
            submitLabel={editingCharacter ? "保存修改" : "创建 Character"}
            universes={universes}
          />
        </article>

        <article className="space-y-4">
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
              <input
                className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="按角色名称搜索"
                value={query}
              />
              <select
                className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
                onChange={(event) => setStatusFilter(event.target.value)}
                value={statusFilter}
              >
                <option value="">全部状态</option>
                <option value="draft">draft</option>
                <option value="active">active</option>
                <option value="locked">locked</option>
              </select>
              <button
                className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white"
                onClick={() => void refreshCharacters()}
                type="button"
              >
                刷新列表
              </button>
            </div>
          </section>

          {isLoading ? (
            <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
              <p className="text-sm text-[var(--muted)]">正在加载 Character 列表...</p>
            </section>
          ) : null}

          {!isLoading && characters.length === 0 ? (
            <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
              <h2 className="text-lg font-semibold">暂无 Character</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                创建角色后，详情页会展示完整的结构化设定字段。
              </p>
            </section>
          ) : null}

          {!isLoading
            ? characters.map((character) => (
                <section
                  className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm"
                  key={character.id}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent)]">
                          {character.code}
                        </p>
                        <StatusChip value={character.status} />
                      </div>
                      <h2 className="text-xl font-semibold">{character.name}</h2>
                      <p className="text-sm text-[var(--muted)]">
                        {character.universe.code} / {character.universe.name}
                      </p>
                      <p className="text-sm text-[var(--muted)]">
                        最近更新：{formatDate(character.updatedAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        className="rounded-full border border-[var(--border)] px-4 py-2 text-sm"
                        href={`/characters/${character.id}`}
                      >
                        详情
                      </Link>
                      <button
                        className="rounded-full border border-[var(--border)] px-4 py-2 text-sm"
                        onClick={() => setEditingCharacter(character)}
                        type="button"
                      >
                        编辑
                      </button>
                      <button
                        className="rounded-full border border-rose-200 px-4 py-2 text-sm text-rose-700"
                        onClick={() => void handleDelete(character.id)}
                        type="button"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-700">
                    {character.description || "暂无角色说明。"}
                  </p>
                </section>
              ))
            : null}
        </article>
      </section>
    </PageFrame>
  );
}
