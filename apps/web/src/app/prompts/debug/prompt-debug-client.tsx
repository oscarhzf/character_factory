"use client";

import { useEffect, useState } from "react";
import type {
  CharacterListItem,
  PromptCompileResult,
  PromptPatch,
  PromptTemplateConfig,
  PromptVersionRecord,
  UniverseRecord,
  VariantStrategy
} from "@character-factory/core";
import { variantStrategyValues } from "@character-factory/core";

import { JsonCard } from "@/components/json-card";
import { PageFrame } from "@/components/page-frame";
import { requestApi } from "@/lib/api-client";

interface PromptDebugFormState {
  characterId: string;
  globalPromptTemplate: string;
  globalNegativeTemplate: string;
  parentPromptVersionId: string;
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

function arrayToLines(value: string[] | undefined) {
  return (value ?? []).join("\n");
}

function hasPatchContent(patch: PromptPatch | null | undefined) {
  if (!patch) {
    return false;
  }

  return Object.values(patch).some((value) => value.length > 0);
}

function hasTemplateSnapshot(templateConfig: PromptTemplateConfig | undefined) {
  if (!templateConfig) {
    return false;
  }

  return Boolean(
    templateConfig.globalPromptTemplate.trim() ||
      templateConfig.globalNegativeTemplate.trim()
  );
}

function findCharacter(
  characters: CharacterListItem[],
  selectedCharacterId?: string
) {
  return (
    characters.find((item) => item.id === selectedCharacterId) ?? characters[0] ?? null
  );
}

function findUniverseForCharacter(
  universes: UniverseRecord[],
  character: CharacterListItem | null
) {
  if (!character) {
    return null;
  }

  return universes.find((item) => item.id === character.universe.id) ?? null;
}

function createInitialForm(
  characters: CharacterListItem[],
  universes: UniverseRecord[],
  selectedCharacterId?: string
): PromptDebugFormState {
  const character = findCharacter(characters, selectedCharacterId);
  const universe = findUniverseForCharacter(universes, character);

  return {
    characterId: character?.id ?? "",
    globalPromptTemplate: universe?.globalPromptTemplate ?? "",
    globalNegativeTemplate: universe?.globalNegativeTemplate ?? "",
    parentPromptVersionId: "",
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

function findVersionById(
  versionId: string,
  sources: Array<PromptVersionRecord | null | undefined>
) {
  return sources.find((item) => item?.id === versionId) ?? null;
}

export function PromptDebugClient() {
  const [characters, setCharacters] = useState<CharacterListItem[]>([]);
  const [universes, setUniverses] = useState<UniverseRecord[]>([]);
  const [form, setForm] = useState<PromptDebugFormState>(() =>
    createInitialForm([], [])
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

  const selectedCharacter = findCharacter(characters, form.characterId);
  const selectedUniverse = findUniverseForCharacter(universes, selectedCharacter);
  const parentVersion = findVersionById(form.parentPromptVersionId, [
    selectedVersion,
    ...(compileResult?.variants ?? []),
    ...history
  ]);

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
        const [characterData, universeData] = await Promise.all([
          requestApi<CharacterListItem[]>("/api/characters"),
          requestApi<UniverseRecord[]>("/api/universes")
        ]);

        if (cancelled) {
          return;
        }

        setCharacters(characterData);
        setUniverses(universeData);

        const nextForm = createInitialForm(characterData, universeData);
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

        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load prompt debugger."
        );
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
    setForm(createInitialForm(characters, universes, characterId));
    setCompileResult(null);
    setSelectedVersion(null);
    setErrorMessage(null);

    try {
      await refreshHistory(characterId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load prompt history.");
    }
  }

  function handleUseAsParent(version: PromptVersionRecord) {
    setForm((current) => ({
      ...current,
      parentPromptVersionId: version.id
    }));
  }

  function handleClearParent() {
    setForm((current) => ({
      ...current,
      parentPromptVersionId: ""
    }));
  }

  function handleResetTemplateConfig() {
    if (!selectedUniverse) {
      return;
    }

    setForm((current) => ({
      ...current,
      globalPromptTemplate: selectedUniverse.globalPromptTemplate,
      globalNegativeTemplate: selectedUniverse.globalNegativeTemplate
    }));
  }

  function handleReplayPatch(version: PromptVersionRecord) {
    setForm((current) => {
      const nextState: PromptDebugFormState = {
        ...current,
        parentPromptVersionId: version.id,
        preserve: arrayToLines(version.patch?.preserve),
        strengthen: arrayToLines(version.patch?.strengthen),
        suppress: arrayToLines(version.patch?.suppress),
        append: arrayToLines(version.patch?.append),
        remove: arrayToLines(version.patch?.remove)
      };

      if (hasTemplateSnapshot(version.debugPayload.templateConfig)) {
        nextState.globalPromptTemplate =
          version.debugPayload.templateConfig.globalPromptTemplate;
        nextState.globalNegativeTemplate =
          version.debugPayload.templateConfig.globalNegativeTemplate;
      }

      return nextState;
    });
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
          parentPromptVersionId: form.parentPromptVersionId || undefined,
          scope: "debug",
          templateConfig: {
            globalPromptTemplate: form.globalPromptTemplate,
            globalNegativeTemplate: form.globalNegativeTemplate
          },
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
      description="Sprint 2 的调试页用于验证模板配置、结构化编译、父版本链路与 patch 回放。这里的模板覆盖只作用于当前调试编译，不会直接改动 Universe 配置。"
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
            Create a Universe and Character first, then come back here to compile
            prompt variants.
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
                  调试页会把任务字段、模板覆盖、父版本和 patch 一起送进编译链路。Patch
                  字段使用每行一条规则的输入方式。
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
                  <p className="mt-2 text-[var(--muted)]">
                    Template source: {selectedUniverse?.code || "-"} /{" "}
                    {selectedUniverse?.name || "-"}
                  </p>
                </div>
              ) : null}

              <section className="space-y-4 rounded-3xl border border-[var(--border)] bg-[#fcfaf4] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                      Prompt Template Config
                    </h3>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      这里的模板覆盖只用于当前调试请求。需要永久修改时，仍然去 Universe
                      管理页编辑。
                    </p>
                  </div>
                  <button
                    className="rounded-full border border-[var(--border)] px-4 py-2 text-sm"
                    onClick={handleResetTemplateConfig}
                    type="button"
                  >
                    Reset to Universe
                  </button>
                </div>

                <LinesField
                  label="Global Prompt Template"
                  value={form.globalPromptTemplate}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, globalPromptTemplate: value }))
                  }
                />
                <LinesField
                  label="Global Negative Template"
                  value={form.globalNegativeTemplate}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      globalNegativeTemplate: value
                    }))
                  }
                />
              </section>

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
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                      Parent Version
                    </h3>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      从右侧历史版本选择父版本后，会写入 `parent_prompt_version_id`。使用
                      Replay Patch 时也会自动绑定该版本。
                    </p>
                  </div>
                  {form.parentPromptVersionId ? (
                    <button
                      className="rounded-full border border-[var(--border)] px-4 py-2 text-sm"
                      onClick={handleClearParent}
                      type="button"
                    >
                      Clear Parent
                    </button>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-4 text-sm text-slate-700">
                  {parentVersion ? (
                    <>
                      <p className="font-medium">
                        {parentVersion.variantKey} / {parentVersion.strategy}
                      </p>
                      <p className="mt-2 text-[var(--muted)]">{parentVersion.id}</p>
                      <p className="mt-2 text-[var(--muted)]">
                        Created at {parentVersion.createdAt}
                      </p>
                    </>
                  ) : (
                    <p className="text-[var(--muted)]">
                      No parent version selected for the next compile.
                    </p>
                  )}
                </div>
              </section>

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
                {isCompiling
                  ? "Compiling..."
                  : `Compile ${form.strategies.length} Variant${
                      form.strategies.length > 1 ? "s" : ""
                    }`}
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
                      <VersionActionCard
                        isActive={selectedVersion?.id === version.id}
                        isParent={form.parentPromptVersionId === version.id}
                        key={version.id}
                        onReplayPatch={() => handleReplayPatch(version)}
                        onSelect={() => void handleSelectVersion(version.id)}
                        onUseAsParent={() => handleUseAsParent(version)}
                        version={version}
                      />
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
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Template snapshot is stored with each variant for later replay.
                  </p>
                  <div className="mt-4 space-y-3">
                    {compileResult.variants.map((variant) => (
                      <VersionActionCard
                        isActive={selectedVersion?.id === variant.id}
                        isParent={form.parentPromptVersionId === variant.id}
                        key={variant.id}
                        onReplayPatch={() => handleReplayPatch(variant)}
                        onSelect={() => setSelectedVersion(variant)}
                        onUseAsParent={() => handleUseAsParent(variant)}
                        version={variant}
                      />
                    ))}
                  </div>
                </article>
              ) : null}
            </section>
          </section>

          {selectedVersion ? (
            <section className="grid gap-4 xl:grid-cols-2">
              <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Version Chain
                </h3>
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <p>
                    <span className="font-medium">Version ID:</span> {selectedVersion.id}
                  </p>
                  <p>
                    <span className="font-medium">Scope:</span> {selectedVersion.scope}
                  </p>
                  <p>
                    <span className="font-medium">Parent:</span>{" "}
                    {selectedVersion.parentPromptVersionId ?? "root version"}
                  </p>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    className="rounded-full border border-[var(--border)] px-4 py-2 text-sm"
                    onClick={() => handleUseAsParent(selectedVersion)}
                    type="button"
                  >
                    Use as Parent
                  </button>
                  <button
                    className="rounded-full border border-[var(--border)] px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={!hasPatchContent(selectedVersion.patch)}
                    onClick={() => handleReplayPatch(selectedVersion)}
                    type="button"
                  >
                    Replay Patch
                  </button>
                  {selectedVersion.parentPromptVersionId ? (
                    <button
                      className="rounded-full border border-[var(--border)] px-4 py-2 text-sm"
                      onClick={() =>
                        void handleSelectVersion(selectedVersion.parentPromptVersionId!)
                      }
                      type="button"
                    >
                      Load Parent Version
                    </button>
                  ) : null}
                </div>
              </section>

              <JsonCard
                title="Template Config Snapshot"
                value={selectedVersion.debugPayload.templateConfig}
              />
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

function VersionActionCard({
  version,
  isActive,
  isParent,
  onSelect,
  onUseAsParent,
  onReplayPatch
}: {
  version: PromptVersionRecord;
  isActive: boolean;
  isParent: boolean;
  onSelect: () => void;
  onUseAsParent: () => void;
  onReplayPatch: () => void;
}) {
  return (
    <article
      className={`rounded-2xl border px-4 py-3 text-sm ${
        isActive ? "border-[var(--accent)] bg-[#f6f1e8]" : "border-[var(--border)] bg-white"
      }`}
    >
      <button className="w-full text-left" onClick={onSelect} type="button">
        <p className="font-medium">
          {version.variantKey} / {version.strategy}
        </p>
        <p className="mt-1 text-[var(--muted)]">{version.createdAt}</p>
        {isParent ? (
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
            Current parent
          </p>
        ) : null}
      </button>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs"
          onClick={onUseAsParent}
          type="button"
        >
          Use as parent
        </button>
        <button
          className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!hasPatchContent(version.patch)}
          onClick={onReplayPatch}
          type="button"
        >
          Replay patch
        </button>
      </div>
    </article>
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
