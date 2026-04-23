"use client";

import { useState } from "react";
import type {
  CharacterListItem,
  GenerationJobCreateInput,
  ImageQuality,
  JobMode
} from "@character-factory/core";
import { variantStrategyValues } from "@character-factory/core";

import {
  createInitialJobFormState,
  getCharacterTaskPromptFields,
  type JobFormState
} from "./job-form-state";

export function JobForm({
  characters,
  initialCharacterId,
  isSubmitting,
  onSubmit
}: {
  characters: CharacterListItem[];
  initialCharacterId?: string;
  isSubmitting: boolean;
  onSubmit: (payload: GenerationJobCreateInput) => Promise<void>;
}) {
  const [form, setForm] = useState<JobFormState>(() =>
    createInitialJobFormState(characters, initialCharacterId)
  );

  const selectedCharacter =
    characters.find((character) => character.id === form.characterId) ?? null;
  const sourceImageRequired = form.mode !== "explore";
  const disabled =
    isSubmitting || characters.length === 0 || form.strategies.length === 0;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSubmit({
      characterId: form.characterId,
      mode: form.mode,
      sourceImageId: form.sourceImageId.trim() || null,
      createdBy: form.createdBy,
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
        imagesPerVariant: Number.parseInt(form.imagesPerVariant, 10) || 4,
        size: form.size,
        quality: form.quality
      }
    });
  }

  return (
    <form className="space-y-6" onSubmit={(event) => void handleSubmit(event)}>
      {characters.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Create at least one character before opening a generation job.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SelectField
          label="Character"
          onChange={(value) => {
            const character = characters.find((item) => item.id === value) ?? null;
            const taskPromptFields = getCharacterTaskPromptFields(character);

            setForm((current) => ({
              ...current,
              characterId: value,
              ...taskPromptFields
            }));
          }}
          options={characters.map((character) => ({
            label: `${character.code} / ${character.name}`,
            value: character.id
          }))}
          value={form.characterId}
        />
        <SelectField
          label="Mode"
          onChange={(value) =>
            setForm((current) => ({
              ...current,
              mode: value as JobMode
            }))
          }
          options={[
            { label: "explore", value: "explore" },
            { label: "refine", value: "refine" },
            { label: "edit", value: "edit" }
          ]}
          value={form.mode}
        />
        <TextField
          label="Images Per Variant"
          onChange={(value) =>
            setForm((current) => ({ ...current, imagesPerVariant: value }))
          }
          type="number"
          value={form.imagesPerVariant}
        />
        <TextField
          label="Created By"
          onChange={(value) => setForm((current) => ({ ...current, createdBy: value }))}
          placeholder="optional"
          value={form.createdBy}
        />
      </div>

      {selectedCharacter ? (
        <div className="rounded-2xl bg-[#f6f1e8] px-4 py-4 text-sm text-slate-700">
          <p className="font-medium">
            {selectedCharacter.universe.code} / {selectedCharacter.universe.name}
          </p>
          <p className="mt-2 text-[var(--muted)]">
            Defaults: {selectedCharacter.variableDefaults.action || "-"} /{" "}
            {selectedCharacter.variableDefaults.expression || "-"} /{" "}
            {selectedCharacter.variableDefaults.view || "-"}
          </p>
        </div>
      ) : null}

      <TextField
        label="Source Image ID"
        onChange={(value) => setForm((current) => ({ ...current, sourceImageId: value }))}
        placeholder={
          sourceImageRequired ? "required for refine/edit" : "optional for explore"
        }
        value={form.sourceImageId}
      />

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
          {variantStrategyValues.map((strategy) => {
            const checked = form.strategies.includes(strategy);

            return (
              <label
                className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
                key={strategy}
              >
                <input
                  checked={checked}
                  onChange={(event) => {
                    setForm((current) => {
                      const nextStrategies = event.target.checked
                        ? [...current.strategies, strategy]
                        : current.strategies.filter((item) => item !== strategy);

                      return {
                        ...current,
                        strategies:
                          nextStrategies.length > 0
                            ? nextStrategies
                            : current.strategies
                      };
                    });
                  }}
                  type="checkbox"
                />
                <span>{strategy}</span>
              </label>
            );
          })}
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-[var(--border)] bg-[#fcfaf4] p-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
          Render Settings
        </h3>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SelectField
            label="Size"
            onChange={(value) => setForm((current) => ({ ...current, size: value }))}
            options={[
              { label: "1024x1024", value: "1024x1024" },
              { label: "1024x1536", value: "1024x1536" },
              { label: "1536x1024", value: "1536x1024" }
            ]}
            value={form.size}
          />
          <SelectField
            label="Quality"
            onChange={(value) =>
              setForm((current) => ({ ...current, quality: value as ImageQuality }))
            }
            options={[
              { label: "high", value: "high" },
              { label: "medium", value: "medium" },
              { label: "low", value: "low" }
            ]}
            value={form.quality}
          />
        </div>
      </section>

      <button
        className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled}
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
  onChange,
  type = "text",
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
  placeholder?: string;
}) {
  return (
    <label className="block space-y-2 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
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
