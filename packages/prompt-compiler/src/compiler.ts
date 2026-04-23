import {
  hasPromptPatchContent,
  serializePromptPatch,
  type CharacterRecord,
  type PromptDebugPayload,
  type PromptPatch,
  type TaskPrompt,
  type UniverseRecord,
  type VariantStrategy
} from "@character-factory/core";

export interface CompilePromptInput {
  universe: UniverseRecord;
  character: CharacterRecord;
  taskPrompt: TaskPrompt;
  strategy: VariantStrategy;
  variantKey: string;
  patch?: PromptPatch | null;
}

export interface CompiledPromptVariant {
  variantKey: string;
  strategy: VariantStrategy;
  compiledPrompt: string;
  compiledNegativePrompt: string;
  patch: PromptPatch | null;
  debugPayload: PromptDebugPayload;
}

export interface BuildVariantPromptsInput {
  universe: UniverseRecord;
  character: CharacterRecord;
  taskPrompt: TaskPrompt;
  strategies: readonly VariantStrategy[];
  patch?: PromptPatch | null;
}

const strategyInstructions: Record<VariantStrategy, string[]> = {
  ratio_boost: [
    "strengthen the exact 4-head proportion read",
    "keep the torso compact and the legs short and structured",
    "avoid fashion-model limb elongation"
  ],
  style_lock: [
    "lock the scene into the same visual language as the universe master style",
    "keep lineart clean, cel shading controlled, and highlights restrained",
    "maintain a light, plain review-friendly background"
  ],
  pose_clarity: [
    "make the action read at first glance",
    "keep the held prop, body weight, and eye-line direction explicit",
    "prioritize a clear full-body silhouette and unambiguous pose"
  ]
};

function appendListLine(
  lines: string[],
  label: string,
  values: string[]
): void {
  if (values.length === 0) {
    return;
  }

  lines.push(`${label}: ${values.join(", ")}`);
}

function splitTemplateText(value: string): string[] {
  return [...new Set(value.split(/[\r\n,;]+/).map((item) => item.trim()).filter(Boolean))];
}

function buildUniverseLines(universe: UniverseRecord): string[] {
  const lines = splitTemplateText(universe.globalPromptTemplate);

  appendListLine(
    lines,
    "proportion rules",
    universe.styleConstitution.proportionRules
  );
  appendListLine(lines, "style keywords", universe.styleConstitution.styleKeywords);
  appendListLine(
    lines,
    "rendering rules",
    universe.styleConstitution.renderingRules
  );
  appendListLine(
    lines,
    "background rules",
    universe.styleConstitution.backgroundRules
  );
  appendListLine(lines, "sheet rules", universe.styleConstitution.sheetRules);

  return lines;
}

function buildCharacterLines(character: CharacterRecord): string[] {
  const lines = [
    `${character.code} / ${character.name}`,
    character.description
  ].filter(Boolean);

  if (character.fixedTraits.rolePersona) {
    lines.push(`role persona: ${character.fixedTraits.rolePersona}`);
  }

  appendListLine(
    lines,
    "identity keywords",
    character.fixedTraits.identityKeywords
  );

  if (character.fixedTraits.visualSilhouette) {
    lines.push(`visual silhouette: ${character.fixedTraits.visualSilhouette}`);
  }

  if (character.fixedTraits.hairstyle) {
    lines.push(`hairstyle: ${character.fixedTraits.hairstyle}`);
  }

  appendListLine(lines, "outfit rules", character.fixedTraits.outfitRules);
  appendListLine(lines, "iconic props", character.fixedTraits.iconicProps);
  appendListLine(lines, "optional props", character.semiFixedTraits.optionalProps);
  appendListLine(
    lines,
    "expression range",
    character.semiFixedTraits.expressionRange
  );
  appendListLine(lines, "pose range", character.semiFixedTraits.poseRange);
  appendListLine(
    lines,
    "outfit variants",
    character.semiFixedTraits.outfitVariants
  );
  appendListLine(
    lines,
    "composition hints",
    character.semiFixedTraits.compositionHints
  );
  appendListLine(lines, "primary palette", character.palette.primary);
  appendListLine(lines, "secondary palette", character.palette.secondary);
  appendListLine(lines, "accent palette", character.palette.accent);

  return lines;
}

function buildTaskLines(taskPrompt: TaskPrompt): string[] {
  const lines: string[] = [];

  if (taskPrompt.action) {
    lines.push(`action: ${taskPrompt.action}`);
  }

  if (taskPrompt.expression) {
    lines.push(`expression: ${taskPrompt.expression}`);
  }

  if (taskPrompt.prop) {
    lines.push(`prop: ${taskPrompt.prop}`);
  }

  if (taskPrompt.view) {
    lines.push(`view: ${taskPrompt.view}`);
  }

  if (taskPrompt.pose) {
    lines.push(`pose: ${taskPrompt.pose}`);
  }

  if (taskPrompt.composition) {
    lines.push(`composition: ${taskPrompt.composition}`);
  }

  return lines.length > 0 ? lines : ["no additional task override"];
}

