import { parseEntityId } from "../service-input";
import { createValidationError, mapDatabaseError } from "../service-error";
import { insertGeneratedImageRows } from "../repositories/generated-image-repository";
import { updateGenerationJobStatus } from "../repositories/job-repository";
import { getJobDetail } from "./job-service";

function strategyPalette(strategy: string) {
  if (strategy === "ratio_boost") {
    return {
      start: "#f59e0b",
      end: "#f97316"
    };
  }

  if (strategy === "style_lock") {
    return {
      start: "#0f766e",
      end: "#14b8a6"
    };
  }

  return {
    start: "#2563eb",
    end: "#60a5fa"
  };
}

function buildPlaceholderImageDataUri(input: {
  title: string;
  subtitle: string;
  detail: string;
  width: number;
  height: number;
  strategy: string;
}): string {
  const palette = strategyPalette(input.strategy);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${input.width}" height="${input.height}" viewBox="0 0 ${input.width} ${input.height}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${palette.start}" />
          <stop offset="100%" stop-color="${palette.end}" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" rx="32" fill="url(#bg)" />
      <rect x="28" y="28" width="${input.width - 56}" height="${input.height - 56}" rx="28" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.28)" />
      <text x="44" y="74" fill="white" font-size="28" font-family="Arial, sans-serif" font-weight="700">${input.title}</text>
      <text x="44" y="116" fill="rgba(255,255,255,0.92)" font-size="18" font-family="Arial, sans-serif">${input.subtitle}</text>
      <text x="44" y="${input.height - 84}" fill="rgba(255,255,255,0.88)" font-size="20" font-family="Arial, sans-serif">${input.detail}</text>
      <circle cx="${input.width - 72}" cy="72" r="26" fill="rgba(255,255,255,0.22)" />
    </svg>
  `.replace(/\s{2,}/g, " ").trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export async function generateExploreCandidates(
  id: string
): Promise<Awaited<ReturnType<typeof getJobDetail>>> {
  const jobId = parseEntityId(id);
  const job = await getJobDetail(jobId);

  if (job.mode !== "explore") {
    throw createValidationError("Only explore jobs can generate explore candidates.");
  }

  if (job.generatedImages.length > 0) {
    return job;
  }

  const promptVariants = job.promptVariants;

  if (promptVariants.length === 0) {
    throw createValidationError(
      "Prompt variants must exist before generating explore candidates."
    );
  }

  await updateGenerationJobStatus(jobId, "running");

  try {
    const rows = promptVariants.flatMap((variant) =>
      Array.from({ length: job.inputConfig.imagesPerVariant }, (_value, index) => {
        const candidateNumber = index + 1;
        const title = `${job.character.code} ${variant.variantKey}`;
        const subtitle = `Candidate ${candidateNumber} / ${variant.strategy}`;
        const detail = `${job.inputConfig.size} • ${job.inputConfig.quality}`;

        return {
          jobId,
          promptVersionId: variant.id,
          sourceApi: "placeholder",
          modelName: "explore-placeholder-v1",
          imageUrl: buildPlaceholderImageDataUri({
            title,
            subtitle,
            detail,
            width: 1024,
            height: 1280,
            strategy: variant.strategy
          }),
          thumbUrl: buildPlaceholderImageDataUri({
            title,
            subtitle,
            detail,
            width: 512,
            height: 640,
            strategy: variant.strategy
          }),
          revisedPrompt: variant.compiledPrompt,
          generationMetaJson: {
            placeholder: true,
            variantKey: variant.variantKey,
            candidateNumber,
            size: job.inputConfig.size,
            quality: job.inputConfig.quality
          },
          status: "created" as const
        };
      })
    );

    await insertGeneratedImageRows(rows);
    await updateGenerationJobStatus(jobId, "completed");

    return await getJobDetail(jobId);
  } catch (error) {
    await updateGenerationJobStatus(jobId, "failed");

    if (error instanceof Error && error.name === "ServiceError") {
      throw error;
    }

    throw mapDatabaseError(error);
  }
}
