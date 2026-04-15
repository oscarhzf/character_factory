"use client";

import { useEffect, useState } from "react";
import type { UniverseCreateInput, UniverseRecord } from "@character-factory/core";

function arrayToText(value: string[]) {
  return value.join("\n");
}

function textToArray(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

interface UniverseFormState {
  code: string;
  name: string;
  globalPromptTemplate: string;
  globalNegativeTemplate: string;
  proportionRules: string;
  styleKeywords: string;
  renderingRules: string;
  backgroundRules: string;
  sheetRules: string;
}

function createInitialState(universe?: UniverseRecord | null): UniverseFormState {
  return {
    code: universe?.code ?? "",
    name: universe?.name ?? "",
    globalPromptTemplate: universe?.globalPromptTemplate ?? "",
    globalNegativeTemplate: universe?.globalNegativeTemplate ?? "",
    proportionRules: arrayToText(universe?.styleConstitution.proportionRules ?? []),
    styleKeywords: arrayToText(universe?.styleConstitution.styleKeywords ?? []),
    renderingRules: arrayToText(universe?.styleConstitution.renderingRules ?? []),
    backgroundRules: arrayToText(universe?.styleConstitution.backgroundRules ?? []),
    sheetRules: arrayToText(universe?.styleConstitution.sheetRules ?? [])
  };
}

export function UniverseForm({
  initialValue,
  submitLabel,
  isSubmitting,
  onSubmit,
  onCancel
}: {
  initialValue?: UniverseRecord | null;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (payload: UniverseCreateInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<UniverseFormState>(() =>
    createInitialState(initialValue)
  );

  useEffect(() => {
    setForm(createInitialState(initialValue));
  }, [initialValue]);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();

        await onSubmit({
          code: form.code,
          name: form.name,
          globalPromptTemplate: form.globalPromptTemplate,
          globalNegativeTemplate: form.globalNegativeTemplate,
          styleConstitution: {
            proportionRules: textToArray(form.proportionRules),
            styleKeywords: textToArray(form.styleKeywords),
            renderingRules: textToArray(form.renderingRules),
            backgroundRules: textToArray(form.backgroundRules),
            sheetRules: textToArray(form.sheetRules)
          }
        });
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Code"
          value={form.code}
          onChange={(value) => setForm((current) => ({ ...current, code: value }))}
        />
        <TextField
          label="Name"
          value={form.name}
          onChange={(value) => setForm((current) => ({ ...current, name: value }))}
        />
      </div>

      <TextareaField
        label="Global Prompt Template"
        rows={5}
        value={form.globalPromptTemplate}
        onChange={(value) =>
          setForm((current) => ({ ...current, globalPromptTemplate: value }))
        }
      />
      <TextareaField
        label="Global Negative Template"
        rows={4}
        value={form.globalNegativeTemplate}
        onChange={(value) =>
          setForm((current) => ({ ...current, globalNegativeTemplate: value }))
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <TextareaField
          label="Proportion Rules"
          helper="每行一条"
          value={form.proportionRules}
          onChange={(value) =>
            setForm((current) => ({ ...current, proportionRules: value }))
          }
        />
        <TextareaField
          label="Style Keywords"
          helper="每行一条"
          value={form.styleKeywords}
          onChange={(value) =>
            setForm((current) => ({ ...current, styleKeywords: value }))
          }
        />
        <TextareaField
          label="Rendering Rules"
          helper="每行一条"
          value={form.renderingRules}
          onChange={(value) =>
            setForm((current) => ({ ...current, renderingRules: value }))
          }
        />
        <TextareaField
          label="Background Rules"
          helper="每行一条"
          value={form.backgroundRules}
          onChange={(value) =>
            setForm((current) => ({ ...current, backgroundRules: value }))
          }
        />
      </div>

      <TextareaField
        label="Sheet Rules"
        helper="每行一条"
        value={form.sheetRules}
        onChange={(value) =>
          setForm((current) => ({ ...current, sheetRules: value }))
        }
      />

      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "提交中..." : submitLabel}
        </button>
        {onCancel ? (
          <button
            className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm"
            disabled={isSubmitting}
            onClick={onCancel}
            type="button"
          >
            取消编辑
          </button>
        ) : null}
      </div>
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

function TextareaField({
  label,
  value,
  onChange,
  rows = 4,
  helper
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  helper?: string;
}) {
  return (
    <label className="block space-y-2 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <textarea
        className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        value={value}
      />
      {helper ? <span className="text-xs text-[var(--muted)]">{helper}</span> : null}
    </label>
  );
}
