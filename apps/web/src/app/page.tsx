"use client";

import { useEffect, useState } from "react";
import type { ApiResponse, ApplicationHealth } from "@character-factory/core";

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; payload: ApplicationHealth };

const initialState: FetchState = { status: "loading" };

export default function HomePage() {
  const [state, setState] = useState<FetchState>(initialState);

  useEffect(() => {
    let cancelled = false;

    async function loadHealth() {
      try {
        const response = await fetch("/api/health", {
          cache: "no-store"
        });

        const payload = (await response.json()) as ApiResponse<ApplicationHealth>;

        if (cancelled) {
          return;
        }

        if (!response.ok || !payload.success || !payload.data) {
          setState({
            status: "error",
            message: payload.error?.message ?? "Health check failed."
          });
          return;
        }

        setState({
          status: "ready",
          payload: payload.data
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setState({
          status: "error",
          message: error instanceof Error ? error.message : "Health check failed."
        });
      }
    }

    void loadHealth();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12">
      <section className="space-y-3">
        <p className="text-sm uppercase tracking-[0.32em] text-[var(--accent)]">
          Sprint 0 Infrastructure
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">
          Character Factory
        </h1>
        <p className="max-w-2xl text-base leading-7 text-[var(--muted)]">
          首页只消费统一的 <code>/api/health</code> 接口，展示环境、数据库、
          Redis 和对象存储的基础状态。
        </p>
      </section>

      {state.status === "loading" ? (
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <p className="text-sm text-[var(--muted)]">正在读取系统状态...</p>
        </section>
      ) : null}

      {state.status === "error" ? (
        <section className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-red-700">健康检查失败</h2>
          <p className="mt-2 text-sm text-red-600">{state.message}</p>
        </section>
      ) : null}

      {state.status === "ready" ? (
        <section className="grid gap-4 md:grid-cols-2">
          <HealthCard
            label="Environment"
            status={state.payload.env.status}
            description={
              state.payload.env.missing.length === 0
                ? "必需环境变量已配置。"
                : `缺失: ${state.payload.env.missing.join(", ")}`
            }
          />
          <HealthCard
            label="Database"
            status={state.payload.db.status}
            description={state.payload.db.message}
          />
          <HealthCard
            label="Redis"
            status={state.payload.redis.status}
            description={state.payload.redis.message}
          />
          <HealthCard
            label="Storage"
            status={state.payload.storage.status}
            description={
              state.payload.storage.provider
                ? `${state.payload.storage.provider}: ${state.payload.storage.message}`
                : state.payload.storage.message
            }
          />
        </section>
      ) : null}
    </main>
  );
}

function HealthCard({
  label,
  status,
  description
}: {
  label: string;
  status: "ok" | "error" | "not_configured";
  description: string;
}) {
  const palette =
    status === "ok"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "error"
        ? "bg-rose-50 text-rose-700 border-rose-200"
        : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <article className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium">{label}</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            {description}
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${palette}`}>
          {status}
        </span>
      </div>
    </article>
  );
}

