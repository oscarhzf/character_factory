"use client";

import { useEffect, useState } from "react";
import type {
  CharacterCreateInput,
  CharacterListItem,
  UniverseRecord
} from "@character-factory/core";

function arrayToText(value: string[]) {
  return value.join("\n");
}

function textToArray(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

interface CharacterFormState {
  universeId: string;
  code: string;
  name: string;
  status: "draft" | "active" | "locked";
  description: string;
  rolePersona: string;
  identityKeywords: string;
  visualSilhouette: string;
  hairstyle: string;
  outfitRules: string;
  iconicProps: string;
  optionalProps: string;
  expressionRange: string;
  poseRange: string;
  outfitVariants: string;
  compositionHints: string;
  action: string;
  expression: string;
  prop: string;
  view: string;
  pose: string;
  composition: string;
  primary: string;
  secondary: string;
  accent: string;
  forbidden: string;
  anatomy: string;
  style: string;
  props: string;
  negativeComposition: string;
}

function createInitialState(
  universes: UniverseRecord[],
  character?: CharacterListItem | null
): CharacterFormState {
  return {
    universeId: character?.universeId ?? universes[0]?.id ?? "",
    code: character?.code ?? "",
    name: character?.name ?? "",
    status: character?.status ?? "draft",
    description: character?.description ?? "",
    rolePersona: character?.fixedTraits.rolePersona ?? "",
    identityKeywords: arrayToText(character?.fixedTraits.identityKeywords ?? []),
    visualSilhouette: character?.fixedTraits.visualSilhouette ?? "",
    hairstyle: character?.fixedTraits.hairstyle ?? "",
    outfitRules: arrayToText(character?.fixedTraits.outfitRules ?? []),
    iconicProps: arrayToText(character?.fixedTraits.iconicProps ?? []),
    optionalProps: arrayToText(character?.semiFixedTraits.optionalProps ?? []),
    expressionRange: arrayToText(character?.semiFixedTraits.expressionRange ?? []),
    poseRange: arrayToText(character?.semiFixedTraits.poseRange ?? []),
    outfitVariants: arrayToText(character?.semiFixedTraits.outfitVariants ?? []),
    compositionHints: arrayToText(
      character?.semiFixedTraits.compositionHints ?? []
    ),
    action: character?.variableDefaults.action ?? "",
    expression: character?.variableDefaults.expression ?? "",
    prop: character?.variableDefaults.prop ?? "",
    view: character?.variableDefaults.view ?? "",
    pose: character?.variableDefaults.pose ?? "",
    composition: character?.variableDefaults.composition ?? "",
    primary: arrayToText(character?.palette.primary ?? []),
    secondary: arrayToText(character?.palette.secondary ?? []),
    accent: arrayToText(character?.palette.accent ?? []),
    forbidden: arrayToText(character?.palette.forbidden ?? []),
    anatomy: arrayToText(character?.negativeRules.anatomy ?? []),
    style: arrayToText(character?.negativeRules.style ?? []),
    props: arrayToText(character?.negativeRules.props ?? []),
    negativeComposition: arrayToText(character?.negativeRules.composition ?? [])
  };
}

export function CharacterForm({
  universes,
  initialValue,
  submitLabel,
  isSubmitting,
  onSubmit,
  onCancel
}: {
  universes: UniverseRecord[];
  initialValue?: CharacterListItem | null;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (payload: CharacterCreateInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<CharacterFormState>(() =>
    createInitialState(universes, initialValue)
  );

  useEffect(() => {
    setForm(createInitialState(universes, initialValue));
  }, [initialValue, universes]);

  const disabled = isSubmitting || universes.length === 0;

  return (
    <form
      className="space-y-6"
      onSubmit={async (event) => {
        event.preventDefault();

        await onSubmit({
          universeId: form.universeId,
          code: form.code,
          name: form.name,
          status: form.status,
          description: form.description,
          fixedTraits: {
            rolePersona: form.rolePersona,
            identityKeywords: textToArray(form.identityKeywords),
            visualSilhouette: form.visualSilhouette,
            hairstyle: form.hairstyle,
            outfitRules: textToArray(form.outfitRules),
            iconicProps: textToArray(form.iconicProps)
          },
          semiFixedTraits: {
            optionalProps: textToArray(form.optionalProps),
            expressionRange: textToArray(form.expressionRange),
            poseRange: textToArray(form.poseRange),
            outfitVariants: textToArray(form.outfitVariants),
            compositionHints: textToArray(form.compositionHints)
          },
          variableDefaults: {
            action: form.action,
            expression: form.expression,
            prop: form.prop,
            view: form.view,
            pose: form.pose,
            composition: form.composition
          },
          palette: {
            primary: textToArray(form.primary),
            secondary: textToArray(form.secondary),
            accent: textToArray(form.accent),
            forbidden: textToArray(form.forbidden)
          },
          negativeRules: {
            anatomy: textToArray(form.anatomy),
            style: textToArray(form.style),
            props: textToArray(form.props),
            composition: textToArray(form.negativeComposition)
          }
        });
      }}
    >
      {universes.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          需要先创建至少一个 Universe，角色才能绑定世界观。
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SelectField
          label="Universe"
          onChange={(value) =>
            setForm((current) => ({ ...current, universeId: value }))
          }
          options={universes.map((universe) => ({
            label: `${universe.code} / ${universe.name}`,
            value: universe.id
          }))}
          value={form.universeId}
        />
        <TextField
          label="Code"
          onChange={(value) => setForm((current) => ({ ...current, code: value }))}
          value={form.code}
        />
        <TextField
          label="Name"
          onChange={(value) => setForm((current) => ({ ...current, name: value }))}
          value={form.name}
        />
        <SelectField
          label="Status"
          onChange={(value) =>
            setForm((current) => ({
              ...current,
              status: value as CharacterFormState["status"]
            }))
          }
          options={[
            { label: "draft", value: "draft" },
            { label: "active", value: "active" },
            { label: "locked", value: "locked" }
          ]}
          value={form.status}
        />
      </div>

      <TextareaField
        label="Description"
        rows={3}
        value={form.description}
        onChange={(value) =>
          setForm((current) => ({ ...current, description: value }))
        }
      />

      <FormSection title="Fixed Traits">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Role Persona"
            onChange={(value) =>
              setForm((current) => ({ ...current, rolePersona: value }))
            }
            value={form.rolePersona}
          />
          <TextField
            label="Hairstyle"
            onChange={(value) =>
              setForm((current) => ({ ...current, hairstyle: value }))
            }
            value={form.hairstyle}
          />
          <TextareaField
            label="Identity Keywords"
            helper="每行一条"
            value={form.identityKeywords}
            onChange={(value) =>
              setForm((current) => ({ ...current, identityKeywords: value }))
            }
          />
          <TextareaField
            label="Outfit Rules"
            helper="每行一条"
            value={form.outfitRules}
            onChange={(value) =>
              setForm((current) => ({ ...current, outfitRules: value }))
            }
          />
          <TextField
            label="Visual Silhouette"
            onChange={(value) =>
              setForm((current) => ({ ...current, visualSilhouette: value }))
            }
            value={form.visualSilhouette}
          />
          <TextareaField
            label="Iconic Props"
            helper="每行一条"
            value={form.iconicProps}
            onChange={(value) =>
              setForm((current) => ({ ...current, iconicProps: value }))
            }
          />
        </div>
      </FormSection>

      <FormSection title="Semi-fixed Traits">
        <div className="grid gap-4 md:grid-cols-2">
          <TextareaField
            label="Optional Props"
            helper="每行一条"
            value={form.optionalProps}
            onChange={(value) =>
              setForm((current) => ({ ...current, optionalProps: value }))
            }
          />
          <TextareaField
            label="Expression Range"
            helper="每行一条"
            value={form.expressionRange}
            onChange={(value) =>
              setForm((current) => ({ ...current, expressionRange: value }))
            }
          />
          <TextareaField
            label="Pose Range"
            helper="每行一条"
            value={form.poseRange}
            onChange={(value) =>
              setForm((current) => ({ ...current, poseRange: value }))
            }
          />
          <TextareaField
            label="Outfit Variants"
            helper="每行一条"
            value={form.outfitVariants}
            onChange={(value) =>
              setForm((current) => ({ ...current, outfitVariants: value }))
            }
          />
        </div>
        <TextareaField
          label="Composition Hints"
          helper="每行一条"
          value={form.compositionHints}
          onChange={(value) =>
            setForm((current) => ({ ...current, compositionHints: value }))
          }
        />
      </FormSection>

      <FormSection title="Variable Defaults">
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
      </FormSection>

      <FormSection title="Palette & Negative Rules">
        <div className="grid gap-4 md:grid-cols-2">
          <TextareaField
            label="Primary Palette"
            helper="每行一条"
            value={form.primary}
            onChange={(value) =>
              setForm((current) => ({ ...current, primary: value }))
            }
          />
          <TextareaField
            label="Secondary Palette"
            helper="每行一条"
            value={form.secondary}
            onChange={(value) =>
              setForm((current) => ({ ...current, secondary: value }))
            }
          />
          <TextareaField
            label="Accent Palette"
            helper="每行一条"
            value={form.accent}
            onChange={(value) =>
              setForm((current) => ({ ...current, accent: value }))
            }
          />
          <TextareaField
            label="Forbidden Palette"
            helper="每行一条"
            value={form.forbidden}
            onChange={(value) =>
              setForm((current) => ({ ...current, forbidden: value }))
            }
          />
          <TextareaField
            label="Negative Anatomy"
            helper="每行一条"
            value={form.anatomy}
            onChange={(value) =>
              setForm((current) => ({ ...current, anatomy: value }))
            }
          />
          <TextareaField
            label="Negative Style"
            helper="每行一条"
            value={form.style}
            onChange={(value) =>
              setForm((current) => ({ ...current, style: value }))
            }
          />
          <TextareaField
            label="Negative Props"
            helper="每行一条"
            value={form.props}
            onChange={(value) =>
              setForm((current) => ({ ...current, props: value }))
            }
          />
          <TextareaField
            label="Negative Composition"
            helper="每行一条"
            value={form.negativeComposition}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                negativeComposition: value
              }))
            }
          />
        </div>
      </FormSection>

      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled}
          type="submit"
        >
          {isSubmitting ? "提交中..." : submitLabel}
        </button>
        {onCancel ? (
          <button
            className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm"
            disabled={disabled}
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

function FormSection({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-3xl border border-[var(--border)] bg-[#fcfaf4] p-5">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
        {title}
      </h3>
      {children}
    </section>
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