function buildVariantLines(
  strategy: VariantStrategy,
  taskPrompt: TaskPrompt
): string[] {
  const lines = [...strategyInstructions[strategy]];

  if (strategy === "pose_clarity") {
    if (taskPrompt.action) {
      lines.push(`show the action clearly: ${taskPrompt.action}`);
    }

    if (taskPrompt.view) {
      lines.push(`camera and view should stay explicit: ${taskPrompt.view}`);
    }

    if (taskPrompt.pose) {
      lines.push(`body pose emphasis: ${taskPrompt.pose}`);
    }
  }

  return lines;
}

function buildPatchLines(patch: PromptPatch): string[] {
  const lines: string[] = [];

  appendListLine(lines, "preserve", patch.preserve);
  appendListLine(lines, "strengthen", patch.strengthen);
  appendListLine(lines, "suppress", patch.suppress);
  appendListLine(lines, "append", patch.append);
  appendListLine(lines, "remove", patch.remove);

  return lines;
}

function buildOutputLines(universe: UniverseRecord): string[] {
  const lines = [
    "2D anime character sheet presentation",
    "single-character full-body readability",
    "clean silhouette for design review"
  ];

  appendListLine(lines, "sheet discipline", universe.styleConstitution.sheetRules);

  return lines;
}

function buildNegativeLines(
  universe: UniverseRecord,
  character: CharacterRecord,
  patch: PromptPatch
): string[] {
  const lines = [
    ...splitTemplateText(universe.globalNegativeTemplate),
    ...character.negativeRules.anatomy,
    ...character.negativeRules.style,
    ...character.negativeRules.props,
    ...character.negativeRules.composition,
    ...patch.suppress,
    ...patch.remove
  ];

  return [...new Set(lines.map((item) => item.trim()).filter(Boolean))];
}

function formatSection(title: string, lines: string[]): string {
  return `[${title}]\n${lines.map((line) => `- ${line}`).join("\n")}`;
}

export function applyPromptPatch(
  compiledPrompt: string,
  patch: PromptPatch | null | undefined
): string {
  const normalizedPatch = serializePromptPatch(patch);

  if (!hasPromptPatchContent(normalizedPatch)) {
    return compiledPrompt;
  }

  return `${compiledPrompt}\n\n${formatSection("PATCH", buildPatchLines(normalizedPatch))}`;
}

export function compilePrompt(input: CompilePromptInput): CompiledPromptVariant {
  const normalizedPatch = serializePromptPatch(input.patch);
  const universeLines = buildUniverseLines(input.universe);
  const characterLines = buildCharacterLines(input.character);
  const taskLines = buildTaskLines(input.taskPrompt);
  const variantLines = buildVariantLines(input.strategy, input.taskPrompt);
  const patchLines = buildPatchLines(normalizedPatch);
  const outputLines = buildOutputLines(input.universe);
  const negativeLines = buildNegativeLines(
    input.universe,
    input.character,
    normalizedPatch
  );

  const basePrompt = [
    formatSection("UNIVERSE", universeLines),
    formatSection("CHARACTER", characterLines),
    formatSection("TASK", taskLines),
    formatSection("VARIANT", variantLines),
    formatSection("OUTPUT", outputLines)
  ].join("\n\n");

  return {
    variantKey: input.variantKey,
    strategy: input.strategy,
    compiledPrompt: applyPromptPatch(basePrompt, normalizedPatch),
    compiledNegativePrompt: negativeLines.join(", "),
    patch: hasPromptPatchContent(normalizedPatch) ? normalizedPatch : null,
    debugPayload: {
      variantKey: input.variantKey,
      strategy: input.strategy,
      templateConfig: {
        globalPromptTemplate: input.universe.globalPromptTemplate,
        globalNegativeTemplate: input.universe.globalNegativeTemplate
      },
      resolvedTaskPrompt: input.taskPrompt,
      normalizedPatch,
      sections: {
        universe: universeLines,
        character: characterLines,
        task: taskLines,
        variant: variantLines,
        patch: patchLines,
        output: outputLines,
        negative: negativeLines
      }
    }
  };
}

export function buildVariantPrompts(
  input: BuildVariantPromptsInput
): CompiledPromptVariant[] {
  return input.strategies.map((strategy, index) =>
    compilePrompt({
      universe: input.universe,
      character: input.character,
      taskPrompt: input.taskPrompt,
      strategy,
      variantKey: `${index + 1}-${strategy}`,
      patch: input.patch
    })
  );
}
