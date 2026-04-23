import {
  reviewFailureTagSchema,
  serializeImageReview,
  type ImageReview,
  type ReviewFailureTag,
  type TaskPrompt,
  type VariantStrategy
} from "@character-factory/core";

export interface ReviewCandidateInput {
  characterCode: string;
  variantKey: string;
  strategy: VariantStrategy;
  candidateNumber: number;
  taskPrompt: TaskPrompt;
}

const strategyBaseScores: Record<
  VariantStrategy,
  {
    styleUnity: number;
    characterIdentity: number;
    ratioAccuracy: number;
    posePropMatch: number;
    paletteMatch: number;
    sheetIntegrity: number;
    masterPotential: number;
  }
> = {
  ratio_boost: {
    styleUnity: 21,
    characterIdentity: 16,
    ratioAccuracy: 18,
    posePropMatch: 7,
    paletteMatch: 8,
    sheetIntegrity: 9,
    masterPotential: 4
  },
  style_lock: {
    styleUnity: 24,
    characterIdentity: 17,
    ratioAccuracy: 15,
    posePropMatch: 7,
    paletteMatch: 10,
    sheetIntegrity: 9,
    masterPotential: 4
  },
  pose_clarity: {
    styleUnity: 21,
    characterIdentity: 16,
    ratioAccuracy: 14,
    posePropMatch: 9,
    paletteMatch: 8,
    sheetIntegrity: 8,
    masterPotential: 3
  }
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function createCandidateOffset(candidateNumber: number): {
  quality: number;
  polish: number;
} {
  const normalizedIndex = clamp(candidateNumber, 1, 8);

  return {
    quality: 5 - normalizedIndex * 2,
    polish: 3 - normalizedIndex
  };
}

function scoreCandidate(input: ReviewCandidateInput) {
  const base = strategyBaseScores[input.strategy];
  const offset = createCandidateOffset(input.candidateNumber);
  const hasExpression = input.taskPrompt.expression.trim().length > 0;
  const hasProp = input.taskPrompt.prop.trim().length > 0;
  const hasPose = input.taskPrompt.pose.trim().length > 0;

  const dimensionScores = {
    styleUnity: clamp(base.styleUnity + offset.polish, 0, 25),
    characterIdentity: clamp(base.characterIdentity + offset.polish, 0, 20),
    ratioAccuracy: clamp(
      base.ratioAccuracy +
        (input.strategy === "ratio_boost" ? offset.quality : Math.floor(offset.quality / 2)),
      0,
      20
    ),
    posePropMatch: clamp(
      base.posePropMatch +
        (hasPose ? 1 : 0) +
        (hasProp ? 1 : 0) +
        (input.strategy === "pose_clarity" ? offset.quality : Math.floor(offset.polish / 2)),
      0,
      10
    ),
    paletteMatch: clamp(base.paletteMatch + Math.floor(offset.polish / 2), 0, 10),
    sheetIntegrity: clamp(base.sheetIntegrity + Math.floor(offset.polish / 2), 0, 10),
    masterPotential: clamp(
      base.masterPotential + (offset.quality >= 1 ? 1 : 0) + (hasExpression ? 1 : 0),
      0,
      5
    )
  };

  const totalScore = Object.values(dimensionScores).reduce(
    (sum, value) => sum + value,
    0
  );

  return {
    dimensionScores,
    totalScore
  };
}

function deriveFailureTags(
  input: ReviewCandidateInput,
  scores: ReturnType<typeof scoreCandidate>["dimensionScores"]
): ReviewFailureTag[] {
  const tags = new Set<ReviewFailureTag>();

  if (scores.styleUnity < 21) {
    tags.add("style_drift");
  }

  if (scores.characterIdentity < 15) {
    tags.add("identity_not_distinct");
  }

  if (scores.ratioAccuracy < 16) {
    tags.add(
      input.strategy === "ratio_boost"
        ? "head_too_small"
        : input.candidateNumber % 2 === 0
          ? "legs_too_long"
          : "ratio_too_tall"
    );
  }

  if (scores.posePropMatch < 8) {
    tags.add(input.taskPrompt.prop.trim() ? "prop_missing" : "expression_weak");
  }

  if (scores.paletteMatch < 8) {
    tags.add("palette_off");
  }

  if (scores.sheetIntegrity < 8) {
    tags.add("sheet_format_broken");
  }

  return [...tags].slice(0, 5).map((tag) => reviewFailureTagSchema.parse(tag));
}

function createFixSuggestions(tags: readonly ReviewFailureTag[]): string[] {
  const suggestions = tags.map((tag) => {
    switch (tag) {
      case "ratio_too_tall":
        return "Compress the torso-to-leg ratio to restore the intended 4-head silhouette.";
      case "legs_too_long":
        return "Shorten the legs and rebalance the body mass around a compact lower body.";
      case "head_too_small":
        return "Scale the head up slightly so the face reads faster in sheet view.";
      case "style_drift":
        return "Reinforce the universe lineart and cel-shading rules so the visual language stays locked.";
      case "palette_off":
        return "Pull the outfit and accent colors back toward the character palette anchors.";
      case "prop_missing":
        return "Clarify the prop silhouette and hand contact so the action reads immediately.";
      case "expression_weak":
        return "Push the facial expression further so the intended mood is readable at a glance.";
      case "sheet_format_broken":
        return "Simplify the layout and background so the image reads as a clean character sheet.";
      case "identity_not_distinct":
        return "Restore the signature silhouette, hairstyle, or iconic accessories that anchor the character identity.";
    }
  });

  return [...new Set(suggestions)];
}

function decideBestUse(totalScore: number, masterPotential: number): ImageReview["bestUse"] {
  if (totalScore >= 88 && masterPotential >= 4) {
    return "candidate_master";
  }

  if (totalScore >= 74) {
    return "refine";
  }

  if (totalScore >= 62) {
    return "keep_for_reference";
  }

  return "discard";
}

export function reviewCandidateImage(input: ReviewCandidateInput): ImageReview {
  const scores = scoreCandidate(input);
  const failureTags = deriveFailureTags(input, scores.dimensionScores);
  const bestUse = decideBestUse(
    scores.totalScore,
    scores.dimensionScores.masterPotential
  );

  return serializeImageReview({
    characterCode: input.characterCode,
    isValidCandidate: scores.totalScore >= 62,
    totalScore: scores.totalScore,
    dimensionScores: scores.dimensionScores,
    failureTags,
    fixSuggestions: createFixSuggestions(failureTags),
    bestUse
  });
}

export function rankReviews<T extends Pick<ImageReview, "totalScore" | "bestUse" | "failureTags">>(
  reviews: readonly T[]
): T[] {
  return [...reviews].sort((left, right) => {
    if (right.totalScore !== left.totalScore) {
      return right.totalScore - left.totalScore;
    }

    if (left.bestUse !== right.bestUse) {
      return left.bestUse.localeCompare(right.bestUse);
    }

    return left.failureTags.length - right.failureTags.length;
  });
}
