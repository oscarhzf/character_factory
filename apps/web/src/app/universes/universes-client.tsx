"use client";

import { useEffect, useState } from "react";
import type { UniverseCreateInput, UniverseRecord } from "@character-factory/core";

import { PageFrame } from "@/components/page-frame";
import { UniverseForm } from "@/components/universe-form";
import { requestApi } from "@/lib/api-client";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function UniversesClient() {
  const [universes, setUniverses] = useState<UniverseRecord[]>([]);
  const [editingUniverse, setEditingUniverse] = useState<UniverseRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function refreshUniverses() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await requestApi<UniverseRecord[]>("/api/universes");
      setUniverses(data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "加载失败。");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refreshUniverses();
  }, []);

  async function handleCreateOrUpdate(payload: UniverseCreateInput) {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (editingUniverse) {
        await requestApi<UniverseRecord>(`/api/universes/${editingUniverse.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });
      } else {
        await requestApi<UniverseRecord>("/api/universes", {
          method: "POST",
          body: JSON.stringify(payload)
        });
      }

      setEditingUniverse(null);
      await refreshUniverses();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "提交失败。");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("确认删除这个 Universe 吗？")) {
      return;
    }

    try {
      await requestApi<{ id: string }>(`/api/universes/${id}`, {
        method: "DELETE"
      });

      if (editingUniverse?.id === id) {
        setEditingUniverse(null);
      }

      await refreshUniverses();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "删除失败。");
    }
  }

  return (
    <PageFrame
      title="Universe 管理"
      description="维护世界观宪法、全局 Prompt 模板和统一负向约束。删除时会同时受 service 层和数据库层保护。"
    >
      {errorMessage ? (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {errorMessage}
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <article className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold">
              {editingUniverse ? "编辑 Universe" : "新建 Universe"}
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              样式规则使用“每行一条”的方式录入。
            </p>
          </div>
          <UniverseForm
            initialValue={editingUniverse}
            isSubmitting={isSubmitting}
            onCancel={
              editingUniverse ? () => setEditingUniverse(null) : undefined
            }
            onSubmit={handleCreateOrUpdate}
            submitLabel={editingUniverse ? "保存修改" : "创建 Universe"}
          />
        </article>

        <article className="space-y-4">
          {isLoading ? (
            <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
              <p className="text-sm text-[var(--muted)]">正在加载 Universe 列表...</p>
            </section>
          ) : null}

          {!isLoading && universes.length === 0 ? (
            <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
              <h2 className="text-lg font-semibold">暂无 Universe</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                先创建一个世界观，再去绑定角色。
              </p>
            </section>
          ) : null}

          {!isLoading
            ? universes.map((universe) => (
                <section
                  className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm"
                  key={universe.id}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent)]">
                        {universe.code}
                      </p>
                      <h2 className="mt-2 text-xl font-semibold">{universe.name}</h2>
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        最近更新：{formatDate(universe.updatedAt)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="rounded-full border border-[var(--border)] px-4 py-2 text-sm"
                        onClick={() => setEditingUniverse(universe)}
                        type="button"
                      >
                        编辑
                      </button>
                      <button
                        className="rounded-full border border-rose-200 px-4 py-2 text-sm text-rose-700"
                        onClick={() => void handleDelete(universe.id)}
                        type="button"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 text-sm text-slate-700">
                    <FieldPreview
                      label="Style Keywords"
                      value={universe.styleConstitution.styleKeywords}
                    />
                    <FieldPreview
                      label="Sheet Rules"
                      value={universe.styleConstitution.sheetRules}
                    />
                  </div>
                </section>
              ))
            : null}
        </article>
      </section>
    </PageFrame>
  );
}

function FieldPreview({ label, value }: { label: string; value: string[] }) {
  return (
    <div className="rounded-2xl bg-[#f6f1e8] px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-2 leading-6">{value.length > 0 ? value.join(" / ") : "-"}</p>
    </div>
  );
}

