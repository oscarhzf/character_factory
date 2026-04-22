"use client";

import { useEffect, useState } from "react";
import type { CharacterListItem, JobCreateInput, VariantStrategy } from "@character-factory/core";
import { variantStrategyValues } from "@character-factory/core";

interface JobFormState {
  mode: "explore";
  action: string;
  expression: string;
  prop: string;
  view: string;
  pose: string;
  composition: string;
  imagesPerVariant: string;
  size: string;
  quality: string;
  strategies: VariantStrategy[];
}

function createInitialState(character: CharacterListItem): JobFormState {
  return {
    mode: "explore",
    action: character.variableDefaults.action,
    expression: character.variableDefaults.expression,
    prop: character.variableDefaults.prop,
    view: character.variableDefaults.view,
    pose: character.variableDefaults.pose,
    composition: character.variableDefaults.composition,
    imagesPerVariant: "4",
    size: "1024x1536",
    quality: "high",
    strategies: [...variantStrategyValues]
  };
}

function toggleStrategy(
  strategies: VariantStrategy[],
  strategy: VariantStrategy
): VariantStrategy[] {
  if (strategies.includes(strategy)) {
    const nextStrategies = strategies.filter((item) => item !== strategy);
    return nextStrategies.length > 0 ? nextStrategies : strategies;
  }

  return [...strategies, strategy];
}

export function JobForm({
  character,
  isSubmitting,
  onSubmit
}: {
  character: CharacterListItem;
  isSubmitting: boolean;
  onSubmit: (payload: JobCreateInput) => Promise<void>;
}) {
  const [form, setForm] = useState<JobFormState>(() => createInitialState(character));

  useEffect(() => {
    setForm(createInitialState(character));
  }, [character]);

  return (
    <form
      className="space-y-6"
      onSubmit={async (event) => {
        event.preventDefault();

        await onSubmit({
          characterId: character.id,
          mode: form.mode,
          inputConfig: {
            taskPrompt: {
              action: form.action,
              expression: form.expression,
              prop: form.prop,
              view: form.view,
              pose: form.pose,
              composition: form.composition
            },
            variantStrategies: form.strategies,
            imagesPerVariant: Number(form.imagesPerVariant) || 1,
            size: form.size,
            quality: form.quality
          }
        });
      }}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SelectField
          label="Mode"
          onChange={(value) =>
            setForm((current) => ({ ...current, mode: value as JobFormState["mode"] }))
          }
          options={[{ label: "explore", value: "explore" }]}
          value={form.mode}
        />
        <TextField
          label="Images Per Variant"
          onChange={(value) =>
            setForm((current) => ({ ...current, imagesPerVariant: value }))
          }
          value={form.imagesPerVariant}
        />
        <TextField
          label="Size"
          onChange={(value) => setForm((current) => ({ ...current, size: value }))}
          value={form.size}
        />
        <TextField
          label="Quality"
          onChange={(value) => setForm((current) => ({ ...current, quality: value }))}
          value={form.quality}
        />
      </div>

      <section className="space-y-4 rounded-3xl border border-[var(--border)] bg-[#fcfaf4] p-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
          Task Prompt
        </h3>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <TextField
            label="Action"
            onChange={(value) => setForm((current) => ({ ...current, action: value }))}
            value={form.action}
          />
          <TextField
            label="Expression"
            onChange={(value) =>
              setForm((current) => ({ ...current, expression: value }))
            }
            value={form.expression}
          />
          <TextField
            label="Prop"
            onChange={(value) => setForm((current) => ({ ...current, prop: value }))}
            value={form.prop}
          />
          <TextField
            label="View"
            onChange={(value) => setForm((current) => ({ ...current, view: value }))}
            value={form.view}
          />
          <TextField
            label="Pose"
            onChange={(value) => setForm((current) => ({ ...current, pose: value }))}
            value={form.pose}
          />
          <TextField
            label="Composition"
            onChange={(value) =>
              setForm((current) => ({ ...current, composition: value }))
            }
            value={form.composition}
          />
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-[var(--border)] bg-[#fcfaf4] p-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
          Prompt Variants
        </h3>
        <div className="grid gap-3 md:grid-cols-3">
          {variantStrategyValues.map((strategy) => (
            <label
              className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
              key={strategy}
            >
              <input
                checked={form.strategies.includes(strategy)}
                onChange={() =>
                  setForm((current) => ({
                    ...current,
                    strategies: toggleStrategy(current.strategies, strategy)
                  }))
                }
                type="checkbox"
              />
              <span>{strategy}</span>
            </label>
          ))}
        </div>
      </section>

      <button
        className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting || form.strategies.length === 0}
        type="submit"
      >
        {isSubmitting ? "Creating..." : "Create Job"}
      </button>
    </form>
  );
}

function TextField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-2 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <label className="block space-y-2 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <select
        className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
