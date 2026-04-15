"use client";

import { useEffect, useState } from "react";
import type {
  CharacterListItem,
  PromptCompileResult,
  PromptVersionRecord,
  VariantStrategy
} from "@character-factory/core";
import { variantStrategyValues } from "@character-factory/core";

import { JsonCard } from "@/components/json-card";
import { PageFrame } from "@/components/page-frame";
import { requestApi } from "@/lib/api-client";

interface PromptDebugFormState {
  characterId: string;
  action: string;
  expression: string;
  prop: string;
  view: string;
  pose: string;
  composition: string;
  preserve: string;
  strengthen: string;
  suppress: string;
  append: string;
  remove: string;
  strategies: VariantStrategy[];
}

function linesToArray(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function createInitialForm(
  characters: CharacterListItem[],
  selectedCharacterId?: string
): PromptDebugFormState {
  const character =
    characters.find((item) => item.id === selectedCharacterId) ?? characters[0];

  return {
    characterId: character?.id ?? "",
    action: "",
    expression: "",
    prop: "",
    view: "",
    pose: "",
    composition: "",
    preserve: "",
    strengthen: "",
    suppress: "",
    append: "",
    remove: "",
    strategies: [...variantStrategyValues]
  };
}

export function PromptDebugClient() {
  const [characters, setCharacters] = useState<CharacterListItem[]>([]);
  const [form, setForm] = useState<PromptDebugFormState>(() =>
    createInitialForm([])
  );
  const [history, setHistory] = useState<PromptVersionRecord[]>([]);
  const [compileResult, setCompileResult] = useState<PromptCompileResult | null>(
    null
  );
  const [selectedVersion, setSelectedVersion] = useState<PromptVersionRecord | null>(
    null
  );
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isLoadingVersion, setIsLoadingVersion] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedCharacter =
    characters.find((character) => character.id === form.characterId) ?? null;

  async function refreshHistory(characterId: string) {
    if (!characterId) {
      setHistory([]);
      return;
    }

    const data = await requestApi<PromptVersionRecord[]>(
      `/api/prompt-versions?characterId=${encodeURIComponent(characterId)}&limit=9`
    );
    setHistory(data);
  }

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setIsBootstrapping(true);
      setErrorMessage(null);

      try {
        const characterData = await requestApi<CharacterListItem[]>("/api/characters");

        if (cancelled) {
          return;
        }

        setCharacters(characterData);

        const nextForm = createInitialForm(characterData);
        setForm(nextForm);

        if (nextForm.characterId) {
          const historyData = await requestApi<PromptVersionRecord[]>(
            `/api/prompt-versions?characterId=${encodeURIComponent(nextForm.characterId)}&limit=9`
          );

          if (cancelled) {
            return;
          }

          setHistory(historyData);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : "Failed to load prompt debugger.");
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCharacterChange(characterId: string) {
    setForm((current) => ({
      ...current,
      characterId
    }));
    setCompileResult(null);
    setSelectedVersion(null);
    setErrorMessage(null);

    try {
      await refreshHistory(characterId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load prompt history.");
    }
  }

  async function handleCompile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.characterId) {
      setErrorMessage("Please choose a character first.");
      return;
    }

    setIsCompiling(true);
    setErrorMessage(null);

    try {
      const result = await requestApi<PromptCompileResult>("/api/prompt-versions/compile", {
        method: "POST",
        body: JSON.stringify({
          characterId: form.characterId,
          scope: "debug",
          taskPrompt: {
            action: form.action,
            expression: form.expression,
            prop: form.prop,
            view: form.view,
            pose: form.pose,
            composition: form.composition
          },
          variantStrategies: form.strategies,
          basePatch: {
            preserve: linesToArray(form.preserve),
            strengthen: linesToArray(form.strengthen),
            suppress: linesToArray(form.suppress),
            append: linesToArray(form.append),
            remove: linesToArray(form.remove)
          }
        })
      });

      setCompileResult(result);
      setSelectedVersion(result.variants[0] ?? null);
      await refreshHistory(form.characterId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Prompt compilation failed.");
    } finally {
      setIsCompiling(false);
    }
  }

  async function handleSelectVersion(versionId: string) {
    setIsLoadingVersion(true);
    setErrorMessage(null);

    try {
      const version = await requestApi<PromptVersionRecord>(
        `/api/prompt-versions/${versionId}`
      );
      setSelectedVersion(version);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load prompt version.");
    } finally {
      setIsLoadingVersion(false);
    }
  }

  return (
    <PageFrame
      title="Prompt Debug"
      description="Sprint 2 的调试页只做结构化 Prompt 编译与持久化验证。页面输入任务字段、Patch 和变体策略，服务端会生成并落库 3 个 prompt variants。"
    >
      {errorMessage ? (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {errorMessage}
        </section>
      ) : null}

      {isBootstrapping ? (
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <p className="text-sm text-[var(--muted)]">Loading prompt debugger...</p>
        </section>
      ) : null}

      {!isBootstrapping && characters.length === 0 ? (
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <h2 className="text-lg font-semibold">No characters yet</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Create a Universe and Character first, then come back here to compile prompt variants.
          </p>
        </section>
      ) : null}

      {!isBootstrapping && characters.length > 0 ? (
        <>
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
            <form
              className="space-y-6 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm"
              onSubmit={(event) => void handleCompile(event)}
            >
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Compile Prompt Variants</h2>
                <p className="text-sm leading-6 text-[var(--muted)]">
                  Task fields override character defaults only when filled. Patch fields use one line per rule.
                </p>
              </div>

              <label className="block space-y-2 text-sm">
                <span className="font-medium text-slate-700">Character</span>
                <select
                  className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                  onChange={(event) => void handleCharacterChange(event.target.value)}
                  value={form.characterId}
                >
                  {characters.map((character) => (
                    <option key={character.id} value={character.id}>
                      {character.code} / {character.name}
                    </option>
                  ))}
                </select>
              </label>

              {selectedCharacter ? (
                <div className="rounded-2xl bg-[#f6f1e8] px-4 py-4 text-sm text-slate-700">
                  <p className="font-medium">
                    {selectedCharacter.universe.code} / {selectedCharacter.universe.name}
                  </p>
                  <p className="mt-2 text-[var(--muted)]">
                    Default task prompt: {selectedCharacter.variableDefaults.action || "-"} /{" "}
                    {selectedCharacter.variableDefaults.expression || "-"} /{" "}
                    {selectedCharacter.variableDefaults.view || "-"}
                  </p>
                </div>
              ) : null}

              <PromptFieldGrid
                fields={[
                  {
                    label: "Action",
                    value: form.action,
                    onChange: (value) => setForm((current) => ({ ...current, action: value }))
                  },
                  {
                    label: "Expression",
                    value: form.expression,
                    onChange: (value) =>
                      setForm((current) => ({ ...current, expression: value }))
                  },
                  {
                    label: "Prop",
                    value: form.prop,
                    onChange: (value) => setForm((current) => ({ ...current, prop: value }))
                  },
                  {
                    label: "View",
                    value: form.view,
                    onChange: (value) => setForm((current) => ({ ...current, view: value }))
                  },
                  {
                    label: "Pose",
                    value: form.pose,
                    onChange: (value) => setForm((current) => ({ ...current, pose: value }))
                  },
                  {
                    label: "Composition",
                    value: form.composition,
                    onChange: (value) =>
                      setForm((current) => ({ ...current, composition: value }))
                  }
                ]}
              />

              <section className="space-y-4 rounded-3xl border border-[var(--border)] bg-[#fcfaf4] p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Variant Strategies
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
                            setForm((current) => ({
                              ...current,
                              strategies: event.target.checked
                                ? [...current.strategies, strategy]
                                : current.strategies.filter((item) => item !== strategy)
                            }));
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
                  Prompt Patch
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <LinesField
                    label="Preserve"
                    value={form.preserve}
                    onChange={(value) => setForm((current) => ({ ...current, preserve: value }))}
                  />
                  <LinesField
                    label="Strengthen"
                    value={form.strengthen}
                    onChange={(value) =>
                      setForm((current) => ({ ...current, strengthen: value }))
                    }
                  />
                  <LinesField
                    label="Suppress"
                    value={form.suppress}
                    onChange={(value) => setForm((current) => ({ ...current, suppress: value }))}
                  />
                  <LinesField
                    label="Append"
                    value={form.append}
                    onChange={(value) => setForm((current) => ({ ...current, append: value }))}
                  />
                </div>
                <LinesField
                  label="Remove"
                  value={form.remove}
                  onChange={(value) => setForm((current) => ({ ...current, remove: value }))}
                />
              </section>

              <button
                className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isCompiling || form.strategies.length === 0}
                type="submit"
              >
                {isCompiling ? "Compiling..." : "Compile 3 Variants"}
              </button>
            </form>

            <section className="space-y-4">
              <article className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">Recent Prompt Versions</h2>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Stored `prompt_versions` for the selected character.
                    </p>
                  </div>
                  {isLoadingVersion ? (
                    <span className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                      Loading
                    </span>
                  ) : null}
                </div>

                <div className="mt-5 space-y-3">
                  {history.length === 0 ? (
                    <p className="text-sm text-[var(--muted)]">No prompt versions yet.</p>
                  ) : (
                    history.map((version) => (
                      <button
                        className={`w-full rounded-2xl border px-4 py-3 text-left text-sm ${
                          selectedVersion?.id === version.id
                            ? "border-[var(--accent)] bg-[#f6f1e8]"
                            : "border-[var(--border)] bg-white"
                        }`}
                        key={version.id}
                        onClick={() => void handleSelectVersion(version.id)}
                        type="button"
                      >
                        <p className="font-medium">
                          {version.variantKey} / {version.strategy}
                        </p>
                        <p className="mt-1 text-[var(--muted)]">{version.createdAt}</p>
                      </button>
                    ))
                  )}
                </div>
              </article>

              {compileResult ? (
                <article className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
                  <h2 className="text-xl font-semibold">Current Compile Result</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {compileResult.character.code} / {compileResult.character.name} in{" "}
                    {compileResult.universe.code}
                  </p>
                  <div className="mt-4 space-y-3">
                    {compileResult.variants.map((variant) => (
                      <button
                        className={`w-full rounded-2xl border px-4 py-3 text-left text-sm ${
                          selectedVersion?.id === variant.id
                            ? "border-[var(--accent)] bg-[#f6f1e8]"
                            : "border-[var(--border)] bg-white"
                        }`}
                        key={variant.id}
                        onClick={() => setSelectedVersion(variant)}
                        type="button"
                      >
                        <p className="font-medium">
                          {variant.variantKey} / {variant.strategy}
                        </p>
                        <p className="mt-1 text-[var(--muted)]">
                          Negative prompt length: {variant.compiledNegativePrompt.length}
                        </p>
                      </button>
                    ))}
                  </div>
                </article>
              ) : null}
            </section>
          </section>

          {selectedVersion ? (
            <section className="grid gap-4 xl:grid-cols-2">
              <PromptTextCard
                title={`${selectedVersion.variantKey} Prompt`}
                value={selectedVersion.compiledPrompt}
              />
              <PromptTextCard
                title={`${selectedVersion.variantKey} Negative Prompt`}
                value={selectedVersion.compiledNegativePrompt}
              />
              <JsonCard title="Prompt Patch" value={selectedVersion.patch ?? null} />
              <JsonCard
                title="Resolved Task Prompt"
                value={selectedVersion.debugPayload.resolvedTaskPrompt}
              />
              <JsonCard
                title="Debug Sections"
                value={selectedVersion.debugPayload.sections}
              />
              <JsonCard title="Debug Payload" value={selectedVersion.debugPayload} />
            </section>
          ) : null}
        </>
      ) : null}
    </PageFrame>
  );
}

function PromptFieldGrid({
  fields
}: {
  fields: Array<{
    label: string;
    value: string;
    onChange: (value: string) => void;
  }>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {fields.map((field) => (
        <label className="block space-y-2 text-sm" key={field.label}>
          <span className="font-medium text-slate-700">{field.label}</span>
          <input
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
            onChange={(event) => field.onChange(event.target.value)}
            value={field.value}
          />
        </label>
      ))}
    </div>
  );
}

function LinesField({
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
      <textarea
        className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        value={value}
      />
      <span className="text-xs text-[var(--muted)]">One rule per line.</span>
    </label>
  );
}

function PromptTextCard({
  title,
  value
}: {
  title: string;
  value: string;
}) {
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
        {title}
      </h3>
      <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-2xl bg-[#f6f1e8] p-4 text-sm leading-6 text-slate-700">
        {value}
      </pre>
    </section>
  );
}
